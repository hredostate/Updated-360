# Updated Database Schema Summary

This document highlights the database schema elements relevant to the recent bug fixes and security enhancements.

## Tables Modified or Used in Recent Changes

### 1. `score_entries` Table
**Purpose:** Store student assessment scores for academic subjects

```sql
CREATE TABLE IF NOT EXISTS public.score_entries (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES public.schools(id) ON DELETE CASCADE,
    term_id INTEGER REFERENCES public.terms(id) ON DELETE CASCADE,
    academic_class_id INTEGER REFERENCES public.academic_classes(id) ON DELETE CASCADE,
    subject_name TEXT,
    student_id INTEGER REFERENCES public.students(id) ON DELETE CASCADE,
    component_scores JSONB DEFAULT '{}',
    total_score NUMERIC,
    grade TEXT,
    teacher_comment TEXT,
    ca_score NUMERIC,              -- ✅ OPTIONAL: Continuous Assessment score
    exam_score NUMERIC,            -- ✅ OPTIONAL: Exam score
    UNIQUE(term_id, academic_class_id, subject_name, student_id)
);
```

**Recent Changes:**
- `ca_score` and `exam_score` are **optional columns** (nullable)
- Application code now conditionally includes these fields only when they have actual values
- This prevents "column not found in schema cache" errors
- Properly handles zero scores using explicit `!== undefined` checks

---

### 2. `user_profiles` Table
**Purpose:** Store user profile information including authentication details

