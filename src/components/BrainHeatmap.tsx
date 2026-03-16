import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { AnalysisResult } from "@/lib/analysisTypes";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

const regionColors = [
  { fill: "hsl(210, 80%, 50%)", light: "hsl(210, 80%, 92%)" },
  { fill: "hsl(160, 70%, 40%)", light: "hsl(160, 70%, 90%)" },
  { fill: "hsl(35, 90%, 50%)",  light: "hsl(35, 90%, 90%)" },
  { fill: "hsl(280, 65%, 50%)", light: "hsl(280, 65%, 92%)" },
  { fill: "hsl(350, 75%, 50%)", light: "hsl(350, 75%, 92%)" },
];

const brainPaths = [
  { d: "M185 55 C160 30, 110 25, 75 40 C50 55, 35 80, 30 110 C28 130, 32 145, 45 155 L60 160 C75 158, 100 150, 130 148 L165 148 C175 140, 185 120, 190 95 C192 78, 190 65, 185 55Z", labelPos: { x: 100, y: 95 } },
  { d: "M185 55 C190 65, 192 78, 190 95 C185 120, 175 140, 165 148 L200 150 C225 148, 245 140, 255 125 C265 108, 260 85, 248 68 C235 52, 215 48, 200 50 C192 51, 188 53, 185 55Z", labelPos: { x: 215, y: 95 } },
  { d: "M45 155 L60 160 C75 158, 100 150, 130 148 L165 148 L200 150 C210 155, 215 165, 210 180 C205 200, 185 215, 155 225 C125 232, 90 228, 65 218 C48 208, 38 192, 38 175 C38 165, 40 158, 45 155Z", labelPos: { x: 130, y: 190 } },
  { d: "M255 125 C245 140, 225 148, 200 150 C210 155, 215 165, 210 180 C205 200, 195 210, 185 218 C210 210, 240 190, 260 165 C272 148, 275 135, 270 125 C265 118, 260 120, 255 125Z", labelPos: { x: 245, y: 165 } },
  { d: "M185 218 C195 225, 220 230, 245 225 C265 220, 278 205, 280 188 C280 175, 275 165, 265 160 C260 165, 252 175, 240 185 C225 198, 205 210, 185 218Z", labelPos: { x: 240, y: 205 } },
];

const sulcusLines = [
  "M80 50 C90 65, 100 75, 115 80", "M65 70 C80 85, 95 90, 110 95",
  "M50 95 C65 105, 85 112, 105 115", "M55 120 C75 128, 100 132, 130 135",
  "M195 60 C205 72, 215 80, 230 85", "M195 80 C210 92, 225 98, 240 100",
  "M190 105 C205 115, 225 120, 245 118", "M65 170 C90 175, 120 178, 150 180",
  "M70 190 C95 195, 125 198, 155 200", "M80 208 C105 212, 130 215, 155 215",
  "M155 225 C160 240, 158 255, 150 265",
];

interface BrainHeatmapProps {
  visible: boolean;
  data: AnalysisResult | null;
}

