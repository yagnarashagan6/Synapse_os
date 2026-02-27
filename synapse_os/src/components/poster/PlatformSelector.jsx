import React from 'react';

const platforms = [
  { id: 'Instagram', label: 'Instagram', icon: '📸' },
  { id: 'LinkedIn', label: 'LinkedIn', icon: '💼' },
  { id: 'X', label: 'X', icon: '🐦' },
  { id: 'TikTok', label: 'TikTok', icon: '🎵' },
  { id: 'YouTube', label: 'YouTube', icon: '🎥' },
];

const PlatformSelector = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-400">Platform</label>
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => onChange(platform.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
              value === platform.id
                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <span className="mr-2">{platform.icon}</span>
            {platform.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlatformSelector;
