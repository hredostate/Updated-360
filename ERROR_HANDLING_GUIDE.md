# User-Friendly Error Handling Guide

## Overview

This application now includes comprehensive user-friendly error handling for Supabase database operations and network connectivity issues. Raw technical error messages are automatically transformed into clear, actionable messages for end users.

## Key Features

✅ **Network Error Detection** - Automatically detects and handles connection issues  
✅ **Configuration Error Masking** - Hides sensitive configuration details from users  
✅ **Database Error Translation** - Converts technical database errors to user-friendly messages  
✅ **Consistent Error Logging** - All errors are still logged to console for debugging  

## Usage

### Basic Error Handling

Import the error handling utility in your component:

```typescript
import { mapSupabaseError, handleSupabaseError } from '../utils/errorHandling';
```

### Option 1: Using `mapSupabaseError()` (for custom error handling)

```typescript
try {
  const { data, error } = await supabase
    .from('table_name')
    .select('*');
  
  if (error) {
    const userFriendlyMessage = mapSupabaseError(error);
    addToast(`Failed to load data: ${userFriendlyMessage}`, 'error');
  }
} catch (error) {
  const userFriendlyMessage = mapSupabaseError(error);
  alert(`Operation failed: ${userFriendlyMessage}`);
}
```

### Option 2: Using `handleSupabaseError()` (with toast notifications)

```typescript
try {
  const { data, error } = await supabase
    .from('table_name')
    .insert({ ... });
  
  if (error) throw error;
  
  addToast('Data saved successfully', 'success');
} catch (error) {
  handleSupabaseError(error, addToast, 'Failed to save data');
}
```

## Error Message Mappings

### Network & Connection Errors

**Technical Errors:**
- "fetch failed"
- "network error"
- "connection timeout"
- "ECONNREFUSED"

**User-Friendly Message:**
> "Network connection lost. Please check your internet connection and try again."

### Configuration Errors

**Technical Errors:**
- "invalid api key"
- "invalid jwt"
- "jwt expired"
- "supabase url"

**User-Friendly Message:**
> "Service configuration issue. Please contact your system administrator."

### Authentication Errors

**Technical Errors:**
- "invalid login credentials"
- "email not confirmed"
- "user not found"
- HTTP 401

**User-Friendly Message:**
> "Authentication failed. Please check your credentials and try again."

### Permission Errors

**Technical Errors:**
- "permission denied"
- "insufficient privileges"
- "row-level security"
- HTTP 403

**User-Friendly Message:**
> "You do not have permission to perform this action."

### Database Constraint Errors

**Technical Errors:**
- "duplicate key" / "unique constraint" (PostgreSQL error 23505)

**User-Friendly Message:**
> "This record already exists. Please use a different value."

---

**Technical Errors:**
- "foreign key constraint" (PostgreSQL error 23503)

**User-Friendly Message:**
> "This operation cannot be completed because it would break data relationships."

---

**Technical Errors:**
- "not null constraint" (PostgreSQL error 23502)

**User-Friendly Message:**
> "Required information is missing. Please fill in all required fields."

### Rate Limiting

**Technical Errors:**
- "rate limit"
- "too many requests"
- HTTP 429

**User-Friendly Message:**
> "Too many requests. Please wait a moment and try again."

### Server Errors

**Technical Errors:**
- "internal server error"
- HTTP 500, 502, 503, 504

**User-Friendly Message:**
> "A server error occurred. Please try again later."

### Technical Term Filtering

The error handler also filters out technical terms that shouldn't be shown to users:
- postgresql, postgrest, pg_
- schema, relation, column
- null value, syntax error
- json, ssl, tls

If an error contains these terms, it's replaced with:
> "An error occurred while processing your request. Please try again or contact support."

## Components Updated

The following components have been updated to use user-friendly error handling:

1. **TermiiSettings.tsx** - Settings management
2. **PaymentGatewaySettings.tsx** - Payment configuration
3. **TimetableView.tsx** - Timetable management
4. **PayrollAdjustmentsManager.tsx** - Payroll adjustments
5. **TeacherScoreEntryView.tsx** - Score entry
6. **StudentProfileView.tsx** - Student profiles
7. **DVAManager.tsx** - Virtual account management
8. **HRPayrollModule.tsx** - HR and payroll operations

## Best Practices

### ✅ Do's

1. **Always log the original error** for debugging:
   ```typescript
   console.error('Operation failed:', error);
   ```

2. **Provide context** in error messages:
   ```typescript
   handleSupabaseError(error, addToast, 'Failed to save student data');
   ```

3. **Use specific error handling** for known constraint violations:
   ```typescript
   if (error.message.includes('unique_teacher_slot')) {
     addToast('This teacher is already busy at this time.', 'error');
   } else {
     const userFriendlyMessage = mapSupabaseError(error);
     addToast(`Error: ${userFriendlyMessage}`, 'error');
   }
   ```

### ❌ Don'ts

1. **Don't expose raw error messages** to users:
   ```typescript
   // ❌ Bad
   addToast(`Error: ${error.message}`, 'error');
   
   // ✅ Good
   const userFriendlyMessage = mapSupabaseError(error);
   addToast(`Error: ${userFriendlyMessage}`, 'error');
   ```

2. **Don't show technical details** in user-facing messages:
   ```typescript
   // ❌ Bad
   alert(`PostgreSQL error 23505: duplicate key value violates unique constraint`);
   
   // ✅ Good
   addToast('This record already exists. Please use a different value.', 'error');
   ```

3. **Don't hide errors completely** - always log for debugging:
   ```typescript
   // ❌ Bad
   catch (error) {
     // Silent failure
   }
   
   // ✅ Good
   catch (error) {
     console.error('Error details:', error);
     handleSupabaseError(error, addToast, 'Operation failed');
   }
   ```

## Testing Error Handling

### Manual Testing Scenarios

1. **Network Disconnection:**
   - Disconnect from the internet
   - Try to save data or fetch from the database
   - Expected: "Network connection lost. Please check your internet connection and try again."

2. **Permission Errors:**
   - Attempt an action without proper permissions
   - Expected: "You do not have permission to perform this action."

3. **Duplicate Records:**
   - Try to create a record with a value that already exists
   - Expected: "This record already exists. Please use a different value."

4. **Missing Required Fields:**
   - Submit a form with missing required data
   - Expected: "Required information is missing. Please fill in all required fields."

### Testing with Browser DevTools

You can simulate network errors using browser DevTools:

1. Open DevTools (F12)
2. Go to Network tab
3. Change throttling to "Offline"
4. Perform any database operation
5. Verify the user-friendly error message appears

## Future Enhancements

Potential improvements for error handling:

1. **Retry Logic** - Automatically retry failed network requests
2. **Offline Queue** - Queue operations when offline and sync when connection returns
3. **Error Analytics** - Track error frequencies to identify systemic issues
4. **Localization** - Translate error messages to multiple languages
5. **Custom Error Pages** - Create dedicated error pages for different error types

## Support

If you encounter errors that aren't handled appropriately:

1. Check the browser console for the original error details
2. Review this guide for the expected behavior
3. Report issues with both the user-facing message and console error details
4. Consider adding new error patterns to `mapSupabaseError()` if needed

## Related Files

- `src/utils/errorHandling.ts` - Core error handling utilities
- `src/services/supabaseClient.ts` - Supabase client initialization
- `src/offline/client.ts` - Offline-first client wrapper

---

**Last Updated:** December 9, 2024  
**Version:** 1.0.0
