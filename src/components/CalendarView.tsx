import React, { useState } from 'react';
import type { CalendarEvent, UserProfile } from '../types';
import Spinner from './common/Spinner';
import { DownloadIcon } from './common/icons';
import { generateMultipleIcsContent, downloadIcsFile } from '../utils/calendar';
import EventDetailModal from './EventDetailModal';

interface CalendarViewProps {
  events: CalendarEvent[];
  onSaveEvent: (event: Omit<CalendarEvent, 'id'|'school_id'|'created_by'|'created_at'>) => Promise<void>;
  onUpdateEvent: (eventId: number, data: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent: (eventId: number) => Promise<void>;
  userProfile: UserProfile;
  userPermissions: string[];
  users: UserProfile[];
  handleAddTask: (taskData: any) => Promise<boolean>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface IcsEvent {
    title: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    isAllDay?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onSaveEvent, onUpdateEvent, onDeleteEvent, userProfile, userPermissions, users, handleAddTask, addToast }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  
  // Event form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const canManageGlobal = userPermissions.includes('manage-calendar') || userPermissions.includes('*');
  const canManageSocialMedia = userPermissions.includes('manage-social-media') || userPermissions.includes('*');

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay(); // 0 = Sunday, 1 = Monday...
  const daysInMonth = endOfMonth.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleDateClick = (day: number) => {
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
    setIsAddingEvent(false); // Reset form when changing date
  }

  const handleAddEventSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title || !selectedDate) return;

      setIsSaving(true);
      const startDateTime = new Date(selectedDate);
      const endDateTime = new Date(selectedDate);

      if (!isAllDay) {
          const [startHour, startMinute] = startTime.split(':').map(Number);
          startDateTime.setHours(startHour, startMinute, 0, 0);
          const [endHour, endMinute] = endTime.split(':').map(Number);
          endDateTime.setHours(endHour, endMinute, 0, 0);
      } else {
        startDateTime.setHours(0,0,0,0);
        endDateTime.setHours(23,59,59,999);
      }

      await onSaveEvent({
          title,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          is_all_day: isAllDay,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setIsSaving(false);
      setIsAddingEvent(false);
  }
  
  const handleDownloadCalendar = () => {
      const icsEvents: IcsEvent[] = events.map(e => ({
        title: e.title,
        description: e.description || '',
        startDate: new Date(e.start_time),
        endDate: new Date(e.end_time),
        isAllDay: e.is_all_day,
      }));
      const content = generateMultipleIcsContent(icsEvents);
      downloadIcsFile(content, 'school-calendar.ics');
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-start-${i}`} className="border border-slate-200/60 dark:border-slate-800/60"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const eventsForDay = events.filter(e => new Date(e.start_time).toDateString() === date.toDateString());
    
    calendarDays.push(
      <div 
        key={day} 
        onClick={() => handleDateClick(day)} 
        className={`border border-slate-200/60 dark:border-slate-800/60 p-2 min-h-[120px] cursor-pointer hover:bg-slate-500/10 transition-colors ${isSelected ? 'bg-blue-500/10' : ''}`}
      >
        <div className={`font-semibold ${isToday ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center' : 'text-slate-800 dark:text-white'}`}>{day}</div>
        <div className="mt-1 space-y-1">
          {eventsForDay.slice(0, 2).map(e => (
            <div key={e.id} className="bg-blue-500/20 text-blue-800 dark:text-blue-300 text-xs p-1 rounded truncate">{e.title}</div>
          ))}
          {eventsForDay.length > 2 && <div className="text-xs text-slate-500">+{eventsForDay.length - 2} more</div>}
        </div>
      </div>
    );
  }

  const selectedDayEvents = selectedDate ? events.filter(e => new Date(e.start_time).toDateString() === selectedDate.toDateString()) : [];
  
  const canManageEvent = viewingEvent && (viewingEvent.created_by === userProfile.id || canManageGlobal);

  return (
    <>
        <div className="flex h-full animate-fade-in gap-6">
        <div className="w-2/3 flex-shrink-0 rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="px-3 py-1 bg-slate-500/20 rounded-lg hover:bg-slate-500/30">&lt;</button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={handleNextMonth} className="px-3 py-1 bg-slate-500/20 rounded-lg hover:bg-slate-500/30">&gt;</button>
            </div>
            <div className="grid grid-cols-7 text-center font-semibold text-sm text-slate-600 dark:text-slate-300">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 mt-2">{calendarDays}</div>
        </div>

        <div className="flex-1 rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 flex flex-col">
            {selectedDate ? (
            <>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Events for {selectedDate.toLocaleDateString()}</h3>
                    <button onClick={handleDownloadCalendar} className="p-2 text-sm text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-500/10 flex items-center gap-1">
                        <DownloadIcon className="w-4 h-4" />
                        Download
                    </button>
                </div>
                
                {isAddingEvent ? (
                    <form onSubmit={handleAddEventSubmit} className="mt-4 space-y-3 animate-fade-in">
                        <input type="text" placeholder="Event Title" value={title} onChange={e=>setTitle(e.target.value)} required className="w-full p-2 bg-transparent border rounded-md" />
                        <textarea placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-2 bg-transparent border rounded-md" rows={3}></textarea>
                        <label className="flex items-center space-x-2"><input type="checkbox" checked={isAllDay} onChange={e=>setIsAllDay(e.target.checked)} /><span>All-day event</span></label>
                        {!isAllDay && <div className="flex gap-2">
                            <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full p-2 bg-transparent border rounded-md" />
                            <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full p-2 bg-transparent border rounded-md" />
                        </div>}
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsAddingEvent(false)} className="flex-1 px-3 py-2 bg-slate-500/20 rounded-lg">Cancel</button>
                            <button type="submit" disabled={isSaving} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-400 flex justify-center items-center">{isSaving ? <Spinner size="sm"/> : 'Save Event'}</button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="mt-4 space-y-2 flex-grow overflow-y-auto pr-2">
                            {selectedDayEvents.length > 0 ? (
                                selectedDayEvents.map(e => 
                                    <div key={e.id} onClick={() => setViewingEvent(e)} className="p-3 bg-blue-500/10 rounded-md cursor-pointer hover:bg-blue-500/20">
                                        <p className="font-semibold text-blue-800 dark:text-blue-200">{e.title}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{e.description}</p>
                                        <p className="text-xs text-slate-500 mt-1">{e.is_all_day ? 'All Day' : `${new Date(e.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(e.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}</p>
                                    </div>
                                )
                            ) : (<p className="text-sm text-slate-500 text-center pt-10">No events for this day.</p>)}
                        </div>
                        {canManageGlobal && <button onClick={() => setIsAddingEvent(true)} className="mt-4 w-full px-3 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Add New Event</button>}
                    </>
                )}
            </>
            ) : (
            <div className="flex h-full justify-center items-center text-slate-500">Select a date to see events.</div>
            )}
        </div>
        </div>

        <EventDetailModal
            isOpen={!!viewingEvent}
            onClose={() => setViewingEvent(null)}
            event={viewingEvent}
            onUpdate={onUpdateEvent}
            onDelete={onDeleteEvent}
            canManage={!!canManageEvent}
            users={users}
            handleAddTask={handleAddTask}
            userProfile={userProfile}
            addToast={addToast}
            canManageSocialMedia={canManageSocialMedia}
        />
    </>
  );
};

export default CalendarView;