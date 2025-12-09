/**
 * Standardized Error Handling Utilities
 * Provides consistent error handling patterns with toast notifications
 * Includes Supabase-specific error handling to provide user-friendly messages
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';
type AddToastFunction = (message: string, type?: ToastType) => void;

/**
 * Supabase error object structure
 */
interface SupabaseError {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
}

/**
 * Maps Supabase error codes and messages to user-friendly messages
 * @param error - The error object from Supabase
 * @returns User-friendly error message
 */
export const mapSupabaseError = (error: unknown): string => {
    // Check if it's a Supabase error object
    if (error && typeof error === 'object' && 'message' in error) {
        const supabaseError = error as SupabaseError;
        const message = supabaseError.message.toLowerCase();
        const code = supabaseError.code?.toLowerCase();

        // Network and connection errors
        if (
            message.includes('fetch failed') ||
            message.includes('network error') ||
            message.includes('network request failed') ||
            message.includes('failed to fetch') ||
            message.includes('networkerror') ||
            message.includes('connection') ||
            message.includes('timeout') ||
            message.includes('econnrefused') ||
            message.includes('enotfound') ||
            code === 'ECONNREFUSED' ||
            code === 'ETIMEDOUT'
        ) {
            return 'Network connection lost. Please check your internet connection and try again.';
        }

        // Supabase configuration errors - hide technical details
        if (
            message.includes('invalid api key') ||
            message.includes('invalid jwt') ||
            message.includes('jwt expired') ||
            message.includes('supabase url') ||
            message.includes('supabase_url') ||
            message.includes('anon key') ||
            message.includes('project ref') ||
            code === 'PGRST301'
        ) {
            return 'Service configuration issue. Please contact your system administrator.';
        }

        // Authentication errors
        if (
            message.includes('invalid login credentials') ||
            message.includes('email not confirmed') ||
            message.includes('user not found') ||
            code === '401'
        ) {
            return 'Authentication failed. Please check your credentials and try again.';
        }

        // Permission/Authorization errors
        if (
            message.includes('permission denied') ||
            message.includes('insufficient privileges') ||
            message.includes('policy') ||
            message.includes('row-level security') ||
            message.includes('rls') ||
            code === '403' ||
            code === 'PGRST301' // PostgreSQL REST API error for permissions/auth
        ) {
            return 'You do not have permission to perform this action.';
        }

        // Database constraint errors
        if (
            message.includes('duplicate key') ||
            message.includes('unique constraint') ||
            message.includes('violates unique constraint') ||
            code === '23505'
        ) {
            return 'This record already exists. Please use a different value.';
        }

        if (
            message.includes('foreign key') ||
            message.includes('violates foreign key constraint') ||
            code === '23503'
        ) {
            return 'This operation cannot be completed because it would break data relationships.';
        }

        if (
            message.includes('not null constraint') ||
            message.includes('violates not-null constraint') ||
            code === '23502'
        ) {
            return 'Required information is missing. Please fill in all required fields.';
        }

        // Rate limiting
        if (message.includes('rate limit') || message.includes('too many requests') || code === '429') {
            return 'Too many requests. Please wait a moment and try again.';
        }

        // Server errors
        if (
            message.includes('internal server error') ||
            message.includes('500') ||
            code === '500' ||
            code?.startsWith('5')
        ) {
            return 'A server error occurred. Please try again later.';
        }

        // Realtime/subscription errors
        if (
            message.includes('websocket') ||
            message.includes('realtime') ||
            message.includes('subscription')
        ) {
            return 'Live updates temporarily unavailable. Your data is safe.';
        }

        // If we have a message but it doesn't match patterns, check if it looks technical
        if (supabaseError.message) {
            // Check if the message contains technical terms that shouldn't be shown to users
            const technicalTerms = [
                'postgresql',
                'postgrest',
                'pg_',
                'schema',
                'relation',
                'column',
                'null value',
                'syntax error',
                'json',
                'ssl',
                'tls',
            ];

            const isTechnical = technicalTerms.some(term => message.includes(term));
            
            if (isTechnical) {
                return 'An error occurred while processing your request. Please try again or contact support.';
            }

            // If the message looks user-friendly, return it
            return supabaseError.message;
        }
    }

    // Fallback for unknown errors
    return 'An unexpected error occurred. Please try again.';
};

