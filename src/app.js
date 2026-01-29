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
app.use(express.static(path.join(__dirname, '../public')));

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
try {
  connectDatabase();
} catch (error) {
  console.log('⚠️ MongoDB not available, continuing without database (demo mode)');
  console.log('📝 Note: Registration and login will not work without database');
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
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API info endpoint
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

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, '../public/50x.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Alliance HQ Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
});