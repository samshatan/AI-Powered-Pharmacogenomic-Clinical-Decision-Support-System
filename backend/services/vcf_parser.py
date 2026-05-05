"""
PharmaGuard VCF Parser
Parses VCF v4.2 files and detects pharmacogenomic variants
across 6 critical genes: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
"""

import re
from dataclasses import dataclass, field
from typing import Optional


# ─────────────────────────────────────────────────────────────────────────────
# Known pharmacogenomic variant database (rsID → clinical data)
# Based on CPIC guidelines and PharmGKB annotations
# ─────────────────────────────────────────────────────────────────────────────
PHARMACO_VARIANTS_DB = {
    # CYP2D6 — Codeine, Tramadol, Antidepressants
    "rs3892097":  {"gene":"CYP2D6","star":"*4","effect":"loss_of_function","activity":0.0,  "drug_relevance":["CODEINE","TRAMADOL","AMITRIPTYLINE","FLUOXETINE"]},
    "rs35742686": {"gene":"CYP2D6","star":"*3","effect":"loss_of_function","activity":0.0,  "drug_relevance":["CODEINE","TRAMADOL"]},
    "rs5030655":  {"gene":"CYP2D6","star":"*6","effect":"loss_of_function","activity":0.0,  "drug_relevance":["CODEINE"]},
    "rs16947":    {"gene":"CYP2D6","star":"*2","effect":"reduced_function","activity":0.5,  "drug_relevance":["CODEINE","TRAMADOL"]},
    "rs1135840":  {"gene":"CYP2D6","star":"*2","effect":"reduced_function","activity":0.5,  "drug_relevance":["CODEINE"]},
    "rs28371706": {"gene":"CYP2D6","star":"*41","effect":"reduced_function","activity":0.5, "drug_relevance":["CODEINE","TRAMADOL"]},
    "rs1065852":  {"gene":"CYP2D6","star":"*10","effect":"reduced_function","activity":0.5, "drug_relevance":["CODEINE","TRAMADOL"]},

    # CYP2C19 — Clopidogrel, PPIs, Antidepressants
    "rs4244285":  {"gene":"CYP2C19","star":"*2","effect":"loss_of_function","activity":0.0, "drug_relevance":["CLOPIDOGREL","OMEPRAZOLE","ESCITALOPRAM"]},
    "rs4986893":  {"gene":"CYP2C19","star":"*3","effect":"loss_of_function","activity":0.0, "drug_relevance":["CLOPIDOGREL","OMEPRAZOLE"]},
    "rs12248560": {"gene":"CYP2C19","star":"*17","effect":"increased_function","activity":2.0,"drug_relevance":["CLOPIDOGREL","OMEPRAZOLE","ESCITALOPRAM"]},
    "rs28399504": {"gene":"CYP2C19","star":"*4","effect":"loss_of_function","activity":0.0, "drug_relevance":["CLOPIDOGREL"]},
    "rs56337013": {"gene":"CYP2C19","star":"*5","effect":"loss_of_function","activity":0.0, "drug_relevance":["CLOPIDOGREL"]},

    # CYP2C9 — Warfarin, NSAIDs, Phenytoin
    "rs1799853":  {"gene":"CYP2C9","star":"*2","effect":"reduced_function","activity":0.5,  "drug_relevance":["WARFARIN","PHENYTOIN","CELECOXIB"]},
    "rs1057910":  {"gene":"CYP2C9","star":"*3","effect":"reduced_function","activity":0.0,  "drug_relevance":["WARFARIN","PHENYTOIN","CELECOXIB"]},
    "rs28371686": {"gene":"CYP2C9","star":"*5","effect":"reduced_function","activity":0.5,  "drug_relevance":["WARFARIN"]},
    "rs9332131":  {"gene":"CYP2C9","star":"*6","effect":"loss_of_function","activity":0.0,  "drug_relevance":["WARFARIN"]},
    "rs7900194":  {"gene":"CYP2C9","star":"*8","effect":"reduced_function","activity":0.5,  "drug_relevance":["WARFARIN"]},

    # SLCO1B1 — Simvastatin, Atorvastatin, Methotrexate
    "rs4149056":  {"gene":"SLCO1B1","star":"*5","effect":"reduced_function","activity":0.5, "drug_relevance":["SIMVASTATIN","ATORVASTATIN","METHOTREXATE"]},
    "rs2306283":  {"gene":"SLCO1B1","star":"*1B","effect":"normal_function","activity":1.0, "drug_relevance":["SIMVASTATIN","ATORVASTATIN"]},
    "rs11045819": {"gene":"SLCO1B1","star":"*4","effect":"reduced_function","activity":0.5, "drug_relevance":["SIMVASTATIN"]},
    "rs74064213": {"gene":"SLCO1B1","star":"*15","effect":"loss_of_function","activity":0.0,"drug_relevance":["SIMVASTATIN","ATORVASTATIN"]},

    # TPMT — Azathioprine, Mercaptopurine, Thioguanine
    "rs1800460":  {"gene":"TPMT","star":"*3B","effect":"loss_of_function","activity":0.0,   "drug_relevance":["AZATHIOPRINE","MERCAPTOPURINE","THIOGUANINE"]},
    "rs1142345":  {"gene":"TPMT","star":"*3C","effect":"loss_of_function","activity":0.0,   "drug_relevance":["AZATHIOPRINE","MERCAPTOPURINE","THIOGUANINE"]},
    "rs1800462":  {"gene":"TPMT","star":"*2","effect":"loss_of_function","activity":0.0,    "drug_relevance":["AZATHIOPRINE","MERCAPTOPURINE"]},
    "rs72552739": {"gene":"TPMT","star":"*3D","effect":"loss_of_function","activity":0.0,   "drug_relevance":["AZATHIOPRINE"]},

    # DPYD — Fluorouracil, Capecitabine
    "rs3918290":  {"gene":"DPYD","star":"*2A","effect":"loss_of_function","activity":0.0,   "drug_relevance":["FLUOROURACIL","CAPECITABINE"]},
    "rs55886062": {"gene":"DPYD","star":"*13","effect":"loss_of_function","activity":0.0,   "drug_relevance":["FLUOROURACIL","CAPECITABINE"]},
    "rs67376798": {"gene":"DPYD","star":"HapB3","effect":"reduced_function","activity":0.5, "drug_relevance":["FLUOROURACIL","CAPECITABINE"]},
    "rs75017182": {"gene":"DPYD","star":"HapB3","effect":"reduced_function","activity":0.5, "drug_relevance":["FLUOROURACIL"]},
}

