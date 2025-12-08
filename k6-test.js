import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const successRate = new Rate("message_creation_success");
const responseDuration = new Trend("message_response_time");
const requestErrors = new Counter("message_errors");

// Configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const USERNAME = __ENV.USERNAME || "admin";
const PASSWORD = __ENV.PASSWORD || "password123";

// Test options for performance testing
export const options = {
  stages: [
    { duration: "5s", target: 10 },    // Ramp-up to 10 users
    { duration: "100s", target: 200 },   // Ramp-up to 50 users
    { duration: "200s", target: 200 },   // Sustain at 50 users
    { duration: "5s", target: 0 },     // Ramp-down
  ],
  thresholds: {
    "http_req_duration": ["p(95)<500", "p(99)<1000", "avg<300"],
    "message_creation_success": ["rate>0.95"],
    "message_errors": ["count<50"],
  },
};

// Test data
const testMessages = [
  "Hello, this is a test message",
  "How are you doing today?",
  "This is a performance test message for the chat application",
  "Testing message creation API with load testing in k6",
  "Load testing the chat application to measure response times",
  "Performance test with multiple concurrent users",
  "Message content for stress testing the backend",
];

// Helper function to authenticate
function login() {
  const loginPayload = JSON.stringify({
    username: USERNAME,
    password: PASSWORD,
  });

  const response = http.post(`${BASE_URL}/auth/login/`, loginPayload, {
    headers: { "Content-Type": "application/json" },
  });

  if (response.status === 200) {
    return JSON.parse(response.body).access;
  }
  throw new Error(`Login failed: ${response.status} - ${response.body}`);
}

// Setup: Run once before the test to create a room
export function setup() {
  const token = login();
  
  // Create a Group Room for testing
  const roomPayload = JSON.stringify({
    name: `Load Test Room ${new Date().getTime()}`,
    description: "Room created by k6 for load testing",
    room_type: "GROUP"
  });

  const res = http.post(`${BASE_URL}/rooms/`, roomPayload, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (res.status !== 201) {
    throw new Error(`Failed to create test room: ${res.status} - ${res.body}`);
  }

  const room = JSON.parse(res.body);
  console.log(`Setup: Created test room ${room.id}`);
  
  return { roomId: room.id, token: token };
}

// Main performance test function
export default function (data) {
  const { roomId, token } = data; // Use data from setup

  try {
    // Send message with random content
    const messagePayload = JSON.stringify({
      message: testMessages[Math.floor(Math.random() * testMessages.length)],
      room: roomId, // Use the UUID from setup
    });

    const params = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    };

    const response = http.post(
      `${BASE_URL}/messages/`,
      messagePayload,
      params
    );

    // Record response time
    responseDuration.add(response.timings.duration);

    // Check response
    const isSuccess = check(response, {
      "status is 202": (r) => r.status === 202,
      "response time < 500ms": (r) => r.timings.duration < 500,
      "response has status field": (r) => r.body.includes("status"),
    });

    successRate.add(isSuccess);
    if (!isSuccess) {
      requestErrors.add(1);
      console.error(`Request failed: ${response.status} - ${response.body}`);
    }
  } catch (error) {
    requestErrors.add(1);
    console.error(`Error during test: ${error}`);
  }

  sleep(Math.random() * 2); // Random sleep between 0-2 seconds
}

// Teardown: Run once after the test to clean up
export function teardown(data) {
  if (data.roomId && data.token) {
    const res = http.del(`${BASE_URL}/rooms/${data.roomId}/`, null, {
      headers: {
        "Authorization": `Bearer ${data.token}`,
      },
    });
    console.log(`Teardown: Deleted test room ${data.roomId} (Status: ${res.status})`);
  }
}
