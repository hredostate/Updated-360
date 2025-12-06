import React, { useState, useEffect } from 'react';
import type { SchoolSettings } from '../types';
import Spinner from './common/Spinner';

interface SchoolBrandingProps {
  settings: SchoolSettings | null;
  onSave: (branding: { primary_color: string }) => Promise<void>;
}

const SchoolBranding: React.FC<SchoolBrandingProps> = ({ settings, onSave }) => {
  const [primaryColor, setPrimaryColor] = useState('#1E3A8A');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.branding?.primary_color) {
      setPrimaryColor(settings.branding.primary_color);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ primary_color: primaryColor });
    setIsSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
       <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">System Appearance</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Customize the accent color used throughout the Guardian 360 dashboard.</p>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
                <div>
                    <label htmlFor="primary-color" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Accent Color</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <input
                            type="color"
                            id="primary-color-picker"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-10 h-10 p-1 border-none rounded-md"
                        />
                        <input
                            type="text"
                            id="primary-color-text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-full p-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300/60 dark:border-slate-700/60 rounded-md"
                        />
                    </div>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex justify-center items-center">
                    {isSaving ? <Spinner size="sm" /> : 'Save Appearance'}
                </button>
            </div>
            <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center mb-2">Live Preview</h3>
                <div className="p-4 rounded-lg border-2 border-slate-200/80 dark:border-slate-800/80">
                    <div className="w-full h-10 rounded-md mb-2" style={{ backgroundColor: primaryColor }}></div>
                    <h4 className="font-bold text-lg" style={{ color: primaryColor }}>Sample Header</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">This is how your accent color will be used for major UI elements like buttons and highlights.</p>
                    <button className="w-full mt-2 py-2 text-white font-semibold rounded-lg" style={{ backgroundColor: primaryColor }}>
                        Sample Button
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolBranding;