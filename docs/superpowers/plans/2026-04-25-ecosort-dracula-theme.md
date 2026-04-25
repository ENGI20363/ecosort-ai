# EcoSort AI — Dracula Theme + Kumbh Sans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Android app with the Dracula dark colour palette and Kumbh Sans typeface — dark muted base everywhere, Dracula pastels as highlights only.

**Architecture:** Install the Google Fonts package, load fonts in App.tsx, replace all StyleSheet colour values and fontWeight calls across every component, update category metadata in categories.ts.

**Tech Stack:** @expo-google-fonts/kumbh-sans, expo-font (already in expo), existing React Native StyleSheet

---

## Colour Reference (use these exact hex values throughout)

| Role | Value |
|---|---|
| Background | `#282A36` |
| Surface / card | `#44475A` |
| Surface subtle | `#383A47` |
| Primary text | `#F8F8F2` |
| Muted text | `#6272A4` |
| Recycling (cyan) | `#8BE9FD` |
| Recycling soft bg | `rgba(139,233,253,0.12)` |
| Compost (green) | `#50FA7B` |
| Compost soft bg | `rgba(80,250,123,0.12)` |
| Landfill (orange) | `#FFB86C` |
| Landfill soft bg | `rgba(255,184,108,0.12)` |
| Accent / buttons | `#BD93F9` |
| Impact chips bg | `rgba(189,147,249,0.15)` |
| Impact chips text | `#BD93F9` |
| Danger | `#FF5555` |

## Font Reference

| Weight | Family string |
|---|---|
| Regular (400) | `KumbhSans_400Regular` |
| SemiBold (600) | `KumbhSans_600SemiBold` |
| Bold (700) | `KumbhSans_700Bold` |
| ExtraBold (800) | `KumbhSans_800ExtraBold` |

---

## Task 1: Install font package and update categories.ts

**Files:**
- Run: `npx expo install @expo-google-fonts/kumbh-sans`
- Modify: `ecosort-android/src/lib/categories.ts`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Install the font package**

```bash
npx expo install @expo-google-fonts/kumbh-sans
```
Expected: package added to package.json, no errors.

- [ ] **Step 2: Replace src/lib/categories.ts**

```typescript
import { Category } from '../types';

interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
  softColor: string;
}

const META: Record<Category, CategoryMeta> = {
  recycling: { label: 'Recycling', emoji: '♻️', color: '#8BE9FD', softColor: 'rgba(139,233,253,0.12)' },
  compost:   { label: 'Compost',   emoji: '🌱', color: '#50FA7B', softColor: 'rgba(80,250,123,0.12)'  },
  landfill:  { label: 'Landfill',  emoji: '🗑️', color: '#FFB86C', softColor: 'rgba(255,184,108,0.12)' },
};

export const getCategoryMeta = (category: Category): CategoryMeta => META[category];
```

- [ ] **Step 3: Run tests to confirm nothing broke**

```bash
npx jest __tests__/categories.test.ts
```
Expected: 3 tests FAIL — the hex values in the test expectations are the old web-app values. That's expected — update the test expectations to match the new Dracula values:

Open `__tests__/categories.test.ts` and replace the colour assertions:
```typescript
import { getCategoryMeta } from '../src/lib/categories';

test('recycling returns cyan color', () => {
  const meta = getCategoryMeta('recycling');
  expect(meta.label).toBe('Recycling');
  expect(meta.emoji).toBe('♻️');
  expect(meta.color).toBe('#8BE9FD');
});

test('compost returns green color', () => {
  const meta = getCategoryMeta('compost');
  expect(meta.label).toBe('Compost');
  expect(meta.emoji).toBe('🌱');
  expect(meta.color).toBe('#50FA7B');
});

test('landfill returns orange color', () => {
  const meta = getCategoryMeta('landfill');
  expect(meta.label).toBe('Landfill');
  expect(meta.emoji).toBe('🗑️');
  expect(meta.color).toBe('#FFB86C');
});
```

