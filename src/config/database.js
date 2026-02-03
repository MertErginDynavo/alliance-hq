const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔍 MongoDB URI check:', mongoUri ? 'Found' : 'Not found');
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable not set');
    }
    
    // MongoDB Atlas bağlantı ayarları (Mongoose 7+ uyumlu)
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 saniye timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      bufferMaxEntries: 0
    };
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, options);
    console.log('✅ MongoDB Atlas connected successfully - Alliance HQ');
    
    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

module.exports = { connectDatabase };