# Gene → chromosome positions for targeted lookup
GENE_CHROMOSOMES = {
    "CYP2D6":  "chr22",
    "CYP2C19": "chr10",
    "CYP2C9":  "chr10",
    "SLCO1B1": "chr12",
    "TPMT":    "chr6",
    "DPYD":    "chr1",
}

# Phenotype determination rules per gene
def determine_phenotype(gene: str, activity_score: float, variant_count: int) -> str:
    """Convert activity score to CPIC phenotype classification."""
    if gene in ("CYP2D6", "CYP2C19", "CYP2C9"):
        if activity_score == 0:
            return "PM"    # Poor Metabolizer
        elif 0 < activity_score <= 0.5:
            return "IM"    # Intermediate Metabolizer
        elif 0.5 < activity_score <= 1.5:
            return "NM"    # Normal Metabolizer
        elif activity_score > 1.5:
            return "URM"   # Ultrarapid Metabolizer
    elif gene == "SLCO1B1":
        if activity_score == 0:
            return "PM"
        elif activity_score <= 0.5:
            return "IM"
        else:
            return "NM"
    elif gene in ("TPMT", "DPYD"):
        if activity_score == 0:
            return "PM"
        elif activity_score <= 0.5:
            return "IM"
        else:
            return "NM"
    return "Unknown"


@dataclass
class VCFVariant:
    chrom: str
    pos: int
    rsid: str
    ref: str
    alt: str
    qual: str
    filter_status: str
    genotype: str
    gene: str = ""
    star_allele: str = ""
    effect: str = ""
    activity: float = 1.0
    drug_relevance: list = field(default_factory=list)
    zygosity: str = "heterozygous"


@dataclass
class GeneProfile:
    gene: str
    variants: list
    diplotype: str
    phenotype: str
    activity_score: float
    star_alleles: list


