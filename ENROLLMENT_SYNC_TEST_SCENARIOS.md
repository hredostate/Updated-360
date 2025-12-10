# Enrollment Synchronization Test Scenarios

## Test Scenario 1: New Student with Class/Arm Assignment

**Setup:**
1. Have an active term (e.g., "2024/2025 - Term 1")
2. Have an academic class (e.g., "JSS 1 Gold (2024/2025)")

**Test Steps:**
1. Navigate to Student Management
2. Create a new student
3. Assign class: "JSS 1"
4. Assign arm: "Gold"
5. Save the student

**Expected Result:**
- Student is automatically enrolled in "JSS 1 Gold (2024/2025)" for the active term
- Database trigger creates enrollment record in `academic_class_students`
- No manual enrollment needed

**Verification:**
1. Go to Super Admin Console → Structure → Academic Classes
2. Open "JSS 1 Gold (2024/2025)"
3. Click "Manage Enrollment"
4. New student should appear in the enrolled list

---

## Test Scenario 2: Student Class/Arm Change

**Setup:**
1. Have a student enrolled in "JSS 1 Gold (2024/2025)"
2. Have another academic class "JSS 1 Silver (2024/2025)"

**Test Steps:**
1. Navigate to Student Management
2. Edit the student
3. Change arm from "Gold" to "Silver"
4. Save changes

**Expected Result:**
- Student is automatically removed from "JSS 1 Gold" enrollment
- Student is automatically enrolled in "JSS 1 Silver"
- Change applies to all active terms (up to 10 most recent)

**Verification:**
1. Check "JSS 1 Gold" enrollment → student should not be there
2. Check "JSS 1 Silver" enrollment → student should be there
3. Check score entry views → student appears under correct class

---

## Test Scenario 3: New Term Creation

**Setup:**
1. Have 50 active students with various class/arm assignments
2. Have academic classes for the new session

**Test Steps:**
1. Navigate to Super Admin Console → Structure → Academic Terms
2. Create a new term:
   - Session: "2025/2026"
   - Term: "Term 1"
   - Dates: Set appropriate dates
3. Save the term

**Expected Result:**
- System automatically syncs all 50 students to matching academic classes
- Each student enrolled based on their current class_id and arm_id
- Console log shows: "Auto-enrolled X students for new term"

**Verification:**
1. Go to Academic Classes for session "2025/2026"
2. Check enrollment for each class
3. All students with matching class/arm should be enrolled
4. Run manual sync to verify count matches

---

## Test Scenario 4: Manual Enrollment Sync

**Setup:**
1. Create deliberate inconsistency:
   - Student has class_id=3, arm_id=2
   - Manually delete their enrollment from `academic_class_students`

**Test Steps:**
1. Navigate to Super Admin Console → Structure → Enrollment Sync
2. Select the active term
3. Click "Sync Enrollments"

**Expected Result:**
- Sync completes successfully
- Shows "1 enrollment changed"
- Student is re-enrolled in correct academic class

**Verification:**
1. Check student appears in academic class enrollment
2. Check student appears in teacher score entry views
3. Check student appears in reports

---

## Test Scenario 5: Student Without Class/Arm

**Setup:**
1. Have a student with no class_id or arm_id assigned

**Test Steps:**
1. Run enrollment sync for active term

**Expected Result:**
- Student is NOT enrolled in any academic class
- Any existing enrollments for this student are removed
- System handles gracefully without errors

**Verification:**
1. Check academic class enrollments → student should not appear
2. Check database: no `academic_class_students` records for this student

---

## Test Scenario 6: No Matching Academic Class

**Setup:**
1. Have a student with class_id=5 (e.g., "SSS 3"), arm_id=1 (e.g., "Gold")
2. No academic class exists for "SSS 3 Gold" in current session

**Test Steps:**
1. Run enrollment sync for active term

**Expected Result:**
- Student is NOT enrolled (no matching academic class)
- No error messages
- System logs: "No matching academic class found"

**Verification:**
1. Check database logs
2. Student should not appear in any academic class enrollments
3. Create matching academic class, then re-run sync → student should enroll

---

## Test Scenario 7: Bulk Student Import

**Setup:**
1. Prepare CSV with 100 students, all with class_id and arm_id

**Test Steps:**
1. Import students via CSV upload
2. Wait for import to complete
3. Navigate to Enrollment Sync tool
4. Run sync for active term

**Expected Result:**
- All 100 students are synced to their respective academic classes
- Summary shows "100 enrollments changed"
- No duplicates created

