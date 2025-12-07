# Manual Testing Guide: Login Blank Screen Fix

## Overview
This document provides step-by-step instructions to manually test the fix for the blank screen issue that appeared after login.

## What Was Fixed
Previously, after entering valid login credentials, users would see a blank screen instead of being redirected to their dashboard. This was caused by a race condition where the navigation hash was set before the authentication session was fully established.

## Changes Made
1. **LoginPage.tsx**: Removed immediate hash navigation after login
2. **StudentLoginPage.tsx**: Removed immediate hash navigation after login
3. **App.tsx**: Added navigation logic that executes AFTER profile data loads

## Testing Instructions

### Prerequisites
- Access to the application running locally or on a test server
- Valid staff credentials (email/password)
- Valid student credentials (email/password)
- Browser with Developer Console open (to check for errors)

### Test Case 1: Staff Login
1. **Navigate to Login**
   - Go to the application URL
   - Click on "Staff Portal" or navigate to teacher login
   
2. **Enter Credentials**
   - Enter valid staff email address
   - Enter valid staff password
   
3. **Submit Login**
   - Click the "Sign in" button
   - Observe the following:
     - Loading indicator should appear briefly
     - No blank screen should appear
     - After a moment, you should see the Dashboard view
     
4. **Verify Success**
   - ✅ Dashboard is fully loaded with content
   - ✅ Sidebar shows staff menu items
   - ✅ Header shows user profile
   - ✅ No console errors in Developer Tools
   - ✅ URL hash is `#Dashboard`

### Test Case 2: Student Login
1. **Navigate to Login**
   - Go to the application URL
   - Click on "Student Portal" or navigate to student login
   
2. **Enter Credentials**
   - Enter valid student email address
   - Enter valid student password
   
3. **Submit Login**
   - Click the "Sign in" button
   - Observe the following:
     - Loading indicator should appear briefly
     - No blank screen should appear
     - After a moment, you should see the "My Subjects" view
     
4. **Verify Success**
   - ✅ Student portal is fully loaded with subjects/lesson plans
   - ✅ Sidebar shows student menu items
   - ✅ Header shows student profile
   - ✅ No console errors in Developer Tools
   - ✅ URL hash is `#My%20Subjects`

### Test Case 3: Invalid Credentials
1. **Enter Invalid Credentials**
   - Enter an invalid email or password
   - Submit the form
   
2. **Verify Error Handling**
   - ✅ Error message is displayed
   - ✅ No navigation occurs
   - ✅ User remains on login page
   - ✅ No blank screen appears

### Test Case 4: Network Delay Simulation
1. **Open Developer Tools**
   - Network tab → Throttling → Set to "Slow 3G"
   
2. **Login with Valid Credentials**
   - Enter credentials and submit
   
3. **Verify Loading State**
   - ✅ Loading spinner is visible during the delay
   - ✅ No blank screen appears
   - ✅ Eventually navigates to appropriate view
   - ✅ Profile loading timeout (15s) works if needed

## Expected Behavior

### Before the Fix
- User logs in → Blank white screen → Eventually loads (or timeout)
- Race condition between auth state and navigation
- Confusing user experience

### After the Fix
- User logs in → Loading indicator → Dashboard/My Subjects
- Navigation only happens after auth completes
- Smooth, predictable user experience

## Common Issues to Watch For

### Issue: Still seeing blank screen
- Check browser console for errors
- Verify Supabase environment variables are set
- Check network tab for failed API calls
- Verify database has required tables

### Issue: Infinite loading
- Profile loading has 15-second timeout
- If timeout occurs, check profile loading error message
- May need to run database setup scripts

### Issue: Wrong view after login
- Staff should see "Dashboard"
- Students should see "My Subjects"
- If wrong, check user_metadata.user_type in Supabase

## Browser Console Checks
Open Developer Console and look for:
- ✅ `[Auth] Starting profile fetch for user: <user_id>`
- ✅ `[Auth] Staff profile loaded successfully` or `[Auth] Student profile loaded successfully`
- ✅ No errors related to profile loading
- ✅ No "Profile loading timeout" messages

## Reporting Issues
If you encounter any issues during testing:
1. Note the exact steps to reproduce
2. Capture browser console errors
3. Note which user type (staff/student)
4. Include network requests from Network tab
5. Report to development team with details

## Success Criteria
All test cases pass with:
- No blank screens at any point
- Proper loading indicators shown
- Correct navigation to Dashboard or My Subjects
- No console errors
- Smooth user experience
