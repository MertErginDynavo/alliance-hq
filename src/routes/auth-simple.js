const express = require('express');
const jwt = require('jsonwebtoken');
const SimpleUser = require('../models/SimpleUser');
const SimpleAlliance = require('../models/SimpleAlliance');

const router = express.Router();

// Kayıt ol
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, allianceServer } = req.body;
    
    console.log('📝 Registration attempt:', { username, email, allianceServer });

    // Kullanıcı kontrolü
    const existingUserByEmail = await SimpleUser.findOne({ email });
    const existingUserByUsername = await SimpleUser.findOne({ username });
    
    if (existingUserByEmail || existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: 'Bu email veya kullanıcı adı zaten kullanılıyor'
      });
    }

    // İttifak sunucu kontrolü
    let alliance = await SimpleAlliance.findOne({ serverName: allianceServer });
    let isLeader = false;

    if (!alliance) {
      // İlk kullanıcı - ittifak sunucusu oluştur
      isLeader = true;
      console.log('🏆 Creating new alliance for:', allianceServer);
    }

    // Yeni kullanıcı oluştur
    const userData = {
      username,
      nickname: username,
      email,
      password,
      preferredLanguage: 'tr',
      gameInfo: {},
      allianceServer,
      alliances: []
    };

    const user = await SimpleUser.create(userData);
    console.log('✅ User created:', user.id);

    if (isLeader) {
      // İttifak sunucusu oluştur
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const allianceData = {
        serverName: allianceServer,
        name: allianceServer + ' Alliance',
        tag: allianceServer.substring(0, 5).toUpperCase(),
        description: `${allianceServer} sunucusunun resmi ittifakı`,
        gameInfo: {
          gameName: 'Strategy Game',
          serverId: allianceServer,
          serverName: allianceServer
        },
        leader: user.id,
        members: [{
          userId: user.id,
          role: 'leader',
          joinedAt: new Date().toISOString()
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
            createdBy: user.id
          }
        ]
      };

      alliance = await SimpleAlliance.create(allianceData);
      console.log('🏰 Alliance created:', alliance.id);

      // Kullanıcının ittifak bilgisini güncelle
      user.alliances = [{
        allianceId: alliance.id,
        role: 'leader',
        joinedAt: new Date().toISOString()
      }];
      await user.save();
    } else {
      // Mevcut ittifaka katıl
      alliance.addMember(user.id, 'member');
      await alliance.save();

      // Kullanıcının ittifak bilgisini güncelle
      user.alliances = [{
        allianceId: alliance.id,
        role: 'member',
        joinedAt: new Date().toISOString()
      }];
      await user.save();
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    console.log('🎉 Registration successful for:', username);

    res.status(201).json({
      success: true,
      message: isLeader ? 'İttifak sunucusu oluşturuldu ve kayıt başarılı' : 'İttifaka katıldınız ve kayıt başarılı',
      token,
      isLeader,
      allianceId: alliance.id,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + error.message
    });
  }
});

// Giriş yap
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔑 Login attempt:', email);

    // Kullanıcıyı bul
    const user = await SimpleUser.findOne({ email });
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
    user.lastSeen = new Date().toISOString();
    await user.save();

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    // Kullanıcının ittifak bilgisini al
    let allianceInfo = null;
    if (user.alliances && user.alliances.length > 0) {
      const alliance = await SimpleAlliance.findById(user.alliances[0].allianceId);
      if (alliance) {
        allianceInfo = {
          id: alliance.id,
          name: alliance.name,
          serverName: alliance.serverName,
          role: user.alliances[0].role
        };
      }
    }

    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      alliance: allianceInfo,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + error.message
    });
  }
});

// Profil bilgilerini getir
router.get('/profile', async (req, res) => {
  try {
    // Basit auth check (normalde middleware kullanılır)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token gerekli' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const user = await SimpleUser.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Çıkış yap
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      const user = await SimpleUser.findById(decoded.userId);
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date().toISOString();
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Çıkış yapıldı'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;