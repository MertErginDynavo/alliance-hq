const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Alliance = require('../models/Alliance');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// İttifak logoları için multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/alliances';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'alliance-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece JPG, PNG ve GIF dosyaları yüklenebilir'));
    }
  }
});

// İttifak oluştur
router.post('/create', auth, async (req, res) => {
  try {
    const { name, tag, description, gameInfo, logo } = req.body;

    // Tag kontrolü
    const existingAlliance = await Alliance.findOne({ tag: tag.toUpperCase() });
    if (existingAlliance) {
      return res.status(400).json({
        success: false,
        message: 'Bu tag zaten kullanılıyor'
      });
    }

    // Varsayılan kanallar
    const defaultChannels = [
      {
        name: 'Duyurular',
        type: 'announcements',
        description: 'Önemli duyurular ve haberler',
        permissions: {
          canWrite: ['leader', 'officer'],
          canRead: ['leader', 'officer', 'member']
        }
      },
      {
        name: 'Genel Sohbet',
        type: 'general',
        description: 'Genel konuşmalar',
        permissions: {
          canWrite: ['leader', 'officer', 'member'],
          canRead: ['leader', 'officer', 'member']
        }
      },
      {
        name: 'Savaş & Strateji',
        type: 'war',
        description: 'Savaş planları ve stratejiler',
        permissions: {
          canWrite: ['leader', 'officer', 'member'],
          canRead: ['leader', 'officer', 'member']
        }
      },
      {
        name: 'Etkinlikler',
        type: 'events',
        description: 'Oyun etkinlikleri ve organizasyonlar',
        permissions: {
          canWrite: ['leader', 'officer'],
          canRead: ['leader', 'officer', 'member']
        }
      },
      {
        name: 'Medya',
        type: 'media',
        description: 'Fotoğraf ve dosya paylaşımı',
        permissions: {
          canWrite: ['leader', 'officer', 'member'],
          canRead: ['leader', 'officer', 'member']
        }
      }
    ];

    // Varsayılan kurallar
    const defaultRules = [
      {
        title: 'Activity Requirement',
        description: 'If you are offline for more than 2 days without notice, you may be removed from the team',
        icon: '⏰',
        color: '#e74c3c'
      },
      {
        title: 'Daily Donations',
        description: 'You must donate to alliance technology regularly every day',
        icon: '💰',
        color: '#f39c12'
      },
      {
        title: 'Team Solidarity',
        description: 'Help and solidarity within the team is important',
        icon: '🤝',
        color: '#27ae60'
      },
      {
        title: 'Duel Performance',
        description: 'At least 2M points must be made on duel days',
        icon: '⚔️',
        color: '#9b59b6'
      }
    ];

    // İttifak oluştur
    const alliance = new Alliance({
      name,
      tag: tag.toUpperCase(),
      description,
      gameInfo,
      logo: logo || null,
      rules: defaultRules,
      leader: req.userId,
      members: [{
        userId: req.userId,
        role: 'leader'
      }],
      inviteCode: uuidv4().substring(0, 8).toUpperCase(),
      channels: defaultChannels,
      settings: {
        allowedLanguages: [req.user.preferredLanguage]
      }
    });

    await alliance.save();

    // Kullanıcının ittifak listesine ekle
    await User.findByIdAndUpdate(req.userId, {
      $push: {
        alliances: {
          allianceId: alliance._id,
          role: 'leader'
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'İttifak başarıyla oluşturuldu',
      alliance: {
        id: alliance._id,
        name: alliance.name,
        tag: alliance.tag,
        inviteCode: alliance.inviteCode,
        role: 'leader'
      }
    });
  } catch (error) {
    console.error('İttifak oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// İttifaka katıl (davet kodu ile)
router.post('/join/:inviteCode', auth, async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const alliance = await Alliance.findOne({ inviteCode });
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'Geçersiz davet kodu'
      });
    }

    // Zaten üye mi kontrol et
    const isMember = alliance.members.some(member => 
      member.userId.toString() === req.userId.toString()
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'Zaten bu ittifakın üyesisiniz'
      });
    }

    // İttifaka ekle
    alliance.members.push({
      userId: req.userId,
      role: 'member'
    });

    await alliance.save();
    await alliance.updateMemberCount();

    // Kullanıcının ittifak listesine ekle
    await User.findByIdAndUpdate(req.userId, {
      $push: {
        alliances: {
          allianceId: alliance._id,
          role: 'member'
        }
      }
    });

    res.json({
      success: true,
      message: `${alliance.name} ittifakına başarıyla katıldınız`,
      alliance: {
        id: alliance._id,
        name: alliance.name,
        tag: alliance.tag,
        role: 'member'
      }
    });
  } catch (error) {
    console.error('İttifaka katılma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcının ittifaklarını listele
router.get('/my-alliances', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'alliances.allianceId',
        select: 'name tag description gameInfo stats'
      });

    const alliances = user.alliances.map(alliance => ({
      id: alliance.allianceId._id,
      name: alliance.allianceId.name,
      tag: alliance.allianceId.tag,
      description: alliance.allianceId.description,
      gameInfo: alliance.allianceId.gameInfo,
      role: alliance.role,
      joinedAt: alliance.joinedAt,
      stats: alliance.allianceId.stats
    }));

    res.json({
      success: true,
      alliances
    });
  } catch (error) {
    console.error('İttifak listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// İttifak detaylarını getir
router.get('/:allianceId', auth, async (req, res) => {
  try {
    const alliance = await Alliance.findById(req.params.allianceId)
      .populate('leader', 'username preferredLanguage gameInfo')
      .populate('officers', 'username preferredLanguage gameInfo')
      .populate('members.userId', 'username preferredLanguage gameInfo isOnline lastSeen');

    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Kullanıcının bu ittifakta üye olup olmadığını kontrol et
    const isMember = alliance.members.some(member => 
      member.userId._id.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bu ittifağa erişim yetkiniz yok'
      });
    }

    res.json({
      success: true,
      alliance
    });
  } catch (error) {
    console.error('İttifak detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Özel kanal oluştur
router.post('/:allianceId/channels/private', auth, async (req, res) => {
  try {
    const { allianceId } = req.params;
    const { channelName } = req.body;

    if (!channelName || channelName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Kanal adı en az 2 karakter olmalı'
      });
    }

    const alliance = await Alliance.findById(allianceId);
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Sadece lider ve subaylar özel kanal oluşturabilir
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Özel kanal oluşturma yetkiniz yok'
      });
    }

    // Aynı isimde kanal var mı kontrol et
    const existingChannel = alliance.channels.find(ch => 
      ch.name.toLowerCase() === channelName.trim().toLowerCase()
    );

    if (existingChannel) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir kanal zaten mevcut'
      });
    }

    const result = await alliance.createPrivateChannel(channelName.trim(), req.userId);

    res.status(201).json({
      success: true,
      message: 'Özel kanal başarıyla oluşturuldu',
      channel: result.channel,
      accessCode: result.accessCode
    });

  } catch (error) {
    console.error('Özel kanal oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Özel kanala giriş kodu ile erişim
router.post('/:allianceId/channels/join', auth, async (req, res) => {
  try {
    const { allianceId } = req.params;
    const { accessCode } = req.body;

    if (!accessCode || accessCode.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir giriş kodu giriniz'
      });
    }

    const alliance = await Alliance.findById(allianceId);
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Kullanıcının ittifak üyesi olup olmadığını kontrol et
    const isMember = alliance.members.some(member => 
      member.userId.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bu ittifağa erişim yetkiniz yok'
      });
    }

    // Giriş koduna sahip özel kanalı bul
    const channel = alliance.channels.find(ch => 
      ch.isPrivate && ch.accessCode === accessCode.trim().toUpperCase()
    );

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Geçersiz giriş kodu'
      });
    }

    // Kullanıcıyı kanala yetkilendir
    await alliance.authorizeUserToChannel(channel._id, req.userId, req.userId);

    res.json({
      success: true,
      message: `${channel.name} kanalına başarıyla erişim sağlandı`,
      channel: {
        id: channel._id,
        name: channel.name,
        type: channel.type
      }
    });

  } catch (error) {
    console.error('Özel kanal erişim hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcının erişebildiği kanalları listele
router.get('/:allianceId/channels', auth, async (req, res) => {
  try {
    const { allianceId } = req.params;

    const alliance = await Alliance.findById(allianceId);
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Kullanıcının ittifak üyesi olup olmadığını kontrol et
    const isMember = alliance.members.some(member => 
      member.userId.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bu ittifağa erişim yetkiniz yok'
      });
    }

    // Kullanıcının erişebildiği kanalları filtrele
    const accessibleChannels = alliance.channels.filter(channel => {
      if (!channel.isPrivate) {
        return true; // Genel kanallar herkese açık
      }
      
      // Özel kanallar için yetki kontrolü
      return alliance.hasChannelAccess(channel._id, req.userId);
    }).map(channel => ({
      id: channel._id,
      name: channel.name,
      type: channel.type,
      isPrivate: channel.isPrivate,
      description: channel.description,
      permissions: channel.permissions
    }));

    res.json({
      success: true,
      channels: accessibleChannels
    });

  } catch (error) {
    console.error('Kanal listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Özel kanal bilgilerini getir (sadece yetkili kullanıcılar için)
router.get('/:allianceId/channels/:channelId/info', auth, async (req, res) => {
  try {
    const { allianceId, channelId } = req.params;

    const alliance = await Alliance.findById(allianceId)
      .populate('channels.authorizedUsers.userId', 'username')
      .populate('channels.createdBy', 'username');

    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    const channel = alliance.channels.id(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Kanal bulunamadı'
      });
    }

    // Sadece lider, subay veya kanal yaratıcısı bilgileri görebilir
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    const isCreator = channel.createdBy && channel.createdBy.toString() === req.userId.toString();

    if (!['leader', 'officer'].includes(userRole) && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Bu bilgileri görme yetkiniz yok'
      });
    }

    res.json({
      success: true,
      channel: {
        id: channel._id,
        name: channel.name,
        type: channel.type,
        isPrivate: channel.isPrivate,
        accessCode: channel.accessCode,
        authorizedUsers: channel.authorizedUsers,
        createdBy: channel.createdBy,
        createdAt: channel._id.getTimestamp()
      }
    });

  } catch (error) {
    console.error('Kanal bilgi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// İttifak logosu yükle
router.post('/:allianceId/upload-logo', auth, upload.single('logo'), async (req, res) => {
  try {
    const { allianceId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Logo dosyası seçilmedi'
      });
    }

    const alliance = await Alliance.findById(allianceId);
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Sadece lider ve subaylar logo yükleyebilir
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      // Yüklenen dosyayı sil
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Logo yükleme yetkiniz yok'
      });
    }

    // Eski logoyu sil (eğer varsa ve uploads klasöründeyse)
    if (alliance.logo && alliance.logo.includes('uploads/alliances/')) {
      const oldLogoPath = path.join('public', alliance.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Yeni logo yolunu kaydet (public/ kısmını çıkar)
    const logoPath = req.file.path.replace('public/', '');
    alliance.logo = logoPath;
    await alliance.save();

    res.json({
      success: true,
      message: 'İttifak logosu başarıyla güncellendi',
      logoPath: logoPath
    });

  } catch (error) {
    // Hata durumunda yüklenen dosyayı sil
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Logo yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Sunucu hatası'
    });
  }
});

