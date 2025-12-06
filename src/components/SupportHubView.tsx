import React, { useMemo, useState } from 'react';
import type { Task, UserProfile } from '../types';
import { TaskStatus } from '../types';
import TaskCard from './TaskCard';
import TaskFormModal from './TaskFormModal';

interface SupportHubViewProps {
  allTasks: Task[];
  users: UserProfile[];
  currentUser: UserProfile;
  onUpdateStatus: (taskId: number, newStatus: TaskStatus) => void;
  onAddTask: (taskData: any) => Promise<boolean>;
}

const statusColumns: TaskStatus[] = [
  TaskStatus.ToDo,
  TaskStatus.InProgress,
  TaskStatus.Completed,
];

type FilterType = 'all' | 'it' | 'maintenance' | 'mine';

const SupportHubView: React.FC<SupportHubViewProps> = ({ allTasks, users, currentUser, onUpdateStatus, onAddTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const supportUsers = useMemo(() => {
    return users.filter(u => u.role === 'IT Support' || u.role === 'Maintenance');
  }, [users]);
  
  const tasksToDisplay = useMemo(() => {
    const supportUserIds = supportUsers.map(u => u.id);
    let filteredTasks = allTasks.filter(t => supportUserIds.includes(t.user_id));

    if (filter === 'mine') {
        return filteredTasks.filter(t => t.user_id === currentUser.id);
    }
    if (filter === 'it') {
        const itUserIds = users.filter(u => u.role === 'IT Support').map(u => u.id);
        return filteredTasks.filter(t => itUserIds.includes(t.user_id));
    }
    if (filter === 'maintenance') {
        const maintUserIds = users.filter(u => u.role === 'Maintenance').map(u => u.id);
        return filteredTasks.filter(t => maintUserIds.includes(t.user_id));
    }
    return filteredTasks; // 'all'
  }, [allTasks, users, filter, currentUser.id, supportUsers]);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData("taskId"));
    const task = allTasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      onUpdateStatus(taskId, newStatus);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleMoveTask = (taskId: number, currentStatus: TaskStatus, direction: 'left' | 'right') => {
    const currentIndex = statusColumns.indexOf(currentStatus);
    let newIndex = currentIndex;
    if (direction === 'left' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'right' && currentIndex < statusColumns.length - 1) {
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex) {
      const newStatus = statusColumns[newIndex];
      onUpdateStatus(taskId, newStatus);
    }
  };
  
  const getAssignee = (userId: string) => users.find(u => u.id === userId);

  return (
    <>
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Support Hub</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-1">Manage all IT and Maintenance tickets in one place.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">New Ticket</button>
        </div>

        <div className="flex space-x-1 bg-slate-500/10 p-1 rounded-lg self-start mt-4">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>All Tickets</button>
            <button onClick={() => setFilter('it')} className={`px-3 py-1 text-sm rounded-md ${filter === 'it' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>IT Only</button>
            <button onClick={() => setFilter('maintenance')} className={`px-3 py-1 text-sm rounded-md ${filter === 'maintenance' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Maintenance Only</button>
            <button onClick={() => setFilter('mine')} className={`px-3 py-1 text-sm rounded-md ${filter === 'mine' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>My Tickets</button>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {statusColumns.map(status => (
            <div
              key={status}
              className="bg-slate-500/10 rounded-2xl p-4 flex flex-col backdrop-blur-sm"
              onDrop={(e) => handleDrop(e, status)}
              onDragOver={handleDragOver}
            >
              <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4 px-2">{status} ({tasksToDisplay.filter(t=>t.status === status).length})</h2>
              <div className="space-y-4 overflow-y-auto flex-grow pr-2">
                {tasksToDisplay
                  .filter(task => task.status === status)
                  .map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assignee={getAssignee(task.user_id)}
                      onDragStart={handleDragStart}
                      onMove={handleMoveTask}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddTask}
        users={supportUsers}
        currentUser={currentUser}
      />
    </>
  );
};

export default SupportHubView;
