# Paystack Transfer Flow Diagram

## Overall Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Staff Payroll System                             │
│                                                                       │
│  1. Admin prepares payroll data (base pay + adjustments)            │
│  2. Admin clicks "Process Payroll"                                  │
│  3. Frontend calls run-payroll Edge Function                        │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Edge Function: run-payroll/index.ts                     │
│                                                                       │
│  Step 1: Calculate net amounts                                      │
│  ├─ Fetch adjustments from database                                 │
│  ├─ Calculate: net = gross + adjustments                            │
│  └─ Skip if net <= 0                                                │
│                                                                       │
│  Step 2: Resolve recipients                                         │
│  ├─ Check database for existing recipient code                      │
│  ├─ If not found:                                                   │
│  │  ├─ POST /transferrecipient to Paystack                         │
│  │  └─ Cache recipient_code in database                            │
│  └─ Generate unique transfer reference                              │
│                                                                       │
│  Step 3: Create payroll run record                                  │
│  └─ INSERT into payroll_runs (status: processing)                   │
│                                                                       │
│  Step 4: Insert payroll items                                       │
│  └─ INSERT into payroll_items with references                       │
│                                                                       │
│  Step 5: Initiate bulk transfer                                     │
│  ├─ POST /transfer/bulk to Paystack API                            │
│  ├─ Include all transfers with unique references                    │
│  └─ Receive array of transfer results                               │
│                                                                       │
│  Step 6: Update database                                            │
│  ├─ Update payroll_items with transfer_code                         │
│  ├─ Update payroll_runs status to 'success'                         │
│  └─ Mark adjustments as processed                                   │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   Response     │
                    │  to Frontend   │
                    └────────────────┘
```

## Paystack API Integration Details

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Paystack API Calls                                │
└─────────────────────────────────────────────────────────────────────┘

1. Create Transfer Recipient (One-time per staff member)
   ┌──────────────────────────────────────────────┐
   │ POST /transferrecipient                      │
   │                                              │
   │ Request:                                     │
   │ {                                            │
   │   "type": "nuban",                           │
   │   "name": "John Doe",                        │
   │   "account_number": "0123456789",            │
   │   "bank_code": "058",                        │
   │   "currency": "NGN"                          │
   │ }                                            │
   │                                              │
   │ Response:                                    │
   │ {                                            │
   │   "status": true,                            │
   │   "data": {                                  │
   │     "recipient_code": "RCP_xxx",  ◄─────────┼─ Cached in DB
   │     "details": { ... }                       │
   │   }                                          │
   │ }                                            │
   └──────────────────────────────────────────────┘

2. Bulk Transfer (Each payroll run)
   ┌──────────────────────────────────────────────┐
   │ POST /transfer/bulk                          │
   │                                              │
   │ Request:                                     │
   │ {                                            │
   │   "source": "balance",                       │
   │   "currency": "NGN",                         │
   │   "transfers": [                             │
   │     {                                        │
   │       "amount": 5000000,  ◄─────────────────┼─ In kobo (50,000 NGN)
   │       "recipient": "RCP_xxx",                │
   │       "reference": "payroll-xxx-123-abc", ◄──┼─ Unique (16-50 chars)
   │       "reason": "March 2024 salary"          │
   │     },                                       │
   │     { ... }  ◄───────────────────────────────┼─ Multiple transfers
   │   ]                                          │
   │ }                                            │
   │                                              │
   │ Response:                                    │
   │ {                                            │
   │   "status": true,                            │
   │   "message": "3 transfers queued.",          │
   │   "data": [                                  │
   │     {                                        │
   │       "reference": "payroll-xxx-123-abc",    │
   │       "recipient": "RCP_xxx",                │
   │       "amount": 5000000,                     │
   │       "transfer_code": "TRF_yyy", ◄──────────┼─ Stored in DB
   │       "status": "success"                    │
   │     },                                       │
   │     { ... }                                  │
   │   ]                                          │
   │ }                                            │
   └──────────────────────────────────────────────┘

3. Verify Transfer (Optional - check status)
   ┌──────────────────────────────────────────────┐
   │ GET /transfer/verify/{reference}             │
   │                                              │
   │ Response:                                    │
   │ {                                            │
   │   "status": true,                            │
   │   "data": {                                  │
   │     "status": "success", ◄───────────────────┼─ Updated in DB
   │     "amount": 5000000,                       │
   │     "transferred_at": "2024-03-01T10:05:00Z" │
   │   }                                          │
   │ }                                            │
   └──────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Database Tables                               │
└─────────────────────────────────────────────────────────────────────┘

payroll_runs
├─ id (primary key)
├─ school_id
├─ period_label ("March 2024 Salary")
├─ total_amount (sum of all payments)
├─ status ('processing', 'success', 'failed')
├─ transfer_code (deprecated, not used in bulk)
├─ meta (JSONB - error details or response)
├─ created_by
└─ created_at

payroll_items
├─ id (primary key)
├─ payroll_run_id (FK → payroll_runs)
├─ user_id (FK → user_profiles)
├─ gross_amount
├─ deductions (JSONB array)
├─ net_amount
├─ paystack_recipient_code ("RCP_xxx")
├─ transfer_status ('pending', 'success', 'failed', 'otp')
├─ transfer_reference ("payroll-xxx-123-abc") ◄─ NEW
├─ transfer_code ("TRF_yyy") ◄─ NEW
├─ narration
└─ payslip_url

paystack_recipients (Cache table)
├─ id (primary key)
├─ user_id (FK → user_profiles, unique)
├─ recipient_code ("RCP_xxx")
├─ bank_details (JSONB)
└─ created_at

payroll_adjustments
├─ id (primary key)
├─ school_id
├─ user_id (FK → user_profiles)
├─ amount (positive or negative)
├─ reason
├─ adjustment_type ('addition', 'deduction')
├─ is_recurring
├─ payroll_run_id (FK → payroll_runs, set when processed)
└─ created_at
```

