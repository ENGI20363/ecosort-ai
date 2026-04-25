import { Category, ItemImpact } from '../types';

interface KeywordImpact extends ItemImpact {
  keywords: string[];
}

const RECYCLING_LOOKUP: KeywordImpact[] = [
  { keywords: ['aluminum', 'aluminium'],    kwhSaved: 0.17, co2Saved: 0.16, weightDiverted: 0.08 },
  { keywords: ['glass'],                    kwhSaved: 0.26, co2Saved: 0.35, weightDiverted: 0.50 },
  { keywords: ['plastic bottle'],           kwhSaved: 0.08, co2Saved: 0.12, weightDiverted: 0.05 },
  { keywords: ['cardboard', 'box'],         kwhSaved: 0.06, co2Saved: 0.09, weightDiverted: 0.30 },
  { keywords: ['paper', 'newspaper'],       kwhSaved: 0.04, co2Saved: 0.06, weightDiverted: 0.10 },
  { keywords: ['steel', 'tin'],             kwhSaved: 0.14, co2Saved: 0.18, weightDiverted: 0.09 },
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
