import React, { useState } from 'react';
import type { Student } from '../types';
import Spinner from './common/Spinner';

interface ParentCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onLogCommunication: (studentId: number, details: { method: string, notes: string }) => Promise<void>;
}

const ParentCommunicationModal: React.FC<ParentCommunicationModalProps> = ({ isOpen, onClose, student, onLogCommunication }) => {
  const [method, setMethod] = useState('Phone Call');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setIsSubmitting(true);
    await onLogCommunication(student.id, { method, notes });
    setIsSubmitting(false);
    setNotes('');
    onClose();
  };
  
  const commonInputClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-xl border border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";


  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-lg m-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Log Communication for {student.name}</h2>
          
          <div>
            <label htmlFor="comm-method" className="block text-sm font-medium">Communication Method</label>
            <select id="comm-method" value={method} onChange={e => setMethod(e.target.value)} className={commonInputClasses}>
              <option>Phone Call</option>
              <option>Email</option>
              <option>In-Person Meeting</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="comm-notes" className="block text-sm font-medium">Notes</label>
            <textarea
              id="comm-notes"
              rows={5}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
              placeholder={`Summary of the ${method.toLowerCase()}...`}
              className={commonInputClasses}
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center min-w-[100px] justify-center">
              {isSubmitting ? <Spinner size="sm" /> : 'Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParentCommunicationModal;
