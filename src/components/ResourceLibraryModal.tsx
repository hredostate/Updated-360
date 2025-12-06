import React from 'react';

interface ResourceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResourceLibraryModal: React.FC<ResourceLibraryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-lg m-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Resource Library</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Helpful links and documents to get the most out of Guardian 360.</p>
        
        <div className="mt-4 space-y-3">
          <a href="#" className="block p-3 bg-slate-500/10 rounded-lg hover:bg-slate-500/20">
            <p className="font-semibold text-blue-700 dark:text-blue-300">Getting Started Guide (PDF)</p>
          </a>
          <a href="#" className="block p-3 bg-slate-500/10 rounded-lg hover:bg-slate-500/20">
            <p className="font-semibold text-blue-700 dark:text-blue-300">Video Tutorial: Submitting Effective Reports</p>
          </a>
           <div className="p-3 bg-slate-500/10 rounded-lg">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Need help?</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Contact support at support@schoolguardian.app</p>
           </div>
        </div>

        <div className="flex justify-end pt-4">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ResourceLibraryModal;
