import React from 'react';
import { cn } from '../../lib/utils';

const Card = ({ children, className }) => {
  return (
    <div className={cn("glass-panel rounded-2xl p-6", className)}>
      {children}
    </div>
  );
};

export default Card;
