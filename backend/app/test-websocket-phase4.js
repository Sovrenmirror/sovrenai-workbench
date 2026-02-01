/**
 * Test Phase 4 WebSocket Connection
 */
import WebSocket from 'ws';

const TOKEN = process.argv[2];

if (!TOKEN) {
  console.error('Usage: node test-websocket-phase4.js <token>');
  process.exit(1);
}

console.log('🔗 Connecting to WebSocket server...\n');

const ws = new WebSocket('ws://localhost:3750/ws');

ws.on('open', () => {
  console.log('✅ WebSocket connection established\n');

  // Send authentication
  console.log('🔐 Authenticating...');
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: TOKEN
  }));

  setTimeout(() => {
    // Subscribe to channels
    console.log('📡 Subscribing to channels...');
    ws.send(JSON.stringify({
      type: 'subscribe',
      channels: ['activity', 'events', 'agent.researcher']
    }));
  }, 500);

  setTimeout(() => {
    // Request activity history
    console.log('📜 Requesting activity history...');
    ws.send(JSON.stringify({
      type: 'get_activity',
      payload: { limit: 10 }
    }));
  }, 1000);

  setTimeout(() => {
    // Send ping
    console.log('🏓 Sending ping...');
    ws.send(JSON.stringify({
      type: 'ping'
    }));
  }, 1500);

  setTimeout(() => {
    console.log('\n🎉 All tests complete! Closing connection...');
    ws.close();
    process.exit(0);
  }, 2500);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log(`\n📨 Received: ${message.type}`);
    console.log(JSON.stringify(message, null, 2));
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n🔌 WebSocket connection closed');
});
