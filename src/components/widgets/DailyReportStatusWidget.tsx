import React from 'react';
import type { UserProfile, ReportRecord } from '../../types';
import { ReportType } from '../../types';
import { CheckCircleIcon } from '../common/icons';
import { VIEWS } from '../../constants';

interface DailyReportStatusWidgetProps {
  userProfile: UserProfile;
  reports: ReportRecord[];
  onNavigate: (view: string) => void;
}

const DailyReportStatusWidget: React.FC<DailyReportStatusWidgetProps> = ({ userProfile, reports, onNavigate }) => {
  const today = new Date().toDateString();
  const todaysReports = reports.filter(
    report => report.author_id === userProfile.id && new Date(report.created_at).toDateString() === today
  );

  const isMandatoryReporter = ['Team Lead', 'Principal'].includes(userProfile.role);

  if (isMandatoryReporter) {
    const hasSubmittedCheckIn = todaysReports.some(r => r.report_type === ReportType.DailyCheckIn);
    const hasSubmittedAgenda = todaysReports.some(r => r.report_type === ReportType.NextDayAgenda);
    const allMandatorySubmitted = hasSubmittedCheckIn && hasSubmittedAgenda;

    if (allMandatorySubmitted) {
      return (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 backdrop-blur-xl shadow-lg dark:border-green-500/40 dark:bg-green-900/20 col-span-1 flex flex-col justify-center text-center">
            <div className="text-4xl mb-2 mx-auto text-green-600"><CheckCircleIcon /></div>
            <h3 className="font-bold text-green-800 dark:text-green-200">Mandatory Reports Submitted!</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">Your 'Daily check in' and 'Next day agenda' are complete for today.</p>
        </div>
      );
    }

    return (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-xl shadow-lg dark:border-amber-500/40 dark:bg-amber-900/20 col-span-1">
            <h3 className="font-bold text-amber-800 dark:text-amber-200">Mandatory Reports Due</h3>
            <div className="mt-2 space-y-2 text-sm">
                <div className={`flex justify-between items-center p-2 rounded-md ${hasSubmittedCheckIn ? 'bg-green-500/10 text-green-800' : 'bg-red-500/10 text-red-800'}`}>
                    <span>Daily Check-in</span>
                    <span className="font-semibold">{hasSubmittedCheckIn ? '✓ Submitted' : '✗ Pending'}</span>
                </div>
                 <div className={`flex justify-between items-center p-2 rounded-md ${hasSubmittedAgenda ? 'bg-green-500/10 text-green-800' : 'bg-red-500/10 text-red-800'}`}>
                    <span>Next Day Agenda</span>
                    <span className="font-semibold">{hasSubmittedAgenda ? '✓ Submitted' : '✗ Pending'}</span>
                </div>
            </div>
            <button 
                onClick={() => onNavigate(VIEWS.SUBMIT_REPORT)}
                className="mt-4 w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
                Submit a Report
            </button>
        </div>
    );

  } else {
    // Original logic for other roles
    const hasReportedToday = todaysReports.length > 0;
    if (hasReportedToday) {
      return (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 backdrop-blur-xl shadow-lg dark:border-green-500/40 dark:bg-green-900/20 col-span-1 flex flex-col justify-center items-center text-center">
          <div className="text-4xl mb-2 text-green-600"><CheckCircleIcon /></div>
          <h3 className="font-bold text-green-800 dark:text-green-200">Daily Report Submitted!</h3>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">Thank you for checking in. You can submit more reports if needed.</p>
        </div>
      );
    }
  
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-xl shadow-lg dark:border-amber-500/40 dark:bg-amber-900/20 col-span-1 flex flex-col justify-center items-center text-center">
        <div className="text-4xl mb-2">🔔</div>
        <h3 className="font-bold text-amber-800 dark:text-amber-200">Daily Report Due</h3>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Please submit at least one report for today.</p>
        <button 
          onClick={() => onNavigate(VIEWS.SUBMIT_REPORT)}
          className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Submit Daily Report
        </button>
      </div>
    );
  }
};

export default DailyReportStatusWidget;