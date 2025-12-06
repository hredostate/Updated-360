// A utility to generate and download iCalendar (.ics) files.

/**
 * Formats a JavaScript Date object into the UTC string format required by the iCalendar spec.
 * Example: 20240725T120000Z
 * @param date The date to format.
 * @returns A string in 'YYYYMMDDTHHMMSSZ' format.
 */
const toIcsDateTime = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Formats a JavaScript Date object into the date format for all-day events in the iCalendar spec.
 * This function is timezone-safe and uses local date components.
 * Example: 20240725
 * @param date The date to format.
 * @returns A string in 'YYYYMMDD' format.
 */
const toIcsDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
};

/**
 * Parses a "YYYY-MM-DD" string into a Date object in the user's local timezone.
 * This avoids the "off-by-one-day" error that can occur when `new Date()`
 * incorrectly interprets the string as UTC midnight.
 * @param dateString The date string in "YYYY-MM-DD" format.
 * @returns A Date object representing midnight on that day in the local timezone.
 */
export const parseDateStringAsLocal = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    // Month is 0-indexed in JavaScript Date constructor
    return new Date(year, month - 1, day);
};

interface IcsEvent {
    title: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    isAllDay?: boolean;
}

// Simple line folding for description to adhere to iCal standards (75 char limit)
const foldLine = (line: string) => line.replace(/(.{75})/g, '$1\r\n ');

const generateVEventBlock = (event: IcsEvent): string => {
    const { title, description, startDate, isAllDay = false } = event;
    let endDate = event.endDate;

    if (isAllDay && !endDate) {
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
    }
    
    if (!isAllDay && !endDate) {
        endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);
    }

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@schoolguardian306.app`;
    const dtstamp = toIcsDateTime(new Date());

    const startString = isAllDay ? `DTSTART;VALUE=DATE:${toIcsDate(startDate)}` : `DTSTART:${toIcsDateTime(startDate)}`;
    const endString = isAllDay ? `DTEND;VALUE=DATE:${toIcsDate(endDate!)}` : `DTEND:${toIcsDateTime(endDate!)}`;

    const eventLines = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        startString,
        endString,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        'END:VEVENT'
    ];
    
    return eventLines.map(foldLine).join('\r\n');
}

/**
 * Generates the string content for a single-event .ics file.
 * @param event The event details.
 * @returns A string representing the content of an .ics file.
 */
export const generateIcsContent = (event: IcsEvent): string => {
    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SchoolGuardian360//EN',
        generateVEventBlock(event),
        'END:VCALENDAR'
    ];

    return icsLines.join('\r\n');
};

/**
 * Generates the string content for a multi-event .ics file.
 * @param events An array of event details.
 * @returns A string representing the content of an .ics file.
 */
export const generateMultipleIcsContent = (events: IcsEvent[]): string => {
    const eventBlocks = events.map(generateVEventBlock).join('\r\n');
    
    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SchoolGuardian360//EN',
        eventBlocks,
        'END:VCALENDAR'
    ];

    return icsLines.join('\r\n');
};

/**
 * Triggers a browser download for a given ICS content string.
 * @param icsContent The full string content of the .ics file.
 * @param filename The desired name for the downloaded file.
 */
export const downloadIcsFile = (icsContent: string, filename: string) => {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};