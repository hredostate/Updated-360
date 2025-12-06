import React from 'react';
import type { ReportRecord, UserProfile } from '../../types';
import { REPORTING_ROLES } from '../../constants';

interface ComplianceTrackerWidgetProps {
  reports: ReportRecord[];
  users: UserProfile[];
}

const ComplianceTrackerWidget: React.FC<ComplianceTrackerWidgetProps> = ({ reports, users }) => {
  const reportingStaff = users.filter(u => REPORTING_ROLES.includes(u.role));
  const today = new Date().toDateString();

  const complianceData = reportingStaff.map(user => {
    const hasReportedToday = reports.some(
      r => r.author_id === user.id && new Date(r.created_at).toDateString() === today
    );
    return { ...user, hasReportedToday };
  });

  const compliantCount = complianceData.filter(u => u.hasReportedToday).length;
  const totalCount = complianceData.length;

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-900 dark:text-white">Daily Reporting Compliance</h3>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {compliantCount} / {totalCount} Compliant Today
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto pr-2">
        <div className="space-y-2">
            {complianceData.map(user => (
                <div key={user.id} className="flex justify-between items-center p-2 bg-slate-500/5 rounded-lg">
                    <div>
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.hasReportedToday ? 'bg-green-500/10 text-green-800 dark:text-green-300' : 'bg-red-500/10 text-red-800 dark:text-red-300'}`}>
                        {user.hasReportedToday ? 'Submitted' : 'Pending'}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceTrackerWidget;
