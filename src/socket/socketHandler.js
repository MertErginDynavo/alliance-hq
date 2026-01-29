const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Alliance = require('../models/Alliance');
const Message = require('../models/Message');
const translationService = require('../services/translationService');

const socketHandler = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 Kullanıcı bağlandı: ${socket.user.username} (${socket.userId})`);

    // Kullanıcıyı online yap
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    // Kullanıcının ittifaklarına katıl
    const userAlliances = await User.findById(socket.userId)
      .populate('alliances.allianceId', '_id');
    
    userAlliances.alliances.forEach(alliance => {
      socket.join(`alliance_${alliance.allianceId._id}`);
    });

    // Mesaj gönderme
    socket.on('send_message', async (data) => {
      try {
        const { allianceId, channel, content, messageType = 'text', attachments = [], channelId } = data;

        // İttifak kontrolü
        const alliance = await Alliance.findById(allianceId)
          .populate('members.userId', 'preferredLanguage');

        if (!alliance) {
          socket.emit('error', { message: 'İttifak bulunamadı' });
          return;
        }

        // Üyelik kontrolü
        const isMember = alliance.members.some(member => 
          member.userId._id.toString() === socket.userId
        );

        if (!isMember) {
          socket.emit('error', { message: 'Bu ittifağa mesaj gönderme yetkiniz yok' });
          return;
        }

        // Özel kanal kontrolü
        if (channel === 'private' && channelId) {
          const hasAccess = alliance.hasChannelAccess(channelId, socket.userId);
          if (!hasAccess) {
            socket.emit('error', { message: 'Bu özel kanala erişim yetkiniz yok' });
            return;
          }
        }

        // Dil tespiti (eğer belirtilmemişse)
        const sourceLanguage = socket.user.preferredLanguage;
        
        // Mesaj oluştur
        const message = new Message({
          alliance: allianceId,
          channel: channelId || channel, // Özel kanal için channelId kullan
          sender: socket.userId,
          content: {
            original: {
              text: content,
              language: sourceLanguage
            },
            translations: []
          },
          messageType,
          attachments
        });

        // İttifak üyelerinin dillerine çevir
        if (alliance.settings.autoTranslate) {
          const allianceLanguages = alliance.members
            .map(member => member.userId.preferredLanguage)
            .filter((lang, index, arr) => arr.indexOf(lang) === index); // Unique diller

          const targetLanguages = allianceLanguages.filter(lang => lang !== sourceLanguage);

          for (const targetLang of targetLanguages) {
            try {
              const translatedText = await translationService.translateText(
                content, 
                targetLang, 
                sourceLanguage
              );
              
              message.content.translations.push({
                language: targetLang,
                text: translatedText
              });
            } catch (error) {
              console.error(`Çeviri hatası (${targetLang}):`, error);
            }
          }
        }

        await message.save();

        // İttifak istatistiklerini güncelle
        await Alliance.findByIdAndUpdate(allianceId, {
          $inc: { 'stats.totalMessages': 1 }
        });

        // Mesajı populate et
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar preferredLanguage');

        // Özel kanal ise sadece yetkili kullanıcılara gönder
        if (channel === 'private' && channelId) {
          const channelObj = alliance.channels.id(channelId);
          if (channelObj && channelObj.isPrivate) {
            // Sadece yetkili kullanıcılara gönder
            const authorizedUserIds = channelObj.authorizedUsers.map(auth => auth.userId.toString());
            
            // Socket.IO'da kullanıcı ID'sine göre gönderim
            io.sockets.sockets.forEach((clientSocket) => {
              if (authorizedUserIds.includes(clientSocket.userId)) {
                clientSocket.emit('new_message', {
                  message: populatedMessage,
                  channel: channelId,
                  isPrivateChannel: true
                });
              }
            });
          }
        } else {
          // Normal kanal - tüm ittifak üyelerine gönder
          io.to(`alliance_${allianceId}`).emit('new_message', {
            message: populatedMessage,
            channel
          });
        }

        console.log(`📨 Mesaj gönderildi: ${socket.user.username} -> ${alliance.name}#${channel}`);

      } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        socket.emit('error', { message: 'Mesaj gönderilemedi' });
      }
    });

    // Mesaj düzenleme
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, newContent } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Mesaj bulunamadı' });
          return;
        }

        // Sadece gönderen düzenleyebilir
        if (message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Bu mesajı düzenleme yetkiniz yok' });
          return;
        }

        // Eski içeriği kaydet
        message.editHistory.push({
          content: message.content.original.text,
          editedAt: new Date()
        });

        // Yeni içeriği güncelle
        message.content.original.text = newContent;
        message.isEdited = true;

        // Çevirileri güncelle
        const sourceLanguage = message.content.original.language;
        for (const translation of message.content.translations) {
          try {
            const newTranslation = await translationService.translateText(
              newContent,
              translation.language,
              sourceLanguage
            );
            translation.text = newTranslation;
            translation.translatedAt = new Date();
          } catch (error) {
            console.error('Çeviri güncelleme hatası:', error);
          }
        }

        await message.save();

        // Güncellemeyi yayınla
        io.to(`alliance_${message.alliance}`).emit('message_edited', {
          messageId,
          newContent: message.content,
          isEdited: true,
          editHistory: message.editHistory
        });

      } catch (error) {
        console.error('Mesaj düzenleme hatası:', error);
        socket.emit('error', { message: 'Mesaj düzenlenemedi' });
      }
    });

    // Mesaj silme
    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Mesaj bulunamadı' });
          return;
        }

        // Sadece gönderen veya ittifak lideri/subayı silebilir
        const alliance = await Alliance.findById(message.alliance);
        const userRole = alliance.members.find(m => 
          m.userId.toString() === socket.userId
        )?.role;

        const canDelete = message.sender.toString() === socket.userId || 
                         ['leader', 'officer'].includes(userRole);

        if (!canDelete) {
          socket.emit('error', { message: 'Bu mesajı silme yetkiniz yok' });
          return;
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        // Silme işlemini yayınla
        io.to(`alliance_${message.alliance}`).emit('message_deleted', {
          messageId,
          deletedBy: socket.userId
        });

      } catch (error) {
        console.error('Mesaj silme hatası:', error);
        socket.emit('error', { message: 'Mesaj silinemedi' });
      }
    });

    // Yazıyor durumu
    socket.on('typing_start', (data) => {
      const { allianceId, channel } = data;
      socket.to(`alliance_${allianceId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username,
        channel
      });
    });

    socket.on('typing_stop', (data) => {
      const { allianceId, channel } = data;
      socket.to(`alliance_${allianceId}`).emit('user_stop_typing', {
        userId: socket.userId,
        channel
      });
    });

    // Bağlantı koptuğunda
    socket.on('disconnect', async () => {
      console.log(`🔌 Kullanıcı ayrıldı: ${socket.user.username}`);
      
      // Kullanıcıyı offline yap
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });
    });
  });
};

module.exports = socketHandler;