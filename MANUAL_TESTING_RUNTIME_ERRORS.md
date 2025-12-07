# Runtime Errors Fix - Manual Testing Guide

## Overview
This guide helps verify that all three runtime errors have been fixed:
1. handleCreateClassAssignment crash
2. Orders query 400 error
3. Gemini API rate limiting

## Prerequisites
- Application deployed with the latest changes
- Access to the application as a staff member
- Access to browser developer console

## Test 1: Class Assignment Creation

### Steps:
1. Log in as a staff member
2. Navigate to **Classes & Attendance** view
3. Open browser developer console (F12)
4. Click **"Create Class Assignment"** button
5. Fill in the form:
   - Select a Teacher
   - Select a Subject
   - Select a Class
   - Optionally select an Arm
   - Group type will auto-generate a name
6. Click **"Create"** or **"Save"**

### Expected Results:
✅ **No console errors** (especially no "handleCreateClassAssignment is not defined")
✅ **Success toast message** appears: "Class assignment created successfully."
✅ **New class group** appears in the list
✅ **Modal closes** automatically

### What Was Fixed:
- Added missing `handleCreateClassAssignment` function to App.tsx
- Implemented data transformation (subject_id → subject_name)
- Proper error handling and user feedback

---

## Test 2: Class Assignment Deletion

### Steps:
1. From the Classes & Attendance view
2. Select an existing class group
3. Click the **"Delete"** button
4. Confirm deletion in the popup
5. Check browser console

### Expected Results:
✅ **No console errors**
✅ **Success toast message**: "Class assignment deleted successfully."
✅ **Class group removed** from the list
✅ **Selection cleared** if the deleted group was selected

### What Was Fixed:
- Added missing `handleDeleteClassAssignment` function to App.tsx
- Uses refreshClassGroups helper for data refresh

---

## Test 3: Store Manager / Orders Query

### Steps:
1. Navigate to **Store Manager** or **Order Manager** view
2. Open browser developer console (F12)
3. Check the Network tab for the orders API call
4. Look for any 400 Bad Request errors

### Expected Results:
✅ **No 400 errors** in console or network tab
✅ **Orders load successfully** with all nested data:
   - Order items with inventory details
   - User information (name, email)
   - Order notes with author information
✅ **Data displays correctly** in the UI

### What Was Fixed:
- Added explicit foreign key hints to orders query:
  - `inventory_items!inventory_item_id`
  - `user_profiles!user_id`
  - `user_profiles!author_id`

### If Orders Don't Load:
Check the console for specific errors. The query should now work with proper FK hints, but if there are still issues, it might be due to:
- Missing data in related tables
- Database permission issues
- RLS policy restrictions

---

## Test 4: Gemini API Rate Limiting (Optional)

This feature was already implemented, but you can verify it works:

### Steps:
1. Navigate to the Dashboard
2. Wait for AI task suggestions to appear
3. If you see "AI suggestions temporarily unavailable" warning:
   - This means rate limiting is working
   - You should see fallback task suggestions instead

### Expected Results:
✅ **No application crash** when rate limited
✅ **Warning toast** with friendly message
✅ **Fallback suggestions** displayed with amber warning banner
✅ **Title changes** from "AI Task Suggestions" to "Recommended Tasks"

### What Was Verified:
- Rate limit detection working correctly
- Fallback mechanism provides useful suggestions
- User experience remains smooth despite API limits

---

## Console Checks

### Throughout Testing, Verify:
✅ No "ReferenceError: handleCreateClassAssignment is not defined"
✅ No 400 Bad Request errors for orders
✅ No uncaught exceptions or crashes
✅ Toast messages appear for all operations
✅ Data refreshes after create/delete operations

### Debug Console Commands:
```javascript
// Check if handlers are defined
console.log(typeof handleCreateClassAssignment); // Should not be "undefined"

// Check class groups state
console.log('Class Groups:', classGroups);

// Check orders data
console.log('Orders:', orders);
```

---

## Common Issues & Solutions

### Issue: Form validation fails
**Cause**: Missing required fields
**Solution**: Ensure Teacher, Subject, and Class are all selected

### Issue: "Invalid subject selected" error
**Cause**: Subject ID not found in allSubjects array
**Solution**: Verify subjects are loaded properly, check database data

### Issue: Orders still show 400 error
**Cause**: Database foreign key configuration issue
**Solution**: Verify foreign key relationships exist in Supabase database

### Issue: Class group created but not visible
**Cause**: Refresh query might have failed silently
**Solution**: Reload the page, check console for warnings

---

## Performance Checks

### Monitor:
- Page load time (should be unchanged)
- Form submission response time
- Data refresh after operations
- Memory usage (no leaks from new handlers)

### Expected Performance:
- Form submission: < 2 seconds
- Data refresh: < 1 second
- No memory leaks
- Smooth UI interactions

---

## Edge Cases to Test

### Test 1: Network Offline
1. Enable offline mode in browser
2. Try to create a class assignment
3. Should use Offline API and queue the operation

### Test 2: Invalid Data
1. Try to create assignment without selecting subject
2. Should show validation error
3. Try to delete non-existent group (shouldn't be possible via UI)

### Test 3: Concurrent Operations
1. Open app in two tabs
2. Create class assignment in tab 1
3. Check if it appears in tab 2 after refresh

---

## Success Criteria

All tests pass if:
- ✅ No console errors during any operation
- ✅ All success/error messages appear as expected
- ✅ Data persists and refreshes correctly
- ✅ UI remains responsive
- ✅ No application crashes
- ✅ Orders load with full nested data
- ✅ Rate limiting handled gracefully

---

## Rollback Plan

If critical issues are found:
1. Revert to previous commit: `git revert HEAD`
2. Redeploy previous version
3. Report specific error messages
4. Check database schema matches expected structure

---

## Additional Notes

### Database Schema Dependencies
The fix relies on these database tables:
- `teaching_assignments` (teacher_user_id, subject_name, academic_class_id)
- `class_groups` (teaching_entity_id, school_id, created_by)
- `orders` (user_id → user_profiles)
- `order_items` (inventory_item_id → inventory_items)
- `order_notes` (author_id → user_profiles)

### Code Changes Summary
- Added: `refreshClassGroups` helper function
- Added: `handleCreateClassAssignment` handler
- Added: `handleDeleteClassAssignment` handler
- Modified: Orders query (2 locations) with FK hints
- Verified: Rate limit handling (no changes needed)

### Build Information
- Build Status: ✅ Success
- TypeScript: ✅ No errors
- Security Scan: ✅ 0 vulnerabilities
- Bundle Size: ~527 KB (unchanged)

---

## Support

If you encounter issues during testing:
1. Check browser console for specific error messages
2. Verify database schema matches expected structure
3. Test Supabase queries directly in SQL Editor
4. Review FIX_SUMMARY_RUNTIME_ERRORS.md for technical details
5. Check that RLS policies allow the operations

For questions or issues, refer to the fix summary documentation or contact the development team.
