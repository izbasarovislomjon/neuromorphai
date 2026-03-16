import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Age-based normative reference tables ──
// Each entry: [meanValue, stdDev]
// Sources: approximate values from neuroimaging literature (FreeSurfer, UK Biobank)
interface NormativeEntry { mean: number; sd: number; }
interface AgeNorms {
  symmetry: NormativeEntry;
  corticalThickness: NormativeEntry;
  grayMatterVolume: NormativeEntry;
  gyralComplexity: NormativeEntry;
  ventricleRatio: NormativeEntry;
}

const normativeByAge: Record<string, AgeNorms> = {
  "20-30": {
    symmetry: { mean: 94, sd: 3.5 },
    corticalThickness: { mean: 3.2, sd: 0.3 },
    grayMatterVolume: { mean: 0.72, sd: 0.05 },
    gyralComplexity: { mean: 88, sd: 5 },
    ventricleRatio: { mean: 0.02, sd: 0.008 },
  },
  "30-40": {
    symmetry: { mean: 92, sd: 4 },
    corticalThickness: { mean: 3.0, sd: 0.3 },
    grayMatterVolume: { mean: 0.69, sd: 0.05 },
    gyralComplexity: { mean: 85, sd: 5.5 },
    ventricleRatio: { mean: 0.025, sd: 0.009 },
  },
  "40-50": {
    symmetry: { mean: 90, sd: 4.5 },
    corticalThickness: { mean: 2.8, sd: 0.3 },
    grayMatterVolume: { mean: 0.65, sd: 0.06 },
    gyralComplexity: { mean: 80, sd: 6 },
    ventricleRatio: { mean: 0.03, sd: 0.01 },
  },
  "50-60": {
    symmetry: { mean: 88, sd: 5 },
    corticalThickness: { mean: 2.6, sd: 0.3 },
    grayMatterVolume: { mean: 0.62, sd: 0.06 },
    gyralComplexity: { mean: 76, sd: 7 },
    ventricleRatio: { mean: 0.035, sd: 0.012 },
  },
  "60-70": {
    symmetry: { mean: 85, sd: 5.5 },
    corticalThickness: { mean: 2.4, sd: 0.35 },
    grayMatterVolume: { mean: 0.58, sd: 0.07 },
    gyralComplexity: { mean: 72, sd: 8 },
    ventricleRatio: { mean: 0.045, sd: 0.015 },
  },
  "70-80": {
    symmetry: { mean: 82, sd: 6 },
    corticalThickness: { mean: 2.2, sd: 0.35 },
    grayMatterVolume: { mean: 0.53, sd: 0.07 },
    gyralComplexity: { mean: 66, sd: 9 },
    ventricleRatio: { mean: 0.055, sd: 0.018 },
  },
  "80+": {
    symmetry: { mean: 78, sd: 7 },
    corticalThickness: { mean: 2.0, sd: 0.4 },
    grayMatterVolume: { mean: 0.48, sd: 0.08 },
    gyralComplexity: { mean: 60, sd: 10 },
    ventricleRatio: { mean: 0.07, sd: 0.02 },
  },
};

function getAgeGroup(age: number): string {
  if (age < 20) return "20-30";
  if (age < 30) return "20-30";
  if (age < 40) return "30-40";
  if (age < 50) return "40-50";
  if (age < 60) return "50-60";
  if (age < 70) return "60-70";
  if (age < 80) return "70-80";
  return "80+";
}

