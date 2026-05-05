"""
PharmaGuard Risk Assessment Engine
CPIC-aligned pharmacogenomic risk prediction per drug + gene profile
"""

from dataclasses import dataclass
from typing import Optional

# ─────────────────────────────────────────────────────────────────────────────
# CPIC Drug-Gene Clinical Rules
# Format: (gene, phenotype) → risk_label, severity, dose_modifier, action, cpic_level
# ─────────────────────────────────────────────────────────────────────────────
DRUG_GENE_RULES = {
    "CODEINE": {
        "primary_gene": "CYP2D6",
        "rules": {
            "PM":  ("Ineffective",   "moderate", 0.0,  "Use non-opioid analgesic (e.g., NSAIDs, acetaminophen). Codeine is not converted to active morphine. No analgesia expected.", "A"),
            "IM":  ("Adjust Dosage", "low",      0.75, "Use 75% of standard dose. Monitor for reduced analgesia. Consider alternative.", "A"),
            "NM":  ("Safe",          "none",     1.0,  "Standard dosing applies. Monitor as per usual clinical practice.", "A"),
            "RM":  ("Safe",          "none",     1.0,  "Standard dosing. No specific adjustment required for RM phenotype.", "A"),
            "URM": ("Toxic",         "critical", 0.0,  "CONTRAINDICATED. Ultrarapid conversion to morphine causes dangerous opioid levels. Risk of respiratory depression and death. Use alternative analgesic.", "A"),
        },
        "alternatives": ["Acetaminophen", "Ibuprofen", "Morphine (dose-adjusted)", "Tramadol (if CYP2D6 NM)"],
        "monitoring": ["Respiratory rate", "Pain scores", "Sedation level"],
    },
    "WARFARIN": {
        "primary_gene": "CYP2C9",
        "secondary_gene": "VKORC1",
        "rules": {
            "PM":  ("Adjust Dosage", "high",     0.4,  "Reduce initial dose by 50-60%. Weekly INR monitoring for first month. Target INR 2.0-3.0. High bleeding risk without adjustment.", "A"),
            "IM":  ("Adjust Dosage", "moderate", 0.65, "Reduce initial dose by 25-35%. Bi-weekly INR monitoring. Titrate slowly.", "A"),
            "NM":  ("Safe",          "none",     1.0,  "Standard warfarin dosing. Routine INR monitoring every 4 weeks when stable.", "A"),
            "URM": ("Safe",          "none",     1.0,  "Standard dosing. Monitor INR as per standard protocol.", "A"),
        },
        "alternatives": ["Apixaban", "Rivaroxaban", "Dabigatran (renal function dependent)"],
        "monitoring": ["INR (weekly initially)", "Signs of bleeding", "Signs of thrombosis"],
    },
    "CLOPIDOGREL": {
        "primary_gene": "CYP2C19",
        "rules": {
            "PM":  ("Ineffective",   "high",     0.0,  "AVOID. Clopidogrel cannot be activated. No antiplatelet effect. High risk of cardiovascular events (MI, stent thrombosis). Use alternative antiplatelet.", "A"),
            "IM":  ("Adjust Dosage", "moderate", 0.5,  "Consider alternative antiplatelet agent. If clopidogrel used, higher doses may be needed. Cardiologist consultation recommended.", "A"),
            "NM":  ("Safe",          "none",     1.0,  "Standard 75mg/day dosing. Normal antiplatelet response expected.", "A"),
            "URM": ("Adjust Dosage", "low",      0.75, "Possible increased platelet inhibition. Standard dosing usually appropriate. Monitor for bleeding.", "A"),
        },
        "alternatives": ["Prasugrel", "Ticagrelor (preferred for CYP2C19 PM)"],
        "monitoring": ["Platelet aggregation tests", "Signs of thrombosis", "Bleeding events"],
    },
    "SIMVASTATIN": {
        "primary_gene": "SLCO1B1",
        "rules": {
            "PM":  ("Toxic",         "high",     0.0,  "High risk of simvastatin-induced myopathy/rhabdomyolysis. Use alternative statin with lower SLCO1B1 dependence (rosuvastatin, pravastatin at low doses).", "A"),
            "IM":  ("Adjust Dosage", "moderate", 0.5,  "Limit simvastatin to 20mg/day max. Monitor CK levels every 3 months. Consider rosuvastatin or pravastatin.", "A"),
            "NM":  ("Safe",          "none",     1.0,  "Standard simvastatin dosing (up to 40mg/day). Routine monitoring.", "A"),
            "URM": ("Safe",          "none",     1.0,  "Standard dosing. No dose adjustment required.", "A"),
        },
        "alternatives": ["Rosuvastatin 5-10mg", "Pravastatin 40mg", "Fluvastatin XL 80mg"],
        "monitoring": ["Creatine kinase (CK)", "LDL levels", "Muscle pain/weakness symptoms"],
    },
    "AZATHIOPRINE": {
        "primary_gene": "TPMT",
        "rules": {
            "PM":  ("Toxic",         "critical", 0.0,  "CONTRAINDICATED at standard doses. TPMT-deficient patients accumulate toxic thiopurine metabolites causing life-threatening myelosuppression. Reduce dose by 90% or use alternative (mycophenolate).", "A"),
            "IM":  ("Adjust Dosage", "high",     0.5,  "Reduce dose by 30-70%. Start at lowest effective dose. Weekly CBC for first 8 weeks. Extended monitoring schedule.", "A"),
            "NM":  ("Safe",          "none",     1.0,  "Standard weight-based dosing (2-3mg/kg/day). Monthly CBC monitoring.", "A"),
            "URM": ("Safe",          "none",     1.0,  "Standard dosing. Some evidence of reduced efficacy — monitor therapeutic response.", "A"),
        },
        "alternatives": ["Mycophenolate mofetil", "Methotrexate", "Cyclosporine"],
        "monitoring": ["CBC weekly ×8, then monthly", "Liver function tests", "Signs of infection"],
    },
    "FLUOROURACIL": {
        "primary_gene": "DPYD",
        "rules": {
            "PM":  ("Toxic",         "critical", 0.0,  "CONTRAINDICATED. DPYD-deficient patients cannot clear fluorouracil. Risk of fatal toxicity: severe mucositis, myelosuppression, neurotoxicity. Use capecitabine only with >85% dose reduction or alternative regimen.", "A"),
            "IM":  ("Adjust Dosage", "high",     0.5,  "Reduce starting dose by 50%. Therapeutic drug monitoring (TDM) recommended. Escalate only with tolerance confirmed. High vigilance for GI toxicity.", "A"),
            "NM":  ("Safe",          "none",     1.0,  "Standard protocol dosing. Routine toxicity monitoring per oncology guidelines.", "A"),
            "URM": ("Safe",          "none",     1.0,  "Standard dosing. Possible reduced efficacy — monitor tumor response.", "A"),
        },
        "alternatives": ["Raltitrexed", "Irinotecan-based regimens", "Oxaliplatin-based regimens"],
        "monitoring": ["CBC (weekly)", "Mucositis grade", "Diarrhea grade", "Neurotoxicity signs"],
    },
}

