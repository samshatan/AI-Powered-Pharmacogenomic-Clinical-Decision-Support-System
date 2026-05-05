import React, { useEffect, useState } from 'react';

interface AnalysisLoaderProps {
  currentStep: number;
  steps: string[];
}

export const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({ currentStep, steps }) => {
  const [dots, setDots] = useState('');

  // Animated dots for "Running..." text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const progressPct = Math.min(100, Math.round(((currentStep + 1) / steps.length) * 100));

  // Map the string steps from useAnalysis to icons for the UI
  const getIconForStep = (index: number) => {
    const icons = ['📄', '🧬', '🔍', '🧩', '⚠️', '🤖', '📋'];
    return icons[index % icons.length];
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-8 animate-fade-in w-full max-w-lg mx-auto">

      {/* DNA spinner */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-teal-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 animate-spin" />
        <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-blue-500 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🧬</div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analyzing Genome</h3>
        <p className="text-sm text-slate-500 font-medium">CPIC-aligned pharmacogenomic assessment in progress</p>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
          <span>Analysis Progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-teal-400 via-teal-500 to-blue-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite] -skew-x-12 transform translate-x-full"></div>
          </div>
        </div>
      </div>

      {/* Steps list - Contextual Window */}
      <div className="w-full space-y-2 bg-white/50 rounded-2xl p-4 border border-white/60 shadow-sm backdrop-blur-sm">
        {steps.map((stepLabel, i) => {
          // Logic: Show current step, one before, and one after (context window) or all if screen allows?
          // For now, let's show all but styling indicates status.

          const isDone = i < currentStep;
          const isActive = i === currentStep;

          // Optimization: On mobile, maybe only show active + 1 previous? 
          // Let's keep it simple first as requested.

          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${isDone
                  ? 'bg-teal-50/50 border-teal-100/50'
                  : isActive
                    ? 'bg-white border-blue-200 shadow-md scale-[1.02]'
                    : 'bg-transparent border-transparent opacity-30 blur-[0.5px]'
                }`}
            >
              {/* Status icon */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${isDone ? 'bg-teal-500' :
                  isActive ? 'bg-blue-500 shadow-lg shadow-blue-500/30' :
                    'bg-slate-200'
                }`}>
                {isDone ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                )}
              </div>

              <span className={`text-xs font-bold transition-colors duration-300 ${isDone ? 'text-teal-700' :
                  isActive ? 'text-slate-900' :
                    'text-slate-400'
                }`}>
                {getIconForStep(i)} {stepLabel}
              </span>

              {isActive && (
                <span className="ml-auto text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  Processing{dots}
                </span>
              )}
              {isDone && (
                <span className="ml-auto text-[10px] font-black text-teal-500 uppercase tracking-widest">
                  Complete
                </span>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
