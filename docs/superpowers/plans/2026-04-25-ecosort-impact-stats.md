# EcoSort AI — Impact Tracking & Stats Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-scan environmental impact tracking (kWh saved, CO2 avoided, lbs diverted) and a history/stats screen accessible from the result card.

**Architecture:** A pure lookup module maps item names to impact values. A history module persists scan records in AsyncStorage. A new StatsScreen component displays aggregate totals and the scan list. ResultCard gains an impact row and a "View Stats" button. App.tsx gains a fourth phase (`stats`) and saves each scan to history after classification.

**Tech Stack:** Expo React Native, @react-native-async-storage/async-storage, Jest

---

## Shared Types (reference — no new file needed)

These types are used across tasks. `Classification` and `Category` already exist in `src/types.ts`. Add `ItemImpact`, `ScanRecord`, and `ImpactTotals` to that same file in Task 1.

```typescript
// additions to src/types.ts
export interface ItemImpact {
  kwhSaved: number;
  co2Saved: number;       // lbs CO2 equivalent
  weightDiverted: number; // lbs diverted from landfill
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  item: string;
  category: Category;
  kwhSaved: number;
  co2Saved: number;
  weightDiverted: number;
}

export interface ImpactTotals {
  kwhSaved: number;
  co2Saved: number;
  weightDiverted: number;
  scanCount: number;
}
```

---

## Task 1: Impact lookup module

**Files:**
- Modify: `ecosort-android/src/types.ts`
- Create: `ecosort-android/src/lib/impact.ts`
- Create: `ecosort-android/__tests__/impact.test.ts`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Add new types to src/types.ts**

Open `src/types.ts` and append after the existing exports:

```typescript
export interface ItemImpact {
  kwhSaved: number;
  co2Saved: number;
  weightDiverted: number;
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  item: string;
  category: Category;
  kwhSaved: number;
  co2Saved: number;
  weightDiverted: number;
}

export interface ImpactTotals {
  kwhSaved: number;
  co2Saved: number;
  weightDiverted: number;
  scanCount: number;
}
```

- [ ] **Step 2: Write the failing tests**

Create `__tests__/impact.test.ts`:

```typescript
import { getItemImpact } from '../src/lib/impact';

test('aluminum can returns high kWh savings', () => {
  const impact = getItemImpact('aluminum can', 'recycling');
  expect(impact.kwhSaved).toBe(0.17);
  expect(impact.co2Saved).toBe(0.16);
  expect(impact.weightDiverted).toBe(0.08);
});

test('plastic bottle returns correct values', () => {
  const impact = getItemImpact('plastic bottle', 'recycling');
  expect(impact.kwhSaved).toBe(0.08);
  expect(impact.co2Saved).toBe(0.12);
  expect(impact.weightDiverted).toBe(0.05);
});

test('glass bottle matches glass keyword', () => {
  const impact = getItemImpact('glass bottle', 'recycling');
  expect(impact.kwhSaved).toBe(0.26);
});

test('cardboard box matches cardboard keyword', () => {
  const impact = getItemImpact('cardboard box', 'recycling');
  expect(impact.kwhSaved).toBe(0.06);
});

test('unknown recycling item uses default', () => {
  const impact = getItemImpact('widget', 'recycling');
  expect(impact.kwhSaved).toBe(0.05);
  expect(impact.co2Saved).toBe(0.08);
  expect(impact.weightDiverted).toBe(0.1);
});

test('compost item returns methane credit and zero kWh', () => {
  const impact = getItemImpact('banana peel', 'compost');
  expect(impact.kwhSaved).toBe(0);
  expect(impact.co2Saved).toBe(0.04);
  expect(impact.weightDiverted).toBe(0.25);
});

test('landfill item returns all zeros', () => {
  const impact = getItemImpact('styrofoam cup', 'landfill');
  expect(impact.kwhSaved).toBe(0);
  expect(impact.co2Saved).toBe(0);
  expect(impact.weightDiverted).toBe(0);
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx jest __tests__/impact.test.ts
```
Expected: FAIL — `Cannot find module '../src/lib/impact'`

- [ ] **Step 4: Create src/lib/impact.ts**

