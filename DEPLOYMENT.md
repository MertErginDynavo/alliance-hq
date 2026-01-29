# 🚀 Alliance HQ Deployment Guide

Bu rehber Alliance HQ'yu ücretsiz hosting sağlayıcılarında nasıl deploy edeceğinizi gösterir.

## 🆓 Ücretsiz Hosting Seçenekleri

### 1. 🚂 Railway (Önerilen - Full Stack)

**Avantajlar:**
- ✅ MongoDB dahil
- ✅ Sürekli çalışan server
- ✅ Otomatik HTTPS
- ✅ Git auto-deploy
- ✅ Environment variables

**Deployment Adımları:**

1. **Railway hesabı oluştur:** https://railway.app
2. **GitHub'a kod yükle**
3. **Railway'de yeni proje oluştur**
4. **GitHub repo'yu bağla**
5. **MongoDB service ekle**
6. **Environment variables ayarla:**
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-secret
   MONGODB_URI=${{MongoDB.DATABASE_URL}}
   ```
7. **Deploy et!**

**Railway CLI ile:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 2. ⚡ Vercel (Frontend + Serverless)

**Avantajlar:**
- ✅ Çok hızlı
- ✅ Global CDN
- ✅ Otomatik HTTPS
- ✅ Git integration

**Deployment Adımları:**

1. **Vercel hesabı oluştur:** https://vercel.com
2. **Vercel CLI yükle:**
   ```bash
   npm install -g vercel
   ```
3. **Deploy et:**
   ```bash
   vercel --prod
   ```

**Not:** MongoDB için ayrı service gerekli (MongoDB Atlas ücretsiz tier)

### 3. 🎨 Render

**Avantajlar:**
- ✅ PostgreSQL dahil
- ✅ Sürekli çalışan server
- ✅ Otomatik SSL

**Deployment Adımları:**

1. **Render hesabı oluştur:** https://render.com
2. **GitHub repo'yu bağla**
3. **Web Service oluştur**
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. **Environment variables ekle**

### 4. 🌐 Netlify (Static + Functions)

**Avantajlar:**
- ✅ Çok hızlı static hosting
- ✅ Serverless functions
- ✅ Form handling

**Deployment Adımları:**

1. **Netlify hesabı oluştur:** https://netlify.com
2. **GitHub repo'yu bağla**
3. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `public`
4. **Environment variables ekle**

## 🔧 Environment Variables

Tüm platformlarda bu environment variables'ları ayarlayın:

```env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key
MONGODB_URI=your-mongodb-connection-string
CORS_ORIGIN=https://your-domain.com
MAX_FILE_SIZE=5242880
```

## 📊 Platform Karşılaştırması

| Platform | Database | Server Type | SSL | Custom Domain | Bandwidth |
|----------|----------|-------------|-----|---------------|-----------|
| Railway  | ✅ MongoDB | Persistent  | ✅  | ✅            | 100GB     |
| Vercel   | ❌ External | Serverless | ✅  | ✅            | 100GB     |
| Render   | ✅ PostgreSQL | Persistent | ✅  | ✅            | 100GB     |
| Netlify  | ❌ External | Static+Functions | ✅ | ✅         | 100GB     |

## 🎯 Önerilen Seçim

**Full-Stack App için:** Railway
**Static Site için:** Netlify
**Serverless için:** Vercel
**PostgreSQL için:** Render

## 🚀 Hızlı Deployment

### Railway (1-Click Deploy)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/your-template-id)

### Vercel (1-Click Deploy)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/alliance-hq)

### Render (1-Click Deploy)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/your-username/alliance-hq)

## 🔍 Deployment Sonrası Kontrol

1. **Health Check:** `https://your-domain.com/api/health`
2. **Ana Sayfa:** `https://your-domain.com/`
3. **Demo:** `https://your-domain.com/demo.html`
4. **API:** `https://your-domain.com/api`

## 🛠️ Troubleshooting

### Yaygın Sorunlar:

1. **MongoDB Bağlantı Hatası**
   - Environment variables kontrol et
   - MongoDB URI formatını kontrol et
   - Network access ayarlarını kontrol et

2. **Build Hatası**
   - Node.js version kontrol et (18+ gerekli)
   - Dependencies kontrol et
   - Build logs kontrol et

3. **CORS Hatası**
   - CORS_ORIGIN environment variable ayarla
   - Domain adresini kontrol et

4. **File Upload Hatası**
   - Upload directory permissions kontrol et
   - File size limits kontrol et

## 📞 Destek

Deployment sorunları için:
- GitHub Issues: https://github.com/your-username/alliance-hq/issues
- Discord: https://discord.gg/alliance-hq
- Email: support@alliance-hq.com