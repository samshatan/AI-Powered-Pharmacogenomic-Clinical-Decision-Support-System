export interface RiskAssessment {
  risk_label: "Safe" | "Adjust Dosage" | "Toxic" | "Ineffective" | "Unknown";
  confidence_score: number;
  severity: "none" | "low" | "moderate" | "high" | "critical";
}

export interface DetectedVariant {
  rsid: string;
  gene: string;
  star_allele?: string;
  effect?: string;
  zygosity?: string;
  chromosome?: string;
  position?: number;
  ref?: string;
  alt?: string;
  genotype?: string;
  activity_score?: number;
}

export interface PharmacogenomicProfile {
  primary_gene: string;
  diplotype: string;
  phenotype: "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
  phenotype_description?: string;
  detected_variants: DetectedVariant[];
}

export interface ClinicalRecommendation {
  action: string;
  dose_modifier?: number;
  cpic_level?: string;
  alternative_drugs: string[];
  monitoring_parameters?: string[];
}

export interface LLMExplanation {
  summary: string;
  mechanism: string;
  variant_significance?: string;
  clinical_implication?: string;
  population_context?: string;
  risk_rationale?: string;
  alternatives_note?: string;
  generated_by?: string;
}

export interface QualityMetrics {
  vcf_parsing_success: boolean;
  vcf_version?: string;
  total_variants_parsed: number;
  pharmacogenomic_variants_found: number;
  genes_analyzed: string[];
  parsing_errors: string[];
  analysis_id: string;
}

export interface AnalysisResult {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: RiskAssessment;
  pharmacogenomic_profile: PharmacogenomicProfile;
  clinical_recommendation: ClinicalRecommendation;
  llm_generated_explanation: LLMExplanation;
  quality_metrics: QualityMetrics;
}

export const TARGET_GENES = [
  "CYP2D6",
  "CYP2C19",
  "CYP2C9",
  "SLCO1B1",
  "TPMT",
  "DPYD"
];

export const EXAMPLE_DRUGS = [
  "CODEINE",
  "WARFARIN",
  "CLOPIDOGREL",
  "SIMVASTATIN",
  "AZATHIOPRINE",
  "FLUOROURACIL"
];