import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";

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
    { duration: "5s", target: 50 },    // Ramp-up to 5 users
    { duration: "15s", target: 200 },   // Ramp-up to 20 users
    { duration: "30s", target: 200 },   // Sustain at 20 users (main performance test)
    { duration: "15s", target: 0 },    // Ramp-down
  ],
  thresholds: {
    "http_req_duration": ["p(95)<500", "p(99)<1000", "avg<300"],
    "message_creation_success": ["rate>0.95"],
    "message_errors": ["count<50"],
  },
};

// Test data - various message lengths for realistic performance testing
const testMessages = [
  "Hello, this is a test message",
  "How are you doing today?",
  "This is a performance test message for the chat application",
  "Testing message creation API with load testing in k6",
  "Load testing the chat application to measure response times",
  "Performance test with multiple concurrent users",
  "Message content for stress testing the backend",
];

// Session cookies storage (per VU)
let accessToken = null;
// Helper function to authenticate and get JWT token
function authenticate() {

  if (accessToken) return accessToken;

  const loginPayload = JSON.stringify({
    username: USERNAME,
    password: PASSWORD,
  });

  const response = http.post(`${BASE_URL}/auth/login/`, loginPayload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 200) {
    const body = JSON.parse(response.body);
    accessToken = body.access;
    console.log(`Authenticated. Access token`); 
    return accessToken;
  }

  console.error(`Login response: ${response.status} - ${response.body}`);
  throw new Error(`Authentication failed: ${response.status}`);
}

// Main performance test function
export default function () {
  try {
    // Authenticate once per VU and reuse JWT token
    const token = authenticate();
    // Send message with random content from test data
    const messagePayload = JSON.stringify({
      message: testMessages[Math.floor(Math.random() * testMessages.length)],
      room_id: Math.floor(Math.random() * 10) + 1, // Random room_id between 1-10
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
