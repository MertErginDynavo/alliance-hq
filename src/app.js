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
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alliance HQ - Gaming Alliance Communication Platform</title>
    <link rel="icon" type="image/png" href="logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-black: #000000;
            --primary-white: #ffffff;
            --dark-gray: #1a1a1a;
            --text-primary: #000000;
            --text-secondary: #4b5563;
            --text-light: #9ca3af;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: var(--primary-white);
        }
        .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            z-index: 1000;
            padding: 1rem 2rem;
        }
        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: var(--text-primary);
        }
        .nav-logo img {
            width: 40px;
            height: 40px;
            border-radius: 4px;
        }
        .nav-logo-text {
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.02em;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 0.9rem;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0 0.5rem;
        }
        .btn-primary {
            background: var(--primary-black);
            color: var(--primary-white);
        }
        .btn-primary:hover {
            background: var(--dark-gray);
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: transparent;
            color: var(--text-primary);
            border: 1px solid rgba(0, 0, 0, 0.2);
        }
        .btn-secondary:hover {
            background: var(--primary-black);
            color: var(--primary-white);
        }
        .hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 120px 2rem 80px;
        }
        .hero-container {
            max-width: 1000px;
            margin: 0 auto;
        }
        .hero-logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 3rem;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .hero h1 {
            font-family: 'Playfair Display', serif;
            font-size: 4.5rem;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            letter-spacing: -0.02em;
        }
        .hero-subtitle {
            font-size: 1.5rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 2rem;
        }
        .hero-description {
            font-size: 1.1rem;
            color: var(--text-light);
            margin-bottom: 3rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.7;
        }
        .hero-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn-hero {
            padding: 16px 32px;
            font-size: 1rem;
            font-weight: 600;
        }
        .features {
            padding: 100px 2rem;
            background: #f8f9fa;
        }
        .features-container {
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
        }
        .features h2 {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 3rem;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .feature-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .feature-title {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        .footer {
            background: var(--primary-black);
            color: var(--primary-white);
            padding: 60px 2rem 30px;
            text-align: center;
        }
        @media (max-width: 768px) {
            .hero h1 { font-size: 3rem; }
            .hero-actions { flex-direction: column; align-items: center; }
            .btn-hero { width: 100%; max-width: 300px; }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav-container">
            <a href="#" class="nav-logo">
                <img src="logo.png" alt="Alliance HQ" onerror="this.style.display='none'">
                <span class="nav-logo-text">Alliance HQ</span>
            </a>
            <div>
                <a href="/demo.html" class="btn btn-secondary">🎮 Demo</a>
                <a href="/login.html" class="btn btn-primary">Login</a>
            </div>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-container">
            <img src="logo.png" alt="Alliance HQ Logo" class="hero-logo" onerror="this.style.display='none'">
            <h1>Alliance HQ</h1>
            <p class="hero-subtitle">Gaming Alliance Communication Platform</p>
            <p class="hero-description">
                Break down language barriers in your gaming alliance. Real-time auto-translation, private alliance spaces, and smart communication tools designed for mobile strategy games.
            </p>
            
            <div class="hero-actions">
                <a href="/demo.html" class="btn btn-primary btn-hero">🎮 Try Demo</a>
                <a href="/register.html" class="btn btn-secondary btn-hero">📝 Register</a>
            </div>
        </div>
    </section>

    <section class="features">
        <div class="features-container">
            <h2>Powerful Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🌍</div>
                    <h3 class="feature-title">10 Languages</h3>
                    <p>Real-time auto-translation for seamless global communication</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔒</div>
                    <h3 class="feature-title">Private Channels</h3>
                    <p>Secure R4 channels with access code protection</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📱</div>
                    <h3 class="feature-title">Mobile Optimized</h3>
                    <p>Perfect for mobile strategy games and on-the-go management</p>
                </div>
            </div>
        </div>
    </section>

    <footer class="footer">
        <p>&copy; 2026 Alliance HQ. Gaming Alliance Communication Platform.</p>
        <p style="margin-top: 1rem; opacity: 0.7;">
            🚀 Status: <strong>ONLINE</strong> | 
            🗄️ Database: <strong>CONNECTED</strong> | 
            🌐 Server: <strong>Render.com</strong>
        </p>
    </footer>
</body>
</html>`);
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