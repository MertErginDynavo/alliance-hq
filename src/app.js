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
  let indexPath = path.join(__dirname, 'public/index.html');
  
  // Önce src/public'te ara
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(__dirname, '../public/index.html');
  }
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Index page not found');
  }
});

// Demo sayfası
app.get('/demo.html', (req, res) => {
  const fs = require('fs');
  let demoPath = path.join(__dirname, 'public/demo.html');
  
  if (!fs.existsSync(demoPath)) {
    demoPath = path.join(__dirname, '../public/demo.html');
  }
  
  if (fs.existsSync(demoPath)) {
    res.sendFile(demoPath);
  } else {
    res.redirect('/');
  }
});

// Login sayfası
app.get('/login.html', (req, res) => {
  const fs = require('fs');
  let loginPath = path.join(__dirname, 'public/login.html');
  
  if (!fs.existsSync(loginPath)) {
    loginPath = path.join(__dirname, '../public/login.html');
  }
  
  if (fs.existsSync(loginPath)) {
    res.sendFile(loginPath);
  } else {
    res.redirect('/');
  }
});

// Register sayfası
app.get('/register.html', (req, res) => {
  const fs = require('fs');
  let registerPath = path.join(__dirname, 'public/register.html');
  
  if (!fs.existsSync(registerPath)) {
    registerPath = path.join(__dirname, '../public/register.html');
  }
  
  if (fs.existsSync(registerPath)) {
    res.sendFile(registerPath);
  } else {
    res.redirect('/');
  }
});

// Dashboard sayfası
app.get('/dashboard.html', (req, res) => {
  const fs = require('fs');
  let dashboardPath = path.join(__dirname, 'public/dashboard.html');
  
  if (!fs.existsSync(dashboardPath)) {
    dashboardPath = path.join(__dirname, '../public/dashboard.html');
  }
  
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.redirect('/');
  }
});

// Static assets (PNG files)
app.get('/*.png', (req, res) => {
  const fs = require('fs');
  const fileName = req.params[0] + '.png';
  let filePath = path.join(__dirname, 'public', fileName);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '../public', fileName);
  }
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
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