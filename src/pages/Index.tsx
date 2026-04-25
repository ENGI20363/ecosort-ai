import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScanView } from "@/components/ScanView";
import { ResultCard } from "@/components/ResultCard";
import { MultiResultCard } from "@/components/MultiResultCard";
import { Classification, getSortedCount, incrementSortedCount } from "@/lib/eco";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"single" | "multi" | null>(null);
  const [result, setResult] = useState<Classification | null>(null);
  const [multiResult, setMultiResult] = useState<Classification[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [count, setCount] = useState(0);

  useEffect(() => setCount(getSortedCount()), []);

  const handleAnalyze = async (image: string, mode: "single" | "multi") => {
    setLoading(true);
    setLoadingMode(mode);
    setImageUrl(image);
    try {
      const fn = mode === "multi" ? "classify-waste-multi" : "classify-waste";
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { image },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (mode === "multi") {
        const items = (data?.items ?? []) as Classification[];
        if (!items.length) throw new Error("No items detected. Try a clearer photo.");
        setMultiResult(items);
        let n = count;
        for (let i = 0; i < items.length; i++) n = incrementSortedCount();
        setCount(n);
      } else {
        setResult(data as Classification);
        setCount(incrementSortedCount());
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not analyze image. Try again.");
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  };

  const reset = () => {
    setResult(null);
    setMultiResult(null);
    setImageUrl("");
  };

  return (
    <main className="min-h-screen bg-gradient-soft">
      <div className="mx-auto max-w-md px-5 pt-10 pb-12 min-h-screen flex flex-col">
        <header className="flex items-center justify-between mb-10 animate-fade-up">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-soft">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-none text-foreground">EcoSort AI</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">University of Arizona</p>
            </div>
          </div>
          {count > 0 && (
            <div className="text-right">
              <p className="text-xl font-display font-bold text-primary leading-none">{count}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">sorted</p>
            </div>
          )}
        </header>

        <div className="flex-1 flex flex-col justify-center">
          {result ? (
            <ResultCard result={result} imageUrl={imageUrl} onReset={reset} totalSorted={count} />
          ) : multiResult ? (
            <MultiResultCard items={multiResult} imageUrl={imageUrl} onReset={reset} totalSorted={count} />
          ) : (
            <div className="space-y-8">
              <div className="text-center space-y-3 animate-fade-up">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
                  Sort it right<br />in seconds.
                </h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Snap a photo of one item — or a whole pile — and we'll sort each one.
                </p>
              </div>
              <ScanView onAnalyze={handleAnalyze} loading={loading} loadingMode={loadingMode} />
            </div>
          )}
        </div>

        <footer className="text-center mt-8 text-[11px] text-muted-foreground/70">
          Powered by Lovable AI · Reduce contamination, one scan at a time.
        </footer>
      </div>
    </main>
  );
};

export default Index;