# Phenotype human-readable descriptions
PHENOTYPE_DESCRIPTIONS = {
    "PM":  "Poor Metabolizer — significantly reduced or absent enzyme activity",
    "IM":  "Intermediate Metabolizer — reduced enzyme activity (one functional allele)",
    "NM":  "Normal Metabolizer — expected enzyme activity",
    "RM":  "Rapid Metabolizer — slightly increased activity",
    "URM": "Ultrarapid Metabolizer — greatly increased enzyme activity",
    "Unknown": "Phenotype could not be determined from available variants",
}

# Confidence score rules based on evidence quality
def calculate_confidence(
    phenotype: str,
    variant_count: int,
    has_primary_gene: bool,
    cpic_level: str,
) -> float:
    base = 0.5
    
    if phenotype != "Unknown":
        base += 0.15
    if has_primary_gene:
        base += 0.15
    if variant_count > 0:
        base += min(variant_count * 0.05, 0.15)
    if cpic_level == "A":
        base += 0.05
    elif cpic_level == "B":
        base += 0.02

    return round(min(base, 0.97), 2)


@dataclass
class RiskResult:
    drug: str
    risk_label: str
    severity: str
    confidence_score: float
    dose_modifier: float
    action: str
    cpic_level: str
    alternatives: list
    monitoring: list
    primary_gene: str
    diplotype: str
    phenotype: str
    phenotype_description: str
    detected_variants: list


