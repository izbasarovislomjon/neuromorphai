import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

const languages: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "uz", label: "UZ" },
];

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-1.5 py-1 shadow-sm">
      <Globe className="h-4 w-4 text-muted-foreground ml-1" />
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className="relative rounded-full px-3 py-1 text-sm font-medium transition-colors"
        >
          {lang === l.code && (
            <motion.div
              layoutId="lang-pill"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className={`relative z-10 ${lang === l.code ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {l.label}
          </span>
        </button>
      ))}
    </div>
  );
};
