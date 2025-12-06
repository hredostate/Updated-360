
import React, { useState, useMemo } from 'react';
import type { PayrollRun, PayrollItem, UserProfile } from '../types';
import Spinner from './common/Spinner';
import { ChevronDownIcon, SearchIcon } from './common/icons';

interface PayrollManagerProps {
    runs: (PayrollRun & { items: (PayrollItem & { user?: UserProfile })[] })[];
    handleGeneratePayslips: (runId: number) => Promise<void>;
}

const PayrollManager: React.FC<PayrollManagerProps> = ({ runs, handleGeneratePayslips }) => {
    const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
    const [generatingId, setGeneratingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleGenerate = async (runId: number) => {
        setGeneratingId(runId);
        await handleGeneratePayslips(runId);
        setGeneratingId(null);
    };

    const filteredRuns = useMemo(() => {
        if (!searchQuery.trim()) return runs;
        const q = searchQuery.toLowerCase();
        return runs.filter(run => 
            run.period_label.toLowerCase().includes(q) ||
            run.status.toLowerCase().includes(q) ||
            run.items.some(item => item.user?.name.toLowerCase().includes(q))
        );
    }, [runs, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payroll History</h3>
                <div className="relative w-64">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search runs or staff..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 p-2 text-sm border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredRuns.length === 0 && <p className="text-center text-slate-500 py-8">No payroll history found.</p>}
                {filteredRuns.map(run => (
                    <div key={run.id} className="border rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div 
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                        >
                            <div>
                                <p className="font-bold text-lg">{run.period_label}</p>
                                <p className="text-xs text-slate-500">{new Date(run.created_at).toLocaleDateString()} • {run.items.length} Staff Paid</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-xl font-bold text-slate-800 dark:text-white">₦{Number(run.total_amount).toLocaleString()}</p>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${
                                    run.status === 'success' ? 'bg-green-100 text-green-800' :
                                    run.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                }`}>{run.status}</span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedRunId === run.id ? 'rotate-180' : ''}`} />
                            </div>
                        </div>

                        {expandedRunId === run.id && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex justify-end mb-4">
                                    <button 
                                        onClick={() => handleGenerate(run.id)} 
                                        disabled={generatingId === run.id}
                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
                                    >
                                        {generatingId === run.id ? <Spinner size="sm" /> : 'Generate Payslips'}
                                    </button>
                                </div>
                                <div className="max-h-96 overflow-y-auto border rounded-lg bg-white dark:bg-slate-900">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-semibold">
                                            <tr>
                                                <th className="p-3">Staff</th>
                                                <th className="p-3">Gross</th>
                                                <th className="p-3">Deductions</th>
                                                <th className="p-3">Net Pay</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Payslip</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {run.items.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                                    <td className="p-3 font-medium">{item.user?.name}</td>
                                                    <td className="p-3">₦{Number(item.gross_amount).toLocaleString()}</td>
                                                    <td className="p-3 text-red-600">
                                                        ₦{Number(item.gross_amount - item.net_amount).toLocaleString()}
                                                    </td>
                                                    <td className="p-3 font-bold">₦{Number(item.net_amount).toLocaleString()}</td>
                                                    <td className="p-3 text-xs">{item.transfer_status || 'Completed'}</td>
                                                    <td className="p-3">
                                                        {item.payslip_url ? (
                                                            <a href={item.payslip_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-bold">Download</a>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Pending</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PayrollManager;