def assess_drug_risk(drug: str, gene_profiles: dict) -> RiskResult:
    """
    Given a drug name and a dict of GeneProfile objects,
    return a complete RiskResult with CPIC-aligned recommendations.
    """
    drug_upper = drug.strip().upper()
    
    if drug_upper not in DRUG_GENE_RULES:
        # Unknown drug — return Unknown result
        return RiskResult(
            drug=drug_upper,
            risk_label="Unknown",
            severity="unknown",
            confidence_score=0.3,
            dose_modifier=1.0,
            action=f"{drug_upper} is not in the supported drug list. Consult clinical pharmacist for manual review.",
            cpic_level="N/A",
            alternatives=[],
            monitoring=["Consult pharmacist or clinical geneticist"],
            primary_gene="N/A",
            diplotype="N/A",
            phenotype="Unknown",
            phenotype_description="Drug not in supported panel",
            detected_variants=[],
        )

    rules = DRUG_GENE_RULES[drug_upper]
    primary_gene = rules["primary_gene"]
    
    # Get profile for primary gene
    profile = gene_profiles.get(primary_gene)

    if not profile:
        # No variants detected for primary gene → assume Normal Metabolizer
        phenotype = "NM"
        diplotype = "*1/*1"
        detected_variants = []
        activity_score = 2.0
    else:
        phenotype = profile.phenotype
        diplotype = profile.diplotype
        detected_variants = profile.variants
        activity_score = profile.activity_score

    # Look up risk rule
    drug_rules = rules["rules"]
    if phenotype in drug_rules:
        risk_label, severity, dose_mod, action, cpic_level = drug_rules[phenotype]
    else:
        risk_label, severity, dose_mod, action, cpic_level = (
            "Unknown", "unknown", 1.0,
            "No specific guideline for this phenotype. Standard monitoring recommended.",
            "C"
        )

    confidence = calculate_confidence(
        phenotype=phenotype,
        variant_count=len(detected_variants),
        has_primary_gene=profile is not None,
        cpic_level=cpic_level,
    )

    # Serialize detected variants
    serialized_variants = []
    for v in detected_variants:
        serialized_variants.append({
            "rsid": v.rsid,
            "gene": v.gene,
            "star_allele": v.star_allele,
            "effect": v.effect,
            "zygosity": v.zygosity,
            "chromosome": v.chrom,
            "position": v.pos,
            "ref": v.ref,
            "alt": v.alt,
            "genotype": v.genotype,
            "activity_score": v.activity,
        })

    return RiskResult(
        drug=drug_upper,
        risk_label=risk_label,
        severity=severity,
        confidence_score=confidence,
        dose_modifier=dose_mod,
        action=action,
        cpic_level=cpic_level,
        alternatives=rules.get("alternatives", []),
        monitoring=rules.get("monitoring", []),
        primary_gene=primary_gene,
        diplotype=diplotype,
        phenotype=phenotype,
        phenotype_description=PHENOTYPE_DESCRIPTIONS.get(phenotype, "Unknown"),
        detected_variants=serialized_variants,
    )
