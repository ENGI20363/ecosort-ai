export type Category = 'recycling' | 'compost' | 'landfill';

export interface Classification {
  item: string;
  category: Category;
  confidence: number;
  tip: string;
}

export interface ItemImpact {
  kwhSaved: number;
  co2Saved: number;
  weightDiverted: number;
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  item: string;
  category: Category;
  kwhSaved: number;
  co2Saved: number;
  weightDiverted: number;
}

export interface ImpactTotals {
  kwhSaved: number;
  co2Saved: number;
  weightDiverted: number;
  scanCount: number;
}
