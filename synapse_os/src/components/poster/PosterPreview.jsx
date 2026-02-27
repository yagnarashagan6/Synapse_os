import React from 'react';

const PosterPreview = ({ imageUrl, isLoading, error, onRegenerate }) => {
  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `video-${Date.now()}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel rounded-[20px] p-6 lg:p-8 flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Preview</h2>
        {imageUrl && !isLoading && (
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-full border border-emerald-500/20">
            Generated
          </span>
        )}
      </div>

      <div className="flex-1 relative flex items-center justify-center rounded-xl bg-slate-900/40 border-2 border-dashed border-slate-800 overflow-hidden group">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-8">
            <div className="w-full max-w-sm h-64 bg-slate-800/50 rounded-lg animate-pulse"></div>
            <div className="space-y-2 w-full max-w-sm">
              <div className="h-4 bg-slate-800/50 rounded animate-pulse w-3/4 mx-auto"></div>
              <div className="h-3 bg-slate-800/50 rounded animate-pulse w-1/2 mx-auto"></div>
            </div>
            <p className="text-slate-500 text-sm animate-bounce mt-4">AI is painting your poster...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-rose-400 font-medium mb-2">Generation Failed</p>
            <p className="text-slate-500 text-sm max-w-xs">{error}</p>
            <button 
              onClick={onRegenerate}
              className="mt-6 text-primary hover:text-primary-light text-sm font-medium underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : imageUrl ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <video 
              src={imageUrl} 
              autoPlay
              controls
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
            />
            
            {/* Hover Overlay Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button
                onClick={handleDownload}
                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/20"
                title="Download Poster"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium mb-2">No Video Generated Yet</p>
            <p className="text-slate-600 text-sm max-w-xs mx-auto">
              Fill out the form on the left and hit generate to see your AI-powered video here.
            </p>
          </div>
        )}
      </div>

      {imageUrl && !isLoading && !error && (
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Video
          </button>
          <button
            onClick={onRegenerate}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all flex items-center justify-center"
            title="Regenerate"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default PosterPreview;
