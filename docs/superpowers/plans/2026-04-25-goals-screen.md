# Monthly Goals Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a monthly goals screen with a line chart showing cumulative daily progress toward user-set targets for kWh saved, CO₂ avoided, and lbs diverted.

**Architecture:** A new `goals.ts` lib stores monthly targets in AsyncStorage. A new `chartData.ts` lib computes cumulative daily totals from existing scan history. `GoalsScreen` renders a three-tab view with a `react-native-chart-kit` line chart, an editable goal input, and a progress summary bar. StatsScreen gets a "Monthly Goals" button; App.tsx gets a `'goals'` phase.

**Tech Stack:** react-native-chart-kit, react-native-svg, Expo React Native, AsyncStorage

---

## Task 1: Install library + goals.ts + chartData.ts with tests

**Files:**
- Install: `react-native-chart-kit`, `react-native-svg`
- Create: `ecosort-android/src/lib/goals.ts`
- Create: `ecosort-android/src/lib/chartData.ts`
- Create: `ecosort-android/__tests__/goals.test.ts`
- Create: `ecosort-android/__tests__/chartData.test.ts`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Install dependencies**

```bash
npx expo install react-native-chart-kit react-native-svg
```
Expected: packages added to package.json, no errors.

- [ ] **Step 2: Write failing tests for goals.ts**

Create `__tests__/goals.test.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { getGoals, saveGoals, DEFAULT_GOALS } from '../src/lib/goals';

beforeEach(() => AsyncStorage.clear());

test('getGoals returns defaults when nothing stored', async () => {
  const goals = await getGoals();
  expect(goals.kwhTarget).toBe(DEFAULT_GOALS.kwhTarget);
  expect(goals.co2Target).toBe(DEFAULT_GOALS.co2Target);
  expect(goals.weightTarget).toBe(DEFAULT_GOALS.weightTarget);
});

test('saveGoals persists and getGoals retrieves', async () => {
  await saveGoals({ kwhTarget: 10, co2Target: 5, weightTarget: 3 });
  const goals = await getGoals();
  expect(goals.kwhTarget).toBe(10);
  expect(goals.co2Target).toBe(5);
  expect(goals.weightTarget).toBe(3);
});
```

- [ ] **Step 3: Run goals tests to verify they fail**

```bash
npx jest __tests__/goals.test.ts
```
Expected: FAIL — `Cannot find module '../src/lib/goals'`

- [ ] **Step 4: Create src/lib/goals.ts**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ecosort_goals';

export interface Goals {
  kwhTarget: number;
  co2Target: number;
  weightTarget: number;
}

export const DEFAULT_GOALS: Goals = { kwhTarget: 5, co2Target: 3, weightTarget: 2 };

export const getGoals = async (): Promise<Goals> => {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...DEFAULT_GOALS };
  return { ...DEFAULT_GOALS, ...JSON.parse(raw) };
};

export const saveGoals = async (goals: Goals): Promise<void> => {
  await AsyncStorage.setItem(KEY, JSON.stringify(goals));
};
```

- [ ] **Step 5: Run goals tests to verify they pass**

```bash
npx jest __tests__/goals.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 6: Write failing tests for chartData.ts**

Create `__tests__/chartData.test.ts`:
```typescript
import { computeChartData } from '../src/lib/chartData';
import { ScanRecord } from '../src/types';

const makeRecord = (dayOfMonth: number, kwh: number, co2: number, weight: number): ScanRecord => {
  const d = new Date();
  d.setDate(dayOfMonth);
  d.setHours(12, 0, 0, 0);
  return {
    id: String(dayOfMonth),
    timestamp: d.getTime(),
    item: 'test',
    category: 'recycling',
    kwhSaved: kwh,
    co2Saved: co2,
    weightDiverted: weight,
  };
};

test('returns at least 2 data points when no scans', () => {
  const data = computeChartData([], 'kwh');
  expect(data.length).toBeGreaterThanOrEqual(2);
  expect(data.every(v => v === 0)).toBe(true);
});

test('accumulates kwh correctly across days', () => {
  const today = new Date().getDate();
  const scans = [makeRecord(1, 0.1, 0.2, 0.3), makeRecord(1, 0.2, 0.1, 0.1)];
  const data = computeChartData(scans, 'kwh');
  expect(data.length).toBe(Math.max(2, today));
  expect(data[0]).toBeCloseTo(0.3);
});

test('accumulates co2 correctly', () => {
  const scans = [makeRecord(1, 0.1, 0.5, 0.2)];
  const data = computeChartData(scans, 'co2');
  expect(data[0]).toBeCloseTo(0.5);
});

test('excludes scans from previous months', () => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const oldRecord: ScanRecord = {
    id: 'old',
    timestamp: lastMonth.getTime(),
    item: 'test',
    category: 'recycling',
    kwhSaved: 100,
    co2Saved: 100,
    weightDiverted: 100,
  };
  const data = computeChartData([oldRecord], 'kwh');
  expect(data.every(v => v === 0)).toBe(true);
});
```

