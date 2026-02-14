import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Bot, 
  Database, 
  User, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: TrendingUp, label: 'Trends', path: '/trends' },
    { icon: FileText, label: 'Content', path: '/content' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: CheckCircle, label: 'Approvals', path: '/approvals' },
    { icon: Bot, label: 'AI Tools', path: '/ai-tools' },
    { icon: Database, label: 'Sources', path: '/sources' },
  ];

  const bottomItems = [
    { icon: User, label: 'My Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
        isActive 
          ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-primary/20" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <item.icon size={20} />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  );

  return (
    <>
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card/90 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Synapse OS
                </h1>
                <p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">AI Intelligence</p>
            </div>
            <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
                <X size={24} />
            </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          {bottomItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
