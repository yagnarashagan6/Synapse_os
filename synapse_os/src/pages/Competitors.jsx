import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import { motion } from 'framer-motion';
import { Search, Globe, Trash2, ExternalLink, Loader2, AlertCircle, X, MessageCircle, Heart, Calendar, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Layers, Zap, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Table, {
  TableRow,
  TableCell,
} from '../components/ui/Table';

// ─── chart helpers ─────────────────────────────────────────────────────────────
function shortText(str, words) {
  if (!str) return '';
  const w = str.trim().split(/\s+/);
  return w.length <= (words || 5) ? str.trim() : w.slice(0, words || 5).join(' ') + '\u2026';
}
function postDateLabel(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function buildSingleChartData(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return [];
  const map = {};
  posts.forEach((post) => {
    const label = post.timestamp ? postDateLabel(post.timestamp) : null;
    if (!label) return;
    if (!map[label]) map[label] = { _ts: new Date(post.timestamp), likes: 0, views: 0, comments: 0, _bL: -1, _bV: -1, _bC: -1, likesCap: '', viewsCap: '', commentsCap: '' };
    const lk = Number(post.likesCount) || 0;
    const vw = Number(post.videoViewCount || post.videoPlayCount || post.viewCount) || 0;
    const cm = Number(post.commentsCount) || 0;
    const cp = shortText(post.caption || post.title || '');
    map[label].likes    += lk;
    map[label].views    += vw;
    map[label].comments += cm;
    if (lk > map[label]._bL) { map[label]._bL = lk; map[label].likesCap = cp; }
    if (vw > map[label]._bV) { map[label]._bV = vw; map[label].viewsCap = cp; }
    if (cm > map[label]._bC) { map[label]._bC = cm; map[label].commentsCap = cp; }
  });
  return Object.entries(map)
    .sort(([, a], [, b]) => a._ts - b._ts)
    .map(([date, v]) => ({ date, likes: v.likes, views: v.views, comments: v.comments, likesCap: v.likesCap, viewsCap: v.viewsCap, commentsCap: v.commentsCap }));
}

const MiniTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const capKey = { likes: 'likesCap', views: 'viewsCap', comments: 'commentsCap' };
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '8px 12px', minWidth: 160, maxWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,.4)', fontSize: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: '#94a3b8', fontSize: 11 }}>{label}</p>
      {payload.map((e) => {
        const cap = e.payload[capKey[e.dataKey]];
        return (
          <div key={e.dataKey} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
              <span style={{ fontWeight: 600, color: e.color, textTransform: 'capitalize' }}>{e.dataKey}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#f8fafc' }}>{Number(e.value).toLocaleString()}</span>
            </div>
            {cap && <p style={{ paddingLeft: 14, color: '#64748b', fontSize: 10, marginTop: 1 }}>"{cap}"</p>}
          </div>
        );
      })}
    </div>
  );
};

const CHART_LINES = [
  { key: 'likes',    color: '#f43f5e', label: '\u2764\ufe0f Likes'    },
  { key: 'views',    color: '#22d3ee', label: '\ud83d\udc41 Views'    },
  { key: 'comments', color: '#a78bfa', label: '\ud83d\udcac Comments' },
];

