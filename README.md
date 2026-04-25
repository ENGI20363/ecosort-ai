# EcoSort AI

Snap a photo of any waste item and instantly know where it goes — recycling, compost, or landfill — with a one-line disposal tip powered by AI.

Built at HackAZ 2026 for the AI for Environmental Sustainability track.

---

## What it does

People regularly put the wrong items in the wrong bins. EcoSort AI removes the guesswork: point your phone at any item and get an instant classification with a confidence score and a specific disposal instruction.

- **Recycling** — plastic bottles, cans, clean paper, cardboard, glass, metal
- **Compost** — food scraps, fruit/vegetable waste, coffee grounds, food-soiled paper
- **Landfill** — styrofoam, plastic film, mixed materials, anything else

---

## Apps

### Web App (`ecosort-ai/`)
React + TypeScript + Tailwind, built with Lovable. Camera and file upload, mobile-optimized. Tracks how many items you've sorted.

**Run locally:**
```bash
cd ecosort-ai
npm install
npm run dev
```

### Android App (`ecosort-android/`)
Expo React Native app. Native camera and gallery access, same classification backend, same visual language.

**Run on your phone:**
```bash
cd ecosort-android
npx expo start
```
Scan the QR code with Expo Go on Android.

---

## How it works

Both apps share a single backend: a Supabase Edge Function (`classify-waste`) that accepts a base64-encoded image and returns a structured classification using Gemini 2.5 Flash.

```
App (web or Android)
  → POST { image: base64DataUrl }
  → Supabase Edge Function
  → Gemini 2.5 Flash
  → { item, category, confidence, tip }
```

---

## Team
Built by two CS/SE juniors at the University of Arizona:

  Rodolfo Robinson Bours (Software Engineering)
  
  Joshua Paul Carlson (Computer Science)
