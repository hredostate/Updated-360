
import React, { useState, useMemo } from 'react';
import type { Task, UserProfile, TaskPriority } from '../types';
import { TaskStatus } from '../types';
import TaskCard from './TaskCard';
import TaskFormModal from './TaskFormModal';
import { DownloadIcon } from './common/icons';
import { exportToExcel, type ExcelColumn } from '../utils/excelExport';

interface TaskManagerProps {
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

type FilterType = 'all' | 'mine' | 'it' | 'maintenance';

const TaskManager: React.FC<TaskManagerProps> = ({ allTasks, users, currentUser, onUpdateStatus, onAddTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'due_date'>('priority');
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const tasksToDisplay = useMemo(() => {
    if (filter === 'mine') {
        return allTasks.filter(t => t.user_id === currentUser.id);
    }
    if (filter === 'it') {
        const itUserIds = users.filter(u => u.role === 'IT Support').map(u => u.id);
        return allTasks.filter(t => itUserIds.includes(t.user_id));
    }
    if (filter === 'maintenance') {
        const maintUserIds = users.filter(u => u.role === 'Maintenance').map(u => u.id);
        return allTasks.filter(t => maintUserIds.includes(t.user_id));
    }
    return allTasks; // 'all'
  }, [allTasks, users, filter, currentUser.id]);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = Number(e.dataTransfer.getData("taskId"));
    const task = allTasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      onUpdateStatus(taskId, newStatus);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(status);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverStatus(null);
  }
  
  const handleMoveTask = (taskId: number, currentStatus: TaskStatus, direction: 'left' | 'right') => {
    const currentIndex = statusColumns.indexOf(currentStatus);
    let newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < statusColumns.length) {
      onUpdateStatus(taskId, statusColumns[newIndex]);
    }
  };
  
  const getAssignee = (userId: string) => users.find(u => u.id === userId);
  
  const priorityOrder: Record<TaskPriority, number> = {
    'Critical': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1,
  };

  const handleExportTasks = () => {
    const columns: ExcelColumn[] = [
      { key: 'title', header: 'Title', width: 35, type: 'string' },
      { key: 'description', header: 'Description', width: 50, type: 'string' },
      { key: 'status', header: 'Status', width: 15, type: 'string' },
      { key: 'priority', header: 'Priority', width: 12, type: 'string' },
      { key: 'assignee', header: 'Assigned To', width: 25, type: 'string' },
      { key: 'due_date', header: 'Due Date', width: 15, type: 'date' },
      { key: 'created_at', header: 'Created At', width: 15, type: 'date' },
    ];

    const dataToExport = tasksToDisplay.map(task => ({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee: getAssignee(task.user_id)?.name || 'Unassigned',
      due_date: task.due_date,
      created_at: task.created_at,
    }));

    exportToExcel(dataToExport, columns, {
      filename: 'tasks_export',
      sheetName: 'Tasks',
      includeTimestamp: true
    });
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Task Board</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">Manage all tasks across the school.</p>
        </div>
        <div className="flex items-center space-x-4">
            <button 
              onClick={handleExportTasks}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
              title="Export Tasks to Excel"
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
            <div className="flex space-x-1 bg-slate-500/10 p-1 rounded-lg">
                <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>All Tasks</button>
                <button onClick={() => setFilter('it')} className={`px-3 py-1 text-sm rounded-md ${filter === 'it' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>IT</button>
                <button onClick={() => setFilter('maintenance')} className={`px-3 py-1 text-sm rounded-md ${filter === 'maintenance' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Maintenance</button>
                <button onClick={() => setFilter('mine')} className={`px-3 py-1 text-sm rounded-md ${filter === 'mine' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>My Tasks</button>
            </div>
            <div>
              <label htmlFor="sort-by" className="text-sm font-medium sr-only">Sort by:</label>
              <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="p-2 rounded-md text-sm bg-slate-500/10 border-slate-300/50">
                  <option value="priority">Sort by Priority</option>
                  <option value="due_date">Sort by Due Date</option>
              </select>
            </div>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">New Task</button>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 min-h-0">
        {statusColumns.map(status => (
          <div
            key={status}
            className={`bg-slate-500/10 rounded-2xl p-4 flex flex-col backdrop-blur-sm transition-colors duration-300 ${dragOverStatus === status ? 'bg-blue-500/20 ring-2 ring-blue-500' : ''}`}
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
          >
            <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4 px-2">{status} ({tasksToDisplay.filter(t=>t.status === status).length})</h2>
            <div className="space-y-4 overflow-y-auto flex-grow pr-2">
              {tasksToDisplay
                .filter(task => task.status === status)
                .sort((a, b) => {
                    if (sortBy === 'priority') {
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    }
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                })
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
      
      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddTask}
        users={users}
        currentUser={currentUser}
      />
    </div>
  );
};

export default TaskManager;
