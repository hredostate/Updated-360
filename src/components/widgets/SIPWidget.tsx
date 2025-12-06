import React from 'react';
import type { StudentInterventionPlan } from '../../types';
import { VIEWS } from '../../constants';

interface SIPWidgetProps {
  interventionPlans: StudentInterventionPlan[];
  onNavigate: (view: string) => void;
}

const SIPWidget: React.FC<SIPWidgetProps> = ({ interventionPlans, onNavigate }) => {
  const activePlans = interventionPlans.filter(p => p.is_active);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-900 dark:text-white">Active Intervention Plans</h3>
        <button onClick={() => onNavigate(VIEWS.INTERVENTION_PLANS)} className="text-xs text-blue-600 hover:underline dark:text-blue-400">View All</button>
      </div>
      <div className="max-h-64 overflow-y-auto pr-2">
        {activePlans.length > 0 ? (
          <ul className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {activePlans.slice(0, 5).map(plan => (
              <li key={plan.id} className="py-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{plan.student?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Plan started: {new Date(plan.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No active intervention plans.</p>
        )}
      </div>
    </div>
  );
};

export default SIPWidget;