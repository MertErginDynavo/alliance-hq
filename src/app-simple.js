const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static PNG files
app.get('/:filename.png', (req, res) => {
  const fileName = req.params.filename + '.png';
  const fs = require('fs');
  
  const possiblePaths = [
    path.join(process.cwd(), fileName),
    path.join(__dirname, '../', fileName)
  ];
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      res.setHeader('Content-Type', 'image/png');
      res.sendFile(testPath);
      return;
    }
  }
  
  // SVG fallback
  const fallbackImages = {
    'logo.png': `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="8" fill="#000000"/>
      <text x="60" y="70" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">AH</text>
    </svg>`
  };
  
  if (fallbackImages[fileName]) {
    res.setHeader('Content-Type', 'image/svg+xml');
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
    <title>Alliance HQ - Oyun İttifakı İletişim Platformu</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
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
    </style>
</head>
<body>
    <div class="container">
        <img src="logo.png" alt="Alliance HQ" class="logo" onerror="this.style.display='none'">
        <h1>Alliance HQ</h1>
        <p class="subtitle">Oyun İttifakı İletişim Platformu</p>
        <p class="description">
            Oyun ittifakınızdaki dil engellerini kaldırın. Gerçek zamanlı otomatik çeviri ve akıllı iletişim araçları.
        </p>
        
        <div class="actions">
            <a href="register.html" class="btn btn-primary">📝 İttifak Oluştur</a>
            <a href="login.html" class="btn btn-secondary">🔑 Giriş Yap</a>
            <a href="wolf.html" class="btn btn-wolf">🐺 WOLF İttifakı</a>
        </div>
        
        <div class="status">
            ✅ Alliance HQ Aktif - Render.com'da Çalışıyor<br>
            🔧 MongoDB Entegrasyonu Yakında
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
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 400px;
            width: 90%;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #2c3e50;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }
        input:focus {
            outline: none;
            border-color: #27ae60;
        }
        .btn {
            width: 100%;
            padding: 15px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }
        .btn:hover {
            background: #229954;
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
        .success {
            margin-top: 10px;
            padding: 10px;
            border-radius: 5px;
            background: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
            display: none;
        }
        .info {
            margin-top: 20px;
            padding: 15px;
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 8px;
            color: #1565c0;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>İttifak Oluştur</h1>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="username">Kullanıcı Adı:</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="email">E-posta:</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Şifre:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="form-group">
                <label for="allianceServer">İttifak Sunucusu:</label>
                <input type="text" id="allianceServer" name="allianceServer" placeholder="Örn: WOLF-SERVER-141" required>
            </div>
            
            <button type="submit" class="btn">İttifak Oluştur</button>
            
            <div class="success" id="successMsg"></div>
        </form>
        
        <div class="info">
            🔧 <strong>Geliştirme Aşamasında:</strong><br>
            Kayıt sistemi yakında aktif olacak. Şu anda demo aşamasındayız.
        </div>
        
        <div class="links">
            <a href="login.html">Giriş Yap</a>
            <a href="/">Ana Sayfa</a>
        </div>
    </div>

    <script>
        document.getElementById('registerForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const successMsg = document.getElementById('successMsg');
            successMsg.textContent = 'Demo kayıt tamamlandı! Yakında gerçek sistem aktif olacak.';
            successMsg.style.display = 'block';
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
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
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 400px;
            width: 90%;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #2c3e50;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }
        input:focus {
            outline: none;
            border-color: #3498db;
        }
        .btn {
            width: 100%;
            padding: 15px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }
        .btn:hover {
            background: #2980b9;
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
        .success {
            margin-top: 10px;
            padding: 10px;
            border-radius: 5px;
            background: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
            display: none;
        }
        .info {
            margin-top: 20px;
            padding: 15px;
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 8px;
            color: #1565c0;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Giriş Yap</h1>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">E-posta:</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Şifre:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn">Giriş Yap</button>
            
            <div class="success" id="successMsg"></div>
        </form>
        
        <div class="info">
            🔧 <strong>Geliştirme Aşamasında:</strong><br>
            Giriş sistemi yakında aktif olacak. Şu anda demo aşamasındayız.
        </div>
        
        <div class="links">
            <a href="register.html">Hesap Oluştur</a>
            <a href="/">Ana Sayfa</a>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const successMsg = document.getElementById('successMsg');
            successMsg.textContent = 'Demo giriş tamamlandı! Dashboard\'a yönlendiriliyorsunuz...';
            successMsg.style.display = 'block';
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        });
    </script>
</body>
</html>`);
});

// Dashboard sayfası
app.get('/dashboard.html', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alliance HQ - Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #f8f9fa;
            min-height: 100vh;
        }
        .header {
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2c3e50;
        }
        .btn {
            padding: 8px 16px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        .welcome-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center;
            margin-bottom: 2rem;
        }
        .welcome-card h1 {
            color: #2c3e50;
            margin-bottom: 1rem;
        }
        .status-card {
            background: #e8f5e8;
            border: 1px solid #c8e6c9;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            color: #2e7d32;
        }
        .status-card h2 {
            margin-bottom: 1rem;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 0.5rem 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .feature-list li:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Alliance HQ</div>
        <div>
            <span>Demo Kullanıcı</span>
            <button class="btn" onclick="logout()">Çıkış</button>
        </div>
    </div>

    <div class="container">
        <div class="welcome-card">
            <h1>Hoş Geldin!</h1>
            <p>Alliance HQ'ya başarıyla kayıt oldun. Platform şu anda geliştirme aşamasında.</p>
        </div>
        
        <div class="status-card">
            <h2>🚀 Geliştirme Durumu</h2>
            <ul class="feature-list">
                <li>✅ Temel sayfa yapısı tamamlandı</li>
                <li>✅ Render.com deployment başarılı</li>
                <li>🔧 MongoDB entegrasyonu devam ediyor</li>
                <li>🔧 Kullanıcı kayıt sistemi geliştiriliyor</li>
                <li>🔧 İttifak yönetim sistemi hazırlanıyor</li>
                <li>🔧 Gerçek zamanlı mesajlaşma ekleniyor</li>
            </ul>
        </div>
    </div>

    <script>
        function logout() {
            window.location.href = '/';
        }
    </script>
</body>
</html>`);
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Alliance HQ is running successfully on Render.com',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: 'Development Mode - MongoDB integration coming soon'
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: '🎮 Alliance HQ - Gaming Alliance Communication API',
    version: '1.0.0',
    status: 'Development Mode',
    features: [
      '🌍 Auto translation (coming soon)',
      '🔒 Private alliance spaces (coming soon)',
      '📊 Voting system (coming soon)',
      '📱 Real-time messaging (coming soon)',
      '🔔 Smart notifications (coming soon)'
    ]
  });
});

const PORT = process.env.PORT || 3000;

// Server start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Alliance HQ Server running on port ${PORT}`);
  console.log(`🌐 Server ready for connections`);
  console.log(`✅ Simple mode - no database required`);
  console.log(`🎮 Visit: http://localhost:${PORT}`);
});

module.exports = app;