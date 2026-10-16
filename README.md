# Songwriting Assistant
 
AI songwriting tool: generate original lyrics, find rhymes, and polish your own lines.
Vanilla JS front end + a serverless function calling the Google Gemini API (free tier).
 
## Run locally (no accounts or CLI needed)
1. Install Node.js 18+ (https://nodejs.org)
2. Get a free key at https://aistudio.google.com/apikey
3. `cp .env.example .env.local` and paste your key into it
4. `npm start` and open http://localhost:3000
## Deploy (free)
Push to GitHub → import in Vercel → add env var `GEMINI_API_KEY` → Deploy.
Optional: `GEMINI_MODEL` to change the model.
 
## Structure
- `public/index.html` – UI (tabs: Write / Rhymes / Polish)
- `lib/lyrics.mjs` – Gemini proxy handler; keeps the API key off the client
- `api/lyrics.js` – Vercel entry point re-exporting the handler
- `server.js` – zero-dependency local server