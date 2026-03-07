import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import PosterForm from '../components/poster/PosterForm';
import PosterPreview from '../components/poster/PosterPreview';
import { generatePoster, getVideos, fetchAndSaveVideo, generateScriptText, syncHeyGenVideos } from '../services/hygenService';

const PosterGenerator = ({ defaultTopic: propTopic = '' }) => {
  const location = useLocation();
  const stateTopic = location.state?.defaultTopic || '';
  const initialTopic = stateTopic || propTopic;

  const [topic, setTopic] = useState(initialTopic);
  const [platform, setPlatform] = useState('Instagram');
  const [size, setSize] = useState('1:1');
  const [tone, setTone] = useState('Modern');
  const [cta, setCta] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [posterUrl, setPosterUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [savedVideos, setSavedVideos] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);

  // Generation progress state
  const [generationStatus, setGenerationStatus] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  // Manual Fetch State
  const [manualVideoId, setManualVideoId] = useState('');
  const [fetchingManual, setFetchingManual] = useState(false);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  // Fetch saved videos on mount
  useEffect(() => {
    fetchSavedVideos();
  }, []);

  const fetchSavedVideos = async () => {
    try {
      setLibraryLoading(true);
      // Auto-sync from HeyGen first, then load
      try {
        await syncHeyGenVideos();
      } catch (syncErr) {
        console.warn('Auto-sync skipped:', syncErr.message);
      }
      const videos = await getVideos();
      setSavedVideos(videos);
    } catch (err) {
      console.warn('Failed to load video library:', err.message);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleProgressUpdate = useCallback((status, progress) => {
    setGenerationStatus(status);
    setGenerationProgress(progress);
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSavedToLibrary(false);
    setGenerationStatus('Generating script...');
    setGenerationProgress(5);
    
    let finalScript = scriptText;
    try {
      if (!finalScript.trim()) {
        finalScript = await generateScriptText({ topic, platform, tone, cta });
        if (finalScript) {
           setScriptText(finalScript);
        } else {
           throw new Error("Failed to auto-generate script.");
        }
      }

      setGenerationStatus('Sending to HeyGen...');
      setGenerationProgress(15);

      const result = await generatePoster({
        scriptText: finalScript,
        topic,
        platform,
        size,
        tone,
        cta,
        onProgress: handleProgressUpdate
      });
      setGenerationStatus('Complete!');
      setGenerationProgress(100);
      setPosterUrl(result.videoUrl);
      setSavedToLibrary(result.saved);
      // Refresh the library
      if (result.saved) {
        fetchSavedVideos();
      }
    } catch (err) {
      setError(err.message || 'Something went wrong during generation.');
    } finally {
      setLoading(false);
      setGenerationStatus('');
      setGenerationProgress(0);
    }
  };

  const handleManualFetch = async () => {
    if (!manualVideoId.trim()) {
      setError('Please enter a Video ID.');
      return;
    }

    setFetchingManual(true);
    setLoading(true);
    setError(null);
    setSavedToLibrary(false);

    try {
      const result = await fetchAndSaveVideo(manualVideoId.trim());
      setPosterUrl(result.videoUrl);
      setSavedToLibrary(result.saved);
      if (result.saved) {
         fetchSavedVideos();
      }
      setManualVideoId(''); // Clear input on success
    } catch (err) {
      setError(err.message || 'Failed to fetch the video.');
    } finally {
      setFetchingManual(false);
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
                Video <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Generator</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                Transform any topic into a professional marketing video in seconds. 
                Perfect for social media, ads, or internal presentations.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
               <div className="px-6 py-4 glass-panel rounded-3xl border-white/5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-xl">✨</div>
                  <div>
                    <div className="text-white font-bold">HeyGen AI</div>
                    <div className="text-slate-500 text-xs">Avatar Video Engine</div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Main Content: Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Config Column */}
          <div className="lg:col-span-5">
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
              scriptText={scriptText}
              setScriptText={setScriptText}
              onGenerate={handleGenerate}
              isLoading={loading}
            />
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-7">
            <PosterPreview
              imageUrl={posterUrl}
              isLoading={loading}
              error={error}
              onRegenerate={handleGenerate}
              savedToLibrary={savedToLibrary}
              generationStatus={generationStatus}
              generationProgress={generationProgress}
            />
          </div>
        </div>

        {/* Manual Fetch Block — full width, between grid and library */}
        <div className="glass-panel rounded-[20px] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0">
            <h3 className="text-white font-bold text-sm">Have a Video ID?</h3>
            <p className="text-slate-400 text-xs">Fetch a video generated in the background</p>
          </div>
          <div className="flex gap-2 flex-1 w-full sm:w-auto">
            <input
              type="text"
              value={manualVideoId}
              onChange={(e) => setManualVideoId(e.target.value)}
              placeholder="Paste HeyGen Video ID..."
              className="flex-1 glass-input min-w-0 rounded-xl px-4 py-2 bg-slate-900/60 border-slate-700/50 text-slate-200 focus:border-primary text-sm transition-all"
              disabled={loading}
            />
            <button
              onClick={handleManualFetch}
              disabled={loading || !manualVideoId.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            >
              {fetchingManual ? 'Fetching...' : 'Fetch'}
            </button>
          </div>
        </div>

        {/* Video Library Section */}
        <div className="glass-panel rounded-[20px] p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Video Library</h2>
              <p className="text-slate-500 text-sm">Your previously generated videos, stored in the cloud</p>
            </div>
            <button 
              onClick={fetchSavedVideos}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Refresh Library"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {libraryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 animate-pulse">
                  <div className="w-full h-40 bg-slate-800 rounded-lg mb-3"></div>
                  <div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : savedVideos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium mb-1">No videos yet</p>
              <p className="text-slate-600 text-sm">Generate your first video above, and it'll appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedVideos.map((video) => (
                <div key={video.id} className="group rounded-xl bg-slate-900/60 border border-slate-800 hover:border-primary/30 transition-all overflow-hidden min-w-0">
                  {/* Video Thumbnail / Player */}
                  <div className="relative w-full aspect-video bg-black overflow-hidden">
                    <video 
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      controls
                      muted
                    />
                  </div>
                  {/* Info */}
                  <div className="p-4 space-y-2 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate" title={video.topic}>
                      {video.topic || 'Untitled Video'}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {video.platform && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 uppercase truncate max-w-[100px]">
                          {video.platform}
                        </span>
                      )}
                      {video.tone && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-secondary/10 text-secondary border border-secondary/20 uppercase truncate max-w-[100px]">
                          {video.tone}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-xs">{formatDate(video.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info/stats badge */}
        <div className="flex justify-center pt-8">
           <div className="px-5 py-2 rounded-full border border-slate-800 bg-slate-900/40 text-slate-500 text-xs flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> System Online</span>
              <span className="w-px h-3 bg-slate-800"></span>
              <span className="flex items-center gap-1.5">Encryption Active</span>
              <span className="w-px h-3 bg-slate-800"></span>
              <span>{savedVideos.length} Videos Generated</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PosterGenerator;
