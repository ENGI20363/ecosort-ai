# Multi-Item Analysis — Design Spec

**Date:** 2026-04-25

---

## Problem

The existing single-item classifier forces users to photograph one item at a time. Real-world waste often involves a pile or tray of mixed items. Multi-item mode lets users photograph the whole scene and get every visible item classified at once, with the results overlaid directly on the photo.

---

## User Flow

1. User captures or selects a photo (existing CaptureView — unchanged)
2. PreviewView shows the photo with two buttons:
   - **Analyze Item** (existing single-item flow — unchanged)
   - **Multi Item Analysis** (new)
3. Tapping "Multi Item Analysis" → loading overlay while the API call runs
4. MultiResultView appears:
   - Full-width photo with colored semi-transparent bounding box overlays and item labels for each detected item
   - Scrollable list of item rows below the photo (name, category badge, tip, impact chips)
   - Each item is saved to scan history individually
   - "Scan Another" button resets to capture phase

---

## Backend: `classify-waste-multi` Edge Function

**File:** `supabase/functions/classify-waste-multi/index.ts`

New Supabase Edge Function, deployed separately from the existing `classify-waste`. Does not modify the existing function — web app is unaffected.

**Endpoint:** `POST /functions/v1/classify-waste-multi`  
**Headers:** same as `classify-waste` (apikey + Authorization Bearer anon key)  
**Body:** `{ "image": "data:image/jpeg;base64,..." }`

**System prompt:**
> You are EcoSort AI. Look at the image and identify ALL visible disposable items. For each item return its name, disposal category, confidence, a one-sentence disposal tip, and a bounding box as fractions (0.0–1.0) of image width and height. x and y are the top-left corner. Only include clearly visible items — ignore background and surfaces.

**Tool schema:**
```json
{
  "name": "classify_items",
  "parameters": {
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "item":       { "type": "string" },
            "category":   { "type": "string", "enum": ["recycling", "compost", "landfill"] },
            "confidence": { "type": "number" },
            "tip":        { "type": "string" },
            "bbox": {
              "type": "object",
              "properties": {
                "x":      { "type": "number" },
                "y":      { "type": "number" },
                "width":  { "type": "number" },
                "height": { "type": "number" }
              },
              "required": ["x", "y", "width", "height"]
            }
          },
          "required": ["item", "category", "confidence", "tip", "bbox"]
        }
      }
    },
    "required": ["items"]
  }
}
```

**Response:** `{ "items": [...] }`

**Error handling:** same pattern as existing function — 429 → rate limit message, 402 → credits message, non-ok → generic error.

---

## Data Types (additions to `src/types.ts`)

```typescript
export interface BoundingBox {
  x: number;      // fraction 0–1 from left edge
  y: number;      // fraction 0–1 from top edge
  width: number;  // fraction 0–1
  height: number; // fraction 0–1
}

export interface MultiClassification {
  item: string;
  category: Category;
  confidence: number;
  tip: string;
  bbox: BoundingBox;
}
```

---

## Android API Module: `src/api/classifyMulti.ts`

Single exported function:

```typescript
export const classifyMulti = async (imageDataUrl: string): Promise<MultiClassification[]>
```

- POSTs to `https://txdpuiukpicwxbzgpbdu.supabase.co/functions/v1/classify-waste-multi`
- Same headers as `classifyImage`
- Returns `data.items` array
- Throws with `data.error` message on non-ok response

---

## MultiResultView Component: `src/components/MultiResultView.tsx`

**Props:**
```typescript
interface Props {
  items: MultiClassification[];
  imageUri: string;
  totalSorted: number;
  onReset: () => void;
}
```

**Annotated image section:**
- `View` with `position: 'relative'`, full width, `aspectRatio: 4/3`
- `Image` fills the view (`width: '100%', height: '100%'`)
- For each item: an absolutely positioned `View` with:
  - `left: bbox.x * 100 + '%'`
  - `top: bbox.y * 100 + '%'`
  - `width: bbox.width * 100 + '%'`
  - `height: bbox.height * 100 + '%'`
  - `backgroundColor: rgba version of category colour at 30% opacity`
  - `borderWidth: 2`, `borderColor: category colour`
  - `borderRadius: 8`
  - Label `Text` at top of box: item name + category emoji, category colour, `KumbhSans_700Bold`, small font, semi-transparent dark background pill

**Item list section (ScrollView below the image):**
- One row per item: category dot, item name, category label, tip, impact chips
- Same styling as StatsScreen scan rows (Dracula dark)
- Each item's impact calculated via `getItemImpact(item, category)` and saved to history via `saveScan`

**Bottom:**
- "Scan Another" button (same style as ResultCard reset button)

---

## PreviewView Changes

Add a second button below "Analyze Item":

```
[ Analyze Item ]          ← existing, calls onAnalyze
[ Multi Item Analysis ]   ← new, calls onAnalyzeMulti
```

New prop: `onAnalyzeMulti: () => void`

---

## App.tsx Changes

- Add `'multi-result'` to the `Phase` union
- Add `multiItems: MultiClassification[]` state (default `[]`)
- Add `handleAnalyzeMulti` async function:
  - Sets `loading: true`
  - Calls `classifyMulti(dataUrl)`
  - Sets `multiItems`, advances phase to `'multi-result'`
  - Errors shown via `Alert`
- Pass `onAnalyzeMulti={() => handleAnalyzeMulti()}` to `PreviewView`
- Render `MultiResultView` when `phase === 'multi-result'`

---

## History Integration

App.tsx handles all storage after `classifyMulti` resolves — consistent with the single-item pattern where ResultCard never calls storage directly.

In `handleAnalyzeMulti`, after receiving items:
```
for each item in items:
  await saveScan({ id: String(Date.now() + index), timestamp: Date.now(), item, category, ...getItemImpact(item, category) })
await incrementSortedCount()   // once per scan, not per item
setSortedCount(await getSortedCount())
```

`MultiResultView` receives `totalSorted: number` as a prop for display only — it makes no storage calls.

---

## Deployment

Before executing the implementation plan, deploy the new function:
```bash
npx supabase login
npx supabase link --project-ref txdpuiukpicwxbzgpbdu
npx supabase functions deploy classify-waste-multi
```

This must be done before testing — the Android app will get a network error until the function is live.

---

## Out of Scope

- Precise ML-based object detection
- Tap-to-select individual items from the overlay
- Multi-item mode on the web app
