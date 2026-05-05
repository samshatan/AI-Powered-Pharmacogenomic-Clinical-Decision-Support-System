import React, { useState } from 'react';
import { Dna, Activity, Menu, X, ChevronRight, LayoutDashboard, Microscope, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentView: 'analysis' | 'dashboard';
  setCurrentView: (view: 'analysis' | 'dashboard') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleNav = (view: 'analysis' | 'dashboard') => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="glass-card sticky top-0 z-[100] border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div
            className="flex items-center gap-3 sm:gap-4 group cursor-pointer"
            onClick={() => handleNav('analysis')}
          >
            <div className="bg-teal-600 p-2 sm:p-2.5 rounded-xl shadow-lg shadow-teal-600/20 transform group-hover:rotate-12 transition-transform duration-300">
              <Dna className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl sm:text-2xl text-slate-900 leading-tight tracking-tight">
                Gen<span className="text-teal-600">Rx</span>
                <span className="ml-0.5 text-slate-400 font-medium text-lg">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 w-fit px-1.5 py-0.5 rounded mt-0.5">
                Genetics + Prescription
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200 shadow-inner">
              <button
                onClick={() => handleNav('analysis')}
                className={`px-4 py-2 text-xs font-black uppercase tracking-tight rounded-xl transition-all ${currentView === 'analysis' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Diagnostic
              </button>
              <button
                onClick={() => handleNav('dashboard')}
                className={`px-4 py-2 text-xs font-black uppercase tracking-tight rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dashboard
              </button>
            </nav>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-black border border-emerald-100 shadow-sm">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              <span>API ONLINE</span>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all border border-transparent hover:border-teal-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[90] md:hidden transition-all duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleMenu}
      />

      {/* Mobile Sidebar Content */}
      <div className={`fixed top-0 right-0 h-full w-[320px] bg-white/95 backdrop-blur-3xl z-[100] md:hidden shadow-[-20px_0_60px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border-l border-white/20 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full invisible'}`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/20 blur-3xl rounded-full -mr-20 -mt-20 anim-pulse"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-teal-500 p-2.5 rounded-2xl shadow-xl shadow-teal-500/30">
                  <Dna className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tight leading-none uppercase">Gen<span className="text-teal-400">Rx</span></span>
                  <span className="text-[10px] font-black text-teal-300/60 uppercase tracking-[0.2em] mt-1">v1.1 RIFT Edition</span>
                </div>
              </div>
              <button onClick={toggleMenu} className="p-2.5 bg-white/10 hover:bg-teal-500 rounded-xl transition-all shadow-inner active:scale-90">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 flex-grow space-y-3 overflow-y-auto">
            <p className="px-4 py-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Core Navigation</p>

            <button
              onClick={() => handleNav('analysis')}
              className={`w-full flex items-center justify-between p-5 rounded-[2rem] transition-all duration-300 group ${currentView === 'analysis' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40 translate-x-1' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-2xl ${currentView === 'analysis' ? 'bg-teal-500 text-white shadow-lg' : 'bg-teal-50 text-teal-600'}`}>
                  <Microscope className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-black tracking-tight text-sm uppercase">Diagnostic</span>
                  <span className={`text-[10px] font-bold opacity-60 ${currentView === 'analysis' ? 'text-teal-100' : 'text-slate-400'}`}>Genomic Mapping</span>
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform duration-500 ${currentView === 'analysis' ? 'translate-x-1 text-teal-400' : 'opacity-20'}`} />
            </button>

            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center justify-between p-5 rounded-[2rem] transition-all duration-300 group ${currentView === 'dashboard' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40 translate-x-1' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-2xl ${currentView === 'dashboard' ? 'bg-teal-500 text-white shadow-lg' : 'bg-teal-50 text-teal-600'}`}>
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-black tracking-tight text-sm uppercase">Dashboard</span>
                  <span className={`text-[10px] font-bold opacity-60 ${currentView === 'dashboard' ? 'text-teal-100' : 'text-slate-400'}`}>Clinical Overview</span>
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform duration-500 ${currentView === 'dashboard' ? 'translate-x-1 text-teal-400' : 'opacity-20'}`} />
            </button>

            <div className="mt-10 px-4 py-8 border-t border-slate-100 flex flex-col gap-6">
              <div className="space-y-4 text-left">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Medical Integrity</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm group hover:scale-[1.02] transition-transform">
                    <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-emerald-900 uppercase tracking-tight">CPIC v4.2 Guidelines</span>
                      <span className="text-[10px] font-bold text-emerald-600/80">Certified Reference</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm group hover:scale-[1.02] transition-transform">
                    <div className="bg-purple-500 p-2 rounded-lg shadow-lg shadow-purple-500/20">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-purple-900 uppercase tracking-tight">Neural Engine Active</span>
                      <span className="text-[10px] font-bold text-purple-600/80">Gemini 1.5 Flash</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-8 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                <div className="w-3 h-3 bg-emerald-500 rounded-full relative shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em]">Clinical Status</span>
                <span className="text-[10px] font-black text-emerald-600">ENCRYPTION ACTIVE</span>
              </div>
            </div>
            <p className="mt-6 text-[10px] text-slate-400 font-black text-center uppercase tracking-[0.2em] opacity-40">
              © 2026 GenRx AI • RIFT
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};