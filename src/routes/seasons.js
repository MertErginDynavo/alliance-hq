const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Season = require('../models/Season');
const Alliance = require('../models/Alliance');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/seasons');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'season-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});

// Yeni sezon oluştur
router.post('/:allianceId/create', auth, async (req, res) => {
  try {
    const { allianceId } = req.params;
    const { title, description, startDate, endDate, features, rewards } = req.body;

    // İttifak kontrolü
    const alliance = await Alliance.findById(allianceId);
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Yetki kontrolü - sadece lider ve subaylar sezon oluşturabilir
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Sezon oluşturma yetkiniz yok'
      });
    }

    // Yeni sezon oluştur
    const season = new Season({
      alliance: allianceId,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      features: features || [],
      rewards: rewards || [],
      createdBy: req.userId
    });

    await season.save();

    res.status(201).json({
      success: true,
      message: 'Sezon başarıyla oluşturuldu',
      season
    });

  } catch (error) {
    console.error('Sezon oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Sezona fotoğraf yükle
router.post('/:seasonId/upload-image', auth, upload.single('image'), async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Fotoğraf seçilmedi'
      });
    }

    const season = await Season.findById(seasonId).populate('alliance');
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Sezon bulunamadı'
      });
    }

    // Yetki kontrolü
    const alliance = season.alliance;
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Fotoğraf yükleme yetkiniz yok'
      });
    }

    // Fotoğraf bilgilerini sezona ekle
    const imageData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/seasons/${req.file.filename}`,
      caption: caption || '',
      uploadedBy: req.userId
    };

    season.images.push(imageData);
    await season.save();

    res.json({
      success: true,
      message: 'Fotoğraf başarıyla yüklendi',
      image: imageData
    });

  } catch (error) {
    console.error('Fotoğraf yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// İttifak sezonlarını listele
router.get('/:allianceId/list', auth, async (req, res) => {
  try {
    const { allianceId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // İttifak üyelik kontrolü
    const alliance = await Alliance.findById(allianceId);
    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    const isMember = alliance.members.some(member => 
      member.userId.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bu ittifağa erişim yetkiniz yok'
      });
    }

    // Filtre oluştur
    const filter = { alliance: allianceId, isPublished: true };
    if (status) {
      filter.status = status;
    }

    // Sezonları getir
    const seasons = await Season.find(filter)
      .populate('createdBy', 'username')
      .populate('images.uploadedBy', 'username')
      .sort({ seasonNumber: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalSeasons = await Season.countDocuments(filter);

    res.json({
      success: true,
      seasons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSeasons,
        pages: Math.ceil(totalSeasons / limit)
      }
    });

  } catch (error) {
    console.error('Sezon listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Sezon detayını getir
router.get('/:seasonId', auth, async (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = await Season.findById(seasonId)
      .populate('alliance', 'name tag')
      .populate('createdBy', 'username')
      .populate('images.uploadedBy', 'username');

    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Sezon bulunamadı'
      });
    }

    // İttifak üyelik kontrolü
    const alliance = await Alliance.findById(season.alliance._id);
    const isMember = alliance.members.some(member => 
      member.userId.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bu sezona erişim yetkiniz yok'
      });
    }

    // Görüntülenme sayısını artır
    await season.incrementViews();

    res.json({
      success: true,
      season
    });

  } catch (error) {
    console.error('Sezon detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Sezon yayınla/yayından kaldır
router.patch('/:seasonId/publish', auth, async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { isPublished } = req.body;

    const season = await Season.findById(seasonId).populate('alliance');
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Sezon bulunamadı'
      });
    }

    // Yetki kontrolü
    const alliance = season.alliance;
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Sezon yayınlama yetkiniz yok'
      });
    }

    season.isPublished = isPublished;
    if (isPublished && !season.publishedAt) {
      season.publishedAt = new Date();
    }

    await season.save();

    res.json({
      success: true,
      message: isPublished ? 'Sezon yayınlandı' : 'Sezon yayından kaldırıldı',
      season
    });

  } catch (error) {
    console.error('Sezon yayınlama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Fotoğraf açıklamasını güncelle
router.patch('/:seasonId/images/:imageId/caption', auth, async (req, res) => {
  try {
    const { seasonId, imageId } = req.params;
    const { caption } = req.body;

    const season = await Season.findById(seasonId).populate('alliance');
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Sezon bulunamadı'
      });
    }

    // Yetki kontrolü
    const alliance = season.alliance;
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Fotoğraf düzenleme yetkiniz yok'
      });
    }

    // Fotoğrafı bul ve açıklamayı güncelle
    const image = season.images.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Fotoğraf bulunamadı'
      });
    }

    image.caption = caption;
    await season.save();

    res.json({
      success: true,
      message: 'Fotoğraf açıklaması güncellendi',
      image
    });

  } catch (error) {
    console.error('Fotoğraf açıklama güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;