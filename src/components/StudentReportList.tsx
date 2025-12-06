
import React from 'react';
import type { StudentTermReport } from '../types';
import { FileTextIcon } from './common/icons';

interface StudentReportListProps {
  reports: StudentTermReport[];
  onSelectReport: (report: StudentTermReport) => void;
}

const StudentReportList: React.FC<StudentReportListProps> = ({ reports, onSelectReport }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Report Cards</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">View your academic performance history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length > 0 ? (
          reports
            // Sort by date descending if available, else term ID logic? Assuming latest first.
            .sort((a, b) => b.id - a.id) 
            .map(report => (
              <div
                key={report.id}
                onClick={() => onSelectReport(report)}
                className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-xl shadow-lg dark:border-slate-800/60 dark:bg-slate-900/40 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform hover:shadow-xl hover:border-blue-400/50"
              >
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                        <FileTextIcon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        Final
                    </span>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">
                    {report.term?.term_label || 'Unknown Term'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{report.term?.session_label}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                      <div>
                          <p className="text-xs text-slate-500">Average</p>
                          <p className="font-bold text-lg text-slate-800 dark:text-white">{Number(report.average_score).toFixed(1)}%</p>
                      </div>
                       <div className="text-right">
                          <p className="text-xs text-slate-500">Position</p>
                          <p className="font-bold text-lg text-slate-800 dark:text-white">{report.position_in_class || 'N/A'}</p>
                      </div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="col-span-full text-center py-20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <div className="text-4xl mb-4">📂</div>
            <p className="text-slate-500 dark:text-slate-400">No report cards have been published for you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentReportList;
