import React, { useState, useMemo } from 'react';
import type { ReportRecord, UserProfile, RoleDetails } from '../types';
import { REPORTING_ROLES } from '../constants';
import Spinner from './common/Spinner';

interface ComplianceTrackerProps {
  reports: ReportRecord[];
  users: UserProfile[];
  roles: Record<string, RoleDetails>;
  onRunWeeklyComplianceCheck: () => Promise<void>;
  userPermissions: string[];
}

const ComplianceTracker: React.FC<ComplianceTrackerProps> = ({ reports, users, roles, onRunWeeklyComplianceCheck, userPermissions }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  const reportingStaff = users.filter(u => REPORTING_ROLES.includes(u.role));
  const canManageCurriculum = userPermissions.includes('manage-curriculum') || userPermissions.includes('*');

  const sortedComplianceData = useMemo(() => {
    const complianceData = reportingStaff.map(user => {
      const userRoleDetails = roles[user.role];
      const quotaDays = userRoleDetails?.reportingQuotaDays;
      const quotaCount = userRoleDetails?.reportingQuotaCount;
  
      if (!quotaDays || !quotaCount) {
        return { ...user, reportsThisPeriod: '-', quota: 'N/A', isCompliant: true, progress: 100, period: 'N/A' };
      }
  
      const periodAgo = new Date();
      periodAgo.setDate(periodAgo.getDate() - quotaDays);
  
      const reportsThisPeriod = reports.filter(
        r => r.author_id === user.id && new Date(r.created_at) >= periodAgo
      ).length;
      
      const isCompliant = reportsThisPeriod >= quotaCount;
      const progress = Math.min((reportsThisPeriod / quotaCount) * 100, 100);
  
      return { ...user, reportsThisPeriod, quota: quotaCount, isCompliant, progress, period: `${quotaDays} days` };
    });

    return complianceData.sort((a, b) => {
        const aVal = a.progress ?? -1;
        const bVal = b.progress ?? -1;
        if (sortOrder === 'desc') {
            return bVal - aVal;
        } else {
            return aVal - bVal;
        }
    });

  }, [reports, users, roles, sortOrder]);
  
  const trackedStaff = sortedComplianceData.filter(u => u.quota !== 'N/A');

  const handleCheck = async () => {
    setIsChecking(true);
    await onRunWeeklyComplianceCheck();
    setIsChecking(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Compliance Tracker</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Monitor staff reporting and curriculum coverage.</p>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Daily Reporting Compliance</h2>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort by:</span>
                <button onClick={() => setSortOrder('desc')} className={`px-3 py-1 text-sm rounded-md ${sortOrder === 'desc' ? 'bg-slate-300 dark:bg-slate-600 font-semibold' : 'bg-slate-200 dark:bg-slate-700'}`}>Best to Worst</button>
                <button onClick={() => setSortOrder('asc')} className={`px-3 py-1 text-sm rounded-md ${sortOrder === 'asc' ? 'bg-slate-300 dark:bg-slate-600 font-semibold' : 'bg-slate-200 dark:bg-slate-700'}`}>Worst to Best</button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-500/10">
              <tr>
                <th scope="col" className="px-6 py-3">Staff Member</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Reports This Period</th>
                <th scope="col" className="px-6 py-3">Progress</th>
                <th scope="col" className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {trackedStaff.map(user => (
                <tr key={user.id} className="border-b border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-500/10">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4">{user.reportsThisPeriod} / {user.quota} <span className="text-xs text-slate-400">(last {user.period})</span></td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div className={`${user.isCompliant ? 'bg-green-500' : 'bg-blue-500'} h-2.5 rounded-full`} style={{ width: `${user.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.isCompliant ? 'bg-green-500/20 text-green-800 dark:text-green-300' : 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300'}`}>
                      {user.isCompliant ? 'Compliant' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canManageCurriculum && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Curriculum Compliance</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Run a check on the previous week's lesson plan completion. If a team's plan was not marked as 'Fully Covered', tasks will be created for the teachers and an alert sent to the team lead.</p>
            <button
                onClick={handleCheck}
                disabled={isChecking}
                className="w-full max-w-xs px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center"
            >
                {isChecking ? <Spinner size="sm" /> : 'Run Weekly Compliance Check'}
            </button>
        </div>
      )}
    </div>
  );
};

export default ComplianceTracker;