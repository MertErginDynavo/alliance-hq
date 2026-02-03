const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Alliance = require('../models/Alliance');
const auth = require('../middleware/auth');

const router = express.Router();

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

// MongoDB bağlantısı kontrolü
function isDatabaseAvailable() {
  try {
    return require('mongoose').connection.readyState === 1;
  } catch (error) {
    return false;
  }
}

// Kayıt ol
router.post('/register', upload.single('profileImage'), async (req, res) => {
  try {
    // Database bağlantısı kontrolü
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Veritabanı bağlantısı mevcut değil. Lütfen daha sonra tekrar deneyin.'
      });
    }

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
      nickname: nickname || username,
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
      message: 'Sunucu hatası: ' + error.message
    });
  }
});

// Giriş yap
router.post('/login', async (req, res) => {
  try {
    // Database bağlantısı kontrolü
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Veritabanı bağlantısı mevcut değil. Lütfen daha sonra tekrar deneyin.'
      });
    }

    const { email, password } = req.body;

    // Kullanıcıyı bul
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
      message: 'Sunucu hatası: ' + error.message
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
        const oldImagePath = path.join(__dirname, '../public', user.profileImage);
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



module.exports = router;