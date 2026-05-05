import { useState, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const STEPS = [
    'Validating VCF file format...',
    'Parsing genomic variants...',
    'Matching pharmacogenomic database...',
    'Building gene-diplotype profiles...',
    'Running CPIC risk assessment...',
    'Generating clinical explanation...',
    'Compiling final report...',
  ];

  const stepRef = useRef(0);

  const analyze = useCallback(async ({ vcfFile, drugs, patientId }: { vcfFile: File, drugs: string, patientId?: string }) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setLoadingStep(0);
    stepRef.current = 0;

    // Simulate loading steps for UX
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        const next = prev < STEPS.length - 1 ? prev + 1 : prev;
        stepRef.current = next;
        return next;
      });
    }, 800); // Slower initial pace for realism

    try {
      const formData = new FormData();
      formData.append('vcf_file', vcfFile);
      formData.append('drugs', drugs);
      if (patientId) formData.append('patient_id', patientId);

      // Analyze Request
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // FAST-FORWARD LOGIC:
      // Rapidly tick through remaining steps to show "completion"
      const startIdx = stepRef.current + 1;
      for (let i = startIdx; i < STEPS.length; i++) {
        setLoadingStep(i);
        // "Tick" speed - fast but perceptible
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Small pause at 100% before showing results
      await new Promise(resolve => setTimeout(resolve, 50));

      // The backend returns a list of results
      setResults(data);
      return data;
    } catch (err: any) {
      clearInterval(stepInterval);

      let friendlyError = err.message;

      // Map common technical errors to user-friendly messages
      if (err.message.includes('404')) {
        friendlyError = "Analysis service unreachable. Please ensure the backend is running.";
      } else if (err.message.includes('500')) {
        friendlyError = "The VCF file could not be parsed. It may be corrupted or use a non-standard format.";
      } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        friendlyError = "Connection failed. Please check your internet or local server.";
      } else if (err.message.includes('Missing columns')) {
        friendlyError = "Invalid VCF structure. Missing required columns (CHROM, POS, ID, REF, ALT).";
      }

      setError(friendlyError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [STEPS.length]);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setLoadingStep(0);
  }, []);

  return { analyze, loading, results, error, loadingStep, STEPS, reset };
}

export async function fetchSupportedDrugs() {
  try {
    const res = await fetch(`${API_BASE}/drugs`);
    const data = await res.json();
    return data.drugs || [];
  } catch {
    return [
      { name: 'CODEINE', primary_gene: 'CYP2D6' },
      { name: 'WARFARIN', primary_gene: 'CYP2C9' },
      { name: 'CLOPIDOGREL', primary_gene: 'CYP2C19' },
      { name: 'SIMVASTATIN', primary_gene: 'SLCO1B1' },
      { name: 'AZATHIOPRINE', primary_gene: 'TPMT' },
      { name: 'FLUOROURACIL', primary_gene: 'DPYD' },
    ];
  }
}
