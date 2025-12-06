import React, { useState, useMemo, useEffect } from 'react';
import type { AcademicTeachingAssignment, Term, AcademicClass, UserProfile, BaseDataObject } from '../types';
import { SUBJECT_OPTIONS } from '../constants';
import Spinner from './common/Spinner';
import { PlusCircleIcon, SearchIcon, TrashIcon, EditIcon } from './common/icons';
import SearchableSelect from './common/SearchableSelect';

interface AcademicAssignmentManagerProps {
    assignments: AcademicTeachingAssignment[];
    terms: Term[];
    academicClasses: AcademicClass[];
    users: UserProfile[];
    onSave: (as: Partial<AcademicTeachingAssignment>) => Promise<boolean>;
    onDelete: (asId: number) => Promise<boolean>;
    classes: BaseDataObject[];
    arms: BaseDataObject[];
}

const AcademicAssignmentManager: React.FC<AcademicAssignmentManagerProps> = ({ assignments, terms, academicClasses, users, onSave, onDelete }) => {
    const [editingAssignment, setEditingAssignment] = useState<Partial<AcademicTeachingAssignment> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedTermId, setSelectedTermId] = useState<number | ''>('');
    const [searchQuery, setSearchQuery] = useState('');

    const teachers = useMemo(() => users.filter(u => u.role === 'Teacher' || u.role === 'Team Lead' || u.role === 'Admin' || u.role === 'Principal').sort((a,b) => a.name.localeCompare(b.name)), [users]);
    
    // Ensure we default to the active term or the most recent one
    useEffect(() => {
        if (selectedTermId === '' && terms.length > 0) {
            const activeTerm = terms.find(t => t.is_active);
            if (activeTerm) setSelectedTermId(activeTerm.id);
            else setSelectedTermId(terms[0].id); // Default to first if none active
        }
    }, [terms, selectedTermId]);

    const filteredAssignments = useMemo(() => {
        let data = assignments;
        if (selectedTermId) {
            data = data.filter(a => a.term_id === selectedTermId);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            data = data.filter(a => 
                a.subject_name.toLowerCase().includes(q) ||
                a.teacher?.name.toLowerCase().includes(q) ||
                a.academic_class?.name.toLowerCase().includes(q)
            );
        }
        return data.sort((a, b) => (a.academic_class?.name || '').localeCompare(b.academic_class?.name || ''));
    }, [selectedTermId, assignments, searchQuery]);

    const handleSave = async (as: Partial<AcademicTeachingAssignment>) => {
        setIsSaving(true);
        const success = await onSave(as);
        if (success) {
            setEditingAssignment(null);
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: number) => {
        if(window.confirm('Are you sure you want to delete this assignment? Scores associated with it might be orphaned.')) {
            await onDelete(id);
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white">Teaching Assignments</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400">Assign subjects to teachers for specific classes.</p>
                </div>
                {!editingAssignment && (
                    <button onClick={() => setEditingAssignment({ term_id: selectedTermId ? Number(selectedTermId) : undefined })} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                        <PlusCircleIcon className="w-5 h-5"/> New Assignment
                    </button>
                )}
            </div>
            
            {editingAssignment ? (
                <AssignmentForm
                    assignment={editingAssignment}
                    onSave={handleSave}
                    onCancel={() => setEditingAssignment(null)}
                    isSaving={isSaving}
                    terms={terms}
                    academicClasses={academicClasses}
                    teachers={teachers}
                />
            ) : (
                <div className="rounded-xl border border-slate-200/60 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm">
                    <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row gap-4">
                         <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Term</label>
                            <select 
                                value={selectedTermId} 
                                onChange={e => setSelectedTermId(e.target.value === '' ? '' : Number(e.target.value))} 
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Terms</option>
                                {terms.map(t => <option key={t.id} value={t.id}>{t.session_label} - {t.term_label}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                             <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
                             <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    placeholder="Search subject, teacher, or class..." 
                                    className="w-full pl-9 p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500"
                                />
                             </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3">Class</th>
                                    <th className="px-6 py-3">Subject</th>
                                    <th className="px-6 py-3">Teacher</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                                {filteredAssignments.length > 0 ? filteredAssignments.map(as => (
                                    <tr key={as.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{as.academic_class?.name}</td>
                                        <td className="px-6 py-3">{as.subject_name}</td>
                                        <td className="px-6 py-3 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                {as.teacher?.name.charAt(0)}
                                            </div>
                                            {as.teacher?.name}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => { setSelectedTermId(as.term_id); setEditingAssignment(as); }} className="text-slate-500 hover:text-blue-600 transition-colors" title="Edit">
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(as.id)} className="text-slate-500 hover:text-red-600 transition-colors" title="Delete">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No assignments found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 text-center">
                        Showing {filteredAssignments.length} records
                    </div>
                </div>
            )}
        </div>
    );
};

const AssignmentForm: React.FC<{
    assignment: Partial<AcademicTeachingAssignment>;
    onSave: (as: Partial<AcademicTeachingAssignment>) => void;
    onCancel: () => void;
    isSaving: boolean;
    terms: Term[];
    academicClasses: AcademicClass[];
    teachers: UserProfile[];
}> = ({ assignment, onSave, onCancel, isSaving, terms, academicClasses, teachers }) => {
    const [localAs, setLocalAs] = useState(assignment);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalAs(prev => ({ ...prev, [name]: value }));
    };
    
    const handleTeacherSelect = (value: string | number) => {
        setLocalAs(prev => ({ ...prev, teacher_user_id: String(value) }));
    }
    
    const handleSubjectSelect = (value: string | number) => {
        setLocalAs(prev => ({ ...prev, subject_name: String(value) })); // Searching by subject name for now as SUBJECT_OPTIONS are strings
    }

    const classesForSelectedTerm = useMemo(() => {
        if (!localAs.term_id) return [];
        const selectedTerm = terms.find(t => t.id === Number(localAs.term_id));
        if (!selectedTerm) return [];
        return academicClasses.filter(ac => ac.session_label === selectedTerm.session_label);
    }, [localAs.term_id, terms, academicClasses]);

    useEffect(() => {
        if (localAs.academic_class_id && !classesForSelectedTerm.some(c => c.id === localAs.academic_class_id)) {
            setLocalAs(prev => ({ ...prev, academic_class_id: undefined }));
        }
    }, [localAs.academic_class_id, classesForSelectedTerm]);
    
    const subjectOptions = useMemo(() => SUBJECT_OPTIONS.map(s => ({ value: s, label: s })), []);
    const teacherOptions = useMemo(() => teachers.map(t => ({ value: t.id, label: t.name })), [teachers]);

    return (
        <div className="p-6 border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800 rounded-xl space-y-4 animate-fade-in">
             <h4 className="font-bold text-slate-800 dark:text-white">{localAs.id ? 'Edit' : 'Create'} Assignment</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Term</label>
                     <select name="term_id" value={localAs.term_id || ''} onChange={handleChange} className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Select Term</option>
                        {terms.map(t => <option key={t.id} value={t.id}>{t.session_label} {t.term_label}</option>)}
                     </select>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Class</label>
                    <select name="academic_class_id" value={localAs.academic_class_id || ''} onChange={handleChange} className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100" disabled={!localAs.term_id}>
                        <option value="">Select Academic Class</option>
                        {classesForSelectedTerm.map(ac => <option key={ac.id} value={ac.id}>{ac.name}</option>)}
                    </select>
                    {!localAs.term_id && <p className="text-xs text-amber-600 mt-1">Select a term first.</p>}
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                    <SearchableSelect 
                        options={subjectOptions} 
                        value={localAs.subject_name || null} 
                        onChange={handleSubjectSelect} 
                        placeholder="Search Subject..."
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher</label>
                    <SearchableSelect 
                        options={teacherOptions} 
                        value={localAs.teacher_user_id || null} 
                        onChange={handleTeacherSelect} 
                        placeholder="Search Teacher..."
                    />
                 </div>
             </div>
             
             <div className="flex justify-end gap-3 pt-4 border-t border-blue-200 dark:border-blue-800">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700">
                    Cancel
                </button>
                <button onClick={() => onSave(localAs)} disabled={isSaving || !localAs.academic_class_id || !localAs.subject_name || !localAs.teacher_user_id} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2">
                    {isSaving ? <Spinner size="sm"/> : 'Save Assignment'}
                </button>
            </div>
         </div>
    );
};

export default AcademicAssignmentManager;