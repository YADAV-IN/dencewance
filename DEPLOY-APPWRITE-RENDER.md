**Overview**
- Host frontend on Render; host backend on Appwrite (Functions + Databases).

**What I changed**
- `render.yaml`: removed `alok-backend` and set frontend `VITE_API_URL` to Appwrite endpoint.

**Render (Frontend) — steps**
1. Push this repo to your Git provider (Render watches the repo). `render.yaml` already configures the static site.
2. On Render dashboard, confirm the `alok-frontend` service exists or create it pointing to this repo root. It will run build: `npm install && npm run build` and publish `dist`.
3. Set these Env Vars in Render (Service → Environment):
   - `VITE_APPWRITE_ENDPOINT` = `https://nyc.cloud.appwrite.io/v1` (or your Appwrite endpoint)
   - `VITE_APPWRITE_PROJECT_ID` = your project id
   - (Optional) `VITE_API_URL` — already set in `render.yaml` to Appwrite endpoint; you may override if needed.

**Appwrite (Backend) — steps**
Goal: run server endpoints as Appwrite Functions and use Appwrite Databases/Storage. The repo contains server code under `/server` — convert routes into Appwrite Functions.

1. Create a project in Appwrite and note `PROJECT_ID` and `ENDPOINT`.
2. Create required collections and attributes using `server/scripts/setup-appwrite-db.js` (or via Console).
   - Run locally (requires `APPWRITE_API_KEY`):
```bash
node server/scripts/setup-appwrite-db.js
```
3. Package each server route you want as an Appwrite Function. Example packaging script (zip the function source):
```bash
cd server
zip -r ../function.zip .
```
Then upload via Appwrite Console → Functions → Create Function → Upload code zip, set runtime (Node.js), and define environment variables.

4. Environment variables for Functions (in Appwrite Console):
   - `APPWRITE_API_KEY` = your API key (server key) — keep secret
   - `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_DB_ID` as needed

5. Set function triggers (HTTP) and use the function URL in your frontend or as a webhook.

**Secrets & Security**
- Never commit `APPWRITE_API_KEY`. Use Appwrite function env vars and Render build envs for public VITE_* variables only.

**Optional: migration from Mongo (if needed)**
- If you have a Mongo DB, provide connection URI and I can implement a small Node script to copy collections into Appwrite Databases.

**Next steps I can do for you now**
- Create an example Appwrite Function wrapper for the `server` code and a packaging script.
- Add Render service env var entries to `render.yaml` instead of instructing manual setup.

Choose which of the next steps you want me to perform and I will implement it.
