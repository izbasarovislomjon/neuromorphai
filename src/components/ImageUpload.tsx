import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { AnalysisResult } from "@/lib/analysisTypes";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { getSupabaseClient } from "@/integrations/supabase/client";

interface ImageUploadProps {
  onAnalysisComplete: (data: AnalysisResult, previewImage: string) => void;
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read failed"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

async function downscaleImageDataUrl(
  dataUrl: string,
  opts: { maxSide: number; quality: number; mimeType: "image/jpeg" | "image/webp" } = {
    maxSide: 1024,
    quality: 0.85,
    mimeType: "image/jpeg",
  }
): Promise<string> {
  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";

  const loaded = await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image decode failed"));
    img.src = dataUrl;
  });
  void loaded;

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error("Invalid image dimensions");

  const scale = Math.min(1, opts.maxSide / Math.max(w, h));
  if (scale >= 1) return dataUrl;

  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0, outW, outH);
  const compressed = canvas.toDataURL(opts.mimeType, opts.quality);
  if (!compressed.startsWith("data:")) throw new Error("Failed to compress image");
  return compressed;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message = "Request timed out"): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

export const ImageUpload = ({ onAnalysisComplete }: ImageUploadProps) => {
  const { lang } = useLanguage();
  const tr = t(lang);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [patientAge, setPatientAge] = useState<number | "">("");

  const handleFile = useCallback(async (file: File) => {
    if (patientAge === "" || patientAge < 1 || patientAge > 120) {
      setStatus("error");
      setErrorMsg(
        lang === "uz" ? "Iltimos, bemor yoshini kiriting (1-120)." :
        lang === "ru" ? "Пожалуйста, укажите возраст пациента (1-120)." :
        "Please enter patient age (1-120)."
      );
      return;
    }

    setStatus("analyzing");
    setErrorMsg("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setStatus("error");
        setErrorMsg(
          lang === "uz"
            ? "Server konfiguratsiyasi noto‘g‘ri. Iltimos, keyinroq qayta urinib ko‘ring."
            : lang === "ru"
              ? "Неверная конфигурация сервера. Пожалуйста, попробуйте позже."
              : "Server configuration error. Please try again later."
        );
        return;
      }

      // Supabase Edge Functions often fail/time out with large base64 payloads.
      // We downscale to keep the request size manageable.
      const originalDataUrl = await fileToDataUrl(file);
      const preparedDataUrl = await downscaleImageDataUrl(originalDataUrl, {
        maxSide: 1024,
        quality: 0.85,
        mimeType: "image/jpeg",
      });

      setPreview(preparedDataUrl);

      const { data, error } = await withTimeout(
        supabase.functions.invoke("analyze-brain", {
          body: { imageBase64: preparedDataUrl, lang, patientAge: Number(patientAge) },
        }),
        60_000,
        lang === "uz"
          ? "Tahlil juda uzoq davom etdi (timeout). Iltimos, qayta urinib ko‘ring."
          : lang === "ru"
            ? "Анализ занял слишком много времени (таймаут). Попробуйте ещё раз."
            : "Analysis took too long (timeout). Please try again."
      );

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.rejected) {
        setStatus("error");
        setErrorMsg(
          data.reason ||
            tr.notMri ||
            "Bu haqiqiy MRT tasviri emas. Iltimos, haqiqiy MRT rasmini yuklang."
        );
        return;
      }

      setStatus("done");
      onAnalysisComplete(data as AnalysisResult, preparedDataUrl);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setStatus("error");
      setErrorMsg(err?.message || "Analysis failed");
    }
  }, [onAnalysisComplete, lang, patientAge]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStatus("idle");
    setPreview(null);
    setErrorMsg("");
  };

  const ageLabel = lang === "uz" ? "Bemor yoshi" : lang === "ru" ? "Возраст пациента" : "Patient Age";

  return (
    <section className="px-6 py-12 md:px-12">
      <div className="mx-auto max-w-2xl">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-center text-2xl font-semibold text-foreground"
        >
          {tr.uploadTitle}
        </motion.h2>

        {/* Age input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4 flex items-center justify-center gap-3"
        >
          <label htmlFor="patient-age" className="text-sm font-medium text-foreground">
            {ageLabel}:
          </label>
          <input
            id="patient-age"
            type="number"
            min={1}
            max={120}
            value={patientAge}
            onChange={(e) => setPatientAge(e.target.value === "" ? "" : Math.max(1, Math.min(120, Number(e.target.value))))}
            placeholder="45"
            className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm font-mono-data text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <span className="text-xs text-muted-foreground">
            {lang === "uz" ? "yosh" : lang === "ru" ? "лет" : "years"}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`medical-card relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-300 ${
            isDragging ? "border-accent bg-accent/5" : "border-border/60"
          } ${status !== "idle" ? "border-solid" : ""}`}
        >
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-sm">{tr.uploadDesc}</p>
                <label className="cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90">
                  <FileImage className="mr-2 inline h-4 w-4" />
                  {tr.uploadButton}
                  <input type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
                </label>
              </motion.div>
            )}

            {status === "analyzing" && (
              <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                {preview && <img src={preview} alt="MRI preview" className="mb-2 h-32 w-32 rounded-xl object-cover opacity-60" />}
                <div className="relative flex items-center justify-center">
                  <motion.div className="absolute h-16 w-16 rounded-full border-2 border-accent/30" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                  <motion.div className="absolute h-12 w-12 rounded-full border-2 border-accent/50" animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
                <p className="text-sm font-medium text-accent font-mono-data">{tr.analyzing}</p>
                <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
                  <div className="h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
                    <motion.div className="h-full rounded-full bg-accent" initial={{ width: "0%" }} animate={{ width: "90%" }} transition={{ duration: 12, ease: "easeOut" }} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono-data">
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      {lang === "uz" ? "Morfometriya qayta ishlanmoqda..." : lang === "ru" ? "Обработка морфометрии..." : "Morphometry processing..."}
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            )}

            {status === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
                {preview && <img src={preview} alt="MRI preview" className="mb-2 h-32 w-32 rounded-xl object-cover" />}
                <CheckCircle2 className="h-8 w-8 text-accent" />
                <p className="text-sm font-medium text-foreground">{tr.analyzeComplete}</p>
                <button onClick={reset} className="mt-2 text-xs text-muted-foreground underline hover:text-foreground">
                  {tr.uploadButton}
                </button>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
                {preview && <img src={preview} alt="MRI preview" className="mb-2 h-32 w-32 rounded-xl object-cover opacity-40" />}
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium text-destructive">{errorMsg}</p>
                <button onClick={reset} className="mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                  {tr.uploadButton}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