@dataclass
class ParseResult:
    patient_id: str
    sample_count: int
    total_variants: int
    pharmaco_variants: list
    gene_profiles: dict
    parsing_errors: list
    vcf_version: str
    success: bool


def parse_genotype(gt_string: str) -> tuple:
    """Parse GT field like '0/1', '1/1', '0|1' into allele counts."""
    if not gt_string or gt_string in ("./.", "."):
        return (0, 0), "unknown"
    
    sep = "|" if "|" in gt_string else "/"
    parts = gt_string.split(sep)[0:2]  # only take first sample's GT
    
    try:
        alleles = tuple(int(p) for p in parts if p != ".")
    except ValueError:
        return (0, 0), "unknown"
    
    if len(alleles) == 2:
        if alleles[0] == alleles[1] and alleles[0] != 0:
            return alleles, "homozygous_alt"
        elif 0 in alleles and alleles[0] != alleles[1]:
            return alleles, "heterozygous"
        elif alleles == (0, 0):
            return alleles, "homozygous_ref"
    return alleles, "heterozygous"


def extract_info_field(info_str: str, field_name: str) -> Optional[str]:
    """Extract a specific field from VCF INFO column."""
    pattern = rf'{field_name}=([^;]+)'
    match = re.search(pattern, info_str)
    return match.group(1) if match else None


def parse_vcf(file_content: str) -> ParseResult:
    """
    Main VCF parser. Handles:
    - Standard VCF v4.2 format
    - INFO tags: GENE, STAR, RS, ANN
    - Genotype (GT) field
    - Both rsID-based and position-based variant detection
    """
    errors = []
    pharmaco_variants = []
    vcf_version = "unknown"
    patient_id = "PATIENT_001"
    sample_count = 0
    total_variants = 0
    header_cols = []

    lines = file_content.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Meta lines
        if line.startswith("##"):
            if line.startswith("##fileformat="):
                vcf_version = line.split("=")[1]
            continue

        # Header line
        if line.startswith("#CHROM"):
            header_cols = line.lstrip("#").split("\t")
            # Samples are columns after FORMAT
            if "FORMAT" in header_cols:
                fmt_idx = header_cols.index("FORMAT")
                sample_cols = header_cols[fmt_idx+1:]
                sample_count = len(sample_cols)
                # Use first sample name as patient_id if it's not generic
                if sample_cols and sample_cols[0] not in ("SAMPLE", "sample", "NA12878"):
                    patient_id = sample_cols[0]
            continue

        # Data lines
        parts = line.split("\t")
        if len(parts) < 8:
            continue

        total_variants += 1

        chrom = parts[0]
        pos_str = parts[1]
        rsid = parts[2]
        ref = parts[3]
        alt = parts[4]
        qual = parts[5]
        filter_status = parts[6]
        info_str = parts[7] if len(parts) > 7 else ""

        try:
            pos = int(pos_str)
        except ValueError:
            errors.append(f"Invalid position '{pos_str}' at line with rsid={rsid}")
            continue

        # Parse genotype if FORMAT column exists
        genotype = "."
        zygosity = "unknown"
        if len(parts) > 9 and len(header_cols) > 9:
            format_str = parts[8]
            sample_str = parts[9]
            fmt_fields = format_str.split(":")
            smp_fields = sample_str.split(":")
            if "GT" in fmt_fields:
                gt_idx = fmt_fields.index("GT")
                if gt_idx < len(smp_fields):
                    gt_val = smp_fields[gt_idx]
                    alleles, zygosity = parse_genotype(gt_val)
                    genotype = gt_val

        # Try to identify pharmacogenomic relevance
        variant_data = None

        # Method 1: Direct rsID lookup
        rsid_clean = rsid.lower().replace("rs", "rs")
        if rsid in PHARMACO_VARIANTS_DB:
            variant_data = PHARMACO_VARIANTS_DB[rsid].copy()

        # Method 2: INFO field annotations (GENE, STAR, RS tags)
        if not variant_data:
            info_gene = extract_info_field(info_str, "GENE")
            info_star = extract_info_field(info_str, "STAR")
            info_rs   = extract_info_field(info_str, "RS")
            
            if info_rs and f"rs{info_rs}" in PHARMACO_VARIANTS_DB:
                variant_data = PHARMACO_VARIANTS_DB[f"rs{info_rs}"].copy()
                if not rsid or rsid == ".":
                    rsid = f"rs{info_rs}"
            elif info_gene and info_star:
                # Partial match from annotations
                variant_data = {
                    "gene": info_gene,
                    "star": info_star,
                    "effect": "unknown",
                    "activity": 1.0,
                    "drug_relevance": []
                }

        # Method 3: Check ANN field (SnpEff annotations)
        if not variant_data:
            ann = extract_info_field(info_str, "ANN")
            if ann:
                for known_gene in GENE_CHROMOSOMES.keys():
                    if known_gene in ann:
                        variant_data = {
                            "gene": known_gene,
                            "star": "unknown",
                            "effect": "unknown",
                            "activity": 1.0,
                            "drug_relevance": []
                        }
                        break

        if variant_data:
            # Adjust activity score for homozygous (both alleles affected)
            activity = variant_data.get("activity", 1.0)
            if zygosity == "homozygous_alt":
                # Both alleles non-functional → double the impact
                pass  # activity already reflects per-allele; diplotype handles totals
            
            vcf_var = VCFVariant(
                chrom=chrom,
                pos=pos,
                rsid=rsid if rsid != "." else f"chr{chrom}:{pos}",
                ref=ref,
                alt=alt,
                qual=qual,
                filter_status=filter_status,
                genotype=genotype,
                gene=variant_data.get("gene",""),
                star_allele=variant_data.get("star",""),
                effect=variant_data.get("effect","unknown"),
                activity=activity,
                drug_relevance=variant_data.get("drug_relevance",[]),
                zygosity=zygosity,
            )
            pharmaco_variants.append(vcf_var)

    # Build per-gene profiles
    gene_profiles = build_gene_profiles(pharmaco_variants)

    # Strict v4.2 check (Requirement #1)
    is_v42 = "4.2" in vcf_version
    if not is_v42:
        errors.append(f"Unsupported VCF version: {vcf_version}. Only v4.2 is officially supported.")

    return ParseResult(
        patient_id=patient_id,
        sample_count=max(sample_count, 1),
        total_variants=total_variants,
        pharmaco_variants=pharmaco_variants,
        gene_profiles=gene_profiles,
        parsing_errors=errors,
        vcf_version=vcf_version,
        success=total_variants > 0 and is_v42,
    )


