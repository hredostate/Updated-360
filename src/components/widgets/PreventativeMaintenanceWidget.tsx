import React from 'react';
import type { UserProfile, Task } from '../../types';
import { TaskStatus } from '../../types';

interface PreventativeMaintenanceWidgetProps {
    userProfile: UserProfile;
    tasks: Task[];
    users: UserProfile[];
}

const PreventativeMaintenanceWidget: React.FC<PreventativeMaintenanceWidgetProps> = ({ userProfile, tasks, users }) => {
    const maintenanceAndITUserIds = users
        .filter(u => u.role === 'Maintenance' || u.role === 'IT Support')
        .map(u => u.id);

    const relevantTasks = tasks.filter(task => 
        maintenanceAndITUserIds.includes(task.user_id) &&
        task.status !== TaskStatus.Completed &&
        task.status !== TaskStatus.Archived
    ).sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());


    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3">Maintenance Schedule</h3>
            <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                {relevantTasks.length > 0 ? (
                    relevantTasks.map(task => {
                        const dueDate = new Date(task.due_date);
                        const isOverdue = dueDate < new Date() && !dueDate.toDateString().includes(new Date().toDateString());
                        return (
                            <div key={task.id} className={`p-3 rounded-lg border-l-4 ${isOverdue ? 'bg-red-500/10 border-red-400' : 'bg-blue-500/10 border-blue-400'}`}>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{task.title}</p>
                                <p className={`text-xs mt-1 ${isOverdue ? 'text-red-700 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                                    Due: {dueDate.toLocaleDateString()}
                                </p>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No upcoming maintenance tasks.</p>
                )}
            </div>
        </div>
    );
};

export default PreventativeMaintenanceWidget;