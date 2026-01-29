# 🚀 Alliance HQ - Installation Guide

## Requirements
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Google Translate API Key (optional)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/alliance-hq
JWT_SECRET=your-super-secret-jwt-key-here
GOOGLE_TRANSLATE_API_KEY=your-google-api-key
```

### 3. Start MongoDB
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. Run Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Test
Open browser and go to `http://localhost:3000`.

## 🔧 API Usage

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "email": "player1@example.com",
    "password": "123456",
    "preferredLanguage": "en",
    "gameInfo": {
      "gameName": "DarkWar",
      "playerLevel": 25,
      "serverId": "US-01"
    }
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player1@example.com",
    "password": "123456"
  }'
```

### Create Alliance
```bash
curl -X POST http://localhost:3000/api/alliance/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Dragon Warriors",
    "tag": "DRAG",
    "description": "Strong and united!",
    "gameInfo": {
      "gameName": "DarkWar",
      "serverId": "US-01",
      "serverName": "United States 1"
    }
  }'
```

## 🌐 Socket.IO Bağlantısı

### JavaScript Client
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Send message
socket.emit('send_message', {
  allianceId: 'ALLIANCE_ID',
  channel: 'general',
  content: 'Hello alliance!'
});

// Listen for messages
socket.on('new_message', (data) => {
  console.log('New message:', data);
});
```

## 🔑 Google Translate API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing project
3. Go to "APIs & Services" > "Library"
4. Search for "Cloud Translation API" and enable it
5. "Credentials" > "Create Credentials" > "API Key"
6. Add API key to `.env` file

## 📱 Features

### ✅ Completed
- ✅ User registration/login system
- ✅ Alliance creation and joining
- ✅ Real-time messaging (Socket.IO)
- ✅ Auto translation system
- ✅ Role-based channels
- ✅ Voting system
- ✅ Message search and pinning

### 🔄 In Development
- 🔄 File/image upload
- 🔄 Push notification system
- 🔄 Mobile app (React Native)
- 🔄 Admin panel

### 📋 Planned
- 📋 Voice message support
- 📋 Video call feature
- 📋 Bot integrations
- 📋 Game API integrations

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check MongoDB service
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

### Port Already in Use
```bash
# Find process using port
netstat -tulpn | grep :3000

# Kill process
kill -9 PID_NUMBER
```

### Translation Not Working
- Make sure Google Translate API key is correct
- Check API quota
- Verify billing account is active

## 📞 Support

If you have issues:
1. Search in GitHub Issues
2. Create new issue
3. Share detailed error message

## 🎯 Next Steps

1. **Frontend Development**: Modern UI with React/Vue.js
2. **Mobile App**: iOS/Android with React Native
3. **Push Notifications**: Firebase integration
4. **File Upload**: Multer for file uploads
5. **Admin Panel**: Alliance management panel

Good luck! 🚀