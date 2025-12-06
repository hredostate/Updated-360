import React, { useMemo } from 'react';
import type { AtRiskStudent, Student, StudentInterventionPlan, SIPLog } from '../../types';

interface CounselorCaseloadWidgetProps {
  atRiskStudents: AtRiskStudent[];
  interventionPlans: StudentInterventionPlan[];
  onViewIntervention: (studentId: number) => void;
  sipLogs: SIPLog[];
}

const CounselorCaseloadWidget: React.FC<CounselorCaseloadWidgetProps> = ({ atRiskStudents, interventionPlans, onViewIntervention, sipLogs }) => {
  // Combine students from both lists, ensuring uniqueness
  const caseloadMap = new Map<number, { student: Student, reason: string, lastLog?: string }>();

  interventionPlans.forEach(plan => {
    if (plan.student && plan.is_active) {
        const logsForPlan = sipLogs.filter(log => log.sip_id === plan.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        caseloadMap.set(plan.student.id, {
            student: plan.student,
            reason: 'Active Intervention Plan',
            lastLog: logsForPlan.length > 0 ? new Date(logsForPlan[0].created_at).toLocaleDateString() : undefined
        });
    }
  });

  atRiskStudents.slice(0, 5).forEach(risk => {
    if (!caseloadMap.has(risk.student.id)) {
      caseloadMap.set(risk.student.id, { student: risk.student, reason: 'High-Risk Reports' });
    }
  });
  
  const caseload = Array.from(caseloadMap.values());

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3">My Caseload</h3>
      <div className="max-h-64 overflow-y-auto pr-2">
        {caseload.length > 0 ? (
          <ul className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {caseload.map(({ student, reason, lastLog }) => (
              <li key={student.id} className="py-2">
                <div className="flex justify-between items-center">
                   <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{student.name}</p>
                        <p className={`text-xs mt-1 font-semibold ${reason === 'Active Intervention Plan' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{reason}</p>
                        {lastLog && <p className="text-xs text-slate-500">Last Log: {lastLog}</p>}
                   </div>
                  <button onClick={() => onViewIntervention(student.id)} className="text-xs bg-slate-500/20 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-500/30">View Plan</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No students currently in caseload.</p>
        )}
      </div>
    </div>
  );
};

export default CounselorCaseloadWidget;