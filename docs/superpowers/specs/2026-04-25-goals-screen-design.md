# Monthly Goals Screen — Design Spec

**Date:** 2026-04-25

---

## Goal
Give users a way to set monthly targets for kWh saved, CO₂ avoided, and lbs diverted from landfill. A line chart shows cumulative daily progress toward each goal within the current month, directly addressing the judging criterion "show measurable impact and how success can be evaluated."

---

## Navigation
- Button "📈 Monthly Goals" added to StatsScreen, below the search box
- Tapping it advances App.tsx to a new `'goals'` phase
- GoalsScreen has a back button returning to `'stats'`

---

## GoalsScreen Layout

```
← Back        Monthly Goals

[ kWh ] [ CO₂ ] [ Weight ]    ← tab row

Monthly target: [ 5.00 ] kWh  ← editable input + Save button

Line chart
  Y axis: cumulative kWh saved
  X axis: day of month (1 → today)
  Dashed line at goal value
  Filled line showing actual cumulative progress

X.XX / X.XX kWh this month     ← summary below chart
```

---

## Data Model

### Goals storage: `src/lib/goals.ts`
AsyncStorage key: `ecosort_goals`

```typescript
export interface Goals {
  kwhTarget: number;
  co2Target: number;
  weightTarget: number;
}

export const DEFAULT_GOALS: Goals = { kwhTarget: 5, co2Target: 3, weightTarget: 2 };
export const getGoals = async (): Promise<Goals>
export const saveGoals = async (goals: Goals): Promise<void>
```

### Chart data computation
From `getAllScans()`:
1. Filter scans to current calendar month
2. Group by `day = new Date(timestamp).getDate()`
3. For each day 1..today: accumulate the sum of the metric
4. Result: array of length = days elapsed this month, values = cumulative totals

---

## Library
`react-native-chart-kit` with `react-native-svg` as peer dependency.

Install: `npx expo install react-native-chart-kit react-native-svg`

LineChart config:
- `bezier` curve
- `withDots={false}` for clean look
- Background color `#282A36`, line color matches metric (cyan/green/orange)
- Width = `Dimensions.get('window').width - 32`

---

## Components

### GoalsScreen props
```typescript
interface Props {
  onBack: () => void;
}
```

### Internal state
```typescript
type Metric = 'kwh' | 'co2' | 'weight';
const [activeTab, setActiveTab] = useState<Metric>('kwh');
const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
const [inputValue, setInputValue] = useState('');
const [chartData, setChartData] = useState<number[]>([]);
const [currentTotal, setCurrentTotal] = useState(0);
```

### Tab switching
When user switches tab: update `inputValue` to the goal for that metric, recompute `chartData` and `currentTotal` for the new metric.

### Save goal
Parse `inputValue` as float, update the relevant field in `goals`, call `saveGoals`, keep editing in place.

---

## App.tsx changes
- Add `'goals'` to Phase union
- Render `<GoalsScreen onBack={() => setPhase('stats')} />` when phase === 'goals'
- Pass `onViewGoals={() => setPhase('goals')}` to StatsScreen

## StatsScreen changes
- Add `onViewGoals: () => void` prop
- Add button below search row: "📈 Monthly Goals"

---

## Out of Scope
- Historical months
- Per-category breakdown within goals
- Goal notifications or reminders
- Sharing/exporting goals