Run again:
```bash
npx jest __tests__/categories.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 4: Commit**

```bash
git add src/lib/categories.ts __tests__/categories.test.ts package.json package-lock.json
git commit -m "feat: install Kumbh Sans and update category colours to Dracula palette"
```

---

## Task 2: Update App.tsx — load fonts, dark root background

**Files:**
- Modify: `ecosort-android/App.tsx`

- [ ] **Step 1: Replace App.tsx**

```typescript
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Alert, StyleSheet, View } from 'react-native';
import { useFonts, KumbhSans_400Regular, KumbhSans_600SemiBold, KumbhSans_700Bold, KumbhSans_800ExtraBold } from '@expo-google-fonts/kumbh-sans';
import { CaptureView } from './src/components/CaptureView';
import { PreviewView } from './src/components/PreviewView';
import { ResultCard } from './src/components/ResultCard';
import { StatsScreen } from './src/components/StatsScreen';
import { classifyImage } from './src/api/classify';
import { getItemImpact } from './src/lib/impact';
import { saveScan } from './src/lib/history';
import { Classification, ItemImpact } from './src/types';
import { getSortedCount, incrementSortedCount } from './src/lib/storage';

type Phase = 'capture' | 'preview' | 'result' | 'stats';

export default function App() {
  const [fontsLoaded] = useFonts({
    KumbhSans_400Regular,
    KumbhSans_600SemiBold,
    KumbhSans_700Bold,
    KumbhSans_800ExtraBold,
  });

  const [phase, setPhase] = useState<Phase>('capture');
  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Classification | null>(null);
  const [impact, setImpact] = useState<ItemImpact>({ kwhSaved: 0, co2Saved: 0, weightDiverted: 0 });
  const [sortedCount, setSortedCount] = useState(0);

  useEffect(() => {
    getSortedCount().then(setSortedCount);
  }, []);

  if (!fontsLoaded) return <View style={styles.loading} />;

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
      const itemImpact = getItemImpact(classification.item, classification.category);

      await saveScan({
        id: String(Date.now()),
        timestamp: Date.now(),
        item: classification.item,
        category: classification.category,
        kwhSaved: itemImpact.kwhSaved,
        co2Saved: itemImpact.co2Saved,
        weightDiverted: itemImpact.weightDiverted,
      });

      const newCount = await incrementSortedCount();
      setResult(classification);
      setImpact(itemImpact);
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
          impact={impact}
          onReset={handleReset}
          onViewStats={() => setPhase('stats')}
        />
      )}
      {phase === 'stats' && (
        <StatsScreen onBack={() => setPhase('result')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#282A36' },
  loading: { flex: 1, backgroundColor: '#282A36' },
});
```

- [ ] **Step 2: Commit**

```bash
git add App.tsx
git commit -m "feat: load Kumbh Sans fonts and set dark root background"
```

---

## Task 3: Restyle CaptureView and PreviewView

**Files:**
- Modify: `ecosort-android/src/components/CaptureView.tsx`
- Modify: `ecosort-android/src/components/PreviewView.tsx`

- [ ] **Step 1: Replace src/components/CaptureView.tsx**

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
        <Text style={styles.primaryBtnText}>📷  Open Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={() => launch(false)}>
        <Text style={styles.secondaryBtnText}>⬆️  Upload Image</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#282A36' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontFamily: 'KumbhSans_800ExtraBold', color: '#F8F8F2' },
  subtitle: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', marginTop: 4 },
  hero: { alignItems: 'center', marginBottom: 48 },
  heroText: { fontSize: 36, fontFamily: 'KumbhSans_800ExtraBold', textAlign: 'center', color: '#F8F8F2', lineHeight: 44 },
  heroSub: { fontSize: 14, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', textAlign: 'center', marginTop: 12, maxWidth: 260, lineHeight: 22 },
  btn: { borderRadius: 16, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#BD93F9' },
  secondaryBtn: { backgroundColor: '#44475A' },
  primaryBtnText: { fontSize: 17, fontFamily: 'KumbhSans_700Bold', color: '#282A36' },
  secondaryBtnText: { fontSize: 17, fontFamily: 'KumbhSans_600SemiBold', color: '#F8F8F2' },
});
```

- [ ] **Step 2: Replace src/components/PreviewView.tsx**

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
          <ActivityIndicator size="large" color="#BD93F9" />
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
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#282A36' },
  imageWrapper: { borderRadius: 24, overflow: 'hidden', aspectRatio: 4 / 3, marginBottom: 20 },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(40,42,54,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: { fontSize: 14, fontFamily: 'KumbhSans_600SemiBold', color: '#F8F8F2' },
  discardBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(40,42,54,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  discardBtnText: { fontSize: 16, color: '#F8F8F2' },
  analyzeBtn: { backgroundColor: '#BD93F9', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnDisabled: { backgroundColor: 'rgba(189,147,249,0.4)' },
  analyzeBtnText: { fontSize: 16, fontFamily: 'KumbhSans_700Bold', color: '#282A36' },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CaptureView.tsx src/components/PreviewView.tsx
git commit -m "feat: apply Dracula theme to CaptureView and PreviewView"
```

---

## Task 4: Restyle ResultCard and StatsScreen

**Files:**
- Modify: `ecosort-android/src/components/ResultCard.tsx`
- Modify: `ecosort-android/src/components/StatsScreen.tsx`

- [ ] **Step 1: Replace src/components/ResultCard.tsx**

```typescript
import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Classification, ItemImpact } from '../types';
import { getCategoryMeta } from '../lib/categories';

interface Props {
  result: Classification;
  imageUri: string;
  totalSorted: number;
  impact: ItemImpact;
  onReset: () => void;
  onViewStats: () => void;
}

export const ResultCard: React.FC<Props> = ({ result, imageUri, totalSorted, impact, onReset, onViewStats }) => {
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
            <Text style={[styles.tipText, { color: meta.color }]}>{result.tip}</Text>
          </View>

          {(impact.kwhSaved > 0 || impact.co2Saved > 0) && (
            <View style={styles.impactRow}>
              {impact.kwhSaved > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>⚡ {impact.kwhSaved.toFixed(2)} kWh</Text>
                </View>
              )}
              {impact.co2Saved > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>🌿 {impact.co2Saved.toFixed(2)} lbs CO₂</Text>
                </View>
              )}
              {impact.weightDiverted > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>♻️ {impact.weightDiverted.toFixed(2)} lbs</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.statsBtn} onPress={onViewStats}>
            <Text style={styles.statsBtnText}>📊 View Your Impact</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
            <Text style={styles.resetBtnText}>↺  Scan Another</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            🌍 <Text style={{ fontFamily: 'KumbhSans_700Bold', color: '#BD93F9' }}>{totalSorted}</Text>
            <Text style={styles.footer}> items sorted correctly</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#282A36' },
  card: { borderRadius: 24, backgroundColor: '#44475A', overflow: 'hidden' },
  imageWrapper: { aspectRatio: 4 / 3, position: 'relative' },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontFamily: 'KumbhSans_700Bold', fontSize: 13, color: '#282A36' },
  confidenceBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(40,42,54,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  confidenceText: { fontFamily: 'KumbhSans_700Bold', fontSize: 12, color: '#F8F8F2' },
  body: { padding: 20, gap: 12 },
  detectedLabel: { fontSize: 11, fontFamily: 'KumbhSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, color: '#6272A4' },
  itemName: { fontSize: 24, fontFamily: 'KumbhSans_800ExtraBold', color: '#F8F8F2', textTransform: 'capitalize' },
  tipBox: { borderRadius: 14, padding: 14 },
  tipLabel: { fontSize: 10, fontFamily: 'KumbhSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, color: '#6272A4', marginBottom: 6 },
  tipText: { fontSize: 14, fontFamily: 'KumbhSans_400Regular', lineHeight: 20 },
  impactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  impactChip: { backgroundColor: 'rgba(189,147,249,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  impactChipText: { fontSize: 12, fontFamily: 'KumbhSans_600SemiBold', color: '#BD93F9' },
  statsBtn: { backgroundColor: '#383A47', borderWidth: 1, borderColor: '#BD93F9', borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center' },
  statsBtnText: { fontFamily: 'KumbhSans_700Bold', fontSize: 15, color: '#BD93F9' },
  resetBtn: { backgroundColor: '#BD93F9', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { fontFamily: 'KumbhSans_700Bold', fontSize: 16, color: '#282A36' },
  footer: { textAlign: 'center', fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4' },
});
```

- [ ] **Step 2: Replace src/components/StatsScreen.tsx**

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ImpactTotals, ScanRecord } from '../types';
import { getAllScans, getImpactTotals } from '../lib/history';
import { getCategoryMeta } from '../lib/categories';

interface Props {
  onBack: () => void;
}

export const StatsScreen: React.FC<Props> = ({ onBack }) => {
  const [totals, setTotals] = useState<ImpactTotals>({ kwhSaved: 0, co2Saved: 0, weightDiverted: 0, scanCount: 0 });
  const [scans, setScans] = useState<ScanRecord[]>([]);

  useEffect(() => {
    getImpactTotals().then(setTotals);
    getAllScans().then(setScans);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Impact</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard label="kWh Saved"    value={totals.kwhSaved.toFixed(2)}      unit="kWh"   color="#8BE9FD" />
          <StatCard label="CO₂ Avoided"  value={totals.co2Saved.toFixed(2)}      unit="lbs"   color="#50FA7B" />
          <StatCard label="Diverted"     value={totals.weightDiverted.toFixed(2)} unit="lbs"   color="#FFB86C" />
          <StatCard label="Items Sorted" value={String(totals.scanCount)}         unit="total" color="#BD93F9" />
        </View>

        <Text style={styles.sectionTitle}>Scan History</Text>

        {scans.length === 0 && (
          <Text style={styles.emptyText}>No scans yet. Start sorting!</Text>
        )}

        {scans.map(scan => {
          const meta = getCategoryMeta(scan.category);
          const date = new Date(scan.timestamp).toLocaleDateString();
          return (
            <View key={scan.id} style={styles.scanRow}>
              <View style={[styles.scanDot, { backgroundColor: meta.color }]} />
              <View style={styles.scanInfo}>
                <Text style={styles.scanItem}>{scan.item}</Text>
                <Text style={styles.scanMeta}>{meta.label} · {date}</Text>
              </View>
              {scan.kwhSaved > 0 && (
                <Text style={styles.scanStat}>⚡ {scan.kwhSaved.toFixed(2)}</Text>
              )}
              {scan.co2Saved > 0 && scan.kwhSaved === 0 && (
                <Text style={styles.scanStat}>🌿 {scan.co2Saved.toFixed(2)}</Text>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const StatCard: React.FC<{ label: string; value: string; unit: string; color: string }> = ({ label, value, unit, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statUnit}>{unit}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282A36', paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { marginRight: 16 },
  backBtnText: { fontSize: 16, fontFamily: 'KumbhSans_600SemiBold', color: '#BD93F9' },
  title: { fontSize: 22, fontFamily: 'KumbhSans_800ExtraBold', color: '#F8F8F2' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { width: '46%', backgroundColor: '#44475A', borderRadius: 20, padding: 20, alignItems: 'center' },
  statValue: { fontSize: 28, fontFamily: 'KumbhSans_800ExtraBold', lineHeight: 32 },
  statUnit: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', marginTop: 2 },
  statLabel: { fontSize: 11, fontFamily: 'KumbhSans_600SemiBold', color: '#6272A4', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 16, fontFamily: 'KumbhSans_700Bold', color: '#F8F8F2', paddingHorizontal: 24, marginBottom: 12 },
  emptyText: { textAlign: 'center', fontFamily: 'KumbhSans_400Regular', color: '#6272A4', fontSize: 14, paddingVertical: 32 },
  scanRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#44475A', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, padding: 16,
  },
  scanDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  scanInfo: { flex: 1 },
  scanItem: { fontSize: 14, fontFamily: 'KumbhSans_600SemiBold', color: '#F8F8F2', textTransform: 'capitalize' },
  scanMeta: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', marginTop: 2 },
  scanStat: { fontSize: 12, fontFamily: 'KumbhSans_600SemiBold', color: '#BD93F9' },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ResultCard.tsx src/components/StatsScreen.tsx
git commit -m "feat: apply Dracula theme to ResultCard and StatsScreen"
```

---

## Task 5: Update app.json splash colour and run full test suite

**Files:**
- Modify: `ecosort-android/app.json`

- [ ] **Step 1: Update splash and adaptive icon background colours in app.json**

Change `"backgroundColor": "#F0FDF4"` to `"backgroundColor": "#282A36"` in all three places it appears (splash and android.adaptiveIcon).

The relevant sections should look like:
```json
"splash": {
  "image": "./assets/splash-icon.png",
  "resizeMode": "contain",
  "backgroundColor": "#282A36"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#282A36"
  },
  ...
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx jest
```
Expected: 20 tests pass (categories colour values now test Dracula hex).

- [ ] **Step 3: Commit**

```bash
git add app.json
git commit -m "feat: update splash and icon background to Dracula dark"
```
