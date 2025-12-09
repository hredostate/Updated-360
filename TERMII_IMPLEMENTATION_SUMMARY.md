# Termii WhatsApp Integration - Implementation Summary

## Overview
This implementation replaces SMS messaging with Termii WhatsApp integration and enhances the Paystack webhook to automatically send WhatsApp payment receipts.

## Files Created/Modified

### New Files
1. **src/services/termiiService.ts** - Complete Termii API service with all methods
2. **supabase/functions/termii-send-whatsapp/index.ts** - Edge function for sending WhatsApp messages
3. **supabase/functions/termii-webhook/index.ts** - Edge function for handling delivery status callbacks
4. **supabase/functions/termii-balance/index.ts** - Edge function for checking account balance
5. **supabase/migrations/20251209_add_termii_tables.sql** - Database migration for termii_settings and whatsapp_message_logs tables
6. **supabase/migrations/20251209_add_unmatched_payments_table.sql** - Optional migration for unmatched payments quarantine
7. **TERMII_WHATSAPP_SETUP.md** - Comprehensive setup and configuration guide

### Modified Files
1. **src/types.ts** - Added Termii-related TypeScript interfaces
2. **supabase/functions/paystack-webhook/index.ts** - Enhanced to support charge.success events and send WhatsApp receipts

## Key Features Implemented

### 1. Termii Service (src/services/termiiService.ts)
- ✅ Send WhatsApp template messages (no media)
- ✅ Send WhatsApp template messages with media (PDFs, images)
- ✅ Send conversational WhatsApp messages
- ✅ Fetch Sender IDs
- ✅ Request new Sender ID
- ✅ Manage Phonebook Contacts (fetch, add single, add multiple, delete)
- ✅ Check account balance

### 2. Edge Functions

#### termii-send-whatsapp
- Accepts: phone_number, device_id, template_id, data, media (optional), message_type
- Validates input and sends via Termii API
- Logs all messages to whatsapp_message_logs table
- Returns message_id and balance info

#### termii-webhook
- Receives delivery status updates from Termii
- Updates message status in whatsapp_message_logs
- Handles: SENT, DELIVERED, READ, FAILED statuses

#### termii-balance
- Simple GET endpoint to check Termii account balance
- Returns balance, currency, and user info

### 3. Enhanced Paystack Webhook

#### New Functionality
- ✅ Supports `charge.success` event (card payments) in addition to `dedicatedaccount.credit` (DVA)
- ✅ Automatically sends WhatsApp payment receipt after successful payment
- ✅ Receipt includes: student name, amount paid, payment method, reference, date, total paid, remaining balance
- ✅ Improved error handling with detailed logging
- ✅ Unmatched payments handling with manual review capability

#### Payment Receipt Format
```
Dear Parent,

Payment Receipt Confirmation

Student: {student_name}
Amount Paid: ₦{amount}
Payment Method: {method}
Reference: {reference}
Date: {date}
Total Paid: ₦{total_paid}
Remaining Balance: ₦{remaining_balance}

Thank you for your payment.

School Guardian 360
```

### 4. Database Schema

#### termii_settings table
```sql
- id (SERIAL PRIMARY KEY)
- school_id (INTEGER UNIQUE) - Links to schools table
- api_key (TEXT NOT NULL) - Termii API key
- device_id (TEXT) - WhatsApp device ID
- base_url (TEXT) - API base URL
- is_active (BOOLEAN) - Enable/disable
- created_at, updated_at (TIMESTAMPTZ)
```

