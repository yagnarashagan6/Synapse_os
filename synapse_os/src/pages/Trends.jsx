import React from 'react';
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
  ResponsiveContainer 
} from 'recharts';

const chartData = [
  { name: 'Week 1', score: 30, mentions: 1200 },
  { name: 'Week 2', score: 45, mentions: 1500 },
  { name: 'Week 3', score: 38, mentions: 1100 },
  { name: 'Week 4', score: 60, mentions: 2200 },
  { name: 'Week 5', score: 75, mentions: 3400 },
  { name: 'Week 6', score: 90, mentions: 4500 },
];

const topics = [
  { 
    topic: 'Sustainable Materials', 
    category: 'Eco-Friendly', 
    score: 92, 
    velocity: 'High', 
    mentions: '12.5k', 
    sources: 24, 
    trendUp: true 
  },
  { 
    topic: 'AI-Powered Design', 
    category: 'Technology', 
    score: 85, 
    velocity: 'Rising', 
    mentions: '8.2k', 
    sources: 18, 
    trendUp: true 
  },
  { 
    topic: 'Minimalist Living', 
    category: 'Lifestyle', 
    score: 64, 
    velocity: 'Stable', 
    mentions: '15.1k', 
    sources: 42, 
    trendUp: false 
  },
  { 
    topic: 'Smart Home Tech', 
    category: 'Technology', 
    score: 78, 
    velocity: 'Emerging', 
    mentions: '5.9k', 
    sources: 12, 
    trendUp: true 
  },
];

const ProgressBar = ({ value }) => (
  <div className="w-full bg-slate-700/50 rounded-full h-2">
    <div 
      className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full" 
      style={{ width: `${value}%` }} 
    />
  </div>
);

const Trends = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Trends Analysis</h2>
          <p className="text-slate-400">Signals & topics radar powered by AI</p>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="secondary" className="hidden md:flex">
                <Filter size={18} className="mr-2" /> 
                Filters
            </Button>
            <Button>
                <Zap size={18} className="mr-2" />
                Scan New Trends
            </Button>
        </div>
      </div>

      <Card className="h-[400px]">
        <h3 className="text-lg font-semibold text-white mb-6">Topic Momentum Over Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#8b5cf6" 
              fillOpacity={1} 
              fill="url(#colorScore)" 
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Top Emerging Topics</h3>
            <Input icon={Search} placeholder="Search topics..." className="w-64" />
        </div>
        
        <Table headers={['Topic', 'Category', 'Trend Score', 'Velocity', 'Mentions', 'Sources', 'Actions']}>
          {topics.map((topic, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                        {idx + 1}
                    </div>
                    <span className="font-medium text-white">{topic.topic}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="default">{topic.category}</Badge>
              </TableCell>
              <TableCell className="w-48">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{topic.score}</span>
                    <ProgressBar value={topic.score} />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    {topic.velocity === 'High' && <Zap size={16} className="text-purple-400" />}
                    {topic.velocity === 'Rising' && <TrendingUp size={16} className="text-cyan-400" />}
                    <span className={topic.velocity === 'High' ? 'text-purple-400' : topic.velocity === 'Rising' ? 'text-cyan-400' : 'text-slate-400'}>
                        {topic.velocity}
                    </span>
                </div>
              </TableCell>
              <TableCell>{topic.mentions}</TableCell>
              <TableCell>{topic.sources}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" className="hover:bg-purple-500/20 hover:text-purple-300">
                    Analyze <ArrowRight size={16} className="ml-2" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>
    </div>
  );
};

export default Trends;