## Transfer Reference Format

```
Pattern: {prefix}-{userid}-{timestamp}-{random}

Example: payroll-12345678-1765019814417-r6tien
         └──┬──┘ └───┬───┘ └─────┬─────┘ └──┬──┘
            │        │            │           └─ Random 6 chars (a-z0-9)
            │        │            └─ Unix timestamp (ms)
            │        └─ User ID (first 8 chars, alphanumeric only)
            └─ Prefix (payroll/salary/payment)

Rules:
✓ Length: 16-50 characters
✓ Characters: lowercase a-z, 0-9, dash (-), underscore (_)
✓ Unique for each transfer
✓ Human-readable structure
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Error Scenarios                                 │
└─────────────────────────────────────────────────────────────────────┘

Scenario 1: Recipient Creation Fails
├─ Cause: Invalid bank details
├─ Action: Throw error immediately
├─ Impact: No payroll run created
└─ Fix: Correct bank details in staff profile

Scenario 2: Bulk Transfer Fails
├─ Cause: Insufficient balance, API error
├─ Action: 
│  ├─ Update payroll_run.status = 'failed'
│  ├─ Store error in payroll_run.meta
│  └─ Throw error with message
├─ Impact: Run recorded as failed, no money moved
└─ Fix: Check Paystack balance/status, retry

Scenario 3: Some Transfers Succeed, Some Fail
├─ Cause: Paystack returns mixed results
├─ Action:
│  ├─ Update successful items with transfer_code
│  ├─ Mark failed items with error status
│  └─ Overall run status = 'success' (partial)
└─ Fix: Review individual items, retry failed ones

Scenario 4: OTP Required
├─ Cause: Paystack security policy
├─ Action:
│  ├─ Transfer status = 'otp'
│  ├─ Run status = 'processing'
│  └─ Return success with OTP message
└─ Fix: Complete OTP in Paystack dashboard
```

## Usage Example

```bash
# Step 1: Prepare payroll data
POST /supabase/functions/run-payroll
{
  "periodLabel": "March 2024 Salary",
  "reason": "Monthly salary payment",
  "items": [
    {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "gross_amount": 50000,
      "adjustment_ids": [1, 2],  // Bonus + deduction
      "bank_code": "058",
      "account_number": "0123456789"
    }
  ]
}

# Step 2: System processes
# - Creates/retrieves recipient: RCP_xxx
# - Generates reference: payroll-123e4567-1765019814417-r6tien
# - Calculates net: 50000 + 10000 - 5000 = 55000
# - Converts to kobo: 5500000
# - Calls Paystack bulk transfer API

# Step 3: Response
{
  "success": true,
  "message": "3 transfers queued.",
  "data": {
    "payroll_run_id": 123,
    "total_amount": 165000,
    "transfers_count": 3,
    "paystack_response": [
      {
        "reference": "payroll-123e4567-1765019814417-r6tien",
        "recipient": "RCP_xxx",
        "amount": 5500000,
        "transfer_code": "TRF_yyy",
        "status": "success"
      }
    ]
  }
}

# Step 4: Verify transfer (optional)
POST /supabase/functions/verify-transfer
{
  "reference": "payroll-123e4567-1765019814417-r6tien"
}
```
