import React from 'react';
import { Pill } from 'lucide-react';
import { EXAMPLE_DRUGS } from '../types';

interface DrugInputProps {
  drug: string;
  setDrug: (drug: string) => void;
}

export const DrugInput: React.FC<DrugInputProps> = ({ drug, setDrug }) => {
  return (
    <div className="w-full space-y-3">
      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
        Medication Targets
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Pill className="h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
        </div>
        <input
          type="text"
          value={drug}
          onChange={(e) => setDrug(e.target.value)}
          placeholder="e.g. Warfarin, Clopidogrel..."
          className="pl-12 block w-full rounded-2xl border border-slate-200 bg-white/50 py-4 text-slate-900 font-bold shadow-inner focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 sm:text-sm transition-all outline-none"
        />
      </div>

      <div className="pt-2">
        <p className="text-[10px] text-slate-400 mb-3 font-black uppercase tracking-tight ml-1">Clinical Reference Panel</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_DRUGS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                const currentDrugs = drug.split(',').map(item => item.trim()).filter(item => item.length > 0);
                if (currentDrugs.includes(d)) {
                  // Remove the drug if it's already selected
                  setDrug(currentDrugs.filter(item => item !== d).join(', '));
                } else {
                  // Add the drug if it's not selected
                  setDrug(currentDrugs.length > 0 ? `${currentDrugs.join(', ')}, ${d}` : d);
                }
              }}
              className={`
                px-3 py-1.5 rounded-xl text-[11px] font-black tracking-tight transition-all border shadow-sm
                ${drug.toUpperCase().includes(d.toUpperCase())
                  ? 'bg-slate-900 text-white border-slate-900 scale-105'
                  : 'bg-white/80 text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-700 hover:-translate-y-0.5'}
              `}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};