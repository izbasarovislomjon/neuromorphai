import { useState } from "react";
import { HeroHeader } from "@/components/HeroHeader";
import { ImageUpload } from "@/components/ImageUpload";
import { ResultsPanel } from "@/components/ResultsPanel";
import { BrainHeatmap } from "@/components/BrainHeatmap";
import { ChartSection } from "@/components/ChartSection";
import { ExportButton } from "@/components/ExportButton";
import { Disclaimer } from "@/components/Disclaimer";
import { AnalysisResult } from "@/lib/analysisTypes";

const Index = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const showResults = analysisData !== null;

  return (
    <div className="min-h-screen bg-background">
      <HeroHeader />
      <ImageUpload onAnalysisComplete={(data, img) => { setAnalysisData(data); setPreviewImage(img); }} />
      <ResultsPanel visible={showResults} data={analysisData} />
      <BrainHeatmap visible={showResults} data={analysisData} />
      <ChartSection visible={showResults} data={analysisData} />
      <ExportButton visible={showResults} data={analysisData} previewImage={previewImage} />
      <Disclaimer />
    </div>
  );
};

export default Index;
