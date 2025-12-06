import React, { useState } from 'react';
import type { RoleTitle } from '../types';
import Spinner from './common/Spinner';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteUser: (email: string, role: RoleTitle) => Promise<void>;
  roles: RoleTitle[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onInviteUser, roles }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleTitle>('Teacher');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onInviteUser(email, role);
    setIsSubmitting(false);
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-md m-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Invite New User</h2>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium">Assign Role</label>
            <select id="role" value={role} onChange={e => setRole(e.target.value as RoleTitle)} className="mt-1 w-full p-2 border rounded-md">
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-500/20 font-semibold rounded-lg">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg flex items-center">
              {isSubmitting && <Spinner size="sm" />}
              <span className={isSubmitting ? 'ml-2' : ''}>Send Invite</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
