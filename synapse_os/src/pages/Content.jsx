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
  User,
  Video,
  Trash2,
  CheckCircle,
  Clock as ClockIcon,
  Music2,
  Minus
} from 'lucide-react';
import Button from '../components/ui/Button';
import { getVideos, deleteVideo, updateVideo } from '../services/hygenService';
import { useEffect } from 'react';

const PlatformIcon = ({ platform }) => {
  switch (platform) {
    case 'instagram': return <Instagram size={16} className="text-pink-500" />;
    case 'youtube': return <Youtube size={16} className="text-red-500" />;
    case 'linkedin': return <Linkedin size={16} className="text-blue-500" />;
    case 'twitter': return <Twitter size={16} className="text-sky-500" />;
    case 'tiktok': return <Music2 size={16} className="text-white" />;
    default: return null;
  }
};



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
    const [selectedItems, setSelectedItems] = useState(new Set());

    const newTasks = tasks.filter(t => t.status === 'new');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const approvedTasks = tasks.filter(t => t.status === 'approved');
    const rejectedTasks = tasks.filter(t => t.status === 'rejected');

    const [videos, setVideos] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(true);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        setLoadingVideos(true);
        try {
            const data = await getVideos();
            setVideos(data || []);
        } catch (err) {
            console.error("Failed to fetch videos:", err);
        } finally {
            setLoadingVideos(false);
        }
    };

    const handleDeleteVideo = async (id, skipConfirm = false) => {
        if (!skipConfirm && !window.confirm("Are you sure you want to delete this video?")) return;
        try {
            await deleteVideo(id);
            setVideos(prev => prev.filter(v => v.id !== id));
        } catch (err) {
            console.error("Failed to delete video:", err);
            alert("Failed to delete video. Please check console.");
        }
    };

    const handleApproveVideo = async (id) => {
        handleUpdateVideoStatus(id, 'approved');
    };

    const handleUpdateVideoStatus = async (id, newStatus) => {
        try {
            await updateVideo(id, { status: newStatus });
            // Refresh list
            fetchVideos();
        } catch (err) {
            console.error("Failed to update video status:", err);
        }
    };

    const handleCreateContent = () => {
        navigate('/heygen-creator');
    };

    const handleCardClick = (task) => {
        setEditingTask({ ...task });
    };

    const handleSaveTask = () => {
        if (!editingTask) return;
        if (editingTask.type === 'video') {
            handleUpdateVideoStatus(editingTask.id, editingTask.status);
        } else {
            setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
        }
        setEditingTask(null);
    };

    const handleDeleteTask = () => {
        if (!editingTask) return;
        if (editingTask.type === 'video') {
            handleDeleteVideo(editingTask.id);
        } else {
            setTasks(prev => prev.filter(t => t.id !== editingTask.id));
        }
        setEditingTask(null);
    };

    // Drag handlers
    const handleDragStart = (e, item) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, type: item.type }));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        try {
            const dataStr = e.dataTransfer.getData('application/json');
            if (!dataStr) return;
            const data = JSON.parse(dataStr);
            if (data && data.id) {
                updateItemStatus(data.id, data.type, targetStatus);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateItemStatus = async (id, type, newStatus) => {
        if (type === 'video') {
            await handleUpdateVideoStatus(id, newStatus);
        } else {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        }
    };

    const toggleSelection = (e, id, type) => {
        e.stopPropagation();
        const key = `${type}-${id}`;
        const newSet = new Set(selectedItems);
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        setSelectedItems(newSet);
    };

    const handleBulkMove = async (itemsToMove, targetStatus) => {
        if (targetStatus === 'delete') {
            if (!window.confirm(`Are you sure you want to delete ${itemsToMove.length} items?`)) return;
            const tasksToDelete = itemsToMove.filter(i => i.type === 'task').map(i => i.id);
            if (tasksToDelete.length > 0) {
                setTasks(prev => prev.filter(t => !tasksToDelete.includes(t.id)));
            }
            const videosToDelete = itemsToMove.filter(i => i.type === 'video').map(i => i.id);
            for (const vid of videosToDelete) {
                await handleDeleteVideo(vid, true);
            }
        } else {
            const tasksToUpdate = itemsToMove.filter(i => i.type === 'task').map(i => i.id);
            if (tasksToUpdate.length > 0) {
                setTasks(prev => prev.map(t => tasksToUpdate.includes(t.id) ? { ...t, status: targetStatus } : t));
            }
            const videosToUpdate = itemsToMove.filter(i => i.type === 'video').map(i => i.id);
            for (const vid of videosToUpdate) {
                await handleUpdateVideoStatus(vid, targetStatus);
            }
        }
        setSelectedItems(new Set()); // clear selection after moving
    };

    const KanbanCard = ({ item }) => (
      <div 
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onClick={() => handleCardClick(item)}
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/50 transition-colors cursor-pointer group shadow-sm flex flex-col"
      >
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    checked={selectedItems.has(`${item.type}-${item.id}`)}
                    onChange={(e) => toggleSelection(e, item.id, item.type)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 checked:bg-purple-500 focus:ring-purple-500 cursor-pointer"
                />
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

        {/* Action / Next step */}
        <div className="flex items-center justify-end pt-3 mt-3 border-t border-slate-700/50" onClick={e => e.stopPropagation()}>
             <div className="flex items-center gap-1.5">
                 <button
                     onClick={(e) => {
                         e.stopPropagation();
                         updateItemStatus(item.id, item.type, null);
                     }}
                     className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded transition-colors text-[10px] font-medium flex items-center gap-1 border border-slate-700/50"
                     title="Remove from workflow"
                 >
                    <Minus size={12} /> Remove
                 </button>
                 {item.status === 'rejected' && (
                     <button 
                         onClick={(e) => {
                             e.stopPropagation();
                             if (item.type === 'video') {
                                 handleDeleteVideo(item.id);
                             } else {
                                 setTasks(prev => prev.filter(t => t.id !== item.id));
                             }
                         }}
                         className="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 rounded text-[10px] transition-colors font-medium flex items-center gap-1"
                     >
                         <Trash2 size={12} /> Delete
                     </button>
                 )}
             </div>
        </div>
      </div>
    );

    const VideoCard = ({ video }) => {
      const [showMenu, setShowMenu] = useState(false);
      return (
      <div className="w-[320px] bg-slate-800/80 backdrop-blur-md border border-purple-500/30 rounded-2xl overflow-hidden group hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all flex-shrink-0 relative">
        <div className="aspect-video relative bg-black">
          <video 
            src={video.video_url} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            controls
            muted
          />
          <div className="absolute top-3 right-3 flex gap-2 z-10 pointer-events-none">
            <div className="bg-purple-600 text-white p-2.5 rounded-lg shadow-lg">
              <Video size={16} />
            </div>
          </div>
        </div>
        <div className="p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={(video.platform || '').toLowerCase()} />
              <Badge variant="info" className="text-[10px] uppercase font-bold">{video.ratio || 'N/A'}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">{new Date(video.created_at).toLocaleDateString()}</span>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteVideo(video.id); }}
                className="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 p-1 rounded-md transition-colors cursor-pointer pointer-events-auto shadow-sm"
                title="Delete Video"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <h4 className="font-bold text-slate-200 text-sm line-clamp-1 mb-4">{video.topic || 'Untitled Creation'}</h4>
          
          <div className="flex flex-col gap-2 relative z-20">
            {['new', 'in-progress', 'approved', 'rejected'].includes(video.status) ? (
              <div className="w-full flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-300">
                <span className="flex items-center gap-2 font-medium">
                  <div className={`w-2 h-2 rounded-full ${
                    video.status === 'new' ? 'bg-indigo-500' :
                    video.status === 'in-progress' ? 'bg-cyan-500' :
                    video.status === 'approved' ? 'bg-emerald-500' :
                    'bg-red-500'
                  }`} />
                  {video.status === 'new' ? 'New Idea' :
                   video.status === 'in-progress' ? 'In Progress' :
                   video.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">In Workflow</span>
              </div>
            ) : (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-lg px-3 py-2 text-xs text-white transition-colors cursor-pointer pointer-events-auto"
                >
                  <Plus size={14} /> Add to Workflow
                </button>
                {showMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden shadow-purple-500/10">
                    {[
                      { id: 'new', label: 'New Idea' },
                      { id: 'in-progress', label: 'In Progress' },
                      { id: 'approved', label: 'Approved' },
                      { id: 'rejected', label: 'Rejected' }
                    ].map(status => (
                       <button
                         key={status.id}
                         onClick={(e) => {
                           e.stopPropagation();
                           handleUpdateVideoStatus(video.id, status.id);
                           setShowMenu(false);
                         }}
                         className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700/50 last:border-0 pointer-events-auto"
                       >
                         {status.label}
                       </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )};

    const getColumnItems = (status) => {
        const filteredTasks = tasks.filter(t => t.status === status).map(t => ({ ...t, type: 'task' }));
        const filteredVideos = videos.filter(v => v.status === status).map(v => ({ 
            id: v.id, 
            type: 'video', 
            title: v.topic || 'Video Generation', 
            description: v.status_message || 'Generated video content mapped to workflow queue.', 
            platform: v.platform || 'instagram', 
            status: v.status, 
            date: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
        }));
        return [...filteredTasks, ...filteredVideos];
    };

    const UnifiedColumn = ({ title, status, color }) => {
        const items = getColumnItems(status);
        const selectedInColumn = items.filter(item => selectedItems.has(`${item.type}-${item.id}`));
        const hasSelection = selectedInColumn.length > 0;
        const itemsToMove = hasSelection ? selectedInColumn : items;

        return (
            <div 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="flex-shrink-0 w-80 flex flex-col h-full rounded-xl bg-slate-900/30 border border-slate-800/50"
            >
                <div className={`p-4 border-b border-slate-800/50 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10 rounded-t-xl border-l-4 ${color}`}>
                    <h3 className="font-semibold text-slate-200">{title}</h3>
                    <div className="flex items-center gap-2">
                        {hasSelection && <Badge variant="info" className="text-[10px]">{selectedInColumn.length} selected</Badge>}
                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs font-medium">{items.length}</span>
                    </div>
                </div>
                <div className="p-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar min-h-[150px]">
                    {items.map((item) => (
                        <KanbanCard key={`${item.type}-${item.id}`} item={item} />
                    ))}
                    {items.length === 0 && (
                        <div className="text-center py-12 text-slate-600 text-sm border border-dashed border-slate-800 rounded-lg pointer-events-none">
                            No items in {title.toLowerCase()}
                        </div>
                    )}
                </div>
                <div className="p-3 border-t border-slate-800/50">
                    <select 
                        className="w-full bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors cursor-pointer appearance-none text-center font-medium shadow-sm"
                        value=""
                        onChange={(e) => handleBulkMove(itemsToMove, e.target.value)}
                    >
                        <option value="" disabled>&#8644; Move {hasSelection ? `${selectedInColumn.length} Selected` : 'All'} To...</option>
                        <option value="new" disabled={status === 'new'}>New Ideas</option>
                        <option value="in-progress" disabled={status === 'in-progress'}>In Progress</option>
                        <option value="approved" disabled={status === 'approved'}>Approved</option>
                        <option value="rejected" disabled={status === 'rejected'}>Rejected</option>
                        {status === 'rejected' && <option value="delete" className="text-red-400">Delete Permanently</option>}
                    </select>
                </div>
            </div>
        );
    };

  return (
    <div className="h-full flex flex-col relative">
       <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Content Board</h2>
            <p className="text-slate-400">Manage and schedule content pipeline</p>
          </div>
          {/* Removed redundant Create Content button that pointed to /poster-generator */}
       </div>

       {/* New Video Generations Section (Queue) - Shows all generated videos */}
       {videos.length > 0 && (
       <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <ClockIcon size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">Uncategorized Generations</h3>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
            {videos.map(video => (
                <VideoCard key={video.id} video={video} />
            ))}
          </div>
       </div>
       )}

       <div className="flex items-center justify-between mb-4 mt-6">
          <h3 className="text-xl font-bold text-white">Content Workflow</h3>
       </div>

       <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-6 h-full min-w-max">
                <UnifiedColumn title="New Ideas" status="new" color="border-l-indigo-500" />
                <UnifiedColumn title="In Progress" status="in-progress" color="border-l-cyan-500" />
                <UnifiedColumn title="Approved" status="approved" color="border-l-emerald-500" />
                <UnifiedColumn title="Rejected" status="rejected" color="border-l-red-500" />
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
