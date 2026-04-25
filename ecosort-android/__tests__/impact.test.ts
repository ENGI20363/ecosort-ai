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
