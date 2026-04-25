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
