from services.llm_service import generate_explanation

sample_data = {
    "gene": "CYP2D6",
    "diplotype": "*4/*4",
    "phenotype": "PM",
    "drug": "CODEINE",
    "risk": "Ineffective",
    "variants": ["rs3892097"]
}

result = generate_explanation(sample_data)
print(result)
