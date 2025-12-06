import React, { useState } from 'react';
import type { SchoolHealthReport } from '../types';
import Spinner from './common/Spinner';
import { HeartIcon } from './common/icons';

interface SchoolHealthOverviewProps {
  report: SchoolHealthReport | null;
  onGenerate: () => Promise<void>;
}

const SchoolHealthOverview: React.FC<SchoolHealthOverviewProps> = ({ report, onGenerate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    await onGenerate();
    setIsLoading(false);
  };
  
  const getScoreColor = (score: number) => {
    if (score > 85) return 'text-green-500';
    if (score > 65) return 'text-yellow-500';
    return 'text-red-500';
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <HeartIcon className="w-8 h-8 mr-3 text-blue-600"/>
            School Health Overview
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">An AI-powered analysis of your school's operational and cultural well-being.</p>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
        {!report && !isLoading && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-300 mb-4">Generate a real-time health report based on the latest reports, tasks, and sentiment data.</p>
            <button onClick={handleGenerate} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Generate Health Report</button>
          </div>
        )}
        
        {isLoading && (
            <div className="text-center py-12">
                <Spinner size="lg" />
                <p className="mt-4 text-slate-500">Analyzing data...</p>
            </div>
        )}

        {report && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="text-center">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Overall Health Score</p>
                    <p className={`text-7xl font-bold ${getScoreColor(report.overall_score)}`}>{report.overall_score}</p>
                </div>
                <div className="flex-1 p-4 bg-blue-500/10 rounded-lg">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300">AI Summary</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">{report.summary}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.metrics.map(metric => (
                    <div key={metric.metric} className="p-4 bg-slate-500/10 rounded-lg">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-slate-800 dark:text-white">{metric.metric}</h4>
                            <p className={`font-bold text-2xl ${getScoreColor(metric.score)}`}>{metric.score}</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{metric.summary}</p>
                    </div>
                ))}
            </div>
            
             <div className="text-center border-t border-slate-200/60 dark:border-slate-800/60 pt-4">
                <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">
                    Regenerate Report
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolHealthOverview;
