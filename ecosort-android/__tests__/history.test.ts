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
