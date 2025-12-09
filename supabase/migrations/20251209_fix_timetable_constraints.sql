-- Fix timetable constraints to allow multiple classes at the same time
-- but prevent location double-booking

-- Remove the unique_class_slot constraint that prevents multiple classes
-- from being scheduled at the same time
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_class_slot') THEN
        ALTER TABLE public.timetable_entries DROP CONSTRAINT unique_class_slot;
        RAISE NOTICE 'Dropped unique_class_slot constraint to allow multiple classes at the same time';
    END IF;
END $$;

-- Keep unique_teacher_slot: one teacher per time slot
-- Keep unique_location_slot: one location per time slot
-- These constraints remain to prevent:
-- 1. A teacher being assigned to multiple classes at the same time
-- 2. A location being double-booked at the same time

-- Note: This allows multiple classes (e.g., SS1 Copper, SS1 Diamond, SS1 Silver) 
-- to be scheduled at the same time slot, potentially in different locations.
-- The location constraint ensures that if a location is specified, 
-- it cannot be assigned to more than one entry at that specific time.
