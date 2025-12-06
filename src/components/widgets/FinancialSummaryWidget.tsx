import React from 'react';
import type { ReportRecord } from '../../types';

interface FinancialSummaryWidgetProps {
    reports: ReportRecord[];
}

const FinancialSummaryWidget: React.FC<FinancialSummaryWidgetProps> = ({ reports }) => {
    const highCostRequisitions = reports.filter(r => r.report_type === 'Supply Requisition' && r.report_text.toLowerCase().includes('bulk')).length;

    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3">Financial Summary</h3>
            <div className="grid grid-cols-1 gap-4 text-center">
                 <div className="p-3 bg-red-500/10 rounded-lg">
                    <p className="text-xs text-red-500 dark:text-red-400 uppercase font-semibold">High-Cost Requisitions</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200 mt-1">{highCostRequisitions}</p>
                    <p className="text-sm text-red-600 dark:text-red-300">awaiting review</p>
                </div>
                <div className="p-3 bg-slate-500/10 rounded-lg text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Full budget and expense tracking coming soon.</p>
                </div>
            </div>
        </div>
    );
};

export default FinancialSummaryWidget;