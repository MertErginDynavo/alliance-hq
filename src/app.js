const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { connectDatabase } = require('./config/database');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const allianceRoutes = require('./routes/alliance');
const messageRoutes = require('./routes/messages');
const pollRoutes = require('./routes/polls');
const seasonRoutes = require('./routes/seasons');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware for better performance
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Database connection
async function initializeDatabase() {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'undefined') {
    console.log('⚠️ MONGODB_URI environment variable not set');
    console.log('🎮 Alliance HQ starting in LIMITED MODE (no database)');
    return false;
  }

  try {
    await connectDatabase();
    console.log('✅ Alliance HQ starting with MongoDB Atlas');
    return true;
  } catch (error) {
    console.error('⚠️ MongoDB connection failed:', error.message);
    console.log('🎮 Alliance HQ starting in LIMITED MODE (database connection failed)');
    return false;
  }
}

// Initialize database connection (non-blocking)
let databaseConnected = false;
initializeDatabase().then((connected) => {
  databaseConnected = connected;
}).catch((error) => {
  console.error('Database initialization error:', error);
  databaseConnected = false;
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alliance', allianceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/seasons', seasonRoutes);

// Socket.IO handler
socketHandler(io);

// Static files - serve PNG files from root directory
app.get('/:filename.png', (req, res) => {
  const fileName = req.params.filename + '.png';
  const fs = require('fs');
  
  console.log(`PNG request for: ${fileName}`);
  
  const possiblePaths = [
    path.join(process.cwd(), fileName),
    path.join(__dirname, '../', fileName),
    path.join(__dirname, fileName)
  ];
  
  let pngPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      pngPath = testPath;
      console.log(`Found PNG at: ${testPath}`);
      break;
    }
  }
  
  if (pngPath) {
    console.log(`Serving real PNG: ${fileName}`);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(pngPath);
    return;
  }
  
  // SVG fallback
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
    </svg>`,
    'İngilizce.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="18" fill="#012169"/>
      <path d="M0 0 L24 0 L24 18 L0 18 Z" fill="#012169"/>
      <path d="M0 0 L24 18 M24 0 L0 18" stroke="white" stroke-width="2"/>
      <path d="M12 0 L12 18 M0 9 L24 9" stroke="white" stroke-width="3"/>
      <path d="M12 0 L12 18 M0 9 L24 9" stroke="#C8102E" stroke-width="2"/>
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
    <title>Alliance HQ v1.0.3 - MongoDB Entegrasyonlu İletişim Platformu</title>
    <link rel="icon" type="image/png" href="logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
        }
        .db-connected { background: #27ae60; }
        .db-disconnected { background: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <img src="logo.png" alt="Alliance HQ" class="logo" onerror="this.style.display='none'">
        <h1>Alliance HQ v1.0.3</h1>
        <p class="subtitle">MongoDB Entegrasyonlu İletişim Platformu</p>
        <p class="description">
            Oyun ittifakınızdaki dil engellerini kaldırın. Gerçek zamanlı otomatik çeviri, özel ittifak alanları ve mobil strateji oyunları için tasarlanmış akıllı iletişim araçları.
        </p>
        
        <div class="actions">
            <a href="register.html" class="btn btn-primary">📝 İttifak Oluştur</a>
            <a href="login.html" class="btn btn-secondary">🔑 Giriş Yap</a>
            <a href="wolf.html" class="btn btn-wolf">🐺 WOLF İttifakı</a>
        </div>
        
        <div class="status">
            <span class="db-status ${databaseConnected ? 'db-connected' : 'db-disconnected'}"></span>
            ${databaseConnected ? '✅ MongoDB Atlas Bağlı - Tam Özellikli Mod v1.0.3' : '⚠️ Sınırlı Mod - Database Bağlantısı Yok'}
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
    <link rel="icon" type="image/png" href="logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
            backdrop-filter: blur(10px);
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            display: block;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
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
            transition: border-color 0.3s;
            font-family: 'Inter', sans-serif;
        }
        input:focus {
            outline: none;
            border-color: #27ae60;
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
            transition: transform 0.3s;
            margin-top: 10px;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
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
        .links a:hover {
            text-decoration: underline;
        }
        .error, .success {
            margin-top: 10px;
            padding: 10px;
            border-radius: 5px;
            display: none;
        }
        .error {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ffcdd2;
        }
        .success {
            background: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
        }
        .loading {
            display: none;
            text-align: center;
            margin-top: 10px;
            color: #666;
        }
        .db-status {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            border-radius: 8px;
            font-size: 0.9rem;
        }
        .db-connected {
            background: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
        }
        .db-disconnected {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ffcdd2;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="logo.png" alt="Alliance HQ" class="logo" onerror="this.style.display='none'">
        <h1>İttifak Oluştur</h1>
        
        <div id="dbStatus" class="db-status">
            <span id="dbStatusText">Veritabanı durumu kontrol ediliyor...</span>
        </div>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="username">Kullanıcı Adı:</label>
                <input type="text" id="username" name="username" required minlength="3" maxlength="20">
            </div>
            
            <div class="form-group">
                <label for="email">E-posta:</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Şifre:</label>
                <input type="password" id="password" name="password" required minlength="6">
            </div>
            
            <div class="form-group">
                <label for="allianceServer">İttifak Sunucusu:</label>
                <input type="text" id="allianceServer" name="allianceServer" placeholder="Örn: WOLF-SERVER-141" required maxlength="30">
            </div>
            
            <button type="submit" class="btn" id="submitBtn">İttifak Oluştur</button>
            
            <div class="loading" id="loading">
                <div>⏳ Kayıt işlemi yapılıyor...</div>
            </div>
            
            <div class="error" id="errorMsg"></div>
            <div class="success" id="successMsg"></div>
        </form>
        
        <div class="links">
            <a href="login.html">Giriş Yap</a>
            <a href="/">Ana Sayfa</a>
        </div>
    </div>

    <script>
        let databaseConnected = false;
        
        // Check database status
        async function checkDatabaseStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                databaseConnected = data.database !== 'Disconnected';
                
                const statusDiv = document.getElementById('dbStatus');
                const statusText = document.getElementById('dbStatusText');
                
                if (databaseConnected) {
                    statusDiv.className = 'db-status db-connected';
                    statusText.textContent = '✅ MongoDB Atlas Bağlı - Gerçek Kayıt Sistemi Aktif';
                } else {
                    statusDiv.className = 'db-status db-disconnected';
                    statusText.textContent = '⚠️ Veritabanı Bağlantısı Yok - Kayıt Sistemi Devre Dışı';
                    document.getElementById('submitBtn').disabled = true;
                }
            } catch (error) {
                console.error('Status check failed:', error);
                const statusDiv = document.getElementById('dbStatus');
                const statusText = document.getElementById('dbStatusText');
                statusDiv.className = 'db-status db-disconnected';
                statusText.textContent = '❌ Sunucu Bağlantısı Başarısız';
                document.getElementById('submitBtn').disabled = true;
            }
        }
        
        // Initialize
        checkDatabaseStatus();
        
        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!databaseConnected) {
                alert('Veritabanı bağlantısı olmadan kayıt yapılamaz.');
                return;
            }
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const allianceServer = document.getElementById('allianceServer').value;
            const errorMsg = document.getElementById('errorMsg');
            const successMsg = document.getElementById('successMsg');
            const loading = document.getElementById('loading');
            const submitBtn = document.getElementById('submitBtn');
            
            // Reset messages
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';
            loading.style.display = 'block';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        username, 
                        email, 
                        password, 
                        allianceServer 
                    })
                });
                
                const data = await response.json();
                
                loading.style.display = 'none';
                
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    successMsg.textContent = data.message + ' Dashboard\'a yönlendiriliyorsunuz...';
                    successMsg.style.display = 'block';
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                } else {
                    errorMsg.textContent = data.message || 'Kayıt başarısız!';
                    errorMsg.style.display = 'block';
                    submitBtn.disabled = false;
                }
            } catch (error) {
                loading.style.display = 'none';
                console.error('Register error:', error);
                errorMsg.textContent = 'Bağlantı hatası! Lütfen tekrar deneyin.';
                errorMsg.style.display = 'block';
                submitBtn.disabled = false;
            }
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
    <link rel="icon" type="image/png" href="logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
            backdrop-filter: blur(10px);
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            display: block;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
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
            transition: border-color 0.3s;
            font-family: 'Inter', sans-serif;
        }
        input:focus {
            outline: none;
            border-color: #3498db;
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
            transition: transform 0.3s;
            margin-top: 10px;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
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
        .links a:hover {
            text-decoration: underline;
        }
        .error, .success {
            margin-top: 10px;
            padding: 10px;
            border-radius: 5px;
            display: none;
        }
        .error {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ffcdd2;
        }
        .success {
            background: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
        }
        .loading {
            display: none;
            text-align: center;
            margin-top: 10px;
            color: #666;
        }
        .db-status {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            border-radius: 8px;
            font-size: 0.9rem;
        }
        .db-connected {
            background: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
        }
        .db-disconnected {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ffcdd2;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="logo.png" alt="Alliance HQ" class="logo" onerror="this.style.display='none'">
        <h1>Giriş Yap</h1>
        
        <div id="dbStatus" class="db-status">
            <span id="dbStatusText">Veritabanı durumu kontrol ediliyor...</span>
        </div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">E-posta:</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Şifre:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn" id="submitBtn">Giriş Yap</button>
            
            <div class="loading" id="loading">
                <div>⏳ Giriş yapılıyor...</div>
            </div>
            
            <div class="error" id="errorMsg"></div>
            <div class="success" id="successMsg"></div>
        </form>
        
        <div class="links">
            <a href="register.html">Hesap Oluştur</a>
            <a href="/">Ana Sayfa</a>
        </div>
    </div>

    <script>
        let databaseConnected = false;
        
        // Check database status
        async function checkDatabaseStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                databaseConnected = data.database !== 'Disconnected';
                
                const statusDiv = document.getElementById('dbStatus');
                const statusText = document.getElementById('dbStatusText');
                
                if (databaseConnected) {
                    statusDiv.className = 'db-status db-connected';
                    statusText.textContent = '✅ MongoDB Atlas Bağlı - Gerçek Giriş Sistemi Aktif';
                } else {
                    statusDiv.className = 'db-status db-disconnected';
                    statusText.textContent = '⚠️ Veritabanı Bağlantısı Yok - Giriş Sistemi Devre Dışı';
                    document.getElementById('submitBtn').disabled = true;
                }
            } catch (error) {
                console.error('Status check failed:', error);
                const statusDiv = document.getElementById('dbStatus');
                const statusText = document.getElementById('dbStatusText');
                statusDiv.className = 'db-status db-disconnected';
                statusText.textContent = '❌ Sunucu Bağlantısı Başarısız';
                document.getElementById('submitBtn').disabled = true;
            }
        }
        
        // Initialize
        checkDatabaseStatus();
        
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!databaseConnected) {
                alert('Veritabanı bağlantısı olmadan giriş yapılamaz.');
                return;
            }
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('errorMsg');
            const successMsg = document.getElementById('successMsg');
            const loading = document.getElementById('loading');
            const submitBtn = document.getElementById('submitBtn');
            
            // Reset messages
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';
            loading.style.display = 'block';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                loading.style.display = 'none';
                
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    successMsg.textContent = 'Giriş başarılı! Dashboard\'a yönlendiriliyorsunuz...';
                    successMsg.style.display = 'block';
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    errorMsg.textContent = data.message || 'Giriş başarısız!';
                    errorMsg.style.display = 'block';
                    submitBtn.disabled = false;
                }
            } catch (error) {
                loading.style.display = 'none';
                console.error('Login error:', error);
                errorMsg.textContent = 'Bağlantı hatası! Lütfen tekrar deneyin.';
                errorMsg.style.display = 'block';
                submitBtn.disabled = false;
            }
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
    <link rel="icon" type="image/png" href="logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
            color: #333;
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
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.5rem;
            font-weight: 700;
        }
        .logo img {
            width: 40px;
            height: 40px;
            border-radius: 6px;
        }
        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .btn {
            padding: 8px 16px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            font-size: 0.9rem;
        }
        .btn:hover {
            background: #c82333;
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
            font-size: 2.5rem;
        }
        .welcome-card p {
            color: #6c757d;
            font-size: 1.1rem;
            margin-bottom: 2rem;
        }
        .actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        .action-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        .action-card:hover {
            transform: translateY(-5px);
        }
        .action-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .action-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #2c3e50;
        }
        .action-desc {
            color: #6c757d;
            line-height: 1.5;
        }
        .db-status {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        .db-connected {
            border-left: 4px solid #27ae60;
        }
        .db-disconnected {
            border-left: 4px solid #e74c3c;
        }
        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                gap: 1rem;
                padding: 1rem;
            }
            .container {
                padding: 0 1rem;
            }
            .welcome-card h1 {
                font-size: 2rem;
            }
            .actions {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="logo.png" alt="Alliance HQ" onerror="this.style.display='none'">
            <span>Alliance HQ</span>
        </div>
        <div class="user-info">
            <span id="username">Kullanıcı</span>
            <button class="btn" onclick="logout()">Çıkış</button>
        </div>
    </div>

    <div class="container">
        <div id="dbStatus" class="db-status">
            <h3 id="dbStatusTitle">Sistem Durumu</h3>
            <p id="dbStatusText">Kontrol ediliyor...</p>
        </div>
        
        <div class="welcome-card">
            <h1>Hoş Geldin!</h1>
            <p>Alliance HQ'ya başarıyla giriş yaptın. Şimdi ittifakını yönetmeye başlayabilirsin.</p>
        </div>

        <div class="actions">
            <div class="action-card" onclick="goToWolf()">
                <div class="action-icon">🐺</div>
                <div class="action-title">WOLF İttifakı</div>
                <div class="action-desc">WOLF REGION FORCE ittifakına katıl ve diğer oyuncularla iletişim kur.</div>
            </div>
            
            <div class="action-card" onclick="createAlliance()">
                <div class="action-icon">⚔️</div>
                <div class="action-title">İttifak Oluştur</div>
                <div class="action-desc">Kendi ittifakını oluştur ve liderlik yap.</div>
            </div>
            
            <div class="action-card" onclick="joinAlliance()">
                <div class="action-icon">🤝</div>
                <div class="action-title">İttifaka Katıl</div>
                <div class="action-desc">Mevcut bir ittifaka katıl ve takım çalışması yap.</div>
            </div>
        </div>
    </div>

    <script>
        // Check authentication
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            window.location.href = 'login.html';
        } else {
            const userData = JSON.parse(user);
            document.getElementById('username').textContent = userData.nickname || userData.username;
        }
        
        // Check database status
        async function checkDatabaseStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                const isConnected = data.database !== 'Disconnected';
                
                const statusDiv = document.getElementById('dbStatus');
                const statusTitle = document.getElementById('dbStatusTitle');
                const statusText = document.getElementById('dbStatusText');
                
                if (isConnected) {
                    statusDiv.className = 'db-status db-connected';
                    statusTitle.textContent = '✅ Sistem Aktif';
                    statusText.textContent = 'MongoDB Atlas bağlı - Tüm özellikler kullanılabilir';
                } else {
                    statusDiv.className = 'db-status db-disconnected';
                    statusTitle.textContent = '⚠️ Sınırlı Mod';
                    statusText.textContent = 'Veritabanı bağlantısı yok - Bazı özellikler kullanılamayabilir';
                }
            } catch (error) {
                console.error('Status check failed:', error);
                const statusDiv = document.getElementById('dbStatus');
                const statusTitle = document.getElementById('dbStatusTitle');
                const statusText = document.getElementById('dbStatusText');
                statusDiv.className = 'db-status db-disconnected';
                statusTitle.textContent = '❌ Bağlantı Hatası';
                statusText.textContent = 'Sunucu ile bağlantı kurulamadı';
            }
        }
        
        // Initialize
        checkDatabaseStatus();

        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }

        function goToWolf() {
            window.location.href = 'wolf.html';
        }

        function createAlliance() {
            alert('İttifak oluşturma özelliği yakında eklenecek!');
        }

        function joinAlliance() {
            alert('İttifaka katılma özelliği yakında eklenecek!');
        }
    </script>
</body>
</html>`);
});
// Wolf sayfası - WOLF REGION FORCE ittifakı
app.get('/wolf.html', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WOLF REGION FORCE - Alliance HQ</title>
    <link rel="icon" type="image/png" href="logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
            background: #e74c3c;
            color: white;
        }
        .btn-secondary {
            background: transparent;
            color: white;
            border: 2px solid white;
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
        }
        .db-connected { background: #27ae60; }
        .db-disconnected { background: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <img src="WLF.png" alt="WOLF REGION FORCE" class="logo" onerror="this.style.display='none'">
        <h1>🐺 WOLF REGION FORCE</h1>
        <p class="subtitle">Kurtlar sürü halinde avlanır!</p>
        <p class="description">
            WOLF REGION FORCE ittifakına hoş geldin. Güçlü bir sürünün parçası ol ve birlikte zafere ulaş.
        </p>
        
        <div class="actions">
            <a href="register.html" class="btn btn-primary">🔥 İttifaka Katıl</a>
            <a href="login.html" class="btn btn-secondary">🔑 Giriş Yap</a>
            <a href="/" class="btn btn-secondary">🏠 Ana Sayfa</a>
        </div>
        
        <div class="status">
            <span class="db-status ${databaseConnected ? 'db-connected' : 'db-disconnected'}"></span>
            ${databaseConnected ? '✅ MongoDB Atlas Bağlı - Tam Özellikli Mod v1.0.3' : '⚠️ Sınırlı Mod - Database Bağlantısı Yok'}
        </div>
    </div>
</body>
</html>`);
});

// Demo sayfası - wolf.html'e yönlendir
app.get('/demo.html', (req, res) => {
  res.redirect('/wolf.html');
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    database: databaseConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.3',
    mongodb: databaseConnected ? 'MongoDB Atlas Active' : 'MongoDB Disconnected'
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: '🎮 Alliance HQ - Gaming Alliance Communication API - MongoDB Ready v1.0.3',
    version: '1.0.3',
    database: databaseConnected ? 'MongoDB Atlas Connected' : 'Database Disconnected',
    features: [
      '🌍 Auto translation',
      '🔒 Private alliance spaces',
      '📊 Voting system',
      '📱 Real-time messaging',
      '🔔 Smart notifications'
    ]
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Sunucu Hatası - Alliance HQ</title>
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
            color: #dc3545; 
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
        <h1>500</h1>
        <p>Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.</p>
        <a href="/" class="btn">Ana Sayfaya Dön</a>
    </div>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;

// Server start
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Alliance HQ Server running on port ${PORT} - MongoDB Integrated v1.0.3`);
  console.log(`🌐 Server ready for connections`);
  console.log(`🎮 Visit: http://localhost:${PORT}`);
  console.log(`📊 Database: ${databaseConnected ? 'MongoDB Atlas Connected' : 'Limited Mode'}`);
});

module.exports = app;