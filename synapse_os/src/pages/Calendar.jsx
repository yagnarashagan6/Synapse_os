import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Twitter,
  MoreHorizontal 
} from 'lucide-react';

const SocialIcon = ({ type, className }) => {
  switch (type) {
    case 'instagram': return <Instagram size={12} className={className} />;
    case 'linkedin': return <Linkedin size={12} className={className} />;
    case 'youtube': return <Youtube size={12} className={className} />;
    case 'twitter': return <Twitter size={12} className={className} />;
    case 'tiktok': return <span className={`font-bold text-[8px] ${className}`}>Tk</span>;
    default: return null;
  }
};

const Calendar = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 35 }, (_, i) => i + 1 > 31 ? i + 1 - 31 : i + 1); // Mock logic for visual simplicity
  
  // Mock events
  const events = {
    5: [{ type: 'instagram', title: 'Story' }],
    12: [{ type: 'youtube', title: 'Review' }],
    18: [{ type: 'linkedin', title: 'Post' }],
    19: [{ type: 'instagram', title: 'Reel' }],
    24: [{ type: 'twitter', title: 'Thread' }],
    27: [{ type: 'tiktok', title: 'Viral' }],
  };

  const upcomingPosts = [
    { title: 'Instagram Story', audience: '125k', icon: Instagram, color: 'text-pink-500', date: 'Tomorrow, 10:00 AM' },
    { title: 'TikTok Unboxing', audience: '280k', icon: ({className}) => <span className={`font-bold ${className}`}>Tk</span>, color: 'text-white', date: 'Oct 28, 4:00 PM' },
    { title: 'LinkedIn Post', audience: '45k', icon: Linkedin, color: 'text-blue-500', date: 'Oct 30, 9:00 AM' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 flex flex-col h-full">
            <Card className="flex-1 flex flex-col p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white">October 2026</h2>
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                            <button className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><ChevronLeft size={20}/></button>
                            <button className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><ChevronRight size={20}/></button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Button variant="secondary" size="sm" className="flex-1 md:flex-none">Day</Button>
                        <Button variant="secondary" size="sm" className="flex-1 md:flex-none">Week</Button>
                        <Button size="sm" className="flex-1 md:flex-none bg-slate-700 text-white border-none shadow-none">Month</Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 mb-4">
                    {days.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-slate-800/50 rounded-lg overflow-hidden flex-1 border border-slate-700/50">
                    {Array.from({ length: 35 }).map((_, i) => {
                        const day = i - 2; // Offset for mock
                        const isCurrentMonth = day > 0 && day <= 31;
                        const dateEvents = events[day] || [];

                        return (
                            <div key={i} className={`bg-slate-900/40 p-2 min-h-[80px] hover:bg-slate-800/40 transition-colors cursor-pointer relative ${!isCurrentMonth ? 'opacity-30' : ''}`}>
                                <span className={`text-sm ${isCurrentMonth ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {day > 0 && day <= 31 ? day : (day <= 0 ? 30 + day : day - 31)}
                                </span>
                                <div className="mt-2 space-y-1">
                                    {dateEvents.map((evt, idx) => (
                                        <div key={idx} className="flex items-center gap-1 p-1 rounded bg-purple-500/20 border border-purple-500/20 text-[10px] text-purple-200 overflow-hidden">
                                            <SocialIcon type={evt.type} className="flex-shrink-0" />
                                            <span className="truncate">{evt.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            <Card className="h-full">
                <h3 className="text-lg font-semibold text-white mb-6">Upcoming Content</h3>
                <div className="space-y-4">
                    {upcomingPosts.map((post, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <div className={`p-2 rounded-lg bg-slate-900 border border-slate-700 ${post.color}`}>
                                <post.icon size={20} className={post.color === 'text-white' ? '' : ''}/>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-200">{post.title}</h4>
                                <div className="flex items-center gap-2 mt-1 mb-3">
                                    <Badge variant="info">{post.audience}</Badge>
                                </div>
                                <p className="text-xs text-slate-400">{post.date}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                                <MoreHorizontal size={16} />
                            </Button>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8">
                    <Button className="w-full">Schedule Content</Button>
                </div>
            </Card>
        </div>
    </div>
  );
};

export default Calendar;
