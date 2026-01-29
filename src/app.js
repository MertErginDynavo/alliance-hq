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
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WOLF REGION FORCE - Alliance HQ</title>
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
            --border-light: rgba(0, 0, 0, 0.1);
            --bg-card: rgba(255, 255, 255, 0.8);
            --bg-sidebar: rgba(248, 249, 250, 0.95);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: linear-gradient(135deg, var(--primary-white) 0%, #f8f9fa 100%);
            min-height: 100vh;
        }
        .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border-light);
            z-index: 1000;
            padding: 1rem 2rem;
        }
        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .alliance-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .alliance-logo {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: cover;
        }
        .alliance-logo.emoji {
            font-size: 3rem;
            width: auto;
            height: auto;
        }
        .alliance-details h1 {
            font-family: 'Playfair Display', serif;
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
        }
        .alliance-game-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        .game-info-item {
            display: flex;
            gap: 0.5rem;
        }
        .info-label {
            font-weight: 600;
            min-width: 80px;
        }
        .language-selector {
            position: relative;
        }
        .custom-select {
            position: relative;
            display: inline-block;
            min-width: 100px;
        }
        .select-selected {
            background: var(--primary-white);
            color: var(--text-secondary);
            border: 1px solid var(--border-light);
            border-radius: 6px;
            padding: 8px 30px 8px 12px;
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .flag-icon {
            width: 18px;
            height: 14px;
            object-fit: cover;
            border-radius: 2px;
        }
        .main-container {
            display: flex;
            min-height: 100vh;
            padding-top: 100px;
        }
        .sidebar {
            width: 280px;
            background: var(--bg-sidebar);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--border-light);
            padding: 2rem 0;
            position: fixed;
            height: calc(100vh - 100px);
            overflow-y: auto;
        }
        .sidebar-menu {
            list-style: none;
            padding: 0 1rem;
        }
        .sidebar-menu li {
            margin-bottom: 0.5rem;
        }
        .sidebar-menu a {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: var(--text-secondary);
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        .sidebar-menu a:hover,
        .sidebar-menu a.active {
            background: var(--primary-white);
            color: var(--text-primary);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .content {
            flex: 1;
            margin-left: 280px;
            padding: 2rem;
        }
        .welcome-section {
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: 3rem;
            text-align: center;
            margin-bottom: 2rem;
        }
        .welcome-section h2 {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }
        .welcome-section p {
            font-size: 1.1rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .alliance-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        .stat-card {
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
        }
        .stat-number {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }
        .stat-label {
            color: var(--text-secondary);
            font-weight: 500;
        }
        .chat-interface {
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-light);
            border-radius: 12px;
            height: 500px;
            display: flex;
            flex-direction: column;
        }
        .chat-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-light);
            font-weight: 600;
            color: var(--text-primary);
        }
        .chat-messages {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
        }
        .message {
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: var(--primary-white);
            border-radius: 8px;
            border: 1px solid var(--border-light);
        }
        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        .message-author {
            font-weight: 600;
            color: var(--text-primary);
        }
        .message-time {
            font-size: 0.8rem;
            color: var(--text-light);
        }
        .message-content {
            color: var(--text-secondary);
        }
        .chat-input {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-light);
            display: flex;
            gap: 1rem;
        }
        .chat-input input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid var(--border-light);
            border-radius: 6px;
            font-family: 'Inter', sans-serif;
        }
        .btn {
            padding: 0.75rem 1.5rem;
            background: var(--primary-black);
            color: var(--primary-white);
            border: none;
            border-radius: 6px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: var(--dark-gray);
        }
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            .content {
                margin-left: 0;
            }
            .alliance-info {
                flex-direction: column;
                text-align: center;
                gap: 0.5rem;
            }
            .alliance-details h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="alliance-info">
                <div class="alliance-logo emoji">🐺</div>
                <div class="alliance-details">
                    <h1>WOLF REGION FORCE</h1>
                    <div class="alliance-game-info">
                        <div class="game-info-item">
                            <span class="info-label">Oyun:</span>
                            <span>Lords Mobile</span>
                        </div>
                        <div class="game-info-item">
                            <span class="info-label">Sunucu:</span>
                            <span>K141</span>
                        </div>
                        <div class="game-info-item">
                            <span class="info-label">Üyeler:</span>
                            <span>100/100</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="language-selector">
                <div class="custom-select">
                    <div class="select-selected">
                        <img src="türkçe.png" alt="TR" class="flag-icon" onerror="this.style.display='none'">
                        <span>TR</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="main-container">
        <nav class="sidebar">
            <ul class="sidebar-menu">
                <li><a href="#" class="active" onclick="showWelcome()">🏠 Ana Sayfa</a></li>
                <li><a href="#" onclick="showChat()">💬 Genel Sohbet</a></li>
                <li><a href="#" onclick="showR4Chat()">🔒 R4 Sohbet</a></li>
                <li><a href="#" onclick="showSeasons()">📸 Yeni Sezon</a></li>
                <li><a href="#" onclick="showPolls()">📊 Oylamalar</a></li>
                <li><a href="#" onclick="showRules()">📋 İttifak Kuralları</a></li>
                <li><a href="#" onclick="showMembers()">👥 Üyeler</a></li>
                <li><a href="/">🚪 Ana Sayfaya Dön</a></li>
            </ul>
        </nav>

        <main class="content">
            <div id="welcomeContent">
                <div class="welcome-section">
                    <h2>🐺 WOLF REGION FORCE'a Hoş Geldiniz!</h2>
                    <p>Kurtlar sürü halinde avlanır! Lords Mobile K141 sunucusunda güçlü ittifakımızın bir parçasısınız.</p>
                    
                    <div class="alliance-stats">
                        <div class="stat-card">
                            <div class="stat-number">100</div>
                            <div class="stat-label">Toplam Üye</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">15</div>
                            <div class="stat-label">R4 Üyesi</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">2.5M</div>
                            <div class="stat-label">Güç</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">K141</div>
                            <div class="stat-label">Sunucu</div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="chatContent" style="display: none;">
                <div class="chat-interface">
                    <div class="chat-header">💬 Genel Sohbet</div>
                    <div class="chat-messages">
                        <div class="message">
                            <div class="message-header">
                                <span class="message-author">WolfLeader</span>
                                <span class="message-time">10:30</span>
                            </div>
                            <div class="message-content">Herkese merhaba! Bugün guild fest var, katılım sağlayalım.</div>
                        </div>
                        <div class="message">
                            <div class="message-header">
                                <span class="message-author">AlphaWolf</span>
                                <span class="message-time">10:32</span>
                            </div>
                            <div class="message-content">Tamam lider, hazırım! 💪</div>
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" placeholder="Mesajınızı yazın...">
                        <button class="btn">Gönder</button>
                    </div>
                </div>
            </div>

            <div id="r4Content" style="display: none;">
                <div class="chat-interface">
                    <div class="chat-header">🔒 R4 Özel Sohbet</div>
                    <div class="chat-messages">
                        <div class="message">
                            <div class="message-header">
                                <span class="message-author">WolfLeader</span>
                                <span class="message-time">09:15</span>
                            </div>
                            <div class="message-content">R4'ler, yarın saldırı planımızı konuşalım.</div>
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" placeholder="R4 mesajı...">
                        <button class="btn">Gönder</button>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        function showWelcome() {
            hideAllContent();
            document.getElementById('welcomeContent').style.display = 'block';
            updateActiveMenu(0);
        }

        function showChat() {
            hideAllContent();
            document.getElementById('chatContent').style.display = 'block';
            updateActiveMenu(1);
        }

        function showR4Chat() {
            hideAllContent();
            document.getElementById('r4Content').style.display = 'block';
            updateActiveMenu(2);
        }

        function showSeasons() {
            hideAllContent();
            alert('Yeni Sezon özelliği yakında gelecek!');
        }

        function showPolls() {
            hideAllContent();
            alert('Oylama özelliği yakında gelecek!');
        }

        function showRules() {
            hideAllContent();
            alert('İttifak Kuralları yakında gelecek!');
        }

        function showMembers() {
            hideAllContent();
            alert('Üye listesi yakında gelecek!');
        }

        function hideAllContent() {
            document.getElementById('welcomeContent').style.display = 'none';
            document.getElementById('chatContent').style.display = 'none';
            document.getElementById('r4Content').style.display = 'none';
        }

        function updateActiveMenu(index) {
            const menuItems = document.querySelectorAll('.sidebar-menu a');
            menuItems.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        // Initialize
        showWelcome();
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
    <title>Giriş - Alliance HQ</title>
    <link rel="icon" type="image/png" href="logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 3rem;
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            font-size: 4rem;
        }
        h1 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 2rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-family: 'Inter', sans-serif;
        }
        input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        .btn {
            width: 100%;
            padding: 0.75rem;
            background: white;
            color: black;
            border: none;
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 1rem;
        }
        .btn:hover {
            background: #f0f0f0;
            transform: translateY(-1px);
        }
        .links {
            text-align: center;
        }
        .links a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            margin: 0 1rem;
        }
        .links a:hover {
            color: white;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">🎮</div>
        <h1>Alliance HQ</h1>
        <p class="subtitle">İttifakınıza giriş yapın</p>
        
        <form>
            <div class="form-group">
                <label>E-posta</label>
                <input type="email" placeholder="ornek@email.com" required>
            </div>
            <div class="form-group">
                <label>Şifre</label>
                <input type="password" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn">Giriş Yap</button>
        </form>
        
        <div class="links">
            <a href="/register.html">Kayıt Ol</a>
            <a href="/">Ana Sayfa</a>
        </div>
        
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.2);">
            <p style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">Demo Giriş:</p>
            <p style="color: rgba(255,255,255,0.7); font-size: 0.8rem;">mertergin94@hotmail.com / Abana1905</p>
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
    <title>Kayıt Ol - Alliance HQ</title>
    <link rel="icon" type="image/png" href="logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
        }
        .register-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 3rem;
            width: 100%;
            max-width: 500px;
            text-align: center;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            font-size: 4rem;
        }
        h1 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 2rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        input, select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-family: 'Inter', sans-serif;
        }
        input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        select option {
            background: #1a1a1a;
            color: white;
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .btn {
            width: 100%;
            padding: 0.75rem;
            background: white;
            color: black;
            border: none;
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 1rem;
        }
        .btn:hover {
            background: #f0f0f0;
            transform: translateY(-1px);
        }
        .links {
            text-align: center;
        }
        .links a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            margin: 0 1rem;
        }
        .links a:hover {
            color: white;
        }
        .info-text {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.8);
        }
        @media (max-width: 600px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="register-container">
        <div class="logo">🎮</div>
        <h1>Alliance HQ</h1>
        <p class="subtitle">Yeni ittifak oluşturun veya mevcut ittifaka katılın</p>
        
        <div class="info-text">
            <strong>Nasıl çalışır?</strong><br>
            • İlk kayıt olan kişi ittifak sunucusunu kurar (Lider olur)<br>
            • Diğer kişiler aynı sunucu adını yazarak ittifaka katılır
        </div>
        
        <form>
            <div class="form-group">
                <label>İttifak Sunucu Adı</label>
                <input type="text" placeholder="Örn: WOLF-REGION-FORCE" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Ad</label>
                    <input type="text" placeholder="Adınız" required>
                </div>
                <div class="form-group">
                    <label>Soyad</label>
                    <input type="text" placeholder="Soyadınız" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Oyuncu Adı (Nick)</label>
                <input type="text" placeholder="Oyun içi adınız" required>
            </div>
            
            <div class="form-group">
                <label>E-posta</label>
                <input type="email" placeholder="ornek@email.com" required>
            </div>
            
            <div class="form-group">
                <label>Şifre</label>
                <input type="password" placeholder="••••••••" required>
            </div>
            
            <div class="form-group">
                <label>Oyun Bilgileri</label>
                <select required>
                    <option value="">Oyun seçin</option>
                    <option value="lords-mobile">Lords Mobile</option>
                    <option value="rise-of-kingdoms">Rise of Kingdoms</option>
                    <option value="state-of-survival">State of Survival</option>
                    <option value="other">Diğer</option>
                </select>
            </div>
            
            <button type="submit" class="btn">Kayıt Ol</button>
        </form>
        
        <div class="links">
            <a href="/login.html">Giriş Yap</a>
            <a href="/">Ana Sayfa</a>
        </div>
    </div>
</body>
</html>`);
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