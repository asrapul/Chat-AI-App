import fetch from 'node-fetch';

async function testStreamingImage() {
  console.log('🧪 Testing Streaming Image Generation...');
  
  const response = await fetch('http://localhost:3003/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "buatkan gambar astronaut di bulan"
    })
  });

  if (!response.ok) {
    console.error('❌ Request failed:', response.status);
    return;
  }

  // Node-fetch body is a stream
  response.body.on('data', (chunk) => {
    const text = chunk.toString();
    console.log('📥 Received chunk:', text.substring(0, 100));
    if (text.includes('imageUrl')) {
      console.log('✅ SUCCESS: Image URL found in stream!');
    }
  });

  response.body.on('end', () => {
    console.log('🏁 Stream ended.');
  });
}

testStreamingImage();
