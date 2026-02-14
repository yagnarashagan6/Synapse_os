import React from 'react';
import { cn } from '../../lib/utils';

const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-muted text-muted-foreground border-border',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    emerging: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    trending: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", variants[variant], className)}>
      {children}
    </span>
  );
};

export default Badge;
