import React, { useState, useEffect } from 'react';
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
  MoreHorizontal,
  X
} from 'lucide-react';

const SocialIcon = ({ type, className }) => {
  switch (type?.toLowerCase()) {
    case 'instagram': return <Instagram size={12} className={className} />;
    case 'linkedin': return <Linkedin size={12} className={className} />;
    case 'youtube': return <Youtube size={12} className={className} />;
    case 'twitter': return <Twitter size={12} className={className} />;
    case 'tiktok': return <span className={`font-bold text-[8px] ${className}`}>Tk</span>;
    default: return null;
  }
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [postedEvents, setPostedEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("synapse_posted_events");
    if (saved) {
      try {
        setPostedEvents(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();
  const daysInPrevMonth = new Date(year, currentDate.getMonth(), 0).getDate();

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const gridCells = [];
  
  // Prev month padding
  for (let i = 0; i < firstDayOfMonth; i++) {
    gridCells.push({
      day: daysInPrevMonth - firstDayOfMonth + i + 1,
      isCurrentMonth: false,
      dateObj: new Date(year, currentDate.getMonth() - 1, daysInPrevMonth - firstDayOfMonth + i + 1)
    });
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push({
      day: i,
      isCurrentMonth: true,
      dateObj: new Date(year, currentDate.getMonth(), i)
    });
  }
  
  // Next month padding
  const remainingCells = 35 - gridCells.length;
  // If we need 6 rows: 42 cells. Otherwise 35 cells for 5 rows is usually enough unless first day is Fri/Sat. Let's use 42 to be safe and uniform.
  const paddingAfter = 42 - gridCells.length;
  for (let i = 1; i <= paddingAfter; i++) {
    gridCells.push({
      day: i,
      isCurrentMonth: false,
      dateObj: new Date(year, currentDate.getMonth() + 1, i)
    });
  }

  // Map events to date strings "YYYY-MM-DD"
  const eventsByDate = {};
  postedEvents.forEach(evt => {
    if (evt.timestamp) {
      const dateString = new Date(evt.timestamp).toISOString().split('T')[0];
      if (!eventsByDate[dateString]) eventsByDate[dateString] = [];
      eventsByDate[dateString].push(evt);
    }
  });

  // Keep some mocked upcoming posts just for UI fill if needed, or replace with real data
  const upcomingPosts = postedEvents.slice().reverse().slice(0, 3).map(evt => ({
    title: evt.title,
    audience: 'N/A', // Wait for real metrics in future
    type: evt.type,
    color: evt.type === 'instagram' ? 'text-pink-500' : 'text-blue-500',
    date: new Date(evt.timestamp).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})
  }));

  // Fallback if empty
  if (upcomingPosts.length === 0) {
    upcomingPosts.push({ title: 'Instagram Story', type: 'instagram', audience: '125k', color: 'text-pink-500', date: 'Tomorrow, 10:00 AM' });
    upcomingPosts.push({ title: 'LinkedIn Post', type: 'linkedin', audience: '45k', color: 'text-blue-500', date: 'Oct 30, 9:00 AM' });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full relative">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 flex flex-col h-full">
            <Card className="flex-1 flex flex-col p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white">{monthName} {year}</h2>
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                            <button onClick={prevMonth} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><ChevronLeft size={20}/></button>
                            <button onClick={nextMonth} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><ChevronRight size={20}/></button>
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
                    {gridCells.map((cell, i) => {
                        // Offset timezone for local matching
                        const dateString = new Date(cell.dateObj.getTime() - (cell.dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                        const dateEvents = eventsByDate[dateString] || [];

                        return (
                            <div key={i} className={`bg-slate-900/40 p-2 min-h-[100px] hover:bg-slate-800/40 transition-colors cursor-pointer relative ${!cell.isCurrentMonth ? 'opacity-30' : ''}`}>
                                <span className={`text-sm ${cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {cell.day}
                                </span>
                                <div className="mt-2 space-y-1">
                                    {dateEvents.map((evt, idx) => (
                                        <div 
                                          key={idx} 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedEvent(evt);
                                          }}
                                          className="flex items-center gap-1 p-1 rounded bg-purple-500/20 border border-purple-500/20 text-[10px] text-purple-200 overflow-hidden hover:bg-purple-500/40 transition-colors"
                                        >
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
                <h3 className="text-lg font-semibold text-white mb-6">Upcoming & Recent Content</h3>
                <div className="space-y-4">
                    {upcomingPosts.map((post, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <div className={`p-2 rounded-lg bg-slate-900 border border-slate-700 ${post.color}`}>
                                <SocialIcon type={post.type} size={20} className={post.color === 'text-white' ? '' : ''}/>
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

        {/* Video Player Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-4 border-b border-slate-700/50 bg-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-purple-500/30 text-purple-400">
                    <SocialIcon type={selectedEvent.type} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedEvent.title}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                       Posted on {new Date(selectedEvent.timestamp).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                       <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">@{selectedEvent.handle}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {(selectedEvent.video_url?.toLowerCase().includes(".gif") || 
                  selectedEvent.video_url?.toLowerCase().includes(".webp") || 
                  selectedEvent.video_url?.toLowerCase().includes("/gif/")) ? (
                  <img src={selectedEvent.video_url} alt="Posted content" className="w-full rounded-xl mx-auto max-h-[50vh] object-contain bg-black/50" />
                ) : (
                  <video 
                    src={selectedEvent.video_url} 
                    controls 
                    autoPlay 
                    className="w-full rounded-xl mx-auto max-h-[50vh] object-contain bg-black/50"
                  />
                )}
                <div className="mt-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Caption</h4>
                  <p className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedEvent.content || "No caption provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Calendar;
