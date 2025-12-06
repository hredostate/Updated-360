import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ReportRecord, DailySentiment } from '../../types';
import { exportToCsv } from '../../utils/export';

interface Props {
  reports: ReportRecord[];
}

const MoodOverTimeChart: React.FC<Props> = ({ reports }) => {
  const data = useMemo<DailySentiment[]>(() => {
    const sentimentByDay: { [key: string]: { Positive: number, Negative: number, Neutral: number } } = {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        sentimentByDay[dateString] = { Positive: 0, Negative: 0, Neutral: 0 };
    }

    reports.forEach(report => {
        if (!report.analysis?.sentiment) return;
        const reportDate = new Date(report.created_at);
        if (reportDate < thirtyDaysAgo) return;

        const dateString = reportDate.toISOString().split('T')[0];
        if (sentimentByDay[dateString]) {
            sentimentByDay[dateString][report.analysis.sentiment]++;
        }
    });

    return Object.keys(sentimentByDay)
      .map(date => ({ date, ...sentimentByDay[date] }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reports]);

  const handleExport = () => {
    exportToCsv(data, 'mood_over_time.csv');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="font-bold text-lg">Report Sentiment Over Last 30 Days</h3>
            <p className="text-sm text-slate-500">Tracks the emotional tone of submitted reports.</p>
        </div>
        <button onClick={handleExport} className="no-print px-3 py-1 bg-slate-200 text-sm rounded-md">Export to CSV</button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="Positive" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
          <Area type="monotone" dataKey="Negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
          <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#64748b" fill="#64748b" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodOverTimeChart;
