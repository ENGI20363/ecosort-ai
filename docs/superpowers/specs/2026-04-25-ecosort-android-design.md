# EcoSort AI — Android App Design

**Date:** 2026-04-25  
**Track:** AI for Environmental Sustainability  
**Stack:** Expo (React Native) + existing Supabase Edge Function

---

## Problem

People frequently misSort waste (trash vs. compost vs. recycling), leading to contamination and increased landfill use. A phone camera is the ideal tool for instant classification at the point of disposal.

## Solution

An Android app (built with Expo) that lets users photograph any waste item and instantly receive an AI-powered classification with a disposal tip. The app shares the same backend as the companion web app built by the partner.

---

## Architecture

```
Android App (Expo React Native)
        │
        │  POST { image: base64DataUrl }
        ▼
Supabase Edge Function: classify-waste
  https://txdpuiukpicwxbzgpbdu.supabase.co/functions/v1/classify-waste
        │
        │  Gemini 2.5 Flash (via Lovable AI Gateway)
        ▼
Response: { item, category, confidence, tip }
```

The backend is already deployed. The Android app is a pure client — no new server code needed.

---

## Screens

### Screen 1: Home / Capture
- App name "EcoSort AI" + leaf icon in header
- Two large buttons:
  - "Take Photo" — opens device camera (rear-facing)
  - "Choose from Gallery" — opens image picker
- Items sorted counter (persisted in AsyncStorage)

### Screen 2: Preview + Analyze
- Shows selected image in a 4:3 card
- "Analyze Item" button (full-width, prominent)
- X button to discard and go back
- Loading overlay with spinner while API call is in flight

### Screen 3: Result
- Image displayed with category badge overlaid (top-left)
- Confidence % badge (top-right)
- Detected item name (large, bold)
- Disposal tip in a soft-colored box matching the category
- "Scan Another" button to reset

### Colors (matching web app)
- Recycling: blue
- Compost: green
- Landfill: gray/neutral

---

## Data Flow

1. User captures or picks an image
2. Image is read as base64 data URL
3. POST to Supabase function with `{ image: <base64DataUrl> }`
   - Headers: `apikey` and `Authorization: Bearer <anon key>`
4. Response parsed as `{ item, category, confidence, tip }`
5. Result screen shown; sorted count incremented in AsyncStorage

---

## API Contract

**Endpoint:** `https://txdpuiukpicwxbzgpbdu.supabase.co/functions/v1/classify-waste`  
**Method:** POST  
**Headers:**
```
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
```
**Body:** `{ "image": "data:image/jpeg;base64,..." }`  
**Response:** `{ "item": string, "category": "recycling"|"compost"|"landfill", "confidence": number, "tip": string }`

---

## Key Dependencies

- `expo` — project scaffold and dev tooling
- `expo-camera` — camera access
- `expo-image-picker` — gallery access
- `expo-file-system` — read image as base64
- `@react-navigation/native` — screen navigation
- `react-native-safe-area-context` — safe area handling

---

## Out of Scope

- User accounts / history
- Push notifications
- Offline mode
- Play Store submission (demo only)
