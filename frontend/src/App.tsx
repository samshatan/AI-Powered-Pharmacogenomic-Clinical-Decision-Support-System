import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { DrugInput } from './components/DrugInput';
import { Dashboard } from './components/Dashboard';
import { ResultsDisplay } from './components/ResultsDisplay';

import { AnalysisLoader } from './components/AnalysisLoader';
import { useAnalysis } from './hooks/useAnalysis';
import { generatePDFReport, exportJSON } from './utils/exportUtils';
import {
  ArrowRight, Loader2, Sparkles, ShieldCheck, Zap,
  FileJson, AlertTriangle, Download, FileText, RefreshCcw
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'analysis' | 'dashboard'>('analysis');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [drug, setDrug] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');
  const [latestResult, setLatestResult] = useState<any>(null);

  const {
    analyze,
    loading,
    results,
    error,
    loadingStep,
    STEPS,
    reset
  } = useAnalysis();

  const handleAnalysis = async () => {
    if (!file || !drug) return;

    try {
      const analysisResults = await analyze({
        vcfFile: file,
        drugs: drug,
        patientId: patientId || undefined
      });
      // Update dashboard state
      setLatestResult({ results: analysisResults });
    } catch (err) {
      // Error is handled by the hook
      console.error("Analysis failed:", err);
    }
  };

  const handleNewAnalysis = () => {
    reset();
    setFile(null);
    setDrug('');
    setPatientId('');
    setView('analysis');
  };

  const handleExportPDF = () => {
    if (results) {
      generatePDFReport(results, patientId || results[0].patient_id);
    }
  };

  const handleExportJSON = () => {
    if (results) {
      exportJSON(results, patientId || results[0].patient_id);
    }
  };

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    if (!newFile) {
      // Reset targets when file is removed
      setPatientId('');
      setDrug('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header currentView={view} setCurrentView={setView} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 space-y-8 md:space-y-12 overflow-x-hidden">
        {view === 'analysis' ? (
          <>
            {/* Intro / Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4 md:space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Sparkles className="w-3 h-3" />
                Vanguard Pharmacogenomics v1.1
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[0.95] md:leading-[0.9]">
                Precision Medicine <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">Powered by AI</span>
              </h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                PharmaGuard analyzes patient genomic variants against CPIC guidelines to provide personalized medication safety insights.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Input Panel */}
              <div className="lg:col-span-4 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="glass-card rounded-3xl p-8 border border-white/50 relative overflow-hidden shadow-2xl shadow-teal-900/5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>

                  <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <div className="bg-slate-900 p-1.5 rounded-lg shadow-lg">
                      <Zap className="w-4 h-4 text-teal-400" />
                    </div>
                    Clinical Config
                  </h2>

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Identifier (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. PATIENT_772"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      />
                    </div>

                    <FileUpload
                      file={file}
                      setFile={handleFileChange}
                      error={fileError}
                      setError={setFileError}
                    />

                    <DrugInput
                      drug={drug}
                      setDrug={setDrug}
                    />

                    <button
                      onClick={handleAnalysis}
                      disabled={!file || !drug || loading || !!fileError}
                      className={`
                        w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-sm font-black transition-all group
                        ${!file || !drug || loading || !!fileError
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl shadow-slate-900/10 hover:shadow-teal-600/20 transform hover:-translate-y-1 active:scale-95'}
                      `}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing Sequence...
                        </>
                      ) : (
                        <>
                          Generate Clinical Report
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    {/* Loader Removed from Inline Flow */}

                    {error && (
                      <div className="p-4 bg-rose-50 text-rose-700 text-[13px] font-bold rounded-2xl border border-rose-100 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="font-black uppercase text-[10px] mb-1 text-left">Upload Error</p>
                          <p className="text-left">{error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="glass-card p-5 rounded-2xl border border-white/50 flex items-center gap-4 group hover:bg-white/60 transition-colors shadow-sm">
                    <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-[13px] text-slate-950 uppercase tracking-tight">CPIC v4.2 Certified</h3>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">Ruleset updated for 2024 standardized dosing.</p>
                    </div>
                  </div>
                  <div className="glass-card p-5 rounded-2xl border border-white/50 flex items-center gap-4 group hover:bg-white/60 transition-colors shadow-sm">
                    <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-[13px] text-slate-950 uppercase tracking-tight">VCF Neural Parser</h3>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">Gemini 1.5 Flash handles multi-GB files in seconds.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-8 space-y-8">
                {results ? (
                  <>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 glass-card p-4 sm:p-5 rounded-3xl border border-white/50 animate-fade-in shadow-xl shadow-slate-200/50">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-950 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-lg">
                          {results.length}
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Identified Risk Profiles</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <button
                          onClick={handleExportPDF}
                          className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 text-[11px] font-black text-white bg-teal-600 hover:bg-teal-700 transition-all px-5 py-2.5 rounded-xl shadow-lg shadow-teal-600/20 active:scale-95"
                        >
                          <FileText className="w-4 h-4" />
                          PDF REPORT
                        </button>
                        <button
                          onClick={handleExportJSON}
                          className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 text-[11px] font-black text-slate-600 hover:text-slate-900 transition-colors bg-white hover:bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200 active:scale-95"
                        >
                          <FileJson className="w-4 h-4" />
                          JSON REPORT
                        </button>
                        <button
                          onClick={handleNewAnalysis}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-auto sm:ml-0 active:rotate-180 duration-500"
                          title="New Analysis"
                        >
                          <RefreshCcw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {results.map((res: any, index: number) => (
                      <ResultsDisplay key={`${res.drug}-${index}`} result={res} />
                    ))}
                  </>
                ) : (
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-card rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center animate-fade-in group">
                    <div className="bg-white/50 p-8 rounded-full mb-6 shadow-xl shadow-slate-200/50 group-hover:scale-110 transition-transform duration-500">
                      <ActivityPlaceholder className="w-16 h-16 text-slate-300 group-hover:text-teal-500 transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Awaiting Diagnostic Input</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                      Upload a clinical VCF sample and enter target drugs to initiate AI-powered genomic mapping and CPIC risk assessment.
                    </p>
                    <div className="mt-8 flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <Dashboard
            latestResult={latestResult}
            onNewAnalysis={() => setView('analysis')}
          />
        )}
      </main>



      <footer className="bg-white/30 backdrop-blur-md border-t border-white/20 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center gap-6 text-slate-400 grayscale hover:grayscale-0 transition-all opacity-50">
            <span className="font-black text-xs tracking-tighter">CPIC v4.2</span>
            <span className="font-black text-xs tracking-tighter">PHARMGKB</span>
            <span className="font-black text-xs tracking-tighter">NCBI CLINVAR</span>
          </div>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
            &copy; 2024 PharmaGuard AI • Clinical Decision Support System • RIFT 2026
          </p>
        </div>
      </footer>

      {/* Analysis Overlay Loader */}
      {loading && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white/95 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/40">
            <div className="relative">
              {/* Optional: Close/Cancel could go here, but usually locking is safer for async */}
              <AnalysisLoader currentStep={loadingStep} steps={STEPS} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function ActivityPlaceholder({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export default App;