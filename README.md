<div align="center">

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=40&pause=1000&color=0D9488&center=true&vCenter=true&width=600&lines=GenRx+AI;Precision+Medicine+%F0%9F%A7%AC;by+DNA%2C+not+guesswork." alt="GenRx AI Typing SVG" />

<br/>

# 🧬 GenRx — AI-Powered Pharmacogenomic Clinical Decision Support System

> **"Your DNA is unique. Your medication should be too."**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_App-0D9488?style=for-the-badge)](https://pw-hackathon-zeta.vercel.app/)
[![LinkedIn Demo Video](https://img.shields.io/badge/▶️_Demo_Video-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/posts/nisha1608_rift2026-pharmaguard-pharmacogenomics-activity-7430411517449330688-uCQw?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEcycvUBolScL1hN-ncdMfmSGS56nEENA6s)
[![GitHub](https://img.shields.io/badge/⭐_Star_Repo-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Nisha1608/PW_HACKATHON)

<br/>

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini_1.5-4285F4?style=flat-square&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_Llama3_70B-F55036?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![RIFT 2026](https://img.shields.io/badge/RIFT_2026-Hackathon-8B5CF6?style=flat-square)

</div>

---

## 📋 Table of Contents

- [🚨 The Problem — Why This Matters](#-the-problem--why-this-matters)
- [💡 The Solution — What We Built](#-the-solution--what-we-built)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🔬 Core Features](#-core-features)
- [📊 Supported Drugs & Genes](#-supported-drugs--genes)
- [📤 Output Schema](#-output-schema-exact-format)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Getting Started — Full Setup Guide](#-getting-started--full-setup-guide)
- [📡 API Documentation](#-api-documentation)
- [🧪 Sample VCF Files](#-sample-vcf-files)
- [🔍 Usage Examples](#-usage-examples)
- [🚢 Deployment Guide](#-deployment-guide)
- [👥 Team Members](#-team-members)
- [🗺️ Roadmap](#️-roadmap)

---

## 🚨 The Problem — Why This Matters

Adverse Drug Reactions (ADRs) are the **4th leading cause of death** in hospitalized patients worldwide.

| Statistic | Impact |
|---|---|
| **2.2 million ADRs** per year in the US alone | ~100,000 deaths annually |
| **$136 billion** in avoidable healthcare costs | "One-size-fits-all" dosing |
| **>99% of patients** never receive PGx testing | Clinical gap at point-of-care |

**The root cause?** Standard drug dosing is "one-size-fits-all." But people's bodies metabolize drugs fundamentally differently based on their genetics. A dose that's therapeutic for one person can be **lethal** for another.

Pharmacogenomics (PGx) solves this — but:
- PGx reports are dense, jargon-heavy PDFs clinicians can't quickly act on
- Doctors lack real-time, structured tools mapping genetic variants to dosing guidelines
- **The data exists in VCF files. The intelligence to act on it does not.**

---

## 💡 The Solution — What We Built

**GenRx** is a full-stack, AI-powered clinical decision support platform that transforms raw genomic VCF files into actionable, structured pharmacogenomic risk reports — in seconds.

```
📁 Patient VCF File  ──►  🔬 VCF Parser  ──►  ⚖️ Risk Engine (CPIC)  ──►  🤖 LLM Explanation  ──►  📋 Clinical Report
```

### What makes it different:
1. ✅ **True VCF v4.2 Parsing** — multi-method detection: rsID lookup, INFO tag annotation, SnpEff ANN field
2. ✅ **CPIC Level A Guidelines** — hard-coded, peer-reviewed clinical rules for 6 critical gene-drug pairs
3. ✅ **Tri-layer LLM Intelligence** — Gemini 1.5 Flash → Groq Llama3 70B → deterministic rule-based fallback (never fails)
4. ✅ **Exact JSON Schema Compliance** — output matches the mandatory specification field-for-field
5. ✅ **Interactive Genome Chat** — patients ask follow-up questions about their results in plain English
6. ✅ **PDF + JSON Export** — clinical-grade reports downloadable for physicians
7. ✅ **Zero-dependency fallback** — works without API keys using 300+ templated clinical explanations

---


### Data Flow — Step by Step

```
1️⃣  User uploads .vcf + enters drug name(s)
        ↓
2️⃣  VCF Parser scans every variant line:
        Method 1: Direct rsID lookup against PHARMACO_VARIANTS_DB (30+ known variants)
        Method 2: INFO tag parsing (GENE=, STAR=, RS= fields)
        Method 3: SnpEff ANN field gene name matching
        → Outputs: GeneProfile per gene (diplotype, phenotype, activity_score)
        ↓
3️⃣  Risk Engine evaluates each drug against the gene profile:
        → Looks up DRUG_GENE_RULES[drug][phenotype]
        → Returns: risk_label, severity, dose_modifier, action, cpic_level
        → Calculates confidence_score (0.50–0.97 based on evidence quality)
        ↓
4️⃣  LLM Service generates a 7-field clinical explanation:
        → Tries Gemini 1.5 Flash first (async httpx call)
        → Falls back to Groq Llama3 70B if Gemini fails
        → Falls back to deterministic rule-based templates (always succeeds)
        ↓
5️⃣  FastAPI constructs the mandatory AnalysisResult JSON, validated by Pydantic
        ↓
6️⃣  React frontend renders color-coded risk cards, expandable sections, export buttons
```

---

## 🔬 Core Features

### 🗂️ VCF File Parser (`vcf_parser.py`)
- Parses **VCF v4.2** with strict format validation
- Supports both **GRCh37 and GRCh38** coordinate systems
- **Three-method variant detection**:
  - Direct **rsID matching** against a curated 30+ variant pharmacogenomics database
  - **INFO field tag parsing** (`GENE=`, `STAR=`, `RS=` annotations)
  - **SnpEff ANN field** gene name extraction
- **Diplotype calculation**: constructs `*X/*Y` notation from detected star alleles
- **Phenotype classification**: Poor (PM) / Intermediate (IM) / Normal (NM) / Ultrarapid (URM) Metabolizer based on CYP activity score model
- **Zygosity detection**: heterozygous, homozygous_alt, homozygous_ref
- **Activity score model**: each allele-effect type contributes to a total score from 0–2.0+ for phenotype determination

### ⚖️ CPIC-Aligned Risk Engine (`risk_engine.py`)
- Implements **CPIC Level A** clinical pharmacogenomics guidelines
- Hard-coded, peer-reviewed clinical action rules for **6 drugs × 4+ phenotypes**
- Returns structured `RiskResult` with:
  - `risk_label`: Safe | Adjust Dosage | Toxic | Ineffective | Unknown
  - `severity`: none | low | moderate | high | critical
  - `dose_modifier`: float (e.g., 0.4 = 60% dose reduction)
  - `action`: Full clinical action including monitoring cadence
  - `alternatives`: alternative drugs not dependent on the affected gene
  - `monitoring`: specific lab parameters to watch
- **Confidence scoring** algorithm based on: phenotype certainty, variant count, gene coverage, CPIC evidence level

### 🤖 Tri-Layer LLM Service (`llm_service.py`)
- **Layer 1 — Google Gemini 1.5 Flash**: primary AI brain (1,500 req/day free)
- **Layer 2 — Groq Llama3 70B**: high-speed fallback (14,400 req/day free)
- **Layer 3 — Rule-based Templates**: 300+ deterministic templates per gene-phenotype combination; zero external dependency
- Generates a **7-field structured clinical explanation**:
  - `summary` — plain-English patient summary
  - `mechanism` — molecular biology explanation with gene function
  - `variant_significance` — specific rsID/star allele citations
  - `clinical_implication` — prescriber-facing dosing/monitoring guidance
  - `population_context` — ancestry-specific prevalence data
  - `risk_rationale` — evidence-based reason for risk label
  - `alternatives_note` — alternative therapy guidance
- Each field cites specific variants: rs3892097, *4 diplotypes, gene names
- Clinical prompts structured as board-certified pharmacogenomicist instructions

### 🖥️ React Frontend
- **Drag-and-drop VCF upload** with real-time validation (format, size ≤5MB)
- **Multi-drug input** — comma-separated or quick-select from 6 supported drugs
- **Animated analysis loader** — 4-step progress indicator (Parsing → Assessing → AI Generating → Finalizing)
- **Color-coded risk cards** — 🟢 Safe / 🟡 Adjust Dosage / 🔴 Toxic/Ineffective
- **Expandable result sections**: Risk Profile, Genetic Details, Clinical Recommendations, AI Explanation, Quality Metrics
- **Genome Chat** — floating AI chatbot with analysis context, suggested follow-ups
- **Dashboard view** — historical analysis summary with gene coverage visualization
- **Export**: PDF clinical report (jsPDF) + JSON download + clipboard copy

---

## 📊 Supported Drugs & Genes

| Drug | Primary Gene | Risk Categories | Clinical Significance |
|------|-------------|-----------------|----------------------|
| **CODEINE** | `CYP2D6` | Ineffective (PM), Adjust (IM), **Toxic (URM)** | URM: fatal respiratory depression from rapid morphine conversion |
| **WARFARIN** | `CYP2C9` | Adjust (PM/IM), Safe (NM) | PM: 3-4× slower clearance → 50-60% dose reduction needed |
| **CLOPIDOGREL** | `CYP2C19` | **Ineffective (PM)**, Adjust (IM) | PM: prodrug not activated → stent thrombosis risk |
| **SIMVASTATIN** | `SLCO1B1` | **Toxic (PM)**, Adjust (IM) | PM: rhabdomyolysis risk at standard 40mg doses |
| **AZATHIOPRINE** | `TPMT` | **Toxic (PM)**, Adjust (IM) | PM: life-threatening myelosuppression at standard doses |
| **FLUOROURACIL** | `DPYD` | **Toxic (PM)**, Adjust (IM) | PM: fatal toxicity — mucositis, myelosuppression, neurotoxicity |

### Pharmacogenomic Variant Database (30+ Known Variants)

| rsID | Gene | Star Allele | Effect | Activity |
|------|------|-------------|--------|----------|
| rs3892097 | CYP2D6 | *4 | Loss of function | 0.0 |
| rs35742686 | CYP2D6 | *3 | Loss of function | 0.0 |
| rs5030655 | CYP2D6 | *6 | Loss of function | 0.0 |
| rs16947 | CYP2D6 | *2 | Reduced function | 0.5 |
| rs4244285 | CYP2C19 | *2 | Loss of function | 0.0 |
| rs4986893 | CYP2C19 | *3 | Loss of function | 0.0 |
| rs12248560 | CYP2C19 | *17 | Increased function | 2.0 |
| rs1799853 | CYP2C9 | *2 | Reduced function | 0.5 |
| rs1057910 | CYP2C9 | *3 | Reduced function | 0.0 |
| rs4149056 | SLCO1B1 | *5 | Reduced function | 0.5 |
| rs74064213 | SLCO1B1 | *15 | Loss of function | 0.0 |
| rs1800460 | TPMT | *3B | Loss of function | 0.0 |
| rs1142345 | TPMT | *3C | Loss of function | 0.0 |
| rs1800462 | TPMT | *2 | Loss of function | 0.0 |
| rs3918290 | DPYD | *2A | Loss of function | 0.0 |
| rs55886062 | DPYD | *13 | Loss of function | 0.0 |
| rs67376798 | DPYD | HapB3 | Reduced function | 0.5 |
| *...and 13 more* | | | | |

---

## 📤 Output Schema (Exact Format)

The API returns a **fully Pydantic-validated JSON** matching the mandatory specification:

```json
{
  "patient_id": "PATIENT_001",
  "drug": "CODEINE",
  "timestamp": "2026-02-20T03:49:37Z",
  "risk_assessment": {
    "risk_label": "Toxic",
    "confidence_score": 0.92,
    "severity": "critical"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "CYP2D6",
    "diplotype": "*4/*4",
    "phenotype": "URM",
    "phenotype_description": "Ultrarapid Metabolizer — greatly increased enzyme activity",
    "detected_variants": [
      {
        "rsid": "rs3892097",
        "gene": "CYP2D6",
        "star_allele": "*4",
        "effect": "loss_of_function",
        "zygosity": "homozygous_alt",
        "chromosome": "chr22",
        "position": 42522613,
        "ref": "C",
        "alt": "T",
        "genotype": "1/1",
        "activity_score": 0.0
      }
    ]
  },
  "clinical_recommendation": {
    "action": "CONTRAINDICATED. Ultrarapid conversion to morphine causes dangerous opioid levels. Risk of respiratory depression and death. Use alternative analgesic.",
    "dose_modifier": 0.0,
    "cpic_level": "A",
    "alternative_drugs": ["Acetaminophen", "Ibuprofen", "Morphine (dose-adjusted)", "Tramadol (if CYP2D6 NM)"],
    "monitoring_parameters": ["Respiratory rate", "Pain scores", "Sedation level"]
  },
  "llm_generated_explanation": {
    "summary": "Your genetic profile shows ultrarapid CYP2D6 metabolism (*4/*4 diplotype). Your body converts codeine to morphine far too quickly, which can cause life-threatening respiratory depression even at standard doses.",
    "mechanism": "CYP2D6 encodes a liver enzyme that converts codeine (a prodrug) into active morphine. Ultrarapid Metabolizers carry gene duplications producing 3× or more normal enzyme activity, causing toxic morphine peaks within minutes of ingestion.",
    "variant_significance": "The detected variant rs3892097 (*4 allele, homozygous) is the most common CYP2D6 loss-of-function allele in European populations, validated in multiple clinical cohorts as eliminating enzyme activity.",
    "clinical_implication": "For the prescribing clinician: Patient's CYP2D6 *4/*4 diplotype classifies as URM. Codeine is contraindicated. Use opioid-free alternatives (acetaminophen, NSAIDs) or morphine with dose monitoring.",
    "population_context": "Ultrarapid Metabolizers represent approximately 1-10% of populations; prevalence is highest in North African ancestry (up to 29%).",
    "risk_rationale": "The URM phenotype creates conditions for dangerous drug accumulation through rapid pro-drug activation. Standard doses pose an unacceptable safety risk based on CPIC Level A evidence.",
    "alternatives_note": "Recommended alternatives include Acetaminophen and Ibuprofen, which do not rely on CYP2D6 for primary metabolism or activation.",
    "generated_by": "gemini-1.5-flash"
  },
  "quality_metrics": {
    "vcf_parsing_success": true,
    "vcf_version": "VCFv4.2",
    "total_variants_parsed": 9,
    "pharmacogenomic_variants_found": 3,
    "genes_analyzed": ["CYP2D6", "CYP2C19", "CYP2C9"],
    "parsing_errors": [],
    "analysis_id": "a3b8d1b6-0b3b-4b1a-9c1a-1a2b3c4d5e6f"
  }
}
```

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.10+ | Core language |
| **FastAPI** | ≥0.109.0 | Async REST API framework |
| **Uvicorn** | ≥0.27.0 | ASGI server |
| **Pydantic** | ≥2.6.1 | Data validation & schema enforcement |
| **httpx** | ≥0.26.0 | Async HTTP client for LLM API calls |
| **python-dotenv** | ≥1.0.1 | Environment variable management |
| **python-multipart** | ≥0.0.9 | File upload support |
| **google-generativeai** | ≥0.4.0 | Gemini API (optional) |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.4 | UI framework with Actions & Optimistic UI |
| **TypeScript** | 5.8.2 | Type-safe frontend code |
| **Vite** | 6.2.0 | Sub-millisecond HMR dev server |
| **Tailwind CSS** | 4.2.0 | Utility-first styling |
| **Lucide React** | 0.574.0 | Icon library |
| **jsPDF + autotable** | 4.x | PDF report generation |

### AI & External Services
| Service | Model | Usage | Limit |
|---|---|---|---|
| **Google Gemini** | gemini-1.5-flash | Primary LLM for clinical explanations + chat | 1,500 req/day (free) |
| **Groq** | llama3-70b-8192 | Fallback LLM | 14,400 req/day (free) |
| **Rule-based Engine** | N/A | Final fallback (always available) | Unlimited |

### Databases & Standards Referenced
- **CPIC** (Clinical Pharmacogenetics Implementation Consortium) — Level A guidelines
- **PharmGKB** — Variant-drug associations
- **NCBI dbSNP** — rsID reference
- **PharmVar** — Star allele nomenclature

---

## 🚀 Getting Started — Full Setup Guide

### Prerequisites

```bash
# Required
Python 3.10 or higher
Node.js 18 or higher
npm 9 or higher

# Optional (for LLM features)  
Google Gemini API Key — https://makersuite.google.com/app/apikey (free)
Groq API Key — https://console.groq.com (free)
```

### Step 1: Clone the Repository

```bash
git clone https://github.com/Nisha1608/PW_HACKATHON.git
cd PW_HACKATHON
```

### Step 2: Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your API keys:
# GEMINI_API_KEY=your_gemini_api_key_here
# GROQ_API_KEY=your_groq_api_key_here
```

> ⚠️ **Note**: API keys are optional. The system runs fully offline using built-in rule-based clinical explanations.

#### Start the Backend Server

```bash
uvicorn main:app --reload --port 8000
```

✅ Backend running at `http://localhost:8000`  
✅ Swagger API docs at `http://localhost:8000/docs`  
✅ ReDoc at `http://localhost:8000/redoc`

### Step 3: Frontend Setup

```bash
# Open a new terminal from the project root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend running at `http://localhost:3000`

### Step 4: Verify Everything Works

```bash
# Test backend health
curl http://localhost:8000/

# Expected:
# {"status": "online", "version": "1.1.0", "service": "GenRx AI Backend"}

# Test supported drugs endpoint
curl http://localhost:8000/drugs
# Expected: ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"]
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000                       # Local development
https://pw-hackathon-zeta.vercel.app/api   # Live Production Backend
```

> 🌐 **Live App**: [https://pw-hackathon-zeta.vercel.app/](https://pw-hackathon-zeta.vercel.app/)

---

### `GET /`
Health check endpoint.

**Response:**
```json
{
  "status": "online",
  "version": "1.1.0",
  "service": "GenRx AI Backend"
}
```

---

### `GET /drugs`
Returns the list of all supported drugs.

**Response:**
```json
["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"]
```

---

### `POST /analyze`
**Main endpoint.** Accepts a VCF file and drug names, returns a complete pharmacogenomic analysis.

**Request (multipart/form-data):**

| Field | Type | Required | Description |
|---|---|---|---|
| `vcf_file` | file | ✅ Yes | VCF file (`.vcf` format, max 5MB) |
| `drugs` | string | ✅ Yes | Comma-separated drug names (e.g., `CODEINE,WARFARIN`) |
| `patient_id` | string | ❌ Optional | Custom patient identifier |

**Example cURL:**
```bash
# Against live deployment:
curl -X POST https://pw-hackathon-zeta.vercel.app/api/analyze \
  -F "vcf_file=@sample_vcf/sample_high_risk.vcf" \
  -F "drugs=CODEINE,WARFARIN,CLOPIDOGREL" \
  -F "patient_id=PATIENT_007"

# Or against local backend:
curl -X POST http://localhost:8000/analyze \
  -F "vcf_file=@sample_vcf/sample_high_risk.vcf" \
  -F "drugs=CODEINE,WARFARIN,CLOPIDOGREL" \
  -F "patient_id=PATIENT_007"
```

**Example Python:**
```python
import requests

# Use live deployment or local backend
API_URL = "https://pw-hackathon-zeta.vercel.app/api"  # or "http://localhost:8000"

with open("sample_vcf/sample_high_risk.vcf", "rb") as f:
    response = requests.post(
        f"{API_URL}/analyze",
        files={"vcf_file": f},
        data={"drugs": "CODEINE,WARFARIN", "patient_id": "PATIENT_007"}
    )
    
results = response.json()
for result in results:
    print(f"Drug: {result['drug']}")
    print(f"Risk: {result['risk_assessment']['risk_label']}")
    print(f"Action: {result['clinical_recommendation']['action']}")
```

**Response:** `List[AnalysisResult]` — See [Output Schema](#-output-schema-exact-format) above.

**Error Codes:**
| Code | Description |
|---|---|
| `400` | Invalid VCF format or no drugs provided |
| `500` | Internal server error (details in response body) |

---

### `POST /chat`
Contextual medical chatbot. Answers patient questions using their specific analysis results.

**Request Body (JSON):**
```json
{
  "query": "Why is codeine dangerous for me specifically?",
  "context": [/* List of AnalysisResult objects from /analyze */]
}
```

**Response:**
```json
{
  "response": "Based on your CYP2D6 *4/*4 diplotype... [clinical explanation] ...Disclaimer: I am an AI assistant. Consult your prescribing physician.",
  "suggested_follow_ups": [
    "What alternative pain medications are safe for me?",
    "Should I carry a pharmacogenomics card?",
    "Can my children inherit this genetic variant?"
  ]
}
```

---

## 🧪 Sample VCF Files

Four ready-to-use test VCF files are provided in the `sample_vcf/` directory:

| File | Scenario | Expected Outcome |
|---|---|---|
| `sample_patient.vcf` | Standard patient with mixed profile | Heterozygous variants across multiple genes |
| `sample_high_risk.vcf` | High-risk patient — multiple PM phenotypes | Toxic/Ineffective labels for most drugs |
| `sample_moderate_risk.vcf` | Intermediate risk patient | Adjust Dosage labels, moderate severity |
| `sample_safe.vcf` | Normal metabolizer — all genes WT | Safe labels across all supported drugs |

### VCF File Format Specification

```vcf
##fileformat=VCFv4.2
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele">
##INFO=<ID=RS,Number=1,Type=String,Description="dbSNP rsID">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM  POS         ID          REF  ALT  QUAL  FILTER  INFO                             FORMAT  SAMPLE_ID
chr22   42522613    rs3892097   C    T    99    PASS    GENE=CYP2D6;STAR=*4;RS=3892097   GT:GQ   0/1:99
```

**Key INFO tags parsed:**
- `GENE=` — Gene name (CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD)
- `STAR=` — Star allele notation (*2, *4, *17, etc.)
- `RS=` — rsID number (without "rs" prefix in INFO value)

---

## 🔍 Usage Examples

### Example 1: Upload via Web Interface

1. Open **[https://pw-hackathon-zeta.vercel.app/](https://pw-hackathon-zeta.vercel.app/)** (live app) or `http://localhost:3000` (local)
2. Drag & drop `sample_vcf/sample_high_risk.vcf` onto the upload zone
3. Type `CODEINE, WARFARIN, AZATHIOPRINE` in the drug input field
4. Click **"Generate Clinical Report"**
5. View color-coded risk results, expand each section for details
6. Click **"PDF REPORT"** to download the clinical document
7. Use the chat bubble (💬) to ask: *"What are my safest options for pain relief?"*

### Example 2: Direct API Call

```python
import requests, json

# Analyze a high-risk patient for cancer drugs
API_URL = "https://pw-hackathon-zeta.vercel.app/api"  # or "http://localhost:8000"

with open("sample_vcf/sample_high_risk.vcf", "rb") as f:
    r = requests.post(f"{API_URL}/analyze",
        files={"vcf_file": ("patient.vcf", f, "text/plain")},
        data={"drugs": "FLUOROURACIL,AZATHIOPRINE", "patient_id": "ONCOLOGY_PATIENT_001"}
    )

results = r.json()
for result in results:
    print(f"\n{'='*50}")
    print(f"Drug: {result['drug']}")
    print(f"Risk: {result['risk_assessment']['risk_label']} (Severity: {result['risk_assessment']['severity']})")
    print(f"Gene: {result['pharmacogenomic_profile']['primary_gene']} — {result['pharmacogenomic_profile']['diplotype']}")
    print(f"Phenotype: {result['pharmacogenomic_profile']['phenotype']}")
    print(f"Action: {result['clinical_recommendation']['action'][:150]}...")
    print(f"AI Summary: {result['llm_generated_explanation']['summary'][:200]}...")
    
# Save output
with open("report.json", "w") as f:
    json.dump(results, f, indent=2)
```

### Example 3: Test All Drugs at Once

```bash
# Quick batch test using the safe patient VCF (live deployment)
curl -X POST https://pw-hackathon-zeta.vercel.app/api/analyze \
  -F "vcf_file=@sample_vcf/sample_safe.vcf" \
  -F "drugs=CODEINE,WARFARIN,CLOPIDOGREL,SIMVASTATIN,AZATHIOPRINE,FLUOROURACIL" \
  -F "patient_id=BASELINE_TEST" | \
  python -m json.tool
```

---

## 📁 Project Structure

```
PW_HACKATHON/
├── 📁 backend/                     # FastAPI Python Backend
│   ├── main.py                     # API orchestration layer — /analyze, /chat, /drugs
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Environment variable template
│   ├── test_llm.py                 # LLM service unit test
│   ├── 📁 models/
│   │   └── models.py               # Pydantic models (AnalysisResult, RiskAssessment, etc.)
│   └── 📁 services/
│       ├── vcf_parser.py           # VCF v4.2 parser with 30+ variant DB
│       ├── risk_engine.py          # CPIC Level A drug-gene risk rules
│       └── llm_service.py          # Gemini → Groq → Rule-based fallback
│
├── 📁 frontend/                    # React 19 + TypeScript Frontend
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── 📁 src/
│       ├── App.tsx                 # Main app state & routing
│       ├── types.ts                # TypeScript interfaces matching backend schema
│       ├── index.css               # Global styles + glassmorphism
│       ├── 📁 components/
│       │   ├── Header.tsx          # Navigation + branding
│       │   ├── FileUpload.tsx      # Drag-and-drop VCF uploader w/ validation
│       │   ├── DrugInput.tsx       # Drug name input w/ autocomplete
│       │   ├── ResultsDisplay.tsx  # Color-coded risk cards + expandable details
│       │   ├── GenomeChat.tsx      # Floating AI chatbot interface
│       │   ├── Dashboard.tsx       # Analytics overview + history
│       │   └── AnalysisLoader.tsx  # 4-step animated processing overlay
│       ├── 📁 hooks/
│       │   └── useAnalysis.ts      # API call hook with loading state management
│       ├── 📁 services/
│       │   └── api.ts              # Axios/fetch API client
│       └── 📁 utils/
│           └── exportUtils.ts      # PDF (jsPDF) + JSON export logic
│
├── 📁 sample_vcf/                  # Test VCF files
│   ├── sample_patient.vcf          # Standard mixed-profile patient
│   ├── sample_high_risk.vcf        # High-risk (multiple PM phenotypes)
│   ├── sample_moderate_risk.vcf    # Moderate risk (IM phenotypes)
│   └── sample_safe.vcf             # All normal metabolizers (safe)
│
└── README.md                       # This file
```

---

## 👥 Team Members

| Name |
|---|
| **[Nisha Rathour]** | 
| **[Rudra Pratap Singh]** | 
| **[Ritesh Singh]** |
| **[Sameer Maurya]** | 

> Built for **RIFT 2026 Hackathon** — GenRx (PharmaGuard Problem Statement)  
> Submission hashtags: `#RIFT2026`

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**GenRx — Built with ❤️ for Precision Medicine at RIFT Hackathon 2026**

*Empowering clinicians and patients with the genomic intelligence to make every prescription count.*

[![CPIC](https://img.shields.io/badge/CPIC-Level_A_Compliant-success?style=flat-square)](https://cpicpgx.org)
[![PharmGKB](https://img.shields.io/badge/PharmGKB-Annotated-blue?style=flat-square)](https://www.pharmgkb.org)
[![VCF](https://img.shields.io/badge/VCF-v4.2_Supported-orange?style=flat-square)](https://samtools.github.io/hts-specs/VCFv4.2.pdf)

</div>
