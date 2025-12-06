
import React, { useState } from 'react';
import type { Announcement, UserProfile } from '../../types';
import { CalendarIcon, SearchIcon } from '../common/icons';
import { downloadIcsFile, generateIcsContent, parseDateStringAsLocal } from '../../utils/calendar';

interface AnnouncementsWidgetProps {
  announcements: Announcement[];
  userProfile: UserProfile;
  onAddAnnouncement: (title: string, content: string) => Promise<void>;
  userPermissions: string[];
}

const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({ announcements, userProfile, onAddAnnouncement, userPermissions }) => {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    const canPost = userPermissions.includes('manage-announcements');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(title.trim() && content.trim()) {
            onAddAnnouncement(title, content);
            setTitle('');
            setContent('');
            setShowForm(false);
        }
    }
    
    const handleAddToCalendar = (announcement: Announcement) => {
        const eventDate = parseDateStringAsLocal(announcement.created_at.split('T')[0]);
        const icsContent = generateIcsContent({
            title: announcement.title,
            description: announcement.content,
            startDate: eventDate,
            isAllDay: true,
        });
        downloadIcsFile(icsContent, `${announcement.title.replace(/[^a-z0-9]/gi, '_')}.ics`);
    };

    const filteredAnnouncements = announcements.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h3 className="font-bold text-slate-900 dark:text-white">Bulletin Board</h3>
        {canPost && <button onClick={() => setShowForm(!showForm)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold">{showForm ? 'Cancel' : 'New Post'}</button>}
      </div>
      
      {/* Search Bar */}
      {!showForm && (
          <div className="mb-3 relative">
             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
             <input 
                type="text" 
                placeholder="Search bulletins..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
             />
          </div>
      )}

       {showForm && (
            <form onSubmit={handleSubmit} className="mb-4 space-y-2 animate-fade-in flex-shrink-0">
                <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg text-sm" />
                <textarea placeholder="Content..." value={content} onChange={e => setContent(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg text-sm" rows={3}></textarea>
                <button type="submit" className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold">Post</button>
            </form>
       )}
      <div className="max-h-80 overflow-y-auto pr-2 space-y-3 flex-grow scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.slice(0, 5).map(announcement => (
            <div key={announcement.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    {/* Used break-words to allow text wrapping */}
                    <p className="font-semibold text-slate-800 dark:text-white text-sm break-words">{announcement.title}</p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 break-words whitespace-pre-wrap">{announcement.content}</p>
                  </div>
                   <button 
                      onClick={() => handleAddToCalendar(announcement)}
                      className="p-1.5 ml-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex-shrink-0 self-start"
                      aria-label="Add to Calendar"
                      title="Add to Calendar"
                  >
                      <CalendarIcon className="w-4 h-4" />
                  </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-right">
                - {announcement.author?.name || 'Unknown User'} on {new Date(announcement.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                {searchQuery ? 'No matches found.' : 'No announcements right now.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsWidget;
