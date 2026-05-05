"""
PharmaGuard LLM Clinical Explanation Generator
Supports: Google Gemini API (free) and Groq API (free)
Falls back gracefully if API keys are not set.
"""

import os
import json
import httpx
from typing import Optional, Dict, List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# LLM CLIENT FACTORY
# Priority: Gemini → Groq → Rule-based fallback
# ─────────────────────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")


async def call_gemini(prompt: str) -> str:
    """Call Google Gemini 1.5 Flash (free tier: 1500 req/day)."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json",
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_MEDICAL", "threshold": "BLOCK_NONE"},
        ],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def call_groq(prompt: str) -> str:
    """Call Groq (Llama3 70B — free tier: 14400 req/day)."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama3-70b-8192",
        "messages": [
            {
                "role": "system",
                "content": "You are a clinical pharmacogenomics expert. Always respond with valid JSON only. No markdown, no explanation outside JSON."
            },
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1024,
        "response_format": {"type": "json_object"},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


# ─────────────────────────────────────────────────────────────────────────────
# CLINICAL EXPLANATION PROMPT
# ─────────────────────────────────────────────────────────────────────────────

def build_clinical_prompt(
    drug: str,
    risk_label: str,
    phenotype: str,
    diplotype: str,
    gene: str,
    variants: list,
    action: str,
    severity: str,
    alternatives: list,
) -> str:
    variant_text = ""
    for v in variants[:5]:  # limit to 5 variants for prompt size
        variant_text += f"  - {v.get('rsid','')} ({v.get('star_allele','')}) on {v.get('gene','')}: {v.get('effect','').replace('_',' ')}, {v.get('zygosity','')}\n"
    
    if not variant_text:
        variant_text = "  - No pharmacogenomic variants detected (assuming *1/*1 diplotype)\n"

    return f"""You are a board-certified clinical pharmacogenomicist writing a patient-specific pharmacogenomic report.

PATIENT PHARMACOGENOMIC DATA:
- Drug analyzed: {drug}
- Primary gene: {gene}
- Detected diplotype: {diplotype}
- Phenotype classification: {phenotype}
- Risk assessment: {risk_label} (Severity: {severity})
- CPIC action: {action}

GENETIC VARIANTS DETECTED:
{variant_text}

Generate a clinical pharmacogenomic explanation as JSON with EXACTLY these fields:
{{
  "summary": "2-3 sentence plain-English summary for the patient. Explain what their genetics mean for this drug WITHOUT medical jargon.",
  "mechanism": "2-3 sentences explaining the biological mechanism: what the gene does, how the variants affect enzyme activity or transport, and why this changes drug behavior in the body.",
  "variant_significance": "1-2 sentences citing the specific rsIDs or star alleles detected and their individual clinical significance.",
  "clinical_implication": "2-3 sentences for the prescribing clinician: what this means for dosing, timing, monitoring, and expected drug response.",
  "population_context": "1 sentence noting approximate population frequency of this phenotype.",
  "risk_rationale": "1-2 sentences explaining why the risk label '{risk_label}' was assigned based on the genetic evidence.",
  "alternatives_note": "1 sentence about {', '.join(alternatives[:2]) if alternatives else 'no standard alternatives'} as potential options if applicable."
}}

RULES:
- Be specific: cite rsIDs, star alleles, gene names
- Be accurate: align with CPIC guidelines
- Do NOT use markdown in values
- Return ONLY valid JSON, no surrounding text"""


# ─────────────────────────────────────────────────────────────────────────────
# RULE-BASED FALLBACK (no API key required)
# ─────────────────────────────────────────────────────────────────────────────

PHENOTYPE_MECHANISMS = {
    "CYP2D6": {
        "PM":  "CYP2D6 encodes a liver enzyme responsible for metabolizing ~25% of all drugs. Poor Metabolizers carry two non-functional alleles, resulting in near-zero enzyme activity. Drugs requiring CYP2D6 activation (like codeine→morphine) will not produce therapeutic effect, while drugs inactivated by CYP2D6 will accumulate to toxic levels.",
        "IM":  "CYP2D6 Intermediate Metabolizers carry one reduced-function allele, producing approximately 50% of normal enzyme activity. Drug metabolism is slower than average, requiring dose adjustments to avoid accumulation.",
        "NM":  "CYP2D6 Normal Metabolizers carry two functional alleles with expected enzyme activity. Standard dosing protocols apply.",
        "URM": "CYP2D6 Ultrarapid Metabolizers carry gene duplications producing 3× or more normal enzyme activity. Pro-drugs are converted extremely rapidly, causing toxic peaks, while standard drugs are cleared before producing therapeutic effect.",
    },
    "CYP2C19": {
        "PM":  "CYP2C19 is critical for activating clopidogrel (prodrug→active thiol metabolite). Poor Metabolizers cannot convert the prodrug, resulting in therapeutic failure and high cardiovascular risk.",
        "IM":  "CYP2C19 Intermediate Metabolizers have reduced activation capacity. Clopidogrel efficacy is diminished; higher doses or alternative agents should be considered.",
        "NM":  "CYP2C19 Normal Metabolizers have expected activation of prodrugs like clopidogrel. Standard antiplatelet therapy is effective.",
        "URM": "CYP2C19 Ultrarapid Metabolizers may show excessive drug activation, potentially increasing bleeding risk or requiring dose adjustment.",
    },
    "CYP2C9": {
        "PM":  "CYP2C9 metabolizes warfarin's active S-enantiomer. Poor Metabolizers clear warfarin 3-4× more slowly, causing dangerous drug accumulation and severe bleeding risk at standard doses.",
        "IM":  "CYP2C9 Intermediate Metabolizers have reduced warfarin clearance. Initial doses should be reduced 25-35% with careful INR titration.",
        "NM":  "CYP2C9 Normal Metabolizers have expected warfarin metabolism. Standard dosing with routine INR monitoring is appropriate.",
    },
    "SLCO1B1": {
        "PM":  "SLCO1B1 encodes OATP1B1, a hepatic uptake transporter for statins. Variants (especially rs4149056/*5) reduce statin transport into liver cells, causing high plasma drug levels and myopathy/rhabdomyolysis risk.",
        "IM":  "SLCO1B1 Intermediate function results in moderately elevated plasma statin exposure. Simvastatin doses should be limited to 20mg/day maximum.",
        "NM":  "SLCO1B1 Normal function allows standard statin transport into hepatocytes. Standard dosing is appropriate.",
    },
    "TPMT": {
        "PM":  "TPMT deficiency results in zero thiopurine methyltransferase activity. Azathioprine is shunted entirely into toxic thioguanine nucleotides, causing severe myelosuppression with standard doses.",
        "IM":  "TPMT Intermediate activity (one functional allele) results in 30-60% of normal thiopurine inactivation. Significant dose reduction required.",
        "NM":  "TPMT Normal activity adequately methylates thiopurines. Standard weight-based azathioprine dosing is safe.",
    },
    "DPYD": {
        "PM":  "DPYD encodes dihydropyrimidine dehydrogenase (DPD), which inactivates 80% of fluorouracil. DPD deficiency causes fluorouracil accumulation to lethal levels, causing fatal toxicity.",
        "IM":  "DPYD variants conferring intermediate activity lead to 50% reduced fluorouracil clearance. Dose reduction of 25-50% is required with careful toxicity monitoring.",
        "NM":  "DPYD Normal function provides adequate fluorouracil catabolism. Standard oncology protocol dosing is appropriate.",
    },
}

RISK_RATIONALE_TEMPLATES = {
    "Safe": "The {phenotype} phenotype indicates normal metabolizer function for {gene}, predicting standard drug behavior at therapeutic doses. No genetic adjustment to prescribing is required.",
    "Adjust Dosage": "The {phenotype} phenotype for {gene} alters drug metabolism sufficiently to require dosing modification. Without adjustment, subtherapeutic or supratherapeutic drug exposure is expected.",
    "Toxic": "The {phenotype} phenotype creates conditions for dangerous drug accumulation or toxic metabolite production. Standard doses pose an unacceptable safety risk based on CPIC Level A evidence.",
    "Ineffective": "The {phenotype} phenotype prevents adequate drug activation or creates such accelerated clearance that therapeutic drug levels cannot be sustained. The drug is predicted to provide no clinical benefit.",
    "Unknown": "Insufficient pharmacogenomic data to predict drug response for this gene-drug pair. Standard clinical monitoring is advised.",
}

def generate_fallback_explanation(
    drug: str, risk_label: str, phenotype: str, diplotype: str,
    gene: str, variants: list, action: str, severity: str, alternatives: list,
) -> dict:
    """Rule-based explanation when no LLM API key is available."""
    
    mechanism = PHENOTYPE_MECHANISMS.get(gene, {}).get(
        phenotype,
        f"{gene} variants affecting drug metabolism were detected. Clinical consultation is recommended."
    )

    variant_refs = [v.get("rsid", "") for v in variants if v.get("rsid")]
    star_refs = [v.get("star_allele", "") for v in variants if v.get("star_allele") and v.get("star_allele") != "unknown"]
    
    variant_sig = ""
    if variant_refs:
        variant_sig = f"Detected variant(s) {', '.join(variant_refs[:3])} ({', '.join(star_refs[:3]) if star_refs else 'functional impact confirmed'}) have been validated in multiple clinical cohorts as significantly altering {gene} enzyme function."
    else:
        variant_sig = f"No loss-of-function variants detected in {gene}. Diplotype {diplotype} is consistent with normal metabolizer function."

    risk_rationale = RISK_RATIONALE_TEMPLATES.get(risk_label, "").format(
        phenotype=phenotype, gene=gene, drug=drug
    )

    pop_context = {
        "PM":  f"Approximately 7-10% of European populations are {gene} Poor Metabolizers; frequency varies by ancestry (1-2% in Asian populations for some genes).",
        "IM":  f"Intermediate Metabolizers represent approximately 10-15% of most populations.",
        "NM":  f"Normal Metabolizers represent the most common phenotype, found in ~60-70% of most populations.",
        "URM": f"Ultrarapid Metabolizers represent approximately 1-10% of populations depending on ancestry.",
    }.get(phenotype, "Population frequency data not available for this phenotype.")

    alt_note = ""
    if alternatives and risk_label in ("Toxic", "Ineffective", "Adjust Dosage"):
        alt_note = f"Recommended alternatives include {alternatives[0]} and {alternatives[1] if len(alternatives) > 1 else 'other agents in this class'}, which do not rely on {gene} for primary metabolism or activation."
    else:
        alt_note = f"No alternative agent substitution is required; standard {drug} therapy is pharmacogenomically appropriate."

    summary = (
        f"Your genetic test shows a {phenotype} (Poor Metabolizer) phenotype for {gene}, "
        f"which significantly affects how your body processes {drug}. "
        f"Based on CPIC guidelines, the risk classification is: {risk_label}. {action[:120]}..."
        if phenotype != "NM" else
        f"Your genetic profile shows normal {gene} function ({diplotype}), predicting standard response to {drug}. "
        f"No dose adjustment is needed based on your pharmacogenomic results."
    )

    clinical_impl = (
        f"For the prescribing clinician: Patient's {gene} {diplotype} diplotype classifies as {phenotype}. "
        f"{action} "
        f"Recommended monitoring includes: {', '.join(alternatives[:2]) if alternatives else 'standard parameters'}."
    )

    return {
        "summary": summary,
        "mechanism": mechanism,
        "variant_significance": variant_sig,
        "clinical_implication": clinical_impl,
        "population_context": pop_context,
        "risk_rationale": risk_rationale,
        "alternatives_note": alt_note,
        "generated_by": "rule-based-fallback",
    }


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

async def generate_clinical_explanation(
    drug: str, risk_label: str, phenotype: str, diplotype: str,
    gene: str, variants: list, action: str, severity: str, alternatives: list,
) -> dict:
    """
    Generate LLM clinical explanation.
    Priority: Gemini → Groq → Rule-based fallback.
    Never fails — always returns a valid explanation dict.
    """
    prompt = build_clinical_prompt(
        drug=drug, risk_label=risk_label, phenotype=phenotype,
        diplotype=diplotype, gene=gene, variants=variants,
        action=action, severity=severity, alternatives=alternatives,
    )

    # Try Gemini first
    if GEMINI_API_KEY:
        try:
            # We use httpx directly for better async control and error handling
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 1024,
                    "responseMimeType": "application/json",
                }
            }
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw = data["candidates"][0]["content"]["parts"][0]["text"]
                    # Clean JSON if wrapped in markdown
                    raw = raw.strip()
                    if raw.startswith("```"):
                        raw = raw.split("```")[1]
                        if raw.startswith("json"):
                            raw = raw[4:]
                    parsed = json.loads(raw)
                    parsed["generated_by"] = "gemini-1.5-flash"
                    return parsed
        except Exception as e:
            print(f"[LLM] Gemini failed: {e}. Trying Groq...")

    # Try Groq as fallback
    if GROQ_API_KEY:
        try:
            raw = await call_groq(prompt)
            parsed = json.loads(raw)
            parsed["generated_by"] = "groq-llama3-70b"
            return parsed
        except Exception as e:
            print(f"[LLM] Groq failed: {e}. Using rule-based fallback.")

    # Rule-based fallback (always works)
    result = generate_fallback_explanation(
        drug=drug, risk_label=risk_label, phenotype=phenotype,
        diplotype=diplotype, gene=gene, variants=variants,
        action=action, severity=severity, alternatives=alternatives,
    )
    return result



