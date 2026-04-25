# Backboard + ElevenLabs Integration — Design Spec

**Date:** 2026-04-25

---

## Feature 1: Backboard Memory

### Goal
Every scan is stored as a natural-language memory in Backboard. The stats screen gains a search box that does semantic retrieval over the user's scan history.

### Architecture
Two Supabase Edge Functions act as server-side proxies (API key never leaves the server):
- `backboard-store` — called fire-and-forget after every scan
- `backboard-search` — called when the user submits a search query on the stats screen

The Android app calls both the same way it calls `classify-waste` — fetch with Supabase anon key headers.

### Constants
- Base URL: `https://app.backboard.io/api`
- Assistant ID: `2dd12281-1fc9-46b1-acc1-48cf5fb3b7b7`
- Auth header: `X-API-Key: {BACKBOARD_API_KEY}` (stored as Supabase secret)

### backboard-store Edge Function
**Endpoint:** `POST /functions/v1/backboard-store`  
**Body:** `{ item, category, kwhSaved, co2Saved, weightDiverted, timestamp }`  
**Action:** Builds a human-readable memory string and POSTs to Backboard:
```
"On {date}, scanned a {item} — {category}. Saved {kwhSaved} kWh and {co2Saved} lbs CO₂. Diverted {weightDiverted} lbs from landfill."
```
Returns `{ ok: true }`. Errors are swallowed server-side — this is fire-and-forget.

### backboard-search Edge Function
**Endpoint:** `POST /functions/v1/backboard-search`  
**Body:** `{ query: string }`  
**Action:** POSTs to `POST /assistants/{id}/memories/search` with `{ query, limit: 5 }`  
**Response:** `{ memories: [{ id, content, score, created_at }] }`

### StatsScreen changes
- Add a search input below the stats grid, above the history list
- Placeholder: *"Search your scan history..."*
- On submit: calls `backboard-search`, shows results as a simple list of memory content strings
- Loading state: subtle spinner inside the input
- Error state: show nothing (fail silently — demo shouldn't crash on network issues)

### App.tsx changes
After `handleAnalyze` and `handleAnalyzeMulti` save to local history, fire-and-forget call to `backboard-store`. No await, no error handling shown to user.

---

## Feature 2: ElevenLabs Voice Readout

### Goal
After every scan result (single or multi), the app automatically reads the result aloud using ElevenLabs TTS.

### Architecture
One Supabase Edge Function `elevenlabs-speak` accepts text and returns base64-encoded MP3 audio. The Android app writes it to a temp file and plays it with `expo-av`.

### elevenlabs-speak Edge Function
**Endpoint:** `POST /functions/v1/elevenlabs-speak`  
**Body:** `{ text: string }`  
**Action:** POSTs to `https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB` (Adam voice, free tier)  
**Headers:** `xi-api-key: {ELEVENLABS_API_KEY}`, `Content-Type: application/json`  
**ElevenLabs body:** `{ text, model_id: "eleven_monolingual_v1", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }`  
**Response:** `{ audio: "<base64 mp3 string>" }`

### Speech text format
**Single item:** `"{item} — {category}. {tip}"`  
Example: *"Plastic bottle — recycling. Rinse and place in the blue bin."*

**Multi item:** `"{N} items detected. {item1}: {category1}. {item2}: {category2}."`  
Example: *"3 items detected. Plastic bottle: recycling. Banana peel: compost. Styrofoam cup: landfill."*

### Android speech module: `src/lib/speech.ts`
Exports one function:
```typescript
export const speak = async (text: string): Promise<void>
```
- Calls `elevenlabs-speak` edge function
- Decodes base64 audio
- Writes to `FileSystem.cacheDirectory + 'speech.mp3'` using `expo-file-system`
- Plays with `expo-av` Audio.Sound
- Errors are swallowed — if TTS fails, the app keeps working normally

### New dependencies (Android)
```bash
npx expo install expo-av expo-file-system
```

### Trigger points
- `ResultCard` — call `speak(text)` in a `useEffect` on mount
- `MultiResultView` — call `speak(text)` in a `useEffect` on mount
- Text is constructed in the component from props, passed to `speak()`

---

## Deployment sequence
1. Set Supabase secrets:
   ```bash
   npx supabase secrets set BACKBOARD_API_KEY=<key from docs/api/backboard/api_key.txt>
   npx supabase secrets set ELEVENLABS_API_KEY=<key from docs/api/elevenlabs/api_key.txt>
   ```
2. Deploy functions:
   ```bash
   npx supabase functions deploy backboard-store
   npx supabase functions deploy backboard-search
   npx supabase functions deploy elevenlabs-speak
   ```

---

## Out of Scope
- Backboard memory deletion or editing
- ElevenLabs voice selection in-app
- Backboard chat (requires paid credits)
- TTS on the web app
