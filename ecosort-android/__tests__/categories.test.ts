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
