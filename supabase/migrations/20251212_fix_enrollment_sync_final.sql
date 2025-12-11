-- ============================================
-- Final Enrollment Sync Fix
-- Resolves function signature mismatches by:
-- 1. Dropping all versions of sync functions
-- 2. Creating 4-parameter versions as primary
-- 3. Creating 3-parameter wrappers for backward compatibility
-- 4. Granting permissions for both versions
-- ============================================

-- STEP 1: Drop all existing versions of sync functions and triggers
-- This ensures a clean slate with no signature conflicts

-- Drop triggers first (CASCADE will drop trigger functions)
DROP TRIGGER IF EXISTS student_enrollment_sync_trigger ON students CASCADE;
DROP TRIGGER IF EXISTS term_enrollment_sync_trigger ON terms CASCADE;

-- Drop trigger functions explicitly for clarity
DROP FUNCTION IF EXISTS trigger_sync_student_enrollment() CASCADE;
DROP FUNCTION IF EXISTS trigger_sync_enrollments_on_term() CASCADE;

-- Drop all versions of main functions (both 3-param and 4-param)
DROP FUNCTION IF EXISTS sync_student_enrollment(INTEGER, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS sync_student_enrollment(INTEGER, INTEGER, INTEGER, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS sync_all_students_for_term(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS sync_all_students_for_term(INTEGER, INTEGER, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS admin_sync_student_enrollments(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS admin_sync_student_enrollments(INTEGER, INTEGER, BOOLEAN) CASCADE;

-- Drop diagnostics function
DROP FUNCTION IF EXISTS get_enrollment_sync_diagnostics(INTEGER, INTEGER) CASCADE;

-- STEP 2: Ensure manually_enrolled column exists
ALTER TABLE public.academic_class_students 
ADD COLUMN IF NOT EXISTS manually_enrolled BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_academic_class_students_manual 
    ON public.academic_class_students(manually_enrolled) 
    WHERE manually_enrolled = TRUE;

-- STEP 3: Create primary 4-parameter versions of sync functions

-- Function: sync_student_enrollment (4 parameters - PRIMARY VERSION)
CREATE OR REPLACE FUNCTION sync_student_enrollment(
    p_student_id INTEGER,
    p_term_id INTEGER,
    p_school_id INTEGER,
    p_preserve_manual BOOLEAN DEFAULT TRUE
) RETURNS JSONB AS $$
DECLARE
    v_student RECORD;
    v_academic_class_id INTEGER;
    v_result JSONB;
    v_action TEXT;
    v_class_name TEXT;
    v_arm_name TEXT;
    v_existing_enrollment RECORD;
BEGIN
    -- Get student's current class and arm
    SELECT class_id, arm_id, name
    INTO v_student
    FROM students
    WHERE id = p_student_id AND school_id = p_school_id;
    
    -- If student not found or has no class/arm assignment
    IF v_student IS NULL OR v_student.class_id IS NULL OR v_student.arm_id IS NULL THEN
        -- Check if there's a manual enrollment to preserve
        IF p_preserve_manual THEN
            SELECT * INTO v_existing_enrollment
            FROM academic_class_students
            WHERE student_id = p_student_id
              AND enrolled_term_id = p_term_id
              AND manually_enrolled = TRUE;
            
            IF FOUND THEN
                -- Preserve manual enrollment, just log a warning
                RETURN jsonb_build_object(
                    'action', 'preserved_manual',
                    'student_id', p_student_id,
                    'reason', CASE 
                        WHEN v_student IS NULL THEN 'student_not_found_but_manual_enrollment_preserved'
                        ELSE 'no_class_or_arm_assigned_but_manual_enrollment_preserved'
                    END,
                    'academic_class_id', v_existing_enrollment.academic_class_id
                );
            END IF;
        END IF;
        
        -- Remove only auto-synced enrollments
        DELETE FROM academic_class_students
        WHERE student_id = p_student_id
          AND enrolled_term_id = p_term_id
          AND (NOT p_preserve_manual OR manually_enrolled = FALSE);
        
        RETURN jsonb_build_object(
            'action', 'removed',
            'student_id', p_student_id,
            'reason', CASE 
                WHEN v_student IS NULL THEN 'student_not_found'
                ELSE 'no_class_or_arm_assigned'
            END
        );
    END IF;
    
    -- Get student's class and arm names
    SELECT name INTO v_class_name FROM classes WHERE id = v_student.class_id;
    SELECT name INTO v_arm_name FROM arms WHERE id = v_student.arm_id;
    
    -- If class or arm not found, can't proceed
    IF v_class_name IS NULL OR v_arm_name IS NULL THEN
        RETURN jsonb_build_object(
            'action', 'error',
            'student_id', p_student_id,
            'reason', 'class_or_arm_not_found',
            'class_id', v_student.class_id,
            'arm_id', v_student.arm_id
        );
    END IF;
    
    -- Find the matching academic class
    SELECT id INTO v_academic_class_id
    FROM academic_classes
    WHERE school_id = p_school_id
      AND level = v_class_name
      AND arm = v_arm_name
      AND is_active = TRUE
    LIMIT 1;
    
    -- If no matching academic class found
    IF v_academic_class_id IS NULL THEN
        -- Check if there's a manual enrollment to preserve
        IF p_preserve_manual THEN
            SELECT * INTO v_existing_enrollment
            FROM academic_class_students
            WHERE student_id = p_student_id
              AND enrolled_term_id = p_term_id
              AND manually_enrolled = TRUE;
            
            IF FOUND THEN
                -- Preserve manual enrollment, just log a warning
                RETURN jsonb_build_object(
                    'action', 'preserved_manual',
                    'student_id', p_student_id,
                    'reason', 'no_matching_academic_class_but_manual_enrollment_preserved',
                    'class_name', v_class_name,
                    'arm_name', v_arm_name,
                    'academic_class_id', v_existing_enrollment.academic_class_id
                );
            END IF;
        END IF;
        
        -- Remove only auto-synced enrollments
        DELETE FROM academic_class_students
        WHERE student_id = p_student_id
          AND enrolled_term_id = p_term_id
          AND (NOT p_preserve_manual OR manually_enrolled = FALSE);
        
        RETURN jsonb_build_object(
            'action', 'removed',
            'student_id', p_student_id,
            'reason', 'no_matching_academic_class',
            'class_name', v_class_name,
            'arm_name', v_arm_name
        );
    END IF;
    
    -- Check if enrollment already exists
    SELECT * INTO v_existing_enrollment
    FROM academic_class_students
    WHERE student_id = p_student_id
      AND enrolled_term_id = p_term_id;
    
    IF FOUND THEN
        -- If it's a manual enrollment and matches the target class, preserve it
        IF v_existing_enrollment.manually_enrolled AND 
           v_existing_enrollment.academic_class_id = v_academic_class_id THEN
            RETURN jsonb_build_object(
                'action', 'preserved_manual',
                'student_id', p_student_id,
                'academic_class_id', v_academic_class_id,
                'class_name', v_class_name,
                'arm_name', v_arm_name,
                'reason', 'manual_enrollment_already_correct'
            );
        END IF;
        
        -- If it's a manual enrollment but for different class
        IF v_existing_enrollment.manually_enrolled AND 
           v_existing_enrollment.academic_class_id != v_academic_class_id AND
           p_preserve_manual THEN
            -- Keep the manual enrollment, don't override
            RETURN jsonb_build_object(
                'action', 'preserved_manual',
                'student_id', p_student_id,
                'academic_class_id', v_existing_enrollment.academic_class_id,
                'expected_class_id', v_academic_class_id,
                'class_name', v_class_name,
                'arm_name', v_arm_name,
                'reason', 'manual_enrollment_for_different_class_preserved'
            );
        END IF;
        
        -- Update the enrollment (it's either auto-synced or we're not preserving manual)
        UPDATE academic_class_students
        SET academic_class_id = v_academic_class_id,
            manually_enrolled = FALSE  -- Reset to auto-synced
        WHERE student_id = p_student_id
          AND enrolled_term_id = p_term_id;
        
        RETURN jsonb_build_object(
            'action', 'updated',
            'student_id', p_student_id,
            'academic_class_id', v_academic_class_id,
            'class_name', v_class_name,
            'arm_name', v_arm_name
        );
    ELSE
        -- Create new enrollment (auto-synced)
        INSERT INTO academic_class_students (academic_class_id, student_id, enrolled_term_id, manually_enrolled)
        VALUES (v_academic_class_id, p_student_id, p_term_id, FALSE);
        
        RETURN jsonb_build_object(
            'action', 'created',
            'student_id', p_student_id,
            'academic_class_id', v_academic_class_id,
            'class_name', v_class_name,
            'arm_name', v_arm_name
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: sync_all_students_for_term (3 parameters with optional preserve_manual - PRIMARY VERSION)
CREATE OR REPLACE FUNCTION sync_all_students_for_term(
    p_term_id INTEGER,
    p_school_id INTEGER,
    p_preserve_manual BOOLEAN DEFAULT TRUE
) RETURNS JSONB AS $$
DECLARE
    v_student RECORD;
    v_result JSONB;
    v_stats JSONB;
    v_created INTEGER := 0;
    v_updated INTEGER := 0;
    v_removed INTEGER := 0;
    v_errors INTEGER := 0;
    v_preserved INTEGER := 0;
BEGIN
    -- Process each student
    FOR v_student IN 
        SELECT id FROM students WHERE school_id = p_school_id
    LOOP
        v_result := sync_student_enrollment(v_student.id, p_term_id, p_school_id, p_preserve_manual);
        
        CASE v_result->>'action'
            WHEN 'created' THEN v_created := v_created + 1;
            WHEN 'updated' THEN v_updated := v_updated + 1;
            WHEN 'removed' THEN v_removed := v_removed + 1;
            WHEN 'error' THEN v_errors := v_errors + 1;
            WHEN 'preserved_manual' THEN v_preserved := v_preserved + 1;
        END CASE;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'term_id', p_term_id,
        'school_id', p_school_id,
        'stats', jsonb_build_object(
            'created', v_created,
            'updated', v_updated,
            'removed', v_removed,
            'errors', v_errors,
            'preserved_manual', v_preserved,
            'total_processed', v_created + v_updated + v_removed + v_errors + v_preserved
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function: admin_sync_student_enrollments (3 parameters with optional preserve_manual - PRIMARY VERSION)
CREATE OR REPLACE FUNCTION admin_sync_student_enrollments(
    p_term_id INTEGER,
    p_school_id INTEGER,
    p_preserve_manual BOOLEAN DEFAULT TRUE
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_before_count INTEGER;
    v_after_count INTEGER;
BEGIN
    -- Count enrollments before sync
    SELECT COUNT(*) INTO v_before_count
    FROM academic_class_students
    WHERE enrolled_term_id = p_term_id;
    
    -- Perform sync
    v_result := sync_all_students_for_term(p_term_id, p_school_id, p_preserve_manual);
    
    -- Count enrollments after sync
    SELECT COUNT(*) INTO v_after_count
    FROM academic_class_students
    WHERE enrolled_term_id = p_term_id;
    
    -- Return detailed stats
    RETURN jsonb_build_object(
        'success', true,
        'term_id', p_term_id,
        'school_id', p_school_id,
        'before_count', v_before_count,
        'after_count', v_after_count,
        'preserve_manual', p_preserve_manual,
        'sync_stats', v_result->'stats'
    );
END;
$$ LANGUAGE plpgsql;

-- Function: get_enrollment_sync_diagnostics (2 parameters)
CREATE OR REPLACE FUNCTION get_enrollment_sync_diagnostics(
    p_term_id INTEGER,
    p_school_id INTEGER
) RETURNS TABLE(
    student_id INTEGER,
    student_name TEXT,
    current_class_id INTEGER,
    current_arm_id INTEGER,
    current_class_name TEXT,
    current_arm_name TEXT,
    expected_academic_class_id INTEGER,
    expected_academic_class_name TEXT,
    enrolled_academic_class_id INTEGER,
    enrolled_academic_class_name TEXT,
    sync_status TEXT,
    issue_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH student_info AS (
        SELECT 
            s.id as student_id,
            s.name as student_name,
            s.class_id,
            s.arm_id,
            c.name as class_name,
            a.name as arm_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN arms a ON s.arm_id = a.id
        WHERE s.school_id = p_school_id
    ),
    expected_classes AS (
        SELECT 
            si.student_id,
            si.student_name,
            si.class_id,
            si.arm_id,
            si.class_name,
            si.arm_name,
            ac.id as expected_ac_id,
            ac.name as expected_ac_name
        FROM student_info si
        LEFT JOIN academic_classes ac ON 
            ac.school_id = p_school_id AND
            ac.level = si.class_name AND
            ac.arm = si.arm_name AND
            ac.is_active = TRUE
    ),
    current_enrollments AS (
        SELECT 
            acs.student_id,
            acs.academic_class_id as enrolled_ac_id,
            ac.name as enrolled_ac_name
        FROM academic_class_students acs
        JOIN academic_classes ac ON acs.academic_class_id = ac.id
        WHERE acs.enrolled_term_id = p_term_id
    )
    SELECT 
        ec.student_id,
        ec.student_name,
        ec.class_id as current_class_id,
        ec.arm_id as current_arm_id,
        ec.class_name as current_class_name,
        ec.arm_name as current_arm_name,
        ec.expected_ac_id as expected_academic_class_id,
        ec.expected_ac_name as expected_academic_class_name,
        ce.enrolled_ac_id as enrolled_academic_class_id,
        ce.enrolled_ac_name as enrolled_academic_class_name,
        CASE 
            WHEN ec.class_id IS NULL OR ec.arm_id IS NULL THEN 'no_assignment'
            WHEN ec.expected_ac_id IS NULL THEN 'no_matching_class'
            WHEN ce.enrolled_ac_id IS NULL THEN 'not_enrolled'
            WHEN ce.enrolled_ac_id != ec.expected_ac_id THEN 'mismatched'
            ELSE 'synced'
        END as sync_status,
        CASE 
            WHEN ec.class_id IS NULL OR ec.arm_id IS NULL THEN 
                'Student has no class or arm assignment in students table'
            WHEN ec.expected_ac_id IS NULL THEN 
                'No active academic class found for ' || ec.class_name || ' ' || ec.arm_name
            WHEN ce.enrolled_ac_id IS NULL THEN 
                'Student not enrolled in any class for this term'
            WHEN ce.enrolled_ac_id != ec.expected_ac_id THEN 
                'Student enrolled in ' || ce.enrolled_ac_name || ' but should be in ' || ec.expected_ac_name
            ELSE 'Student correctly enrolled'
        END as issue_description
    FROM expected_classes ec
    LEFT JOIN current_enrollments ce ON ec.student_id = ce.student_id
    WHERE 
        -- Only return students with issues
        CASE 
            WHEN ec.class_id IS NULL OR ec.arm_id IS NULL THEN TRUE
            WHEN ec.expected_ac_id IS NULL THEN TRUE
            WHEN ce.enrolled_ac_id IS NULL THEN TRUE
            WHEN ce.enrolled_ac_id != ec.expected_ac_id THEN TRUE
            ELSE FALSE
        END
    ORDER BY ec.student_name;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Create 3-parameter wrapper functions for backward compatibility
-- These wrappers call the 4-parameter versions with default preserve_manual=TRUE

-- Wrapper: sync_student_enrollment (3 parameters)
CREATE OR REPLACE FUNCTION sync_student_enrollment(
    p_student_id INTEGER,
    p_term_id INTEGER,
    p_school_id INTEGER
) RETURNS JSONB AS $$
BEGIN
    -- Call the 4-parameter version with default preserve_manual=TRUE
    RETURN sync_student_enrollment(p_student_id, p_term_id, p_school_id, TRUE);
END;
$$ LANGUAGE plpgsql;

-- Wrapper: sync_all_students_for_term (2 parameters)
CREATE OR REPLACE FUNCTION sync_all_students_for_term(
    p_term_id INTEGER,
    p_school_id INTEGER
) RETURNS JSONB AS $$
BEGIN
    -- Call the 3-parameter version with default preserve_manual=TRUE
    RETURN sync_all_students_for_term(p_term_id, p_school_id, TRUE);
END;
$$ LANGUAGE plpgsql;

-- Wrapper: admin_sync_student_enrollments (2 parameters)
CREATE OR REPLACE FUNCTION admin_sync_student_enrollments(
    p_term_id INTEGER,
    p_school_id INTEGER
) RETURNS JSONB AS $$
BEGIN
    -- Call the 3-parameter version with default preserve_manual=TRUE
    RETURN admin_sync_student_enrollments(p_term_id, p_school_id, TRUE);
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Recreate trigger functions

-- Trigger Function: Auto-sync student enrollment when class/arm changes
CREATE OR REPLACE FUNCTION trigger_sync_student_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    v_active_term RECORD;
    v_result JSONB;
BEGIN
    -- Only sync if class_id or arm_id changed
    IF (TG_OP = 'UPDATE' AND (
        OLD.class_id IS DISTINCT FROM NEW.class_id OR 
        OLD.arm_id IS DISTINCT FROM NEW.arm_id
    )) OR TG_OP = 'INSERT' THEN
        
        -- Get all active terms for this school
        FOR v_active_term IN 
            SELECT id FROM terms 
            WHERE school_id = NEW.school_id 
              AND is_active = TRUE
        LOOP
            -- Sync student for this term (preserve manual enrollments by default)
            PERFORM sync_student_enrollment(NEW.id, v_active_term.id, NEW.school_id, TRUE);
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Function: Auto-enroll all students when a new term is created or activated
CREATE OR REPLACE FUNCTION trigger_sync_enrollments_on_term()
RETURNS TRIGGER AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- When a term becomes active (created as active or changed to active)
    IF (TG_OP = 'INSERT' AND NEW.is_active = TRUE) OR 
       (TG_OP = 'UPDATE' AND OLD.is_active = FALSE AND NEW.is_active = TRUE) THEN
        
        -- Sync all students for this term (preserve manual enrollments by default)
        PERFORM sync_all_students_for_term(NEW.id, NEW.school_id, TRUE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Recreate triggers

CREATE TRIGGER student_enrollment_sync_trigger
    AFTER INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_student_enrollment();

CREATE TRIGGER term_enrollment_sync_trigger
    AFTER INSERT OR UPDATE ON terms
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_enrollments_on_term();

-- STEP 7: Grant execute permissions for BOTH 3-param and 4-param versions

-- Grant for 4-parameter versions (primary)
GRANT EXECUTE ON FUNCTION sync_student_enrollment(INTEGER, INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_students_for_term(INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_sync_student_enrollments(INTEGER, INTEGER, BOOLEAN) TO authenticated;

-- Grant for 3-parameter wrapper versions (backward compatibility)
GRANT EXECUTE ON FUNCTION sync_student_enrollment(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_students_for_term(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_sync_student_enrollments(INTEGER, INTEGER) TO authenticated;

-- Grant for diagnostics function (2 parameters)
GRANT EXECUTE ON FUNCTION get_enrollment_sync_diagnostics(INTEGER, INTEGER) TO authenticated;

-- STEP 8: Create index for optimal sync performance
CREATE INDEX IF NOT EXISTS idx_academic_classes_sync_lookup 
    ON academic_classes(school_id, level, arm, is_active)
    WHERE is_active = TRUE;

-- STEP 9: Add documentation comments

COMMENT ON COLUMN public.academic_class_students.manually_enrolled IS 
    'TRUE if enrollment was manually added through UI, FALSE if auto-synced. Manual enrollments are preserved during sync operations when p_preserve_manual=TRUE.';

COMMENT ON FUNCTION sync_student_enrollment(INTEGER, INTEGER, INTEGER, BOOLEAN) IS 
    'Synchronizes a single student enrollment record for a term based on their class_id and arm_id. When p_preserve_manual is TRUE (default), manual enrollments are preserved.';

COMMENT ON FUNCTION sync_student_enrollment(INTEGER, INTEGER, INTEGER) IS 
    'Backward-compatible wrapper that calls sync_student_enrollment with p_preserve_manual=TRUE.';

COMMENT ON FUNCTION sync_all_students_for_term(INTEGER, INTEGER, BOOLEAN) IS 
    'Bulk synchronizes all students enrollments for a specific term. When p_preserve_manual is TRUE (default), manual enrollments are preserved.';

COMMENT ON FUNCTION sync_all_students_for_term(INTEGER, INTEGER) IS 
    'Backward-compatible wrapper that calls sync_all_students_for_term with p_preserve_manual=TRUE.';

COMMENT ON FUNCTION admin_sync_student_enrollments(INTEGER, INTEGER, BOOLEAN) IS 
    'Admin function to manually sync enrollments with detailed statistics. When p_preserve_manual is TRUE (default), manual enrollments are preserved.';

COMMENT ON FUNCTION admin_sync_student_enrollments(INTEGER, INTEGER) IS 
    'Backward-compatible wrapper that calls admin_sync_student_enrollments with p_preserve_manual=TRUE.';

COMMENT ON FUNCTION get_enrollment_sync_diagnostics IS 
    'Diagnostic function to identify students with enrollment sync issues. Returns students who are not properly enrolled.';

COMMENT ON TRIGGER student_enrollment_sync_trigger ON students IS 
    'Auto-syncs student enrollments when class_id or arm_id changes.';

COMMENT ON TRIGGER term_enrollment_sync_trigger ON terms IS 
    'Auto-enrolls all students when a new term is created or activated.';
