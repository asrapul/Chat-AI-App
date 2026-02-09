## Debug Steps - Digest Generation

Tolong bantu jalankan perintah ini satu per satu dan share hasilnya:

### 1. Check Backend Logs
Lihat terminal yang running `node server.js`, lalu coba trigger digest:

```powershell
Invoke-RestMethod -Uri "http://localhost:3003/api/test-digest" -Method POST -ContentType "application/json" -Body '{"topic": "Teknologi"}'
```

**Copy paste semua output dari backend terminal** (terutama error message yang detail)

### 2. Test Direct API Key
Check apakah API key berfungsi untuk Gemini:

```powershell
# Masuk ke folder backend
cd Apk-Chat-AI-Backend

# Test API key langsung
node -e "import('@google/generative-ai').then(async (m) => { const genAI = new m.GoogleGenerativeAI(process.env.GOOGLE_API_KEY || 'AIzaSyAe8DAbq5_Z_Yc2YVY1A8Y1RPnuJrwGjng'); const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); const result = await model.generateContent('Hello'); console.log('✅ API OK:', result.response.text()); }).catch(e => console.error('❌ Error:', e.message))"
```

### 3. Check .env File
```powershell
Get-Content Apk-Chat-AI-Backend\.env
```

Pastikan ada `GOOGLE_API_KEY=...`

### 4. Share Error Details
Dari backend terminal, cari error yang mirip:
```
❌ Failed to generate digest: [ERROR MESSAGE]
Error details: [DETAIL]
```

Share full error message-nya ke saya!
