# Enrollment Sync Fix - Testing Guide

## Overview
This document provides testing scenarios to validate the fix for the student enrollment disappearing issue.

## Problem Addressed
Student names enrolled in academic classes were disappearing after page refresh due to aggressive sync behavior that would remove enrollments when:
- No matching academic class was found
- Class/arm naming mismatches occurred
- Academic class was marked as inactive

## Solution Implemented
Added a `manually_enrolled` boolean flag to track enrollments made through the UI, and modified the sync system to preserve these manual enrollments by default.

## Changes Made

### Database Layer
1. **New Column**: `academic_class_students.manually_enrolled` (BOOLEAN, default: FALSE)
2. **Updated Functions**:
   - `sync_student_enrollment(p_student_id, p_term_id, p_school_id, p_preserve_manual)`
   - `sync_all_students_for_term(p_term_id, p_school_id, p_preserve_manual)`
   - `admin_sync_student_enrollments(p_term_id, p_school_id, p_preserve_manual)`
3. **Updated Triggers**:
   - `trigger_sync_student_enrollment()` - now passes `preserve_manual=TRUE`
   - `trigger_sync_enrollments_on_term()` - now passes `preserve_manual=TRUE`

### Application Layer
1. **TypeScript Types**: Updated `AcademicClassStudent` interface to include `manually_enrolled?: boolean`
2. **Enrollment Saving**: Modified `handleUpdateClassEnrollment` to set `manually_enrolled: true`
3. **UI Enhancements**: Added "Preserve manual enrollments" checkbox in EnrollmentSyncTool

## Testing Scenarios

### Scenario 1: Manual Enrollment Protection
**Purpose**: Verify that manually enrolled students are preserved during sync

**Steps**:
1. Navigate to Academic Class Manager
2. Create an academic class (e.g., "JSS 1 A")
3. Manually enroll some students who DON'T have matching class/arm in their student record
4. Navigate to Enrollment Sync Tool
5. Ensure "Preserve manual enrollments" is CHECKED
6. Click "Sync Enrollments"

**Expected Result**:
- Manually enrolled students should remain enrolled
- Sync stats should show `preserved_manual` count > 0
- Success message should mention preserved enrollments

### Scenario 2: Full Reset Mode
**Purpose**: Verify that unchecking preserve option allows complete reset

**Steps**:
1. Use the same setup as Scenario 1
2. Navigate to Enrollment Sync Tool
3. UNCHECK "Preserve manual enrollments"
4. Observe the warning message
5. Click "Sync Enrollments"

**Expected Result**:
- Warning message should appear when option is unchecked
- All enrollments (including manual) should be removed if they don't match student class/arm
- Sync stats should show `removed` count including previously preserved enrollments

### Scenario 3: Auto-Sync on Student Class Change
**Purpose**: Verify that automatic sync preserves manual enrollments

**Steps**:
1. Create a student with class JSS 1, arm A
2. Create an academic class "JSS 1 A" for the current active term
3. Manually enroll the student in a DIFFERENT academic class (e.g., "JSS 2 B")
4. Change the student's class to JSS 2 (which should trigger auto-sync)

**Expected Result**:
- The manual enrollment in "JSS 2 B" should be preserved
- Sync result should show `preserved_manual` action

### Scenario 4: Inactive Academic Class
**Purpose**: Verify that manual enrollments are preserved even when academic class is inactive

**Steps**:
1. Create an active academic class and manually enroll students
2. Mark the academic class as inactive
3. Run sync with "Preserve manual enrollments" checked

**Expected Result**:
- Manual enrollments should remain despite class being inactive
- Sync stats should show preserved count

### Scenario 5: Naming Mismatch
**Purpose**: Verify that manual enrollments survive naming mismatches

**Steps**:
1. Create student with class "Junior Secondary 1", arm "A"
2. Create academic class with level "JSS 1", arm "A"
3. Manually enroll the student
4. Run sync

**Expected Result**:
- Manual enrollment should be preserved despite naming mismatch
- Diagnostic tool should show the student with a warning but enrollment intact

### Scenario 6: New Term Auto-Enrollment
**Purpose**: Verify that creating a new active term doesn't remove manual enrollments

