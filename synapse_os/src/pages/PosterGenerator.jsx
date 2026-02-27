import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PosterForm from '../components/poster/PosterForm';
import PosterPreview from '../components/poster/PosterPreview';
import { generatePoster } from '../services/hygenService';

const PosterGenerator = ({ defaultTopic: propTopic = '' }) => {
  const location = useLocation();
  const stateTopic = location.state?.defaultTopic || '';
  const initialTopic = stateTopic || propTopic;

  const [topic, setTopic] = useState(initialTopic);
  const [platform, setPlatform] = useState('Instagram');
  const [size, setSize] = useState('1:1');
  const [tone, setTone] = useState('Modern');
  const [cta, setCta] = useState('');
  const [posterUrl, setPosterUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = await generatePoster({
        topic,
        platform,
        size,
        tone,
        cta
      });
      setPosterUrl(url);
    } catch (err) {
      setError(err.message || 'Something went wrong during generation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header section with glassmorphism accent */}
        <div className="relative overflow-hidden rounded-[2.5rem] p-8 lg:p-12 mb-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-slate-900 to-secondary/10 opacity-50"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-xs font-bold uppercase tracking-wider mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                AI Powered Creation
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Poster <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Generator</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                Transform any topic into a professional marketing asset in seconds. 
                Perfect for social media, ads, or internal presentations.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
               <div className="px-6 py-4 glass-panel rounded-3xl border-white/5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-xl">✨</div>
                  <div>
                    <div className="text-white font-bold">Hygen AI</div>
                    <div className="text-slate-500 text-xs">Proprietary Model v2.4</div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Main Content: Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Config Column */}
          <div className="lg:col-span-5 h-full">
            <PosterForm
              topic={topic}
              setTopic={setTopic}
              platform={platform}
              setPlatform={setPlatform}
              size={size}
              setSize={setSize}
              tone={tone}
              setTone={setTone}
              cta={cta}
              setCta={setCta}
              onGenerate={handleGenerate}
              isLoading={loading}
            />
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-7 h-full">
            <PosterPreview
              imageUrl={posterUrl}
              isLoading={loading}
              error={error}
              onRegenerate={handleGenerate}
            />
          </div>
        </div>

        {/* Footer info/stats badge - Sleek indicator */}
        <div className="flex justify-center pt-8">
           <div className="px-5 py-2 rounded-full border border-slate-800 bg-slate-900/40 text-slate-500 text-xs flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> System Online</span>
              <span className="w-px h-3 bg-slate-800"></span>
              <span className="flex items-center gap-1.5">Encryption Active</span>
              <span className="w-px h-3 bg-slate-800"></span>
              <span>API Gateway: synapse-gw-01</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PosterGenerator;