// ============ ADMIN PANEL ENDPOINTS ============

// İttifak bilgilerini güncelle (sadece lider)
router.put('/:allianceId/admin/update-info', auth, async (req, res) => {
  try {
    const { allianceId } = req.params;
    const { name, description, gameInfo } = req.body;

    const alliance = await Alliance.findById(allianceId);
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Sadece lider güncelleyebilir
    if (alliance.leader.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Sadece ittifak lideri bu bilgileri güncelleyebilir'
      });
    }

    // Bilgileri güncelle
    if (name) alliance.name = name;
    if (description) alliance.description = description;
    if (gameInfo) {
      alliance.gameInfo = { ...alliance.gameInfo, ...gameInfo };
    }

    await alliance.save();

    res.json({
      success: true,
      message: 'İttifak bilgileri başarıyla güncellendi',
      alliance: {
        name: alliance.name,
        description: alliance.description,
        gameInfo: alliance.gameInfo
      }
    });

  } catch (error) {
    console.error('İttifak güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Üye listesini getir (sadece lider ve subaylar)
router.get('/:allianceId/admin/members', auth, async (req, res) => {
  try {
    const { allianceId } = req.params;

    const alliance = await Alliance.findById(allianceId)
      .populate('members.userId', 'username nickname email profileImage gameInfo isOnline lastSeen createdAt');

    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Sadece lider ve subaylar görebilir
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Bu bilgileri görme yetkiniz yok'
      });
    }

    const membersList = alliance.members.map(member => ({
      id: member.userId._id,
      username: member.userId.username,
      nickname: member.userId.nickname,
      email: member.userId.email,
      profileImage: member.userId.profileImage,
      gameInfo: member.userId.gameInfo,
      role: member.role,
      joinedAt: member.joinedAt,
      isOnline: member.userId.isOnline,
      lastSeen: member.userId.lastSeen,
      memberSince: member.userId.createdAt
    }));

    res.json({
      success: true,
      members: membersList,
      totalMembers: membersList.length
    });

  } catch (error) {
    console.error('Üye listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Üyeyi ittifaktan çıkar (sadece lider)
router.delete('/:allianceId/admin/remove-member/:userId', auth, async (req, res) => {
  try {
    const { allianceId, userId } = req.params;

    const alliance = await Alliance.findById(allianceId);
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Sadece lider çıkarabilir
    if (alliance.leader.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Sadece ittifak lideri üye çıkarabilir'
      });
    }

    // Kendini çıkaramaz
    if (userId === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Kendinizi ittifaktan çıkaramazsınız'
      });
    }

    // Üyeyi bul
    const memberIndex = alliance.members.findIndex(m => 
      m.userId.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Üye bulunamadı'
      });
    }

    const removedMember = alliance.members[memberIndex];

    // Üyeyi ittifaktan çıkar
    alliance.members.splice(memberIndex, 1);
    
    // İstatistikleri güncelle
    alliance.stats.totalMembers = alliance.members.length;
    await alliance.save();

    // Kullanıcının ittifak listesinden de çıkar
    await User.findByIdAndUpdate(userId, {
      $pull: {
        alliances: { allianceId: allianceId }
      }
    });

    // Üye bilgisini al
    const user = await User.findById(userId).select('username nickname');

    res.json({
      success: true,
      message: `${user.nickname || user.username} ittifaktan çıkarıldı`,
      removedMember: {
        id: userId,
        username: user.username,
        nickname: user.nickname,
        role: removedMember.role
      }
    });

  } catch (error) {
    console.error('Üye çıkarma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Üye rolünü değiştir (sadece lider)
router.put('/:allianceId/admin/change-role/:userId', auth, async (req, res) => {
  try {
    const { allianceId, userId } = req.params;
    const { newRole } = req.body;

    if (!['member', 'officer'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz rol. Sadece "member" veya "officer" olabilir'
      });
    }

    const alliance = await Alliance.findById(allianceId);
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Sadece lider rol değiştirebilir
    if (alliance.leader.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Sadece ittifak lideri rol değiştirebilir'
      });
    }

    // Kendinin rolünü değiştiremez
    if (userId === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Kendi rolünüzü değiştiremezsiniz'
      });
    }

    // Üyeyi bul
    const member = alliance.members.find(m => 
      m.userId.toString() === userId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Üye bulunamadı'
      });
    }

    const oldRole = member.role;
    member.role = newRole;

    // Officers listesini güncelle
    if (newRole === 'officer' && !alliance.officers.includes(userId)) {
      alliance.officers.push(userId);
    } else if (newRole === 'member') {
      alliance.officers = alliance.officers.filter(id => id.toString() !== userId);
    }

    await alliance.save();

    // Kullanıcının ittifak listesindeki rolünü de güncelle
    await User.updateOne(
      { _id: userId, 'alliances.allianceId': allianceId },
      { $set: { 'alliances.$.role': newRole } }
    );

    // Üye bilgisini al
    const user = await User.findById(userId).select('username nickname');

    res.json({
      success: true,
      message: `${user.nickname || user.username} rolü ${oldRole}'dan ${newRole}'a değiştirildi`,
      updatedMember: {
        id: userId,
        username: user.username,
        nickname: user.nickname,
        oldRole,
        newRole
      }
    });

  } catch (error) {
    console.error('Rol değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// İttifak istatistiklerini getir (sadece lider ve subaylar)
router.get('/:allianceId/admin/stats', auth, async (req, res) => {
  try {
    const { allianceId } = req.params;

    const alliance = await Alliance.findById(allianceId)
      .populate('members.userId', 'isOnline lastSeen createdAt');

    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Sadece lider ve subaylar görebilir
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Bu bilgileri görme yetkiniz yok'
      });
    }

    // İstatistikleri hesapla
    const now = new Date();
    const onlineMembers = alliance.members.filter(m => m.userId.isOnline).length;
    const activeToday = alliance.members.filter(m => {
      const lastSeen = new Date(m.userId.lastSeen);
      const diffHours = (now - lastSeen) / (1000 * 60 * 60);
      return diffHours <= 24;
    }).length;

    const activeThisWeek = alliance.members.filter(m => {
      const lastSeen = new Date(m.userId.lastSeen);
      const diffDays = (now - lastSeen) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;

    const newMembersThisMonth = alliance.members.filter(m => {
      const joinedAt = new Date(m.joinedAt);
      const diffDays = (now - joinedAt) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length;

    const roleDistribution = {
      leader: alliance.members.filter(m => m.role === 'leader').length,
      officer: alliance.members.filter(m => m.role === 'officer').length,
      member: alliance.members.filter(m => m.role === 'member').length
    };

    res.json({
      success: true,
      stats: {
        totalMembers: alliance.members.length,
        onlineNow: onlineMembers,
        activeToday,
        activeThisWeek,
        newMembersThisMonth,
        roleDistribution,
        totalMessages: alliance.stats.totalMessages || 0,
        totalPolls: alliance.stats.totalPolls || 0,
        createdAt: alliance.createdAt
      }
    });

  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;