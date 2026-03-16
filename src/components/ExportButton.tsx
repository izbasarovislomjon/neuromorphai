import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { generateReport } from "@/lib/generateReport";
import { AnalysisResult } from "@/lib/analysisTypes";
import { motion } from "framer-motion";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";

export const ExportButton = ({ visible, data, previewImage }: { visible: boolean; data: AnalysisResult | null; previewImage?: string | null }) => {
  const { lang } = useLanguage();
  const tr = t(lang);
  const [exporting, setExporting] = useState(false);

  if (!visible || !data) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      await generateReport(lang, data, previewImage || undefined);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center px-6 py-4">
      <button onClick={handleExport} disabled={exporting}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-60">
        {exporting ? (<><Loader2 className="h-4 w-4 animate-spin" />{tr.exportingPdf}</>) : (<><FileDown className="h-4 w-4" />{tr.exportPdf}</>)}
      </button>
    </motion.div>
  );
};
