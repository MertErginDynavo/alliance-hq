# 🚂 Railway Environment Variables Setup

## Railway Web Interface'inde Ayarlanacak Variables:

1. **Alliance HQ service'ine git**
2. **"Variables" sekmesine tıkla**
3. **Şu değişkenleri ekle:**

```env
NODE_ENV=production
JWT_SECRET=alliance-hq-super-secure-jwt-secret-key-2024-railway
CORS_ORIGIN=https://alliance-hq-production.up.railway.app
SOCKET_CORS_ORIGIN=https://alliance-hq-production.up.railway.app
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./public/uploads
```

## MongoDB Service Eklendikten Sonra:

```env
MONGODB_URI=${{MongoDB.DATABASE_URL}}
```

## Adımlar:

1. ✅ **Deploy edildi** - https://alliance-hq-production.up.railway.app
2. ⏳ **MongoDB service ekle**
3. ⏳ **Environment variables ayarla**
4. ⏳ **Test et**
5. ⏳ **Demo kullanıcı test et**

## Test URL'leri:

- **Ana Sayfa:** https://alliance-hq-production.up.railway.app/
- **Health Check:** https://alliance-hq-production.up.railway.app/api/health
- **Demo:** https://alliance-hq-production.up.railway.app/demo.html
- **Login:** https://alliance-hq-production.up.railway.app/login.html
- **Register:** https://alliance-hq-production.up.railway.app/register.html