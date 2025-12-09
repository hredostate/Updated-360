# Termii WhatsApp Integration - Quick Start Guide

## 🚀 Quick Deployment Checklist

Follow this checklist to deploy the Termii WhatsApp integration in production.

### Prerequisites ✅
- [ ] Termii account created and verified
- [ ] WhatsApp Business API access approved
- [ ] API key obtained from Termii dashboard
- [ ] WhatsApp device connected and Device ID noted
- [ ] Supabase project with Edge Functions enabled
- [ ] Database backup completed (safety first!)

### Step 1: Database Setup (5 minutes)
```bash
# Apply migrations in Supabase SQL Editor or via CLI
```

**Run these in order:**
1. `supabase/migrations/20251209_add_termii_tables.sql`
2. `supabase/migrations/20251209_add_unmatched_payments_table.sql` (optional)

**Verify tables exist:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('termii_settings', 'whatsapp_message_logs', 'unmatched_payments');
```

### Step 2: Environment Variables (2 minutes)

In Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
# Add these secrets:
TERMII_API_KEY = your_actual_api_key_from_termii
TERMII_DEVICE_ID = your_whatsapp_device_id
TERMII_BASE_URL = https://api.ng.termii.com
```

**Verify secrets are set:**
```bash
supabase secrets list
```

### Step 3: Deploy Edge Functions (3 minutes)

```bash
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy all three functions
supabase functions deploy termii-send-whatsapp
supabase functions deploy termii-webhook
supabase functions deploy termii-balance
```

**Expected output:**
```
✓ Deployed Function termii-send-whatsapp in 2s
✓ Deployed Function termii-webhook in 2s
✓ Deployed Function termii-balance in 2s
```

### Step 4: Configure School Settings (2 minutes)

Insert Termii settings for your school:

```sql
INSERT INTO termii_settings (school_id, api_key, device_id, is_active)
VALUES (1, 'your_termii_api_key', 'your_device_id', true)
ON CONFLICT (school_id) DO UPDATE 
SET api_key = EXCLUDED.api_key, 
    device_id = EXCLUDED.device_id,
    is_active = EXCLUDED.is_active;
```

### Step 5: Configure Termii Webhooks (3 minutes)

1. Log in to Termii Dashboard
2. Go to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Configure:
   - **URL**: `https://your-project.supabase.co/functions/v1/termii-webhook`
   - **Events**: Select all WhatsApp events (Sent, Delivered, Read, Failed)
   - **Secret**: (optional - not required for this implementation)
5. Click **Save**

### Step 6: Test the Integration (5 minutes)

#### Test 1: Check Balance
```bash
curl -X GET https://your-project.supabase.co/functions/v1/termii-balance \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

**Expected Response:**
```json
{
  "success": true,
  "balance": 1000.50,
  "currency": "NGN",
  "user": "your@email.com"
}
```

#### Test 2: Send Test Message
```bash
curl -X POST https://your-project.supabase.co/functions/v1/termii-send-whatsapp \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "234XXXXXXXXXX",
    "message_type": "conversational",
    "message": "Test message from School Guardian 360. Please confirm receipt."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "message_id": "ABC123XYZ",
  "balance": 999.50
}
```

#### Test 3: Verify Database Logging
```sql
SELECT 
  id,
  recipient_phone,
  message_type,
  status,
  created_at
FROM whatsapp_message_logs
ORDER BY created_at DESC
LIMIT 5;
```

#### Test 4: Trigger Payment Receipt (Optional)
Make a test payment through Paystack to verify automatic WhatsApp receipts work.

### Step 7: Create WhatsApp Templates (30 minutes - 2 days)

Create these essential templates in Termii Dashboard:

**Priority 1 (Create immediately):**
1. `payment_receipt` - For automatic payment confirmations
2. `fee_reminder` - For fee payment reminders

**Priority 2 (Create within 1 week):**
3. `attendance_alert` - For student check-in/out notifications
4. `report_card_ready` - For report card availability

**Priority 3 (Create as needed):**
5. `emergency_broadcast` - For urgent school-wide alerts
6. `transport_delay` - For bus delay notifications

**Template Creation Steps:**
1. Go to Termii Dashboard → WhatsApp → Message Templates
2. Click "Create Template"
3. Fill in template details (see TERMII_WHATSAPP_SETUP.md for examples)
4. Submit for approval
5. Wait 24-48 hours for WhatsApp approval
6. Note down Template IDs once approved

### Step 8: Monitor and Validate (Ongoing)

#### Daily Monitoring Queries:

**Check message delivery rate:**
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM whatsapp_message_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

**Check for failed messages:**
```sql
SELECT 
  recipient_phone,
  error_message,
  created_at
