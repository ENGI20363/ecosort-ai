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
