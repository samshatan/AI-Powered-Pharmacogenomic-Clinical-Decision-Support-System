from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from models.models import (
    AnalysisResult, RiskAssessment, PharmacogenomicProfile, 
    ClinicalRecommendation, LLMExplanation, QualityMetrics, 
    RiskLabel, Severity, Phenotype, DetectedVariant
)
from services import vcf_parser, risk_engine, llm_service
from dotenv import load_dotenv
import time
import os
import uuid

# Load environment variables
load_dotenv()

app = FastAPI(title="GenRx AI API", version="1.1.0")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "version": "1.1.0",
        "service": "GenRx AI Backend"
    }

@app.get("/drugs")
async def get_supported_drugs():
    """Returns a list of drugs supported by the risk engine."""
    from services.risk_engine import DRUG_GENE_RULES
    return list(DRUG_GENE_RULES.keys())

@app.post("/analyze", response_model=List[AnalysisResult])
async def analyze_vcf(
    vcf_file: UploadFile = File(...),
    drugs: str = Form(...),
    patient_id: Optional[str] = Form(None)
):
    """
    Main orchestration endpoint (Person 3 Responsibility)
    Integrates VCF parsing, Risk assessment, and LLM explanations.
    """
    try:
        # 1. Read and Parse VCF (vcf_parser.py)
        vcf_content = await vcf_file.read()
        vcf_text = vcf_content.decode("utf-8")
        
        parse_result = vcf_parser.parse_vcf(vcf_text)
        if not parse_result.success:
            raise HTTPException(status_code=400, detail="Failed to parse VCF file. Ensure it is a valid VCF v4.2 format.")

        drug_list = [d.strip().upper() for d in drugs.split(",") if d.strip()]
        if not drug_list:
            raise HTTPException(status_code=400, detail="No drugs provided")

        analysis_id = str(uuid.uuid4())
        all_results = []
        
        for drug in drug_list:
            # 2. Map Genetics to Risk (risk_engine.py)
            risk_result = risk_engine.assess_drug_risk(drug, parse_result.gene_profiles)
            
            # 3. Generate LLM explanations (llm_service.py) - ASYNC
            explanation_data = await llm_service.generate_clinical_explanation(
                drug=drug,
                risk_label=risk_result.risk_label,
                phenotype=risk_result.phenotype,
                diplotype=risk_result.diplotype,
                gene=risk_result.primary_gene,
                variants=risk_result.detected_variants,
                action=risk_result.action,
                severity=risk_result.severity,
                alternatives=risk_result.alternatives
            )

            # Map raw strings to Enums for Pydantic validation
            try:
                risk_enum = RiskLabel(risk_result.risk_label)
            except ValueError:
                risk_enum = RiskLabel.UNKNOWN

            try:
                severity_enum = Severity(risk_result.severity)
            except ValueError:
                severity_enum = Severity.NONE

            try:
                phenotype_enum = Phenotype(risk_result.phenotype)
            except ValueError:
                phenotype_enum = Phenotype.UNKNOWN
            
            # Convert detected variants to Pydantic models
            pydantic_variants = [
                DetectedVariant(**v) for v in risk_result.detected_variants
            ]

            # 4. Construct Final Mandatory JSON
            result = AnalysisResult(
                patient_id=patient_id or parse_result.patient_id,
                drug=drug,
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                risk_assessment=RiskAssessment(
                    risk_label=risk_enum,
                    confidence_score=risk_result.confidence_score,
                    severity=severity_enum
                ),
                pharmacogenomic_profile=PharmacogenomicProfile(
                    primary_gene=risk_result.primary_gene,
                    diplotype=risk_result.diplotype,
                    phenotype=phenotype_enum,
                    phenotype_description=risk_result.phenotype_description,
                    detected_variants=pydantic_variants
                ),
                clinical_recommendation=ClinicalRecommendation(
                    action=risk_result.action,
                    dose_modifier=risk_result.dose_modifier,
                    cpic_level=risk_result.cpic_level,
                    alternative_drugs=risk_result.alternatives,
                    monitoring_parameters=risk_result.monitoring
                ),
                llm_generated_explanation=LLMExplanation(
                    summary=explanation_data.get("summary", ""),
                    mechanism=explanation_data.get("mechanism", ""),
                    variant_significance=explanation_data.get("variant_significance", ""),
                    clinical_implication=explanation_data.get("clinical_implication", ""),
                    population_context=explanation_data.get("population_context", ""),
                    risk_rationale=explanation_data.get("risk_rationale", ""),
                    alternatives_note=explanation_data.get("alternatives_note", ""),
                    generated_by=explanation_data.get("generated_by", "rule-based")
                ),
                quality_metrics=QualityMetrics(
                    vcf_parsing_success=parse_result.success,
                    vcf_version=parse_result.vcf_version,
                    total_variants_parsed=parse_result.total_variants,
                    pharmacogenomic_variants_found=len(parse_result.pharmaco_variants),
                    genes_analyzed=list(parse_result.gene_profiles.keys()),
                    parsing_errors=parse_result.parsing_errors,
                    analysis_id=analysis_id
                )
            )
            all_results.append(result)
            
        return all_results

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)