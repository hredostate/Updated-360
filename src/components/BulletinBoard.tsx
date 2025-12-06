import React, { useState } from 'react';
import type { Announcement, UserProfile } from '../types';
import { ADMINISTRATIVE_ROLES } from '../constants';
import Spinner from './common/Spinner';

// --- Edit Modal (Component-scoped) ---
interface AnnouncementEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, data: { title: string, content: string }) => Promise<void>;
    announcement: Announcement;
}

const AnnouncementEditModal: React.FC<AnnouncementEditModalProps> = ({ isOpen, onClose, onSave, announcement }) => {
    const [title, setTitle] = useState(announcement.title);
    const [content, setContent] = useState(announcement.content);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSaving(true);
        await onSave(announcement.id, { title, content });
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:bg-slate-900/80 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Edit Announcement</h2>
                <div className="space-y-4">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md" />
                    <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full p-2 border rounded-md" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 rounded-md">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md min-w-[80px] flex justify-center">{isSaving ? <Spinner size="sm"/> : 'Save'}</button>
                </div>
            </div>
        </div>
    );
};


interface BulletinBoardProps {
  announcements: Announcement[];
  userProfile: UserProfile;
  onAddAnnouncement: (title: string, content: string) => Promise<void>;
  onUpdateAnnouncement: (id: number, data: { title: string, content: string }) => Promise<void>;
  onDeleteAnnouncement: (id: number) => Promise<void>;
  userPermissions: string[];
}

const BulletinBoard: React.FC<BulletinBoardProps> = ({ announcements, userProfile, onAddAnnouncement, onUpdateAnnouncement, onDeleteAnnouncement, userPermissions }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const canPost = userPermissions.includes('manage-announcements');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    await onAddAnnouncement(title, content);
    setIsSubmitting(false);
    
    // Reset form
    setTitle('');
    setContent('');
    setIsFormVisible(false);
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
        onDeleteAnnouncement(id);
    }
  };

  return (
    <>
        <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bulletin Board</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-1">All school-wide announcements.</p>
            </div>
            {canPost && (
            <button onClick={() => setIsFormVisible(!isFormVisible)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                {isFormVisible ? 'Cancel' : 'New Announcement'}
            </button>
            )}
        </div>

        {isFormVisible && (
            <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                type="text" 
                placeholder="Title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required
                className="w-full p-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300/60 dark:border-slate-700/60 rounded-md"
                />
                <textarea 
                placeholder="What's the announcement?" 
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                required
                className="w-full p-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300/60 dark:border-slate-700/60 rounded-md"
                />
                <div className="text-right">
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center min-w-[100px] justify-center">
                    {isSubmitting ? <Spinner size="sm" /> : 'Post'}
                </button>
                </div>
            </form>
            </div>
        )}

        <div className="space-y-4">
            {announcements.map(announcement => {
                const canModify = announcement.author_id === userProfile.id || userPermissions.includes('manage-announcements');
                return (
                    <div key={announcement.id} className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
                        <div className="flex justify-between items-start">
                            <h2 className="font-bold text-lg text-slate-800 dark:text-white">{announcement.title}</h2>
                            {canModify && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingAnnouncement(announcement)} className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(announcement.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200 mt-2 whitespace-pre-wrap">{announcement.content}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-right">
                        Posted by {announcement.author?.name || 'Admin'} on {new Date(announcement.created_at).toLocaleString()}
                        </p>
                    </div>
                );
            })}
        </div>
        </div>

        {editingAnnouncement && (
            <AnnouncementEditModal 
                isOpen={!!editingAnnouncement}
                onClose={() => setEditingAnnouncement(null)}
                onSave={onUpdateAnnouncement}
                announcement={editingAnnouncement}
            />
        )}
    </>
  );
};

export default BulletinBoard;