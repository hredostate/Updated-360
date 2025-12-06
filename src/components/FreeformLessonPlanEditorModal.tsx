
import React, { useState, useEffect } from 'react';
import type { LessonPlan } from '../types';
import Spinner from './common/Spinner';

interface FreeformLessonPlanEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Partial<LessonPlan>, file: File | null) => Promise<LessonPlan | null>;
  initialPlanData: Partial<LessonPlan> | null;
}

const FreeformLessonPlanEditorModal: React.FC<FreeformLessonPlanEditorModalProps> = ({ isOpen, onClose, onSave, initialPlanData }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialPlanData) {
      setTitle(initialPlanData.title || '');
      setContent(initialPlanData.freeform_content || '');
      setFile(null);
    } else {
      setTitle('');
      setContent('');
      setFile(null);
    }
  }, [initialPlanData, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await onSave({
        ...initialPlanData,
        title,
        freeform_content: content,
        plan_type: 'freeform',
    }, file);
    setIsSaving(false);
    if (result) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">{initialPlanData?.id ? 'Edit' : 'Create'} Blank Lesson Plan</h2>
        
        <div className="flex-grow space-y-4 overflow-y-auto pr-2">
            <div>
                <label htmlFor="freeform-title" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
                <input
                    id="freeform-title"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Week 5 Excursion Plan"
                    className="w-full p-2 mt-1 border rounded-md bg-white/50 dark:bg-slate-800/50 border-slate-300/60 dark:border-slate-700/60"
                />
            </div>
            <div>
                 <label htmlFor="freeform-content" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Content</label>
                <textarea
                    id="freeform-content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Enter all your lesson plan details here..."
                    className="w-full p-2 mt-1 border rounded-md bg-white/50 dark:bg-slate-800/50 border-slate-300/60 dark:border-slate-700/60 min-h-[40vh]"
                />
            </div>
            <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Attach PDF (Optional)</label>
                <p className="text-xs text-slate-500 mb-2">You can either type content above or upload a PDF.</p>
                <input 
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400 flex items-center min-w-[80px] justify-center">
            {isSaving ? <Spinner size="sm" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreeformLessonPlanEditorModal;
