import React, { useMemo } from 'react';
import type { ReportRecord, EngagementData } from '../../types';
import { exportToCsv } from '../../utils/export';

interface Props {
  reports: ReportRecord[];
}

const EngagementHeatmap: React.FC<Props> = ({ reports }) => {
    const { data, maxCount } = useMemo(() => {
        const timeSlots = ["12am-4am", "4am-8am", "8am-12pm", "12pm-4pm", "4pm-8pm", "8pm-12am"];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const heatmap: EngagementData[] = timeSlots.map(time => ({
            time, Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0,
        }));
        
        let max = 0;

        reports.forEach(report => {
            const date = new Date(report.created_at);
            const dayIndex = date.getDay(); // 0 = Sun
            const hour = date.getHours();
            const slotIndex = Math.floor(hour / 4);

            const dayKey = days[dayIndex] as keyof Omit<EngagementData, 'time'>;
            
            if (heatmap[slotIndex] && typeof heatmap[slotIndex][dayKey] === 'number') {
                (heatmap[slotIndex][dayKey] as number)++;
                const currentValue = heatmap[slotIndex][dayKey] as number;
                if (currentValue > max) {
                    max = currentValue;
                }
            }
        });
        
        return { data: heatmap, maxCount: max };
    }, [reports]);

    const handleExport = () => {
        exportToCsv(data, 'engagement_heatmap.csv');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-lg">Report Submission Heatmap</h3>
                    <p className="text-sm text-slate-500">Shows the busiest times for report submissions by day and time.</p>
                </div>
                <button onClick={handleExport} className="no-print px-3 py-1 bg-slate-200 text-sm rounded-md">Export to CSV</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center">
                    <thead>
                        <tr>
                            <th className="p-2 border border-slate-200 dark:border-slate-700">Time</th>
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <th key={day} className="p-2 border border-slate-200 dark:border-slate-700">{day}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(row => (
                            <tr key={row.time}>
                                <td className="p-2 border border-slate-200 dark:border-slate-700 font-semibold">{row.time}</td>
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => {
                                    const value = row[day as keyof Omit<EngagementData, 'time'>] as number;
                                    const opacity = value > 0 ? Math.max(0.1, Math.min(1, value / (maxCount || 1))) : 0;
                                    return (
                                        <td key={day} className="p-2 border border-slate-200 dark:border-slate-700" style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}>
                                            {value > 0 ? value : '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EngagementHeatmap;
