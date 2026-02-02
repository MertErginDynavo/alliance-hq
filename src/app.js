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

// Static files - src/public path for deployment platforms
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// PNG files fallback - serve SVG versions when PNG files are not found
app.get('/:filename.png', (req, res) => {
  const fileName = req.params.filename + '.png';
  const fs = require('fs');
  
  console.log(`PNG request for: ${fileName}`);
  
  // First try to serve the actual PNG file from public directory
  const possiblePaths = [
    path.join(__dirname, 'public', fileName),
    path.join(__dirname, '../public', fileName),
    path.join(process.cwd(), 'public', fileName),
    path.join(process.cwd(), 'src/public', fileName)
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
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.sendFile(pngPath);
    return;
  }
  
  // If PNG doesn't exist, serve SVG fallback
  console.log(`PNG not found, serving SVG fallback for: ${fileName}`);
  
  // Logo ve bayrak dosyaları için SVG fallback
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
    </svg>`,
    'Espanol.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="18" fill="#AA001B"/>
      <rect y="4" width="24" height="10" fill="#FFC400"/>
    </svg>`,
    'Deutsch.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="6" fill="#000000"/>
      <rect y="6" width="24" height="6" fill="#DD003D"/>
      <rect y="12" width="24" height="6" fill="#FFCE00"/>
    </svg>`,
    'Çince.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="18" fill="#DE2910"/>
      <polygon points="6,4 7,6 5,6" fill="#FFDE00"/>
    </svg>`,
    'Fransızca.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="8" height="18" fill="#002395"/>
      <rect x="8" width="8" height="18" fill="white"/>
      <rect x="16" width="8" height="18" fill="#ED2939"/>
    </svg>`,
    'Rusça.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="6" fill="white"/>
      <rect y="6" width="24" height="6" fill="#0052B4"/>
      <rect y="12" width="24" height="6" fill="#D32930"/>
    </svg>`,
    'Arapça.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="6" fill="#000000"/>
      <rect y="6" width="24" height="6" fill="white"/>
      <rect y="12" width="24" height="6" fill="#00723D"/>
    </svg>`,
    'Japonca.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="18" fill="white"/>
      <circle cx="12" cy="9" r="4" fill="#BC002D"/>
    </svg>`,
    'Korece.png': `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="18" fill="white"/>
      <circle cx="10" cy="9" r="3" fill="#CD212A"/>
      <circle cx="14" cy="9" r="3" fill="#003478"/>
    </svg>`,
    'WLF.png': `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" rx="8" fill="#1a1a1a"/>
      <text x="30" y="38" font-family="Arial" font-size="36" font-weight="bold" fill="white" text-anchor="middle">🐺</text>
    </svg>`
  };
  
  if (fallbackImages[fileName]) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(fallbackImages[fileName]);
  } else {
    console.log(`No fallback available for: ${fileName}`);
    res.status(404).send('Image not found');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version
  });
});

// Database bağlantısı (optional for demo mode)
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'undefined') {
  try {
    connectDatabase();
  } catch (error) {
    console.log('⚠️ MongoDB connection failed, continuing in demo mode');
  }
} else {
  console.log('🎮 Alliance HQ starting in DEMO MODE (no database required)');
  console.log('📝 All data will be stored in memory for demo purposes');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alliance', allianceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/seasons', seasonRoutes);

// Socket.IO handler
socketHandler(io);

