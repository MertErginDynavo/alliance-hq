#!/bin/bash

# Alliance HQ Deployment Script
echo "🚀 Starting Alliance HQ deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally (if not installed)
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
fi

# Install MongoDB (if not installed)
if ! command -v mongod &> /dev/null; then
    print_status "Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

# Install Nginx (if not installed)
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Create application directory
APP_DIR="/var/www/alliance-hq"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copy application files
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
print_status "Installing Node.js dependencies..."
npm ci --only=production

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p public/uploads/profiles
mkdir -p public/uploads/alliances
mkdir -p logs

# Set up environment variables
if [ ! -f .env ]; then
    print_status "Creating environment file..."
    cp .env.production .env
    print_warning "Please edit .env file with your production settings!"
fi

# Set up Nginx configuration
print_status "Setting up Nginx configuration..."
sudo cp nginx.conf /etc/nginx/sites-available/alliance-hq
sudo ln -sf /etc/nginx/sites-available/alliance-hq /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Set up firewall
print_status "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

print_status "✅ Deployment completed successfully!"
print_warning "Don't forget to:"
print_warning "1. Update .env file with your production settings"
print_warning "2. Configure SSL certificates"
print_warning "3. Update domain name in nginx.conf"
print_warning "4. Set up MongoDB authentication"

echo ""
print_status "🌐 Your Alliance HQ is now running!"
print_status "📊 Monitor with: pm2 monit"
print_status "📝 View logs with: pm2 logs alliance-hq"