- [ ] **Step 7: Run chartData tests to verify they fail**

```bash
npx jest __tests__/chartData.test.ts
```
Expected: FAIL — `Cannot find module '../src/lib/chartData'`

- [ ] **Step 8: Create src/lib/chartData.ts**

```typescript
import { ScanRecord } from '../types';

type Metric = 'kwh' | 'co2' | 'weight';

const getMetricValue = (scan: ScanRecord, metric: Metric): number => {
  if (metric === 'kwh') return scan.kwhSaved;
  if (metric === 'co2') return scan.co2Saved;
  return scan.weightDiverted;
};

export const computeChartData = (scans: ScanRecord[], metric: Metric): number[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const monthScans = scans.filter(s => {
    const d = new Date(s.timestamp);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const dailyTotals: Record<number, number> = {};
  for (const scan of monthScans) {
    const day = new Date(scan.timestamp).getDate();
    dailyTotals[day] = (dailyTotals[day] ?? 0) + getMetricValue(scan, metric);
  }

  const result: number[] = [];
  let cumulative = 0;
  for (let day = 1; day <= today; day++) {
    cumulative += dailyTotals[day] ?? 0;
    result.push(parseFloat(cumulative.toFixed(3)));
  }

  if (result.length === 0) return [0, 0];
  if (result.length === 1) return [0, result[0]];
  return result;
};
```

- [ ] **Step 9: Run chartData tests to verify they pass**

