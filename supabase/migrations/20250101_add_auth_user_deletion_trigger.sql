-- Migration: Add trigger to handle auth user deletion
-- This ensures that when a student's auth account is deleted,
-- the student record's user_id is properly set to NULL

-- Create function to handle auth user deletion
CREATE OR REPLACE FUNCTION public.handle_auth_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- When an auth user is deleted, update the students table to set user_id to NULL
    -- This ensures students remain in the roster but without login credentials
    UPDATE public.students
    SET user_id = NULL
    WHERE user_id = OLD.id;
    
    -- Also clean up student_profiles if they exist
    -- The CASCADE should handle this, but we'll be explicit
    DELETE FROM public.student_profiles
    WHERE id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
BEFORE DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deletion();
