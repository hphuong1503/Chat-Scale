export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
}

export function getConfig(): AppConfig {
  const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;

  let apiUrl = metaEnv?.VITE_API_URL || metaEnv?.VITE_API_BASE_URL;
  let wsUrl = metaEnv?.VITE_WS_URL || metaEnv?.VITE_WS_BASE_URL;

  if (!apiUrl && typeof window !== 'undefined') {
    apiUrl = window.location.origin;
  }
  if (!apiUrl) {
    apiUrl = 'http://localhost:8000';
  }

  if (!wsUrl && typeof window !== 'undefined') {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${wsProto}//${window.location.host}`;
  }
  if (!wsUrl) {
    wsUrl = 'ws://localhost:8000';
  }

  // Normalize by stripping trailing slash
  apiUrl = apiUrl.replace(/\/+$/, '');
  wsUrl = wsUrl.replace(/\/+$/, '');

  return {
    apiUrl,
    wsUrl,
  };
}
