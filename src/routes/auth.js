const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Alliance = require('../models/Alliance');
const auth = require('../middleware/auth');

const router = express.Router();

// Demo kullanıcı verileri (MongoDB olmadan test için)
const demoUsers = {
  'mertergin94@hotmail.com': {
    id: 'demo-user-1',
    username: 'mertergin94',
    nickname: 'Mert',
    email: 'mertergin94@hotmail.com',
    password: 'Abana1905',
    profileImage: null,
    preferredLanguage: 'tr',
    gameInfo: {
      gameName: 'Dark War',
      serverId: '141',
      serverName: 'TR141'
    },
    allianceServer: 'WOLF-REGION',
    alliances: [{
      allianceId: 'demo-alliance-1',
      role: 'leader',
      joinedAt: new Date()
    }],
    isOnline: false,
    lastSeen: new Date()
  }
};

const demoAlliances = {
  'demo-alliance-1': {
    _id: 'demo-alliance-1',
    serverName: 'WOLF-REGION',
    name: 'WOLF REGION FORCE',
    tag: 'WLF',
    description: 'Kurtlar sürü halinde avlanır! Güçlü ve birleşik ittifak.',
    gameInfo: {
      gameName: 'Dark War',
      serverId: '141',
      serverName: 'TR141'
    },
    leader: 'demo-user-1',
    members: [{
      userId: 'demo-user-1',
      role: 'leader',
      joinedAt: new Date()
    }],
    stats: {
      totalMembers: 1,
      totalMessages: 0,
      totalPolls: 0
    },
    logo: 'WLF.png',
    inviteCode: 'WLF2024',
    rules: [
      {
        title: 'Aktivite Gereksinimi',
        description: 'Haber vermeden 2 günden fazla çevrimdışı kalırsanız takımdan çıkarılabilirsiniz',
        icon: '⏰',
        color: '#e74c3c'
      },
      {
        title: 'Günlük Bağışlar',
        description: 'Her gün ittifak teknolojisine düzenli olarak bağış yapmalısınız',
        icon: '💰',
        color: '#f39c12'
      },
      {
        title: 'Takım Dayanışması',
        description: 'Takım içinde yardımlaşma ve dayanışma önemlidir',
        icon: '🤝',
        color: '#27ae60'
      },
      {
        title: 'Düello Performansı',
        description: 'Düello günlerinde en az 2M puan yapılmalıdır',
        icon: '⚔️',
        color: '#9b59b6'
      }
    ],
    channels: [
      {
        name: 'Genel',
        type: 'general',
        description: 'Genel sohbet kanalı'
      },
      {
        name: 'Duyurular',
        type: 'announcements',
        description: 'Önemli duyurular'
      },
      {
        name: 'R4 Sohbet',
        type: 'r4-chat',
        description: 'Liderlik sohbet kanalı',
        isPrivate: true,
        accessCode: 'R4WOLF'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// Demo mesajlar
const demoMessages = {
  'general': [
    {
      _id: 'msg-1',
      content: 'İttifak sohbetine hoş geldiniz!',
      author: {
        nickname: 'Mert',
        username: 'mertergin94'
      },
      channel: 'general',
      createdAt: new Date(Date.now() - 3600000), // 1 saat önce
      translatedContent: null,
      originalLanguage: 'tr'
    },
    {
      _id: 'msg-2',
      content: 'Bugünkü saldırı planımızı konuşalım',
      author: {
        nickname: 'Mert',
        username: 'mertergin94'
      },
      channel: 'general',
      createdAt: new Date(Date.now() - 1800000), // 30 dakika önce
      translatedContent: null,
      originalLanguage: 'tr'
    }
  ],
  'r4-chat': [
    {
      _id: 'msg-r4-1',
      content: 'R4 kanalına hoş geldiniz. Bu kanal sadece liderler içindir.',
      author: {
        nickname: 'Mert',
        username: 'mertergin94'
      },
      channel: 'r4-chat',
      createdAt: new Date(Date.now() - 7200000), // 2 saat önce
      translatedContent: null,
      originalLanguage: 'tr'
    }
  ]
};

// Demo sezonlar
const demoSeasons = [
  {
    _id: 'season-1',
    title: 'Sezon 5: Efsanelerin Yükselişi',
    description: 'Şimdiye kadarki en epik sezon! Yeni kahramanlar, efsanevi silahlar ve büyük savaşlar sizi bekliyor.',
    startDate: new Date('2024-12-15'),
    endDate: new Date('2025-01-15'),
    status: 'active',
    createdBy: {
      nickname: 'Mert',
      username: 'mertergin94'
    },
    images: [],
    views: 1247,
    createdAt: new Date(Date.now() - 172800000) // 2 gün önce
  }
];

// MongoDB bağlantısı kontrolü
function isDatabaseAvailable() {
  // MongoDB bağlantısı varsa true, yoksa false döner
  try {
    return require('mongoose').connection.readyState === 1;
  } catch (error) {
    return false;
  }
}

// Multer configuration for profile image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Kayıt ol
router.post('/register', upload.single('profileImage'), async (req, res) => {
  try {
    const { username, nickname, email, password, preferredLanguage, allianceServer } = req.body;
    
    // Parse gameInfo if it's a string
    let gameInfo = {};
    if (req.body.gameInfo) {
      try {
        gameInfo = JSON.parse(req.body.gameInfo);
      } catch (e) {
        gameInfo = req.body.gameInfo;
      }
    }

    // Kullanıcı kontrolü
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      // Delete uploaded file if user already exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Bu email veya kullanıcı adı zaten kullanılıyor'
      });
    }

    // İttifak sunucu kontrolü
    let alliance = await Alliance.findOne({ serverName: allianceServer });
    let isLeader = false;

    if (!alliance) {
      // İlk kullanıcı - ittifak sunucusu oluştur
      isLeader = true;
    }

    // Profile image path
    let profileImagePath = null;
    if (req.file) {
      profileImagePath = `/uploads/profiles/${req.file.filename}`;
    }

    // Yeni kullanıcı oluştur
    const user = new User({
      username,
      nickname,
      email,
      password,
      profileImage: profileImagePath,
      preferredLanguage: preferredLanguage || 'tr',
      gameInfo: gameInfo || {},
      allianceServer
    });

    await user.save();

    if (isLeader) {
      // İttifak sunucusu oluştur
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      alliance = new Alliance({
        serverName: allianceServer,
        name: allianceServer + ' Alliance',
        tag: allianceServer.substring(0, 5).toUpperCase(),
        description: `${allianceServer} sunucusunun resmi ittifakı`,
        gameInfo: {
          gameName: gameInfo.gameName || 'Unknown Game',
          serverId: gameInfo.serverId || allianceServer,
          serverName: allianceServer
        },
        leader: user._id,
        members: [{
          userId: user._id,
          role: 'leader',
          joinedAt: new Date()
        }],
        inviteCode: inviteCode,
        rules: [
          {
            title: 'Saygı Kuralı',
            description: 'Tüm üyelere saygılı davranın',
            icon: '🤝',
            color: '#3498db'
          },
          {
            title: 'Aktif Katılım',
            description: 'İttifak etkinliklerine aktif katılım gösterin',
            icon: '⚡',
            color: '#e74c3c'
          },
          {
            title: 'Yardımlaşma',
            description: 'Diğer üyelere yardım edin',
            icon: '🛡️',
            color: '#27ae60'
          }
        ],
        channels: [
          {
            name: 'Genel',
            type: 'general',
            description: 'Genel sohbet kanalı',
            permissions: {
              canWrite: ['leader', 'officer', 'member'],
              canRead: ['leader', 'officer', 'member']
            },
            createdBy: user._id
          },
          {
            name: 'Duyurular',
            type: 'announcements',
            description: 'Önemli duyurular',
            permissions: {
              canWrite: ['leader', 'officer'],
              canRead: ['leader', 'officer', 'member']
            },
            createdBy: user._id
          },
          {
            name: 'R4 Sohbet',
            type: 'private',
            description: 'Liderlik sohbet kanalı',
            isPrivate: true,
            accessCode: 'R4' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            authorizedUsers: [{
              userId: user._id,
              authorizedBy: user._id
            }],
            permissions: {
              canWrite: ['leader', 'officer'],
              canRead: ['leader', 'officer']
            },
            createdBy: user._id
          }
        ]
      });

      await alliance.save();

      // Kullanıcının ittifak bilgisini güncelle
      user.alliances = [{
        allianceId: alliance._id,
        role: 'leader',
        joinedAt: new Date()
      }];
      await user.save();
    } else {
      // Mevcut ittifaka katıl
      alliance.members.push({
        userId: user._id,
        role: 'member',
        joinedAt: new Date()
      });
      
      // İstatistikleri güncelle
      alliance.stats.totalMembers = alliance.members.length;
      await alliance.save();

      // Kullanıcının ittifak bilgisini güncelle
      user.alliances = [{
        allianceId: alliance._id,
        role: 'member',
        joinedAt: new Date()
      }];
      await user.save();
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: isLeader ? 'İttifak sunucusu oluşturuldu ve kayıt başarılı' : 'İttifaka katıldınız ve kayıt başarılı',
      token,
      isLeader,
      allianceId: alliance._id,
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        profileImage: user.profileImage,
        preferredLanguage: user.preferredLanguage,
        gameInfo: user.gameInfo,
        allianceServer: user.allianceServer,
        alliances: user.alliances
      }
    });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Kayıt hatası:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Giriş yap
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // MongoDB yoksa demo kullanıcı sistemi kullan
    if (!isDatabaseAvailable()) {
      const demoUser = demoUsers[email];
      
      if (!demoUser || demoUser.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz email veya şifre'
        });
      }

      // Demo JWT token oluştur
      const token = jwt.sign(
        { userId: demoUser.id, isDemo: true },
        process.env.JWT_SECRET || 'demo-secret-key',
        { expiresIn: '7d' }
      );

      // Demo ittifak bilgisi
      const allianceInfo = {
        id: demoUser.alliances[0].allianceId,
        name: demoAlliances[demoUser.alliances[0].allianceId].name,
        serverName: demoAlliances[demoUser.alliances[0].allianceId].serverName,
        role: demoUser.alliances[0].role
      };

      return res.json({
        success: true,
        message: 'Demo giriş başarılı',
        token,
        alliance: allianceInfo,
        user: {
          id: demoUser.id,
          username: demoUser.username,
          nickname: demoUser.nickname,
          email: demoUser.email,
          profileImage: demoUser.profileImage,
          preferredLanguage: demoUser.preferredLanguage,
          gameInfo: demoUser.gameInfo,
          allianceServer: demoUser.allianceServer,
          alliances: demoUser.alliances
        }
      });
    }

    // Normal MongoDB işlemi
    const user = await User.findOne({ email }).populate('alliances.allianceId');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Şifre kontrolü
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Kullanıcıyı online yap
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Kullanıcının ittifak bilgisini al
    let allianceInfo = null;
    if (user.alliances && user.alliances.length > 0) {
      const alliance = user.alliances[0].allianceId;
      if (alliance) {
        allianceInfo = {
          id: alliance._id,
          name: alliance.name,
          serverName: alliance.serverName,
          role: user.alliances[0].role
        };
      }
    }

    res.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      alliance: allianceInfo,
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        profileImage: user.profileImage,
        preferredLanguage: user.preferredLanguage,
        gameInfo: user.gameInfo,
        allianceServer: user.allianceServer,
        alliances: user.alliances
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Profil bilgilerini getir
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('alliances.allianceId', 'name tag');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Profil güncelle
router.put('/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const { username, nickname, preferredLanguage } = req.body;
    
    // Parse gameInfo if it's a string
    let gameInfo = {};
    if (req.body.gameInfo) {
      try {
        gameInfo = JSON.parse(req.body.gameInfo);
      } catch (e) {
        gameInfo = req.body.gameInfo;
      }
    }
    
    const user = await User.findById(req.userId);
    
    if (username) user.username = username;
    if (nickname) user.nickname = nickname;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (gameInfo) user.gameInfo = { ...user.gameInfo, ...gameInfo };
    
    // Handle profile image update
    if (req.file) {
      // Delete old profile image if exists
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, '../../public', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'Profil güncellendi',
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        profileImage: user.profileImage,
        preferredLanguage: user.preferredLanguage,
        gameInfo: user.gameInfo
      }
    });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Çıkış yap
