import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = BASE_URL.replace('http', 'ws'); 
const USERNAME = __ENV.USERNAME || 'admin';
const PASSWORD = __ENV.PASSWORD || 'password123';

export const options = {
    scenarios: {
        chat_room: {
            executor: 'per-vu-iterations',
            vus: 5000, 
            iterations: 1,
            maxDuration: '30s',
        },
    },
};

export function setup() {
    // 1. Login to get token
    const loginPayload = JSON.stringify({
        username: USERNAME,
        password: PASSWORD
    });
    const loginRes = http.post(`${BASE_URL}/auth/login/`, loginPayload, {
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (!check(loginRes, { 'login successful': (r) => r.status === 200 })) {
        console.error('Login failed:', loginRes.status, loginRes.body);
        throw new Error('Login failed');
    }
    
    const auth = loginRes.json();
    const token = auth.access;

    // 2. Create a test Room (GROUP)
    const roomPayload = JSON.stringify({
        room_type: 'GROUP',
        members: [] 
    });
    
    const roomRes = http.post(`${BASE_URL}/rooms/`, roomPayload, {
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!check(roomRes, { 'room created': (r) => r.status === 201 || r.status === 200 })) {
        console.error('Room creation failed:', roomRes.status, roomRes.body);
        throw new Error('Room creation failed');
    }
    
    const room = roomRes.json();
    console.log(`Setup: Created/Joined Room ${room.id}`);
    
    return { roomId: room.id, token: token };
}

export default function (data) {
    const roomId = data.roomId;
    const token = data.token;
    const url = `${WS_BASE_URL}/ws/chat/${roomId}/?token=${token}`;
    
    // Unique message for this test run iteration
    const messageText = `Hello from VU 1`;
    
    const isSender = (exec.vu.idInTest === 1);

    const response = ws.connect(url, {}, function (socket) {
        socket.on('open', function open() {
            // console.log(`VU ${exec.vu.idInTest}: Connected`);
            
            if (isSender) {
                // Sender waits for receivers to connect, then sends
                socket.setTimeout(function() {
                    console.log(`VU ${exec.vu.idInTest}: Sending message...`);
                    const payload = JSON.stringify({
                        room: roomId,
                        message: messageText
                    });
                    
                    const res = http.post(`${BASE_URL}/messages/`, payload, {
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    check(res, { 'message sent': (r) => r.status === 202 });
                    socket.close();
                }, 3000); // Wait 3s to ensure everyone is connected
            } 
        });

        socket.on('message', function (message) {
            const msg = JSON.parse(message);
            if (msg.message === messageText) {
                check(msg, { 'received expected message': (m) => m.message === messageText });
                console.log(`VU ${exec.vu.idInTest}: Successfully received broadcast message. Payload: ${msg.message}`);
                socket.close();
            }
        });

        socket.on('error', function (e) {
            console.log(`VU ${exec.vu.idInTest}: Error ${e.error()}`);
        });
        
        // Timeout
        socket.setTimeout(function () {
            if (!isSender) {
                 console.log(`VU ${exec.vu.idInTest}: Timeout waiting for message`);
            }
            socket.close();
        }, 10000);
    });

    check(response, { 'websocket status 101': (r) => r && r.status === 101 });
}
