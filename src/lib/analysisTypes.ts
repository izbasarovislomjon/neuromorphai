export interface AnalysisResult {
  meta?: {
    promptVersion?: string;
    generatedAt?: string;
    model?: string;
  };
  primary: {
    symmetry: number;
    morphology: number;
    sulcusDepth: number;
    confidence: number;
  };
  detailed: {
    corticalThickness: number;
    grayMatterVolume: number;
    whiteMatterIntegrity: number;
    ventricleRatio: number;
    gyralComplexity: number;
    hemisphericAsymmetry: number;
  };
  regions: {
    key: "frontal" | "parietal" | "temporal" | "occipital" | "cerebellum";
    score: number;
    intensity: number;
    volume: string;
    thickness: string;
  }[];
  imageDescription: string;
  imageDescriptions?: Partial<Record<"en" | "ru" | "uz", string>>;
}

// Default/fallback data (used for PDF when no analysis yet)
export const defaultAnalysisData: AnalysisResult = {
  primary: { symmetry: 87, morphology: 92, sulcusDepth: 4.3, confidence: 94 },
  detailed: {
    corticalThickness: 2.7,
    grayMatterVolume: 0.68,
    whiteMatterIntegrity: 0.82,
    ventricleRatio: 0.03,
    gyralComplexity: 78,
    hemisphericAsymmetry: 3.2,
  },
  regions: [
    { key: "frontal", score: 88, intensity: 0.88, volume: "482 cm³", thickness: "2.8 mm" },
    { key: "parietal", score: 91, intensity: 0.91, volume: "371 cm³", thickness: "2.6 mm" },
    { key: "temporal", score: 85, intensity: 0.85, volume: "422 cm³", thickness: "2.9 mm" },
    { key: "occipital", score: 93, intensity: 0.93, volume: "218 cm³", thickness: "2.3 mm" },
    { key: "cerebellum", score: 89, intensity: 0.89, volume: "154 cm³", thickness: "1.8 mm" },
  ],
  imageDescription: "",
};