// Ana sayfa - index.html dosyasını serve et
app.get('/', (req, res) => {
  const fs = require('fs');
  
  // Farklı olası yolları dene
  const possiblePaths = [
    path.join(__dirname, 'public/index.html'),
    path.join(__dirname, '../public/index.html'),
    path.join(process.cwd(), 'public/index.html'),
    path.join(process.cwd(), 'src/public/index.html')
  ];
  
  let indexPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      indexPath = testPath;
      console.log(`Found index.html at: ${testPath}`);
      break;
    }
  }
  
  if (indexPath) {
    res.sendFile(indexPath);
  } else {
    console.log('Index.html not found in any of these paths:', possiblePaths);
    // Fallback - basit HTML döndür
    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alliance HQ</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: red; margin: 20px 0; }
        .info { color: blue; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Alliance HQ</h1>
    <div class="error">Ana sayfa dosyası bulunamadı</div>
    <div class="info">Dosya yolları kontrol ediliyor...</div>
    <div class="info">Lütfen birkaç dakika bekleyin ve sayfayı yenileyin</div>
    <p><a href="/wolf.html">WOLF İttifakına Git</a></p>
    <p><a href="/login.html">Giriş Yap</a></p>
    <p><a href="/register.html">Kayıt Ol</a></p>
</body>
</html>`);
  }
});

// WOLF REGION FORCE ittifak sayfası
app.get('/wolf.html', (req, res) => {
  const fs = require('fs');
  
  const possiblePaths = [
    path.join(__dirname, 'public/wolf.html'),
    path.join(__dirname, '../public/wolf.html'),
    path.join(process.cwd(), 'public/wolf.html'),
    path.join(process.cwd(), 'src/public/wolf.html')
  ];
  
  let wolfPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      wolfPath = testPath;
      break;
    }
  }
  
  if (wolfPath) {
    res.sendFile(wolfPath);
  } else {
    res.redirect('/');
  }
});

// Demo sayfası - WOLF sayfasına yönlendir
app.get('/demo.html', (req, res) => {
  res.redirect('/wolf.html');
});

// Login sayfası
app.get('/login.html', (req, res) => {
  const fs = require('fs');
  
  const possiblePaths = [
    path.join(__dirname, 'public/login.html'),
    path.join(__dirname, '../public/login.html'),
    path.join(process.cwd(), 'public/login.html'),
    path.join(process.cwd(), 'src/public/login.html')
  ];
  
  let loginPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      loginPath = testPath;
      break;
    }
  }
  
  if (loginPath) {
    res.sendFile(loginPath);
  } else {
    res.status(500).send('Login sayfası bulunamadı');
  }
});

// Register sayfası
app.get('/register.html', (req, res) => {
  const fs = require('fs');
  
  const possiblePaths = [
    path.join(__dirname, 'public/register.html'),
    path.join(__dirname, '../public/register.html'),
    path.join(process.cwd(), 'public/register.html'),
    path.join(process.cwd(), 'src/public/register.html')
  ];
  
  let registerPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      registerPath = testPath;
      break;
    }
  }
  
  if (registerPath) {
    res.sendFile(registerPath);
  } else {
    res.status(500).send('Register sayfası bulunamadı');
  }
});

// Dashboard sayfası
app.get('/dashboard.html', (req, res) => {
  const fs = require('fs');
  
  const possiblePaths = [
    path.join(__dirname, 'public/dashboard.html'),
    path.join(__dirname, '../public/dashboard.html'),
    path.join(process.cwd(), 'public/dashboard.html'),
    path.join(process.cwd(), 'src/public/dashboard.html')
  ];
  
  let dashboardPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      dashboardPath = testPath;
      break;
    }
  }
  
  if (dashboardPath) {
    res.sendFile(dashboardPath);
  } else {
    res.redirect('/');
  }
});

app.get('/api', (req, res) => {
  res.json({
    message: '🎮 Alliance HQ - Gaming Alliance Communication API',
    version: '1.0.0',
    features: [
      '🌍 Auto translation',
      '🔒 Private alliance spaces',
      '📊 Voting system',
      '📱 Real-time messaging',
      '🔔 Smart notifications'
    ]
  });
});

// Debug endpoint - dosya yapısını kontrol et
app.get('/api/debug', (req, res) => {
  const fs = require('fs');
  try {
    const rootFiles = fs.readdirSync(process.cwd());
    const srcFiles = fs.existsSync(path.join(__dirname)) ? fs.readdirSync(path.join(__dirname)) : ['src directory not found'];
    const publicFiles = fs.existsSync(path.join(__dirname, 'public')) ? fs.readdirSync(path.join(__dirname, 'public')) : ['src/public directory not found'];
    const rootPublicFiles = fs.existsSync(path.join(process.cwd(), 'public')) ? fs.readdirSync(path.join(process.cwd(), 'public')) : ['root/public directory not found'];
    
    res.json({
      workingDirectory: process.cwd(),
      srcDirectory: __dirname,
      rootFiles: rootFiles,
      srcFiles: srcFiles,
      publicFiles: publicFiles,
      rootPublicFiles: rootPublicFiles,
      possiblePaths: {
        srcPublic: path.join(__dirname, 'public'),
        parentPublic: path.join(__dirname, '../public'),
        rootPublic: path.join(process.cwd(), 'public'),
        srcRootPublic: path.join(process.cwd(), 'src/public')
      },
      indexExists: {
        srcPublic: fs.existsSync(path.join(__dirname, 'public/index.html')),
        parentPublic: fs.existsSync(path.join(__dirname, '../public/index.html')),
        rootPublic: fs.existsSync(path.join(process.cwd(), 'public/index.html')),
        srcRootPublic: fs.existsSync(path.join(process.cwd(), 'src/public/index.html'))
      }
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'public/50x.html'));
});

const PORT = process.env.PORT || 3000;

// Server start
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Alliance HQ Server running on port ${PORT}`);
  console.log(`🌐 Server ready for connections`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'public')}`);
  console.log(`🎮 Visit: http://localhost:${PORT}`);
});

module.exports = app;