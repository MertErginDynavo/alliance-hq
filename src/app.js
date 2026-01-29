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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - src/public path for deployment platforms
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

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

// Ana sayfa - index.html'i serve et
app.get('/', (req, res) => {
  const fs = require('fs');
  const indexPath = path.join(__dirname, 'public/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback - HTML content directly
    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alliance HQ - Gaming Alliance Communication Platform</title>
    <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; text-align: center; }
        .logo { width: 120px; height: 120px; margin: 50px auto; }
        h1 { font-size: 3rem; margin: 20px 0; }
        .subtitle { font-size: 1.2rem; margin-bottom: 40px; opacity: 0.9; }
        .buttons { margin: 40px 0; }
        .btn { display: inline-block; padding: 15px 30px; margin: 10px; background: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 10px; transition: all 0.3s; }
        .btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 60px 0; }
        .feature { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎮</div>
        <h1>Alliance HQ</h1>
        <p class="subtitle">Gaming Alliance Communication Platform</p>
        
        <div class="buttons">
            <a href="/demo.html" class="btn">🎮 Demo</a>
            <a href="/login.html" class="btn">🔐 Giriş</a>
            <a href="/register.html" class="btn">📝 Kayıt</a>
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>🌍 Multi-Language</h3>
                <p>10 dilde otomatik çeviri</p>
            </div>
            <div class="feature">
                <h3>🔒 Private Channels</h3>
                <p>R4 özel sohbet kanalları</p>
            </div>
            <div class="feature">
                <h3>📊 Alliance Management</h3>
                <p>İttifak yönetim sistemi</p>
            </div>
        </div>
        
        <p style="margin-top: 60px; opacity: 0.7;">
            🚀 Status: <strong>ONLINE</strong> | 
            🗄️ Database: <strong>CONNECTED</strong> | 
            🌐 Server: <strong>Render.com</strong>
        </p>
    </div>
</body>
</html>
    `);
  }
});

// Demo sayfası
app.get('/demo.html', (req, res) => {
  const fs = require('fs');
  const demoPath = path.join(__dirname, 'public/demo.html');
  
  if (fs.existsSync(demoPath)) {
    res.sendFile(demoPath);
  } else {
    res.redirect('/');
  }
});

// Login sayfası
app.get('/login.html', (req, res) => {
  const fs = require('fs');
  const loginPath = path.join(__dirname, 'public/login.html');
  
  if (fs.existsSync(loginPath)) {
    res.sendFile(loginPath);
  } else {
    res.redirect('/');
  }
});

// Register sayfası
app.get('/register.html', (req, res) => {
  const fs = require('fs');
  const registerPath = path.join(__dirname, 'public/register.html');
  
  if (fs.existsSync(registerPath)) {
    res.sendFile(registerPath);
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
    
    res.json({
      workingDirectory: process.cwd(),
      srcDirectory: __dirname,
      rootFiles: rootFiles,
      srcFiles: srcFiles,
      publicFiles: publicFiles,
      publicPath: path.join(__dirname, 'public'),
      indexExists: fs.existsSync(path.join(__dirname, 'public/index.html'))
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

const PORT = process.env.PORT || 10000;

// Render için export
module.exports = app;

// Server start
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Alliance HQ Server running on port ${PORT}`);
  console.log(`🌐 Server ready for connections`);
});