def build_gene_profiles(variants: list) -> dict:
    """Build diplotype and phenotype per gene from detected variants."""
    gene_variants = {}
    for v in variants:
        gene_variants.setdefault(v.gene, []).append(v)

    profiles = {}
    for gene, var_list in gene_variants.items():
        # Calculate total activity score (diplotype)
        # Assume each variant contributes one allele
        star_alleles = [v.star_allele for v in var_list if v.star_allele and v.star_allele != "unknown"]
        
        # Estimate activity: each detected loss-of-function reduces score
        total_activity = 2.0  # start with 2 normal alleles (1.0 each)
        for v in var_list:
            if v.effect == "loss_of_function":
                if v.zygosity == "homozygous_alt":
                    total_activity -= 2.0
                else:
                    total_activity -= 1.0
            elif v.effect == "reduced_function":
                if v.zygosity == "homozygous_alt":
                    total_activity -= 1.0
                else:
                    total_activity -= 0.5
            elif v.effect == "increased_function":
                total_activity += 0.5
        
        total_activity = max(0, total_activity)

        # Build diplotype string
        unique_stars = list(dict.fromkeys(star_alleles))
        if not unique_stars:
            diplotype = "*1/*1"
        elif len(unique_stars) == 1:
            v = var_list[0]
            if v.zygosity == "homozygous_alt":
                diplotype = f"{unique_stars[0]}/{unique_stars[0]}"
            else:
                diplotype = f"*1/{unique_stars[0]}"
        else:
            diplotype = f"{unique_stars[0]}/{unique_stars[1]}"

        phenotype = determine_phenotype(gene, total_activity, len(var_list))

        profiles[gene] = GeneProfile(
            gene=gene,
            variants=var_list,
            diplotype=diplotype,
            phenotype=phenotype,
            activity_score=total_activity,
            star_alleles=unique_stars,
        )

    return profiles
