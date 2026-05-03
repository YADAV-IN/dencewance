import { useState } from 'react';
import { translateText, autoTranslate, translateFromImage, detectLanguage } from '../utils/translator';
import './TranslationTool.css';

export const TranslationTool = ({ isOpen, onClose, language }) => {
  const [mode, setMode] = useState('text'); // 'text' or 'image'
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');

  const handleTextTranslate = async () => {
    if (!inputText.trim()) {
      setError(language === 'hi' ? 'कृपया टेक्स्ट दर्ज करें' : 'Please enter text');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let result;
      if (sourceLang === 'auto') {
        result = await autoTranslate(inputText);
      } else {
        result = await translateText(inputText, sourceLang, targetLang);
      }
      setTranslatedText(result);
    } catch (err) {
      setError(language === 'hi' ? 'अनुवाद में त्रुटि' : 'Translation error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(language === 'hi' ? 'कृपया एक इमेज अपलोड करें' : 'Please upload an image');
      return;
    }

    setImageFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageTranslate = async () => {
    if (!imageFile) {
      setError(language === 'hi' ? 'कृपया इमेज अपलोड करें' : 'Please upload an image');
      return;
    }

    setLoading(true);
    setError('');
    setExtractedText('');
    setTranslatedText('');

    try {
      const result = await translateFromImage(imageFile);
      setExtractedText(result.originalText);
      setTranslatedText(result.translatedText);
    } catch (err) {
      setError(language === 'hi' ? 'इमेज से टेक्स्ट निकालने में त्रुटि' : 'Error extracting text from image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(language === 'hi' ? 'कॉपी हो गया!' : 'Copied!');
  };

  if (!isOpen) return null;

  return (
    <div className="translation-overlay" onClick={onClose}>
      <div className="translation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="translation-header">
          <h2>🌐 {language === 'hi' ? 'अनुवाद उपकरण' : 'Translation Tool'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >
            📝 {language === 'hi' ? 'टेक्स्ट' : 'Text'}
          </button>
          <button
            className={`mode-btn ${mode === 'image' ? 'active' : ''}`}
            onClick={() => setMode('image')}
          >
            🖼️ {language === 'hi' ? 'इमेज' : 'Image'}
          </button>
        </div>

        {mode === 'text' ? (
          <div className="text-translation">
            <div className="lang-controls">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="lang-select"
              >
                <option value="auto">{language === 'hi' ? 'ऑटो डिटेक्ट' : 'Auto Detect'}</option>
                <option value="hi">{language === 'hi' ? 'हिंदी' : 'Hindi'}</option>
                <option value="en">{language === 'hi' ? 'अंग्रेज़ी' : 'English'}</option>
              </select>
              
              <button className="swap-btn" onClick={handleSwapLanguages} title="Swap">
                ⇄
              </button>
              
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="lang-select"
              >
                <option value="hi">{language === 'hi' ? 'हिंदी' : 'Hindi'}</option>
                <option value="en">{language === 'hi' ? 'अंग्रेज़ी' : 'English'}</option>
              </select>
            </div>

            <div className="translation-areas">
              <div className="input-area">
                <label>{language === 'hi' ? 'इनपुट टेक्स्ट' : 'Input Text'}</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={language === 'hi' ? 'यहाँ टेक्स्ट लिखें...' : 'Enter text here...'}
                  rows="8"
                />
              </div>

              <div className="output-area">
                <label>
                  {language === 'hi' ? 'अनुवादित टेक्स्ट' : 'Translated Text'}
                  {translatedText && (
                    <button className="copy-btn" onClick={() => handleCopy(translatedText)}>
                      📋 {language === 'hi' ? 'कॉपी' : 'Copy'}
                    </button>
                  )}
                </label>
                <textarea
                  value={translatedText}
                  readOnly
                  placeholder={language === 'hi' ? 'अनुवाद यहाँ दिखेगा...' : 'Translation will appear here...'}
                  rows="8"
                />
              </div>
            </div>

            <button
              className="translate-btn"
              onClick={handleTextTranslate}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (language === 'hi' ? 'अनुवाद हो रहा है...' : 'Translating...') : 
               (language === 'hi' ? '🔄 अनुवाद करें' : '🔄 Translate')}
            </button>
          </div>
        ) : (
          <div className="image-translation">
            <div className="image-upload-area">
              <label className="upload-label">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📸</span>
                    <p>{language === 'hi' ? 'इमेज अपलोड करें' : 'Upload Image'}</p>
                    <small>{language === 'hi' ? 'PNG, JPG, या JPEG' : 'PNG, JPG, or JPEG'}</small>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {extractedText && (
              <div className="extracted-text">
                <label>
                  {language === 'hi' ? 'निकाला गया टेक्स्ट' : 'Extracted Text'}
                  <button className="copy-btn" onClick={() => handleCopy(extractedText)}>
                    📋 {language === 'hi' ? 'कॉपी' : 'Copy'}
                  </button>
                </label>
                <textarea value={extractedText} readOnly rows="4" />
              </div>
            )}

            {translatedText && (
              <div className="translated-result">
                <label>
                  {language === 'hi' ? 'अनुवादित टेक्स्ट' : 'Translated Text'}
                  <button className="copy-btn" onClick={() => handleCopy(translatedText)}>
                    📋 {language === 'hi' ? 'कॉपी' : 'Copy'}
                  </button>
                </label>
                <textarea value={translatedText} readOnly rows="4" />
              </div>
            )}

            <button
              className="translate-btn"
              onClick={handleImageTranslate}
              disabled={loading || !imageFile}
            >
              {loading ? (language === 'hi' ? 'प्रोसेसिंग...' : 'Processing...') : 
               (language === 'hi' ? '🔍 स्कैन और अनुवाद करें' : '🔍 Scan & Translate')}
            </button>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};
