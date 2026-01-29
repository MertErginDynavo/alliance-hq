# 🎮 Alliance HQ

**Gaming alliance communication platform without language barriers** - specially designed for mobile strategy games.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7+-red.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Live Demo

**Demo Credentials:**
- Email: `mertergin94@hotmail.com`
- Password: `Abana1905`
- Alliance: `WOLF REGION FORCE`

**R4 Chat Access Codes:**
- `R4WOLF`
- `ELITE1` 
- `SECRET`

## 🔥 Core Features

### 1️⃣ **Multi-Language Support** 🌍
- **10 Languages Supported**: Turkish, English, Spanish, German, French, Russian, Arabic, Chinese, Japanese, Korean
- **Real-time Translation**: Messages automatically translated to user's preferred language
- **Instant Language Switching**: No page refresh required
- **Smart Detection**: Auto-detects user's language preference

### 2️⃣ **Alliance Management System** 🏰
- **Server-Based Registration**: First user creates alliance server, others join
- **Role-Based Access**: Leader, Officer, Member roles with different permissions
- **Admin Panel**: Complete alliance management for leaders
- **Member Management**: Add/remove members, change roles
- **Alliance Customization**: Upload logos, set descriptions, game info

### 3️⃣ **Advanced Communication** 💬
- **Real-time Chat**: Instant messaging with Socket.IO
- **Channel System**: General, Announcements, War Strategy, Events, Media
- **Private R4 Chat**: Secure leadership channel with access codes
- **Auto-Translation**: All messages translated to recipient's language
- **Message History**: Persistent chat history

### 4️⃣ **Season Management** 🌟
- **Season Information**: Create and manage game seasons
- **Photo Upload**: Drag & drop image upload (up to 5MB)
- **Image Captions**: Add descriptions to season images
- **View Statistics**: Track season engagement
- **Status Tracking**: Active/Finished season management

### 5️⃣ **Security & Authentication** 🔐
- **JWT Authentication**: Secure token-based authentication
- **Profile System**: Custom nicknames and profile pictures
- **Access Control**: Role-based permissions
- **Secure File Upload**: Validated image uploads with size limits
- **Session Management**: Persistent login sessions

### 6️⃣ **Modern UI/UX** 🎨
- **Premium Design**: Modern black/white/gray theme with Inter + Playfair Display fonts
- **Responsive Design**: Mobile-first approach, works on all devices
- **Smooth Animations**: CSS transitions and hover effects
- **Intuitive Navigation**: Easy-to-use sidebar and channel switching
- **Loading States**: Smooth loading indicators and transitions

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 6.0+
- npm 8+

### Installation

#### Option 1: Manual Setup
```bash
# Clone the repository
git clone https://github.com/your-username/alliance-hq.git
cd alliance-hq

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

#### Option 2: Windows Deployment
```batch
# Run the deployment script
deploy.bat
```

#### Option 3: Linux/Mac Deployment
```bash
# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

#### Option 4: Docker
```bash
# Using Docker Compose
docker-compose up -d
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/alliance-hq

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-key

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./public/uploads

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📁 Project Structure

```
alliance-hq/
├── src/
│   ├── app.js              # Main application file
│   ├── config/
│   │   └── database.js     # MongoDB configuration
│   ├── middleware/
│   │   └── auth.js         # Authentication middleware
│   ├── models/             # MongoDB models
│   │   ├── User.js
│   │   ├── Alliance.js
│   │   ├── Message.js
│   │   ├── Poll.js
│   │   └── Season.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── alliance.js
│   │   ├── messages.js
│   │   ├── polls.js
│   │   └── seasons.js
│   ├── services/
│   │   └── translationService.js
│   └── socket/
│       └── socketHandler.js
├── public/                 # Static files
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── dashboard.html     # Main dashboard
│   ├── demo.html          # Demo page
│   └── uploads/           # User uploads
├── logs/                  # Application logs
├── ecosystem.config.js    # PM2 configuration
├── docker-compose.yml     # Docker configuration
├── nginx.conf            # Nginx configuration
└── deploy.sh             # Deployment script
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Alliance Management
- `GET /api/alliance/:id` - Get alliance details
- `PUT /api/alliance/:id` - Update alliance
- `POST /api/alliance/:id/upload-logo` - Upload alliance logo
- `GET /api/alliance/:id/members` - Get alliance members
- `POST /api/alliance/:id/members` - Add member
- `DELETE /api/alliance/:id/members/:userId` - Remove member

### Messaging
- `GET /api/messages/:channel` - Get channel messages
- `POST /api/messages` - Send message
- `POST /api/alliance/:id/r4-access` - Verify R4 access code

### Seasons
- `GET /api/seasons` - Get seasons
- `POST /api/seasons` - Create season
- `POST /api/seasons/:id/upload` - Upload season images

## 🔧 Production Deployment

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.yml up -d
```

### Nginx Configuration
1. Copy `nginx.conf` to `/etc/nginx/sites-available/alliance-hq`
2. Create symbolic link: `ln -s /etc/nginx/sites-available/alliance-hq /etc/nginx/sites-enabled/`
3. Update domain name and SSL certificate paths
4. Reload Nginx: `systemctl reload nginx`

## 🛡️ Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcryptjs
- **File Upload Validation** with size and type restrictions
- **CORS Protection** with configurable origins
- **Rate Limiting** to prevent abuse
- **Input Sanitization** to prevent XSS attacks
- **SQL Injection Protection** through MongoDB ODM

## 🌍 Supported Languages

| Language | Code | Flag |
|----------|------|------|
| Turkish | tr | 🇹🇷 |
| English | en | 🇺🇸 |
| Spanish | es | 🇪🇸 |
| German | de | 🇩🇪 |
| French | fr | 🇫🇷 |
| Russian | ru | 🇷🇺 |
| Arabic | ar | 🇸🇦 |
| Chinese | zh | 🇨🇳 |
| Japanese | ja | 🇯🇵 |
| Korean | ko | 🇰🇷 |

## 📱 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with modern features
- **JavaScript ES6+** - Client-side logic
- **Socket.IO Client** - Real-time updates
- **Inter & Playfair Display** - Typography

### DevOps
- **PM2** - Process management
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **MongoDB** - Database

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kiro AI** - Development and design
- **Socket.IO** - Real-time communication
- **MongoDB** - Database solution
- **Express.js** - Web framework
- **Inter & Playfair Display** - Typography

## 📞 Support

For support, email support@alliance-hq.com or join our Discord server.

---

**Made with ❤️ by Kiro AI**