const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  alliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alliance',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  seasonNumber: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  images: [{
    filename: String,
    originalName: String,
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  features: [{
    title: String,
    description: String,
    icon: String
  }],
  rewards: [{
    title: String,
    description: String,
    image: String,
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common'
    }
  }],
  status: {
    type: String,
    enum: ['upcoming', 'active', 'ended'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Sezon numarası otomatik artırma
seasonSchema.pre('save', async function(next) {
  if (this.isNew && !this.seasonNumber) {
    const lastSeason = await this.constructor.findOne({ alliance: this.alliance })
      .sort({ seasonNumber: -1 });
    
    this.seasonNumber = lastSeason ? lastSeason.seasonNumber + 1 : 1;
  }
  next();
});

// Görüntülenme sayısını artır
seasonSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Season', seasonSchema);