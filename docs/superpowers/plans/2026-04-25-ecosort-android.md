# EcoSort AI Android App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Expo React Native Android app that photographs waste items and classifies them as recycling, compost, or landfill using the existing EcoSort AI Supabase backend.

**Architecture:** App.tsx manages a three-phase state machine (capture → preview → result). Each phase renders a focused component. A shared API module calls the already-deployed Supabase Edge Function and returns a typed Classification result.

**Tech Stack:** Expo (blank TypeScript template), expo-image-picker, @react-native-async-storage/async-storage, Jest (included by Expo)

---

## Task 1: Scaffold the Expo project

**Files:**
- Create: `ecosort-android/` (new directory at repo root, sibling to `ecosort-ai/`)

- [ ] **Step 1: Create the project**

Run from `C:\Users\jpcarlson\hackaz26\`:
```bash
npx create-expo-app@latest ecosort-android --template blank-typescript
```
Expected: directory `ecosort-android/` created with App.tsx, package.json, tsconfig.json.

- [ ] **Step 2: Install runtime dependencies**

```bash
cd ecosort-android
npx expo install expo-image-picker @react-native-async-storage/async-storage
```
Expected: packages added to package.json, no errors.

- [ ] **Step 3: Verify the default app runs**

```bash
npx expo start
```
Scan the QR code with Expo Go on your Android phone. You should see the default "Open up App.tsx..." screen. Press Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: scaffold Expo React Native app"
```

---

## Task 2: Types and category metadata

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/categories.ts`
- Create: `__tests__/categories.test.ts`

- [ ] **Step 1: Create src/types.ts**

```typescript
export type Category = 'recycling' | 'compost' | 'landfill';

export interface Classification {
  item: string;
  category: Category;
  confidence: number;
  tip: string;
}
```

- [ ] **Step 2: Write the failing test**

Create `__tests__/categories.test.ts`:
```typescript
import { getCategoryMeta } from '../src/lib/categories';

test('recycling returns blue color', () => {
  const meta = getCategoryMeta('recycling');
  expect(meta.label).toBe('Recycling');
  expect(meta.emoji).toBe('♻️');
  expect(meta.color).toBe('#2563EB');
});

test('compost returns green color', () => {
  const meta = getCategoryMeta('compost');
  expect(meta.label).toBe('Compost');
  expect(meta.emoji).toBe('🌱');
  expect(meta.color).toBe('#16A34A');
});

test('landfill returns gray color', () => {
  const meta = getCategoryMeta('landfill');
  expect(meta.label).toBe('Landfill');
  expect(meta.emoji).toBe('🗑️');
  expect(meta.color).toBe('#6B7280');
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest __tests__/categories.test.ts
```
Expected: FAIL — `Cannot find module '../src/lib/categories'`

- [ ] **Step 4: Create src/lib/categories.ts**

```typescript
import { Category } from '../types';

interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
  softColor: string;
}

const META: Record<Category, CategoryMeta> = {
  recycling: { label: 'Recycling', emoji: '♻️', color: '#2563EB', softColor: '#DBEAFE' },
  compost:   { label: 'Compost',   emoji: '🌱', color: '#16A34A', softColor: '#DCFCE7' },
  landfill:  { label: 'Landfill',  emoji: '🗑️', color: '#6B7280', softColor: '#F3F4F6' },
};

export const getCategoryMeta = (category: Category): CategoryMeta => META[category];
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest __tests__/categories.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/lib/categories.ts __tests__/categories.test.ts
git commit -m "feat: add Classification types and category metadata"
```

---

## Task 3: Sorted count storage utility

**Files:**
- Create: `src/lib/storage.ts`
- Create: `__tests__/storage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/storage.test.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { getSortedCount, incrementSortedCount } from '../src/lib/storage';

beforeEach(() => AsyncStorage.clear());

test('getSortedCount returns 0 when nothing stored', async () => {
  expect(await getSortedCount()).toBe(0);
});

test('incrementSortedCount increases count by 1', async () => {
  expect(await incrementSortedCount()).toBe(1);
  expect(await incrementSortedCount()).toBe(2);
});

test('getSortedCount returns persisted value', async () => {
  await incrementSortedCount();
  await incrementSortedCount();
  expect(await getSortedCount()).toBe(2);
});
```

- [ ] **Step 2: Add AsyncStorage mock to jest config**

In `package.json`, ensure the jest config includes the mock. Add/merge this into the existing `"jest"` key:
```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
  ],
  "moduleNameMapper": {
    "@react-native-async-storage/async-storage": "@react-native-async-storage/async-storage/jest/async-storage-mock"
  }
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest __tests__/storage.test.ts
```
Expected: FAIL — `Cannot find module '../src/lib/storage'`

- [ ] **Step 4: Create src/lib/storage.ts**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ecosort_count';

export const getSortedCount = async (): Promise<number> => {
  const val = await AsyncStorage.getItem(KEY);
  return parseInt(val ?? '0', 10);
};

export const incrementSortedCount = async (): Promise<number> => {
  const n = (await getSortedCount()) + 1;
  await AsyncStorage.setItem(KEY, String(n));
  return n;
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest __tests__/storage.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/storage.ts __tests__/storage.test.ts package.json
git commit -m "feat: add sorted count storage utility"
```

