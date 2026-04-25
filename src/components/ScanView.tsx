import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, Layers, Scan } from "lucide-react";

interface Props {
  onAnalyze: (imageDataUrl: string, mode: "single" | "multi") => void;
  loading: boolean;
  loadingMode: "single" | "multi" | null;
}

export const ScanView = ({ onAnalyze, loading, loadingMode }: Props) => {
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f?: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  if (preview) {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-up space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-muted shadow-card aspect-[4/3]">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          {!loading && (
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-soft"
              aria-label="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">
                {loadingMode === "multi" ? "Analyzing multiple items..." : "Analyzing your item..."}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <Button
            onClick={() => onAnalyze(preview, "single")}
            disabled={loading}
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-semibold shadow-glow bg-gradient-hero hover:opacity-95"
          >
            <Scan className="w-5 h-5 mr-2" />
            Analyze Item
          </Button>
          <Button
            onClick={() => onAnalyze(preview, "multi")}
            disabled={loading}
            variant="outline"
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-semibold border-2"
          >
            <Layers className="w-5 h-5 mr-2" />
            Analyze Multiple Items
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-up space-y-3">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <Button
        onClick={() => cameraRef.current?.click()}
        size="lg"
        className="w-full h-20 rounded-3xl text-lg font-semibold shadow-glow bg-gradient-hero hover:opacity-95 flex-col gap-1"
      >
        <Camera className="w-7 h-7" />
        Open Camera
      </Button>

      <Button
        onClick={() => fileRef.current?.click()}
        variant="outline"
        size="lg"
        className="w-full h-16 rounded-2xl text-base font-medium border-2"
      >
        <Upload className="w-5 h-5 mr-2" />
        Upload Image
      </Button>
    </div>
  );
};
