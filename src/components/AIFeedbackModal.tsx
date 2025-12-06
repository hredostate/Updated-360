import React, { useState } from 'react';
import Spinner from './common/Spinner';

interface AIFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (feedback: { isHelpful: boolean; comments: string }) => Promise<void>;
  generatedContent: string; // The content the user is giving feedback on
}

const AIFeedbackModal: React.FC<AIFeedbackModalProps> = ({ isOpen, onClose, onSubmitFeedback, generatedContent }) => {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (isHelpful === null) return;
    setIsSubmitting(true);
    await onSubmitFeedback({ isHelpful, comments });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-lg m-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Feedback on AI Generation</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Your feedback helps us improve the AI assistant.</p>

        <div className="my-4 p-3 bg-slate-500/10 rounded-md max-h-32 overflow-y-auto">
          <p className="text-xs italic text-slate-500 dark:text-slate-400">"{generatedContent}"</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Was this helpful?</p>
            <div className="flex space-x-2 mt-2">
              <button onClick={() => setIsHelpful(true)} className={`px-4 py-2 rounded-lg ${isHelpful === true ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>👍 Yes</button>
              <button onClick={() => setIsHelpful(false)} className={`px-4 py-2 rounded-lg ${isHelpful === false ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>👎 No</button>
            </div>
          </div>
          <div>
            <label htmlFor="comments" className="text-sm font-medium">Additional comments (optional)</label>
            <textarea
              id="comments"
              rows={3}
              value={comments}
              onChange={e => setComments(e.target.value)}
              className="mt-1 w-full p-2 bg-white/50 dark:bg-slate-800/50 border rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-500/20 font-semibold rounded-lg">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting || isHelpful === null} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-blue-400 flex items-center">
            {isSubmitting && <Spinner size="sm" />}
            <span className={isSubmitting ? 'ml-2' : ''}>Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIFeedbackModal;
