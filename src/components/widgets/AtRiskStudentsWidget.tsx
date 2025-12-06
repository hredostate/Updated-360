
import React, { useState } from 'react';
import type { AtRiskStudent, Student } from '../../types';
import { SearchIcon } from '../common/icons';

interface AtRiskStudentsWidgetProps {
  atRiskStudents: AtRiskStudent[];
  onViewStudent: (student: Student) => void;
}

const AtRiskStudentsWidget: React.FC<AtRiskStudentsWidgetProps> = ({ atRiskStudents, onViewStudent }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = atRiskStudents.filter(item => 
    item.student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex-shrink-0">At-Risk Students</h3>
      
      <div className="mb-3 relative flex-shrink-0">
         <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
         <input 
            type="text" 
            placeholder="Search student name..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
         />
      </div>

      <div className="max-h-80 overflow-y-auto pr-2 flex-grow scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {filteredStudents.length > 0 ? (
          <ul className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {filteredStudents.map(({ student, score, reasons }) => (
              <li key={student.id} className="py-3">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{student.name} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">(Grade {student.grade})</span></p>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 flex-shrink-0 ml-2 border border-red-200 dark:border-red-800">Score: {score}</span>
                </div>
                {/* Removed truncate, added break-words to handle long text */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 break-words leading-relaxed">
                  {reasons.join(', ')}
                </p>
                 <button onClick={() => onViewStudent(student)} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mt-1 font-semibold transition-colors">View Profile &rarr;</button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="h-full flex items-center justify-center">
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                {searchQuery ? 'No student found.' : 'No students flagged as at-risk currently.'}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AtRiskStudentsWidget;
