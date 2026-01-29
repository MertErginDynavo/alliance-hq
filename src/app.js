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

// Static files - serve from both src/public and root public directories
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// PNG files are now served by static middleware above
// No need for custom PNG route since files are in public directory

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
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
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
            --medium-gray: #2d2d2d;
            --light-gray: #f8f9fa;
            --accent-blue: #1e40af;
            --metallic-gray: #6b7280;
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
            overflow-x: hidden;
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
            transition: all 0.3s ease;
        }
        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 2rem;
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
        .nav-menu {
            display: flex;
            list-style: none;
            gap: 2.5rem;
            align-items: center;
        }
        .nav-menu a {
            color: var(--text-secondary);
            text-decoration: none;
            font-weight: 500;
            font-size: 0.95rem;
            transition: color 0.3s ease;
            letter-spacing: -0.01em;
        }
        .nav-menu a:hover {
            color: var(--text-primary);
        }
        .nav-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .language-selector {
            position: relative;
            z-index: 1001;
        }
        .custom-select {
            position: relative;
            display: inline-block;
            min-width: 100px;
        }
        .select-selected {
            background: var(--primary-white);
            color: var(--text-secondary);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 6px;
            padding: 8px 30px 8px 12px;
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        .select-selected:hover {
            border-color: var(--accent-blue);
        }
        .select-selected::after {
            content: '▼';
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-light);
            font-size: 0.7rem;
            transition: transform 0.3s ease;
        }
        .custom-select.active .select-selected::after {
            transform: translateY(-50%) rotate(180deg);
        }
        .select-items {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--primary-white);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            margin-top: 4px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 9999;
            display: none;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        .custom-select.active .select-items {
            display: block;
        }
        .select-items div {
            padding: 12px 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-secondary);
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
            font-weight: 500;
            transition: background 0.3s ease;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        .select-items div:last-child {
            border-bottom: none;
        }
        .select-items div:hover {
            background: var(--light-gray);
            color: var(--text-primary);
        }
        .flag-icon {
            width: 18px;
            height: 14px;
            object-fit: cover;
            border-radius: 2px;
            flex-shrink: 0;
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
            letter-spacing: -0.01em;
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
            background: var(--primary-white);
            position: relative;
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
            color: var(--text-primary);
        }
        .hero-subtitle {
            font-size: 1.5rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 2rem;
            letter-spacing: -0.01em;
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
        .section {
            padding: 100px 2rem;
        }
        .section-container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .section-header {
            text-align: center;
            margin-bottom: 80px;
        }
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--text-primary);
            letter-spacing: -0.02em;
        }
        .section-subtitle {
            font-size: 1.2rem;
            color: var(--text-secondary);
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 3rem;
            margin-top: 4rem;
        }
        .feature-card {
            background: var(--primary-white);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            padding: 2.5rem;
            text-align: center;
            transition: all 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }
        .feature-icon {
            width: 60px;
            height: 60px;
            background: var(--primary-black);
            color: var(--primary-white);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin: 0 auto 1.5rem;
        }
        .feature-title {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }
        .feature-description {
            color: var(--text-secondary);
            line-height: 1.6;
        }
        .stats-section {
            background: var(--dark-gray);
            color: var(--primary-white);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 3rem;
            text-align: center;
        }
        .stat-item {
            padding: 2rem;
        }
        .stat-number {
            font-family: 'Playfair Display', serif;
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            color: var(--primary-white);
        }
        .stat-label {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
        }
        .cta-section {
            background: var(--light-gray);
            text-align: center;
        }
        .cta-content {
            max-width: 800px;
            margin: 0 auto;
        }
        .cta-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: var(--text-primary);
        }
        .cta-description {
            font-size: 1.2rem;
            color: var(--text-secondary);
            margin-bottom: 2.5rem;
            line-height: 1.6;
        }
        .footer {
            background: var(--primary-black);
            color: var(--primary-white);
            padding: 60px 2rem 30px;
        }
        .footer-container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .footer-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 3rem;
            margin-bottom: 3rem;
        }
        .footer-section h3 {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--primary-white);
        }
        .footer-section p,
        .footer-section a {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            line-height: 1.6;
            font-size: 0.95rem;
        }
        .footer-section a:hover {
            color: var(--primary-white);
        }
        .footer-bottom {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 2rem;
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
        }
        .mobile-menu-toggle {
            display: none;
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-primary);
            cursor: pointer;
        }
        @media (max-width: 768px) {
            .mobile-menu-toggle { display: block; }
            .nav-menu { display: none; }
            .nav-actions .btn { display: none; }
            .hero h1 { font-size: 3rem; }
            .hero-subtitle { font-size: 1.2rem; }
            .hero-description { font-size: 1rem; }
            .hero-actions { flex-direction: column; align-items: center; }
            .btn-hero { width: 100%; max-width: 300px; }
            .section { padding: 60px 1rem; }
            .section-title { font-size: 2.2rem; }
            .features-grid { grid-template-columns: 1fr; gap: 2rem; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
            .cta-title { font-size: 2.2rem; }
        }
        @media (max-width: 480px) {
            .nav-container { padding: 1rem; }
            .hero { padding: 100px 1rem 60px; }
            .hero h1 { font-size: 2.5rem; }
            .section { padding: 50px 1rem; }
            .feature-card { padding: 2rem; }
            .stats-grid { grid-template-columns: 1fr; }
        }
        .fade-in-up {
            opacity: 0;
            transform: translateY(30px);
            animation: fadeInUp 0.8s ease forwards;
        }
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .scroll-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s ease;
        }
        .scroll-animate.animate {
            opacity: 1;
            transform: translateY(0);
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
            
            <ul class="nav-menu">
                <li><a href="#about">Özellikler</a></li>
                <li><a href="#services">Diller</a></li>
                <li><a href="#partnerships">Demo</a></li>
                <li><a href="#contact">İletişim</a></li>
            </ul>
            
            <div class="nav-actions">
                <div class="language-selector">
                    <div class="custom-select" id="languageSelector" onclick="toggleLanguageSelector()">
                        <div class="select-selected">
                            <img src="türkçe.png" alt="TR" class="flag-icon" id="selectedFlag" onerror="this.style.display='none'">
                            <span id="selectedLang">TR</span>
                        </div>
                        <div class="select-items" id="selectItems">
                            <div onclick="selectLanguage('tr', 'TR', 'türkçe.png')">
                                <img src="türkçe.png" alt="TR" class="flag-icon" onerror="this.style.display='none'">
                                <span>Türkçe</span>
                            </div>
                            <div onclick="selectLanguage('en', 'EN', 'İngilizce.png')">
                                <img src="İngilizce.png" alt="EN" class="flag-icon" onerror="this.style.display='none'">
                                <span>English</span>
                            </div>
                            <div onclick="selectLanguage('es', 'ES', 'Espanol.png')">
                                <img src="Espanol.png" alt="ES" class="flag-icon" onerror="this.style.display='none'">
                                <span>Español</span>
                            </div>
                            <div onclick="selectLanguage('de', 'DE', 'Deutsch.png')">
                                <img src="Deutsch.png" alt="DE" class="flag-icon" onerror="this.style.display='none'">
                                <span>Deutsch</span>
                            </div>
                            <div onclick="selectLanguage('zh', 'ZH', 'Çince.png')">
                                <img src="Çince.png" alt="ZH" class="flag-icon" onerror="this.style.display='none'">
                                <span>中文</span>
                            </div>
                            <div onclick="selectLanguage('fr', 'FR', 'Fransızca.png')">
                                <img src="Fransızca.png" alt="FR" class="flag-icon" onerror="this.style.display='none'">
                                <span>Français</span>
                            </div>
                            <div onclick="selectLanguage('ru', 'RU', 'Rusça.png')">
                                <img src="Rusça.png" alt="RU" class="flag-icon" onerror="this.style.display='none'">
                                <span>Русский</span>
                            </div>
                            <div onclick="selectLanguage('ar', 'AR', 'Arapça.png')">
                                <img src="Arapça.png" alt="AR" class="flag-icon" onerror="this.style.display='none'">
                                <span>العربية</span>
                            </div>
                            <div onclick="selectLanguage('ja', 'JA', 'Japonca.png')">
                                <img src="Japonca.png" alt="JA" class="flag-icon" onerror="this.style.display='none'">
                                <span>日本語</span>
                            </div>
                            <div onclick="selectLanguage('ko', 'KO', 'Korece.png')">
                                <img src="Korece.png" alt="KO" class="flag-icon" onerror="this.style.display='none'">
                                <span>한국어</span>
                            </div>
                        </div>
                    </div>
                </div>
                <a href="/demo.html" class="btn btn-secondary">🎮 Demo</a>
                <a href="/login.html" class="btn btn-primary">Giriş Yap</a>
            </div>
            
            <button class="mobile-menu-toggle">☰</button>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-container">
            <img src="logo.png" alt="Alliance HQ Logo" class="hero-logo fade-in-up" onerror="this.style.display='none'">
            <h1 class="fade-in-up">Alliance HQ</h1>
            <p class="hero-subtitle fade-in-up">Oyun İttifakı İletişim Platformu</p>
            <p class="hero-description fade-in-up">
                Oyun ittifakınızdaki dil engellerini kaldırın. Gerçek zamanlı otomatik çeviri, özel ittifak alanları ve mobil strateji oyunları için tasarlanmış akıllı iletişim araçları.
            </p>
            
            <div class="hero-actions fade-in-up">
                <a href="/demo.html" class="btn btn-primary btn-hero">🎮 Demo Deneyin</a>
                <a href="/register.html" class="btn btn-secondary btn-hero">📝 Kayıt Olun</a>
            </div>
        </div>
    </section>

    <section class="section" id="about">
        <div class="section-container">
            <div class="section-header scroll-animate">
                <h2 class="section-title">Güçlü Özellikler</h2>
                <p class="section-subtitle">
                    Oyun ittifakınızı yönetmek ve üyelerinizle iletişim kurmak için ihtiyacınız olan her şey.
                </p>
            </div>
            
            <div class="features-grid">
                <div class="feature-card scroll-animate">
                    <div class="feature-icon">🌍</div>
                    <h3 class="feature-title">Gerçek Zamanlı Çeviri</h3>
                    <p class="feature-description">
                        Kendi dilinizde konuşun, diğerleri kendi dillerinde okusun. Sorunsuz küresel ittifak koordinasyonu için otomatik çeviri.
                    </p>
                </div>
                
                <div class="feature-card scroll-animate">
                    <div class="feature-icon">🔒</div>
                    <h3 class="feature-title">Özel İttifak Alanları</h3>
                    <p class="feature-description">
                        Rol tabanlı izinlerle ittifakınız için güvenli kanallar. Liderler, subaylar ve üyeler uygun erişime sahip.
                    </p>
                </div>
                
                <div class="feature-card scroll-animate">
                    <div class="feature-icon">📱</div>
                    <h3 class="feature-title">Mobil Optimize</h3>
                    <p class="feature-description">
                        Özellikle mobil strateji oyuncuları için tasarlandı. Telefon, tablet ve masaüstü bilgisayarlarda mükemmel çalışır.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <section class="section stats-section">
        <div class="section-container">
            <div class="stats-grid">
                <div class="stat-item scroll-animate">
                    <div class="stat-number">1,200+</div>
                    <div class="stat-label">Aktif İttifak</div>
                </div>
                <div class="stat-item scroll-animate">
                    <div class="stat-number">10</div>
                    <div class="stat-label">Desteklenen Dil</div>
                </div>
                <div class="stat-item scroll-animate">
                    <div class="stat-number">50K+</div>
                    <div class="stat-label">Günlük Mesaj</div>
                </div>
                <div class="stat-item scroll-animate">
                    <div class="stat-number">99.9%</div>
                    <div class="stat-label">Çalışma Süresi</div>
                </div>
            </div>
        </div>
    </section>

    <section class="section cta-section" id="contact">
        <div class="section-container">
            <div class="cta-content scroll-animate">
                <h2 class="cta-title">İttifakınızı Birleştirmeye Hazır mısınız?</h2>
                <p class="cta-description">
                    Sorunsuz iletişim için Alliance HQ kullanan binlerce oyun ittifakına katılın.
                </p>
                <div class="hero-actions">
                    <a href="/register.html" class="btn btn-primary btn-hero">İttifak Oluştur</a>
                    <a href="/demo.html" class="btn btn-secondary btn-hero">Demo Deneyin</a>
                </div>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="footer-container">
            <div class="footer-grid">
                <div class="footer-section">
                    <h3>Alliance HQ</h3>
                    <p>Alliance HQ oyun ittifaklarındaki dil engellerini kaldırır. Gerçek zamanlı çeviri, güvenli iletişim ve mobil strateji oyunları için akıllı araçlar.</p>
                </div>
                
                <div class="footer-section">
                    <h3>Özellikler</h3>
                    <p>Otomatik Çeviri • Özel Alanlar • Gerçek Zamanlı Sohbet • Akıllı Oylama • Mobil Optimize • 10 Dil</p>
                </div>
                
                <div class="footer-section">
                    <h3>Mükemmel Uyum</h3>
                    <p>Mobil Strateji Oyunları • Lords Mobile • Rise of Kingdoms • State of Survival • Herhangi Bir İttifak Tabanlı Oyun</p>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2026 Alliance HQ. Tüm hakları saklıdır. Oyun İttifakı İletişim Platformu.</p>
                <p style="margin-top: 1rem; opacity: 0.7;">
                    🚀 Durum: <strong>ONLINE</strong> | 
                    🗄️ Veritabanı: <strong>BAĞLI</strong> | 
                    🌐 Sunucu: <strong>Render.com</strong>
                </p>
            </div>
        </div>
    </footer>

    <script>
        function toggleLanguageSelector() {
            const selector = document.getElementById('languageSelector');
            selector.classList.toggle('active');
        }

        function selectLanguage(code, name, flag) {
            document.getElementById('selectedLang').textContent = name;
            document.getElementById('selectedFlag').src = flag;
            document.getElementById('languageSelector').classList.remove('active');
        }

        // Close language selector when clicking outside
        document.addEventListener('click', function(event) {
            const selector = document.getElementById('languageSelector');
            if (!selector.contains(event.target)) {
                selector.classList.remove('active');
            }
        });

        // Scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-animate').forEach(el => {
            observer.observe(el);
        });
    </script>
</body>
</html>`);
});

// Demo sayfası
app.get('/demo.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
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
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
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
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
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