import React from 'react';
import type { AcademicTeachingAssignment, UserProfile } from '../types';
import { VIEWS } from '../constants';

interface TeacherGradebookViewProps {
  academicAssignments: AcademicTeachingAssignment[];
  currentUser: UserProfile;
  onNavigate: (view: string) => void;
}

const TeacherGradebookView: React.FC<TeacherGradebookViewProps> = ({ academicAssignments, currentUser, onNavigate }) => {
  
  const myAssignments = academicAssignments.filter(a => a.teacher_user_id === currentUser.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Gradebook</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Select an assignment to enter or view scores.</p>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-500/10">
              <tr>
                <th scope="col" className="px-6 py-3">Term</th>
                <th scope="col" className="px-6 py-3">Class</th>
                <th scope="col" className="px-6 py-3">Subject</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {myAssignments.map(assignment => (
                <tr key={assignment.id} className="border-b border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-500/10">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {assignment.term?.session_label} {assignment.term?.term_label}
                  </td>
                  <td className="px-6 py-4">{assignment.academic_class?.name}</td>
                  <td className="px-6 py-4">{assignment.subject_name}</td>
                  <td className="px-6 py-4">
                    {assignment.is_locked ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-800 dark:text-red-300">Locked</span>
                    ) : assignment.submitted_at ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-800 dark:text-green-300">Submitted</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-800 dark:text-yellow-300">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onNavigate(`${VIEWS.TEACHER_SCORE_ENTRY}/${assignment.id}`)}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {assignment.is_locked ? 'View Scores' : 'Enter Scores'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myAssignments.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              You have no teaching assignments for score entry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherGradebookView;