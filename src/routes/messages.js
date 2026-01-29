const express = require('express');
const Message = require('../models/Message');
const Alliance = require('../models/Alliance');
const auth = require('../middleware/auth');

const router = express.Router();

// Kanal mesajlarını getir
router.get('/:allianceId/:channel', auth, async (req, res) => {
  try {
    const { allianceId, channel } = req.params;
    const { page = 1, limit = 50 } = req.query;

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

    // Mesajları getir
    const messages = await Message.find({
      alliance: allianceId,
      channel,
      isDeleted: false
    })
    .populate('sender', 'username avatar preferredLanguage')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Kullanıcının diline göre mesajları çevir
    const userLanguage = req.user.preferredLanguage;
    const translatedMessages = messages.map(message => {
      const messageObj = message.toObject();
      
      // Kullanıcının diline göre içerik getir
      messageObj.displayContent = message.getContentForUser(userLanguage);
      
      return messageObj;
    });

    res.json({
      success: true,
      messages: translatedMessages.reverse(), // Kronolojik sıra
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Mesaj getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mesaj arama
router.get('/:allianceId/:channel/search', auth, async (req, res) => {
  try {
    const { allianceId, channel } = req.params;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Arama terimi en az 2 karakter olmalı'
      });
    }

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

    // Mesaj arama
    const searchRegex = new RegExp(query.trim(), 'i');
    const messages = await Message.find({
      alliance: allianceId,
      channel,
      isDeleted: false,
      $or: [
        { 'content.original.text': searchRegex },
        { 'content.translations.text': searchRegex }
      ]
    })
    .populate('sender', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json({
      success: true,
      messages,
      query: query.trim(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Mesaj arama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mesaj sabitleme/sabitleme kaldırma
router.patch('/:messageId/pin', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { isPinned } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
    }

    // İttifak yetki kontrolü
    const alliance = await Alliance.findById(message.alliance);
    const userRole = alliance.members.find(m => 
      m.userId.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Mesaj sabitleme yetkiniz yok'
      });
    }

    message.isPinned = isPinned;
    await message.save();

    res.json({
      success: true,
      message: isPinned ? 'Mesaj sabitlendi' : 'Mesaj sabitleme kaldırıldı',
      isPinned
    });

  } catch (error) {
    console.error('Mesaj sabitleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Sabitlenmiş mesajları getir
router.get('/:allianceId/:channel/pinned', auth, async (req, res) => {
  try {
    const { allianceId, channel } = req.params;

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

    const pinnedMessages = await Message.find({
      alliance: allianceId,
      channel,
      isPinned: true,
      isDeleted: false
    })
    .populate('sender', 'username avatar')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      messages: pinnedMessages
    });

  } catch (error) {
    console.error('Sabitlenmiş mesaj getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;