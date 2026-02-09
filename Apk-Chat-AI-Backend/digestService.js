import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Generate AI digest for a specific topic
 * @param {string} topic - News topic (e.g., "Teknologi", "Bisnis")
 * @param {string} customPrompt - Optional custom prompt from user
 * @returns {Promise<Object>} Digest with content, sources, and metadata
 */
export async function generateDigest(topic, customPrompt = null) {
  try {
    const prompt = customPrompt || 
      `Buatkan ringkasan berita terbaru tentang ${topic} dalam bahasa Indonesia. 
       Berikan 3-5 berita penting dengan format:
       
       🔹 **[Judul Berita]** - [Ringkasan 1-2 kalimat]
       
       Tambahkan juga insight singkat tentang tren yang terlihat dari berita-berita tersebut.
       
       Catatan: Gunakan informasi pengetahuan terkini untuk memberikan berita yang relevan.`;
    
    console.log(`📰 Generating digest for topic: ${topic}`);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    // Create digest object
    const digest = {
      id: `digest-${Date.now()}`,
      topic,
      content,
      sources: [], // Sources will be empty without grounding, but structure remains
      generatedAt: new Date().toISOString(),
      customPrompt: customPrompt || null,
    };
    
    console.log(`✅ Digest generated successfully (${content.length} chars)`);
    return digest;
    
  } catch (error) {
    console.error('❌ Failed to generate digest:', error.message);
    console.error('Error details:', error);
    throw new Error(`Digest generation failed: ${error.message}`);
  }
}

/**
 * Test digest generation (for manual testing)
 */
export async function testDigestGeneration() {
  console.log('\n🧪 Testing Digest Generation...\n');
  
  const topics = ['Teknologi', 'Bisnis', 'Olahraga'];
  
  for (const topic of topics) {
    try {
      const digest = await generateDigest(topic);
      console.log(`\n📰 ${topic} Digest:`);
      console.log('─'.repeat(50));
      console.log(digest.content);
      console.log('─'.repeat(50));
      console.log(`ID: ${digest.id}`);
      console.log('');
    } catch (error) {
      console.error(`Failed for ${topic}:`, error.message);
    }
  }
}

// Allow running this file directly for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  testDigestGeneration();
}
