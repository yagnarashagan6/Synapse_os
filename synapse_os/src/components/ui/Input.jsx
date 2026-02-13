import React from 'react';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';

const Input = ({ icon: Icon, className, ...props }) => {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon size={18} />
        </div>
      )}
      <input
        className={cn(
          "glass-input w-full rounded-xl py-2 px-4 text-slate-200 placeholder:text-slate-500",
          Icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default Input;
