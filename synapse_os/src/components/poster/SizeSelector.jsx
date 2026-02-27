import React from 'react';

const sizes = [
  { id: '1:1', label: '1:1 Square', description: 'Instagram, LinkedIn' },
  { id: '16:9', label: '16:9 Wide', description: 'YouTube, X' },
  { id: '4:5', label: '4:5 Portrait', description: 'TikTok, Instagram Reels' },
];

const SizeSelector = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-400">Poster Size</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sizes.map((size) => (
          <button
            key={size.id}
            type="button"
            onClick={() => onChange(size.id)}
            className={`p-3 rounded-xl text-left transition-all duration-200 border ${
              value === size.id
                ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <div className={`font-medium ${value === size.id ? 'text-primary' : 'text-slate-200'}`}>
              {size.label}
            </div>
            <div className="text-xs text-slate-500 mt-1">{size.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelector;
