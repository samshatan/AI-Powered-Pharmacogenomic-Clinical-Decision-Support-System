import { AnalysisResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const analyzePharmacogenomics = async (
  vcfFile: File,
  drugs: string,
  patientId?: string
): Promise<AnalysisResult[]> => {
  const formData = new FormData();
  formData.append('vcf_file', vcfFile);
  formData.append('drugs', drugs);
  if (patientId) {
    formData.append('patient_id', patientId);
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Analysis failed');
  }

  return response.json();
};

export const chatGenome = async (
  query: string,
  context: AnalysisResult[]
): Promise<{ response: string; suggested_follow_ups: string[] }> => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, context }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Chat failed');
  }

  return response.json();
};
