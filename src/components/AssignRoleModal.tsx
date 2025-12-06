
import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile, RoleDetails } from '../types';
import Spinner from './common/Spinner';
import { SearchIcon } from './common/icons';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleId: number, userIds: string[]) => Promise<void>;
  role: RoleDetails;
  allUsers: UserProfile[];
  assignments: { user_id: string, role_id: number }[];
}

const AssignRoleModal: React.FC<AssignRoleModalProps> = ({ isOpen, onClose, onSave, role, allUsers, assignments }) => {
  // Memoize initial set from props.
  // This recalculates whenever assignments or role.id changes (which happens after App.tsx state update).
  const assignedUserIds = useMemo(() => 
    new Set(assignments.filter(a => a.role_id === role.id).map(a => a.user_id))
  , [assignments, role.id]);

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset local state when modal opens OR when assignedUserIds prop changes.
  // This ensures that if the parent updates the data while modal is open (or re-opened), we see fresh data.
  useEffect(() => {
    if (isOpen) {
        setSelectedUserIds(new Set(assignedUserIds));
        setSearchQuery('');
    }
  }, [isOpen, assignedUserIds]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;
    const q = searchQuery.toLowerCase();
    return allUsers.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [allUsers, searchQuery]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(role.id!, Array.from(selectedUserIds));
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-md m-4 flex flex-col max-h-[90vh]">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Assign Users to '{role.title}'</h2>
        
        <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
                type="text"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
          {filteredUsers.length > 0 ? filteredUsers.map(user => (
            <label key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-500/10 cursor-pointer">
              <input type="checkbox" checked={selectedUserIds.has(user.id)} onChange={() => handleToggleUser(user.id)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
              <div className="text-sm">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            </label>
          )) : (
             <p className="text-center text-slate-500 text-sm py-4">No users found.</p>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center min-w-[100px] justify-center hover:bg-blue-700 disabled:opacity-50">
            {isSaving ? <Spinner size="sm" /> : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignRoleModal;