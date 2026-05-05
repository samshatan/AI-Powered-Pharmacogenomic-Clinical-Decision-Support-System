import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, FileText, AlertCircle, PieChart, Activity,
  TrendingUp, Clock, Zap, RefreshCw, Download, ChevronRight,
  AlertTriangle, CheckCircle, XCircle, HelpCircle, Cpu
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const GENES = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'SLCO1B1', 'TPMT', 'DPYD'];
const PHENOTYPES = ['PM', 'IM', 'NM', 'RM', 'URM'];

const PHENOTYPE_COLORS = {
  PM: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-200', hex: '#f43f5e' },
  IM: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200', hex: '#f59e0b' },
  NM: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', hex: '#10b981' },
  RM: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200', hex: '#3b82f6' },
  URM: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-200', hex: '#8b5cf6' },
};

const RISK_CONFIG = {
  Safe: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Adjust Dosage': { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  Toxic: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
  Ineffective: { icon: XCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
  Unknown: { icon: HelpCircle, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
};

// Heatmap: gene × phenotype → typical risk
const HEATMAP_DATA = {
  CYP2D6: { PM: 'Toxic', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Toxic' },
  CYP2C19: { PM: 'Ineffective', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Adjust Dosage' },
  CYP2C9: { PM: 'Adjust Dosage', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Safe' },
  SLCO1B1: { PM: 'Toxic', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Safe' },
  TPMT: { PM: 'Toxic', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Safe' },
  DPYD: { PM: 'Toxic', IM: 'Adjust Dosage', NM: 'Safe', RM: 'Safe', URM: 'Safe' },
};

// What-if: gene × phenotype → recommendation
const WHATIF_RECOMMENDATIONS = {
  CYP2D6: {
    PM: { drug: 'Codeine', label: 'Toxic', action: 'Ultrarapid conversion to morphine → respiratory depression risk. Use acetaminophen instead.', dose: '0%' },
    IM: { drug: 'Codeine', label: 'Adjust Dosage', action: 'Reduced metabolism. Use 75% of standard dose and monitor pain control.', dose: '75%' },
    NM: { drug: 'Codeine', label: 'Safe', action: 'Standard dosing. Normal analgesic response expected.', dose: '100%' },
    RM: { drug: 'Codeine', label: 'Safe', action: 'Standard dosing appropriate. Monitor response.', dose: '100%' },
    URM: { drug: 'Codeine', label: 'Toxic', action: 'CONTRAINDICATED. Fatal opioid toxicity risk. Use non-opioid analgesic.', dose: '0%' },
  },
  CYP2C19: {
    PM: { drug: 'Clopidogrel', label: 'Ineffective', action: 'Cannot activate prodrug. No antiplatelet effect. Use prasugrel or ticagrelor.', dose: '0%' },
    IM: { drug: 'Clopidogrel', label: 'Adjust Dosage', action: 'Reduced activation. Consider alternative or higher dose with monitoring.', dose: '150%' },
    NM: { drug: 'Clopidogrel', label: 'Safe', action: 'Standard 75mg/day. Normal antiplatelet response.', dose: '100%' },
    RM: { drug: 'Clopidogrel', label: 'Safe', action: 'Standard dosing. No adjustment needed.', dose: '100%' },
    URM: { drug: 'Clopidogrel', label: 'Adjust Dosage', action: 'Possible increased platelet inhibition. Monitor for bleeding.', dose: '75%' },
  },
  CYP2C9: {
    PM: { drug: 'Warfarin', label: 'Adjust Dosage', action: 'Reduce initial dose 50-60%. Weekly INR monitoring. High bleeding risk.', dose: '40%' },
    IM: { drug: 'Warfarin', label: 'Adjust Dosage', action: 'Reduce initial dose 25-35%. Bi-weekly INR monitoring.', dose: '65%' },
    NM: { drug: 'Warfarin', label: 'Safe', action: 'Standard dosing. Routine INR monitoring every 4 weeks.', dose: '100%' },
    RM: { drug: 'Warfarin', label: 'Safe', action: 'Standard dosing applies. Monitor INR.', dose: '100%' },
    URM: { drug: 'Warfarin', label: 'Safe', action: 'Standard dosing. Monitor INR per protocol.', dose: '100%' },
  },
  SLCO1B1: {
    PM: { drug: 'Simvastatin', label: 'Toxic', action: 'High myopathy/rhabdomyolysis risk. Use rosuvastatin or pravastatin instead.', dose: '0%' },
    IM: { drug: 'Simvastatin', label: 'Adjust Dosage', action: 'Limit to 20mg/day max. Monitor CK every 3 months.', dose: '50%' },
    NM: { drug: 'Simvastatin', label: 'Safe', action: 'Standard dosing up to 40mg/day. Routine monitoring.', dose: '100%' },
    RM: { drug: 'Simvastatin', label: 'Safe', action: 'Standard dosing. No adjustment required.', dose: '100%' },
    URM: { drug: 'Simvastatin', label: 'Safe', action: 'Standard dosing. No adjustment required.', dose: '100%' },
  },
  TPMT: {
    PM: { drug: 'Azathioprine', label: 'Toxic', action: 'Life-threatening myelosuppression. Reduce dose 90% or use mycophenolate.', dose: '10%' },
    IM: { drug: 'Azathioprine', label: 'Adjust Dosage', action: 'Reduce dose 30-70%. Weekly CBC for 8 weeks.', dose: '50%' },
    NM: { drug: 'Azathioprine', label: 'Safe', action: 'Standard weight-based dosing (2-3mg/kg/day). Monthly CBC.', dose: '100%' },
    RM: { drug: 'Azathioprine', label: 'Safe', action: 'Standard dosing. Monitor response.', dose: '100%' },
    URM: { drug: 'Azathioprine', label: 'Safe', action: 'Standard dosing. Monitor for reduced efficacy.', dose: '100%' },
  },
  DPYD: {
    PM: { drug: 'Fluorouracil', label: 'Toxic', action: 'FATAL TOXICITY RISK. Cannot clear 5-FU. Use alternative chemotherapy regimen.', dose: '0%' },
    IM: { drug: 'Fluorouracil', label: 'Adjust Dosage', action: 'Reduce starting dose 50%. TDM recommended. Monitor GI toxicity closely.', dose: '50%' },
    NM: { drug: 'Fluorouracil', label: 'Safe', action: 'Standard oncology protocol dosing. Routine toxicity monitoring.', dose: '100%' },
    RM: { drug: 'Fluorouracil', label: 'Safe', action: 'Standard dosing. Monitor tumor response.', dose: '100%' },
    URM: { drug: 'Fluorouracil', label: 'Safe', action: 'Standard dosing. Possible reduced efficacy.', dose: '100%' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL HISTORY HOOK (persists analyses in localStorage)
// ─────────────────────────────────────────────────────────────────────────────

function useAnalysisHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('pharmaguard_history');
      return stored ? JSON.parse(stored) : getDefaultHistory();
    } catch {
      return getDefaultHistory();
    }
  });

  const addEntry = useCallback((result) => {
    const entry = {
      id: `PGX-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: result.patient_id || 'UNKNOWN',
      gene: result.pharmacogenomic_profile?.primary_gene || 'N/A',
      drug: result.drug || 'N/A',
      severity: result.risk_assessment?.severity || 'none',
      riskLabel: result.risk_assessment?.risk_label || 'Unknown',
      phenotype: result.pharmacogenomic_profile?.phenotype || 'N/A',
      confidence: result.risk_assessment?.confidence_score || 0,
      date: result.timestamp || new Date().toISOString(),
    };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 50); // keep last 50
      try { localStorage.setItem('pharmaguard_history', JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory(getDefaultHistory());
    try { localStorage.removeItem('pharmaguard_history'); } catch { }
  }, []);

  return { history, addEntry, clearHistory };
}

function getDefaultHistory() {
  return [
    { id: 'PGX-4829', patientId: 'DEMO_001', gene: 'CYP2C19', drug: 'Clopidogrel', severity: 'high', riskLabel: 'Ineffective', phenotype: 'PM', confidence: 0.94, date: new Date(Date.now() - 2 * 60000).toISOString() },
    { id: 'PGX-4828', patientId: 'DEMO_002', gene: 'CYP2D6', drug: 'Codeine', severity: 'critical', riskLabel: 'Toxic', phenotype: 'URM', confidence: 0.91, date: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'PGX-4827', patientId: 'DEMO_003', gene: 'SLCO1B1', drug: 'Simvastatin', severity: 'none', riskLabel: 'Safe', phenotype: 'NM', confidence: 0.88, date: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: 'PGX-4826', patientId: 'DEMO_004', gene: 'CYP2C9', drug: 'Warfarin', severity: 'high', riskLabel: 'Adjust Dosage', phenotype: 'PM', confidence: 0.96, date: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: 'PGX-4825', patientId: 'DEMO_005', gene: 'TPMT', drug: 'Azathioprine', severity: 'critical', riskLabel: 'Toxic', phenotype: 'PM', confidence: 0.97, date: new Date(Date.now() - 5 * 3600000).toISOString() },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// 1. CRITICAL ALERT BANNER
function CriticalAlertBanner({ history }) {
  const criticals = history.filter(h => h.severity === 'critical' &&
    new Date(h.date) > new Date(Date.now() - 30 * 60000));

  if (criticals.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-4 animate-pulse-border">
      {/* Animated left bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-l-2xl" />

      <div className="ml-3 flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 shrink-0">
        <AlertTriangle className="w-5 h-5 text-rose-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-rose-800 tracking-tight">
          ⚠ {criticals.length} CRITICAL RISK {criticals.length === 1 ? 'CASE' : 'CASES'} in last 30 minutes
        </p>
        <p className="text-xs text-rose-600 font-medium truncate">
          {criticals.map(c => `${c.id} — ${c.drug} (${c.gene})`).join('  ·  ')}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
        </span>
        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Live</span>
      </div>
    </div>
  );
}

// 2. SVG DONUT CHART
function DonutChart({ history }) {
  const counts = { critical: 0, high: 0, moderate: 0, low: 0, none: 0 };
  history.forEach(h => { counts[h.severity] = (counts[h.severity] || 0) + 1; });
  const total = history.length || 1;

  const segments = [
    { key: 'critical', label: 'Critical', color: '#f43f5e', pct: counts.critical / total },
    { key: 'high', label: 'High', color: '#f97316', pct: counts.high / total },
    { key: 'moderate', label: 'Moderate', color: '#f59e0b', pct: counts.moderate / total },
    { key: 'none', label: 'Safe', color: '#10b981', pct: (counts.low + counts.none) / total },
  ].filter(s => s.pct > 0);

  // Build SVG arc paths
  const R = 54, cx = 70, cy = 70, strokeW = 20;
  const circumference = 2 * Math.PI * R;
  let cumulativePct = 0;

  const arcs = segments.map(seg => {
    const dasharray = seg.pct * circumference;
    const dashoffset = circumference * (1 - cumulativePct) - circumference / 4;
    cumulativePct += seg.pct;
    return { ...seg, dasharray, dashoffset };
  });

  const dominant = segments.sort((a, b) => b.pct - a.pct)[0];

  return (
    <div className="flex items-center gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background ring */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
          {/* Segments */}
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeW}
              strokeDasharray={`${arc.dasharray} ${circumference}`}
              strokeDashoffset={arc.dashoffset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 3px ${arc.color}40)` }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900">{total}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Analyses</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2.5 flex-1">
        {segments.map(seg => (
          <div key={seg.key} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-xs font-semibold text-slate-600">{seg.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${seg.pct * 100}%`, backgroundColor: seg.color }} />
              </div>
              <span className="text-xs font-black text-slate-700 w-8 text-right">
                {(seg.pct * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. GENE × PHENOTYPE HEATMAP
function GeneHeatmap({ activeGene, activePhenotype }) {
  const riskToIntensity = {
    'Safe': 0, 'Adjust Dosage': 1, 'Ineffective': 2, 'Toxic': 3
  };
  const intensityColors = [
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-orange-100 text-orange-700',
    'bg-rose-200 text-rose-800',
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-center border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left pb-1 pr-2">Gene</th>
            {PHENOTYPES.map(p => (
              <th key={p} className={`text-[9px] font-black uppercase tracking-widest pb-1 px-1 ${activePhenotype === p ? 'text-slate-900' : 'text-slate-400'
                }`}>{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GENES.map(gene => (
            <tr key={gene}>
              <td className={`text-[10px] font-black text-left pr-2 font-mono ${activeGene === gene ? 'text-indigo-600' : 'text-slate-500'
                }`}>{gene}</td>
              {PHENOTYPES.map(ph => {
                const risk = HEATMAP_DATA[gene]?.[ph] || 'Unknown';
                const intensity = riskToIntensity[risk] ?? 0;
                const colorClass = intensityColors[intensity];
                const isActive = activeGene === gene && activePhenotype === ph;
                return (
                  <td key={ph} className="p-0.5">
                    <div className={`
                      rounded-md py-1 px-0.5 text-[8px] font-black transition-all duration-300
                      ${colorClass}
                      ${isActive ? 'ring-2 ring-indigo-400 ring-offset-1 scale-110 shadow-md z-10 relative' : ''}
                    `}>
                      {risk === 'Adjust Dosage' ? 'Adjust' : risk}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 4. WHAT-IF PHENOTYPE SIMULATOR
function WhatIfSimulator() {
  const [gene, setGene] = useState('CYP2D6');
  const [phenotype, setPhenotype] = useState('NM');
  const rec = WHATIF_RECOMMENDATIONS[gene]?.[phenotype];
  const riskCfg = rec ? RISK_CONFIG[rec.label] || RISK_CONFIG.Unknown : RISK_CONFIG.Unknown;
  const RiskIcon = riskCfg.icon;
  const doseNum = rec ? parseInt(rec.dose) : 100;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gene</label>
          <select
            value={gene}
            onChange={e => setGene(e.target.value)}
            className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
          >
            {GENES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phenotype</label>
          <div className="flex gap-1">
            {PHENOTYPES.map(p => {
              const col = PHENOTYPE_COLORS[p];
              return (
                <button
                  key={p}
                  onClick={() => setPhenotype(p)}
                  className={`flex-1 text-[9px] font-black rounded-lg py-1.5 transition-all border ${phenotype === p
                      ? `${col.bg} text-white border-transparent shadow-md`
                      : `bg-white ${col.text} ${col.border} hover:${col.light}`
                    }`}
                >{p}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Result card */}
      {rec && (
        <div className={`rounded-2xl p-4 border ${riskCfg.bg} ${riskCfg.border} transition-all duration-300`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <RiskIcon className={`w-5 h-5 ${riskCfg.color}`} />
              <div>
                <p className={`text-sm font-black ${riskCfg.color}`}>{rec.label}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{gene} — {rec.drug}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-slate-900">{rec.dose}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">of std dose</p>
            </div>
          </div>

          {/* Dose bar */}
          <div className="mb-3">
            <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${riskCfg.dot}`}
                style={{ width: `${doseNum}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-700 font-medium leading-relaxed">{rec.action}</p>
        </div>
      )}

      {/* Heatmap shows current position */}
      <div className="mt-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Risk Matrix — Highlighted: {gene} × {phenotype}</p>
        <GeneHeatmap activeGene={gene} activePhenotype={phenotype} />
      </div>
    </div>
  );
}

// 5. RELATIVE TIME HELPER
function timeAgo(isoDate) {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const Dashboard = ({ latestResult, onNewAnalysis }) => {
  const { history, addEntry, clearHistory } = useAnalysisHistory();
  const [activeTab, setActiveTab] = useState('overview');

  // When a new result comes in from parent, add it to history
  useEffect(() => {
    if (!latestResult) return;
    const results = latestResult.results || [latestResult];
    results.forEach(r => addEntry(r));
  }, [latestResult, addEntry]);

  // Stats derived from real history
  const stats = [
    {
      label: 'Total Analyses',
      value: history.length.toLocaleString(),
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-blue-500',
      shadow: 'shadow-blue-500/20',
      sub: `+${history.filter(h => new Date(h.date) > new Date(Date.now() - 86400000)).length} today`,
    },
    {
      label: 'High Risk Cases',
      value: history.filter(h => ['critical', 'high'].includes(h.severity)).length,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-rose-500',
      shadow: 'shadow-rose-500/20',
      sub: `${history.filter(h => h.severity === 'critical').length} critical`,
    },
    {
      label: 'Genes Covered',
      value: new Set(history.map(h => h.gene)).size,
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-teal-500',
      shadow: 'shadow-teal-500/20',
      sub: 'of 6 gene panel',
    },
    {
      label: 'Avg Confidence',
      value: history.length
        ? `${(history.reduce((s, h) => s + (h.confidence || 0), 0) / history.length * 100).toFixed(1)}%`
        : '—',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-indigo-500',
      shadow: 'shadow-indigo-500/20',
      sub: 'CPIC-aligned scoring',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Dashboard</h1>
          <p className="text-slate-500 font-medium">Real-time pharmacogenomic insights • CPIC Level A aligned</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearHistory}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Data
          </button>
          <button
            onClick={onNewAnalysis}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> New Analysis
          </button>
        </div>
      </div>

      {/* ── CRITICAL ALERT BANNER ───────────────────────────────────────── */}
      <CriticalAlertBanner history={history} />

      {/* ── STATS GRID ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-default">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.color} p-2.5 rounded-xl text-white shadow-lg ${stat.shadow}`}>
                {stat.icon}
              </div>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mb-0.5">{stat.value}</h3>
            <p className="text-[10px] text-slate-400 font-semibold">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'simulator', label: '⚡ What-If Simulator' },
          { id: 'heatmap', label: '🧬 Risk Matrix' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW ───────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Activity Table */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Latest Diagnostic Reports
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {history.length} total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/60">
                    {['Patient ID', 'Gene', 'Drug', 'Phenotype', 'Risk', 'Time'].map(h => (
                      <th key={h} className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.slice(0, 6).map((entry, i) => {
                    const cfg = RISK_CONFIG[entry.riskLabel] || RISK_CONFIG.Unknown;
                    const RIcon = cfg.icon;
                    return (
                      <tr key={i} className="hover:bg-white/60 transition-colors">
                        <td className="px-5 py-3 font-black text-slate-800 text-xs font-mono">{entry.id}</td>
                        <td className="px-5 py-3">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold font-mono border border-indigo-100">
                            {entry.gene}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-600">{entry.drug}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${PHENOTYPE_COLORS[entry.phenotype]?.light || 'bg-slate-50'} ${PHENOTYPE_COLORS[entry.phenotype]?.text || 'text-slate-600'} ${PHENOTYPE_COLORS[entry.phenotype]?.border || 'border-slate-200'}`}>
                            {entry.phenotype}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className={`flex items-center gap-1 ${cfg.color}`}>
                            <RIcon className="w-3 h-3" />
                            <span className="text-[10px] font-black">{entry.riskLabel}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[10px] font-bold text-slate-400">{timeAgo(entry.date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column: Donut + Gene breakdown */}
          <div className="flex flex-col gap-5">
            {/* Donut chart */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
              <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                Risk Distribution
              </h3>
              <DonutChart history={history} />
            </div>

            {/* Top genes */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
              <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-600" />
                Gene Activity
              </h3>
              <div className="space-y-2.5">
                {GENES.map(gene => {
                  const count = history.filter(h => h.gene === gene).length;
                  const pct = history.length ? count / history.length : 0;
                  const hasRisk = history.some(h => h.gene === gene && ['critical', 'high'].includes(h.severity));
                  return (
                    <div key={gene}>
                      <div className="flex justify-between mb-1">
                        <span className={`text-[10px] font-bold font-mono ${hasRisk ? 'text-rose-600' : 'text-slate-600'}`}>
                          {gene} {hasRisk && '⚠'}
                        </span>
                        <span className="text-[10px] font-black text-slate-500">{count} cases</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${hasRisk ? 'bg-rose-400' : 'bg-indigo-400'}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: WHAT-IF SIMULATOR ──────────────────────────────────────── */}
      {activeTab === 'simulator' && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">What-If Phenotype Simulator</h3>
              <p className="text-xs text-slate-500 font-medium">Toggle gene + phenotype to see real-time risk predictions — no VCF needed</p>
            </div>
          </div>
          <WhatIfSimulator />
        </div>
      )}

      {/* ── TAB: RISK MATRIX ────────────────────────────────────────────── */}
      {activeTab === 'heatmap' && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100">
              <Activity className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Gene × Phenotype Risk Matrix</h3>
              <p className="text-xs text-slate-500 font-medium">Complete CPIC risk landscape across all 6 genes and 5 phenotype classifications</p>
            </div>
          </div>
          <GeneHeatmap activeGene={null} activePhenotype={null} />

          {/* Legend */}
          <div className="mt-5 flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            {[
              { label: 'Safe', color: 'bg-emerald-100 text-emerald-700' },
              { label: 'Adjust', color: 'bg-amber-100 text-amber-700' },
              { label: 'Ineffective', color: 'bg-orange-100 text-orange-700' },
              { label: 'Toxic', color: 'bg-rose-200 text-rose-800' },
            ].map(l => (
              <span key={l.label} className={`px-3 py-1 rounded-lg text-[10px] font-black ${l.color}`}>
                {l.label}
              </span>
            ))}
            <span className="text-[10px] text-slate-400 font-medium self-center ml-2">Based on CPIC Level A guidelines</span>
          </div>
        </div>
      )}

    </div>
  );
};

function Dna({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 15c6.667-6 13.333 0 20-6" />
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      <path d="M17 6l-2.5-2.5" />
      <path d="M14 8l-1-1" />
      <path d="M7 18l2.5 2.5" />
      <path d="M3.5 14.5l.5.5" />
      <path d="M20 9l.5.5" />
      <path d="M6.5 12.5l1 1" />
      <path d="M16.5 10.5l1 1" />
      <path d="M10 16l-1 1" />
    </svg>
  );
}

export default Dashboard;