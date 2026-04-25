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
