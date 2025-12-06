-- Migration: Add student_record_id column to student_profiles table
-- This column links student_profiles (auth users) to students table records

-- Add the student_record_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'student_record_id'
    ) THEN
        ALTER TABLE public.student_profiles 
        ADD COLUMN student_record_id INTEGER REFERENCES public.students(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added student_record_id column to student_profiles table';
    ELSE
        RAISE NOTICE 'student_record_id column already exists in student_profiles table';
    END IF;
END $$;

-- Update existing student_profiles to link them with their corresponding students records
-- This links students that have matching user_id
UPDATE public.student_profiles sp
SET student_record_id = s.id
FROM public.students s
WHERE s.user_id = sp.id
AND sp.student_record_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.student_profiles.student_record_id IS 'Foreign key linking to the students table record';