/**
 * Standard error handler that shows a toast notification
 * @param error - The error object
 * @param addToast - Toast notification function
 * @param context - Context message to prefix the error (e.g., "Failed to save report")
 * @param fallbackMessage - Message to show if error has no message
 */
export const handleError = (
    error: unknown,
    addToast: AddToastFunction,
    context?: string,
    fallbackMessage = 'An unexpected error occurred'
): void => {
    const errorMessage = error instanceof Error ? error.message : fallbackMessage;
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    console.error(fullMessage, error);
    addToast(fullMessage, 'error');
};

/**
 * Handle errors in async operations with try-catch
 * Returns a wrapped function that handles errors consistently
 * @param fn - Async function to wrap
 * @param addToast - Toast notification function
 * @param context - Context message for errors
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    addToast: AddToastFunction,
    context: string
): T => {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(error, addToast, context);
            return null;
        }
    }) as T;
};

/**
 * Handle Supabase-specific errors with user-friendly messages
 * @param error - The error object from Supabase
 * @param addToast - Toast notification function
 * @param context - Context message for the error (e.g., "Failed to save settings")
 */
export const handleSupabaseError = (
    error: unknown,
    addToast: AddToastFunction,
    context?: string
): void => {
    const userFriendlyMessage = mapSupabaseError(error);
    const fullMessage = context ? `${context}: ${userFriendlyMessage}` : userFriendlyMessage;
    
    // Log the full error details for debugging
    console.error('Supabase Error:', {
        context,
        error,
        userMessage: userFriendlyMessage
    });
    
    addToast(fullMessage, 'error');
};

/**
 * Handle API errors with specific status code handling
 * @param error - The error object
 * @param addToast - Toast notification function
 * @param context - Context message for the error
 */
export const handleApiError = (
    error: unknown,
    addToast: AddToastFunction,
    context: string
): void => {
    let message = 'An error occurred';
    
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
        message = String((error as { message: unknown }).message);
    }
    
    // Handle specific error patterns
    if (message.includes('fetch failed') || message.includes('network')) {
        message = 'Network error. Please check your connection.';
    } else if (message.includes('401') || message.includes('unauthorized')) {
        message = 'You are not authorized to perform this action.';
    } else if (message.includes('403') || message.includes('forbidden')) {
        message = 'Access denied. You do not have permission.';
    } else if (message.includes('404') || message.includes('not found')) {
        message = 'The requested resource was not found.';
    } else if (message.includes('500') || message.includes('server error')) {
        message = 'Server error. Please try again later.';
    }
    
    console.error(`${context}:`, error);
    addToast(`${context}: ${message}`, 'error');
};

/**
 * Show success toast with consistent formatting
 * @param message - Success message to display
 * @param addToast - Toast notification function
 */
export const showSuccess = (
    message: string,
    addToast: AddToastFunction
): void => {
    addToast(message, 'success');
};

/**
 * Show info toast with consistent formatting
 * @param message - Info message to display
 * @param addToast - Toast notification function
 */
export const showInfo = (
    message: string,
    addToast: AddToastFunction
): void => {
    addToast(message, 'info');
};

/**
 * Show warning toast with consistent formatting
 * @param message - Warning message to display
 * @param addToast - Toast notification function
 */
export const showWarning = (
    message: string,
    addToast: AddToastFunction
): void => {
    addToast(message, 'warning');
};

/**
 * Validate required fields and show error if missing
 * @param fields - Object with field names and values
 * @param addToast - Toast notification function
 * @returns true if all fields are valid, false otherwise
 */
export const validateRequiredFields = (
    fields: Record<string, string | number | boolean | null | undefined>,
    addToast: AddToastFunction
): boolean => {
    const emptyFields = Object.entries(fields)
        .filter(([_, value]) => !value || (typeof value === 'string' && value.trim() === ''))
        .map(([key, _]) => key);
    
    if (emptyFields.length > 0) {
        const fieldNames = emptyFields.join(', ');
        addToast(`Please fill in required fields: ${fieldNames}`, 'warning');
        return false;
    }
    
    return true;
};
