import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { AnalysisResult } from "@/lib/analysisTypes";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ChartSectionProps {
  visible: boolean;
  data: AnalysisResult | null;
}

export const ChartSection = ({ visible, data }: ChartSectionProps) => {
  const { lang } = useLanguage();
  const tr = t(lang);

  if (!visible || !data) return null;

  const chartData = data.regions.map((r) => ({
    name: tr.regions[r.key],
    score: r.score,
  }));

  const colors = [
    "hsl(210, 80%, 50%)", "hsl(160, 70%, 40%)", "hsl(35, 90%, 50%)",
    "hsl(280, 65%, 50%)", "hsl(350, 75%, 50%)",
  ];

  return (
    <section className="px-6 py-12 md:px-12">
      <div className="mx-auto max-w-3xl">
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center text-2xl font-semibold text-foreground">{tr.chartTitle}</motion.h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="medical-card rounded-2xl p-6">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(215, 15%, 50%)" }} axisLine={{ stroke: "hsl(214, 20%, 90%)" }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(215, 15%, 50%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(214, 20%, 90%)", boxShadow: "0 4px 12px hsl(215, 25%, 15%, 0.08)", fontSize: "13px" }}
                formatter={(value: number) => [`${value}`, tr.scoreLabel]} labelFormatter={(label: string) => label} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                {chartData.map((_, index) => (<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
};
