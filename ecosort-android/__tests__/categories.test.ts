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
