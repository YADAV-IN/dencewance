// Advanced Translation Utility
// Supports Hindi ↔ English translation

const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

// Dictionary-based translation for common words (fallback)
const hindiToEnglishDict = {
  'नमस्ते': 'Hello',
  'धन्यवाद': 'Thank you',
  'कृपया': 'Please',
  'हाँ': 'Yes',
  'नहीं': 'No',
  'खबर': 'Post',
  'समाचार': 'Post',
  'ब्रेकिंग': 'Breaking',
  'ट्रेंडिंग': 'Trending',
  'लॉगिन': 'Login',
  'एडमिन': 'Admin',
};

const englishToHindiDict = Object.fromEntries(
  Object.entries(hindiToEnglishDict).map(([k, v]) => [v.toLowerCase(), k])
);

// Free translation using MyMemory API
export const translateText = async (text, from = 'auto', to = 'en') => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    // Use MyMemory Translation API (free, no API key needed)
    const langPair = `${from}|${to}`;
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    }
    
    // Fallback to dictionary-based translation
    return fallbackTranslate(text, to);
  } catch (error) {
    console.error('Translation error:', error);
    return fallbackTranslate(text, to);
  }
};

// Fallback dictionary-based translation
const fallbackTranslate = (text, to) => {
  const dict = to === 'hi' ? englishToHindiDict : hindiToEnglishDict;
  const words = text.split(' ');
  const translated = words.map(word => {
    const lower = word.toLowerCase();
    return dict[lower] || word;
  });
  return translated.join(' ');
};

// Detect if text is Hindi or English
export const detectLanguage = (text) => {
  // Check for Devanagari Unicode range (Hindi)
  const hindiPattern = /[\u0900-\u097F]/;
  return hindiPattern.test(text) ? 'hi' : 'en';
};

// Auto-translate: detect language and translate to opposite
export const autoTranslate = async (text) => {
  const detectedLang = detectLanguage(text);
  const targetLang = detectedLang === 'hi' ? 'en' : 'hi';
  return await translateText(text, detectedLang, targetLang);
};

// Translate text from image (OCR + Translation)
export const translateFromImage = async (imageFile) => {
  try {
    // We'll use Tesseract.js for OCR
    // First extract text from image
    const Tesseract = window.Tesseract;
    
    if (!Tesseract) {
      throw new Error('OCR library not loaded');
    }
    
    const { data: { text } } = await Tesseract.recognize(
      imageFile,
      'eng+hin', // Support both English and Hindi
      {
        logger: m => console.log(m)
      }
    );
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text found in image');
    }
    
    // Auto-translate the extracted text
    const translated = await autoTranslate(text);
    
    return {
      originalText: text,
      translatedText: translated,
      detectedLanguage: detectLanguage(text)
    };
  } catch (error) {
    console.error('Image translation error:', error);
    throw error;
  }
};

// Batch translate multiple texts
export const batchTranslate = async (texts, from = 'auto', to = 'en') => {
  const promises = texts.map(text => translateText(text, from, to));
  return await Promise.all(promises);
};
