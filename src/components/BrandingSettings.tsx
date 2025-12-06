import React, { useState, useEffect } from 'react';
import type { SchoolConfig } from '../types';
import Spinner from './common/Spinner';

interface BrandingSettingsProps {
    schoolConfig: SchoolConfig | null;
    onSave: (config: Partial<SchoolConfig>) => Promise<boolean>;
}

const BrandingSettings: React.FC<BrandingSettingsProps> = ({ schoolConfig, onSave }) => {
    // Initialize with empty/default values to prevent controlled/uncontrolled errors if config is null initially
    const [config, setConfig] = useState<Partial<SchoolConfig>>({
        display_name: '',
        motto: '',
        address: '',
        phone: '',
        logo_url: '',
        student_id_prefix: '',
        staff_id_prefix: '',
        id_year_mode: 'current_year'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (schoolConfig) {
            setConfig(schoolConfig);
        }
    }, [schoolConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value === '' ? null : value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(config);
        setIsSaving(false);
    };

    const inputClasses = "w-full p-2 mt-1 bg-white/50 dark:bg-slate-800/50 border border-slate-300/60 dark:border-slate-700/60 rounded-md";
    const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-200";
    
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">School Identity</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your school's official name, contact details, and logo.</p>
            
            {!schoolConfig && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
                    No school identity found. Please fill out the details below to initialize your school configuration.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="display_name" className={labelClasses}>Display Name</label>
                    <input type="text" name="display_name" id="display_name" value={config.display_name || ''} onChange={handleChange} className={inputClasses} placeholder="e.g. University Preparatory Secondary School" />
                </div>
                <div>
                    <label htmlFor="motto" className={labelClasses}>Motto</label>
                    <input type="text" name="motto" id="motto" value={config.motto || ''} onChange={handleChange} className={inputClasses} placeholder="e.g. Excellence in Learning" />
                </div>
                 <div>
                    <label htmlFor="address" className={labelClasses}>Address</label>
                    <input type="text" name="address" id="address" value={config.address || ''} onChange={handleChange} className={inputClasses} placeholder="e.g. 123 School Lane" />
                </div>
                <div>
                    <label htmlFor="phone" className={labelClasses}>Phone</label>
                    <input type="text" name="phone" id="phone" value={config.phone || ''} onChange={handleChange} className={inputClasses} placeholder="e.g. +234 800 000 0000" />
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="logo_url" className={labelClasses}>Logo URL</label>
                    <input type="text" name="logo_url" id="logo_url" value={config.logo_url || ''} onChange={handleChange} className={inputClasses} placeholder="https://..." />
                    {config.logo_url && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-slate-500">Preview:</span>
                            <img src={config.logo_url} alt="Logo Preview" className="h-8 w-8 object-contain border rounded" />
                        </div>
                    )}
                </div>
            </div>
             <h3 className="text-lg font-semibold mt-6">ID Generation</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="student_id_prefix" className={labelClasses}>Student ID Prefix</label>
                    <input type="text" name="student_id_prefix" id="student_id_prefix" value={config.student_id_prefix || ''} onChange={handleChange} className={inputClasses} placeholder="e.g. UPSS/ST/" />
                </div>
                <div>
                    <label htmlFor="staff_id_prefix" className={labelClasses}>Staff ID Prefix</label>
                    <input type="text" name="staff_id_prefix" id="staff_id_prefix" value={config.staff_id_prefix || ''} onChange={handleChange} className={inputClasses} placeholder="e.g. UPSS/SF/" />
                </div>
                 <div>
                    <label htmlFor="id_year_mode" className={labelClasses}>ID Year Mode</label>
                    <select name="id_year_mode" id="id_year_mode" value={config.id_year_mode || ''} onChange={handleChange} className={inputClasses}>
                        <option value="">None</option>
                        <option value="current_year">Current Year (e.g., 24)</option>
                        <option value="admission_year">Admission Year (e.g., 21)</option>
                    </select>
                </div>
             </div>

            <div className="flex justify-end pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center min-w-[100px] justify-center">
                    {isSaving ? <Spinner size="sm" /> : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default BrandingSettings;