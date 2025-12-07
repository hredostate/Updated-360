import React from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  title, 
  description, 
  actions, 
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-6 animate-fade-in ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-slate-600 dark:text-slate-300 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2">{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
};

export default PageLayout;
