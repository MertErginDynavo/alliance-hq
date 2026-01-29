const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  alliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alliance',
    required: true
  },
  channel: {
    type: String,
    required: true,
    enum: ['announcements', 'general', 'war', 'events', 'media']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    original: {
      text: { type: String, required: true },
      language: { type: String, required: true }
    },
    translations: [{
      language: { type: String, required: true },
      text: { type: String, required: true }
    }]
  },
  options: [{
    id: { type: String, required: true },
    text: {
      original: {
        text: { type: String, required: true },
        language: { type: String, required: true }
      },
      translations: [{
        language: { type: String, required: true },
        text: { type: String, required: true }
      }]
    },
    votes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    voteCount: { type: Number, default: 0 }
  }],
  settings: {
    allowMultipleVotes: { type: Boolean, default: false },
    isAnonymous: { type: Boolean, default: false },
    showResults: { type: Boolean, default: true },
    allowAddOptions: { type: Boolean, default: false }
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Oy verme
pollSchema.methods.vote = function(userId, optionId) {
  if (!this.isActive || new Date() > this.expiresAt) {
    throw new Error('Oylama süresi dolmuş veya aktif değil');
  }

  const option = this.options.id(optionId);
  if (!option) {
    throw new Error('Geçersiz seçenek');
  }

  // Çoklu oy kontrolü
  if (!this.settings.allowMultipleVotes && this.voters.includes(userId)) {
    throw new Error('Bu oylamada sadece bir oy verebilirsiniz');
  }

  // Mevcut oyu kaldır (tek oy sisteminde)
  if (!this.settings.allowMultipleVotes) {
    this.options.forEach(opt => {
      opt.votes = opt.votes.filter(vote => !vote.user.equals(userId));
      opt.voteCount = opt.votes.length;
    });
  }

  // Yeni oy ekle
  option.votes.push({ user: userId });
  option.voteCount = option.votes.length;

  // Toplam oy sayısını güncelle
  if (!this.voters.includes(userId)) {
    this.voters.push(userId);
  }
  this.totalVotes = this.voters.length;

  return this.save();
};

// Kullanıcının diline göre oylama getir
pollSchema.methods.getContentForUser = function(userLanguage) {
  const result = {
    question: this.question.original.text,
    options: []
  };

  // Soru çevirisi
  const questionTranslation = this.question.translations.find(t => t.language === userLanguage);
  if (questionTranslation) {
    result.question = questionTranslation.text;
  }

  // Seçenek çevirileri
  this.options.forEach(option => {
    let optionText = option.text.original.text;
    const optionTranslation = option.text.translations.find(t => t.language === userLanguage);
    if (optionTranslation) {
      optionText = optionTranslation.text;
    }

    result.options.push({
      id: option.id,
      text: optionText,
      voteCount: option.voteCount,
      votes: option.votes
    });
  });

  return result;
};

module.exports = mongoose.model('Poll', pollSchema);