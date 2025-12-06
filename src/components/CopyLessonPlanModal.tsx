import React, { useState, useMemo, useEffect } from 'react';
import type { LessonPlan, UserProfile, AcademicTeachingAssignment, Team } from '../types';
import Spinner from './common/Spinner';

interface CopyLessonPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (sourcePlan: LessonPlan, targetEntityIds: number[]) => Promise<boolean>;
  planToCopy: LessonPlan | null;
  userProfile: UserProfile;
  allTeachingAssignments: AcademicTeachingAssignment[];
  allLessonPlans: LessonPlan[];
  teams: Team[];
}

const CopyLessonPlanModal: React.FC<CopyLessonPlanModalProps> = ({
  isOpen,
  onClose,
  onCopy,
  planToCopy,
  userProfile,
  allTeachingAssignments,
  allLessonPlans,
  teams,
}) => {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCopying, setIsCopying] = useState(false);

    useEffect(() => {
        // Reset selections when modal is opened for a new plan
        if (isOpen) {
            setSelectedIds([]);
        }
    }, [isOpen]);

    const targetOptions = useMemo(() => {
        if (!planToCopy) return [];

        const isAdmin = ['Admin', 'Principal'].includes(userProfile.role);
        const myTeam = teams.find(t => t.lead_id === userProfile.id);
        const isTeamLead = !!myTeam;

        // Determine which teachers' assignments the user can copy to
        let allowedUserIds: Set<string>;
        if (isAdmin) {
            allowedUserIds = new Set(allTeachingAssignments.map(a => a.teacher_user_id));
        } else if (isTeamLead) {
            allowedUserIds = new Set(myTeam.members.map(m => m.user_id));
            allowedUserIds.add(userProfile.id); // Lead can also copy to their own assignments
        } else {
            // Regular teacher can only copy to their own assignments
            allowedUserIds = new Set([userProfile.id]);
        }

        const potentialTargets = allTeachingAssignments.filter(a => allowedUserIds.has(a.teacher_user_id));
        
        // Find teaching entities that already have a plan for this week
        const weekOfCopyTo = planToCopy.week_start_date;
        const existingPlansForWeek = allLessonPlans.filter(p => p.week_start_date === weekOfCopyTo);
        const existingTargetIds = new Set(existingPlansForWeek.map(p => p.teaching_entity_id));

        // Final list: potential targets that are not the source and don't have a plan for that week yet.
        return potentialTargets.filter(a => 
            a.id !== planToCopy.teaching_entity_id &&
            !existingTargetIds.has(a.id)
        );
    }, [planToCopy, userProfile, teams, allTeachingAssignments, allLessonPlans]);
    
    const handleToggle = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleCopy = async () => {
        if (!planToCopy || selectedIds.length === 0) return;
        setIsCopying(true);
        const success = await onCopy(planToCopy, selectedIds);
        setIsCopying(false);
        if (success) {
            onClose();
        }
    };

    if (!isOpen || !planToCopy) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Copy Lesson Plan</h2>
                <p className="text-sm text-slate-500 mb-4">
                    Copying "{planToCopy.title}" for week of {planToCopy.week_start_date} to other assignments.
                </p>

                <div className="flex-grow overflow-y-auto border-y border-slate-200/60 dark:border-slate-700/60 py-4 space-y-2">
                    {targetOptions.length > 0 ? (
                        targetOptions.map(assignment => (
                            <label key={assignment.id} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(assignment.id)}
                                    onChange={() => handleToggle(assignment.id)}
                                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-transparent"
                                />
                                <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {`${assignment.subject_name} - ${assignment.academic_class?.name}`}
                                    </span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Teacher: {assignment.teacher?.name}
                                    </p>
                                </div>
                            </label>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                            No other valid assignments to copy to for this week.
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isCopying} className="px-4 py-2 bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">Cancel</button>
                    <button 
                        onClick={handleCopy} 
                        disabled={isCopying || selectedIds.length === 0} 
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center min-w-[100px] justify-center"
                    >
                        {isCopying ? <Spinner size="sm" /> : `Copy (${selectedIds.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CopyLessonPlanModal;