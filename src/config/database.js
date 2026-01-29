const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    // Basit bağlantı denemesi
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alliance-hq', {
      serverSelectionTimeoutMS: 2000, // 2 saniye timeout
    });
    console.log('🎮 MongoDB connected - Alliance HQ');
  } catch (error) {
    console.log('⚠️ MongoDB not available, continuing without database (demo mode)');
    console.log('📝 Note: Registration and login will not work without database');
  }
}

module.exports = { connectDatabase };