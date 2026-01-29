const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔍 MongoDB URI check:', mongoUri ? 'Found' : 'Not found');
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable not set');
    }
    
    // Basit bağlantı denemesi
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 saniye timeout
    });
    console.log('🎮 MongoDB connected - Alliance HQ');
  } catch (error) {
    console.log('⚠️ MongoDB connection error:', error.message);
    console.log('⚠️ MongoDB not available, continuing without database (demo mode)');
    console.log('📝 Note: Registration and login will not work without database');
  }
}

module.exports = { connectDatabase };