const CompanyMiniChart = ({ competitor }) => {
  const posts = competitor?.scrapedData?.latestPosts || [];
  const data  = buildSingleChartData(posts);
  const [activeLines, setActiveLines] = useState({ likes: true, views: true, comments: true });
  if (data.length === 0) return null;
  const toggle = (k) => setActiveLines((p) => ({ ...p, [k]: !p[k] }));
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Engagement Analytics</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{competitor.name} &middot; {posts.length} posts &middot; hover for top caption</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CHART_LINES.map(({ key, color, label }) => (
            <button key={key} onClick={() => toggle(key)}
              style={activeLines[key] ? { borderColor: color, background: color + '22', color } : {}}
              className={`px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
                activeLines[key] ? '' : 'border-border text-muted-foreground opacity-40 hover:opacity-70'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} dy={6} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={44}
              tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<MiniTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
            {CHART_LINES.map(({ key, color }) =>
              activeLines[key] ? (
                <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2}
                  dot={{ r: 3, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: color, stroke: '#0f172a', strokeWidth: 2 }}
                  connectNulls />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
// ... (lines 9-206)
const Competitors = () => {
  const [query, setQuery] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);

  // Fetch competitors on mount
  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/competitors`);
      if (!response.ok) throw new Error('Failed to fetch competitors');
      const data = await response.json();
      setCompetitors(data);
    } catch (err) {
      console.error(err);
      setError('Could not load competitors. Ensure backend is running.');
    }
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to scrape data');
      }

      await fetchCompetitors(); // Refresh list
      setQuery('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent opening modal
    if (!window.confirm('Are you sure you want to delete this competitor?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/competitors/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete competitor');

        // Remove from local state
        setCompetitors(prev => prev.filter(c => c.id !== id && c._id !== id));
    } catch (err) {
        console.error(err);
        alert('Failed to delete competitor');
    }
  };

  // Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // newest, likes, comments
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Helper to open detail view
  const viewPosts = (comp) => {
      setSelectedCompetitor(comp);
      // Reset filters when opening new competitor
      setStartDate('');
      setEndDate('');
      setSortOption('newest');
      setCurrentPage(1);
  };

  // Helper to close detail view
  const closePosts = () => {
      setSelectedCompetitor(null);
  };

  // Filter and Sort posts
  const getFilteredAndSortedPosts = () => {
      if (!selectedCompetitor?.scrapedData?.latestPosts) return [];
      
      let posts = selectedCompetitor.scrapedData.latestPosts.filter(post => {
          if (!startDate && !endDate) return true;
          
          const postDate = new Date(post.timestamp);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          end.setHours(23, 59, 59, 999);

          return postDate >= start && postDate <= end;
      });

      // Sorting
      return posts.sort((a, b) => {
          if (sortOption === 'likes') {
              return (b.likesCount || 0) - (a.likesCount || 0);
          } else if (sortOption === 'comments') {
              return (b.commentsCount || 0) - (a.commentsCount || 0);
          } else {
              // Default: Newest first
              return new Date(b.timestamp) - new Date(a.timestamp);
          }
      });
  };

  // Helper for Proxy Image URL
  const getProxyImageUrl = (url) => {
      if (!url) return null;
      // Use local backend proxy
      return `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  // Render Logic
  if (selectedCompetitor) {
      const allFilteredPosts = getFilteredAndSortedPosts();
      
      // Pagination Logic
      const totalPages = Math.ceil(allFilteredPosts.length / ITEMS_PER_PAGE);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const currentPosts = allFilteredPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      
      return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={closePosts}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold">{selectedCompetitor.name}</h1>
                    <p className="text-muted-foreground">Detailed Post Analysis</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-muted-foreground">From Date</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                        className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-muted-foreground">To Date</label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                        className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                </div>
                <div className="flex flex-col gap-1.5 min-w-[150px]">
                    <label className="text-sm font-medium text-muted-foreground">Sort By</label>
                    <select 
                        value={sortOption}
                        onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
                        className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value="newest">Newest First</option>
                        <option value="likes">Most Likes</option>
                        <option value="comments">Most Comments</option>
                    </select>
                </div>
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground bg-secondary/10 px-3 py-2 rounded-md">
                    <span className="font-bold text-primary">{allFilteredPosts.length}</span> posts found
                </div>
            </div>

            {/* ─── Mini Analytics Chart ─── */}
            <CompanyMiniChart competitor={selectedCompetitor} />

            {/* Content Display */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                {selectedCompetitor?.scrapedData?.latestPosts ? (
                    // Instagram Posts View
                    currentPosts.length > 0 ? (
                        <div className="p-0">
                            <Table headers={['Date', 'Preview', 'Type', 'Likes', 'Comments', 'Views', 'Caption', 'Link']}>
                                {currentPosts.map((post, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-muted-foreground" />
                                            {new Date(post.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground pl-6">
                                            {new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {post.displayUrl ? (
                                                <img 
                                                    src={getProxyImageUrl(post.displayUrl)} 
                                                    alt="Post" 
                                                    className="w-16 h-16 object-cover rounded-md bg-muted border border-border" 
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center border border-border">
                                                    <Globe size={20} className="text-muted-foreground/50" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                {post.type === 'Video' || post.isVideo ? <Video size={18} /> : 
                                                 post.type === 'Sidecar' || post.children ? <Layers size={18} /> : 
                                                 <ImageIcon size={18} />}
                                                <span className="text-xs">{post.type || (post.isVideo ? 'Video' : 'Image')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-medium text-red-500/90">
                                                <Heart size={16} className="fill-current" /> 
                                                {post.likesCount?.toLocaleString() || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-medium text-blue-500/90">
                                                <MessageCircle size={16} className="fill-current" /> 
                                                {post.commentsCount?.toLocaleString() || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-medium text-green-500/90">
                                                { (post.videoViewCount || post.videoPlayCount || post.viewCount) ? (
                                                    <>
                                                        <Eye size={16} className="fill-current" />
                                                        {(post.videoViewCount || post.videoPlayCount || post.viewCount)?.toLocaleString()}
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="line-clamp-2 text-sm text-muted-foreground max-w-[300px]" title={post.caption}>
                                                {post.caption || "No caption"}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <a 
                                            href={post.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors text-primary"
                                            title="View on Instagram"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground bg-muted/5">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No posts found</p>
                            <p className="text-sm">Try adjusting your filters</p>
                        </div>
                    )
                ) : (
                    // Generic Website Content View
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Title</h3>
                                    <p className="text-lg font-semibold">{selectedCompetitor.scrapedData?.title || 'No title available'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1">URL</h3>
                                    <a href={selectedCompetitor.scrapedData?.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        {selectedCompetitor.scrapedData?.url || 'No URL'}
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                                    <p className="text-sm leading-relaxed">{selectedCompetitor.scrapedData?.description || 'No description available'}</p>
                                </div>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg border border-border h-full max-h-[400px] overflow-auto">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background/0 backdrop-blur-sm">Extracted Text Content</h3>
                                <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                                    {selectedCompetitor.scrapedData?.text || selectedCompetitor.scrapedData?.markdown || JSON.stringify(selectedCompetitor.scrapedData, null, 2)}
                                </pre>
                            </div>
                        </div>
                        
                        {/* Identify "Answer" if present from specific actors */}
                        {selectedCompetitor.scrapedData?.answer && (
                            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                                <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
                                    <Zap size={20} /> Extracted Answer
                                </h3>
                                <div className="text-foreground prose dark:prose-invert max-w-none">
                                    {selectedCompetitor.scrapedData.answer}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/5">
                        <div className="text-sm text-muted-foreground">
                            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-8 relative">
      <header>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Competitor Analysis
        </h1>
        <p className="text-muted-foreground mt-2">
          Track and analyze your competitors using AI-powered web scraping.
        </p>
      </header>

      {/* Input Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Competitor</h2>
        <form onSubmit={handleScrape} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Enter competitor name or Instagram URL (e.g. nike)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Globe size={20} />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Competitors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitors.map((comp) => (
          <motion.div
            key={comp._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
            onClick={() => viewPosts(comp)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Globe size={24} />
              </div>
              <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(comp.createdAt).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={(e) => handleDelete(e, comp.id || comp._id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                    title="Delete Competitor"
                  >
                      <Trash2 size={16} />
                  </button>
              </div>
            </div>
            
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors relative z-10">
              {comp.name}
            </h3>

            <div className="text-sm text-muted-foreground mb-4 space-y-2 flex-1 relative z-10">
               {/* Display Instagram Metrics if available */}
               {comp.scrapedData && comp.scrapedData.followersCount ? (
                   <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-secondary/10 p-2 rounded">
                            <span className="block font-bold">{comp.scrapedData.followersCount.toLocaleString()}</span>
                            <span className="text-muted-foreground">Followers</span>
                        </div>
                        <div className="bg-secondary/10 p-2 rounded">
                            <span className="block font-bold">{comp.scrapedData.postsCount?.toLocaleString() || 0}</span>
                            <span className="text-muted-foreground">Posts</span>
                        </div>
                    </div>
                    {comp.scrapedData.latestPosts && comp.scrapedData.latestPosts.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-semibold mb-1">Latest Post:</p>
                            <div className="flex gap-4 text-xs">
                                <span className="flex items-center gap-1"><Heart size={12} className="text-red-500" /> {comp.scrapedData.latestPosts[0].likesCount}</span>
                                <span className="flex items-center gap-1"><MessageCircle size={12} className="text-blue-500" /> {comp.scrapedData.latestPosts[0].commentsCount}</span>
                            </div>
                            <p className="text-[10px] mt-1 text-muted-foreground">
                                {new Date(comp.scrapedData.latestPosts[0].timestamp).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                   </>
               ) : (
                // Fallback for generic data
                 <p className="line-clamp-3">
                    {comp.scrapedData && Array.isArray(comp.scrapedData) && comp.scrapedData[0] 
                        ? (comp.scrapedData[0].description || comp.scrapedData[0].title || "No description available.") 
                        : "No specific Instagram data found."}
                 </p>
               )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto relative z-10">
                <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-full">
                    {comp.scrapedData?._source ? 'Instagram' : 'Web'}
                </span>
                
                <span className="text-primary text-sm flex items-center gap-1 font-medium">
                    View Analysis <ArrowRight size={14} />
                </span>
            </div>
          </motion.div>
        ))}
        
        {competitors.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                <Globe size={48} className="mx-auto mb-4 opacity-20" />
                <p>No competitors tracked yet. Add one above to get started.</p>
            </div>
        )}
      </div>

    </div>
  );
};

export default Competitors;
