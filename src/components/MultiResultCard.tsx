import { Classification, CATEGORY_META, confidenceLabel } from "@/lib/eco";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles } from "lucide-react";

interface Props {
  items: Classification[];
  imageUrl: string;
  onReset: () => void;
  totalSorted: number;
}

export const MultiResultCard = ({ items, imageUrl, onReset, totalSorted }: Props) => {
  return (
    <div className="w-full max-w-md mx-auto animate-scale-in space-y-4">
      <div className="rounded-3xl overflow-hidden bg-card shadow-card border border-border">
        <div className="relative aspect-[4/3] bg-muted">
          <img src={imageUrl} alt="Scanned items" className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} detected
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((it, i) => {
          const meta = CATEGORY_META[it.category];
          return (
            <div
              key={i}
              className="rounded-2xl bg-card shadow-card border border-border overflow-hidden animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`${meta.soft} px-5 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${meta.fg.replace("text-", "text-")}`}
                    style={{ color: `hsl(var(--${it.category}))` }}>
                    {meta.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  {confidenceLabel(it.confidence)} {Math.round(it.confidence)}%
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-foreground capitalize leading-tight">
                  {it.item}
                </h3>
                {it.why && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Why: </span>
                    {it.why}
                  </p>
                )}
                <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">
                    Disposal Tip
                  </p>
                  <p className="text-sm text-foreground leading-snug">{it.tip}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={onReset}
        size="lg"
        className="w-full rounded-2xl h-14 text-base font-semibold shadow-soft"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Scan Another
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        🌍 You've sorted <span className="font-semibold text-primary">{totalSorted}</span> items correctly
      </p>
    </div>
  );
};
