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
  User 
} from 'lucide-react';

const Approvals = () => {
  const [selectedItem, setSelectedItem] = useState(0);

  const approvalItems = [
    { 
      id: 0, 
      title: 'Sustainable Tech Unboxing', 
      platform: 'TikTok', 
      author: 'Sarah J.', 
      status: 'Ready', 
      date: 'Oct 28', 
      content: 'Hey guys! Checking out the new EcoPhone today. The packaging is 100% biodegradable and look at this texture! 🌱 #EcoTech #Sustainability #Unboxing',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5fa5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    { 
      id: 1, 
      title: 'Q3 Market Analysis', 
      platform: 'LinkedIn', 
      author: 'Mike R.', 
      status: 'Pending', 
      date: 'Oct 30', 
      content: 'Our Q3 analysis shows a 40% increase in renewable energy adoption. Read the full report below. 📈 #MarketTrends #RenewableEnergy',
      image: null
    },
    { 
        id: 2, 
        title: 'Design Tips Carousel', 
        platform: 'Instagram', 
        author: 'Jessica L.', 
        status: 'Revision', 
        date: 'Nov 02', 
        content: 'Swipe left for 5 tips to improve your UI design workflow! 🎨 #DesignTips #UIUX',
        image: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Approval Queue */}
      <Card className="flex flex-col h-full">
        <h2 className="text-xl font-bold text-white mb-4">Approval Queue</h2>
        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {approvalItems.map((item, idx) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(idx)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedItem === idx ? 'bg-purple-500/10 border-purple-500/50' : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant={item.status === 'Ready' ? 'success' : item.status === 'Revision' ? 'warning' : 'default'}>
                    {item.status}
                </Badge>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {item.date}
                </div>
              </div>
              <h3 className="font-medium text-slate-200 mb-1">{item.title}</h3>
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
                     <div>
                        <h3 className="font-bold text-white text-lg">{approvalItems[selectedItem].title}</h3>
                        <p className="text-sm text-slate-400">Created by {approvalItems[selectedItem].author} • {approvalItems[selectedItem].platform}</p>
                     </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon"><AlertCircle size={20} /></Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar">
                <div className="bg-black/20 rounded-xl p-6 border border-slate-800/50 max-w-2xl mx-auto">
                    {approvalItems[selectedItem].image && (
                         <div className="aspect-video bg-slate-800 rounded-lg mb-4 overflow-hidden">
                             <img src={approvalItems[selectedItem].image} alt="Preview" className="w-full h-full object-cover" />
                         </div>
                    )}
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {approvalItems[selectedItem].content}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-purple-400 text-sm">#EcoTech</span>
                        <span className="text-purple-400 text-sm">#Sustainability</span>
                        <span className="text-purple-400 text-sm">#Unboxing</span>
                    </div>
                </div>
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
