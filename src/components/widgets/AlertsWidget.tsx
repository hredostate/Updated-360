
import React, { useState } from 'react';
import type { Alert, Student } from '../../types';
import { SearchIcon } from '../common/icons';

interface AlertsWidgetProps {
  alerts: Alert[];
  onNavigate: (view: string) => void;
  onViewStudent: (student: Student) => void;
  students: Student[];
}

const severityClasses: Record<Alert['severity'], { bg: string, text: string, border: string, icon: string }> = {
  Critical: { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-300', border: 'border-red-500/30', icon: '🔥' },
  High: { bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-500/30', icon: '⚠️' },
  Medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-500/30', icon: '🔔' },
  Low: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500/30', icon: 'ℹ️' },
};


const AlertsWidget: React.FC<AlertsWidgetProps> = ({ alerts, onNavigate, onViewStudent, students }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  const filteredAlerts = sortedAlerts.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAlertClick = (alert: Alert) => {
    if (alert.sourceType === 'report') {
        onNavigate('Report Feed');
    } else if (alert.sourceType === 'student' && alert.sourceId) {
        const studentToView = students.find(s => s.id === alert.sourceId);
        if (studentToView) {
            onViewStudent(studentToView);
        }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex-shrink-0">Urgent Alerts</h3>
      
      <div className="mb-3 relative flex-shrink-0">
         <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
         <input 
            type="text" 
            placeholder="Filter alerts..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
         />
      </div>

      <div className="max-h-80 overflow-y-auto space-y-3 pr-2 flex-grow scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => {
            const isCompliance = alert.type === 'compliance';
            const style = severityClasses[alert.severity];
            const icon = isCompliance ? '📋' : style.icon;
            const isClickable = alert.sourceType === 'report' || alert.sourceType === 'student';

            return (
              <div 
                key={alert.id} 
                onClick={() => isClickable && handleAlertClick(alert)}
                className={`${style.bg} p-3 rounded-lg border ${style.border} ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              >
                <div className="flex items-start">
                  <span className="text-lg mr-2 flex-shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm ${style.text} break-words`}>{alert.title}</p>
                    {/* Added break-words to ensure description wraps */}
                    <p className={`text-xs mt-1 ${style.text} break-words opacity-90`}>{alert.description}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center">
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                {searchQuery ? 'No matches found.' : 'No active alerts. All clear!'}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsWidget;