router.post('/logout', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Çıkış yapıldı'
    });
  } catch (error) {
    console.error('Çıkış hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Demo API endpoint'leri (MongoDB olmadan test için) - Kimlik doğrulama gerektirmez
router.get('/demo/alliance/:id', (req, res) => {
  const allianceId = req.params.id;
  const alliance = demoAlliances[allianceId];
  
  if (!alliance) {
    return res.status(404).json({
      success: false,
      message: 'İttifak bulunamadı'
    });
  }
  
  res.json({
    success: true,
    alliance: alliance
  });
});

router.get('/demo/alliance/:id/messages/:channel', (req, res) => {
  const { channel } = req.params;
  const messages = demoMessages[channel] || [];
  
  res.json({
    success: true,
    messages: messages
  });
});

router.post('/demo/alliance/:id/messages', (req, res) => {
  const { content, channel } = req.body;
  const { id } = req.params;
  
  // Demo mesaj oluştur
  const newMessage = {
    _id: 'msg-' + Date.now(),
    content: content,
    author: {
      nickname: 'Mert',
      username: 'mertergin94'
    },
    channel: channel,
    createdAt: new Date(),
    translatedContent: null,
    originalLanguage: 'tr'
  };
  
  // Demo mesajları güncelle
  if (!demoMessages[channel]) {
    demoMessages[channel] = [];
  }
  demoMessages[channel].push(newMessage);
  
  res.json({
    success: true,
    message: newMessage
  });
});

router.post('/demo/alliance/:id/r4-access', (req, res) => {
  const { accessCode } = req.body;
  const validCodes = ['R4WOLF', 'ELITE1', 'SECRET'];
  
  if (validCodes.includes(accessCode.toUpperCase())) {
    res.json({
      success: true,
      message: 'Erişim onaylandı'
    });
  } else {
    res.json({
      success: false,
      message: 'Geçersiz kod'
    });
  }
});

router.get('/demo/alliance/:id/seasons', (req, res) => {
  res.json({
    success: true,
    seasons: demoSeasons
  });
});

module.exports = router;