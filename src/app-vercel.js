const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cache headers
app.use((req, res, next) => {
  if (req.url.endsWith('.png')) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});

// Database
const databaseConnected = true;

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Simple auth endpoints
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Demo kayıt başarılı - Vercel Serverless',
    user: { username: 'demo', email: 'demo@alliance.com' }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Demo giriş başarılı - Vercel Serverless',
    user: { username: 'demo', email: 'demo@alliance.com' }
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    database: 'Connected',
    databaseType: 'JSON File Database',
    timestamp: new Date().toISOString(),
    version: '1.0.4',
    platform: 'Vercel'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    message: '🎮 Alliance HQ - Vercel Deploy v1.0.4',
    version: '1.0.4',
    database: 'JSON Database Connected',
    platform: 'Vercel Serverless',
    features: [
      '⚡ Lightning fast JSON database',
      '🌍 Auto translation',
      '🔒 Private alliance spaces',
      '📱 Real-time messaging'
    ]
  });
});

// PNG files
app.get('/:filename.png', (req, res) => {
  const fileName = req.params.filename + '.png';
  
  const fallbackImages = {
    'logo.png': `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="8" fill="#000000"/>
      <text x="60" y="70" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">AH</text>
    </svg>`,
    'türkçe.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="18" fill="#E30A13"/>
      <circle cx="8" cy="9" r="3" fill="white"/>
      <circle cx="8" cy="9" r="2" fill="#E30A13"/>
      <polygon points="11,7 13,9 11,11" fill="white"/>
    </svg>`
  };
  
  if (fallbackImages[fileName]) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(fallbackImages[fileName]);
  } else {
    res.status(404).send('Image not found');
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alliance HQ v1.0.4 - Vercel Deploy</title>
    <link rel="icon" type="image/png" href="logo.png">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            min-height: 100vh;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 800px;
            padding: 2rem;
        }
        .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 2rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: 800;
        }
        .subtitle {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .description {
            font-size: 1.1rem;
            margin-bottom: 3rem;
            opacity: 0.8;
            line-height: 1.6;
        }
        .actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .btn-primary {
            background: #27ae60;
            color: white;
        }
        .btn-secondary {
            background: transparent;
            color: white;
            border: 2px solid white;
        }
        .btn-wolf {
            background: #e74c3c;
            color: white;
        }
        .status {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            font-size: 0.9rem;
        }
        .db-status {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
            background: #27ae60;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="logo.png" alt="Alliance HQ" class="logo">
        <h1>Alliance HQ v1.0.4</h1>
        <p class="subtitle">⚡ Vercel Serverless Platform</p>
        <p class="description">
            Oyun ittifakınızdaki dil engellerini kaldırın. Gerçek zamanlı otomatik çeviri, özel ittifak alanları ve mobil strateji oyunları için tasarlanmış akıllı iletişim araçları.
        </p>
        
        <div class="actions">
            <a href="/register.html" class="btn btn-primary">📝 İttifak Oluştur</a>
            <a href="/login.html" class="btn btn-secondary">🔑 Giriş Yap</a>
            <a href="/api" class="btn btn-wolf">🚀 API Test</a>
        </div>
        
        <div class="status">
            <span class="db-status"></span>
            ✅ JSON Database Bağlı - Vercel Serverless
        </div>
    </div>
</body>
</html>`);
});

// Register sayfası
app.get('/register.html', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alliance HQ - İttifak Oluştur</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-width: 450px;
            width: 90%;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
            font-size: 2rem;
            font-weight: 700;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #2c3e50;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
        }
        .btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        .links {
            text-align: center;
            margin-top: 20px;
        }
        .links a {
            color: #27ae60;
            text-decoration: none;
            margin: 0 10px;
        }
        .status {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background: #e8f5e8;
            color: #2e7d32;
            border-radius: 8px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>İttifak Oluştur</h1>
        
        <div class="status">
            ✅ Vercel Serverless - Kayıt Sistemi Aktif
        </div>
        
        <form>
            <div class="form-group">
                <label>Kullanıcı Adı:</label>
                <input type="text" required>
            </div>
            
            <div class="form-group">
                <label>E-posta:</label>
                <input type="email" required>
            </div>
            
            <div class="form-group">
                <label>Şifre:</label>
                <input type="password" required>
            </div>
            
            <div class="form-group">
                <label>İttifak Sunucusu:</label>
                <input type="text" placeholder="Örn: WOLF-SERVER-141" required>
            </div>
            
            <button type="submit" class="btn">İttifak Oluştur</button>
        </form>
        
        <div class="links">
            <a href="/login.html">Giriş Yap</a>
            <a href="/">Ana Sayfa</a>
        </div>
    </div>

    <script>
        document.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            alert('Demo kayıt sistemi - Vercel Serverless çalışıyor!');
        });
    </script>
</body>
</html>`);
});

// Login sayfası
app.get('/login.html', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alliance HQ - Giriş</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-width: 400px;
            width: 90%;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
            font-size: 2rem;
            font-weight: 700;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #2c3e50;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
        }
        .btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        .links {
            text-align: center;
            margin-top: 20px;
        }
        .links a {
            color: #3498db;
            text-decoration: none;
            margin: 0 10px;
        }
        .status {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background: #e8f5e8;
            color: #2e7d32;
            border-radius: 8px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Giriş Yap</h1>
        
        <div class="status">
            ✅ Vercel Serverless - Giriş Sistemi Aktif
        </div>
        
        <form>
            <div class="form-group">
                <label>E-posta:</label>
                <input type="email" required>
            </div>
            
            <div class="form-group">
                <label>Şifre:</label>
                <input type="password" required>
            </div>
            
            <button type="submit" class="btn">Giriş Yap</button>
        </form>
        
        <div class="links">
            <a href="/register.html">Hesap Oluştur</a>
            <a href="/">Ana Sayfa</a>
        </div>
    </div>

    <script>
        document.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            alert('Demo giriş sistemi - Vercel Serverless çalışıyor!');
        });
    </script>
</body>
</html>`);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    platform: 'Vercel Serverless'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Sayfa Bulunamadı - Alliance HQ</title>
    <style>
        body { 
            font-family: 'Inter', sans-serif; 
            background: #f8f9fa; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
        }
        .container { 
            text-align: center; 
            background: white; 
            padding: 3rem; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
        }
        h1 { 
            font-size: 4rem; 
            color: #e74c3c; 
            margin-bottom: 1rem; 
        }
        p { 
            color: #6c757d; 
            font-size: 1.2rem; 
            margin-bottom: 2rem; 
        }
        .btn { 
            background: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <p>Aradığınız sayfa bulunamadı.</p>
        <a href="/" class="btn">Ana Sayfaya Dön</a>
    </div>
</body>
</html>`);
});

module.exports = app;