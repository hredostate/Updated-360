-- Migration: Add absence requests table
-- Description: Create table for student absence/time-off requests
-- Date: 2025-12-11

-- Create absence_requests table
CREATE TABLE IF NOT EXISTS absence_requests (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES user_profiles(id), -- could be student or parent
  request_type VARCHAR(50) NOT NULL, -- 'sick', 'family', 'appointment', 'vacation', 'other'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  supporting_document_url TEXT, -- optional attachment (doctor's note, etc.)
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_absence_requests_student ON absence_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_absence_requests_school ON absence_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_absence_requests_status ON absence_requests(status);

-- Enable Row Level Security
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: Students can view their own requests
CREATE POLICY "Students can view their own absence requests"
ON absence_requests FOR SELECT
USING (
  requested_by = auth.uid()
  OR student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Policy: Students can create their own requests
CREATE POLICY "Students can create their own absence requests"
ON absence_requests FOR INSERT
WITH CHECK (
  requested_by = auth.uid()
  OR student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Policy: Teachers and admins can view all requests for their school
CREATE POLICY "Staff can view all absence requests for their school"
ON absence_requests FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM user_profiles WHERE id = auth.uid()
  )
);

-- Policy: Teachers and admins can update requests (approve/deny)
CREATE POLICY "Staff can update absence requests for their school"
ON absence_requests FOR UPDATE
USING (
  school_id IN (
    SELECT school_id FROM user_profiles WHERE id = auth.uid()
  )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_absence_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_absence_requests_updated_at
  BEFORE UPDATE ON absence_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_absence_requests_updated_at();
