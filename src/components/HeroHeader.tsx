import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { motion } from "framer-motion";
import { Brain, Activity } from "lucide-react";
import brainHero from "@/assets/brain-hero.jpg";

export const HeroHeader = () => {
  const { lang } = useLanguage();
  const tr = t(lang);

  return (
    <header className="relative overflow-hidden">
      {/* Hero background */}
      <div className="absolute inset-0">
        <img src={brainHero} alt="Brain neural network visualization" className="h-full w-full object-cover" />
        <div className="absolute inset-0 hero-overlay opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Nav bar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent glow-accent">
            <Brain className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-sm font-semibold text-primary-foreground tracking-wide">NeuroMorph AI</span>
        </div>
        <LanguageSwitcher />
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-20 pt-12 text-center md:pb-28 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5"
        >
          <Activity className="h-3.5 w-3.5 text-medical-cyan" />
          <span className="text-xs font-medium text-medical-cyan">{tr.researchPrototype}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-3xl text-3xl font-bold leading-tight text-primary-foreground md:text-5xl"
        >
          {tr.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-4 max-w-xl text-sm text-primary-foreground/70 md:text-base"
        >
          {tr.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-6 text-xs text-primary-foreground/50 font-mono-data"
        >
          {tr.poweredBy}
        </motion.div>
      </div>
    </header>
  );
};
