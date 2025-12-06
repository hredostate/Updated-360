
import React, { useState, useMemo, useEffect } from 'react';
import type { Assessment, AcademicTeachingAssignment } from '../types';
import Spinner from './common/Spinner';

interface CopyAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (sourceId: number, targetIds: number[]) => Promise<boolean>;
  assessmentToCopy: Assessment | null;
  allAssignments: AcademicTeachingAssignment[];
  allAssessments: Assessment[];
}

const CopyAssessmentModal: React.FC<CopyAssessmentModalProps> = ({
  isOpen,
  onClose,
  onCopy,
  assessmentToCopy,
  allAssignments,
  allAssessments,
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
        if (!assessmentToCopy) return [];
        
        // Find all assignments that do NOT already have an assessment with the same title
        const existingAssessmentTitlesForTargets = new Map<number, Set<string>>();
        allAssessments.forEach(a => {
            if (!existingAssessmentTitlesForTargets.has(a.teaching_assignment_id)) {
                existingAssessmentTitlesForTargets.set(a.teaching_assignment_id, new Set());
            }
            existingAssessmentTitlesForTargets.get(a.teaching_assignment_id)!.add(a.title.toLowerCase());
        });

        return allAssignments.filter(a => 
            a.id !== assessmentToCopy.teaching_assignment_id &&
            !existingAssessmentTitlesForTargets.get(a.id)?.has(assessmentToCopy.title.toLowerCase())
        );
    }, [assessmentToCopy, allAssignments, allAssessments]);
    
    const handleToggle = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleCopy = async () => {
        if (!assessmentToCopy || selectedIds.length === 0) return;
        setIsCopying(true);
        const success = await onCopy(assessmentToCopy.id, selectedIds);
        setIsCopying(false);
        if (success) {
            onClose();
        }
    };

    if (!isOpen || !assessmentToCopy) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Copy Assessment</h2>
                <p className="text-sm text-slate-500 mb-4">
                    Copying "{assessmentToCopy.title}" to other teaching assignments.
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
                                        {`${assignment.academic_class?.name} - ${assignment.subject_name}`}
                                    </span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Teacher: {assignment.teacher?.name}
                                    </p>
                                </div>
                            </label>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                            No other valid assignments to copy this assessment to.
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

export default CopyAssessmentModal;