FROM whatsapp_message_logs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Check daily costs:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as messages_sent,
  COUNT(*) * 20 as estimated_cost_ngn
FROM whatsapp_message_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🔥 Common Issues & Quick Fixes

### Issue 1: "TERMII_API_KEY not configured"
**Fix:** Set environment variable in Supabase Edge Functions settings
```bash
supabase secrets set TERMII_API_KEY=your_actual_key
```

### Issue 2: Messages not sending
**Checks:**
1. Verify balance: `curl .../termii-balance`
2. Check device status in Termii dashboard
3. Verify phone number format: `234XXXXXXXXXX` (no spaces or +)
4. Check device connection in Termii

### Issue 3: Status not updating from "sent"
**Fix:** 
1. Verify webhook URL in Termii dashboard
2. Check webhook is receiving events:
   ```sql
   SELECT * FROM whatsapp_message_logs 
   WHERE updated_at > created_at 
   LIMIT 5;
   ```
3. Test webhook manually via Termii dashboard

### Issue 4: Payment receipts not sending
**Checks:**
1. Verify termii_settings table has valid data
2. Check student has parent_phone_number_1 populated
3. Review Paystack webhook logs
4. Check whatsapp_message_logs for errors

## 📊 Success Metrics

After deployment, monitor these metrics:

### Week 1:
- [ ] 100% of payments generate WhatsApp receipts
- [ ] >90% message delivery rate
- [ ] <1% failed messages
- [ ] Zero unhandled errors in logs

### Month 1:
- [ ] All essential templates approved and in use
- [ ] Parent satisfaction survey shows >80% prefer WhatsApp over SMS
- [ ] Cost per message <₦25
- [ ] Average delivery time <30 seconds

## 🎯 Next Steps After Deployment

### Immediate (Week 1):
1. [ ] Train staff on WhatsApp messaging features
2. [ ] Create admin guide for template usage
3. [ ] Set up daily monitoring dashboard
4. [ ] Document any custom templates created

### Short-term (Month 1):
1. [ ] Integrate with attendance system
2. [ ] Set up automated fee reminders
3. [ ] Create parent communication guidelines
4. [ ] Implement message scheduling for off-peak hours

### Long-term (Quarter 1):
1. [ ] Build admin UI for message management
2. [ ] Create analytics dashboard
3. [ ] Implement parent preference management (opt-in/out)
4. [ ] Add multi-language support

## 📞 Support Contacts

**Technical Issues:**
- Termii Support: support@termii.com
- Termii Documentation: https://developers.termii.com
- Supabase Support: https://supabase.com/support

**Internal:**
- System Administrator: [Your contact]
- Lead Developer: [Your contact]

## 📚 Documentation Reference

**For Setup:** Read `TERMII_WHATSAPP_SETUP.md`
**For Architecture:** Read `TERMII_ARCHITECTURE.md`
**For Implementation:** Read `TERMII_IMPLEMENTATION_SUMMARY.md`

## ✅ Deployment Sign-off

**Completed by:** _________________
**Date:** _________________
**Verified by:** _________________

**Deployment Notes:**
```
[Add any deployment-specific notes here]
```

---

## 🎉 Congratulations!

If all checkboxes are completed, your Termii WhatsApp integration is live and ready to use!

**Total Deployment Time:** ~20-30 minutes (excluding template approval wait time)

**Remember:**
- Keep your API keys secure
- Monitor message costs daily
- Review failed messages regularly
- Update templates as needed
- Collect parent feedback

**Need Help?** Refer to the troubleshooting section in `TERMII_WHATSAPP_SETUP.md`

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Production Ready ✅
