import React, { useState } from 'react';
import type { WidgetDefinition } from '../types';
import Spinner from './common/Spinner';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  allWidgets: WidgetDefinition[];
  currentConfig: string[];
  onSave: (newConfig: string[]) => Promise<void>;
}

const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  onClose,
  allWidgets,
  currentConfig,
  onSave,
}) => {
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(currentConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleWidget = (widgetId: string) => {
    setSelectedWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(selectedWidgets);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Customize Dashboard</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Select the widgets you want to see on your dashboard. Changes will be saved to your profile.</p>

        <div className="flex-grow overflow-y-auto border-y border-slate-200/60 dark:border-slate-800/60 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {allWidgets.map(widget => (
            <label
              key={widget.id}
              className="flex items-center space-x-3 p-3 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedWidgets.includes(widget.id)}
                onChange={() => handleToggleWidget(widget.id)}
                className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-transparent"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{widget.title}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center min-w-[100px] justify-center">
            {isSaving ? <Spinner size="sm" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeDashboardModal;