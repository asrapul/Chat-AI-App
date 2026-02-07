import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 🧠 Gemini Function Calling Tool for Image Generation
const imageGenerationTool = {
  functionDeclarations: [{
    name: "generate_image",
    description: "Generate an image based on a text description. Use this when user asks to create, generate, draw, make, or visualize an image. Examples: 'buatkan gambar kucing', 'generate a sunset', 'create an image of robot'.",
    parameters: {
      type: "OBJECT",
      properties: {
        prompt: {
          type: "STRING",
          description: "Detailed and optimized description of the image to generate. Enhance user's vague descriptions with artistic details. ENGLISH is preferred for better results."
        }
      },
      required: ["prompt"]
    }
  }]
};

// 📝 System Instruction (Crucial for behavior)
const systemInstruction = `
You are Monox AI, a smart assistant with the ability to Generate Images.
- When a user asks to CREATE, DRAW, or GENERATE an image, you MUST use the 'generate_image' tool.
- Do NOT refuse to generate images.
- If the user's prompt is simple (e.g., "draw a cat"), OPTIMIZE it to be descriptive (e.g., "a cute fluffy persian cat sitting on a velvet sofa, warm lighting, realistic style").
- Identify the user's language. If they ask in Indonesian, answer in Indonesian, but keep the image prompt in English for best quality.
`;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chat AI Backend API is running',
    timestamp: new Date().toISOString(),
    geminiConnected: true,
  });
});

/**
 * Generate image using Hugging Face (Prioritized) or Pollinations (Fallback)
 * @param {string} prompt - Image description
 * @param {number} retries - Number of retries on failure
 * @returns {Promise<string>} Base64 data URL
 */
