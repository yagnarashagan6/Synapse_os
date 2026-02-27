import React from 'react';

const tones = [
  { id: 'Professional', label: 'Professional' },
  { id: 'Modern', label: 'Modern' },
  { id: 'Minimal', label: 'Minimal' },
  { id: 'Bold', label: 'Bold' },
];

const ToneSelector = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-400">Brand Tone</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full glass-input rounded-xl px-4 py-3 bg-slate-900/60 border-slate-700/50 text-slate-200 focus:border-primary transition-all appearance-none cursor-pointer"
        >
          {tones.map((tone) => (
            <option key={tone.id} value={tone.id} className="bg-slate-900 text-slate-200">
              {tone.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ToneSelector;