**Steps**:
1. Have students with manual enrollments in current term
2. Create a new term and mark it as active

**Expected Result**:
- Trigger should fire for new term
- Manual enrollments in old term should remain unchanged
- New term should get auto-synced enrollments based on student class/arm

### Scenario 7: Diagnostics Tool
**Purpose**: Verify diagnostics show preserved manual enrollments

**Steps**:
1. Create manual enrollments that don't match student class/arm
2. Run "Run Diagnostics" in Enrollment Sync Tool

**Expected Result**:
- Diagnostics should identify students with mismatches
- Should show current enrollment vs expected enrollment
- Should indicate which are manual vs auto-synced

## Database Migration Testing

### Migration File Location
`supabase/migrations/20251211_improve_enrollment_sync.sql`

### Migration Steps
1. Backup database before applying migration
2. Run migration in Supabase SQL Editor or via migration tool
3. Verify column added: `SELECT manually_enrolled FROM academic_class_students LIMIT 1;`
4. Verify index created: Check pg_indexes for `idx_academic_class_students_manual`
5. Test function calls with new parameter

### Rollback Plan (if needed)
```sql
-- Remove the column
ALTER TABLE public.academic_class_students DROP COLUMN manually_enrolled;

-- Drop the index
DROP INDEX IF EXISTS idx_academic_class_students_manual;

-- Revert functions to previous version (use backup or previous migration)
```

## Performance Considerations

### Index Impact
- New partial index `idx_academic_class_students_manual WHERE manually_enrolled = TRUE`
- Should improve query performance when filtering for manual enrollments
- Minimal impact on inserts/updates as most enrollments will be auto-synced (FALSE)

### Function Call Overhead
- Additional parameter `p_preserve_manual` with default value
- Additional RECORD check for existing enrollments
- Should have minimal performance impact for typical use cases

## Known Limitations

1. **Existing Enrollments**: Enrollments created before this fix will have `manually_enrolled = FALSE` by default
   - These will be treated as auto-synced
   - To mark existing manual enrollments, run:
     ```sql
     UPDATE academic_class_students 
     SET manually_enrolled = TRUE 
     WHERE id IN (/* list of manual enrollment IDs */);
     ```

2. **Bulk Operations**: Bulk enrollment tools (if any) should be updated to set `manually_enrolled` appropriately

3. **Migration Window**: During migration, there may be a brief period where old code runs with new schema
   - The `manually_enrolled` column has a default value (FALSE) to handle this gracefully

## Success Criteria

The fix is successful if:
- ✅ Manual enrollments persist after sync operations
- ✅ Auto-synced enrollments continue to work correctly
- ✅ Triggers only fire on class_id/arm_id changes
- ✅ UI provides clear options and warnings
- ✅ Sync results show preserved counts
- ✅ No TypeScript compilation errors
- ✅ No database constraint violations
- ✅ Documentation is clear and comprehensive

## Troubleshooting

### Issue: Manual enrollments still being removed
- **Check**: Is "Preserve manual enrollments" checkbox enabled?
- **Check**: Are the enrollments actually marked as `manually_enrolled = TRUE`?
- **Check**: Is the latest migration applied?

### Issue: Function not found errors
- **Check**: Was the migration applied successfully?
- **Check**: Are the function signatures correct (4 parameters for sync_student_enrollment)?

### Issue: Sync showing 0 preserved
- **Check**: Are there any actual manual enrollments in the database?
- **Query**: `SELECT COUNT(*) FROM academic_class_students WHERE manually_enrolled = TRUE;`

### Issue: TypeScript errors
- **Check**: Is the `manually_enrolled` field added to the TypeScript interface?
- **Check**: Is npm install and build successful?

## Additional Resources

- **Original Issue**: Student names disappearing after page refresh
- **Migration File**: `supabase/migrations/20251211_improve_enrollment_sync.sql`
- **Updated Schema**: `database_schema.sql`
- **UI Component**: `src/components/EnrollmentSyncTool.tsx`
- **Type Definitions**: `src/types.ts`
- **Enrollment Handler**: `src/App.tsx` (handleUpdateClassEnrollment)
