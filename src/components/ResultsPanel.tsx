import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { AnalysisResult } from "@/lib/analysisTypes";
import { motion } from "framer-motion";
import { Brain, Layers, TrendingUp, ShieldCheck, Ruler, Box, Waves, Ratio, Fingerprint, GitFork } from "lucide-react";

interface ResultsPanelProps {
  visible: boolean;
  data: AnalysisResult | null;
}

type StatusLevel = "normal" | "mild" | "abnormal";

function getStatus(value: number, normalMin: number, normalMax: number, mildMin?: number, mildMax?: number): StatusLevel {
  if (value >= normalMin && value <= normalMax) return "normal";
  if (mildMin !== undefined && mildMax !== undefined && value >= mildMin && value <= mildMax) return "mild";
  return "abnormal";
}

function getStatusHighIsBad(value: number, normalMax: number, mildMax: number): StatusLevel {
  if (value <= normalMax) return "normal";
  if (value <= mildMax) return "mild";
  return "abnormal";
}

const statusColors: Record<StatusLevel, string> = {
  normal: "text-green-600 dark:text-green-400",
  mild: "text-yellow-600 dark:text-yellow-400",
  abnormal: "text-red-500 dark:text-red-400",
};

const statusBg: Record<StatusLevel, string> = {
  normal: "bg-green-50 dark:bg-green-950/30",
  mild: "bg-yellow-50 dark:bg-yellow-950/30",
  abnormal: "bg-red-50 dark:bg-red-950/30",
};

export const ResultsPanel = ({ visible, data }: ResultsPanelProps) => {
  const { lang } = useLanguage();
  const tr = t(lang);

  if (!visible || !data) return null;

  const { primary, detailed } = data;

  const primaryMetrics = [
    { icon: Brain, label: tr.symmetryScore, desc: tr.symmetryDesc, value: primary.symmetry, suffix: "/100", normalRange: tr.normalSymmetry, status: getStatus(primary.symmetry, 85, 100, 60, 84) },
    { icon: Layers, label: tr.morphologyIndex, desc: tr.morphologyDesc, value: primary.morphology, suffix: "/100", normalRange: tr.normalMorphology, status: getStatus(primary.morphology, 85, 100, 60, 84) },
    { icon: TrendingUp, label: tr.sulcusDepth, desc: tr.sulcusDesc, value: primary.sulcusDepth, suffix: " mm", normalRange: tr.normalSulcusDepth, status: getStatusHighIsBad(primary.sulcusDepth, 4.5, 5.5) },
    { icon: ShieldCheck, label: tr.confidence, desc: tr.confidenceDesc, value: primary.confidence, suffix: "%", normalRange: tr.normalConfidence, status: getStatus(primary.confidence, 80, 98, 60, 79) },
  ];

  const detailedMetrics = [
    { icon: Ruler, label: tr.corticalThickness, desc: tr.corticalThicknessDesc, value: detailed.corticalThickness, suffix: " mm", normalRange: tr.normalCorticalThickness, status: getStatus(detailed.corticalThickness, 2.0, 4.0, 1.5, 4.5) },
    { icon: Box, label: tr.grayMatterVolume, desc: tr.grayMatterVolumeDesc, value: detailed.grayMatterVolume, suffix: "", normalRange: tr.normalGrayMatterVolume, status: getStatus(detailed.grayMatterVolume, 0.55, 0.75, 0.45, 0.80) },
    { icon: Waves, label: tr.whiteMatterIntegrity, desc: tr.whiteMatterIntegrityDesc, value: detailed.whiteMatterIntegrity, suffix: " FA", normalRange: tr.normalWhiteMatterIntegrity, status: getStatus(detailed.whiteMatterIntegrity, 0.60, 0.85, 0.50, 0.59) },
    { icon: Ratio, label: tr.ventricleRatio, desc: tr.ventricleRatioDesc, value: detailed.ventricleRatio, suffix: "", normalRange: tr.normalVentricleRatio, status: getStatusHighIsBad(detailed.ventricleRatio, 0.04, 0.08) },
    { icon: Fingerprint, label: tr.gyralComplexity, desc: tr.gyralComplexityDesc, value: detailed.gyralComplexity, suffix: "/100", normalRange: tr.normalGyralComplexity, status: getStatus(detailed.gyralComplexity, 70, 95, 60, 69) },
    { icon: GitFork, label: tr.hemisphericAsymmetry, desc: tr.hemisphericAsymmetryDesc, value: detailed.hemisphericAsymmetry, suffix: "%", normalRange: tr.normalHemisphericAsymmetry, status: getStatusHighIsBad(detailed.hemisphericAsymmetry, 3.0, 6.0) },
  ];

  return (
    <section className="px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-center text-2xl font-semibold text-foreground"
        >
          {tr.resultsTitle}
        </motion.h2>
        {data.meta?.promptVersion ? (
          <p className="mb-2 text-center text-[11px] text-muted-foreground font-mono-data">
            {`AI prompt: ${data.meta.promptVersion}${data.meta.model ? ` • model: ${data.meta.model}` : ""}`}
          </p>
        ) : null}
        {(() => {
          const localizedDescription = data.imageDescriptions?.[lang] || data.imageDescription;
          return localizedDescription ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8 text-center text-sm text-muted-foreground italic"
            >
              {localizedDescription}
            </motion.p>
          ) : null;
        })()}

        {/* Primary metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {primaryMetrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={`metric-badge flex flex-col items-center gap-2 ${statusBg[m.status]}`}
            >
              <m.icon className={`h-6 w-6 ${statusColors[m.status]}`} />
              <div className="flex items-baseline gap-0.5">
                <span className={`font-mono-data text-3xl font-bold ${statusColors[m.status]}`}>{m.value}</span>
                <span className="text-xs text-muted-foreground font-mono-data">{m.suffix}</span>
              </div>
              <p className="text-sm font-medium text-foreground leading-tight text-center">{m.label}</p>
              <p className="text-xs text-muted-foreground leading-snug text-center">{m.desc}</p>
              <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground font-mono-data">
                {tr.normalRange}: {m.normalRange}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Detailed metrics */}
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-4 mt-10 text-lg font-semibold text-foreground"
        >
          {tr.detailedMetrics}
        </motion.h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {detailedMetrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.7 }}
              className={`medical-card flex flex-col gap-2 rounded-xl p-4 ${statusBg[m.status]}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <m.icon className={`h-5 w-5 ${statusColors[m.status]}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium text-foreground truncate">{m.label}</p>
                    <span className={`ml-2 font-mono-data text-lg font-bold ${statusColors[m.status]}`}>{m.value}<span className="text-xs text-muted-foreground">{m.suffix}</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              </div>
              <span className="inline-block self-start rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground font-mono-data">
                {tr.normalRange}: {m.normalRange}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
