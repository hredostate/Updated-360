
import React from 'react';
import { SCHOOL_LOGO_URL } from '../../constants';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-20 w-20',
  };

  // Only show text for large spinners (e.g. page loads)
  const showText = size === 'lg';

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} role="status">
       <img 
         src={SCHOOL_LOGO_URL} 
         alt="Loading..." 
         className={`${sizeClasses[size]} animate-pulse object-contain`}
       />
       {showText && (
           <span className="text-slate-600 dark:text-slate-300 text-sm font-medium animate-pulse">Loading...</span>
       )}
       <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