async function generateImage(prompt, retries = 3) {
  // 1. Try Hugging Face if Token exists
  if (process.env.HUGGINGFACE_TOKEN) {
    try {
      console.log('🎨 Generating image with Hugging Face (Flux.1-schnell)...');
      console.log('   Prompt:', prompt.substring(0, 60) + '...');

      const response = await fetch(
        "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!response.ok) {
        throw new Error(`HF Error: ${response.status} ${await response.text()}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      
      console.log('✅ Image generated successfully with Hugging Face!');
      return dataUrl;

    } catch (error) {
      console.error('❌ Hugging Face failed, falling back to Pollinations:', error.message);
      // Fallback proceeds below
    }
  } else {
    console.log('⚠️ No HUGGINGFACE_TOKEN found in .env, using Pollinations as default.');
  }

  // 2. Pollinations AI (Fallback / Default)
  try {
    const safePrompt = prompt.length > 800 ? prompt.substring(0, 800) : prompt;
    const encodedPrompt = encodeURIComponent(safePrompt);
    
    // Use turbo model
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&model=turbo`;
    
    console.log('🎨 Generating image with Pollinations AI...');
    console.log('   Fetch URL:', imageUrl);
    
    const response = await fetch(imageUrl, { method: 'GET' }); // No headers to avoid 502
    
    if (!response.ok) {
        if (retries > 0) {
            console.log(`   Retrying Pollinations... (${retries} left)`);
            await new Promise(r => setTimeout(r, 2000));
            return generateImage(prompt, retries - 1);
        }
        throw new Error(`Pollinations Error: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log('✅ Image generated successfully with Pollinations!');
    return `data:${contentType};base64,${base64}`;
    
  } catch (error) {
    console.error('❌ All image generation methods failed:', error.message);
    throw error;
  }
}

// Chat endpoint with image generation and vision support
// 🚀 New Streaming Endpoint (Bonus)
app.post('/api/chat/stream', async (req, res) => {
  const { message, systemInstruction: customInstruction, imageUri } = req.body;
  
  const modelName = 'gemini-1.5-flash';
  console.log(`📡 Streaming request for ${modelName}`);

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const isImageRequest = /buatkan gambar|generate image|draw|create image|visualize/i.test(message);
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      tools: [imageGenerationTool],
      systemInstruction: customInstruction || systemInstruction,
      toolConfig: isImageRequest ? { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["generate_image"] } } : undefined,
    });

    console.log(`🧠 AI Mode: ${isImageRequest ? 'FORCED IMAGE GEN' : 'AUTO'}`);

    let result;
    if (imageUri) {
      const base64Data = imageUri.replace(/^data:image\/\w+;base64,/, '');
      const imagePart = { inlineData: { data: base64Data, mimeType: 'image/jpeg' } };
      result = await model.generateContentStream([message || 'What is this?', imagePart]);
    } else {
      result = await model.generateContentStream(message);
    }

    let isFunctionCall = false;
    for await (const chunk of result.stream) {
      const calls = chunk.functionCalls();
      if (calls && calls.length > 0) {
        isFunctionCall = true;
        const functionCall = calls[0];
        if (functionCall.name === 'generate_image') {
          const imagePrompt = functionCall.args.prompt;
          console.log(`🎨 Streaming endpoint: Generating image for "${imagePrompt}"...`);
          try {
            const imageUrl = await generateImage(imagePrompt, 1);
            const dataPacket = { 
              text: `Here is your image of "${imagePrompt}"`, 
              imageUrl: imageUrl,
              isImageGeneration: true 
            };
            console.log(`📦 SSE: Sending image packet (${imageUrl.length} chars)`);
            res.write(`data: ${JSON.stringify(dataPacket)}\n\n`);
          } catch (err) {
            res.write(`data: ${JSON.stringify({ error: `Gagal membuat gambar: ${err.message}` })}\n\n`);
          }
        }
        break; // Exit loop after handling function call
      }

      try {
        const chunkText = chunk.text();
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      } catch (e) {
        // Skip if no text (e.g. just function call chunk)
      }
    }
    
    if (!isFunctionCall) {
      res.write('data: [DONE]\n\n');
    } else {
      res.write('data: [DONE]\n\n');
    }
    res.end();
    console.log(`✅ Streaming finished for ${modelName}`);
  } catch (error) {
    console.error('❌ Streaming failed:', error.message);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, history, modelId, conversationId, topic, imageUri, systemInstruction: customInstruction } = req.body;
  
  console.log('📨 Received chat request');
  console.log('   Message:', message?.substring(0, 50));
  
  if (!message && !imageUri) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Message or image is required',
    });
  }

  const modelName = 'gemini-1.5-flash';
  
  try {
    console.log(`🤖 Attempting with model: ${modelName}...`);
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      tools: [imageGenerationTool],
      systemInstruction: customInstruction || systemInstruction,
    });
    
    let result;
    
    if (imageUri) {
      console.log('👁️ Vision request');
      const base64Data = imageUri.replace(/^data:image\/\w+;base64,/, '');
      const imagePart = {
        inlineData: { data: base64Data, mimeType: 'image/jpeg' },
      };
      const prompt = message || 'What do you see in this image?';
      result = await model.generateContent([prompt, imagePart]);
    } else {
      const chat = model.startChat({ history: [] });
      result = await chat.sendMessage(message);
    }
    
    const response = result.response;
    const functionCalls = response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      const functionCall = functionCalls[0];
      if (functionCall.name === 'generate_image') {
        const imagePrompt = functionCall.args.prompt;
        console.log('🎨 Generating image via Pollinations...');
        try {
          const imageUrl = await generateImage(imagePrompt);
          return res.json({
            success: true,
            response: `Here is your image of "${imagePrompt}"`, 
            imageUrl: imageUrl,
            isImageGeneration: true,
            modelId: modelName,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          return res.json({
            success: true,
            response: `Maaf, saya gagal membuat gambar. Error: ${err.message}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
    
    const text = response.text();
    console.log(`✅ Success with ${modelName}`);
    
    return res.json({
      success: true,
      response: text,
      modelId: modelName,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`❌ ${modelName} failed:`, error.message);
    
    const isQuota = error.message?.includes('429') || error.status === 429;
    const isInvalid = error.message?.includes('400') || error.status === 400 || error.message?.includes('API key not valid');

    res.status(isQuota ? 429 : 500).json({
      success: false,
      error: isQuota ? 'Quota Exceeded' : (isInvalid ? 'Invalid API Key' : 'Server Error'),
      message: isQuota 
        ? 'Semua model Gemini (Free Tier) telah mencapai batas. Silakan ganti API Key di file .env.' 
        : (isInvalid ? 'API Key tidak valid atau sudah expired. Mohon ganti di file .env.' : (error.message || 'Failed to process message')),
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Chat AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🔑 Gemini API Key: ${process.env.GOOGLE_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
});
