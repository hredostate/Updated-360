import React, { useState } from 'react';
import type { AtRiskTeacher } from '../../types';
import Spinner from '../common/Spinner';

interface AtRiskTeachersWidgetProps {
  atRiskTeachers: AtRiskTeacher[];
  onAnalyzeTeacherRisk: () => Promise<void>;
}

const AtRiskTeachersWidget: React.FC<AtRiskTeachersWidgetProps> = ({ atRiskTeachers, onAnalyzeTeacherRisk }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        setIsLoading(true);
        await onAnalyzeTeacherRisk();
        setIsLoading(false);
    }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-900 dark:text-white">At-Risk Staff Analysis</h3>
        <button 
            onClick={handleAnalyze}
            disabled={isLoading}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 disabled:opacity-50"
        >
            {isLoading ? <Spinner size="sm" /> : 'Re-analyze'}
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto pr-2">
        {atRiskTeachers.length > 0 ? (
          <ul className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {atRiskTeachers.map(({ teacher, score, reasons }) => (
              <li key={teacher.id} className="py-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{teacher.name} <span className="text-xs text-slate-500 dark:text-slate-400">({teacher.role})</span></p>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400">Score: {score}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" title={reasons.join(', ')}>
                  Factors: {reasons.join(', ')}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">No staff members flagged as at-risk.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click "Re-analyze" to run the AI analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AtRiskTeachersWidget;
