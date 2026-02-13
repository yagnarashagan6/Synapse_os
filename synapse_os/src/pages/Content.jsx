import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { 
  Instagram, 
  Youtube, 
  Linkedin, 
  Twitter, 
  MoreHorizontal, 
  Plus, 
  Calendar as CalendarIcon, 
  User 
} from 'lucide-react';
import Button from '../components/ui/Button';

const PlatformIcon = ({ platform }) => {
  switch (platform) {
    case 'instagram': return <Instagram size={16} className="text-pink-500" />;
    case 'youtube': return <Youtube size={16} className="text-red-500" />;
    case 'linkedin': return <Linkedin size={16} className="text-blue-500" />;
    case 'twitter': return <Twitter size={16} className="text-sky-500" />;
    case 'tiktok': return <span className="text-xs font-bold text-black bg-white px-1 rounded">Tk</span>;
    default: return null;
  }
};

const KanbanCard = ({ item }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/50 transition-colors cursor-pointer group shadow-sm">
    <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                <PlatformIcon platform={item.platform} />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{item.platform}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 p-0 text-slate-500">
            <MoreHorizontal size={14} />
        </Button>
    </div>
    
    <h4 className="font-medium text-slate-200 mb-2 line-clamp-2">{item.title}</h4>
    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description}</p>
    
    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-400">
            <CalendarIcon size={14} />
            <span className="text-xs">{item.date}</span>
        </div>
        <div className="flex -space-x-2">
             <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white ring-2 ring-slate-800">
                JD
             </div>
        </div>
    </div>
  </div>
);

const Column = ({ title, count, items, color }) => (
  <div className="flex-shrink-0 w-80 flex flex-col h-full rounded-xl bg-slate-900/30 border border-slate-800/50">
    <div className={`p-4 border-b border-slate-800/50 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10 rounded-t-xl border-l-4 ${color}`}>
        <h3 className="font-semibold text-slate-200">{title}</h3>
        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs font-medium">{count}</span>
    </div>
    <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
        {items.map((item) => (
            <KanbanCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
            <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-slate-800 rounded-lg">
                No items
            </div>
        )}
    </div>
    <div className="p-3 border-t border-slate-800/50">
        <button className="w-full py-2 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium">
            <Plus size={16} className="mr-2" /> Add Task
        </button>
    </div>
  </div>
);

const Content = () => {
    // Mock Data
    const tasks = [
        { id: 1, title: 'Top 5 AI Tools for Designers', description: 'Carousel post showcasing new AI design tools.', platform: 'instagram', status: 'new', date: 'Oct 24' },
        { id: 2, title: 'Future of Education Trends', description: 'Deep dive video script regarding EduGen analysis.', platform: 'youtube', status: 'in-progress', date: 'Oct 25' },
        { id: 3, title: 'Remote Work Productivity Hacks', description: 'Thread exploring efficient remote work setups.', platform: 'twitter', status: 'in-progress', date: 'Oct 26' },
        { id: 4, title: 'Sustainable Tech Unboxing', description: 'Short-form video for eco-friendly gadgets.', platform: 'tiktok', status: 'approved', date: 'Oct 28' },
        { id: 5, title: 'Synapse OS Feature Launch', description: 'Official press release and professional update.', platform: 'linkedin', status: 'approved', date: 'Oct 30' },
    ];

    const newTasks = tasks.filter(t => t.status === 'new');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const approvedTasks = tasks.filter(t => t.status === 'approved');
    const rejectedTasks = tasks.filter(t => t.status === 'rejected');

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Content Board</h2>
            <p className="text-slate-400">Manage and schedule content pipeline</p>
          </div>
          <Button>Create Content</Button>
       </div>

       <div className="flex-1 overflow-x-auto">
            <div className="flex gap-6 h-full min-w-max pb-4">
                <Column title="New Ideas" count={newTasks.length} items={newTasks} color="border-l-indigo-500" />
                <Column title="In Progress" count={inProgressTasks.length} items={inProgressTasks} color="border-l-cyan-500" />
                <Column title="Approved" count={approvedTasks.length} items={approvedTasks} color="border-l-emerald-500" />
                <Column title="Rejected" count={rejectedTasks.length} items={rejectedTasks} color="border-l-red-500" />
            </div>
       </div>
    </div>
  );
};

export default Content;
