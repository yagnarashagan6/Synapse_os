import React from 'react';
import PlatformSelector from './PlatformSelector';
import SizeSelector from './SizeSelector';
import ToneSelector from './ToneSelector';
import GenerateButton from './GenerateButton';

const PosterForm = ({
  topic,
  setTopic,
  platform,
  setPlatform,
  size,
  setSize,
  tone,
  setTone,
  cta,
  setCta,
  scriptText,
  setScriptText,
  onGenerate,
  isLoading
}) => {
  return (
    <div className="glass-panel rounded-[20px] p-6 lg:p-8 space-y-8 h-full">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Configure Video</h2>
        <p className="text-slate-400 text-sm">Fine-tune the AI to generate your perfect marketing asset</p>
      </div>

      <div className="space-y-6">
        {/* Topic Input */}
        <div className="space-y-3">
          <label htmlFor="topic" className="text-sm font-medium text-slate-400">
            What's the topic? <span className="text-primary">*</span>
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Sustainable Fashion Trends 2024"
            className="w-full glass-input rounded-xl px-4 py-3 bg-slate-900/60 border-slate-700/50 text-slate-200 focus:border-primary transition-all"
            required
          />
        </div>

        {/* Platform Selector */}
        <PlatformSelector value={platform} onChange={setPlatform} />

        {/* Size Selector */}
        <SizeSelector value={size} onChange={setSize} />

        {/* Tone Selector */}
        <ToneSelector value={tone} onChange={setTone} />

        {/* CTA Text */}
        <div className="space-y-3">
          <label htmlFor="cta" className="text-sm font-medium text-slate-400">
            Call to Action (Optional)
          </label>
          <input
            id="cta"
            type="text"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="e.g. Shop Now, Sign Up Today"
            className="w-full glass-input rounded-xl px-4 py-3 bg-slate-900/60 border-slate-700/50 text-slate-200 focus:border-primary transition-all"
          />
        </div>

        {/* Script Text */}
        <div className="space-y-3">
          <label htmlFor="script" className="text-sm font-medium text-slate-400">
            Video Script (Leave empty to auto-generate)
          </label>
          <textarea
            id="script"
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="e.g. Welcome to our new product launch..."
            rows={4}
            className="w-full glass-input rounded-xl px-4 py-3 bg-slate-900/60 border-slate-700/50 text-slate-200 focus:border-primary transition-all resize-none"
          />
        </div>
      </div>

      <div className="pt-4">
        <GenerateButton
          onClick={onGenerate}
          isLoading={isLoading}
          disabled={!topic.trim()}
        />
      </div>
      
      {!topic.trim() && (
        <p className="text-xs text-rose-500/80 text-center">
          * Please enter a topic to enable generation
        </p>
      )}
    </div>
  );
};

export default PosterForm;
