-- Add transfer tracking columns to payroll_items table
-- These columns support Paystack transfer integration

-- Add transfer_reference column to store unique transfer reference
ALTER TABLE public.payroll_items 
ADD COLUMN IF NOT EXISTS transfer_reference TEXT;

-- Add transfer_code column to store Paystack transfer code
ALTER TABLE public.payroll_items 
ADD COLUMN IF NOT EXISTS transfer_code TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.payroll_items.transfer_reference IS 'Unique reference for Paystack transfer (16-50 chars, lowercase a-z, 0-9, -, _)';
COMMENT ON COLUMN public.payroll_items.transfer_code IS 'Paystack transfer code returned from API (e.g., TRF_xxxx)';

-- Note: transfer_status column already exists in the table and stores transfer status from Paystack (e.g., success, pending, failed, otp)