```typescript
import { Category, ItemImpact } from '../types';

interface KeywordImpact extends ItemImpact {
  keywords: string[];
}

const RECYCLING_LOOKUP: KeywordImpact[] = [
  { keywords: ['aluminum', 'aluminium'],  kwhSaved: 0.17, co2Saved: 0.16, weightDiverted: 0.08 },
  { keywords: ['plastic bottle', 'bottle'], kwhSaved: 0.08, co2Saved: 0.12, weightDiverted: 0.05 },
  { keywords: ['glass'],                  kwhSaved: 0.26, co2Saved: 0.35, weightDiverted: 0.50 },
  { keywords: ['cardboard', 'box'],       kwhSaved: 0.06, co2Saved: 0.09, weightDiverted: 0.30 },
  { keywords: ['paper', 'newspaper'],     kwhSaved: 0.04, co2Saved: 0.06, weightDiverted: 0.10 },
  { keywords: ['steel', 'tin'],           kwhSaved: 0.14, co2Saved: 0.18, weightDiverted: 0.09 },
];

const DEFAULT_RECYCLING: ItemImpact = { kwhSaved: 0.05, co2Saved: 0.08, weightDiverted: 0.10 };
const DEFAULT_COMPOST: ItemImpact   = { kwhSaved: 0.00, co2Saved: 0.04, weightDiverted: 0.25 };
const DEFAULT_LANDFILL: ItemImpact  = { kwhSaved: 0.00, co2Saved: 0.00, weightDiverted: 0.00 };

export const getItemImpact = (item: string, category: Category): ItemImpact => {
  const lower = item.toLowerCase();

  if (category === 'recycling') {
    const match = RECYCLING_LOOKUP.find(entry =>
      entry.keywords.some(kw => lower.includes(kw))
    );
    return match
      ? { kwhSaved: match.kwhSaved, co2Saved: match.co2Saved, weightDiverted: match.weightDiverted }
      : DEFAULT_RECYCLING;
  }

  if (category === 'compost') return DEFAULT_COMPOST;
  return DEFAULT_LANDFILL;
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/impact.test.ts
```
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/lib/impact.ts __tests__/impact.test.ts
git commit -m "feat: add impact lookup module and extended types"
```

---

## Task 2: Scan history storage

**Files:**
- Create: `ecosort-android/src/lib/history.ts`
- Create: `ecosort-android/__tests__/history.test.ts`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/history.test.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { saveScan, getAllScans, getImpactTotals } from '../src/lib/history';
import { ScanRecord } from '../src/types';

beforeEach(() => AsyncStorage.clear());

const makeRecord = (overrides: Partial<ScanRecord> = {}): ScanRecord => ({
  id: '1',
  timestamp: 1000,
  item: 'plastic bottle',
  category: 'recycling',
  kwhSaved: 0.08,
  co2Saved: 0.12,
  weightDiverted: 0.05,
  ...overrides,
});

test('getAllScans returns empty array when nothing stored', async () => {
  expect(await getAllScans()).toEqual([]);
});

test('saveScan persists a record', async () => {
  const record = makeRecord();
  await saveScan(record);
  const scans = await getAllScans();
  expect(scans).toHaveLength(1);
  expect(scans[0].item).toBe('plastic bottle');
});

test('saveScan prepends new records (newest first)', async () => {
  await saveScan(makeRecord({ id: '1', item: 'bottle' }));
  await saveScan(makeRecord({ id: '2', item: 'can' }));
  const scans = await getAllScans();
  expect(scans[0].item).toBe('can');
  expect(scans[1].item).toBe('bottle');
});

test('getImpactTotals sums all scans correctly', async () => {
  await saveScan(makeRecord({ kwhSaved: 0.1, co2Saved: 0.2, weightDiverted: 0.3 }));
  await saveScan(makeRecord({ kwhSaved: 0.2, co2Saved: 0.3, weightDiverted: 0.4 }));
  const totals = await getImpactTotals();
  expect(totals.kwhSaved).toBeCloseTo(0.3);
  expect(totals.co2Saved).toBeCloseTo(0.5);
  expect(totals.weightDiverted).toBeCloseTo(0.7);
  expect(totals.scanCount).toBe(2);
});

test('getImpactTotals returns zeros when no scans', async () => {
  const totals = await getImpactTotals();
  expect(totals.kwhSaved).toBe(0);
  expect(totals.scanCount).toBe(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/history.test.ts
```
Expected: FAIL — `Cannot find module '../src/lib/history'`

- [ ] **Step 3: Create src/lib/history.ts**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanRecord, ImpactTotals } from '../types';

const KEY = 'ecosort_history';