```bash
npx jest __tests__/chartData.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 10: Run all tests**

```bash
npx jest
```
Expected: 29 tests pass (23 existing + 2 goals + 4 chartData).

- [ ] **Step 11: Commit**

```bash
git add src/lib/goals.ts src/lib/chartData.ts __tests__/goals.test.ts __tests__/chartData.test.ts package.json package-lock.json
git commit -m "feat: add goals storage and chart data computation"
```

---

## Task 2: GoalsScreen component

**Files:**
- Create: `ecosort-android/src/components/GoalsScreen.tsx`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Create src/components/GoalsScreen.tsx**

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Goals, DEFAULT_GOALS, getGoals, saveGoals } from '../lib/goals';
import { getAllScans } from '../lib/history';
import { computeChartData } from '../lib/chartData';
import { ScanRecord } from '../types';

interface Props {
  onBack: () => void;
}

type Metric = 'kwh' | 'co2' | 'weight';

const TABS: { key: Metric; label: string; unit: string; color: string; goalKey: keyof Goals }[] = [
  { key: 'kwh',    label: 'kWh Saved',   unit: 'kWh', color: '#8BE9FD', goalKey: 'kwhTarget'    },
  { key: 'co2',    label: 'CO₂ Avoided', unit: 'lbs', color: '#50FA7B', goalKey: 'co2Target'    },
  { key: 'weight', label: 'Diverted',    unit: 'lbs', color: '#FFB86C', goalKey: 'weightTarget' },
];

const screenWidth = Dimensions.get('window').width;

export const GoalsScreen: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Metric>('kwh');
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [inputValue, setInputValue] = useState(String(DEFAULT_GOALS.kwhTarget));
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [chartData, setChartData] = useState<number[]>([0, 0]);

  useEffect(() => {
    getGoals().then(g => {
      setGoals(g);
      setInputValue(String(g.kwhTarget));
    });
    getAllScans().then(s => setScans(s));
  }, []);

  useEffect(() => {
    setChartData(computeChartData(scans, activeTab));
  }, [scans, activeTab]);

  const tab = TABS.find(t => t.key === activeTab)!;
  const currentGoal = goals[tab.goalKey];
  const currentTotal = chartData[chartData.length - 1] ?? 0;
  const progress = currentGoal > 0 ? Math.min(1, currentTotal / currentGoal) : 0;

  const handleTabChange = (metric: Metric) => {
    setActiveTab(metric);
    const t = TABS.find(t => t.key === metric)!;
    setInputValue(String(goals[t.goalKey]));
  };

  const handleSave = async () => {
    const value = parseFloat(inputValue) || 0;
    const updated = { ...goals, [tab.goalKey]: value };
    setGoals(updated);
    await saveGoals(updated);
  };

  const labels = chartData.map((_, i) => {
    const day = i + 1;
    if (day === 1 || day % 5 === 0 || i === chartData.length - 1) return String(day);
    return '';
  });

  const goalLineData = Array(chartData.length).fill(currentGoal);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Monthly Goals</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && { borderBottomColor: t.color, borderBottomWidth: 2 }]}
              onPress={() => handleTabChange(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Monthly target</Text>
          <View style={styles.goalInputRow}>
            <TextInput
              style={styles.goalInput}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <Text style={styles.goalUnit}>{tab.unit}</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartWrapper}>
          <LineChart
            data={{
              labels,
              datasets: [
                { data: chartData, color: () => tab.color, strokeWidth: 2 },
                { data: goalLineData, color: () => 'rgba(255,255,255,0.25)', strokeWidth: 1 },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#44475A',
              backgroundGradientFrom: '#44475A',
              backgroundGradientTo: '#383A47',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(248,248,242,${opacity})`,
              labelColor: (opacity = 1) => `rgba(98,114,164,${opacity})`,
              propsForDots: { r: '0' },
              propsForBackgroundLines: { stroke: 'rgba(98,114,164,0.2)' },
            }}
            bezier
            style={{ borderRadius: 16 }}
          />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>This month</Text>
            <Text style={[styles.summaryValue, { color: tab.color }]}>
              {currentTotal.toFixed(2)} / {currentGoal.toFixed(2)} {tab.unit}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: tab.color }]} />
          </View>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}% of goal</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282A36', paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { marginRight: 16 },
  backBtnText: { fontSize: 16, fontFamily: 'KumbhSans_600SemiBold', color: '#BD93F9' },
  title: { fontSize: 22, fontFamily: 'KumbhSans_800ExtraBold', color: '#F8F8F2' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#44475A' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13, fontFamily: 'KumbhSans_600SemiBold', color: '#6272A4' },
  goalRow: { marginHorizontal: 16, marginBottom: 20 },
  goalLabel: { fontSize: 12, fontFamily: 'KumbhSans_600SemiBold', color: '#6272A4', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalInput: { backgroundColor: '#44475A', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 18, fontFamily: 'KumbhSans_700Bold', color: '#F8F8F2', width: 100 },
  goalUnit: { fontSize: 14, fontFamily: 'KumbhSans_400Regular', color: '#6272A4' },
  saveBtn: { backgroundColor: '#BD93F9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  saveBtnText: { fontSize: 14, fontFamily: 'KumbhSans_700Bold', color: '#282A36' },
  chartWrapper: { marginHorizontal: 16, marginBottom: 16 },
  summaryCard: { backgroundColor: '#44475A', marginHorizontal: 16, borderRadius: 16, padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontFamily: 'KumbhSans_600SemiBold', color: '#6272A4' },
  summaryValue: { fontSize: 15, fontFamily: 'KumbhSans_700Bold' },
  progressBar: { height: 8, backgroundColor: '#383A47', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPercent: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', textAlign: 'right' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GoalsScreen.tsx
git commit -m "feat: add GoalsScreen with line chart and monthly goal tracking"
```

---

## Task 3: Wire up StatsScreen + App.tsx

**Files:**
- Modify: `ecosort-android/src/components/StatsScreen.tsx`
- Modify: `ecosort-android/App.tsx`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Add onViewGoals to StatsScreen**

Read the current `src/components/StatsScreen.tsx`. Make two changes:

**Change 1** — update the Props interface to add `onViewGoals`:
```typescript
interface Props {
  onBack: () => void;
  onViewGoals: () => void;
}
```

**Change 2** — destructure `onViewGoals` in the component signature:
```typescript
export const StatsScreen: React.FC<Props> = ({ onBack, onViewGoals }) => {
```

**Change 3** — add the goals button immediately after the closing `</View>` of the `searchRow` (the row containing the search input and Go button). Insert this block:
```typescript
<TouchableOpacity style={styles.goalsBtn} onPress={onViewGoals}>
  <Text style={styles.goalsBtnText}>📈 Monthly Goals</Text>
</TouchableOpacity>
```

**Change 4** — add the button style to the StyleSheet (inside the existing `StyleSheet.create({...})`):
```typescript
goalsBtn: { backgroundColor: '#383A47', borderWidth: 1, borderColor: '#50FA7B', borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginBottom: 16 },
goalsBtnText: { fontFamily: 'KumbhSans_700Bold', fontSize: 15, color: '#50FA7B' },
```

- [ ] **Step 2: Update App.tsx**

Read the current `App.tsx`. Make these changes:

**Change 1** — add GoalsScreen import after the StatsScreen import:
```typescript
import { GoalsScreen } from './src/components/GoalsScreen';
```

**Change 2** — add `'goals'` to the Phase union:
```typescript
type Phase = 'capture' | 'preview' | 'result' | 'multi-result' | 'stats' | 'goals';
```

**Change 3** — update the StatsScreen render to pass `onViewGoals`:
```typescript
{phase === 'stats' && (
  <StatsScreen onBack={() => setPhase('result')} onViewGoals={() => setPhase('goals')} />
)}
```

**Change 4** — add the GoalsScreen render after the StatsScreen render:
```typescript
{phase === 'goals' && (
  <GoalsScreen onBack={() => setPhase('stats')} />
)}
```

- [ ] **Step 3: Run all tests**

```bash
npx jest
```
Expected: 29 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/StatsScreen.tsx App.tsx
git commit -m "feat: wire GoalsScreen into app navigation"
```

- [ ] **Step 5: Test on phone**

```bash
npx expo start --clear
```
1. Make a few scans
2. Go to stats screen → tap "📈 Monthly Goals"
3. Verify the chart shows today's cumulative progress
4. Change the kWh target → tap Save → verify the goal line on the chart updates
5. Switch tabs to CO₂ and Weight — verify chart and progress bar update
6. Tap ← Back → verify returns to stats screen
