import React, { useState, useMemo, useEffect } from 'react';
import type { TeachingAssignment, Curriculum, CurriculumWeek, UserProfile, Team } from '../types';
import Spinner from './common/Spinner';

interface CurriculumManagerProps {
  teachingAssignments: TeachingAssignment[];
  curricula: Curriculum[];
  curriculumWeeks: CurriculumWeek[];
  onSave: (teachingAssignmentId: number, weeksData: { week_number: number; expected_topics: string }[]) => Promise<boolean>;
  onSaveWeek?: (teachingAssignmentId: number, weekData: { week_number: number; expected_topics: string }) => Promise<boolean>;
  userProfile: UserProfile;
  teams: Team[];
}

const CurriculumManager: React.FC<CurriculumManagerProps> = ({
  teachingAssignments,
  curricula,
  curriculumWeeks,
  onSave,
  onSaveWeek,
  userProfile,
  teams,
}) => {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [weeks, setWeeks] = useState<Array<{ week_number: number; expected_topics: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savingWeek, setSavingWeek] = useState<number | null>(null);

  const myVisibleAssignments = useMemo(() => {
    if (['Admin', 'Principal'].includes(userProfile.role)) {
      return teachingAssignments;
    }
    const myTeam = teams.find(t => t.lead_id === userProfile.id);
    if (myTeam) {
      const memberIds = new Set(myTeam.members.map(m => m.user_id));
      memberIds.add(userProfile.id);
      return teachingAssignments.filter(a => memberIds.has(a.user_id));
    }
    return teachingAssignments.filter(a => a.user_id === userProfile.id);
  }, [teachingAssignments, userProfile, teams]);
  
  useEffect(() => {
    if (myVisibleAssignments.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(myVisibleAssignments[0].id);
    }
  }, [myVisibleAssignments, selectedAssignmentId]);

  useEffect(() => {
    if (selectedAssignmentId) {
      const curriculum = curricula.find(c => c.teaching_entity_id === selectedAssignmentId);
      const relevantWeeks = curriculum ? curriculumWeeks.filter(w => w.curriculum_id === curriculum.id) : [];
      
      const newWeeks = Array.from({ length: 14 }, (_, i) => {
        const weekNum = i + 1;
        const existingWeek = relevantWeeks.find(w => w.week_number === weekNum);
        return {
          week_number: weekNum,
          expected_topics: existingWeek?.expected_topics || '',
        };
      });
      setWeeks(newWeeks);
    } else {
      setWeeks([]);
    }
  }, [selectedAssignmentId, curricula, curriculumWeeks]);

  const handleWeekChange = (index: number, value: string) => {
    const newWeeks = [...weeks];
    newWeeks[index].expected_topics = value;
    setWeeks(newWeeks);
  };

  const handleSave = async () => {
    if (!selectedAssignmentId) return;
    setIsSaving(true);
    await onSave(selectedAssignmentId, weeks);
    setIsSaving(false);
  };

  const handleSaveWeek = async (weekNumber: number) => {
    if (!selectedAssignmentId) return;
    const weekData = weeks.find(w => w.week_number === weekNumber);
    if (!weekData) return;
    
    setSavingWeek(weekNumber);
    
    // If onSaveWeek is provided, use it for individual week save
    if (onSaveWeek) {
      await onSaveWeek(selectedAssignmentId, weekData);
    } else {
      // Fallback: save just this one week using the bulk save method
      await onSave(selectedAssignmentId, [weekData]);
    }
    
    setSavingWeek(null);
  };

  const hasWeekChanged = (weekNumber: number) => {
    if (!selectedAssignmentId) return false;
    const curriculum = curricula.find(c => c.teaching_entity_id === selectedAssignmentId);
    const originalWeeks = curriculum ? curriculumWeeks.filter(w => w.curriculum_id === curriculum.id) : [];
    const currentWeek = weeks.find(w => w.week_number === weekNumber);
    const originalWeek = originalWeeks.find(w => w.week_number === weekNumber);
    return currentWeek?.expected_topics !== (originalWeek?.expected_topics || '');
  };
  
  const hasChanges = useMemo(() => {
      if (!selectedAssignmentId) return false;
      const curriculum = curricula.find(c => c.teaching_entity_id === selectedAssignmentId);
      const originalWeeks = curriculum ? curriculumWeeks.filter(w => w.curriculum_id === curriculum.id) : [];
      
      return weeks.some((week) => {
          const originalWeek = originalWeeks.find(w => w.week_number === week.week_number);
          return week.expected_topics !== (originalWeek?.expected_topics || '');
      });
  }, [weeks, selectedAssignmentId, curricula, curriculumWeeks]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Curriculum Manager</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Define the 14-week scheme of work for each teaching assignment.</p>
      </div>

      <div className="p-4 rounded-2xl border border-slate-200/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl">
        <label htmlFor="assignment-select" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Select Teaching Assignment:</label>
        <select
          id="assignment-select"
          value={selectedAssignmentId || ''}
          onChange={e => setSelectedAssignmentId(Number(e.target.value))}
          className="mt-1 w-full max-w-lg p-2 border rounded-md bg-transparent border-slate-300/60 dark:border-slate-700/60"
        >
          {myVisibleAssignments.map(a => (
            <option key={a.id} value={a.id}>
              {`${a.subject?.name} - ${a.class?.name} ${a.arm?.name ? `(${a.arm.name})` : ''} (${a.teacher?.name})`}
            </option>
          ))}
        </select>
      </div>

      {selectedAssignmentId ? (
        <div className="p-4 rounded-2xl border border-slate-200/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            {weeks.map((week, index) => (
              <div key={week.week_number} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor={`week-${week.week_number}`} className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Week {week.week_number}
                  </label>
                  <button
                    onClick={() => handleSaveWeek(week.week_number)}
                    disabled={savingWeek === week.week_number || !hasWeekChanged(week.week_number)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors ${
                      hasWeekChanged(week.week_number)
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {savingWeek === week.week_number ? (
                      <>
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : hasWeekChanged(week.week_number) ? (
                      '✓ Save Week'
                    ) : (
                      '✓ Saved'
                    )}
                  </button>
                </div>
                <textarea
                  id={`week-${week.week_number}`}
                  value={week.expected_topics}
                  onChange={e => handleWeekChange(index, e.target.value)}
                  rows={2}
                  placeholder="Enter expected topics for this week..."
                  className="mt-1 w-full p-2 border rounded-md bg-white/50 dark:bg-slate-800/50 border-slate-300/60 dark:border-slate-700/60 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
            >
              {isSaving ? <Spinner /> : 'Save Curriculum'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
            <p>Select a teaching assignment to begin.</p>
        </div>
      )}
    </div>
  );
};

export default CurriculumManager;
