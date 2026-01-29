const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  alliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alliance',
    required: true
  },
  channel: {
    type: String,
    required: true,
    enum: ['announcements', 'general', 'war', 'events', 'media', 'private']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    original: {
      text: { type: String, required: true },
      language: { type: String, required: true }
    },
    translations: [{
      language: { type: String, required: true },
      text: { type: String, required: true },
      translatedAt: { type: Date, default: Date.now }
    }]
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file']
    },
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    count: { type: Number, default: 0 }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  isPinned: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Mesaj çevirisi ekleme
messageSchema.methods.addTranslation = function(language, translatedText) {
  const existingTranslation = this.content.translations.find(t => t.language === language);
  
  if (existingTranslation) {
    existingTranslation.text = translatedText;
    existingTranslation.translatedAt = new Date();
  } else {
    this.content.translations.push({
      language,
      text: translatedText
    });
  }
  
  return this.save();
};

// Kullanıcının diline göre mesaj getir
messageSchema.methods.getContentForUser = function(userLanguage) {
  // Eğer orijinal dil kullanıcının diliyle aynıysa
  if (this.content.original.language === userLanguage) {
    return this.content.original.text;
  }
  
  // Çeviri varsa onu döndür
  const translation = this.content.translations.find(t => t.language === userLanguage);
  if (translation) {
    return translation.text;
  }
  
  // Çeviri yoksa orijinal metni döndür
  return this.content.original.text;
};

module.exports = mongoose.model('Message', messageSchema);