@echo off
echo 🚀 Starting Alliance HQ deployment for Windows...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo 📥 Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create necessary directories
echo 📁 Creating directories...
if not exist "public\uploads\profiles" mkdir "public\uploads\profiles"
if not exist "public\uploads\alliances" mkdir "public\uploads\alliances"
if not exist "logs" mkdir "logs"

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating environment file...
    copy ".env.example" ".env"
    echo ⚠️  Please edit .env file with your settings!
)

REM Install PM2 globally (optional)
echo 🔧 Installing PM2 (optional)...
npm install -g pm2

echo ✅ Deployment completed successfully!
echo.
echo 🌐 To start your Alliance HQ:
echo    npm start          - Start in development mode
echo    npm run production - Start in production mode
echo    pm2 start ecosystem.config.js - Start with PM2
echo.
echo 📊 Monitor with PM2: pm2 monit
echo 📝 View logs: pm2 logs alliance-hq
echo.
echo ⚠️  Don't forget to:
echo    1. Edit .env file with your settings
echo    2. Set up MongoDB database
echo    3. Configure your domain/hosting
echo.
pause