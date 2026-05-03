# ALOK डॉक्यूमेंटेशन

यह डॉक्यूमेंटेशन ALOK (BJMC UG News) वेबसाइट के फ्रंटएंड और बैकएंड को भविष्य में समझने, बदलने और स्केल करने के लिए लिखा गया है।

## 1) सिस्टम ओवरव्यू
- फ्रंटएंड: Vite + React
- बैकएंड: Node.js + Express + SQLite
- मीडिया: इमेज अपलोड के लिए `/uploads`
- ऑथ: JWT आधारित एडमिन लॉगिन

## 2) रन कैसे करें

### फ्रंटएंड
```
npm install
npm start
```

### बैकएंड
```
cd server
npm install
npm run dev
```

> डिफॉल्ट बैकएंड पोर्ट `4000` है और फ्रंटएंड `3000`। Vite proxy से `/api` और `/uploads` ऑटो कनेक्ट हो जाते हैं।

## 3) डेटा फ्लो (सरल भाषा)
1. फ्रंटएंड ऐप `/api/news` से न्यूज़ लिस्ट लोड करता है।
2. एडमिन लॉगिन पर `/api/auth/login` से टोकन मिलता है।
3. टोकन के साथ प्रोफाइल अपडेट और न्यूज़ CRUD होता है।
4. इमेज अपलोड होने पर `/uploads/...` URL फ्रंटएंड में दिखता है।

## 4) API एंडपॉइंट्स

### ऑथ
- `POST /api/auth/login`
  - body: `{ "email": "...", "password": "..." }`
  - returns: `{ token, profile }`
- `POST /api/admins` (Auth)
  - body: `{ "name": "...", "email": "...", "password": "...", "bio": "..." }`
- `GET /api/admins` (Auth)
- `PUT /api/admins/:id/password` (Auth)
  - body: `{ "password": "..." }`

### प्रोफाइल
- `GET /api/profile` (Auth)
- `PUT /api/profile` (Auth)
- `POST /api/profile/avatar` (Auth, multipart)

### न्यूज़
- `GET /api/news?limit=12&category=कैंपस&q=ट्रेंड`
- `GET /api/news/:slug`
- `POST /api/news` (Auth)
- `PUT /api/news/:id` (Auth)
- `DELETE /api/news/:id` (Auth)

### इमेज अपलोड
- `POST /api/uploads/cover` (Auth, multipart, field name: `cover`)

## 5) फ्रंटएंड स्ट्रक्चर
- `src/App.jsx` : मुख्य UI, सेक्शन लेआउट, API कॉल्स
- `src/App.css` : ग्लासमॉर्फिज्म थीम, ग्रिड और कार्ड्स
- `src/index.css` : फॉन्ट्स, थीम वेरिएबल्स, बैकग्राउंड

## 6) एडमिन प्रोफाइल और एडिट फ्लो
- लॉगिन के बाद टोकन लोकलस्टोरेज में सेव होता है।
- प्रोफाइल अपडेट से नाम/ईमेल/बायो अपडेट होता है।
- इमेज अपलोड से avatar URL अपडेट होता है और UI पर तुरंत दिखता है।

## 7) न्यूज़ स्टोरी डेटा फील्ड्स (मुख्य)
- `title`: हेडलाइन
- `excerpt`: छोटी स्टोरी लाइन
- `content`: फुल रिपोर्ट
- `category`: टैगिंग के लिए
- `tags`: ऐरे (JSON)
- `cover_image_url`: कवर इमेज
- `video_url`: वीडियो (YouTube embed)
- `ai_summary`: स्टोरी सारांश
- `published_at`: ISO टाइमस्टैम्प
- `reading_time`: ऑटो कैलकुलेट

## 8) फ्यूचर रेडी फीचर्स (इंवेंट किए गए)
- **सिग्नल ग्रिड**: सोशल+लोकल+सरकारी डेटा ट्रेंडिंग फीड
- **इशू मैप**: लोकेशन आधारित स्टोरी मैपिंग
- **ब्रिफ**: स्टोरी का ऑटो समरी और फैक्ट-लेंस
- **क्रिएटर डेस्क**: वीडियो/पॉडकास्ट प्रोडक्शन हब

## 9) कोड नोट्स
- बैकएंड में हर रिस्पॉन्स `{ data: ... }` या `{ error: ... }` फॉर्मेट में है।
- `reading_time` कंटेंट के वर्ड-काउंट से ऑटो आता है।
- `slug` टाइटल से बनता है और यूनिक रखा गया है।

## 10) डिफॉल्ट एडमिन
- Email: `admin@example.com`
- Password: `change-me-before-login`

> प्रोडक्शन में `.env` से बदलें।
