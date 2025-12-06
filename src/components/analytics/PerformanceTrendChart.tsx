

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Task, DailyPerformance } from '../../types';
import { TaskStatus } from '../../types';
import { exportToCsv } from '../../utils/export';

interface Props {
  tasks: Task[];
}

const PerformanceTrendChart: React.FC<Props> = ({ tasks }) => {
  const data = useMemo<DailyPerformance[]>(() => {
    const performanceByDay: { [key: string]: { created: number, completed: number } } = {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        performanceByDay[dateString] = { created: 0, completed: 0 };
    }

    tasks.forEach(task => {
        // FIX: Access the created_at property which now exists on the Task type.
        const createdDate = new Date(task.created_at);
        if (createdDate >= thirtyDaysAgo) {
            const createdDateString = createdDate.toISOString().split('T')[0];
            if (performanceByDay[createdDateString]) {
                performanceByDay[createdDateString].created++;
            }
        }
        
        if(task.status === TaskStatus.Completed) {
            const updatedDate = new Date(task.updated_at);
            if (updatedDate >= thirtyDaysAgo) {
                const updatedDateString = updatedDate.toISOString().split('T')[0];
                if (performanceByDay[updatedDateString]) {
                    performanceByDay[updatedDateString].completed++;
                }
            }
        }
    });

    return Object.keys(performanceByDay)
      .map(date => ({ date, ...performanceByDay[date] }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks]);
  
  const handleExport = () => {
    exportToCsv(data, 'performance_trends.csv');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="font-bold text-lg">Task Trends (Last 30 Days)</h3>
            <p className="text-sm text-slate-500">Compares the number of tasks created vs. completed daily.</p>
        </div>
        <button onClick={handleExport} className="no-print px-3 py-1 bg-slate-200 text-sm rounded-md">Export to CSV</button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="created" name="Created" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="completed" name="Completed" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceTrendChart;
