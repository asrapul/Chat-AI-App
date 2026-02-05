import fetch from 'node-fetch';

async function testStreaming() {
  console.log('🧪 Testing Streaming AI Endpoint...');
  try {
    const response = await fetch('http://localhost:3003/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Write a 3 sentence poem about coding.',
        systemInstruction: 'You are a poetic assistant.'
      })
    });
    
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    console.log('📡 Connected to stream. Waiting for chunks...');
    
    response.body.on('data', chunk => {
      const text = chunk.toString();
      console.log('Chunk received:', text.substring(0, 50) + '...');
    });

    response.body.on('end', () => {
      console.log('✅ Stream finished.');
    });

  } catch (error) {
    console.error('❌ Streaming Test Failed:', error.message);
  }
}

testStreaming();
