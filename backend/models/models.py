from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class RiskLabel(str, Enum):
    SAFE = "Safe"
    ADJUST_DOSAGE = "Adjust Dosage"
    TOXIC = "Toxic"
    INEFFECTIVE = "Ineffective"
    UNKNOWN = "Unknown"

class Severity(str, Enum):
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class Phenotype(str, Enum):
    PM = "PM"
    IM = "IM"
    NM = "NM"
    RM = "RM"
    URM = "URM"
    UNKNOWN = "Unknown"

class DetectedVariant(BaseModel):
    rsid: str
    gene: str
    star_allele: Optional[str] = None
    effect: Optional[str] = None
    zygosity: Optional[str] = None
    chromosome: Optional[str] = None
    position: Optional[int] = None
    ref: Optional[str] = None
    alt: Optional[str] = None
    genotype: Optional[str] = None
    activity_score: Optional[float] = None

class RiskAssessment(BaseModel):
    risk_label: RiskLabel
    confidence_score: float = Field(..., ge=0, le=1)
    severity: Severity

class PharmacogenomicProfile(BaseModel):
    primary_gene: str
    diplotype: str
    phenotype: Phenotype
    phenotype_description: Optional[str] = None
    detected_variants: List[DetectedVariant]

class ClinicalRecommendation(BaseModel):
    action: str
    dose_modifier: Optional[float] = None
    cpic_level: Optional[str] = None
    alternative_drugs: List[str]
    monitoring_parameters: Optional[List[str]] = None

class LLMExplanation(BaseModel):
    summary: str
    mechanism: str
    variant_significance: Optional[str] = None
    clinical_implication: Optional[str] = None
    population_context: Optional[str] = None
    risk_rationale: Optional[str] = None
    alternatives_note: Optional[str] = None
    generated_by: Optional[str] = None

class QualityMetrics(BaseModel):
    vcf_parsing_success: bool
    vcf_version: Optional[str] = None
    total_variants_parsed: int
    pharmacogenomic_variants_found: int
    genes_analyzed: List[str]
    parsing_errors: List[str]
    analysis_id: str

class AnalysisResult(BaseModel):
    patient_id: str
    drug: str
    timestamp: str
    risk_assessment: RiskAssessment
    pharmacogenomic_profile: PharmacogenomicProfile
    clinical_recommendation: ClinicalRecommendation
    llm_generated_explanation: LLMExplanation
    quality_metrics: QualityMetrics


