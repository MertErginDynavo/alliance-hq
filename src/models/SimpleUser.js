const bcrypt = require('bcryptjs');
const db = require('../database/jsondb');

class SimpleUser {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.nickname = userData.nickname || userData.username;
    this.email = userData.email;
    this.password = userData.password;
    this.profileImage = userData.profileImage;
    this.preferredLanguage = userData.preferredLanguage || 'tr';
    this.gameInfo = userData.gameInfo || {};
    this.allianceServer = userData.allianceServer;
    this.alliances = userData.alliances || [];
    this.isOnline = userData.isOnline || false;
    this.lastSeen = userData.lastSeen;
    this.createdAt = userData.createdAt;
    this.updatedAt = userData.updatedAt;
  }

  // Şifre hash'leme
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // Şifre karşılaştırma
  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Kullanıcı kaydetme
  async save() {
    if (this.id) {
      // Güncelleme
      const updated = db.update('users', this.id, this.toObject());
      return updated ? new SimpleUser(updated) : null;
    } else {
      // Yeni kayıt
      if (this.password && !this.password.startsWith('$2')) {
        this.password = await SimpleUser.hashPassword(this.password);
      }
      const saved = db.insert('users', this.toObject());
      return new SimpleUser(saved);
    }
  }

  // Object'e çevirme
  toObject() {
    return {
      id: this.id,
      username: this.username,
      nickname: this.nickname,
      email: this.email,
      password: this.password,
      profileImage: this.profileImage,
      preferredLanguage: this.preferredLanguage,
      gameInfo: this.gameInfo,
      allianceServer: this.allianceServer,
      alliances: this.alliances,
      isOnline: this.isOnline,
      lastSeen: this.lastSeen,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // JSON'a çevirme (şifre olmadan)
  toJSON() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
  }

  // Static metodlar
  static async findById(id) {
    const userData = db.findById('users', id);
    return userData ? new SimpleUser(userData) : null;
  }

  static async findOne(query) {
    const userData = db.findOne('users', query);
    return userData ? new SimpleUser(userData) : null;
  }

  static async find(query = {}) {
    const usersData = db.find('users', query);
    return usersData.map(userData => new SimpleUser(userData));
  }

  static async create(userData) {
    const user = new SimpleUser(userData);
    return await user.save();
  }

  static async deleteById(id) {
    return db.delete('users', id);
  }

  static async count() {
    return db.count('users');
  }
}

module.exports = SimpleUser;