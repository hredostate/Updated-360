import React, { useState } from 'react';
import type { CurriculumReport } from '../../types';
import Spinner from '../common/Spinner';

interface CurriculumReportWidgetProps {
    report: CurriculumReport | null;
    onGenerate: () => Promise<void>;
}

const CurriculumReportWidget: React.FC<CurriculumReportWidgetProps> = ({ report, onGenerate }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        await onGenerate();
        setIsLoading(false);
    };

    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3">AI Curriculum Report</h3>
            
            {!report && (
                <div className="text-center py-8">
                    <p className="text-sm text-slate-500 mb-3">Generate an AI-powered summary of lesson plan submissions and coverage.</p>
                    <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                        {isLoading ? <Spinner size="sm" /> : 'Generate Report'}
                    </button>
                </div>
            )}

            {report && (
                 <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <p className="font-semibold text-sm text-blue-800 dark:text-blue-300">Executive Summary</p>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{report.summary}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-slate-500/10 rounded">
                            <p className="text-xs font-semibold uppercase text-slate-500">Submission Rate</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{report.submission_rate}%</p>
                        </div>
                         <div className="p-2 bg-slate-500/10 rounded">
                            <p className="text-xs font-semibold uppercase text-slate-500">Late Submissions</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">{report.late_submissions}</p>
                        </div>
                    </div>
                     {report.coverage_gaps.length > 0 && (
                        <div className="p-3 bg-yellow-500/10 rounded-lg">
                            <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-300">Identified Coverage Gaps</p>
                            <ul className="list-disc list-inside text-xs mt-1">
                            {report.coverage_gaps.map((gap, i) => (
                                <li key={i}>{gap.class_name}: {gap.topic}</li>
                            ))}
                            </ul>
                        </div>
                     )}
                     <p className="text-xs text-slate-400 text-right">Generated: {new Date(report.generated_at).toLocaleString()}</p>
                 </div>
            )}
        </div>
    );
};

export default CurriculumReportWidget;