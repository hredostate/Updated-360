# Quick Start Guide: Deploy Paystack Integration

This guide will help you deploy the Paystack Transfers integration for staff payroll.

## Prerequisites

- [ ] Supabase account with project set up
- [ ] Paystack account (test or live)
- [ ] Access to Supabase Edge Functions deployment
- [ ] Access to database SQL editor

## Step 1: Configure Paystack API Keys

### Get Your Paystack Keys
1. Log in to [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to Settings → API Keys & Webhooks
3. Copy your Secret Key (starts with `sk_test_` or `sk_live_`)

### Add to Supabase Edge Functions
```bash
# Set Paystack secret key
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxx

# Verify it's set
supabase secrets list
```

Or via Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add secret: `PAYSTACK_SECRET_KEY` with your key

## Step 2: Run Database Migration

### Option A: Via Supabase Dashboard
1. Go to SQL Editor in your Supabase dashboard
2. Open `supabase/migrations/add_transfer_tracking_columns.sql`
3. Copy the SQL content
4. Paste and run in SQL Editor

### Option B: Via Supabase CLI
```bash
# Apply migration
supabase db push

# Or run specific migration
supabase db execute -f supabase/migrations/add_transfer_tracking_columns.sql
```

### Verify Migration
Run this query in SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payroll_items' 
  AND column_name IN ('transfer_reference', 'transfer_code');
```

Expected result:
```
transfer_reference | text
transfer_code      | text
```

## Step 3: Deploy Edge Functions

### Deploy run-payroll function
```bash
cd School-Guardian

# Deploy the function
supabase functions deploy run-payroll

# Verify deployment
supabase functions list
```

### Deploy verify-transfer function
```bash
# Deploy the function
supabase functions deploy verify-transfer

# Verify deployment
supabase functions list
```

### Expected Output
```
┌────────────────┬──────────────┬─────────────┬──────────┐
│ Name           │ Version      │ Status      │ Region   │
├────────────────┼──────────────┼─────────────┼──────────┤
│ run-payroll    │ v1           │ Active      │ us-east-1│
│ verify-transfer│ v1           │ Active      │ us-east-1│
└────────────────┴──────────────┴─────────────┴──────────┘
```

## Step 4: Test the Integration

### Test 1: Create a Test Recipient
1. In your app, go to Staff Management
2. Add or update a staff member with:
   - Bank Code: `058` (GTBank - test bank)
   - Account Number: `0123456789` (test account)
   - Base Pay: `10000` (NGN)

### Test 2: Run Test Payroll
1. Go to HR & Payroll → Run Payroll
2. Select the test staff member
3. Click "Process Payroll"
4. Check response in console

### Expected Success Response
```json
{
  "success": true,
  "message": "1 transfers queued.",
  "data": {
    "payroll_run_id": 1,
    "total_amount": 10000,
    "transfers_count": 1,
    "paystack_response": [
      {
        "reference": "payroll-xxx-yyy-zzz",
        "recipient": "RCP_xxx",
        "amount": 1000000,
        "transfer_code": "TRF_xxx",
        "status": "success"
      }
    ]
  }
}
```

### Test 3: Verify Transfer (Optional)
```bash
curl -X POST https://your-project.supabase.co/functions/v1/verify-transfer \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"reference": "payroll-xxx-yyy-zzz"}'
```

## Step 5: Check Paystack Dashboard

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to Transfers
3. You should see your test transfer listed
4. Status will be one of:
   - ✅ **Success**: Money transferred
   - ⏳ **Pending**: Processing
   - ⚠️ **OTP Required**: Needs verification
   - ❌ **Failed**: See error message

## Step 6: Production Deployment

### Switch to Live Keys
```bash
# Update with live key
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxxxx
```

### Important: Disable OTP (Recommended)
For bulk transfers to work smoothly:
1. Go to Paystack Dashboard → Settings
2. Navigate to Transfers
3. Disable "Enable OTP" for transfers
4. Or set up automated OTP handling

### Fund Your Paystack Account
1. Go to Paystack Dashboard
2. Add funds to your transfer balance
3. Minimum: Total payroll amount + Paystack fees

### Enable in Production
1. Verify all staff have complete bank details
2. Run a small test payroll first
3. Monitor results before full deployment

## Troubleshooting

### Issue: "Paystack secret key is not configured"
**Solution:**
```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

### Issue: "Failed to create Paystack recipient"
**Possible Causes:**
- Invalid bank code
- Invalid account number
- Paystack API is down

**Solution:**
1. Verify bank code from [Paystack Bank List](https://api.paystack.co/bank)
2. Check account number is correct (10 digits for Nigerian banks)
3. Test account manually in Paystack dashboard

### Issue: "Bulk transfer initiation failed: Insufficient balance"
**Solution:**
1. Go to Paystack Dashboard
2. Check your transfer balance
3. Add funds to cover payroll + fees

### Issue: Transfer status shows "otp"
**Solution:**
1. Go to Paystack Dashboard → Transfers
2. Find the pending transfer
3. Complete OTP verification
4. Or disable OTP in Paystack settings

### Issue: Edge function timeout
**Solution:**
- Reduce batch size (process in smaller groups)
- Check database query performance
- Monitor Paystack API response times

## Monitoring & Maintenance

### Daily Checks
- [ ] Review payroll_runs for failed status
- [ ] Check Paystack dashboard for pending transfers
- [ ] Monitor transfer completion rates

### Weekly Tasks
- [ ] Reconcile transfers with bank statements
- [ ] Review payroll_items for failed transfers
- [ ] Update staff bank details if needed

### Monthly Tasks
- [ ] Verify Paystack balance is sufficient
- [ ] Review transfer fees and optimize
- [ ] Update documentation with any changes

## Support Resources

### Documentation
- [PAYROLL_PAYSTACK_INTEGRATION.md](./PAYROLL_PAYSTACK_INTEGRATION.md) - Full guide
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details
- [PAYSTACK_FLOW_DIAGRAM.md](./PAYSTACK_FLOW_DIAGRAM.md) - Visual flows

### External Resources
- [Paystack Transfers API Docs](https://paystack.com/docs/transfers/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Paystack Support](https://paystack.com/support)

### Test Suite
Run tests to validate your setup:
```bash
npx tsx tests/paystack-integration.test.ts
```

## Rollback Procedure

If you need to rollback:

1. **Disable new payroll runs:**
   ```sql
   -- Temporarily block payroll processing
   UPDATE school_settings SET meta = '{"payroll_disabled": true}';
   ```

2. **Revert database changes:**
   ```sql
   ALTER TABLE payroll_items DROP COLUMN transfer_reference;
   ALTER TABLE payroll_items DROP COLUMN transfer_code;
   ```

3. **Remove Edge Functions:**
   ```bash
   supabase functions delete run-payroll
   supabase functions delete verify-transfer
   ```

4. **Remove secrets:**
   ```bash
   supabase secrets unset PAYSTACK_SECRET_KEY
   ```

## Next Steps

After successful deployment:
1. ✅ Train staff on new payroll process
2. ✅ Set up monitoring alerts
3. ✅ Document your specific configuration
4. ✅ Schedule regular reconciliation
5. ✅ Plan for future enhancements (webhooks, scheduling, etc.)

---

**Need Help?** Check the troubleshooting section or contact your system administrator.
