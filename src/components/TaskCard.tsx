
import React from 'react';
import type { Task, UserProfile } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { BellIcon } from './common/icons';

interface TaskCardProps {
  task: Task;
  assignee?: UserProfile;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: number) => void;
  onMove: (taskId: number, currentStatus: TaskStatus, direction: 'left' | 'right') => void;
}

const priorityClasses: Record<TaskPriority, { border: string, bg: string, text: string }> = {
  [TaskPriority.Critical]: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400' },
  [TaskPriority.High]: { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400' },
  [TaskPriority.Medium]: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-700 dark:text-yellow-400' },
  [TaskPriority.Low]: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400' },
};

const TaskCard: React.FC<TaskCardProps> = ({ task, assignee, onDragStart, onMove }) => {
  const priorityStyle = priorityClasses[task.priority];

  const today = new Date();
  today.setHours(0,0,0,0);
  const dueDate = new Date(task.due_date + 'T00:00:00');
  const isOverdue = dueDate < today && task.status !== TaskStatus.Completed;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onMove(task.id, task.status, 'left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onMove(task.id, task.status, 'right');
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    (e.target as HTMLDivElement).classList.add('dragging');
    onDragStart(e, task.id);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.target as HTMLDivElement).classList.remove('dragging');
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`p-4 rounded-xl border-l-4 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500
        animate-fade-in transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1
        ${priorityStyle.border} 
        border border-t-slate-200/60 border-r-slate-200/60 border-b-slate-200/60 
        bg-white/60 backdrop-blur-xl shadow-lg 
        dark:border-t-slate-800/60 dark:border-r-slate-800/60 dark:border-b-slate-800/60 dark:bg-slate-900/40
      `}
      aria-label={`Task: ${task.title}, Status: ${task.status}, Priority: ${task.priority}. Use arrow keys to change status.`}
    >
      <p className="font-semibold text-slate-800 dark:text-white text-md">{task.title}</p>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{task.description}</p>
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>
            {task.priority}
            </span>
            <span className={`text-xs font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                Due: {dueDate.toLocaleDateString()}
            </span>
            {task.reminder_minutes_before && (
                <div className="relative group">
                    <BellIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 text-xs text-white bg-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Reminder is set
                    </div>
                </div>
            )}
        </div>
        {assignee && (
           <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 ring-1 ring-blue-300/50">
                    {assignee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{assignee.name}</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;