```sql
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,           -- ✅ USED: For student login username display
    role TEXT NOT NULL,
    avatar_url TEXT,
    staff_code TEXT,
    phone_number TEXT,
    description TEXT,
    bank_code TEXT,
    account_number TEXT,
    base_salary NUMERIC,
    paystack_recipient_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    campus_id INTEGER REFERENCES public.campuses(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Recent Changes:**
- `email` field is now fetched and displayed in StudentProfileView
- Used to show student login username/email with a copy button
- Enables credential retrieval for login assistance

---

### 3. `reports` Table
**Purpose:** Store various types of reports including infraction reports

```sql
CREATE TABLE IF NOT EXISTS public.reports (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES public.schools(id) ON DELETE CASCADE,
    report_text TEXT,
    report_type TEXT,              -- ✅ USED: Filter for 'Infraction' type
    author_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    involved_students INTEGER[],
    involved_staff TEXT[],
    tagged_users JSONB,
    image_url TEXT,
    status TEXT DEFAULT 'pending',
    response TEXT,
    analysis JSONB,
    parent_communication_draft TEXT,
    internal_summary_draft TEXT,
    archived BOOLEAN DEFAULT FALSE, -- ✅ USED: Archive infraction reports on bulk strike reset
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Recent Changes:**
- `archived` field is set to `true` for all infraction reports during bulk strike reset
- Bulk strike reset operation filters by `report_type = 'Infraction'` and `archived = false`
- This effectively "archives" all active infraction reports when strikes are reset

---

### 4. `audit_log` Table
**Purpose:** Track administrative actions for accountability and compliance

```sql
CREATE TABLE IF NOT EXISTS public.audit_log (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES public.schools(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action TEXT,                   -- ✅ USED: Records 'bulk_reset_strikes' action
    details JSONB,                 -- ✅ USED: Stores operation details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Recent Changes:**
- New audit log entry created when bulk strike reset is performed
- Records:
  - `action`: 'bulk_reset_strikes'
  - `actor_user_id`: Super Admin who performed the operation
  - `details`: JSON object with description and affected count
  - `school_id`: School where operation was performed

**Example Audit Log Entry:**
```json
{
    "action": "bulk_reset_strikes",
    "actor_user_id": "<super_admin_uuid>",
    "school_id": 1,
    "details": {
        "description": "Reset all student strikes and archived all active infraction reports",
        "affected_count": "all students"
    },
    "created_at": "2025-12-09T16:00:00Z"
}
```

---

### 5. `students` Table (Reference)
**Purpose:** Store student information

```sql
CREATE TABLE IF NOT EXISTS public.students (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    admission_number TEXT,
    grade TEXT,
    class_id INTEGER REFERENCES public.classes(id) ON DELETE SET NULL,
    arm_id INTEGER REFERENCES public.arms(id) ON DELETE SET NULL,
    campus_id INTEGER REFERENCES public.campuses(id) ON DELETE SET NULL,
    date_of_birth DATE,
    parent_phone_number_1 TEXT,
    parent_phone_number_2 TEXT,
    address TEXT,
    email TEXT,
    status TEXT DEFAULT 'Active',
    reward_points INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- ✅ Links to user_profiles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Recent Changes:**
- `user_id` field used to fetch associated user profile for username display
- When `user_id` is present, the student has a login account

---

## Security & Access Control

### Role-Based Permissions
The following permission changes were implemented:

1. **Bulk Strike Reset** - Now requires `*` permission (Super Admin only)
   - Previously accessible to users with `manage-students` permission
   - Moved from Student Roster to Super Admin Console "Advanced" tab

2. **Individual Strike Reset** - Remains available to Admin/Principal
   - Requires `Admin` or `Principal` role
   - Available in StudentProfileView

### Audit Trail
All bulk operations are now logged in the `audit_log` table with:
- Actor identification
- Action type
- Detailed operation information
- Timestamp

---

## Data Integrity Features

### 1. Optional Column Handling
The application now conditionally includes optional database columns to prevent schema cache errors:

```typescript
// Only include if value exists
if (caScore !== undefined && caScore !== null) {
    entry.ca_score = caScore;
}
```

### 2. Zero Score Handling
Uses explicit undefined checks to properly handle zero values:

```typescript
const caScore = sScores['CA'] !== undefined ? sScores['CA'] : sScores['CA1'];
```

### 3. State Cleanup on Logout
Ensures complete cleanup of:
- Session state
- Cached data (IndexedDB)
- Local storage (except theme preference)

---

## Indexing Recommendations

For optimal performance with the new features, consider these indexes:

```sql
-- For bulk strike reset queries
CREATE INDEX IF NOT EXISTS idx_reports_type_archived_school 
    ON public.reports(report_type, archived, school_id);

-- For audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_action_school 
    ON public.audit_log(action, school_id);

-- For student login lookups
CREATE INDEX IF NOT EXISTS idx_students_user_id 
    ON public.students(user_id) WHERE user_id IS NOT NULL;
```

---

## Migration Notes

### No Schema Changes Required
All database columns referenced in the recent changes already exist in the schema:
- ✅ `score_entries.ca_score` - Already exists as NUMERIC (nullable)
- ✅ `score_entries.exam_score` - Already exists as NUMERIC (nullable)
- ✅ `user_profiles.email` - Already exists as TEXT NOT NULL
- ✅ `reports.archived` - Already exists as BOOLEAN DEFAULT FALSE
- ✅ `reports.report_type` - Already exists as TEXT
- ✅ `audit_log` table - Already exists with all required columns

### No Database Migration Required
The changes are purely **application-level improvements** that work with the existing schema:
1. Better handling of optional columns
2. New UI features for username display
3. Access control changes for bulk operations
4. Enhanced audit logging

---

## Testing Queries

### Verify Optional Score Columns
```sql
-- Check if ca_score and exam_score are nullable
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'score_entries' 
    AND column_name IN ('ca_score', 'exam_score');
```

### Check Archived Reports
```sql
-- Count active vs archived infraction reports
SELECT 
    archived, 
    COUNT(*) as count 
FROM public.reports 
WHERE report_type = 'Infraction' 
GROUP BY archived;
```

### View Recent Audit Logs
```sql
-- View recent bulk strike reset operations
SELECT 
    al.created_at,
    al.action,
    up.name as actor_name,
    al.details
FROM public.audit_log al
JOIN public.user_profiles up ON al.actor_user_id = up.id
WHERE al.action = 'bulk_reset_strikes'
ORDER BY al.created_at DESC
LIMIT 10;
```

### Check Student Login Accounts
```sql
-- List students with login accounts
SELECT 
    s.id,
    s.name,
    s.email,
    up.email as login_email,
    CASE 
        WHEN s.user_id IS NOT NULL THEN 'Has Account'
        ELSE 'No Account'
    END as account_status
FROM public.students s
LEFT JOIN public.user_profiles up ON s.user_id = up.id
WHERE s.school_id = 1
ORDER BY s.name;
```

---

## Summary

### Schema Status: ✅ Complete
All required database structures are in place. No schema migrations are needed.

### Application Changes:
1. ✅ Improved optional column handling in score entries
2. ✅ Username display functionality using existing user_profiles.email
3. ✅ Bulk strike reset using existing reports.archived field
4. ✅ Audit logging using existing audit_log table

### Security Enhancements:
1. ✅ Super Admin-only access for bulk operations
2. ✅ Audit trail for dangerous operations
3. ✅ Proper state cleanup on logout

---

**Generated:** 2025-12-09  
**Version:** 1.0  
**Related PR:** Fix logout state cleanup, score saving schema cache errors, add username retrieval, and restrict bulk strike reset to Super Admin