---

## Task 4: Classify API module

**Files:**
- Create: `src/api/classify.ts`
- Create: `__tests__/classify.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/classify.test.ts`:
```typescript
import { classifyImage } from '../src/api/classify';

global.fetch = jest.fn();

afterEach(() => jest.clearAllMocks());

test('returns classification on success', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      item: 'plastic bottle',
      category: 'recycling',
      confidence: 92,
      tip: 'Rinse and place in blue bin.',
    }),
  });

  const result = await classifyImage('data:image/jpeg;base64,abc123');

  expect(result.item).toBe('plastic bottle');
  expect(result.category).toBe('recycling');
  expect(result.confidence).toBe(92);
  expect(fetch).toHaveBeenCalledWith(
    'https://txdpuiukpicwxbzgpbdu.supabase.co/functions/v1/classify-waste',
    expect.objectContaining({ method: 'POST' })
  );
});

test('throws on non-ok response', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Rate limit reached.' }),
  });

  await expect(classifyImage('data:image/jpeg;base64,abc')).rejects.toThrow('Rate limit reached.');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/classify.test.ts
```
Expected: FAIL — `Cannot find module '../src/api/classify'`

- [ ] **Step 3: Create src/api/classify.ts**

```typescript
import { Classification } from '../types';

const SUPABASE_URL = 'https://txdpuiukpicwxbzgpbdu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZHB1aXVrcGljd3hiemdwYmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzU0MzEsImV4cCI6MjA5MjcxMTQzMX0.KuX4mnOaj8ZOH0eMqv4UkYezyX0sbWy7_mrICOTQ1o0';

export const classifyImage = async (imageDataUrl: string): Promise<Classification> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/classify-waste`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Classification failed');
  return data as Classification;
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/classify.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/api/classify.ts __tests__/classify.test.ts
git commit -m "feat: add classify API module"
```

---

## Task 5: CaptureView component

**Files:**
- Create: `src/components/CaptureView.tsx`

- [ ] **Step 1: Create src/components/CaptureView.tsx**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  onImageSelected: (uri: string, base64: string) => void;
}

export const CaptureView: React.FC<Props> = ({ onImageSelected }) => {
  const launch = async (camera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    };
    const result = camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0].base64) {
      const asset = result.assets[0];
      onImageSelected(asset.uri, asset.base64!);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EcoSort AI</Text>
        <Text style={styles.subtitle}>University of Arizona</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroText}>Sort it right{'\n'}in seconds.</Text>
        <Text style={styles.heroSub}>
          Snap a photo of any item — we'll tell you exactly where it goes.
        </Text>
      </View>

      <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => launch(true)}>
        <Text style={styles.btnText}>📷  Open Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={() => launch(false)}>
        <Text style={[styles.btnText, styles.secondaryBtnText]}>⬆️  Upload Image</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F0FDF4' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  hero: { alignItems: 'center', marginBottom: 40 },
  heroText: { fontSize: 36, fontWeight: '800', textAlign: 'center', color: '#111827', lineHeight: 44 },
  heroSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 12, maxWidth: 260 },
  btn: { borderRadius: 16, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#16A34A' },
  secondaryBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#D1D5DB' },
  btnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  secondaryBtnText: { color: '#374151' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CaptureView.tsx
git commit -m "feat: add CaptureView component"
```

---

## Task 6: PreviewView component

**Files:**
- Create: `src/components/PreviewView.tsx`

- [ ] **Step 1: Create src/components/PreviewView.tsx**

```typescript
import React from 'react';
import { View, Image, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  imageUri: string;
  loading: boolean;
  onAnalyze: () => void;
  onDiscard: () => void;
}

export const PreviewView: React.FC<Props> = ({ imageUri, loading, onAnalyze, onDiscard }) => (
  <View style={styles.container}>
    <View style={styles.imageWrapper}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.analyzingText}>Analyzing...</Text>
        </View>
      )}
      {!loading && (
        <TouchableOpacity style={styles.discardBtn} onPress={onDiscard}>
          <Text style={styles.discardBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>

    <TouchableOpacity
      style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
      onPress={onAnalyze}
      disabled={loading}
    >
      <Text style={styles.analyzeBtnText}>{loading ? 'Analyzing...' : 'Analyze Item'}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F0FDF4' },
  imageWrapper: { borderRadius: 24, overflow: 'hidden', aspectRatio: 4 / 3, marginBottom: 20 },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  discardBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  discardBtnText: { fontSize: 16, color: '#374151' },
  analyzeBtn: { backgroundColor: '#16A34A', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnDisabled: { backgroundColor: '#86EFAC' },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PreviewView.tsx
git commit -m "feat: add PreviewView component"
```

---

## Task 7: ResultCard component

**Files:**
- Create: `src/components/ResultCard.tsx`

