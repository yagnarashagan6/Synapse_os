import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = ({ children, variant = 'primary', size = 'md', className, isLoading, ...props }) => {
  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20',
    secondary: 'border border-border hover:bg-muted text-muted-foreground hover:text-foreground',
    ghost: 'hover:bg-muted/50 text-muted-foreground hover:text-foreground',
    danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20',
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
