const axios = require('axios');

class TranslationService {
  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
    
    // Desteklenen diller
    this.supportedLanguages = {
      'tr': 'Türkçe',
      'en': 'English',
      'es': 'Español',
      'de': 'Deutsch',
      'fr': 'Français',
      'ru': 'Русский',
      'ar': 'العربية',
      'zh': '中文',
      'ja': '日本語',
      'ko': '한국어'
    };
  }

  async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      if (!this.apiKey) {
        console.warn('Google Translate API key bulunamadı, çeviri yapılamıyor');
        return text;
      }

      const params = {
        key: this.apiKey,
        q: text,
        target: targetLanguage
      };

      if (sourceLanguage) {
        params.source = sourceLanguage;
      }

      const response = await axios.post(this.baseUrl, null, { params });
      
      if (response.data && response.data.data && response.data.data.translations) {
        return response.data.data.translations[0].translatedText;
      }

      return text;
    } catch (error) {
      console.error('Çeviri hatası:', error.message);
      return text; // Hata durumunda orijinal metni döndür
    }
  }

  async translateToMultipleLanguages(text, sourceLanguage, targetLanguages) {
    const translations = {};
    
    for (const targetLang of targetLanguages) {
      if (targetLang !== sourceLanguage) {
        try {
          translations[targetLang] = await this.translateText(text, targetLang, sourceLanguage);
        } catch (error) {
          console.error(`${targetLang} diline çeviri hatası:`, error.message);
          translations[targetLang] = text;
        }
      }
    }

    return translations;
  }

  async detectLanguage(text) {
    try {
      if (!this.apiKey) {
        return 'tr'; // Varsayılan dil
      }

      const response = await axios.post(
        'https://translation.googleapis.com/language/translate/v2/detect',
        null,
        {
          params: {
            key: this.apiKey,
            q: text
          }
        }
      );

      if (response.data && response.data.data && response.data.data.detections) {
        return response.data.data.detections[0][0].language;
      }

      return 'tr';
    } catch (error) {
      console.error('Dil tespit hatası:', error.message);
      return 'tr';
    }
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  isLanguageSupported(languageCode) {
    return languageCode in this.supportedLanguages;
  }

  // İttifak üyelerinin dillerini al
  async getAllianceLanguages(alliance) {
    const languages = new Set();
    
    // Tüm üyelerin tercih ettikleri dilleri topla
    for (const member of alliance.members) {
      if (member.userId && member.userId.preferredLanguage) {
        languages.add(member.userId.preferredLanguage);
      }
    }

    return Array.from(languages);
  }

  // Mesajı ittifak üyelerinin dillerine çevir
  async translateForAlliance(text, sourceLanguage, alliance) {
    const allianceLanguages = await this.getAllianceLanguages(alliance);
    const targetLanguages = allianceLanguages.filter(lang => lang !== sourceLanguage);
    
    if (targetLanguages.length === 0) {
      return {};
    }

    return await this.translateToMultipleLanguages(text, sourceLanguage, targetLanguages);
  }
}

module.exports = new TranslationService();