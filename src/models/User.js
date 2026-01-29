const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileImage: {
    type: String,
    default: null
  },
  preferredLanguage: {
    type: String,
    default: 'tr',
    enum: ['tr', 'en', 'es', 'de', 'fr', 'ru', 'ar', 'zh', 'ja', 'ko']
  },
  allianceServer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  gameInfo: {
    gameName: String,
    playerLevel: Number,
    serverId: String
  },
  avatar: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  alliances: [{
    allianceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alliance'
    },
    role: {
      type: String,
      enum: ['leader', 'officer', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Şifre hashleme
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Şifre doğrulama
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);