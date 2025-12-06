

import React, { useState, useMemo, useRef } from 'react';
import type { Student, BaseDataObject, SchoolConfig, SchoolSettings } from '../types';
import { ShieldIcon, DownloadIcon, SearchIcon } from './common/icons';

interface IdCardGeneratorProps {
    students: Student[];
    allClasses: BaseDataObject[];
    allArms: BaseDataObject[];
    schoolConfig: SchoolConfig | null;
    schoolSettings?: SchoolSettings | null; // Added prop
}

// Individual Card Component for rendering
const IdCard: React.FC<{ student: Student, schoolConfig: SchoolConfig | null, schoolSettings?: SchoolSettings | null, schoolName: string }> = ({ student, schoolConfig, schoolSettings, schoolName }) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.id}`;

    // Dynamic styles based on school branding
    const primaryColor = schoolSettings?.branding?.primary_color || '#1E3A8A';

    return (
        <div className="w-[3.375in] h-[2.125in] border border-slate-300 rounded-lg overflow-hidden relative bg-white shadow-sm flex flex-col print:border-slate-400 print:shadow-none break-inside-avoid">
            {/* Header */}
            <div className="h-12 flex items-center justify-center gap-2 text-white" style={{ backgroundColor: primaryColor }}>
                 {schoolConfig?.logo_url ? (
                     <img src={schoolConfig.logo_url} alt="Logo" className="h-8 w-8 object-contain bg-white rounded-full p-0.5" />
                 ) : (
                     <ShieldIcon className="w-6 h-6" />
                 )}
                 <div className="text-center">
                     <h3 className="text-[10px] font-bold uppercase leading-tight tracking-wide">{schoolName}</h3>
                     <p className="text-sm font-light opacity-90 scale-75 origin-center">STUDENT IDENTITY CARD</p>
                 </div>
            </div>
            
            {/* Content */}
            <div className="flex-grow p-3 flex gap-3 items-center">
                <div className="w-20 h-24 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center overflow-hidden">
                    {/* Placeholder for student photo - in a real app, this would be student.photo_url */}
                    <div className="text-slate-300 text-4xl">👤</div>
                </div>
                <div className="flex-grow space-y-1">
                    <div>
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Name</p>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{student.name}</p>
                    </div>
                    <div className="flex justify-between">
                        <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">ID No.</p>
                            <p className="text-xs font-semibold text-slate-800">{student.admission_number || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Class</p>
                            <p className="text-xs font-semibold text-slate-800">{student.class?.name} {student.arm?.name}</p>
                        </div>
                    </div>
                     <div>
                        <p className="text-[8px] text-slate-500 uppercase font-bold">DOB</p>
                        <p className="text-xs font-semibold text-slate-800">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <img src={qrUrl} alt="QR" className="w-16 h-16 mix-blend-multiply" />
                </div>
            </div>

            {/* Footer */}
            <div className="h-5 bg-slate-100 border-t border-slate-200 flex items-center justify-center">
                 <p className="text-[8px] text-slate-600">If found, please return to the school office.</p>
            </div>
        </div>
    );
};

const IdCardGenerator: React.FC<IdCardGeneratorProps> = ({ students, allClasses, allArms, schoolConfig, schoolSettings }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedArmId, setSelectedArmId] = useState<string>('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const schoolName = schoolConfig?.display_name || schoolSettings?.name || 'University Preparatory Secondary School';

    const filteredStudents = useMemo(() => {
        let result = students;
        if (selectedClassId) {
            result = result.filter(s => s.class_id === Number(selectedClassId));
        }
        if (selectedArmId) {
            result = result.filter(s => s.arm_id === Number(selectedArmId));
        }
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(s => s.name.toLowerCase().includes(q) || (s.admission_number && s.admission_number.toLowerCase().includes(q)));
        }
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [students, selectedClassId, selectedArmId, searchTerm]);

    const toggleStudent = (id: number) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedStudentIds(newSet);
    };

    const toggleAll = () => {
        if (selectedStudentIds.size === filteredStudents.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const studentsToPrint = students.filter(s => selectedStudentIds.has(s.id));

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-6 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">ID Card Generator</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Generate professional student identity cards for printing.</p>
                </div>
                <button 
                    onClick={handlePrint} 
                    disabled={studentsToPrint.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed shadow-lg"
                >
                    <DownloadIcon className="w-5 h-5" /> Print {studentsToPrint.length} Cards
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-grow">
                {/* Controls Panel (Hidden on Print) */}
                <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col no-print">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-white">Select Students</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="p-2 border rounded-md text-sm dark:bg-slate-900 dark:border-slate-600">
                                <option value="">All Classes</option>
                                {allClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={selectedArmId} onChange={e => setSelectedArmId(e.target.value)} className="p-2 border rounded-md text-sm dark:bg-slate-900 dark:border-slate-600">
                                <option value="">All Arms</option>
                                {allArms.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search student..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 p-2 border rounded-md text-sm dark:bg-slate-900 dark:border-slate-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                                <input type="checkbox" checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length} onChange={toggleAll} className="rounded text-blue-600" />
                                Select All ({filteredStudents.length})
                            </label>
                            <span className="text-xs text-slate-500">{selectedStudentIds.size} selected</span>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-1">
                        {filteredStudents.map(student => (
                            <div 
                                key={student.id} 
                                onClick={() => toggleStudent(student.id)}
                                className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${selectedStudentIds.has(student.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                                <input type="checkbox" checked={selectedStudentIds.has(student.id)} readOnly className="rounded text-blue-600 pointer-events-none" />
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                                    <p className="text-xs text-slate-500">{student.admission_number} • {student.class?.name}</p>
                                </div>
                            </div>
                        ))}
                        {filteredStudents.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">No students found.</div>}
                    </div>
                </div>

                {/* Preview Area (Visible on Screen) */}
                <div className="w-full lg:w-2/3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 overflow-y-auto shadow-inner no-print">
                    {studentsToPrint.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <ShieldIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select students from the left to generate cards.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                            {studentsToPrint.map(student => (
                                <IdCard key={student.id} student={student} schoolConfig={schoolConfig} schoolSettings={schoolSettings} schoolName={schoolName} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Print Container (Only visible when printing) */}
            <div className="hidden print:grid print:grid-cols-2 print:gap-4 print:p-0 w-full">
                 {studentsToPrint.map(student => (
                    <IdCard key={student.id} student={student} schoolConfig={schoolConfig} schoolSettings={schoolSettings} schoolName={schoolName} />
                ))}
            </div>
        </div>
    );
};

export default IdCardGenerator;