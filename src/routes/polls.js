const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Poll = require('../models/Poll');
const Alliance = require('../models/Alliance');
const translationService = require('../services/translationService');
const auth = require('../middleware/auth');

const router = express.Router();

// Oylama oluştur
router.post('/create', auth, async (req, res) => {
  try {
    const { 
      allianceId, 
      channel, 
      question, 
      options, 
      settings = {},
      expiresIn = 24 // saat cinsinden
    } = req.body;

    // İttifak kontrolü
    const alliance = await Alliance.findById(allianceId)
      .populate('members.userId', 'preferredLanguage');

    if (!alliance) {
      return res.status(404).json({
        success: false,
        message: 'İttifak bulunamadı'
      });
    }

    // Yetki kontrolü (lider veya subaş)
    const userRole = alliance.members.find(m => 
      m.userId._id.toString() === req.userId.toString()
    )?.role;

    if (!['leader', 'officer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Oylama oluşturma yetkiniz yok'
      });
    }

    const sourceLanguage = req.user.preferredLanguage;
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);

    // Seçenekleri hazırla
    const pollOptions = [];
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      pollOptions.push({
        id: uuidv4(),
        text: {
          original: {
            text: option,
            language: sourceLanguage
          },
          translations: []
        },
        votes: [],
        voteCount: 0
      });
    }

    // Oylama oluştur
    const poll = new Poll({
      alliance: allianceId,
      channel,
      creator: req.userId,
      question: {
        original: {
          text: question,
          language: sourceLanguage
        },
        translations: []
      },
      options: pollOptions,
      settings: {
        allowMultipleVotes: settings.allowMultipleVotes || false,
        isAnonymous: settings.isAnonymous || false,
        showResults: settings.showResults !== false,
        allowAddOptions: settings.allowAddOptions || false
      },
      expiresAt
    });

    // Çevirileri ekle
    if (alliance.settings.autoTranslate) {
      const allianceLanguages = alliance.members
        .map(member => member.userId.preferredLanguage)
        .filter((lang, index, arr) => arr.indexOf(lang) === index);

      const targetLanguages = allianceLanguages.filter(lang => lang !== sourceLanguage);

      // Soruyu çevir
      for (const targetLang of targetLanguages) {
        try {
          const translatedQuestion = await translationService.translateText(
            question, 
            targetLang, 
            sourceLanguage
          );
          
          poll.question.translations.push({
            language: targetLang,
            text: translatedQuestion
          });
        } catch (error) {
          console.error(`Soru çeviri hatası (${targetLang}):`, error);
        }
      }

      // Seçenekleri çevir
      for (const option of poll.options) {
        for (const targetLang of targetLanguages) {
          try {
            const translatedOption = await translationService.translateText(
              option.text.original.text,
              targetLang,
              sourceLanguage
            );
            
            option.text.translations.push({
              language: targetLang,
              text: translatedOption
            });
          } catch (error) {
            console.error(`Seçenek çeviri hatası (${targetLang}):`, error);
          }
        }
      }
    }

    await poll.save();

    // İttifak istatistiklerini güncelle
    await Alliance.findByIdAndUpdate(allianceId, {
      $inc: { 'stats.totalPolls': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Oylama başarıyla oluşturuldu',
      poll: {
        id: poll._id,
        question: poll.question,
        options: poll.options,
        settings: poll.settings,
        expiresAt: poll.expiresAt
      }
    });

  } catch (error) {
    console.error('Oylama oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Oy verme
router.post('/:pollId/vote', auth, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Oylama bulunamadı'
      });
    }

    // İttifak üyelik kontrolü
    const alliance = await Alliance.findById(poll.alliance);
    const isMember = alliance.members.some(member => 
      member.userId.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bu oylamaya katılma yetkiniz yok'
      });
    }

    // Oy ver
    await poll.vote(req.userId, optionId);

    // Güncellenmiş oylama bilgilerini döndür
    const userLanguage = req.user.preferredLanguage;
    const pollContent = poll.getContentForUser(userLanguage);

    res.json({
      success: true,
      message: 'Oyunuz kaydedildi',
      poll: {
        id: poll._id,
        question: pollContent.question,
        options: pollContent.options,
        totalVotes: poll.totalVotes,
        hasVoted: true
      }
    });

  } catch (error) {
    console.error('Oy verme hatası:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Oy verilemedi'
    });
  }
});

// İttifak oylamalarını listele
router.get('/alliance/:allianceId', auth, async (req, res) => {
  try {
    const { allianceId } = req.params;
    const { status = 'all', page = 1, limit = 20 } = req.query;

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
    const filter = { alliance: allianceId };
    
    if (status === 'active') {
      filter.isActive = true;
      filter.expiresAt = { $gt: new Date() };
    } else if (status === 'expired') {
      filter.$or = [
        { isActive: false },
        { expiresAt: { $lte: new Date() } }
      ];
    }

    const polls = await Poll.find(filter)
      .populate('creator', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Kullanıcının diline göre çevir
    const userLanguage = req.user.preferredLanguage;
    const translatedPolls = polls.map(poll => {
      const pollContent = poll.getContentForUser(userLanguage);
      const hasVoted = poll.voters.includes(req.userId);
      
      return {
        id: poll._id,
        question: pollContent.question,
        options: pollContent.options,
        creator: poll.creator,
        settings: poll.settings,
        expiresAt: poll.expiresAt,
        isActive: poll.isActive && new Date() < poll.expiresAt,
        totalVotes: poll.totalVotes,
        hasVoted,
        createdAt: poll.createdAt
      };
    });

    res.json({
      success: true,
      polls: translatedPolls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: polls.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Oylama listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Oylama detayı
router.get('/:pollId', auth, async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId)
      .populate('creator', 'username')
      .populate('voters', 'username');

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Oylama bulunamadı'
      });
    }

    // İttifak üyelik kontrolü
    const alliance = await Alliance.findById(poll.alliance);
    const isMember = alliance.members.some(member => 
      member.userId.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bu oylamaya erişim yetkiniz yok'
      });
    }

    // Kullanıcının diline göre çevir
    const userLanguage = req.user.preferredLanguage;
    const pollContent = poll.getContentForUser(userLanguage);
    const hasVoted = poll.voters.some(voter => voter._id.toString() === req.userId.toString());

    res.json({
      success: true,
      poll: {
        id: poll._id,
        question: pollContent.question,
        options: pollContent.options,
        creator: poll.creator,
        settings: poll.settings,
        expiresAt: poll.expiresAt,
        isActive: poll.isActive && new Date() < poll.expiresAt,
        totalVotes: poll.totalVotes,
        hasVoted,
        voters: poll.settings.isAnonymous ? [] : poll.voters,
        createdAt: poll.createdAt
      }
    });

  } catch (error) {
    console.error('Oylama detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;