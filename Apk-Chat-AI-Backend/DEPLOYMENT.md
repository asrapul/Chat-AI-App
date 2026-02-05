# Railway Deployment Guide

## Prerequisites
- GitHub account
- Railway account (sign up at railway.app)

## Steps

### 1. Prepare Repository

```bash
cd d:\Coding\ASHARITECH\Apk-Chat-AI-Backend

# Initialize git
git init
git add .
git commit -m "Initial backend setup with Gemini AI"

# Create GitHub repository (via GitHub website)
# Then connect:
git remote add origin https://github.com/YOUR_USERNAME/chat-ai-backend
git branch -M main
git push -u origin main
```

### 2. Deploy to Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `chat-ai-backend` repository
5. Railway will auto-detect Node.js and deploy

### 3. Add Environment Variables

In Railway dashboard:
1. Go to your project
2. Click "Variables" tab
3. Add variable:
   - **Key**: `GOOGLE_API_KEY`
   - **Value**: `AIzaSyAe8DAbq5_Z_Yc2YVY1A8Y1RPnuJrwGjng`
4. Click "Add" and redeploy

### 4. Get Your Public URL

Railway will provide a public URL like:
```
https://chat-ai-backend-production.up.railway.app
```

### 5. Update Mobile App

Edit `d:\Coding\ASHARITECH\Apk-Chat-AI\constants\Config.ts`:

```typescript
export const API_CONFIG = {
  // ... existing code ...
  
  // Update this line with your Railway URL
  PRODUCTION: 'https://YOUR-APP.railway.app',
  
  BASE_URL: __DEV__ 
    ? 'http://10.0.2.2:3000'
    : 'https://YOUR-APP.railway.app', // Update here too
};
```

### 6. Test Production API

```bash
curl https://YOUR-APP.railway.app/
```

Should return:
```json
{
  "status": "ok",
  "message": "Chat AI Backend API is running"
}
```

### 7. Build Mobile App for Production

```bash
cd d:\Coding\ASHARITECH\Apk-Chat-AI
npm start
```

App will now use production backend URL when built in release mode!

## Alternative: Render.com

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variable: `GOOGLE_API_KEY`
6. Deploy!

## Free Tier Limits

**Railway:**
- $5 free credit/month
- ~500 hours of uptime

**Render:**
- Free tier available
- Spins down after 15 mins of inactivity
- Takes 30-60s to wake up on first request

## Troubleshooting

### "Module not found" on Railway:
- Make sure `package.json` is in root directory
- Check that all dependencies are in `dependencies`, not `devDependencies`

### CORS errors:
- Backend uses `cors()` middleware - should work by default
- Check Railway logs for actual errors

### API key not loaded:
- Verify environment variable name is exactly `GOOGLE_API_KEY`
- Redeploy after adding variables

## Assignment Submission

Once deployed, add these to your assignment:
- ✅ Backend GitHub repository URL
- ✅ Deployed backend URL (Railway/Render)
- ✅ Mobile app GitHub repository URL
- ✅ Demo video link