export const BrainHeatmap = ({ visible, data }: BrainHeatmapProps) => {
  const { lang } = useLanguage();
  const tr = t(lang);
  const [activeRegion, setActiveRegion] = useState<number | null>(null);

  if (!visible || !data) return null;

  const regions = data.regions;
  const handleClick = (index: number) => setActiveRegion(activeRegion === index ? null : index);

  return (
    <section className="px-6 py-12 md:px-12">
      <div className="mx-auto max-w-4xl">
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-2 text-center text-2xl font-semibold text-foreground">{tr.heatmapTitle}</motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8 text-center text-sm text-muted-foreground">{tr.heatmapDesc}</motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="medical-card rounded-2xl p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
            <div className="relative flex-shrink-0">
              <svg width="320" height="290" viewBox="15 15 280 265" className="drop-shadow-lg">
                <defs>
                  <filter id="region-glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  <filter id="active-glow"><feGaussianBlur stdDeviation="6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <ellipse cx="155" cy="145" rx="140" ry="120" fill="none" stroke="hsl(215, 20%, 85%)" strokeWidth="1" opacity="0.4" />
                {brainPaths.map((region, i) => (
                  <motion.path key={i} d={region.d} fill={regionColors[i].fill} stroke="hsl(0, 0%, 100%)" strokeWidth={activeRegion === i ? 2.5 : 1}
                    opacity={activeRegion === null ? 0.8 : activeRegion === i ? 1 : 0.35}
                    filter={activeRegion === i ? "url(#active-glow)" : "url(#region-glow)"}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: activeRegion === null ? 0.8 : activeRegion === i ? 1 : 0.35, scale: activeRegion === i ? 1.02 : 1 }}
                    transition={{ delay: i * 0.12 + 0.3, duration: 0.5 }}
                    onClick={() => handleClick(i)} className="cursor-pointer"
                    style={{ transformOrigin: `${region.labelPos.x}px ${region.labelPos.y}px` }}
                  />
                ))}
                {sulcusLines.map((d, i) => (
                  <motion.path key={`s-${i}`} d={d} fill="none" stroke="hsl(0, 0%, 100%)" strokeWidth="0.7" opacity={0.25} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i * 0.05 + 0.8, duration: 0.6 }} />
                ))}
                <motion.path d="M150 228 C152 242, 150 258, 145 270 C142 276, 138 278, 135 275 C132 270, 134 260, 138 248 C140 240, 143 232, 148 226"
                  fill="hsl(215, 25%, 65%)" stroke="hsl(0, 0%, 100%)" strokeWidth="0.8" opacity={0.5} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 1.2 }} />
                {brainPaths.map((region, i) => (
                  <motion.text key={`l-${i}`} x={region.labelPos.x} y={region.labelPos.y} textAnchor="middle" fill="white" fontSize="9" fontWeight="600"
                    opacity={activeRegion === null ? 0.9 : activeRegion === i ? 1 : 0.3} className="pointer-events-none select-none"
                    initial={{ opacity: 0 }} animate={{ opacity: activeRegion === null ? 0.9 : activeRegion === i ? 1 : 0.3 }} transition={{ delay: i * 0.1 + 0.6 }}>
                    {tr.regions[regions[i]?.key || "frontal"]}
                  </motion.text>
                ))}
              </svg>
              {activeRegion === null && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-1 text-center text-xs text-muted-foreground">{tr.clickToExplore}</motion.p>
              )}
            </div>

            <div className="flex w-full max-w-xs flex-col gap-3">
              {regions.map((r, i) => (
                <motion.button key={r.key} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.4 }}
                  onClick={() => handleClick(i)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all ${activeRegion === i ? "ring-2 ring-primary/30" : "hover:bg-secondary/60"}`}
                  style={{ backgroundColor: activeRegion === i ? regionColors[i].light : undefined }}>
                  <div className="h-4 w-4 flex-shrink-0 rounded-sm" style={{ backgroundColor: regionColors[i].fill }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{tr.regions[r.key]}</p>
                    <p className="font-mono-data text-xs text-muted-foreground">{tr.scoreLabel}: {r.score}/100</p>
                  </div>
                  <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: regionColors[i].fill }}
                      initial={{ width: 0 }} animate={{ width: `${r.score}%` }} transition={{ delay: i * 0.1 + 0.6, duration: 0.6 }} />
                  </div>
                </motion.button>
              ))}

              <AnimatePresence mode="wait">
                {activeRegion !== null && (
                  <motion.div key={activeRegion} initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.25 }}
                    className="overflow-hidden rounded-xl border border-border/60 p-4"
                    style={{ backgroundColor: regionColors[activeRegion].light }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: regionColors[activeRegion].fill }} />
                        <h4 className="text-sm font-semibold text-foreground">{tr.regions[regions[activeRegion].key]}</h4>
                      </div>
                      <button onClick={() => setActiveRegion(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tr.regionTooltips[regions[activeRegion].key]}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-card p-2">
                        <p className="text-[10px] text-muted-foreground">{tr.volume}</p>
                        <p className="font-mono-data text-sm font-bold text-foreground">{regions[activeRegion].volume}</p>
                      </div>
                      <div className="rounded-md bg-card p-2">
                        <p className="text-[10px] text-muted-foreground">{tr.thickness}</p>
                        <p className="font-mono-data text-sm font-bold text-foreground">{regions[activeRegion].thickness}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-md bg-card p-2">
                      <p className="text-[10px] text-muted-foreground">{tr.scoreLabel}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full" style={{ backgroundColor: regionColors[activeRegion].fill, width: `${regions[activeRegion].score}%` }} />
                        </div>
                        <span className="font-mono-data text-xs font-bold text-foreground">{regions[activeRegion].score}%</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
