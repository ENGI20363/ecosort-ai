import { Category } from '../types';

interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
  softColor: string;
}

const META: Record<Category, CategoryMeta> = {
  recycling: { label: 'Recycling', emoji: '♻️', color: '#2563EB', softColor: '#DBEAFE' },
  compost:   { label: 'Compost',   emoji: '🌱', color: '#16A34A', softColor: '#DCFCE7' },
  landfill:  { label: 'Landfill',  emoji: '🗑️', color: '#6B7280', softColor: '#F3F4F6' },
};

export const getCategoryMeta = (category: Category): CategoryMeta => META[category];
