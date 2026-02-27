import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    // State for tasks
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Top 5 AI Tools for Designers', description: 'Carousel post showcasing new AI design tools.', platform: 'instagram', status: 'new', date: 'Oct 24' },
        { id: 2, title: 'Future of Education Trends', description: 'Deep dive video script regarding EduGen analysis.', platform: 'youtube', status: 'in-progress', date: 'Oct 25' },
        { id: 3, title: 'Remote Work Productivity Hacks', description: 'Thread exploring efficient remote work setups.', platform: 'twitter', status: 'in-progress', date: 'Oct 26' },
        { id: 4, title: 'Sustainable Tech Unboxing', description: 'Short-form video for eco-friendly gadgets.', platform: 'tiktok', status: 'approved', date: 'Oct 28' },
        { id: 5, title: 'Synapse OS Feature Launch', description: 'Official press release and professional update.', platform: 'linkedin', status: 'approved', date: 'Oct 30' },
    ]);

    // State for Edit Modal
    const [editingTask, setEditingTask] = useState(null);

    const newTasks = tasks.filter(t => t.status === 'new');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const approvedTasks = tasks.filter(t => t.status === 'approved');
    const rejectedTasks = tasks.filter(t => t.status === 'rejected');

    const handleCreateContent = () => {
        navigate('/poster-generator');
    };

    const handleCardClick = (task) => {
        setEditingTask({ ...task });
    };

    const handleSaveTask = () => {
        if (!editingTask) return;
        setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
        setEditingTask(null);
    };

    const handleDeleteTask = () => {
        if (!editingTask) return;
        setTasks(prev => prev.filter(t => t.id !== editingTask.id));
        setEditingTask(null);
    };

    const KanbanCard = ({ item }) => (
      <div 
        onClick={() => handleCardClick(item)}
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/50 transition-colors cursor-pointer group shadow-sm"
      >
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

  return (
    <div className="h-full flex flex-col relative">
       <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Content Board</h2>
            <p className="text-slate-400">Manage and schedule content pipeline</p>
          </div>
          <Button onClick={handleCreateContent}>Create Content</Button>
       </div>

       <div className="flex-1 overflow-x-auto">
            <div className="flex gap-6 h-full min-w-max pb-4">
                <Column title="New Ideas" count={newTasks.length} items={newTasks} color="border-l-indigo-500" />
                <Column title="In Progress" count={inProgressTasks.length} items={inProgressTasks} color="border-l-cyan-500" />
                <Column title="Approved" count={approvedTasks.length} items={approvedTasks} color="border-l-emerald-500" />
                <Column title="Rejected" count={rejectedTasks.length} items={rejectedTasks} color="border-l-red-500" />
            </div>
       </div>

       {/* Edit Modal */}
       {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Edit Content Card</h3>
                    <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500"
                            value={editingTask.title}
                            onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                        <textarea 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 h-24 resize-none"
                            value={editingTask.description}
                            onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Platform</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500"
                                value={editingTask.platform}
                                onChange={e => setEditingTask({...editingTask, platform: e.target.value})}
                            >
                                <option value="instagram">Instagram</option>
                                <option value="youtube">YouTube</option>
                                <option value="twitter">Twitter</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="tiktok">TikTok</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500"
                                value={editingTask.status}
                                onChange={e => setEditingTask({...editingTask, status: e.target.value})}
                            >
                                <option value="new">New Ideas</option>
                                <option value="in-progress">In Progress</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <button 
                        onClick={handleDeleteTask}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                        Delete Card
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setEditingTask(null)}
                            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveTask}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
       )}
    </div>
  );
};

export default Content;
