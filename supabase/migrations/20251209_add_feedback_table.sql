-- Migration: Add feedback table for user suggestions and bug reports
-- Date: 2025-12-09

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id INTEGER REFERENCES public.schools(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature', 'feedback', 'rating')),
  message TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  page_url TEXT,
  browser_info JSONB,
  screenshot_url TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in-progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_feedback_school_id ON public.feedback(school_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Grant appropriate permissions
-- Allow authenticated users to insert their own feedback
-- Allow users to read their own feedback
-- Allow admins/principals to read all feedback for their school

-- RLS Policies
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: School admins can view all feedback for their school
CREATE POLICY "School admins can view all school feedback"
  ON public.feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()::text
        AND up.school_id = feedback.school_id
        AND up.role IN ('Admin', 'Principal')
    )
  );

-- Policy: School admins can update feedback status
CREATE POLICY "School admins can update feedback"
  ON public.feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()::text
        AND up.school_id = feedback.school_id
        AND up.role IN ('Admin', 'Principal')
    )
  );

-- Comment on table and columns
COMMENT ON TABLE public.feedback IS 'User feedback, bug reports, and feature requests';
COMMENT ON COLUMN public.feedback.type IS 'Type of feedback: bug, feature, feedback, or rating';
COMMENT ON COLUMN public.feedback.rating IS 'User rating from 1-5 stars (only for rating type)';
COMMENT ON COLUMN public.feedback.browser_info IS 'Browser and system information including sentiment emoji';
COMMENT ON COLUMN public.feedback.status IS 'Feedback status: new, reviewed, in-progress, or resolved';
