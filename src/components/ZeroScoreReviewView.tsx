import React, { useState, useEffect, useMemo } from 'react';
import type { ZeroScoreEntry, Student, UserProfile, AcademicClass, Term } from '../types';
import { supa as supabase } from '../offline/client';
import Spinner from './common/Spinner';
import { CheckCircleIcon, XCircleIcon, SettingsIcon, TrashIcon, UserMinusIcon, AlertTriangleIcon } from './common/icons';

interface ZeroScoreReviewViewProps {
    userProfile: UserProfile;
    onBack: () => void;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onReviewZeroScore?: (entryId: number, notes?: string) => Promise<boolean>;
    onUnenrollStudent?: (studentId: number, classId: number, subjectName: string, termId: number) => Promise<boolean>;
    onDeleteZeroScoreEntry?: (entryId: number) => Promise<boolean>;
    onBulkReviewZeroScores?: (entryIds: number[]) => Promise<boolean>;
}

const ZeroScoreReviewView: React.FC<ZeroScoreReviewViewProps> = ({ 
    userProfile, 
    onBack, 
    addToast,
    onReviewZeroScore,
    onUnenrollStudent,
    onDeleteZeroScoreEntry,
    onBulkReviewZeroScores
}) => {
    const [zeroScores, setZeroScores] = useState<ZeroScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterReviewed, setFilterReviewed] = useState<'all' | 'reviewed' | 'unreviewed'>('unreviewed');
    const [filterTeacher, setFilterTeacher] = useState<string>('all');
    const [filterSubject, setFilterSubject] = useState<string>('all');
    const [filterTerm, setFilterTerm] = useState<string>('all');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');
    const [selectedEntry, setSelectedEntry] = useState<ZeroScoreEntry | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionType, setActionType] = useState<'review' | 'unenroll' | 'delete' | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchZeroScores();
    }, [userProfile.school_id]);

    const fetchZeroScores = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('zero_score_entries')
                .select(`
                    *,
                    student:students(*),
                    teacher:user_profiles!teacher_user_id(*),
                    academic_class:academic_classes(*),
                    term:terms(*)
                `)
                .eq('school_id', userProfile.school_id)
                .order('entry_date', { ascending: false })
                .limit(5000);

            if (error) throw error;
            setZeroScores(data || []);
        } catch (error: any) {
            addToast(`Error loading zero score entries: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkReviewed = async (entry: ZeroScoreEntry) => {
        setIsProcessing(true);
        try {
            if (onReviewZeroScore) {
                const success = await onReviewZeroScore(entry.id, reviewNotes);
                if (success) {
                    addToast('Entry marked as reviewed', 'success');
                    setSelectedEntry(null);
                    setReviewNotes('');
                    await fetchZeroScores();
                }
            } else {
                // Fallback to direct update
                const { error } = await supabase
                    .from('zero_score_entries')
                    .update({
                        reviewed: true,
                        reviewed_by: userProfile.id,
                        reviewed_at: new Date().toISOString(),
                        review_notes: reviewNotes || null
                    })
                    .eq('id', entry.id);

                if (error) throw error;

                addToast('Entry marked as reviewed', 'success');
                setSelectedEntry(null);
                setReviewNotes('');
                await fetchZeroScores();
            }
        } catch (error: any) {
            addToast(`Error marking entry as reviewed: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnenrollStudent = async (entry: ZeroScoreEntry) => {
        if (!entry.student_id || !entry.academic_class_id || !entry.term_id) {
            addToast('Missing required information for unenrollment', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            if (onUnenrollStudent) {
                const success = await onUnenrollStudent(
                    entry.student_id,
                    entry.academic_class_id,
                    entry.subject_name,
                    entry.term_id
                );
                if (success) {
                    addToast(`Student unenrolled from ${entry.subject_name}`, 'success');
                    setShowConfirmModal(false);
                    setSelectedEntry(null);
                    await fetchZeroScores();
                }
            } else {
                addToast('Unenroll functionality not implemented', 'error');
            }
        } catch (error: any) {
            addToast(`Error unenrolling student: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteEntry = async (entry: ZeroScoreEntry) => {
        setIsProcessing(true);
        try {
            if (onDeleteZeroScoreEntry) {
                const success = await onDeleteZeroScoreEntry(entry.id);
                if (success) {
                    addToast('Zero score entry deleted', 'success');
                    setShowConfirmModal(false);
                    setSelectedEntry(null);
                    await fetchZeroScores();
                }
            } else {
                // Fallback to direct delete
                const { error } = await supabase
                    .from('zero_score_entries')
                    .delete()
                    .eq('id', entry.id);

                if (error) throw error;

                addToast('Zero score entry deleted', 'success');
                setShowConfirmModal(false);
                setSelectedEntry(null);
                await fetchZeroScores();
            }
        } catch (error: any) {
            addToast(`Error deleting entry: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkReview = async () => {
        if (selectedEntries.size === 0) {
            addToast('No entries selected', 'info');
            return;
        }

        setIsProcessing(true);
        try {
            if (onBulkReviewZeroScores) {
                const success = await onBulkReviewZeroScores(Array.from(selectedEntries));
                if (success) {
                    addToast(`${selectedEntries.size} entries marked as reviewed`, 'success');
                    setSelectedEntries(new Set());
                    await fetchZeroScores();
                }
            } else {
                // Fallback to bulk update
                const { error } = await supabase
                    .from('zero_score_entries')
                    .update({
                        reviewed: true,
                        reviewed_by: userProfile.id,
                        reviewed_at: new Date().toISOString()
                    })
                    .in('id', Array.from(selectedEntries));

                if (error) throw error;

                addToast(`${selectedEntries.size} entries marked as reviewed`, 'success');
                setSelectedEntries(new Set());
                await fetchZeroScores();
            }
        } catch (error: any) {
            addToast(`Error bulk reviewing entries: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAction = (entry: ZeroScoreEntry, action: 'review' | 'unenroll' | 'delete') => {
        setSelectedEntry(entry);
        setActionType(action);
        if (action === 'review') {
            setReviewNotes(entry.review_notes || '');
        } else {
            setShowConfirmModal(true);
        }
    };

    const confirmAction = () => {
        if (!selectedEntry) return;
        
        if (actionType === 'unenroll') {
            handleUnenrollStudent(selectedEntry);
        } else if (actionType === 'delete') {
            handleDeleteEntry(selectedEntry);
        }
    };

    const toggleSelectEntry = (id: number) => {
        const newSet = new Set(selectedEntries);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedEntries(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedEntries.size === filteredEntries.length) {
            setSelectedEntries(new Set());
        } else {
            setSelectedEntries(new Set(filteredEntries.map(e => e.id)));
        }
    };

    const filteredEntries = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return [];
        
        let filtered = [...zeroScores];

        // Filter by review status
        if (filterReviewed === 'reviewed') {
            filtered = filtered.filter(e => e.reviewed);
        } else if (filterReviewed === 'unreviewed') {
            filtered = filtered.filter(e => !e.reviewed);
        }

        // Filter by teacher
        if (filterTeacher !== 'all') {
            filtered = filtered.filter(e => e.teacher_user_id === filterTeacher);
        }

        // Filter by subject
        if (filterSubject !== 'all') {
            filtered = filtered.filter(e => e.subject_name === filterSubject);
        }

        // Filter by term
        if (filterTerm !== 'all') {
            const termId = Number(filterTerm);
            if (!isNaN(termId)) {
                filtered = filtered.filter(e => e.term_id === termId);
            }
        }

        // Filter by class
        if (filterClass !== 'all') {
            const classId = Number(filterClass);
            if (!isNaN(classId)) {
                filtered = filtered.filter(e => e.academic_class_id === classId);
            }
        }

        // Filter by date range
        if (filterDateFrom) {
            filtered = filtered.filter(e => new Date(e.entry_date) >= new Date(filterDateFrom));
        }
        if (filterDateTo) {
            filtered = filtered.filter(e => new Date(e.entry_date) <= new Date(filterDateTo));
        }

        return filtered;
    }, [zeroScores, filterReviewed, filterTeacher, filterSubject, filterTerm, filterClass, filterDateFrom, filterDateTo]);

    const uniqueTeachers = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return [];
        const seenIds = new Set<string>();
        return zeroScores
            .map(z => z.teacher)
            .filter(t => t && !seenIds.has(t.id) && seenIds.add(t.id)) as UserProfile[];
    }, [zeroScores]);

    const uniqueSubjects = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return [];
        return [...new Set(zeroScores.map(z => z.subject_name))].filter(Boolean).sort();
    }, [zeroScores]);

    const uniqueTerms = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return [];
        const seenIds = new Set<number>();
        return zeroScores
            .map(z => z.term)
            .filter(t => t && !seenIds.has(t.id) && seenIds.add(t.id)) as Term[];
    }, [zeroScores]);

    const uniqueClasses = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return [];
        const seenIds = new Set<number>();
        return zeroScores
            .map(z => z.academic_class)
            .filter(c => c && !seenIds.has(c.id) && seenIds.add(c.id)) as AcademicClass[];
    }, [zeroScores]);

    const stats = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return { total: 0, reviewed: 0, unreviewed: 0, bySubject: {} };
        
        const total = zeroScores.length;
        const reviewed = zeroScores.filter(z => z.reviewed).length;
        const unreviewed = total - reviewed;
        
        const bySubject: Record<string, number> = {};
        zeroScores.forEach(z => {
            if (!z.reviewed && z.subject_name) {
                bySubject[z.subject_name] = (bySubject[z.subject_name] || 0) + 1;
            }
        });
        
        return { total, reviewed, unreviewed, bySubject };
    }, [zeroScores]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
                >
                    ← Back
                </button>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Zero Score Review</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                    Review and take action on zero score entries from teachers
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow p-4">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Zero Scores</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow p-4">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Unreviewed</h3>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{stats.unreviewed}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow p-4">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Reviewed</h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.reviewed}</p>
                </div>
            </div>

            {/* By Subject Stats */}
            {Object.keys(stats.bySubject).length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow p-4 mb-6">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Unreviewed by Subject</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(stats.bySubject)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 8)
                            .map(([subject, count]) => (
                                <div key={subject} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-700 dark:text-slate-300 truncate mr-2">{subject}</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <SettingsIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Review Status
                        </label>
                        <select
                            value={filterReviewed}
                            onChange={(e) => setFilterReviewed(e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">All</option>
                            <option value="unreviewed">Unreviewed</option>
                            <option value="reviewed">Reviewed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Teacher
                        </label>
                        <select
                            value={filterTeacher}
                            onChange={(e) => setFilterTeacher(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">All Teachers</option>
                            {uniqueTeachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Subject
                        </label>
                        <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">All Subjects</option>
                            {uniqueSubjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Term
                        </label>
                        <select
                            value={filterTerm}
                            onChange={(e) => setFilterTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">All Terms</option>
                            {uniqueTerms.map(term => (
                                <option key={term.id} value={term.id}>{term.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Class
                        </label>
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">All Classes</option>
                            {uniqueClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Date From
                        </label>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Date To
                        </label>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedEntries.size > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                            {selectedEntries.size} {selectedEntries.size === 1 ? 'entry' : 'entries'} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkReview}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Mark All as Reviewed
                            </button>
                            <button
                                onClick={() => setSelectedEntries(new Set())}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Entries Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300 dark:border-slate-600"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Class
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Teacher
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No zero score entries found
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedEntries.has(entry.id)}
                                                onChange={() => toggleSelectEntry(entry.id)}
                                                className="rounded border-slate-300 dark:border-slate-600"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                                            {new Date(entry.entry_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                                            {entry.student?.name || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                                            {entry.subject_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                                            {entry.academic_class?.name || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                                            {entry.teacher?.name || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {entry.reviewed ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                    <CheckCircleIcon className="w-3 h-3" />
                                                    Reviewed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                                                    <XCircleIcon className="w-3 h-3" />
                                                    Unreviewed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(entry, 'review')}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                    title={entry.reviewed ? 'View review' : 'Review entry'}
                                                >
                                                    {entry.reviewed ? 'View' : 'Review'}
                                                </button>
                                                {!entry.reviewed && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(entry, 'unenroll')}
                                                            className="text-orange-600 dark:text-orange-400 hover:underline"
                                                            title="Unenroll student from this subject"
                                                        >
                                                            Unenroll
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(entry, 'delete')}
                                                            className="text-red-600 dark:text-red-400 hover:underline"
                                                            title="Delete this entry"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedEntry && actionType === 'review' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                Zero Score Entry Details
                            </h2>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Student</label>
                                    <p className="text-slate-900 dark:text-white">{selectedEntry.student?.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                                        <p className="text-slate-900 dark:text-white">{selectedEntry.subject_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Component</label>
                                        <p className="text-slate-900 dark:text-white">{selectedEntry.component_name || 'Total Score'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Class</label>
                                        <p className="text-slate-900 dark:text-white">{selectedEntry.academic_class?.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Term</label>
                                        <p className="text-slate-900 dark:text-white">{selectedEntry.term?.name}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Teacher</label>
                                        <p className="text-slate-900 dark:text-white">{selectedEntry.teacher?.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Entry Date</label>
                                        <p className="text-slate-900 dark:text-white">
                                            {new Date(selectedEntry.entry_date).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                {selectedEntry.teacher_comment && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Teacher Comment</label>
                                        <p className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 p-3 rounded">
                                            {selectedEntry.teacher_comment}
                                        </p>
                                    </div>
                                )}
                                
                                {!selectedEntry.reviewed && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Review Notes
                                        </label>
                                        <textarea
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                            placeholder="Enter your review notes (optional)..."
                                        />
                                    </div>
                                )}
                                
                                {selectedEntry.reviewed && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Review Notes</label>
                                        <p className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 p-3 rounded">
                                            {selectedEntry.review_notes || 'No notes provided'}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                            Reviewed on {selectedEntry.reviewed_at ? new Date(selectedEntry.reviewed_at).toLocaleString() : 'Unknown'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedEntry(null);
                                        setReviewNotes('');
                                        setActionType(null);
                                    }}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                                    disabled={isProcessing}
                                >
                                    Close
                                </button>
                                {!selectedEntry.reviewed && (
                                    <button
                                        onClick={() => handleMarkReviewed(selectedEntry)}
                                        disabled={isProcessing}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? 'Marking...' : 'Mark as Reviewed'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && selectedEntry && actionType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangleIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Confirm {actionType === 'delete' ? 'Deletion' : 'Unenrollment'}
                                </h2>
                            </div>
                            
                            <div className="mb-6">
                                {actionType === 'delete' ? (
                                    <p className="text-slate-700 dark:text-slate-300">
                                        Are you sure you want to delete this zero score entry? This action cannot be undone.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-slate-700 dark:text-slate-300">
                                            Are you sure you want to unenroll <strong>{selectedEntry.student?.name}</strong> from <strong>{selectedEntry.subject_name}</strong>?
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            This will remove their enrollment for this subject in the current term.
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setSelectedEntry(null);
                                        setActionType(null);
                                    }}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAction}
                                    disabled={isProcessing}
                                    className={`px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                                        actionType === 'delete' 
                                            ? 'bg-red-600 hover:bg-red-700' 
                                            : 'bg-orange-600 hover:bg-orange-700'
                                    }`}
                                >
                                    {isProcessing ? 'Processing...' : `Yes, ${actionType === 'delete' ? 'Delete' : 'Unenroll'}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZeroScoreReviewView;
