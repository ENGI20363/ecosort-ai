export type Category = "recycling" | "compost" | "landfill";

export interface Classification {
  item: string;
  category: Category;
  confidence: number;
  tip: string;
  why?: string;
}

export interface MultiClassification {
  items: Classification[];
}

export const confidenceLabel = (n: number): string => {
  if (n >= 85) return "High Confidence";
  if (n >= 60) return "Medium Confidence";
  return "Low Confidence";
};

export const CATEGORY_META: Record<Category, { label: string; emoji: string; bg: string; soft: string; fg: string; ring: string }> = {
  recycling: {
    label: "Recycling",
    emoji: "♻️",
    bg: "bg-recycle",
    soft: "bg-recycle-soft",
    fg: "text-recycle-foreground",
    ring: "ring-recycle/30",
  },
  compost: {
    label: "Compost",
    emoji: "🌱",
    bg: "bg-compost",
    soft: "bg-compost-soft",
    fg: "text-compost-foreground",
    ring: "ring-compost/30",
  },
  landfill: {
    label: "Landfill",
    emoji: "🗑️",
    bg: "bg-landfill",
    soft: "bg-landfill-soft",
    fg: "text-landfill-foreground",
    ring: "ring-landfill/30",
  },
};

const KEY = "ecosort_count";
export const getSortedCount = (): number => {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY) || "0", 10);
};
export const incrementSortedCount = (): number => {
  const n = getSortedCount() + 1;
  localStorage.setItem(KEY, String(n));
  return n;
};
