import React from 'react';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  MoreHorizontal,
  Bot
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Jan', purple: 4000, cyan: 2400, pink: 2400 },
  { name: 'Feb', purple: 3000, cyan: 1398, pink: 2210 },
  { name: 'Mar', purple: 2000, cyan: 9800, pink: 2290 },
  { name: 'Apr', purple: 2780, cyan: 3908, pink: 2000 },
  { name: 'May', purple: 1890, cyan: 4800, pink: 2181 },
  { name: 'Jun', purple: 2390, cyan: 3800, pink: 2500 },
  { name: 'Jul', purple: 3490, cyan: 4300, pink: 2100 },
];

const KPICard = ({ title, value, trend, icon: Icon, trendUp }) => (
  <Card className="relative overflow-hidden group bg-card border-border">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-foreground">
      <Icon size={64} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 text-muted-foreground mb-2">
        <Icon size={18} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-end gap-3">
        <h3 className="text-3xl font-bold text-foreground">{value}</h3>
        <span className={`text-sm font-medium px-1.5 py-0.5 rounded ${trendUp ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'}`}>
          {trend}
        </span>
      </div>
    </div>
  </Card>
);

const Dashboard = () => {
  const { theme } = useTheme();
  
  // Chart Colors based on theme - using CSS variables would be ideal but Recharts needs hex strings in some places or strict manipulation
  // We can use the strings we know are associated with our CSS vars for simplicity in this context
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipText = theme === 'dark' ? '#f8fafc' : '#0f172a';

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Momentum Score" 
          value="92" 
          trend="+12%" 
          icon={Zap} 
          trendUp={true} 
        />
        <KPICard 
          title="Engagement Trend" 
          value="185k" 
          trend="+24%" 
          icon={Users} 
          trendUp={true} 
        />
        <KPICard 
          title="Topic Velocity" 
          value="Fast" 
          trend="3 emerging" 
          icon={TrendingUp} 
          trendUp={true} 
        />
        <KPICard 
          title="Publish Readiness" 
          value="87%" 
          trend="5 ready" 
          icon={CheckCircle} 
          trendUp={true} 
        />
      </div>

      {/* Main Chart Section */}
      <Card className="h-[400px] bg-card border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Trends Overview</h3>
            <p className="text-sm text-muted-foreground">Competitive intelligence analysis across platforms</p>
          </div>
          <Button variant="secondary" size="sm">Download Report</Button>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke={axisColor} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              stroke={axisColor} 
              axisLine={false} 
              tickLine={false} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px' }}
              itemStyle={{ color: tooltipText }}
              labelStyle={{ color: tooltipText }}
            />
            <Line 
              type="monotone" 
              dataKey="purple" 
              stroke="#8b5cf6" 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 6, fill: '#8b5cf6' }} 
            />
            <Line 
              type="monotone" 
              dataKey="cyan" 
              stroke="#22d3ee" 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 6, fill: '#22d3ee' }} 
            />
             <Line 
              type="monotone" 
              dataKey="pink" 
              stroke="#ec4899" 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 6, fill: '#ec4899' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Bottom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emerging Topics */}
        <Card className="bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Emerging Topics</h3>
            <Button variant="ghost" size="icon"><MoreHorizontal size={18}/></Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Sustainable Materials</h4>
                  <p className="text-xs text-muted-foreground">High velocity • 12k mentions</p>
                </div>
              </div>
              <Badge variant="emerging">Earlier Adopter</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">AI-Powered Design</h4>
                  <p className="text-xs text-muted-foreground">Trending • 8.5k mentions</p>
                </div>
              </div>
              <Badge variant="trending">Trending</Badge>
            </div>
          </div>
        </Card>

        {/* Next Best Actions */}
        <Card className="bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Next Best Actions</h3>
            <Badge variant="purple">AI Suggested</Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Create content plan for "Sustainable Materials"</span>
              </div>
              <ArrowRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Schedule post for tomorrow at 10:00 AM</span>
              </div>
              <ArrowRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-pink-500" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Review 2 pending approvals</span>
              </div>
              <ArrowRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <Button className="w-full">
              <Bot size={18} className="mr-2" />
              Ask AI Assistant
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
