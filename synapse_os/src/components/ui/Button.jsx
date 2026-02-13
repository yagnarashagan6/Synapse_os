import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = ({ children, variant = 'primary', size = 'md', className, isLoading, ...props }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/20',
    secondary: 'border border-slate-600 hover:bg-slate-800 text-slate-300',
    ghost: 'hover:bg-slate-800/50 text-slate-400 hover:text-white',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
    icon: 'p-2',
  };

  return (
    <button
      className={cn(
        'rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