- [ ] **Step 1: Create src/components/ResultCard.tsx**

```typescript
import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Classification } from '../types';
import { getCategoryMeta } from '../lib/categories';

interface Props {
  result: Classification;
  imageUri: string;
  totalSorted: number;
  onReset: () => void;
}

export const ResultCard: React.FC<Props> = ({ result, imageUri, totalSorted, onReset }) => {
  const meta = getCategoryMeta(result.category);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          <View style={[styles.badge, { backgroundColor: meta.color }]}>
            <Text style={styles.badgeText}>{meta.emoji} {meta.label}</Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>✨ {Math.round(result.confidence)}%</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.detectedLabel}>Detected</Text>
          <Text style={styles.itemName}>{result.item}</Text>

          <View style={[styles.tipBox, { backgroundColor: meta.softColor }]}>
            <Text style={styles.tipLabel}>Disposal Tip</Text>
            <Text style={styles.tipText}>{result.tip}</Text>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
            <Text style={styles.resetBtnText}>↺  Scan Another</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            🌍 You've sorted <Text style={{ fontWeight: '700', color: '#16A34A' }}>{totalSorted}</Text> items correctly
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F0FDF4' },
  card: { borderRadius: 24, backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  imageWrapper: { aspectRatio: 4 / 3, position: 'relative' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  confidenceBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  confidenceText: { fontWeight: '700', fontSize: 12, color: '#111827' },
  body: { padding: 24, gap: 16 },
  detectedLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF' },
  itemName: { fontSize: 24, fontWeight: '800', color: '#111827', textTransform: 'capitalize', marginTop: -8 },
  tipBox: { borderRadius: 16, padding: 16 },
  tipLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', color: '#6B7280', marginBottom: 6 },
  tipText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  resetBtn: { backgroundColor: '#111827', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { textAlign: 'center', fontSize: 12, color: '#9CA3AF' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResultCard.tsx
git commit -m "feat: add ResultCard component"
```

---

## Task 8: Wire everything together in App.tsx

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Replace App.tsx with the full implementation**

```typescript
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Alert, StyleSheet } from 'react-native';
import { CaptureView } from './src/components/CaptureView';
import { PreviewView } from './src/components/PreviewView';
import { ResultCard } from './src/components/ResultCard';
import { classifyImage } from './src/api/classify';
import { Classification } from './src/types';
import { getSortedCount, incrementSortedCount } from './src/lib/storage';

type Phase = 'capture' | 'preview' | 'result';

export default function App() {
  const [phase, setPhase] = useState<Phase>('capture');
  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Classification | null>(null);
  const [sortedCount, setSortedCount] = useState(0);

  useEffect(() => {
    getSortedCount().then(setSortedCount);
  }, []);

  const handleImageSelected = (uri: string, base64: string) => {
    setImageUri(uri);
    setImageBase64(base64);
    setPhase('preview');
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
      const classification = await classifyImage(dataUrl);
      setResult(classification);
      const newCount = await incrementSortedCount();
      setSortedCount(newCount);
      setPhase('result');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not analyze image. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setImageUri('');
    setImageBase64('');
    setPhase('capture');
  };

  return (
    <SafeAreaView style={styles.root}>
      {phase === 'capture' && (
        <CaptureView onImageSelected={handleImageSelected} />
      )}
      {phase === 'preview' && (
        <PreviewView
          imageUri={imageUri}
          loading={loading}
          onAnalyze={handleAnalyze}
          onDiscard={handleReset}
        />
      )}
      {phase === 'result' && result && (
        <ResultCard
          result={result}
          imageUri={imageUri}
          totalSorted={sortedCount}
          onReset={handleReset}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
});
```

- [ ] **Step 2: Run all tests to verify nothing broke**

```bash
npx jest
```
Expected: all tests from Tasks 2, 3, 4 PASS (8 tests total).

- [ ] **Step 3: Start the dev server and test on your Android phone**

```bash
npx expo start
```
Scan the QR code with Expo Go. Test the full flow:
1. Tap "Open Camera" → take a photo of something
2. Tap "Analyze Item"
3. Verify the result card shows item name, category badge, confidence %, and tip
4. Tap "Scan Another" and verify it returns to the capture screen

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: wire up full app state machine"
```

---

## Task 9: Final polish and demo prep

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Update app name and slug in app.json**

Open `app.json`. Change the `name` and `slug` fields:
```json
{
  "expo": {
    "name": "EcoSort AI",
    "slug": "ecosort-ai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#F0FDF4"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F0FDF4"
      },
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
    }
  }
}
```

- [ ] **Step 2: Run a full end-to-end demo on your phone**

With `npx expo start` running:
1. Photograph a plastic bottle → should classify as **Recycling**
2. Photograph a banana peel → should classify as **Compost**
3. Photograph a styrofoam cup → should classify as **Landfill**
4. Verify sorted count increments each time

- [ ] **Step 3: Final commit**

```bash
git add app.json
git commit -m "feat: finalize app name and splash color"
```
