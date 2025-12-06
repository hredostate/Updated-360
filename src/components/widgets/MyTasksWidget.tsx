
import React, { useState } from 'react';
import type { Task, UserProfile } from '../../types';
import { TaskStatus, TaskPriority } from '../../types';
import { CalendarIcon, BellIcon } from '../common/icons';
import { downloadIcsFile, generateIcsContent, parseDateStringAsLocal } from '../../utils/calendar';

interface MyTasksWidgetProps {
  tasks: Task[];
  userProfile: UserProfile;
  onUpdateStatus: (taskId: number, status: TaskStatus) => Promise<void>;
}

const priorityClasses: Record<TaskPriority, string> = {
  [TaskPriority.Critical]: 'bg-red-500/20 text-red-800 dark:text-red-300',
  [TaskPriority.High]: 'bg-orange-500/20 text-orange-800 dark:text-orange-300',
  [TaskPriority.Medium]: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300',
  [TaskPriority.Low]: 'bg-blue-500/20 text-blue-800 dark:text-blue-300',
};

const TaskItem: React.FC<{task: Task, onUpdateStatus: (taskId: number, status: TaskStatus) => Promise<void>}> = ({ task, onUpdateStatus }) => {
    const isCompleted = task.status === TaskStatus.Completed;
    const [isCompleting, setIsCompleting] = useState(false);

    const handleToggleComplete = () => {
        if (!isCompleted) {
            setIsCompleting(true);
            // Delay status update to allow animation to play
            setTimeout(() => {
                onUpdateStatus(task.id, TaskStatus.Completed);
            }, 500); 
        } else {
            onUpdateStatus(task.id, TaskStatus.ToDo);
        }
    }
    
    const handleAddToCalendar = () => {
        const content = generateIcsContent({
            title: `Task: ${task.title}`,
            description: task.description || 'No description provided.',
            startDate: parseDateStringAsLocal(task.due_date),
            isAllDay: true,
        });
        downloadIcsFile(content, `Task_${task.title.replace(/[^a-z0-9]/gi, '_')}.ics`);
    };
    
    return (
        <div className={`flex items-start justify-between space-x-3 py-3 transition-all duration-500 ease-in-out ${isCompleting ? 'opacity-0 transform translate-x-4' : 'opacity-100'}`}>
            <div className="flex items-start space-x-3 flex-1 min-w-0">
                <input 
                    type="checkbox" 
                    className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-transparent cursor-pointer flex-shrink-0"
                    checked={isCompleted && !isCompleting}
                    onChange={handleToggleComplete}
                    aria-label={`Mark task '${task.title}' as ${isCompleted ? 'incomplete' : 'complete'}`}
                />
                <div className="flex-1 min-w-0">
                    {/* Added break-words and whitespace-normal to prevent cutoff */}
                    <p 
                        className={`text-sm font-medium text-slate-800 dark:text-slate-200 break-words whitespace-normal transition-all duration-300 ${isCompleted || isCompleting ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}
                    >
                        {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${priorityClasses[task.priority]}`}>{task.priority}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{new Date(task.due_date + 'T00:00:00').toLocaleDateString()}</span>
                        {task.reminder_minutes_before && (
                            <span title="Reminder is set for this task">
                                <BellIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {!isCompleted && !isCompleting && (
                 <button 
                    onClick={handleAddToCalendar}
                    className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex-shrink-0 self-start"
                    aria-label="Add to Calendar"
                    title="Add to Calendar"
                >
                    <CalendarIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}

const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({ tasks, userProfile, onUpdateStatus }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const activeTasks = tasks.filter(t => t.user_id === userProfile.id && t.status !== TaskStatus.Completed && t.status !== TaskStatus.Archived);
  
  const filteredActiveTasks = activeTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const completedTasks = tasks
    .filter(t => t.user_id === userProfile.id && t.status === TaskStatus.Completed)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const displayedCompletedTasks = completedTasks.slice(0, 5);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h3 className="font-bold text-slate-900 dark:text-white">My Tasks</h3>
         <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
        >
          {showCompleted ? 'Hide Completed' : `Show Recent (${displayedCompletedTasks.length})`}
        </button>
      </div>
      
      {/* Search Input */}
      <div className="mb-2 flex-shrink-0">
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border-transparent focus:border-indigo-500 rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all"
          />
      </div>

      <div className="max-h-80 overflow-y-auto pr-1 flex-grow scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {filteredActiveTasks.length > 0 ? (
          <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {filteredActiveTasks
                .sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .map(task => <TaskItem key={task.id} task={task} onUpdateStatus={onUpdateStatus} />)}
          </div>
        ) : (
          <div className="text-center py-8 flex flex-col items-center justify-center h-full">
            {searchQuery ? (
                 <p className="text-sm text-slate-500">No tasks found matching "{searchQuery}"</p>
            ) : (
                <>
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">All tasks completed!</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Great job staying on top of your work.</p>
                </>
            )}
          </div>
        )}

        {showCompleted && (
          <div className="mt-4 pt-4 border-t border-dashed border-slate-300/60 dark:border-slate-600/60 animate-fade-in">
            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Recently Completed</h4>
            {displayedCompletedTasks.length > 0 ? (
              <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                {displayedCompletedTasks.map(task => <TaskItem key={task.id} task={task} onUpdateStatus={onUpdateStatus} />)}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">No tasks completed recently.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasksWidget;
