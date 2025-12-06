
import React, { useState, useMemo, useEffect } from 'react';
import type { StudentInterventionPlan, SIPLog, Student } from '../types';
import Spinner from './common/Spinner';
import { VIEWS } from '../constants';

// --- Create SIP Modal (Component-scoped) ---
interface CreateSIPModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentId: number, goals: string[]) => Promise<boolean>;
    students: Student[];
    existingPlanStudentIds: number[];
}

const CreateSIPModal: React.FC<CreateSIPModalProps> = ({ isOpen, onClose, onSave, students, existingPlanStudentIds }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [goals, setGoals] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const availableStudents = useMemo(() => {
        return students.filter(s => !existingPlanStudentIds.includes(s.id));
    }, [students, existingPlanStudentIds]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !goals.trim()) return;
        
        setIsSaving(true);
        const goalsArray = goals.split('\n').filter(g => g.trim() !== '');
        const success = await onSave(Number(selectedStudentId), goalsArray);
        setIsSaving(false);
        
        if (success) {
            setSelectedStudentId('');
            setGoals('');
            onClose();
        }
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-lg m-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold">Create New Intervention Plan</h2>
                    <div>
                        <label htmlFor="student-select" className="block text-sm font-medium">Student</label>
                        <select id="student-select" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} required className="mt-1 w-full p-2 border rounded-md">
                            <option value="" disabled>Select a student</option>
                            {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="goals" className="block text-sm font-medium">Goals</label>
                        <textarea id="goals" value={goals} onChange={e => setGoals(e.target.value)} required rows={5} className="mt-1 w-full p-2 border rounded-md" placeholder="Enter one goal per line..."></textarea>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center min-w-[100px] justify-center">
                            {isSaving ? <Spinner size="sm" /> : 'Save Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- Main View Component ---
interface SIPViewProps {
  interventionPlans: StudentInterventionPlan[];
  sipLogs: SIPLog[];
  students: Student[];
  onCreatePlan: (studentId: number, goals: string[]) => Promise<boolean>;
  onAddLog: (planId: number, logEntry: string) => Promise<boolean>;
  userPermissions: string[];
  // FIX: Add missing props to align with App.tsx
  onUpdatePlan: (planId: number, data: Partial<StudentInterventionPlan>) => Promise<boolean>;
  studentIdToSelect?: number;
}

const SIPView: React.FC<SIPViewProps> = ({ interventionPlans, sipLogs, students, onCreatePlan, onAddLog, userPermissions, onUpdatePlan, studentIdToSelect }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [newLogEntry, setNewLogEntry] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const canManage = userPermissions.includes('manage-students') || userPermissions.includes('*');

  const activePlans = useMemo(() => interventionPlans.filter(p => p.is_active), [interventionPlans]);
  
  const selectedPlan = useMemo(() => interventionPlans.find(p => p.id === selectedPlanId), [interventionPlans, selectedPlanId]);

  useEffect(() => {
      const planToSelect = studentIdToSelect ? interventionPlans.find(p => p.student_id === studentIdToSelect) : null;
      if (planToSelect) {
          setSelectedPlanId(planToSelect.id);
      } else if (!selectedPlanId && activePlans.length > 0) {
          setSelectedPlanId(activePlans[0].id);
      }
  }, [studentIdToSelect, interventionPlans, activePlans, selectedPlanId]);


  const selectedPlanLogs = useMemo(() => {
    if (!selectedPlan) return [];
    return sipLogs
        .filter(log => log.sip_id === selectedPlan.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedPlan, sipLogs]);

  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogEntry.trim() || !selectedPlan || !canManage) return;

    setIsLogging(true);
    const success = await onAddLog(selectedPlan.id, newLogEntry);
    setIsLogging(false);
    if (success) {
        setNewLogEntry('');
    }
  };

  return (
    <>
        <div className="flex h-full bg-white/60 dark:bg-slate-900/40 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800/60 animate-fade-in overflow-hidden backdrop-blur-xl">
        {/* Left Panel: List of students with plans */}
        <div className="w-1/3 border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col">
            <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex-shrink-0 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Intervention Plans</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{activePlans.length} active plans</p>
                </div>
                {canManage && <button onClick={() => setIsCreateModalOpen(true)} className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">Create Plan</button>}
            </div>
            <div className="overflow-y-auto">
            {activePlans.length > 0 ? (
                activePlans.map(plan => (
                <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`w-full text-left p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors hover:bg-slate-500/10 ${selectedPlan?.id === plan.id ? 'bg-blue-500/10' : ''}`}
                >
                    <p className="font-semibold text-slate-800 dark:text-white">{plan.student?.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Grade {plan.student?.grade}</p>
                </button>
                ))
            ) : (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    <p>No active intervention plans.</p>
                    {canManage && <p className="mt-2">Click "Create Plan" to get started.</p>}
                </div>
            )}
            </div>
        </div>

        {/* Right Panel: Details of selected plan */}
        <div className="w-2/3 flex flex-col">
            {selectedPlan ? (
            <>
                <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex-shrink-0 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedPlan.student?.name}</h3>
                        <p className="text-slate-500 dark:text-slate-400">Plan created on {new Date(selectedPlan.created_at).toLocaleDateString()}</p>
                        {!selectedPlan.is_active && <p className="text-sm font-bold text-red-500 mt-1">This plan is archived.</p>}
                    </div>
                    {canManage && selectedPlan.is_active && (
                        <button
                            onClick={() => onUpdatePlan(selectedPlan.id, { is_active: false })}
                            className="px-3 py-1 bg-red-500/10 text-red-700 dark:text-red-300 text-sm font-semibold rounded-lg hover:bg-red-500/20"
                        >
                            Archive Plan
                        </button>
                    )}
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Goals</h4>
                    <ul className="list-disc list-inside space-y-2 bg-slate-500/10 p-4 rounded-lg">
                    {selectedPlan.goals.map((goal, index) => (
                        <li key={index} className="text-sm text-slate-800 dark:text-slate-100">{goal}</li>
                    ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Progress Log</h4>
                    <div className="space-y-4">
                    {selectedPlanLogs.length > 0 ? (
                        selectedPlanLogs.map(log => (
                        <div key={log.id} className="p-3 bg-blue-500/10 border-l-4 border-blue-400 rounded-r-lg animate-fade-in">
                            <p className="text-sm text-slate-800 dark:text-slate-100">{log.log_entry}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">
                            - {log.author?.name || 'Unknown User'} on {new Date(log.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No logs for this plan yet.</p>
                    )}
                    </div>
                </div>
                </div>
                {canManage && selectedPlan.is_active && <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 flex-shrink-0">
                    <form onSubmit={handleAddLogSubmit} className="flex items-center space-x-2">
                        <input type="text" value={newLogEntry} onChange={e => setNewLogEntry(e.target.value)} placeholder="Add a new log entry..." className="flex-1 p-2 border border-slate-300/60 dark:border-slate-700/60 rounded-md bg-transparent"/>
                        <button type="submit" disabled={isLogging} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center min-w-[100px] justify-center">
                            {isLogging ? <Spinner size="sm"/> : 'Add Log'}
                        </button>
                    </form>
                </div>}
            </>
            ) : (
            <div className="flex-1 flex justify-center items-center">
                <p className="text-slate-500 dark:text-slate-400">Select a plan to view details.</p>
            </div>
            )}
        </div>
        </div>
        <CreateSIPModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSave={onCreatePlan}
            students={students}
            existingPlanStudentIds={activePlans.map(p => p.student_id)}
        />
    </>
  );
};

export default SIPView;
