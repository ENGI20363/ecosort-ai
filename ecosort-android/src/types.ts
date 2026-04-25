export type Category = 'recycling' | 'compost' | 'landfill';

export interface Classification {
  item: string;
  category: Category;
  confidence: number;
  tip: string;
}
