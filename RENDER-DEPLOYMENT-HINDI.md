# Render Pe Frontend Deploy Kaise Kren

## Saransh (Overview)
- **Frontend**: Render pe static site
- **Backend**: Appwrite Functions + Databases
- **Database**: Appwrite Database (koi Mongo/SQL nahi)

---

## Step 1: Appwrite Setup (Ek baar karna hai)

### 1.1 Appwrite Account Banaao
1. [appwrite.io](https://appwrite.io) pe sign up karo
2. New project banao aur ID note karo
   - Project ID: `69d60fbe002bae1e32d5`
   - Database ID: `69d60fe8000c9bd92750` (pehle se mera repo mein hai)
   - Endpoint: `https://nyc.cloud.appwrite.io/v1`

### 1.2 API Key Generate Karo
1. Appwrite Console → Settings → API Keys
2. Naya key generate karo scope with:
   - `databases.read`
   - `databases.write`
   - `storage.read`
   - `storage.write`
3. Key copy karo (ye `APPWRITE_API_KEY` banegaa — kabhi public mat karo!)

### 1.3 Collections Setup (Database)
Appwrite Console → Databases → `PREETAM` (ya apka database name):

Ye collections chahiye:
- `admins` (admins ke liye)
- `news` (news articles)
- `reels` (video content)
- `site_settings` (site config)

Meri repo mein `server/scripts/setup-appwrite-db.js` hai — isse locally run karo:
```bash
APPWRITE_API_KEY=<your-key> \
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1 \
APPWRITE_PROJECT_ID=69d60fbe002bae1e32d5 \
APPWRITE_DB_ID=69d60fe8000c9bd92750 \
node server/scripts/setup-appwrite-db.js
```

---

## Step 2: Git Repo Setup

1. Apne GitHub/GitLab account mein iss repo ko fork ya push karo
2. Repo URL yaad karo (e.g., `https://github.com/yourname/alok-website`)

---

## Step 3: Render Dashboard Pe Frontend Deploy Karo

### 3.1 Render Account Banao
1. [render.com](https://render.com) sign up karo
2. GitHub/GitLab account connect karo

### 3.2 New Service Create Karo
1. Dashboard → "Create New" → "Web Service"
2. Apna repo select karo
3. Settings:
   - **Name**: `alok-frontend` (jaruri)
   - **Environment**: Static Site
   - **Root Directory**: leave blank (repo root mein `render.yaml` hai)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Auto Deploy**: ON

### 3.3 Environment Variables Set Karo
Render Dashboard → Select `alok-frontend` → Environment:

```
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=69d60fbe002bae1e32d5
VITE_API_URL=https://nyc.cloud.appwrite.io/v1
```

(Ye sab `render.yaml` mein pehle se hain — sirf confirm karo ke Render console mein dikhai de rahe hain.)

### 3.4 Deploy Karo
1. "Create Web Service" button press karo
2. Build logs dekho — agar green tick aaye toh success!
3. Deployed site ka URL: `https://alok-frontend-<random>.onrender.com`

---

## Step 4: Backend Ko Appwrite Functions Mein Convert Karo (Optional Aage)

Meri server code (`sites/dencewance/server/src/index.js`) Appwrite Functions banna chahta hai:

### 4.1 Health Function Deploy Karo (Test Ke Liye)
```bash
cd sites/dencewance
bash server/package_function.sh ../functions/health
```

Ye `health.zip` banayega.

### 4.2 Appwrite Console Mein Upload Karo
1. Appwrite Console → Functions
2. "Create Function" → Node.js 18 runtime
3. Upload code zip: `health.zip`
4. Environment variables:
   ```
   APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=69d60fbe002bae1e32d5
   APPWRITE_API_KEY=<your-secret-key>
   ```
5. Deploy aur test karo

---

## Step 5: Render Frontend Se Appwrite Tak Connect Karna

Frontend code pehle se tayyar hai. Check karo:
- `src/appwrite.js` → Appwrite client init karta hai
- Components use karate hain Appwrite SDK

Sab automagically connect ho jayega jab env vars set ho jayenge.

---

## Troubleshooting

### Build fail ho raha hai Render pe?
1. `npm install` manually run karo locally
2. `npm run build` check karo
3. Render logs dekho: Kya package missing hai?
4. Fix karo, commit+push karo

### Frontend load toh hota hai par data nahi aata?
1. Browser console mein CORS error dekho
2. Appwrite CORS settings: Console → Settings → Domains
3. Add karo: `https://alok-frontend-<your-id>.onrender.com`

### API calls fail ho rahe hain?
1. `VITE_APPWRITE_PROJECT_ID` correct hai?
2. Appwrite Database/Collections exist karti hain?
3. Server code `.env` mein `APPWRITE_API_KEY` set hai?

---

## Production Checklist

- [ ] Appwrite account + Project setup
- [ ] API Key generate + secure store kiya
- [ ] Database collections banaye
- [ ] Git repo push kiya
- [ ] Render account + GitHub connect kiya
- [ ] `alok-frontend` service create kiya
- [ ] Env vars set kiye Render mein
- [ ] Build successful? ✅
- [ ] Website open hota hai?
- [ ] Frontend → Appwrite se data aata hai?
- [ ] Admin login kaam kar rahe hai?

---

## Important Links

- Appwrite Docs: https://appwrite.io/docs
- Render Docs: https://render.com/docs
- My Appwrite Setup: `/workspaces/alok-website/DEPLOY-APPWRITE-RENDER.md`

---

**Koy sawaal? Poocho!** 🎉
