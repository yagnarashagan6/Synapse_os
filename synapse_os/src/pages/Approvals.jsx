import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Clock, 
  User,
  Video,
  Play
} from 'lucide-react';
import { getVideos } from '../services/hygenService';
import { useEffect } from 'react';

const Approvals = () => {
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getVideos();
        // Convert video data to approval item format
        // Only show videos that have been marked as 'approved' in the content container
        const formatted = (data || [])
          .filter(v => v.status === 'approved')
          .map(v => ({
            id: v.id,
          title: v.topic || "AI Content Piece",
          platform: v.platform || "Social Media",
          author: "HeyGen AI",
          status: "Ready",
          date: new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          content: `AI Generated Video for ${v.topic}. Status: Completed.`,
          video_url: v.video_url,
          is_video: true
        }));
        
        // Combine with existing defaults if any, but prioritize videos
        setVideos(formatted.length > 0 ? formatted : [
          { 
            id: 'd1', 
            title: 'Sustainable Tech Unboxing', 
            platform: 'TikTok', 
            author: 'Sarah J.', 
            status: 'Ready', 
            date: 'Oct 28', 
            content: 'Hey guys! Checking out the new EcoPhone today. The packaging is 100% biodegradable and look at this texture! 🌱 #EcoTech #Sustainability #Unboxing',
            image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5fa5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
          }
        ]);
      } catch (err) {
        console.error("Failed to fetch approvals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const selectedItem = videos[selectedItemIdx] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Approval Queue */}
      <Card className="flex flex-col h-full">
        <h2 className="text-xl font-bold text-white mb-4">Approval Queue</h2>
        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
             [1,2,3].map(i => <div key={i} className="h-24 bg-slate-800/30 rounded-xl animate-pulse" />)
          ) : videos.map((item, idx) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItemIdx(idx)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedItemIdx === idx ? 'bg-purple-500/10 border-purple-500/50' : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant={item.status === 'Ready' ? 'success' : item.status === 'Revision' ? 'warning' : 'default'}>
                    {item.status}
                </Badge>
                {item.is_video && <Video size={14} className="text-purple-400" />}
                <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {item.date}
                </div>
              </div>
              <h3 className="font-medium text-slate-200 mb-1 line-clamp-1">{item.title}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <User size={12} /> {item.author} • {item.platform}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Content Preview */}
      <div className="lg:col-span-2 h-full flex flex-col">
        <Card className="flex-1 flex flex-col h-full bg-slate-900/50">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <User size={20} className="text-slate-400" />
                     </div>
                     {selectedItem ? (
                       <div>
                        <h3 className="font-bold text-white text-lg">{selectedItem.title}</h3>
                        <p className="text-sm text-slate-400">Created by {selectedItem.author} • {selectedItem.platform}</p>
                       </div>
                     ) : (
                       <div>
                        <h3 className="font-bold text-white text-lg">No Item Selected</h3>
                       </div>
                     )}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon"><AlertCircle size={20} /></Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar">
                {selectedItem && (
                  <div className="bg-black/20 rounded-xl p-6 border border-slate-800/50 max-w-2xl mx-auto">
                      {selectedItem.is_video ? (
                        <div className="aspect-video bg-black rounded-xl mb-6 overflow-hidden border border-slate-700 shadow-2xl relative group">
                           <video 
                              src={selectedItem.video_url} 
                              controls 
                              className="w-full h-full object-contain"
                           />
                        </div>
                      ) : selectedItem.image && (
                           <div className="aspect-video bg-slate-800 rounded-lg mb-4 overflow-hidden">
                               <img src={selectedItem.image} alt="Preview" className="w-full h-full object-cover" />
                           </div>
                      )}
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {selectedItem.content}
                      </p>
                  </div>
                )}
            </div>

            <div className="pt-4 border-t border-slate-700/50 flex items-center justify-end gap-3">
                <Button variant="danger" className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20">
                    <XCircle size={18} className="mr-2" /> Reject
                </Button>
                <Button variant="secondary" className="text-orange-400 hover:text-orange-300 border-orange-500/30 hover:bg-orange-500/10">
                    <AlertCircle size={18} className="mr-2" /> Request Revision
                </Button>
                <Button variant="primary" className="bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20">
                    <CheckCircle size={18} className="mr-2" /> Approve Content
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default Approvals;
