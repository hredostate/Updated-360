-- Add audit_log to writable tables and enable write policy
-- This allows the application to write audit log entries

DO $$ 
BEGIN
    -- Drop existing policy if it exists
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'Auth write audit_log') THEN
        DROP POLICY "Auth write audit_log" ON public.audit_log;
    END IF;
    
    -- Create write policy for audit_log
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'Auth write audit_log') THEN
        CREATE POLICY "Auth write audit_log" ON public.audit_log 
        FOR ALL TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;
    
    RAISE NOTICE 'Added write policy for audit_log table';
END $$;
