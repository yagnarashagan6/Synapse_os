import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Table, { TableRow, TableCell } from '../components/ui/Table';
import { Search, Filter, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { API_BASE_URL } from '../config/apiConfig';
import { usePlatform } from '../context/PlatformContext';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', available: true },
  { key: 'linkedin',  label: 'LinkedIn',  available: true },
  { key: 'tiktok',    label: 'TikTok',    available: false },
  { key: 'youtube',   label: 'YouTube',   available: false },
  { key: 'twitter',   label: 'X (Twitter)', available: false },
];

function weekBucket(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return null;
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ProgressBar = ({ value }) => (
  <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2">
    <div 
      className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full" 
      style={{ width: `${value}%` }} 
    />
  </div>
);

const Trends = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { activePlatform, setActivePlatform } = usePlatform();
  const [competitors, setCompetitors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/competitors?platform=${activePlatform}`)
      .then((r) => r.json())
      .then((data) => setCompetitors(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activePlatform]);

  const { chartData, topTopics, topicsList } = React.useMemo(() => {
    if (!competitors.length) return { chartData: [], topTopics: [], topicsList: [] };

    const getEng = (p) => (Number(p.likesCount || p.likeCount || p.numLikes) || 0) +
                         (Number(p.commentsCount || p.commentCount || p.numComments) || 0) +
                         (Number(p.videoViewCount || p.videoPlayCount || p.viewCount) || 0);

    const periodBuckets = {}; // { 'Jan 5': { 'AI': 120, 'Sustainability': 50 } }
    const topicEngagement = {}; // { 'AI': { total: 1000, sources: 5, category: 'Tech' } }

    competitors.forEach(comp => {
      const posts = comp.scrapedData?.latestPosts || [];
      posts.forEach(post => {
        const ts = post.timestamp || post.publishedAt || post.postedAt || post.time || post.date;
        const bucket = weekBucket(ts);
        if (!bucket) return;

        const eng = getEng(post);
        const caption = (post.caption || post.title || "").toLowerCase();
        const words = caption.split(/\W+/);
        
        // Extract top 3 likely topics from this post
        const uniqueWords = [...new Set(words.filter(w => w.length > 5))].slice(0, 3);
        
        uniqueWords.forEach(word => {
          if (['instagram', 'linkedin', 'facebook', 'twitter', 'social', 'media'].includes(word)) return;
          
          const label = word.charAt(0).toUpperCase() + word.slice(1);
          
          if (!periodBuckets[bucket]) periodBuckets[bucket] = { _ts: new Date(ts) };
          periodBuckets[bucket][label] = (periodBuckets[bucket][label] || 0) + eng;

          if (!topicEngagement[label]) {
            topicEngagement[label] = { total: 0, sources: new Set(), lastEng: 0, prevEng: 0 };
          }
          topicEngagement[label].total += eng;
          topicEngagement[label].sources.add(comp.name);
          
          // Simple growth logic
          const d = new Date(ts);
          const isCurrent = d > new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
          if (isCurrent) topicEngagement[label].lastEng += eng;
          else topicEngagement[label].prevEng += eng;
        });
      });
    });

    // Formatting chart data
    const topTopicLabels = Object.entries(topicEngagement)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 4)
      .map(([label]) => label);

    const formattedChart = Object.entries(periodBuckets)
      .sort(([, a], [, b]) => a._ts - b._ts)
      .map(([date, vals]) => {
        const row = { name: date };
        topTopicLabels.forEach(label => {
          row[label] = vals[label] || 0;
        });
        return row;
      });

    // Formatting topics table
    const formattedTopics = Object.entries(topicEngagement)
      .map(([label, data]) => ({
        topic: label,
        category: topTopicLabels.includes(label) ? 'Core' : 'Emerging',
        score: Math.min(100, Math.round((data.total / 10000) * 100)),
        velocity: data.lastEng > data.prevEng * 1.5 ? 'High' : 'Rising',
        mentions: data.total >= 1000 ? (data.total / 1000).toFixed(1) + 'k' : data.total.toString(),
        sources: data.sources.size,
        trendUp: data.lastEng > data.prevEng
      }))
      .sort((a, b) => b.score - a.score);

    return { chartData: formattedChart, topTopics: topTopicLabels, topicsList: formattedTopics };
  }, [competitors]);

  const filteredTopics = topicsList.filter(t => 
    t.topic.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
  const paginatedTopics = filteredTopics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when search or platform changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, activePlatform]);

  // Chart Colors
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const TOPIC_COLORS = ['#8b5cf6', '#06b6d4', '#f43f5e', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Trends Analysis</h2>
          <p className="text-slate-500 dark:text-slate-400">Signals & topics radar powered by AI</p>
        </div>
        <div className="flex items-center gap-3 bg-card border rounded-xl px-3 py-1.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {PLATFORMS.map(p => (
              <button 
                key={p.key}
                disabled={!p.available}
                onClick={() => setActivePlatform(p.key)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  activePlatform === p.key 
                    ? 'bg-primary text-primary-foreground' 
                    : p.available ? 'hover:bg-muted text-muted-foreground' : 'opacity-30 cursor-not-allowed'
                }`}
              >
                {p.label}
              </button>
            ))}
        </div>
      </div>

      <Card className="h-[400px]">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Topic Momentum Over Time</h3>
        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {topTopics.map((label, idx) => (
                  <linearGradient key={label} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TOPIC_COLORS[idx]} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={TOPIC_COLORS[idx]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} vertical={false} />
              <XAxis dataKey="name" stroke={axisColor} axisLine={false} tickLine={false} dy={10} />
              <YAxis 
                stroke={axisColor} 
                axisLine={false} 
                tickLine={false} 
                dx={-10}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', 
                  borderColor: gridColor, 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                }}
              />
              <Legend verticalAlign="top" height={36}/>
              {topTopics.map((label, idx) => (
                <Area 
                  key={label}
                  type="monotone" 
                  dataKey={label} 
                  stroke={TOPIC_COLORS[idx]} 
                  fillOpacity={1} 
                  fill={`url(#color${idx})`} 
                  strokeWidth={3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Emerging Topics</h3>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics..." 
                className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
        </div>
        
        <Table headers={['Topic', 'Category', 'Trend Score', 'Velocity', 'Mentions', 'Sources', 'Actions']}>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                 <div className="w-8 h-8 mx-auto border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
              </TableCell>
            </TableRow>
          ) : paginatedTopics.length > 0 ? paginatedTopics.map((topic, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white whitespace-nowrap">{topic.topic}</span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={topic.category === 'Core' ? 'purple' : 'default'}>{topic.category}</Badge>
              </TableCell>
              <TableCell className="w-48">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white">{topic.score}</span>
                    <ProgressBar value={topic.score} />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    {topic.velocity === 'High' && <Zap size={16} className="text-purple-600 dark:text-purple-400" />}
                    {topic.velocity === 'Rising' && <TrendingUp size={16} className="text-cyan-600 dark:text-cyan-400" />}
                    <span className={topic.velocity === 'High' ? 'text-purple-600 dark:text-purple-400' : topic.velocity === 'Rising' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}>
                        {topic.velocity}
                    </span>
                </div>
              </TableCell>
              <TableCell>{topic.mentions}</TableCell>
              <TableCell>{topic.sources}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/poster-generator', { state: { defaultTopic: topic.topic } })}
                    className="hover:bg-primary/20 text-primary p-2"
                    title="Generate Poster"
                  >
                    <Zap size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                No topics found matching your criteria.
              </TableCell>
            </TableRow>
          )}
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTopics.length)}</span> of <span className="font-medium">{filteredTopics.length}</span> topics
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      currentPage === i + 1
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Trends;
