import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

async function verifyHF() {
  const token = process.env.HUGGINGFACE_TOKEN;
  console.log('🧪 Verifying HF Token:', token ? 'Present' : 'Missing');
  
  if (!token) return;

  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: "a cute cat" }),
      }
    );

    console.log('Response Status:', response.status);
    if (!response.ok) {
      console.error('Error:', await response.text());
    } else {
      console.log('✅ HF Token works! (Image data received)');
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

verifyHF();
