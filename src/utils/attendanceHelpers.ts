/**
 * Attendance utility functions for report cards
 */

export interface AttendanceStatus {
    color: string;
    label: string;
    emoji: string;
    bgColor: string;
}

/**
 * Get attendance status information based on attendance rate percentage
 * @param rate - Attendance rate as a percentage (0-100)
 * @returns AttendanceStatus object with color, label, emoji, and bgColor
 */
export const getAttendanceStatus = (rate: number): AttendanceStatus => {
    if (rate >= 95) {
        return { 
            color: 'text-green-700', 
            label: 'Excellent', 
            emoji: '✅', 
            bgColor: 'bg-green-100 border-green-300' 
        };
    }
    if (rate >= 90) {
        return { 
            color: 'text-green-600', 
            label: 'Good', 
            emoji: '👍', 
            bgColor: 'bg-green-50 border-green-200' 
        };
    }
    if (rate >= 80) {
        return { 
            color: 'text-yellow-600', 
            label: 'Needs Improvement', 
            emoji: '⚠️', 
            bgColor: 'bg-yellow-50 border-yellow-200' 
        };
    }
    return { 
        color: 'text-red-600', 
        label: 'Poor/At Risk', 
        emoji: '🔴', 
        bgColor: 'bg-red-50 border-red-200' 
    };
};

export interface AttendanceData {
    present: number;
    absent: number;
    late: number;
    excused: number;
    unexcused: number;
    total: number;
    rate: number;
}
