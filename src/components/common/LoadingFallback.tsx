import React from 'react';
import Spinner from './Spinner';

/**
 * LoadingFallback component for Suspense boundaries
 * Provides a full-screen semi-transparent background to prevent
 * the purple gradient body background from showing through during lazy loading.
 * 
 * The min-height calculation (100vh - 200px) accounts for the approximate combined height
 * of the header (~80px) and main padding/margins (~120px), ensuring the fallback
 * covers the main content area without extending beyond the viewport.
 */
const LoadingFallback: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl">
      <Spinner size="lg" />
    </div>
  );
};

export default LoadingFallback;
