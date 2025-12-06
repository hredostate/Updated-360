import React, { useState, useEffect } from 'react';
import { aiClient } from '../services/aiClient';
import type { CalendarEvent, UserProfile } from '../types';
import { TaskPriority, TaskStatus } from '../types';
import Spinner from './common/Spinner';
import { WandIcon } from './common/icons';
import { extractAndParseJson } from '../utils/json';
import { textFromGemini } from '../utils/ai';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onUpdate: (eventId: number, data: Partial<CalendarEvent>) => Promise<void>;
  onDelete: (eventId: number) => Promise<void>;
  canManage: boolean;
  users: UserProfile[];
  handleAddTask: (taskData: any) => Promise<boolean>;
  userProfile: UserProfile;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  canManageSocialMedia: boolean;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event, onUpdate, onDelete, canManage, users, handleAddTask, userProfile, addToast, canManageSocialMedia }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setIsAllDay(event.is_all_day);
      
      const startDate = new Date(event.start_time);
      setDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toTimeString().substring(0, 5));
      
      const endDate = new Date(event.end_time);
      setEndTime(endDate.toTimeString().substring(0, 5));

      setIsEditing(false); // Reset edit mode when a new event is selected
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const startDateTime = new Date(`${date}T00:00:00`);
    const endDateTime = new Date(`${date}T00:00:00`);

    if (!isAllDay) {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        endDateTime.setHours(endHour, endMinute, 0, 0);
    } else {
        startDateTime.setHours(0,0,0,0);
        endDateTime.setHours(23,59,59,999);
    }
    
    await onUpdate(event.id, {
        title,
        description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_all_day: isAllDay,
    });
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
        await onDelete(event.id);
        onClose();
    }
  };
  
  const handleGenerateSocialTask = async () => {
    setIsGeneratingTask(true);
    try {
      const socialMediaManager = users.find(u => u.role === 'Social Media Manager');
      if (!socialMediaManager) {
        throw new Error('"Social Media Manager" role not found.');
      }
      if (!aiClient) {
        throw new Error("AI client is not configured.");
      }

      const prompt = `Based on this calendar event, create a task for our social media manager to provide coverage. The event is: "${event.title}" on ${new Date(event.start_time).toLocaleDateString()}. Description: "${event.description}". The task should be actionable and clear. Return a single JSON object with 'title' (string) and 'description' (string) for the task.`;
      
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING" },
                    description: { type: "STRING" },
                },
                required: ['title', 'description']
            }
        }
      });
      
      const taskDetails = extractAndParseJson<{ title: string; description: string }>(textFromGemini(response));
      if (!taskDetails) {
        throw new Error("AI failed to generate valid task details.");
      }
      
      const eventDate = new Date(event.start_time);
      const dueDate = new Date(eventDate.setDate(eventDate.getDate() - 1)).toISOString().split('T')[0];

      const success = await handleAddTask({
        title: taskDetails.title,
        description: taskDetails.description,
        due_date: dueDate,
        priority: TaskPriority.Medium,
        status: TaskStatus.ToDo,
        user_id: socialMediaManager.id,
        school_id: userProfile.school_id,
      });

      if (success) {
        addToast('Social media task created and assigned!', 'success');
        onClose();
      } else {
        throw new Error('Failed to save the task.');
      }

    } catch(e: any) {
      addToast(e.message || 'Failed to generate social media task.', 'error');
      console.error(e);
    } finally {
      setIsGeneratingTask(false);
    }
  };

  const inputClasses = "w-full p-2 bg-slate-500/10 border border-slate-300/60 dark:border-slate-700/60 rounded-md";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-lg m-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{isEditing ? 'Edit Event' : 'Event Details'}</h2>
        
        <div className="space-y-4">
          {isEditing ? (
            <>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} />
              <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputClasses} rows={3} />
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} />
              <label className="flex items-center gap-2"><input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} /> All-day</label>
              {!isAllDay && (
                <div className="flex gap-2">
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClasses} />
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClasses} />
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold">{title}</h3>
              <p>{description}</p>
              <p className="text-sm text-slate-500">{isAllDay ? 'All Day' : `${new Date(`${date}T${startTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(`${date}T${endTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}</p>
              
              {canManageSocialMedia && (
                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button 
                        onClick={handleGenerateSocialTask}
                        disabled={isGeneratingTask}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-500/30 disabled:opacity-50"
                    >
                        {isGeneratingTask ? <Spinner size="sm" /> : <WandIcon className="w-5 h-5" />}
                        <span>Generate Social Media Task</span>
                    </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
            <div>
              {canManage && isEditing && (
                <button onClick={handleDelete} className="px-4 py-2 bg-red-500/10 text-red-700 dark:text-red-300 font-semibold rounded-lg">Delete</button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                  <>
                      <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-4 py-2 bg-slate-500/20 rounded-lg">Cancel</button>
                      <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center min-w-[80px] justify-center">{isSaving ? <Spinner size="sm"/> : 'Save'}</button>
                  </>
              ) : (
                  <>
                      <button onClick={onClose} className="px-4 py-2 bg-slate-500/20 rounded-lg">Close</button>
                      {canManage && <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Edit</button>}
                  </>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;