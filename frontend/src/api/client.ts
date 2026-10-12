import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getConfig } from '../config.ts';
import { useAuthStore } from '../store/authStore.ts';
import type { PaginatedResponse, Room, MessageItem } from '../types.ts';

const config = getConfig();

export const apiClient = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Single-flight refresh token coordination
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers = [];
  useAuthStore.getState().logout();
}

apiClient.interceptors.request.use((reqConfig: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && reqConfig.headers) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on auth endpoints themselves
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login/') || originalRequest.url?.includes('/auth/refresh/');
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Check for 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((newToken: string) => {
            originalRequest._retry = true;
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<{ access: string }>(
          `${config.apiUrl}/auth/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = refreshResponse.data.access;
        useAuthStore.getState().updateAccessToken(newAccessToken);

        onTokenRefreshed(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        onRefreshFailed();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login/', { username, password });
    return response.data;
  },

  getRooms: async (page = 1, signal?: AbortSignal): Promise<PaginatedResponse<Room>> => {
    const response = await apiClient.get<PaginatedResponse<Room>>(`/rooms/?page=${page}`, {
      signal,
    });
    return response.data;
  },

  getRoomMessages: async (
    roomId: string,
    page = 1,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<MessageItem>> => {
    const response = await apiClient.get<PaginatedResponse<MessageItem>>(
      `/rooms/${roomId}/messages/?page=${page}`,
      { signal }
    );
    return response.data;
  },

  sendMessage: async (roomId: string, message: string, signal?: AbortSignal) => {
    const response = await apiClient.post<MessageItem>(
      '/messages/',
      {
        room: roomId,
        message,
      },
      { signal }
    );
    return response;
  },

  createRoom: async (name: string, description?: string, roomType: 'GROUP' | 'DIRECT' = 'GROUP'): Promise<Room> => {
    const response = await apiClient.post<Room>('/rooms/', {
      name,
      description,
      room_type: roomType,
    });
    return response.data;
  },
};
