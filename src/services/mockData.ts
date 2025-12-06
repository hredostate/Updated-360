import type { SocialMediaAnalytics, SocialAccount, CalendarEvent, TourSlide } from '../types';

export const MOCK_SOCIAL_ANALYTICS: SocialMediaAnalytics[] = [
    { platform: 'Instagram', followers: 1250, engagementRate: 5.2 },
    { platform: 'Facebook', followers: 2300, engagementRate: 3.1 },
    { platform: 'X', followers: 850, engagementRate: 2.5 },
];

export const MOCK_SOCIAL_ACCOUNTS: SocialAccount = {
    instagram: 'schoolofknowledge',
    facebook: 'schoolofknowledge',
    tiktok: null,
    x: 'schoolofknowledge',
};

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
    { id: 1, title: 'Staff Meeting', description: 'All-hands staff meeting in the auditorium.', start_time: '2024-08-20T08:00:00', end_time: '2024-08-20T09:00:00', is_all_day: false, created_by: 'admin-id', school_id: 1 },
    { id: 2, title: 'Parent-Teacher Conferences', description: '', start_time: '2024-08-25T00:00:00', end_time: '2024-08-26T00:00:00', is_all_day: true, created_by: 'admin-id', school_id: 1 },
];

export const MOCK_TOUR_CONTENT: TourSlide[] = [
  { icon: '👋', title: 'Welcome to Guardian 360!', description: 'This quick tour will introduce you to the key features of your new dashboard.' },
  { icon: '📝', title: 'Submit & Analyze Reports', description: 'Use the "Submit Report" button to log incidents, observations, or kudos. Our AI will automatically analyze them for urgency and sentiment.' },
  { icon: '🤖', title: 'Guardian Command', description: 'Use the AI assistant to create tasks, post announcements, or ask questions about school data using natural language.' },
  { icon: '📊', title: 'Customize Your Dashboard', description: 'Click the "Customize" button on your dashboard to add or remove widgets, tailoring the view to your specific role.' },
  { icon: '🎉', title: 'You\'re All Set!', description: 'You\'re ready to get started. Explore the sidebar to discover all the tools at your disposal.' },
];