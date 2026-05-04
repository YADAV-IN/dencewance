# Appwrite CORS Issue Fix

## Problem: Frontend Data Load Nahi Ho Rahe

Aapka Render site open toh hota hai lekin Appwrite se data fetch nahi hota.

---

## Fix 1: Render URL Appwrite CORS mein Add Karo ⚠️ **ZARURI**

1. **Render deployed site ka URL dekho:**
   - Render Dashboard → `alok-frontend` service
   - Top pe "Services" section mein URL likha hoga
   - Kuch aise: `https://alok-frontend-random123.onrender.com`

2. **Appwrite Console mein Add Karo:**
   - [Appwrite Console](https://cloud.appwrite.io) open karo
   - Left sidebar → Settings
   - "Domains" section dhundo
   - "+ Add Domain" button press karo
   - Apna Render URL paste karo (exactly copy-paste karo!)
   - Save karo

**Important:** Bina CORS allow kiye frontend ko Appwrite se permission nahi milegi — data nahi load hoga!

---

## Fix 2: Local Testing (Agar Local Server Chalana Ho)

Local dev mein bhi add karo:
- `http://localhost:3000`
- `http://localhost:5173`

---

## Fix 3: Check Karo - Browser Console Mein

1. Render site open karo
2. F12 press karo (Developer Tools)
3. Console tab mein dekho — kya error likha hai?

**Common Errors:**

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"
- **Matlab:** Appwrite ne Render domain ko allow nahi kiya
- **Fix:** Fix 1 wapas dekho — domain add kiya hai na?

### Error: "Network request failed"
- **Matlab:** Internet connection ya Appwrite down hai
- **Fix:** Appwrite site check karo if it's working

### Error: "Project not found" or "Invalid project ID"
- **Matlab:** Environment variables galat hain
- **Fix:** Render Dashboard → Environment Variables check karo
  - `VITE_APPWRITE_ENDPOINT` = `https://nyc.cloud.appwrite.io/v1`
  - `VITE_APPWRITE_PROJECT_ID` = `69d60fbe002bae1e32d5`

---

## Fix 4: Network Tab Check Karo

1. Browser mein F12 → Network tab
2. Site ko refresh karo (Ctrl+R)
3. Filter: Type → XHR (Appwrite API calls)
4. Agar request fail ho toh dekho:
   - Status code kya hai? (403, 404, 500?)
   - Response mein kya likha hai?

---

## Fix 5: Rebuild & Re-deploy Render

Agar environment variables change kiye hain:

1. Local mein test karo:
```bash
npm run build
npm run preview
```

2. Git mein push karo:
```bash
git add .
git commit -m "Fix Appwrite CORS and env vars"
git push origin main
```

3. Render khud automatically rebuild karega (dekho logs)
4. Build complete hone wait karo (green tick)
5. Site refresh karo (Cmd+Shift+R for hard refresh)

---

## Fix 6: Appwrite Database/Collections Check Karo

Agar data still nahi load ho raha:

1. Appwrite Console → Databases
2. Database name: `PREETAM` (ya apka DB)
3. Collections dekho:
   - `news` exist karta hai?
   - `reels` exist karta hai?
   - `admins` exist karta hai?
4. **Agar collection nahi hai:**
   - Server script run karo:
   ```bash
   APPWRITE_API_KEY=<your-api-key> \
   APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1 \
   APPWRITE_PROJECT_ID=69d60fbe002bae1e32d5 \
   APPWRITE_DB_ID=69d60fe8000c9bd92750 \
   node server/scripts/setup-appwrite-db.js
   ```

---

## Quick Checklist

- [ ] Render site URL note kiya?
- [ ] Appwrite CORS mein domain add kiya?
- [ ] Browser console mein dekha — kya error hai?
- [ ] Environment variables Render dashboard mein set hain?
- [ ] Appwrite collections exist karti hain?
- [ ] Site rebuild + re-deploy kiya?

---

## Still Problem? Batao:

1. **Error message screenshot** de
2. **Render site URL** batao
3. **Appwrite endpoint URL** confirm karo

Phir fix kar dunga! 💪
