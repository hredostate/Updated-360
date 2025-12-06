import React, { useState } from 'react';
import type { Student } from '../../types';

interface StudentRecordsWidgetProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
}

const StudentRecordsWidget: React.FC<StudentRecordsWidgetProps> = ({ students, onViewStudent }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);
    
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchPerformed(true);
        const found = students.find(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        setSelectedStudent(found || null);
    }

    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3">Student Records</h3>
            <form onSubmit={handleSearch} className="flex space-x-2">
                <input 
                    type="text" 
                    placeholder="Search student name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow p-2 text-sm border border-slate-300/60 dark:border-slate-700/60 rounded-md bg-white/50 dark:bg-slate-800/50"
                />
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">Search</button>
            </form>
            
            {searchPerformed && (
                <div className="mt-4 border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
                    {selectedStudent ? (
                         <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Grade: {selectedStudent.grade}</p>
                            </div>
                            <button onClick={() => onViewStudent(selectedStudent)} className="text-xs bg-slate-500/20 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-500/30">View</button>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">No student found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentRecordsWidget;