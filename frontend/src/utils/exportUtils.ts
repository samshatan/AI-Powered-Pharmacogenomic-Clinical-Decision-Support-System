import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RISK_COLORS: Record<string, { r: number; g: number; b: number }> = {
  Safe: { r: 0, g: 180, b: 150 },
  'Adjust Dosage': { r: 230, g: 160, b: 30 },
  Toxic: { r: 220, g: 60, b: 60 },
  Ineffective: { r: 150, g: 80, b: 220 },
  Unknown: { r: 120, g: 130, b: 140 },
};

const SEVERITY_MAP: Record<string, string> = {
  none: '■■■■■ None',
  low: '■■■■□ Low',
  moderate: '■■■□□ Moderate',
  high: '■■□□□ High',
  critical: '■□□□□ Critical',
};

/**
 * Generate a clinical-grade PDF report from analysis results.
 */
export function generatePDFReport(results: any, patientId: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // page width mm
  const margin = 18;
  let y = 0;

  // ── PAGE 1: HEADER ───────────────────────────────────────────────────
  doc.setFillColor(10, 12, 20);
  doc.rect(0, 0, W, 42, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 212, 170);
  doc.text('PharmaGuard', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(150, 170, 190);
  doc.text('Pharmacogenomic Risk Intelligence Report', margin, 26);

  const now = new Date().toLocaleString('en-US', {
    dateStyle: 'long', timeStyle: 'short',
  });
  doc.setFontSize(8);
  doc.setTextColor(120, 135, 150);
  doc.text(`Generated: ${now}`, W - margin, 18, { align: 'right' });
  doc.text(`Patient ID: ${patientId}`, W - margin, 24, { align: 'right' });
  doc.text('CPIC-Aligned Guidelines', W - margin, 30, { align: 'right' });

  doc.setFillColor(220, 60, 60);
  doc.rect(0, 42, W, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CONFIDENTIAL — FOR CLINICAL USE ONLY — NOT FOR PATIENT DISTRIBUTION', W / 2, 46.5, { align: 'center' });

  y = 58;

  const resultArray = Array.isArray(results) ? results : [results];

  // ── EXECUTIVE SUMMARY TABLE ──────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 35, 45);
  doc.text('Executive Summary', margin, y);
  y += 6;

  const summaryRows = resultArray.map(r => {
    const riskLabel = r.risk_assessment?.risk_label || 'Unknown';
    const color = RISK_COLORS[riskLabel] || RISK_COLORS.Unknown;
    return {
      drug: r.drug || 'N/A',
      gene: r.pharmacogenomic_profile?.primary_gene || 'N/A',
      diplotype: r.pharmacogenomic_profile?.diplotype || 'N/A',
      phenotype: r.pharmacogenomic_profile?.phenotype || 'N/A',
      risk: riskLabel,
      severity: r.risk_assessment?.severity || 'unknown',
      cpic: r.clinical_recommendation?.cpic_level || 'N/A',
      confidence: `${((r.risk_assessment?.confidence_score || 0) * 100).toFixed(0)}%`,
      color,
    };
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Drug', 'Gene', 'Diplotype', 'Phenotype', 'Risk', 'Severity', 'CPIC', 'Confidence']],
    body: summaryRows.map(r => [r.drug, r.gene, r.diplotype, r.phenotype, r.risk, r.severity, r.cpic, r.confidence]),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      lineColor: [220, 225, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [20, 24, 35],
      textColor: [180, 195, 215],
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: { textColor: [40, 50, 65] },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 4) {
        const row = summaryRows[data.row.index];
        if (row) {
          const { r: cr, g: cg, b: cb } = row.color;
          doc.setFillColor(cr, cg, cb);
          doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.text(
            String(data.cell.raw),
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 1,
            { align: 'center' }
          );
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ── PER-DRUG DETAILED SECTIONS ───────────────────────────────────────
  for (const result of resultArray) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    const drug = result.drug || 'Unknown Drug';
    const riskLabel = result.risk_assessment?.risk_label || 'Unknown';
    const rColor = RISK_COLORS[riskLabel] || RISK_COLORS.Unknown;
    const profile = result.pharmacogenomic_profile || {};
    const rec = result.clinical_recommendation || {};
    const llm = result.llm_generated_explanation || {};

    doc.setFillColor(rColor.r, rColor.g, rColor.b);
    doc.rect(margin, y, W - 2 * margin, 0.8, 'F');
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(rColor.r, rColor.g, rColor.b);
    doc.text(drug, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 130, 145);
    doc.text(`Risk: ${riskLabel}  |  Phenotype: ${profile.phenotype || 'N/A'}  |  CPIC Level ${rec.cpic_level || 'N/A'}`, margin, y + 6);
    y += 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(50, 60, 80);
    doc.text('PHARMACOGENOMIC PROFILE', margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Parameter', 'Value']],
      body: [
        ['Primary Gene', profile.primary_gene || 'N/A'],
        ['Diplotype', profile.diplotype || 'N/A'],
        ['Phenotype', profile.phenotype || 'N/A'],
        ['Phenotype Description', profile.phenotype_description || 'N/A'],
        ['Confidence Score', `${((result.risk_assessment?.confidence_score || 0) * 100).toFixed(0)}%`],
        ['Severity', SEVERITY_MAP[result.risk_assessment?.severity] || 'N/A'],
      ],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [35, 40, 55], textColor: [180, 195, 215], fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    if (profile.detected_variants?.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(50, 60, 80);
      doc.text('DETECTED VARIANTS', margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['rsID', 'Allele', 'Effect', 'Zygosity', 'Chr:Pos', 'AS']],
        body: profile.detected_variants.map((v: any) => [
          v.rsid || 'N/A',
          v.star_allele || 'N/A',
          (v.effect || '').replace(/_/g, ' '),
          v.zygosity || 'N/A',
          `${v.chromosome}:${v.position}`,
          v.activity_score?.toFixed(1) || '1.0',
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [35, 40, 55], textColor: [180, 195, 215], fontSize: 7 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (y > 230) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(50, 60, 80);
    doc.text('CLINICAL RECOMMENDATION', margin, y);
    y += 5;

    doc.setFillColor(245, 247, 252);
    const actionLines = doc.splitTextToSize(String(rec.action || 'No recommendation available.'), W - 2 * margin - 8);
    const boxH = actionLines.length * 4.5 + 8;
    doc.rect(margin, y, W - 2 * margin, boxH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 50, 70);
    doc.text(actionLines, margin + 4, y + 6);
    y += boxH + 6;

    const doseText = rec.dose_modifier != null
      ? `Dose Modifier: ×${rec.dose_modifier} (${(rec.dose_modifier * 100).toFixed(0)}% of standard dose)`
      : 'No dose adjustment';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(rColor.r, rColor.g, rColor.b);
    doc.text(doseText, margin, y);
    y += 5;

    if (rec.alternative_drugs?.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(80, 95, 115);
      doc.text(`Alternatives: ${rec.alternative_drugs.join(', ')}`, margin, y);
      y += 4;
    }

    if (rec.monitoring_parameters?.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Monitoring: ${rec.monitoring_parameters.join(', ')}`, margin, y);
      y += 8;
    }

    if (llm.summary || llm.mechanism) {
      if (y > 220) { doc.addPage(); y = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 60, 80);
      doc.text('CLINICAL EXPLANATION (AI)', margin, y);
      y += 5;

      const sections = [
        ['Summary', llm.summary],
        ['Mechanism', llm.mechanism],
        ['Variant Significance', llm.variant_significance],
        ['Clinical Implication', llm.clinical_implication],
        ['Risk Rationale', llm.risk_rationale],
      ].filter(([, val]) => val);

      for (const [title, content] of sections) {
        if (!content) continue;
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(80, 95, 120);
        doc.text(title.toUpperCase(), margin, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 60, 80);
        const lines = doc.splitTextToSize(String(content), W - 2 * margin);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 3;
      }
    }

    y += 4;
    if (resultArray.indexOf(result) < resultArray.length - 1) {
      doc.setDrawColor(220, 225, 235);
      doc.line(margin, y, W - margin, y);
      y += 8;
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(10, 12, 20);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 115, 135);
    doc.text('PharmaGuard | Results are for clinical decision support only. Not a substitute for professional judgment.', margin, 291);
    doc.text(`Page ${i} of ${totalPages}`, W - margin, 291, { align: 'right' });
  }

  const filename = `PharmaGuard_${patientId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export function exportJSON(results: any, patientId: string) {
  const data = Array.isArray(results) ? { patient_id: patientId, results } : results;
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PharmaGuard_${patientId}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
