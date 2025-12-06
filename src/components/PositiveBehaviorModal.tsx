import React, { useState, useEffect } from 'react';
import type { Student } from '../types';
import Spinner from './common/Spinner';
import SearchableSelect from './common/SearchableSelect';

interface PositiveBehaviorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentId: number, description: string) => Promise<void>;
  students: Student[];
  defaultStudent?: Student;
}

const PositiveBehaviorModal: React.FC<PositiveBehaviorModalProps> = ({ isOpen, onClose, onSubmit, students, defaultStudent }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedStudentId(defaultStudent ? defaultStudent.id : null);
      setDescription('');
      setError(null);
    }
  }, [isOpen, defaultStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !description) {
      setError('Please select a student and provide a description.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    await onSubmit(selectedStudentId, description);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Log Positive Behavior</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-3xl font-light">&times;</button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="student" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Student</label>
            <SearchableSelect
              options={students.map(s => ({ value: s.id, label: s.name }))}
              value={selectedStudentId}
              onChange={value => setSelectedStudentId(value as number)}
              placeholder="Select a student"
              disabled={!!defaultStudent}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description of Behavior</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1 block w-full border rounded-xl shadow-sm py-2 px-3 sm:text-sm border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Helped a classmate who was struggling with their work."
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center">
              {isSubmitting && <Spinner size="sm" />}
              <span className={isSubmitting ? 'ml-2' : ''}>Log Behavior</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PositiveBehaviorModal;
