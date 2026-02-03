const db = require('../database/jsondb');

class SimpleAlliance {
  constructor(allianceData) {
    this.id = allianceData.id;
    this.serverName = allianceData.serverName;
    this.name = allianceData.name;
    this.tag = allianceData.tag;
    this.description = allianceData.description;
    this.gameInfo = allianceData.gameInfo || {};
    this.leader = allianceData.leader;
    this.members = allianceData.members || [];
    this.inviteCode = allianceData.inviteCode;
    this.rules = allianceData.rules || [];
    this.channels = allianceData.channels || [];
    this.stats = allianceData.stats || {
      totalMembers: 0,
      totalMessages: 0,
      totalPolls: 0,
      totalSeasons: 0
    };
    this.createdAt = allianceData.createdAt;
    this.updatedAt = allianceData.updatedAt;
  }

  // Alliance kaydetme
  async save() {
    if (this.id) {
      // Güncelleme
      const updated = db.update('alliances', this.id, this.toObject());
      return updated ? new SimpleAlliance(updated) : null;
    } else {
      // Yeni kayıt
      const saved = db.insert('alliances', this.toObject());
      return new SimpleAlliance(saved);
    }
  }

  // Object'e çevirme
  toObject() {
    return {
      id: this.id,
      serverName: this.serverName,
      name: this.name,
      tag: this.tag,
      description: this.description,
      gameInfo: this.gameInfo,
      leader: this.leader,
      members: this.members,
      inviteCode: this.inviteCode,
      rules: this.rules,
      channels: this.channels,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Üye ekleme
  addMember(userId, role = 'member') {
    const existingMember = this.members.find(m => m.userId === userId);
    if (!existingMember) {
      this.members.push({
        userId: userId,
        role: role,
        joinedAt: new Date().toISOString()
      });
      this.stats.totalMembers = this.members.length;
    }
  }

  // Üye çıkarma
  removeMember(userId) {
    this.members = this.members.filter(m => m.userId !== userId);
    this.stats.totalMembers = this.members.length;
  }

  // Static metodlar
  static async findById(id) {
    const allianceData = db.findById('alliances', id);
    return allianceData ? new SimpleAlliance(allianceData) : null;
  }

  static async findOne(query) {
    const allianceData = db.findOne('alliances', query);
    return allianceData ? new SimpleAlliance(allianceData) : null;
  }

  static async find(query = {}) {
    const alliancesData = db.find('alliances', query);
    return alliancesData.map(allianceData => new SimpleAlliance(allianceData));
  }

  static async create(allianceData) {
    const alliance = new SimpleAlliance(allianceData);
    return await alliance.save();
  }

  static async deleteById(id) {
    return db.delete('alliances', id);
  }

  static async count() {
    return db.count('alliances');
  }
}

module.exports = SimpleAlliance;