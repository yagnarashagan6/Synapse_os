import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans selection:bg-primary/30">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 lg:pl-64 flex flex-col min-h-0 relative z-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center p-4 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-30">
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-muted-foreground hover:text-foreground"
            >
                <Menu size={24} />
            </button>
            <span className="ml-4 font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Synapse OS</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 lg:p-8">
            <div className="max-w-7xl mx-auto w-full">
                 <Outlet />
            </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
