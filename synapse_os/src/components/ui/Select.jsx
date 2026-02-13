import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

const Select = ({ options = [], className, ...props }) => {
  return (
    <div className="relative">
        <select
          className={cn(
            "glass-input w-full appearance-none rounded-xl py-2 px-4 pr-10 text-slate-200",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
    </div>
  );
};

export default Select;
