# Chat AI Backend API

Backend server untuk aplikasi Chat AI Mobile menggunakan Google Gemini API.

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

3. Run development server:
```bash
npm run dev
```

## 📡 API Endpoints

### Health Check
```
GET /
```

Response:
```json
{
  "status": "ok",
  "message": "Chat AI Backend API is running",
  "timestamp": "2026-02-02T11:09:17.000Z",
  "geminiConnected": true
}
```

### Send Chat Message
```
POST /api/chat
```

Request Body:
```json
{
  "message": "Hello, how are you?",
  "history": [
    {
      "role": "user",
      "parts": [{"text": "Previous message"}]
    },
    {
      "role": "model",
      "parts": [{"text": "Previous response"}]
    }
  ],
  "modelId": "gemini-3-pro"
}
```

Response:
```json
{
  "success": true,
  "response": "I'm doing great! How can I help you?",
  "modelId": "gemini-3-pro",
  "timestamp": "2026-02-02T11:09:17.000Z"
}
```

## 🤖 Available Models

- `gpt-5-2` - GPT-5.2 personality
- `gemini-3-pro` - Gemini 3 Pro personality (default)
- `claude-sonnet-4-5` - Claude Sonnet personality
- `grok-4-1` - Grok personality
- `deepseek-v3-2` - DeepSeek personality
- `perplexity` - Perplexity Search personality

## 🌐 Deployment

### Railway
1. Push code to GitHub
2. Connect repository to Railway
3. Add environment variable: `GOOGLE_API_KEY`
4. Deploy automatically

### Render/Vercel
Similar process - connect GitHub and add environment variables.

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google Gemini API Key | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## 🔧 Tech Stack

- **Express.js** - Web framework
- **Google Gemini AI** - AI model
- **CORS** - Cross-origin support for mobile app
- **dotenv** - Environment variables

## 📦 Dependencies

```json
{
  "@google/generative-ai": "^0.24.1",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7",
  "express": "^4.21.2"
}
```
