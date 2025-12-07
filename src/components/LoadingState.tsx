import React, { useEffect, useState } from 'react';
import { SCHOOL_LOGO_URL } from '../constants';

export type LoadingPhase = 'authenticating' | 'loading-profile' | 'loading-critical-data' | 'loading-background-data';

interface LoadingStateProps {
  phase: LoadingPhase;
  onRetry?: () => void;
  showRetry?: boolean;
  debugMode?: boolean;
  debugInfo?: {
    timestamp: string;
    authState?: string;
    error?: string;
  };
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  phase, 
  onRetry, 
  showRetry = false,
  debugMode = false,
  debugInfo 
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const phaseLabels: Record<LoadingPhase, string> = {
    'authenticating': 'Authenticating...',
    'loading-profile': 'Loading your profile...',
    'loading-critical-data': 'Loading essential data...',
    'loading-background-data': 'Loading additional data...',
  };

  const phaseDescriptions: Record<LoadingPhase, string> = {
    'authenticating': 'Verifying your credentials',
    'loading-profile': 'Fetching your account information',
    'loading-critical-data': 'Loading users, students, and reports',
    'loading-background-data': 'Loading supplementary information',
  };

  const getProgressPercentage = (): number => {
    switch (phase) {
      case 'authenticating': return 25;
      case 'loading-profile': return 50;
      case 'loading-critical-data': return 75;
      case 'loading-background-data': return 90;
      default: return 0;
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-md w-full mx-4 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
        {/* Logo with pulse animation */}
        <div className="flex justify-center mb-6">
          <img 
            src={SCHOOL_LOGO_URL} 
            alt="Loading..." 
            className="h-20 w-20 animate-pulse object-contain"
          />
        </div>

        {/* Phase label */}
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">
          {phaseLabels[phase]}
        </h2>

        {/* Phase description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
          {phaseDescriptions[phase]}
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            >
              <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-slate-400/30 animate-shimmer"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>{getProgressPercentage()}% complete</span>
            <span>{timeElapsed}s elapsed</span>
          </div>
        </div>

        {/* Retry button - shown after timeout */}
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mb-4"
          >
            Retry Loading
          </button>
        )}

        {/* Debug information */}
        {debugMode && debugInfo && (
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-mono">
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Debug Information</div>
            <div className="space-y-1 text-slate-600 dark:text-slate-400">
              <div>Time: {debugInfo.timestamp}</div>
              {debugInfo.authState && <div>Auth State: {debugInfo.authState}</div>}
              {debugInfo.error && (
                <div className="text-red-600 dark:text-red-400">
                  Error: {debugInfo.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading tips */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {timeElapsed > 20 && (
            <p className="animate-fade-in">
              Taking longer than usual? Check your internet connection.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
