import React from 'react';
import type { PositiveBehaviorRecord } from '../../types';

interface PositiveTrendsWidgetProps {
  positiveRecords: PositiveBehaviorRecord[];
}

const PositiveTrendsWidget: React.FC<PositiveTrendsWidgetProps> = ({ positiveRecords }) => {
  const recentRecords = positiveRecords.slice(0, 5);
  
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3">Positive Trends ✨</h3>
      <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
        {recentRecords.length > 0 ? (
          recentRecords.map(record => (
            <div key={record.id} className="p-3 bg-green-500/10 rounded-lg border border-green-200/60 dark:border-green-800/60">
                <p className="text-sm text-green-800 dark:text-green-300">
                    <span className="font-semibold text-green-900 dark:text-green-200">{record.student?.name || 'A student'}</span> was recognized for: "{record.description}"
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1 text-right">- {record.author?.name || 'Unknown User'}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Log positive behaviors to see trends here.</p>
        )}
      </div>
    </div>
  );
};

export default PositiveTrendsWidget;