**Verification:**
1. Spot-check several academic classes
2. Verify student counts match expected numbers
3. Check score entry views show all students

---

## Test Scenario 8: Cross-Session Academic Classes

**Setup:**
1. Have academic classes for sessions:
   - "2024/2025" with Term 1, Term 2, Term 3
   - "2025/2026" with Term 1

**Test Steps:**
1. Change a student from "JSS 1" to "JSS 2"
2. Student should have enrollments for terms in both sessions

**Expected Result:**
- Trigger syncs student across all active terms (up to 10 recent)
- Student enrolled in "JSS 2" classes for all terms
- Removed from "JSS 1" classes for all terms

**Verification:**
1. Check enrollments across multiple terms
2. Verify student appears under "JSS 2" in all recent terms
3. Verify student removed from "JSS 1" in all terms

---

## Test Scenario 9: Academic Class Session Mismatch

**Setup:**
1. Have a student in "JSS 1 Gold"
2. Active term is for session "2024/2025"
3. Only academic class is "JSS 1 Gold (2023/2024)" (wrong session)

**Test Steps:**
1. Run enrollment sync

**Expected Result:**
- Student is NOT enrolled (session mismatch)
- System handles gracefully
- No error messages

**Verification:**
1. Check student is not enrolled
2. Create correct academic class for "2024/2025"
3. Re-run sync → student should enroll

---

## Test Scenario 10: Performance Test

**Setup:**
1. Have 1000+ students with class/arm assignments
2. Have 20+ academic classes across 2 sessions

**Test Steps:**
1. Run manual sync for "All Recent Terms"
2. Measure time to complete

**Expected Result:**
- Sync completes within 30 seconds
- No timeout errors
- No database deadlocks
- Accurate enrollment counts

**Verification:**
1. Check sync summary: should show reasonable time
2. Spot-check enrollments are correct
3. Verify no students missing from reports

---

## Test Scenario 11: Concurrent Student Updates

**Setup:**
1. Have 10 students
2. Multiple staff members editing simultaneously

**Test Steps:**
1. Admin 1: Changes student A's class
2. Admin 2: Changes student B's arm (at same time)
3. Admin 3: Creates new student C (at same time)

**Expected Result:**
- All triggers execute successfully
- No race conditions or conflicts
- All enrollments sync correctly

**Verification:**
1. Check all 3 students are correctly enrolled
2. No duplicate enrollments
3. No missing enrollments

---

## Test Scenario 12: Inactive Academic Class

**Setup:**
1. Have academic class "JSS 1 Gold (2024/2025)" with `is_active = false`
2. Have student with matching class/arm

**Test Steps:**
1. Run enrollment sync

**Expected Result:**
- Student is NOT enrolled (academic class is inactive)
- System only syncs to active academic classes

**Verification:**
1. Check student not enrolled in inactive class
2. Activate the class
3. Re-run sync → student should enroll

---

## Validation Checklist

After running all scenarios:

- [ ] Database triggers work correctly
- [ ] Application-level sync works correctly
- [ ] Manual admin sync works correctly
- [ ] No orphan enrollment records
- [ ] No duplicate enrollments
- [ ] Performance is acceptable
- [ ] Error handling is graceful
- [ ] Logs provide useful information
- [ ] Students appear in all views correctly
- [ ] Reports show correct student lists
- [ ] Score entry shows correct students
- [ ] Timetables show correct students

---

## Known Limitations

1. **Sync Limit**: Only syncs up to 10 most recent terms to avoid processing old data
2. **No Multi-Class**: Students can only be in one class/arm at a time
3. **Manual Override**: No way to manually override automatic enrollment (by design)
4. **Historical Terms**: Old terms (beyond 10 most recent) won't auto-sync when student changes

---

## Troubleshooting

### Students not appearing in class lists
1. Check student has both class_id and arm_id set
2. Check matching academic class exists for the session
3. Check academic class is active
4. Run manual sync for that term

### Duplicate enrollments
1. Run manual sync - it will clean up duplicates
2. Check if manual insertions are happening outside sync system

### Sync taking too long
1. Sync one term at a time instead of all terms
2. Check database indexes
3. Limit to specific school_id

### Trigger not firing
1. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname LIKE '%sync_student%'`
2. Check trigger is enabled
3. Check function permissions

---

## Success Criteria

✅ All 12 test scenarios pass
✅ No data inconsistencies
✅ Students visible in all appropriate views
✅ Performance is acceptable (< 30 seconds for 1000 students)
✅ Error handling is graceful
✅ Documentation is clear and complete
