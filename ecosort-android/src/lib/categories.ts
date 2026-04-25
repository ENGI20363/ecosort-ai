import { Category } from '../types';

interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
  softColor: string;
}

const META: Record<Category, CategoryMeta> = {
  recycling: { label: 'Recycling', emoji: '♻️', color: '#8BE9FD', softColor: 'rgba(139,233,253,0.12)' },
  compost:   { label: 'Compost',   emoji: '🌱', color: '#50FA7B', softColor: 'rgba(80,250,123,0.12)'  },
  landfill:  { label: 'Landfill',  emoji: '🗑️', color: '#FFB86C', softColor: 'rgba(255,184,108,0.12)' },
};

export const getCategoryMeta = (category: Category): CategoryMeta => META[category];