export const getAllScans = async (): Promise<ScanRecord[]> => {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveScan = async (record: ScanRecord): Promise<void> => {
  const existing = await getAllScans();
  await AsyncStorage.setItem(KEY, JSON.stringify([record, ...existing]));
};

export const getImpactTotals = async (): Promise<ImpactTotals> => {
  const scans = await getAllScans();
  return scans.reduce(
    (acc, s) => ({
      kwhSaved: acc.kwhSaved + s.kwhSaved,
      co2Saved: acc.co2Saved + s.co2Saved,
      weightDiverted: acc.weightDiverted + s.weightDiverted,
      scanCount: acc.scanCount + 1,
    }),
    { kwhSaved: 0, co2Saved: 0, weightDiverted: 0, scanCount: 0 }
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/history.test.ts
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/history.ts __tests__/history.test.ts
git commit -m "feat: add scan history storage"
```

---

## Task 3: StatsScreen component

**Files:**
- Create: `ecosort-android/src/components/StatsScreen.tsx`

No tests — pure UI component.

- [ ] **Step 1: Create src/components/StatsScreen.tsx**

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
          <StatCard label="kWh Saved" value={totals.kwhSaved.toFixed(2)} unit="kWh" color="#16A34A" />
          <StatCard label="CO₂ Avoided" value={totals.co2Saved.toFixed(2)} unit="lbs" color="#2563EB" />
          <StatCard label="Diverted" value={totals.weightDiverted.toFixed(2)} unit="lbs" color="#9333EA" />
          <StatCard label="Items Sorted" value={String(totals.scanCount)} unit="total" color="#EA580C" />
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
                <Text style={styles.scanKwh}>⚡ {scan.kwhSaved.toFixed(2)} kWh</Text>
              )}
              {scan.co2Saved > 0 && scan.kwhSaved === 0 && (
                <Text style={styles.scanKwh}>🌿 {scan.co2Saved.toFixed(2)} lbs CO₂</Text>
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
  container: { flex: 1, backgroundColor: '#F0FDF4', paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { marginRight: 16 },
  backBtnText: { fontSize: 16, color: '#16A34A', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: {
    width: '46%', backgroundColor: '#fff', borderRadius: 20,
    padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  statValue: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  statUnit: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', paddingHorizontal: 24, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 32 },
  scanRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  scanDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  scanInfo: { flex: 1 },
  scanItem: { fontSize: 14, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
  scanMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  scanKwh: { fontSize: 12, fontWeight: '600', color: '#374151' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StatsScreen.tsx
git commit -m "feat: add StatsScreen component"
```

---

## Task 4: Update ResultCard with impact row and View Stats button

**Files:**
- Modify: `ecosort-android/src/components/ResultCard.tsx`

The current `ResultCard` props are `{ result, imageUri, totalSorted, onReset }`. We are adding `impact: ItemImpact` and `onViewStats: () => void`.

- [ ] **Step 1: Replace src/components/ResultCard.tsx with the updated version**

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
            <Text style={styles.tipText}>{result.tip}</Text>
          </View>

          {(impact.kwhSaved > 0 || impact.co2Saved > 0) && (
            <View style={styles.impactRow}>
              {impact.kwhSaved > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>⚡ {impact.kwhSaved.toFixed(2)} kWh saved</Text>
                </View>
              )}
              {impact.co2Saved > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>🌿 {impact.co2Saved.toFixed(2)} lbs CO₂ avoided</Text>
                </View>
              )}
              {impact.weightDiverted > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>♻️ {impact.weightDiverted.toFixed(2)} lbs diverted</Text>
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
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  confidenceBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  confidenceText: { fontWeight: '700', fontSize: 12, color: '#111827' },
  body: { padding: 24, gap: 12 },
  detectedLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF' },
  itemName: { fontSize: 24, fontWeight: '800', color: '#111827', textTransform: 'capitalize', marginTop: -4 },
  tipBox: { borderRadius: 16, padding: 16 },
  tipLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', color: '#6B7280', marginBottom: 6 },
  tipText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  impactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  impactChip: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  impactChipText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  statsBtn: { backgroundColor: '#F0FDF4', borderWidth: 2, borderColor: '#16A34A', borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center' },
  statsBtnText: { color: '#16A34A', fontWeight: '700', fontSize: 15 },
  resetBtn: { backgroundColor: '#111827', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { textAlign: 'center', fontSize: 12, color: '#9CA3AF' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResultCard.tsx
git commit -m "feat: add impact chips and View Stats button to ResultCard"
```

---

## Task 5: Update App.tsx — add stats phase, save scans to history

**Files:**
- Modify: `ecosort-android/App.tsx`

- [ ] **Step 1: Replace App.tsx with the updated version**

```typescript
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Alert, StyleSheet } from 'react-native';
import { CaptureView } from './src/components/CaptureView';
import { PreviewView } from './src/components/PreviewView';
import { ResultCard } from './src/components/ResultCard';
import { StatsScreen } from './src/components/StatsScreen';
import { classifyImage } from './src/api/classify';
import { getItemImpact } from './src/lib/impact';
import { saveScan, getImpactTotals } from './src/lib/history';
import { Classification, ItemImpact } from './src/types';
import { getSortedCount, incrementSortedCount } from './src/lib/storage';

type Phase = 'capture' | 'preview' | 'result' | 'stats';

export default function App() {
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
  root: { flex: 1, backgroundColor: '#F0FDF4' },
});
```

- [ ] **Step 2: Run all tests**

```bash
npx jest
```
Expected: all 20 tests pass (7 impact + 5 history + 3 categories + 3 storage + 2 classify).

- [ ] **Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat: add stats phase and save scans to history"
```
