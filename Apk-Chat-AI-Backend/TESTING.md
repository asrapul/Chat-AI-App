# 🚀 Quick Start Guide - Testing Your Chat AI App

## Step 1: Start Backend Server

Open a terminal and run:
```bash
cd d:\Coding\ASHARITECH\Apk-Chat-AI-Backend
npm start
```

You should see:
```
🚀 Chat AI Backend running on http://localhost:3000
📡 API endpoint: http://localhost:3000/api/chat
🔑 Gemini API Key: ✅ Loaded
```

## Step 2: Test Backend (Optional)

Open browser to: http://localhost:3000

You should see:
```json
{
  "status": "ok",
  "message": "Chat AI Backend API is running"
}
```

## Step 3: Run Mobile App

Open a **NEW** terminal (keep backend running) and run:
```bash
cd d:\Coding\ASHARITECH\Apk-Chat-AI
npm start
```

Press `a` for Android emulator

## Step 4: Test Chat

1. Open app on emulator
2. Tap "New Chat" → Select any AI model
3. Send message: "Halo! Siapa kamu?"
4. Wait for AI response ✨

## Troubleshooting

### "Cannot connect to server" error:
- Make sure backend is running (Step 1)
- Check if using Android emulator (API URL should be `http://10.0.2.2:3000`)
- For physical device, update `constants/Config.ts` with your computer's IP

### "Module not found" in backend:
```bash
cd d:\Coding\ASHARITECH\Apk-Chat-AI-Backend
npm install
```

## Next Steps

1. ✅ Test different AI models
2. ✅ Record demo video (2-5 mins)
3. 🚀 Deploy backend to Railway
4. 📝 Complete assignment submission

---

**Backend running?** ✅  
**Mobile app working?** Test it now!  
**Need help?** Check [walkthrough.md](file:///C:/Users/LENOVO/.gemini/antigravity/brain/4b30ec4b-5cf1-4300-8452-dad2d50f62e7/walkthrough.md)
