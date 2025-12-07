/**
 * Standardized Error Handling Utilities
 * Provides consistent error handling patterns with toast notifications
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';
type AddToastFunction = (message: string, type?: ToastType) => void;

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
