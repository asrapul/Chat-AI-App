import fetch from 'node-fetch';

async function finalTest() {
  console.log('🧪 Final Verification (Strictly Gemini 2.5-Flash)...');
  try {
    const response = await fetch('http://localhost:3003/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Reply with "Ready for deployment"',
      })
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('AI Response:', data.response);
    console.log('Model Used:', data.modelId);
  } catch (error) {
    console.error('❌ Final Test Failed:', error.message);
  }
}

finalTest();
