import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export const Disclaimer = () => {
  const { lang } = useLanguage();
  const tr = t(lang);

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="px-6 py-10 md:px-12"
    >
      <div className="mx-auto max-w-2xl rounded-xl border border-border/60 bg-secondary/50 px-6 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">{tr.disclaimer}</p>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground/60">
        © 2026 NeuroMorph AI — {tr.researchPrototype}
      </p>
    </motion.footer>
  );
};