#### whatsapp_message_logs table
```sql
- id (SERIAL PRIMARY KEY)
- school_id (INTEGER) - Links to schools table
- recipient_phone (TEXT NOT NULL)
- template_id (TEXT) - Template ID if used
- message_type (TEXT) - 'template', 'template_media', 'conversational'
- message_content (JSONB) - Message data
- media_url (TEXT) - Media URL if applicable
- termii_message_id (TEXT) - Termii's message ID
- status (TEXT) - 'pending', 'sent', 'delivered', 'failed'
- error_message (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

#### unmatched_payments table (optional)
```sql
- id (SERIAL PRIMARY KEY)
- reference (TEXT UNIQUE)
- amount (NUMERIC)
- payment_date (TIMESTAMPTZ)
- payment_method (TEXT)
- customer_email (TEXT)
- raw_data (JSONB)
- manually_matched (BOOLEAN)
- matched_school_id, matched_invoice_id
- matched_by_user_id, matched_at
- notes (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

### 5. RLS Policies
- ✅ termii_settings: Only Admins and Accountants can manage
- ✅ whatsapp_message_logs: Admins, Accountants, and Principals can view; Service role can manage
- ✅ unmatched_payments: Only Admins and Accountants can view/manage

### 6. TypeScript Types
Added comprehensive interfaces:
- `TermiiSettings` - Configuration settings
- `WhatsAppMessageLog` - Message log structure
- `TermiiTemplateMessage` - Template message parameters
- `TermiiTemplateMediaMessage` - Template with media parameters
- `TermiiConversationalMessage` - Conversational message parameters
- `TermiiSenderId` - Sender ID structure
- `TermiiPhonebookContact` - Contact structure

## Environment Variables Required

```bash
TERMII_API_KEY=your_termii_api_key_here
TERMII_DEVICE_ID=your_whatsapp_device_id_here
TERMII_BASE_URL=https://api.ng.termii.com
```

## Setup Checklist

### Pre-deployment
- [ ] Create Termii account and get API key
- [ ] Set up WhatsApp device in Termii dashboard
- [ ] Create and get approval for WhatsApp templates
- [ ] Note down Device ID from Termii

### Deployment
- [ ] Run database migrations:
  - `20251209_add_termii_tables.sql`
  - `20251209_add_unmatched_payments_table.sql` (optional)
- [ ] Set environment variables in Supabase Edge Functions settings
- [ ] Deploy edge functions:
  ```bash
  supabase functions deploy termii-send-whatsapp
  supabase functions deploy termii-webhook
  supabase functions deploy termii-balance
  ```
- [ ] Configure webhook URL in Termii dashboard
- [ ] Insert termii_settings for your school

### Post-deployment Testing
- [ ] Test balance check: `GET /termii-balance`
- [ ] Test sending template message
- [ ] Test sending conversational message
- [ ] Test payment receipt (trigger test payment)
- [ ] Verify webhook status updates
- [ ] Check message logs in database

## Use Cases

### Automatic (Implemented)
1. **Payment Receipts** - Sent automatically when:
   - DVA payment received (dedicatedaccount.credit)
   - Card payment successful (charge.success)

### Manual (Ready to Implement)
2. **Fee Reminders** - Send via termii-send-whatsapp function
3. **Attendance Alerts** - Integrate with check-in system
4. **Report Card Ready** - Send with PDF attachment using template_media
5. **Emergency Broadcasts** - Send to all parents
6. **Transport Delay** - Quick notifications

## Testing Guide

### 1. Balance Check
```bash
curl https://your-project.supabase.co/functions/v1/termii-balance \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 2. Send Template Message
```bash
curl -X POST https://your-project.supabase.co/functions/v1/termii-send-whatsapp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "2348012345678",
    "template_id": "your_template_id",
    "message_type": "template",
    "data": {"1": "John Doe", "2": "5000.00"}
  }'
```

### 3. Send Conversational Message
```bash
curl -X POST https://your-project.supabase.co/functions/v1/termii-send-whatsapp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "2348012345678",
    "message_type": "conversational",
    "message": "Test message from School Guardian 360"
  }'
```

### 4. Verify Database Logs
```sql
-- Check recent messages
SELECT * FROM whatsapp_message_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check delivery rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM whatsapp_message_logs
GROUP BY status;

-- Check unmatched payments
SELECT * FROM unmatched_payments 
WHERE manually_matched = false
ORDER BY created_at DESC;
```

## Cost Monitoring

### Message Logs Analysis
```sql
-- Daily message count and cost estimate
SELECT 
  DATE(created_at) as date,
  COUNT(*) as messages_sent,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(*) * 20 as estimated_cost_ngn -- ₦20 per message average
FROM whatsapp_message_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Troubleshooting

### Common Issues

1. **Messages not sending**
   - Check balance via termii-balance function
   - Verify device status in Termii dashboard
   - Check phone number format (234XXXXXXXXXX)

2. **Status not updating**
   - Verify webhook URL in Termii dashboard
   - Check webhook logs
   - Ensure service role key is set

3. **Template variables not replacing**
   - Verify data keys match template placeholders
   - Use string values: "1": "value"

4. **Unmatched payments**
   - Review unmatched_payments table
   - Manually associate via admin console
   - Check reference format patterns

## Security Considerations

✅ All API keys stored as environment variables
✅ RLS policies enforce access control
✅ Service role used for webhook operations
✅ Phone numbers validated before sending
✅ All messages logged for audit trail
✅ Error messages sanitized (no API keys exposed)
✅ CodeQL security scan passed

## Performance Considerations

- ✅ Database indexes on frequently queried columns
- ✅ Efficient webhook processing (return 200 quickly)
- ✅ Message logging happens after sending (non-blocking)
- ✅ Batch operations available via phonebook API

## Future Enhancements

### Potential Additions
1. **Scheduled Messages** - Add cron jobs for fee reminders
2. **Message Templates UI** - Admin interface for template management
3. **Analytics Dashboard** - Message delivery rates, costs
4. **Parent Preferences** - Opt-in/opt-out management
5. **Multi-language Support** - Templates in different languages
6. **Message Queue** - Rate limiting and retry logic
7. **Rich Media** - More media types (video, location)

### Integration Points
1. **Attendance System** - Auto-send check-in/out alerts
2. **Grade Publishing** - Notify when report cards ready
3. **Fee Management** - Automated reminders and receipts
4. **Event Management** - School event notifications
5. **Emergency System** - Priority alert system

## Documentation References

- **Setup Guide**: TERMII_WHATSAPP_SETUP.md
- **Termii API Docs**: https://developers.termii.com
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp

## Support

For issues or questions:
1. Check TERMII_WHATSAPP_SETUP.md troubleshooting section
2. Review edge function logs in Supabase
3. Check whatsapp_message_logs table for error messages
4. Contact Termii support for API-specific issues

## Version History

- **v1.0** (December 9, 2025)
  - Initial implementation
  - Complete Termii API integration
  - Enhanced Paystack webhook
  - Automatic payment receipts
  - Comprehensive documentation

---

**Implementation Status**: ✅ Complete and Production Ready
**Last Updated**: December 9, 2025
**Maintained By**: School Guardian 360 Development Team
