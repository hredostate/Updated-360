
import React, { useState, useEffect } from 'react';
import type { SchoolConfig } from '../types';
import Spinner from './common/Spinner';

interface PayrollSettingsProps {
    schoolConfig: SchoolConfig | null;
    onSave: (config: Partial<SchoolConfig>) => Promise<boolean>;
}

const PayrollSettings: React.FC<PayrollSettingsProps> = ({ schoolConfig, onSave }) => {
    const [config, setConfig] = useState<Partial<SchoolConfig>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (schoolConfig) {
            setConfig({
                late_checkin_deduction_percent: schoolConfig.late_checkin_deduction_percent,
                fine_early_checkout: schoolConfig.fine_early_checkout,
                fine_no_checkout: schoolConfig.fine_no_checkout,
                pay_cycle: schoolConfig.pay_cycle || 'monthly',
            });
        }
    }, [schoolConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave({
            late_checkin_deduction_percent: Number(config.late_checkin_deduction_percent) || null,
            fine_early_checkout: Number(config.fine_early_checkout) || 0,
            fine_no_checkout: Number(config.fine_no_checkout) || 0,
            pay_cycle: config.pay_cycle,
        });
        setIsSaving(false);
    };
    
    const inputClasses = "mt-1 w-full max-w-xs p-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300/60 dark:border-slate-700/60 rounded-md focus:ring-2 focus:ring-blue-500";
    const labelClasses = "block text-sm font-semibold text-slate-700 dark:text-slate-200";

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Payroll Automation & Penalties</h3>
            <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-6">
                
                {/* Pay Cycle */}
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                    <label htmlFor="pay_cycle" className={labelClasses}>Pay Cycle Frequency</label>
                    <p className="text-xs text-slate-500 mb-2">Determines the standard interval for salary calculations.</p>
                    <select
                        id="pay_cycle"
                        name="pay_cycle"
                        value={config.pay_cycle || 'monthly'}
                        onChange={e => setConfig(prev => ({ ...prev, pay_cycle: e.target.value as 'monthly' | 'weekly' }))}
                        className={inputClasses}
                    >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>

                {/* Late Check-in */}
                <div>
                    <label htmlFor="late_checkin_deduction_percent" className={labelClasses}>
                        Late Arrival Deduction (%)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Percentage of daily base pay to deduct for checking in after the designated start time.</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            id="late_checkin_deduction_percent"
                            name="late_checkin_deduction_percent"
                            value={config.late_checkin_deduction_percent || ''}
                            onChange={e => setConfig(prev => ({ ...prev, late_checkin_deduction_percent: Number(e.target.value) }))}
                            className={inputClasses}
                            placeholder="0"
                        />
                        <span className="text-slate-500">%</span>
                    </div>
                </div>

                {/* Checkout Fines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20">
                        <label htmlFor="fine_early_checkout" className="block text-sm font-bold text-orange-800 dark:text-orange-300">
                            Early Checkout Fine (₦)
                        </label>
                        <p className="text-xs text-orange-700/70 dark:text-orange-400 mb-2">Fixed penalty for leaving before shift end time.</p>
                        <input
                            type="number"
                            id="fine_early_checkout"
                            name="fine_early_checkout"
                            value={config.fine_early_checkout || ''}
                            onChange={e => setConfig(prev => ({ ...prev, fine_early_checkout: Number(e.target.value) }))}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 rounded-md focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., 500"
                        />
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                        <label htmlFor="fine_no_checkout" className="block text-sm font-bold text-red-800 dark:text-red-300">
                            No Checkout Fine (₦)
                        </label>
                        <p className="text-xs text-red-700/70 dark:text-red-400 mb-2">Fixed penalty for failing to record a checkout time.</p>
                        <input
                            type="number"
                            id="fine_no_checkout"
                            name="fine_no_checkout"
                            value={config.fine_no_checkout || ''}
                            onChange={e => setConfig(prev => ({ ...prev, fine_no_checkout: Number(e.target.value) }))}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-md focus:ring-2 focus:ring-red-500"
                            placeholder="e.g., 1000"
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2 shadow-lg shadow-blue-500/20">
                    {isSaving ? <Spinner size="sm" /> : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default PayrollSettings;
