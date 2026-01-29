const mongoose = require('mongoose');

const allianceSchema = new mongoose.Schema({
  serverName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 30
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  tag: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 5
  },
  description: {
    type: String,
    maxlength: 500
  },
  rules: [{
    title: String,
    description: String,
    icon: String,
    color: String
  }],
  gameInfo: {
    gameName: {
      type: String,
      required: true
    },
    serverId: {
      type: String,
      required: true
    },
    serverName: String
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  officers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['leader', 'officer', 'member'],
      default: 'member'
    }
  }],
  logo: {
    type: String,
    default: null // Logo dosya yolu
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  settings: {
    isPrivate: {
      type: Boolean,
      default: true
    },
    autoTranslate: {
      type: Boolean,
      default: true
    },
    allowedLanguages: [{
      type: String,
      enum: ['tr', 'en', 'es', 'de', 'fr', 'ru', 'ar', 'zh', 'ja', 'ko']
    }],
    notifications: {
      announcements: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      wars: { type: Boolean, default: true },
      polls: { type: Boolean, default: true }
    }
  },
  channels: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['announcements', 'general', 'war', 'events', 'media', 'private'],
      required: true
    },
    description: String,
    permissions: {
      canWrite: [{
        type: String,
        enum: ['leader', 'officer', 'member']
      }],
      canRead: [{
        type: String,
        enum: ['leader', 'officer', 'member']
      }]
    },
    // Özel kanal özellikleri
    isPrivate: {
      type: Boolean,
      default: false
    },
    accessCode: {
      type: String,
      default: null
    },
    authorizedUsers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      authorizedAt: {
        type: Date,
        default: Date.now
      },
      authorizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  stats: {
    totalMembers: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalPolls: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// İttifak üye sayısını güncelle
allianceSchema.methods.updateMemberCount = function() {
  this.stats.totalMembers = this.members.length;
  return this.save();
};

// Özel kanal oluştur
allianceSchema.methods.createPrivateChannel = function(channelName, creatorId) {
  const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const newChannel = {
    name: channelName,
    type: 'private',
    isPrivate: true,
    accessCode: accessCode,
    authorizedUsers: [{
      userId: creatorId,
      authorizedBy: creatorId
    }],
    createdBy: creatorId,
    permissions: {
      canWrite: ['leader', 'officer', 'member'],
      canRead: ['leader', 'officer', 'member']
    }
  };
  
  this.channels.push(newChannel);
  return this.save().then(() => ({ channel: newChannel, accessCode }));
};

// Özel kanala kullanıcı ekle
allianceSchema.methods.authorizeUserToChannel = function(channelId, userId, authorizedBy) {
  const channel = this.channels.id(channelId);
  if (!channel || !channel.isPrivate) {
    throw new Error('Kanal bulunamadı veya özel kanal değil');
  }
  
  // Zaten yetkili mi kontrol et
  const alreadyAuthorized = channel.authorizedUsers.some(auth => 
    auth.userId.toString() === userId.toString()
  );
  
  if (!alreadyAuthorized) {
    channel.authorizedUsers.push({
      userId: userId,
      authorizedBy: authorizedBy
    });
  }
  
  return this.save();
};

// Kullanıcının kanala erişim yetkisi var mı kontrol et
allianceSchema.methods.hasChannelAccess = function(channelId, userId) {
  const channel = this.channels.id(channelId);
  if (!channel) return false;
  
  // Özel kanal değilse herkes erişebilir
  if (!channel.isPrivate) return true;
  
  // Yetkili kullanıcılar listesinde var mı
  return channel.authorizedUsers.some(auth => 
    auth.userId.toString() === userId.toString()
  );
};

module.exports = mongoose.model('Alliance', allianceSchema);