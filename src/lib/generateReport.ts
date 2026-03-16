import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Language, t } from "@/lib/translations";
import { AnalysisResult } from "@/lib/analysisTypes";

async function loadUnicodeFont(doc: jsPDF) {
  const fontUrl = "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/latin-400-normal.ttf";
  const cyrillicUrl = "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/cyrillic-400-normal.ttf";

  const urls = [fontUrl, cyrillicUrl];
  
  for (const url of urls) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const buffer = await resp.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const fontName = url.includes("cyrillic") ? "NotoSansCyrillic" : "NotoSansLatin";
      doc.addFileToVFS(`${fontName}.ttf`, base64);
      doc.addFont(`${fontName}.ttf`, fontName, "normal");
    } catch (e) {
      console.warn("Font load failed:", url, e);
    }
  }
}

function setFont(doc: jsPDF, lang: Language) {
  if (lang === "ru") {
    try { doc.setFont("NotoSansCyrillic"); return; } catch {}
  }
  try { doc.setFont("NotoSansLatin"); return; } catch {}
  doc.setFont("helvetica");
}

function drawBarChart(doc: jsPDF, data: AnalysisResult, lang: Language, startY: number) {
  const tr = t(lang);
  const chartX = 20;
  const chartWidth = 160;
  const chartHeight = 70;
  const chartBottom = startY + chartHeight;
  
  // Draw axes
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(chartX, startY, chartX, chartBottom); // Y axis
  doc.line(chartX, chartBottom, chartX + chartWidth, chartBottom); // X axis

  // Y axis labels
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  setFont(doc, lang);
  for (let i = 0; i <= 4; i++) {
    const val = i * 25;
    const y = chartBottom - (val / 100) * chartHeight;
    doc.text(`${val}`, chartX - 3, y + 1, { align: "right" });
    doc.setDrawColor(230, 230, 230);
    doc.line(chartX + 1, y, chartX + chartWidth, y);
  }

  const colors: [number, number, number][] = [
    [59, 130, 246], [34, 197, 94], [245, 158, 11],
    [168, 85, 247], [239, 68, 68],
  ];

  const barCount = data.regions.length;
  const groupWidth = chartWidth / barCount;
  const barWidth = groupWidth * 0.55;

  data.regions.forEach((r, i) => {
    const barH = (r.score / 100) * chartHeight;
    const x = chartX + i * groupWidth + (groupWidth - barWidth) / 2;
    const y = chartBottom - barH;

    const [cr, cg, cb] = colors[i % colors.length];
    doc.setFillColor(cr, cg, cb);
    doc.roundedRect(x, y, barWidth, barH, 1.5, 1.5, "F");

    // Score on top
    doc.setFontSize(7);
    doc.setTextColor(cr, cg, cb);
    setFont(doc, lang);
    doc.text(`${r.score}`, x + barWidth / 2, y - 2, { align: "center" });

    // Label below
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    const label = tr.regions[r.key];
    doc.text(label, x + barWidth / 2, chartBottom + 5, { align: "center" });
  });

  return chartBottom + 12;
}

export async function generateReport(lang: Language, data: AnalysisResult, previewImage?: string) {
  const tr = t(lang);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  await loadUnicodeFont(doc);

  // Header bar
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  setFont(doc, lang);
  doc.setFontSize(18);
  doc.text(tr.pdfTitle, pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(9);
  doc.text(tr.pdfGenerated, pageWidth / 2, 24, { align: "center" });
  doc.text(`${tr.pdfDate}: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: "center" });

  // MRI image
  let contentY = 42;
  if (previewImage) {
    try {
      const imgWidth = 50;
      const imgHeight = 50;
      const imgX = (pageWidth - imgWidth) / 2;
      doc.addImage(previewImage, "JPEG", imgX, contentY, imgWidth, imgHeight);
      contentY += imgHeight + 8;
    } catch (e) {
      console.warn("Failed to add MRI image to PDF:", e);
    }
  }

  doc.setTextColor(30, 58, 95);
  setFont(doc, lang);
  doc.setFontSize(14);
  doc.text(tr.pdfMetrics, 14, contentY);

  const { primary, detailed } = data;

  const fontFamily = lang === "ru" ? "NotoSansCyrillic" : "NotoSansLatin";
  const tableStyles = {
    font: fontFamily,
    headStyles: { fillColor: [37, 99, 235] as [number, number, number], textColor: 255 as const, fontSize: 10, font: fontFamily },
    bodyStyles: { fontSize: 9, textColor: [30, 58, 95] as [number, number, number], font: fontFamily },
    alternateRowStyles: { fillColor: [240, 246, 255] as [number, number, number] },
    margin: { left: 14, right: 14 },
  };

  autoTable(doc, {
    startY: contentY + 4,
    head: [[tr.pdfMetrics, tr.scoreLabel, tr.normalRange]],
    body: [
      [tr.symmetryScore, `${primary.symmetry}/100`, tr.normalSymmetry],
      [tr.morphologyIndex, `${primary.morphology}/100`, tr.normalMorphology],
      [tr.sulcusDepth, `${primary.sulcusDepth} mm`, tr.normalSulcusDepth],
      [tr.confidence, `${primary.confidence}%`, tr.normalConfidence],
      [tr.corticalThickness, `${detailed.corticalThickness} mm`, tr.normalCorticalThickness],
      [tr.grayMatterVolume, `${detailed.grayMatterVolume}`, tr.normalGrayMatterVolume],
      [tr.whiteMatterIntegrity, `${detailed.whiteMatterIntegrity} FA`, tr.normalWhiteMatterIntegrity],
      [tr.ventricleRatio, `${detailed.ventricleRatio}`, tr.normalVentricleRatio],
      [tr.gyralComplexity, `${detailed.gyralComplexity}/100`, tr.normalGyralComplexity],
      [tr.hemisphericAsymmetry, `${detailed.hemisphericAsymmetry}%`, tr.normalHemisphericAsymmetry],
    ],
    ...tableStyles,
  });

  const afterTable = (doc as any).lastAutoTable?.finalY || 160;
  doc.setFontSize(14);
  setFont(doc, lang);
  doc.text(tr.pdfRegions, 14, afterTable + 12);

  autoTable(doc, {
    startY: afterTable + 16,
    head: [[tr.regionLabel, tr.scoreLabel]],
    body: data.regions.map((r) => [tr.regions[r.key], `${r.score}/100`]),
    ...tableStyles,
  });

  const afterRegions = (doc as any).lastAutoTable?.finalY || 220;

  // Bar chart
  const chartTitleY = afterRegions + 12;
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let chartStartY: number;
  if (chartTitleY + 90 > pageHeight - 20) {
    doc.addPage();
    chartStartY = 20;
  } else {
    chartStartY = chartTitleY;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 95);
  setFont(doc, lang);
  doc.text(tr.chartTitle, 14, chartStartY);
  
  const afterChart = drawBarChart(doc, data, lang, chartStartY + 8);

  // Disclaimer
  const disclaimerY = afterChart + 8;
  let discY: number;
  if (disclaimerY + 30 > pageHeight - 10) {
    doc.addPage();
    discY = 20;
  } else {
    discY = disclaimerY;
  }

  doc.setFontSize(11);
  doc.setTextColor(30, 58, 95);
  setFont(doc, lang);
  doc.text(tr.pdfDisclaimer, 14, discY);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(tr.disclaimer, 14, discY + 8, { maxWidth: pageWidth - 28 });

  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("NeuroMorph AI — Research Prototype", pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });

  doc.save(`neuromorph-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
