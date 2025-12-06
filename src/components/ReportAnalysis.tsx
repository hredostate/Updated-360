

import React from 'react';
import type { ReportRecord, Task } from '../types';

interface ReportAnalysisProps {
  report: ReportRecord;
  allTasks: Task[];
  onBack: () => void;
}

const sentimentColors: Record<string, string> = {
    Positive: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20',
    Negative: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
    Neutral: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
};

const urgencyColors: Record<string, string> = {
    Critical: 'bg-red-600 text-white',
    High: 'bg-orange-500 text-white',
    Medium: 'bg-yellow-500 text-yellow-900',
    Low: 'bg-blue-500 text-white',
};

const ReportAnalysis: React.FC<ReportAnalysisProps> = ({ report, allTasks, onBack }) => {
  const { analysis } = report;
  const relatedTasks = allTasks.filter(task => task.report_id === report.id);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Action Summary for Report #{report.id}</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Submitted by {report.author?.name || 'Unknown'} on {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">
          Back to Feed
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Original Report</h3>
          <p className="mt-2 p-4 bg-slate-500/10 rounded-lg text-slate-700 dark:text-slate-200">{report.report_text}</p>
        </div>

        {analysis ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${sentimentColors[analysis.sentiment]}`}>
                <h4 className="font-semibold">Sentiment</h4>
                <p className="text-2xl font-bold">{analysis.sentiment}</p>
              </div>
              <div className={`p-4 rounded-lg text-center ${urgencyColors[analysis.urgency]}`}>
                <h4 className="font-semibold">Urgency</h4>
                <p className="text-2xl font-bold">{analysis.urgency}</p>
              </div>
               <div className="p-4 rounded-lg bg-slate-500/10">
                <h4 className="font-semibold text-slate-800 dark:text-white">Assigned To</h4>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{report.assignee?.name || 'Unassigned'}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-500/10 rounded-lg">
              <h4 className="font-semibold text-slate-800 dark:text-white">AI Summary</h4>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{analysis.summary}</p>
            </div>

            {relatedTasks.length > 0 && (
                 <div className="p-4 bg-blue-500/10 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">Generated Tasks</h4>
                    <ul className="list-disc list-inside mt-2 text-sm text-slate-700 dark:text-slate-200 space-y-1">
                        {relatedTasks.map(task => <li key={task.id}>{task.title} (Priority: {task.priority})</li>)}
                    </ul>
                </div>
            )}
            
            {/* FIX: Check if property exists before rendering */}
            {report.parent_communication_draft && (
                <div className="p-4 bg-green-500/10 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-300">Draft: Parent Communication</h4>
                    {/* FIX: Check if property exists before rendering */}
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{report.parent_communication_draft}</p>
                </div>
            )}

            {/* FIX: Check if property exists before rendering */}
            {report.internal_summary_draft && (
                <div className="p-4 bg-purple-500/10 rounded-lg">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300">Draft: Internal Summary for Leadership</h4>
                    {/* FIX: Check if property exists before rendering */}
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{report.internal_summary_draft}</p>
                </div>
            )}

          </div>
        ) : (
          <div className="text-center p-10 bg-slate-500/10 rounded-lg">
            <p className="text-slate-500 dark:text-slate-400">AI analysis has not been run or was not successful for this report.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportAnalysis;
