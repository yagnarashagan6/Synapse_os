import React from 'react';
import { cn } from '../../lib/utils';

const Tabs = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn("flex space-x-1 bg-slate-800/50 p-1 rounded-xl", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === tab.id
              ? "bg-slate-700 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