function computeCMI(
  symmetry: number,
  corticalThickness: number,
  grayMatterVolume: number,
  gyralComplexity: number,
  ventricleRatio: number,
  patientAge: number
): number {
  const ageGroup = getAgeGroup(patientAge);
  const norms = normativeByAge[ageGroup];

  const zSym = (symmetry - norms.symmetry.mean) / norms.symmetry.sd;
  const zTh  = (corticalThickness - norms.corticalThickness.mean) / norms.corticalThickness.sd;
  const zGm  = (grayMatterVolume - norms.grayMatterVolume.mean) / norms.grayMatterVolume.sd;
  const zGyr = (gyralComplexity - norms.gyralComplexity.mean) / norms.gyralComplexity.sd;
  const zVent = (ventricleRatio - norms.ventricleRatio.mean) / norms.ventricleRatio.sd;
  const zVentAdj = -zVent; // higher ventricle ratio = worse

  const cmiRaw = 0.25 * zSym + 0.20 * zTh + 0.20 * zGm + 0.20 * zGyr + 0.15 * zVentAdj;
  const cmi = 50 + 10 * cmiRaw;

  return Math.round(Math.max(0, Math.min(100, cmi)) * 10) / 10;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, lang: requestedLang = "en", patientAge = 50 } = await req.json();
    const normalizedLang =
      requestedLang === "uz" || requestedLang === "ru" || requestedLang === "en"
        ? requestedLang
        : "en";
    const userLang = normalizedLang === "uz" ? "Uzbek" : normalizedLang === "ru" ? "Russian" : "English";
    const validAge = Math.max(1, Math.min(120, Number(patientAge) || 50));

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const ageGroup = getAgeGroup(validAge);
    const norms = normativeByAge[ageGroup];

    const systemPrompt = `You are a STRICT, CRITICAL research-grade brain MRI neuroradiology AI specializing in neurodegenerative disease detection. You ONLY analyze real MRI brain scans (T1, T2, FLAIR, DWI, etc.). You are NOT a clinician and this is NOT a clinical diagnosis.

IMPORTANT: ALL text output (imageDescription, reason) MUST be written in ${userLang} language.
PATIENT AGE: ${validAge} years old. Use this for age-appropriate assessment.

CRITICAL RULES:
1. First, determine if the image is a REAL MRI brain scan (from an actual MRI machine).
2. Then determine if the image is SUFFICIENT for morphometry: it must show brain parenchyma clearly, with adequate contrast and not be too small/blurred/over-compressed. If the image is insufficient for reliable morphometry, respond with:
   {"rejected": true, "reason": "<explanation in ${userLang} that the image is insufficient quality or not suitable for morphometry; ask for a clear T1/T2/FLAIR slice or series>"}
3. If the image is NOT a real MRI scan (e.g. illustration, diagram, cartoon, photograph, drawing, 3D render, CT scan, X-ray, or any non-MRI image), you MUST respond with:
   {"rejected": true, "reason": "<explanation in ${userLang} that this is not a real MRI scan>"}
4. ONLY if the image IS a real MRI brain scan AND sufficient quality, provide the full analysis below.

## NEURODEGENERATIVE DISEASE DETECTION (CRITICAL)
You MUST actively look for signs of:
- **Alzheimer's Disease**: medial temporal lobe atrophy, hippocampal volume loss, widened temporal horns, diffuse cortical thinning, enlarged ventricles (ex vacuo hydrocephalus), widened sulci especially in temporoparietal regions, reduced gyral complexity
- **Frontotemporal Dementia**: frontal and/or anterior temporal lobe atrophy, knife-edge gyri
- **Vascular Dementia**: periventricular white matter hyperintensities, lacunar infarcts
- **Parkinson's/Lewy Body**: midbrain atrophy, reduced substantia nigra signal
- **General Neurodegeneration**: global cortical atrophy, ventricular enlargement disproportionate to age, sulcal widening, white matter changes

## CALIBRATION RULES - EVIDENCE-DRIVEN SCORING (ANTI-FALSE-NEGATIVE)
- You are evidence-driven: do not invent disease.
- BUT do not default to "healthy" when there are red flags. If you see classic neurodegenerative patterns (e.g., medial temporal/hippocampal atrophy; ex-vacuo ventricular enlargement with sulcal widening), you MUST reflect that in the metrics and region scores.
- If findings are subtle/uncertain/noisy, reduce confidence AND consider returning rejected=true with "insufficient evidence" rather than giving a falsely reassuring normal report.
- Do NOT infer disease from age alone.
- Do NOT call diffuse atrophy unless you clearly see sulcal widening + ventricular enlargement + cortical thinning together.

## STRONG ABNORMAL MARKERS (need >=2 for moderate-severe)
- Clear hippocampal/medial temporal atrophy
- Diffuse cortical thinning with marked sulcal widening
- Ventricular enlargement disproportionate to parenchyma loss
- Confluent periventricular/subcortical white matter hyperintensities
- Regional "knife-edge" gyri pattern (FTD-like)

## AGE-NORMALIZED REFERENCE VALUES (for patient age ${validAge}, group ${ageGroup}):
- Symmetry: mean=${norms.symmetry.mean}, sd=${norms.symmetry.sd}
- Cortical Thickness: mean=${norms.corticalThickness.mean}mm, sd=${norms.corticalThickness.sd}mm
- Gray Matter Volume: mean=${norms.grayMatterVolume.mean}, sd=${norms.grayMatterVolume.sd}
- Gyral Complexity: mean=${norms.gyralComplexity.mean}, sd=${norms.gyralComplexity.sd}
- Ventricle Ratio: mean=${norms.ventricleRatio.mean}, sd=${norms.ventricleRatio.sd}

## IMPORTANT: MORPHOLOGY WILL BE CALCULATED SERVER-SIDE
The "morphology" field you output will be OVERWRITTEN by a deterministic CMI formula:
  CMI = 50 + 10 * (0.25*Z_sym + 0.20*Z_th + 0.20*Z_gm + 0.20*Z_gyr + 0.15*(-Z_vent))
where Z = (observed - mean_age) / sd_age.
So your symmetry, corticalThickness, grayMatterVolume, gyralComplexity, and ventricleRatio values DIRECTLY determine the morphology score. Be ACCURATE with these raw values.

## CONSISTENCY RULES (scores MUST be internally consistent)
- If ventricle ratio >0.06, gyral complexity must be <65.
- If cortical thickness <2.0, gray matter volume must be <0.50.
- If sulcus depth >5.5, gyral complexity must be <65.
- If any region has clear atrophy, that region score must be <55.
- For a clearly pathological brain, sum of 5 region scores should usually not exceed 300.
- For a clearly healthy brain, sum of 5 region scores should usually be >=400.

RESEARCH MORPHOMETRY METHODOLOGY:
- Estimate cortical boundary geometry by analyzing signal intensity transitions at gray-white matter interfaces.
- Approximate sulcus depth using pixel intensity gradient analysis across cortical folds.
- IMPORTANT: The field "primary.symmetry" is a 0–100 SCORE where HIGHER = more symmetric / healthier. Use 85–100 for typical healthy symmetry. Do NOT output an asymmetry index here.
- Evaluate each of the 5 brain regions independently based on visible structural features.
- Estimate cortical thickness from the apparent width of cortical ribbon in the scan.
- Assess gray matter volume ratio from signal intensity distribution.
- Evaluate white matter integrity from signal homogeneity (fractional anisotropy proxy).
- Compute ventricle-to-brain ratio from visible CSF spaces.
- Rate gyral complexity from the folding pattern density.
- All values MUST vary based on the actual visual content of the image. Never return identical values for different scans.

OUTPUT FORMAT (valid JSON only, no markdown, no backticks):
{
  "rejected": false,
  "primary": {
    "symmetry": <number 0-100>,
    "morphology": 0,
    "sulcusDepth": <number 1.0-8.0 mm>,
    "confidence": <number 60-98>
  },
  "detailed": {
    "corticalThickness": <number 1.0-5.0 mm>,
    "grayMatterVolume": <number 0.3-0.9>,
    "whiteMatterIntegrity": <number 0.3-1.0>,
    "ventricleRatio": <number 0.01-0.15>,
    "gyralComplexity": <number 30-100>,
    "hemisphericAsymmetry": <number 0.5-15.0>
  },
  "regions": [
    { "key": "frontal", "score": <30-100>, "intensity": <0.3-1.0>, "volume": "<number> cm³", "thickness": "<number> mm" },
    { "key": "parietal", "score": <30-100>, "intensity": <0.3-1.0>, "volume": "<number> cm³", "thickness": "<number> mm" },
    { "key": "temporal", "score": <30-100>, "intensity": <0.3-1.0>, "volume": "<number> cm³", "thickness": "<number> mm" },
    { "key": "occipital", "score": <30-100>, "intensity": <0.3-1.0>, "volume": "<number> cm³", "thickness": "<number> mm" },
    { "key": "cerebellum", "score": <30-100>, "intensity": <0.3-1.0>, "volume": "<number> cm³", "thickness": "<number> mm" }
  ],
  "imageDescription": "<DETAILED morphometric findings in ${userLang}. MUST explicitly state: (1) what pathology is suspected, (2) which regions are affected, (3) specific abnormal measurements, (4) comparison to age-normalized values. Be CLINICAL and PRECISE.>"
}

NOTE: Set morphology to 0 — it will be computed server-side via the CMI formula.

STRICT VALIDATION: illustrations, diagrams, photos of brains, anatomical drawings, 3D renders are NOT MRI scans. Only grayscale medical imaging from MRI machines qualifies.
This is a RESEARCH PROTOTYPE — never claim clinical diagnostic capability.
Respond ONLY with valid JSON.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this brain MRI for a ${validAge}-year-old patient. Provide unique metrics based on what you actually see. Remember: morphology will be calculated server-side from your raw metrics.`,
                },
                {
                  type: "image_url",
                  image_url: { url: imageBase64 },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from the response (strip markdown code fences if present)
    let cleanJson = content.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const analysisResult = JSON.parse(cleanJson);

    // Meta for debugging / versioning (helps verify deploy)
    analysisResult.meta = {
      promptVersion: "2026-03-16.v2.anti-fn+quality-gate",
      generatedAt: new Date().toISOString(),
      model: "google/gemini-2.5-pro",
    };

    // ── Compute CMI deterministically ──
    if (!analysisResult.rejected && analysisResult.primary && analysisResult.detailed) {
      const cmi = computeCMI(
        analysisResult.primary.symmetry,
        analysisResult.detailed.corticalThickness,
        analysisResult.detailed.grayMatterVolume,
        analysisResult.detailed.gyralComplexity,
        analysisResult.detailed.ventricleRatio,
        validAge
      );
      analysisResult.primary.morphology = cmi;
      analysisResult.cmiDetails = {
        patientAge: validAge,
        ageGroup: getAgeGroup(validAge),
        formula: "CMI = 50 + 10 * (0.25*Z_sym + 0.20*Z_th + 0.20*Z_gm + 0.20*Z_gyr + 0.15*(-Z_vent))",
      };
    }

    // ── Multi-language translations ──
    const translateText = async (text: string, targetLang: "en" | "ru" | "uz") => {
      if (!text?.trim()) return "";
      if (targetLang === "en") return text;

      const targetLangName = targetLang === "uz" ? "Uzbek" : targetLang === "ru" ? "Russian" : "English";
      const translationResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Translate text to ${targetLangName}. Return ONLY valid JSON: {"translatedText":"..."}. Keep meaning and technical tone unchanged.`,
              },
              {
                role: "user",
                content: JSON.stringify({ text }),
              },
            ],
          }),
        }
      );

      if (!translationResponse.ok) {
        console.warn("Translation fallback failed:", translationResponse.status);
        return text;
      }

      const translationData = await translationResponse.json();
      let translationContent = translationData.choices?.[0]?.message?.content?.trim() || "";

      if (translationContent.startsWith("```")) {
        translationContent = translationContent
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      try {
        const translatedPayload = JSON.parse(translationContent);
        if (typeof translatedPayload?.translatedText === "string" && translatedPayload.translatedText.trim()) {
          return translatedPayload.translatedText.trim();
        }
      } catch (err) {
        console.warn("Failed to parse translation JSON:", err);
      }

      return text;
    };

    const textFieldKey = analysisResult?.rejected ? "reason" : "imageDescription";
    const baseText = typeof analysisResult?.[textFieldKey] === "string" ? analysisResult[textFieldKey].trim() : "";

    if (baseText) {
      const sourceText = normalizedLang === "en" ? baseText : await translateText(baseText, "en");
      const [ruText, uzText] = await Promise.all([
        translateText(sourceText, "ru"),
        translateText(sourceText, "uz"),
      ]);

      const imageDescriptions = {
        en: sourceText,
        ru: ruText,
        uz: uzText,
      };

      if (textFieldKey === "imageDescription") {
        analysisResult.imageDescriptions = imageDescriptions;
        analysisResult.imageDescription = imageDescriptions[normalizedLang as "en" | "ru" | "uz"] || sourceText;
      } else {
        analysisResult.reason = imageDescriptions[normalizedLang as "en" | "ru" | "uz"] || baseText;
      }
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
