import React, { useState } from 'react';
import Spinner from './common/Spinner';
import type { DailyBriefing as DailyBriefingType } from '../types';

interface DailyBriefingProps {
  onProcessDailyDigest: () => Promise<DailyBriefingType | null>;
}

const DailyBriefing: React.FC<DailyBriefingProps> = ({ onProcessDailyDigest }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [digest, setDigest] = useState<DailyBriefingType | null>(null);
  
  const handleProcess = async () => {
    setIsLoading(true);
    setDigest(null);
    try {
        const result = await onProcessDailyDigest();
        if (result) {
            setDigest(result);
        }
    } catch (e) {
        // Error toast is handled by the parent component (App.tsx)
        console.error("Failed to generate briefing:", e);
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3">AI Strategic Briefing</h3>
      
      {digest && (
        <div className="mb-4 space-y-4 animate-fade-in">
            <div className="p-3 bg-blue-500/10 border-l-4 border-blue-400 rounded-r-lg">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Daily Summary</p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{digest.daily_summary}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 border-l-4 border-indigo-400 rounded-r-lg">
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Morale Forecast</p>
                <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">{digest.morale_forecast}</p>
            </div>
            {digest.resource_allocation_suggestions.length > 0 && (
                <div className="p-3 bg-green-500/10 border-l-4 border-green-400 rounded-r-lg">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">Resource Suggestions</p>
                    <ul className="text-sm text-green-700 dark:text-green-400 mt-1 list-disc list-inside">
                       {digest.resource_allocation_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            )}
            {digest.parent_communication_points.length > 0 && (
                <div className="p-3 bg-purple-500/10 border-l-4 border-purple-400 rounded-r-lg">
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">Parent Communication Points</p>
                    <ul className="text-sm text-purple-700 dark:text-purple-400 mt-1 list-disc list-inside">
                       {digest.parent_communication_points.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            )}
        </div>
      )}
      
      <button 
        onClick={handleProcess}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center"
      >
        {isLoading ? <Spinner size="sm" /> : "Generate Today's Strategic Briefing"}
      </button>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">Processes reports from the last 24 hours to generate a strategic action plan.</p>
    </div>
  );
};

export default DailyBriefing;