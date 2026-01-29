# 🚂 Railway Deployment Guide

## Adım 1: GitHub Repository Oluştur

1. **GitHub.com'a git**
2. **"New repository" butonuna tıkla**
3. **Repository bilgileri:**
   - Repository name: `alliance-hq`
   - Description: `Gaming alliance communication platform without language barriers`
   - Visibility: Public
   - Initialize with README: ❌ (zaten var)
4. **"Create repository" tıkla**

## Adım 2: Local Repository'yi GitHub'a Push Et

```bash
# Remote repository ekle
git remote add origin https://github.com/YOUR_USERNAME/alliance-hq.git

# Branch'i main olarak ayarla
git branch -M main

# GitHub'a push et
git push -u origin main
```

## Adım 3: Railway'de Deployment

1. **Railway.app'e git:** https://railway.app
2. **"Start a New Project" tıkla**
3. **"Deploy from GitHub repo" seç**
4. **GitHub hesabını bağla** (ilk kez ise)
5. **"alliance-hq" repository'sini seç**
6. **"Deploy Now" tıkla**

## Adım 4: MongoDB Service Ekle

1. **Project dashboard'da "New" tıkla**
2. **"Database" seç**
3. **"Add MongoDB" tıkla**
4. **MongoDB service otomatik oluşturulacak**

## Adım 5: Environment Variables Ayarla

Alliance HQ service'inde Variables sekmesine git ve şunları ekle:

```env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
MONGODB_URI=${{MongoDB.DATABASE_URL}}
CORS_ORIGIN=https://${{RAILWAY_PUBLIC_DOMAIN}}
SOCKET_CORS_ORIGIN=https://${{RAILWAY_PUBLIC_DOMAIN}}
MAX_FILE_SIZE=5242880
```

## Adım 6: Custom Domain (Opsiyonel)

1. **Settings > Domains**
2. **"Custom Domain" ekle**
3. **DNS ayarlarını yap**

## Adım 7: Test Et

Deployment tamamlandıktan sonra:

1. **Health Check:** `https://your-app.up.railway.app/api/health`
2. **Ana Sayfa:** `https://your-app.up.railway.app/`
3. **Demo:** `https://your-app.up.railway.app/demo.html`

## 🎯 Railway Avantajları

✅ **MongoDB dahil** - Ayrı database service gerekmez
✅ **Sürekli çalışan server** - Serverless değil
✅ **Otomatik HTTPS** - SSL sertifikası otomatik
✅ **Git auto-deploy** - Push yaptığında otomatik deploy
✅ **Environment variables** - Kolay yönetim
✅ **Logs ve monitoring** - Gerçek zamanlı loglar
✅ **Custom domains** - Kendi domain'inizi bağlayabilirsiniz

## 💰 Maliyet

- **Hobby Plan:** $5/ay kredi
- **Genelde yeterli** çünkü:
  - Sleep mode yok
  - Unlimited bandwidth
  - 512MB RAM
  - 1GB disk

## 🔧 Troubleshooting

### Build Hatası
```bash
# Local'de test et
npm install
npm start
```

### MongoDB Bağlantı Hatası
- Environment variables kontrol et
- MongoDB service'in çalıştığını kontrol et

### CORS Hatası
- CORS_ORIGIN variable'ını kontrol et
- Domain adresini doğru yazdığından emin ol