import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  Zap, 
  PenTool, 
  Compass, 
  CheckSquare, 
  Calendar, 
  BarChart2, 
  ArrowRight 
} from 'lucide-react';

const AITools = () => {
  const tools = [
    { 
        icon: Zap, 
        title: 'Trend Scanner', 
        description: 'Analyzes millions of data points to identify emerging market trends before they peak.', 
        status: 'Active', 
        color: 'from-purple-500 to-indigo-500' 
    },
    { 
        icon: PenTool, 
        title: 'Content Generator', 
        description: 'Generates high-engagement social media captions, blog outlines, and video scripts.', 
        status: 'Active', 
        color: 'from-cyan-500 to-blue-500' 
    },
    { 
        icon: Compass, 
        title: 'Strategy Copilot', 
        description: 'Provides strategic recommendations based on competitor analysis and performance goals.', 
        status: 'New', 
        color: 'from-emerald-500 to-teal-500' 
    },
    { 
        icon: CheckSquare, 
        title: 'Approval Assistant', 
        description: 'Automated compliance checks and brand voice verification for all content.', 
        status: 'Active', 
        color: 'from-pink-500 to-rose-500' 
    },
    { 
        icon: Calendar, 
        title: 'Calendar Optimizer', 
        description: 'Suggests the optimal posting times and frequency for maximum reach.', 
        status: 'Beta', 
        color: 'from-amber-500 to-orange-500' 
    },
    { 
        icon: BarChart2, 
        title: 'Performance Predictor', 
        description: 'Forecasts engagement metrics for planned content using historical data.', 
        status: 'Active', 
        color: 'from-blue-500 to-indigo-500' 
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">AI Intelligence Modules</h2>
        <p className="text-slate-400">Power up your workflow with specialized AI agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, idx) => (
            <Card key={idx} className="group hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-lg`}>
                        <tool.icon size={24} />
                    </div>
                    {tool.status && (
                        <Badge variant={tool.status === 'Active' ? 'success' : 'info'}>{tool.status}</Badge>
                    )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {tool.title}
                </h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {tool.description}
                </p>
                
                <Button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 group-hover:border-purple-500/30 text-slate-300 group-hover:text-white justify-between px-4">
                    Launch Module <ArrowRight size={16} />
                </Button>
            </Card>
        ))}
      </div>
    </div>
  );
};

export default AITools;
