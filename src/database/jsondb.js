const fs = require('fs');
const path = require('path');

class JsonDatabase {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  getFilePath(collection) {
    return path.join(this.dataDir, `${collection}.json`);
  }

  // Koleksiyon okuma
  read(collection) {
    try {
      const filePath = this.getFilePath(collection);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${collection}:`, error);
      return [];
    }
  }

  // Koleksiyon yazma
  write(collection, data) {
    try {
      const filePath = this.getFilePath(collection);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${collection}:`, error);
      return false;
    }
  }

  // Yeni kayıt ekleme
  insert(collection, record) {
    const data = this.read(collection);
    record.id = this.generateId();
    record.createdAt = new Date().toISOString();
    data.push(record);
    this.write(collection, data);
    return record;
  }

  // ID ile kayıt bulma
  findById(collection, id) {
    const data = this.read(collection);
    return data.find(item => item.id === id);
  }

  // Koşula göre kayıt bulma
  findOne(collection, query) {
    const data = this.read(collection);
    return data.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  // Koşula göre kayıtları bulma
  find(collection, query = {}) {
    const data = this.read(collection);
    if (Object.keys(query).length === 0) {
      return data;
    }
    return data.filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  // Kayıt güncelleme
  update(collection, id, updates) {
    const data = this.read(collection);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
      this.write(collection, data);
      return data[index];
    }
    return null;
  }

  // Kayıt silme
  delete(collection, id) {
    const data = this.read(collection);
    const filteredData = data.filter(item => item.id !== id);
    if (filteredData.length !== data.length) {
      this.write(collection, filteredData);
      return true;
    }
    return false;
  }

  // Basit ID generator
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Koleksiyon sayısı
  count(collection) {
    return this.read(collection).length;
  }

  // Database durumu
  getStatus() {
    try {
      const collections = ['users', 'alliances', 'messages', 'polls', 'seasons'];
      const status = {
        connected: true,
        collections: {},
        totalRecords: 0
      };

      collections.forEach(collection => {
        const count = this.count(collection);
        status.collections[collection] = count;
        status.totalRecords += count;
      });

      return status;
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = new JsonDatabase();