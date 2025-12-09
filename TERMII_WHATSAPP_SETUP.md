# Termii WhatsApp Integration Setup Guide

This guide will help you set up and configure Termii WhatsApp messaging for School Guardian 360.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting Termii Credentials](#getting-termii-credentials)
4. [Setting Up WhatsApp Device](#setting-up-whatsapp-device)
5. [Creating WhatsApp Templates](#creating-whatsapp-templates)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [Webhook Configuration](#webhook-configuration)
9. [Testing Guide](#testing-guide)
10. [Use Cases](#use-cases)
11. [Troubleshooting](#troubleshooting)

## Overview

The Termii WhatsApp integration replaces SMS messaging with WhatsApp for improved delivery rates and better user engagement. The system supports:

- **Template Messages**: Pre-approved message templates for transactional notifications
- **Template Messages with Media**: Templates that include PDFs, images, or documents
- **Conversational Messages**: Free-form messages for general communication
- **Delivery Tracking**: Real-time status updates via webhooks
- **Balance Monitoring**: Check your Termii account balance

## Prerequisites

- Active Termii account
- WhatsApp Business API access through Termii
- Valid business documentation for WhatsApp approval
- Supabase project with edge functions enabled
- Admin access to School Guardian 360

## Getting Termii Credentials

### Step 1: Create Termii Account

1. Visit [https://termii.com](https://termii.com)
2. Click "Sign Up" and complete the registration
3. Verify your email address
4. Complete KYC verification with business documents

### Step 2: Get API Key

1. Log in to your Termii dashboard
2. Navigate to **Settings** → **API Settings**
3. Copy your **API Key**
4. Store it securely - you'll need it for configuration

### Step 3: Fund Your Account

1. Go to **Wallet** → **Fund Wallet**
2. Choose payment method (Card, Bank Transfer, etc.)
3. Add sufficient funds for WhatsApp messaging
4. WhatsApp messages typically cost ₦15-25 per message

## Setting Up WhatsApp Device

### Step 1: Request WhatsApp Access

1. In Termii dashboard, go to **WhatsApp** → **Get Started**
2. Fill out the WhatsApp Business application form:
   - Business name
   - Business category
   - Business description
   - Contact information
3. Submit business verification documents
4. Wait for Termii and WhatsApp approval (1-3 business days)

### Step 2: Get Device ID

Once approved:

1. Go to **WhatsApp** → **Devices**
2. Click **Add Device**
3. Follow the QR code scanning process with WhatsApp Business app
4. Copy the **Device ID** once connected
5. Store the Device ID - required for sending messages

### Step 3: Verify Device Status

1. Check device status in **WhatsApp** → **Devices**
2. Ensure status is "Active" and "Connected"
3. Test with a sample message from Termii dashboard

## Creating WhatsApp Templates

WhatsApp requires pre-approved templates for transactional messages.

### Template Structure

Templates have the following components:
- **Template Name**: Unique identifier (e.g., `payment_receipt`)
- **Category**: Transaction, Marketing, or OTP
- **Language**: English (en)
- **Content**: Message text with placeholders using `{{1}}`, `{{2}}`, etc.
- **Header**: Optional (text, image, document, video)
- **Footer**: Optional static text
- **Buttons**: Optional (Call-to-action, Quick reply)

### Creating a Payment Receipt Template

1. Go to **WhatsApp** → **Message Templates** → **Create Template**
2. Fill in details:
   ```
   Name: payment_receipt
   Category: Transaction
   Language: English
   
   Header: Payment Received
   
   Body:
   Dear Parent,
   
   Payment Receipt Confirmation
   
   Student: {{1}}
   Amount Paid: ₦{{2}}
   Payment Method: {{3}}
   Reference: {{4}}
   Date: {{5}}
   Total Paid: ₦{{6}}
   Remaining Balance: ₦{{7}}
   
   Thank you for your payment.
   
   Footer: School Guardian 360
   ```
3. Submit for approval
4. Wait for WhatsApp approval (24-48 hours)
5. Once approved, copy the **Template ID**

### Recommended Templates

Create these templates for common use cases:

#### 1. Payment Receipt (`payment_receipt`)
```
Dear Parent,

Payment Receipt Confirmation

Student: {{1}}
Amount Paid: ₦{{2}}
Payment Method: {{3}}
Reference: {{4}}
Date: {{5}}
Total Paid: ₦{{6}}
Remaining Balance: ₦{{7}}

Thank you for your payment.
```

#### 2. Fee Reminder (`fee_reminder`)
```
Dear Parent,

Fee Payment Reminder

Student: {{1}}
Class: {{2}}
Amount Due: ₦{{3}}
Due Date: {{4}}

Please make payment to avoid late fees.

Pay via bank transfer to your student's dedicated account or online at {{5}}
```

#### 3. Attendance Alert (`attendance_alert`)
```
Dear Parent,

Attendance Update

Student: {{1}}
Status: {{2}}
Time: {{3}}
Date: {{4}}

Location: {{5}}
```

#### 4. Report Card Ready (`report_card_ready`)
```
Dear Parent,

Your child's report card is now available.

Student: {{1}}
Term: {{2}}
Session: {{3}}

Download your report at: {{4}}

Or collect a physical copy from school.
```

## Environment Variables

Add these environment variables to your Supabase Edge Functions:

### Required Variables

```bash
TERMII_API_KEY=your_termii_api_key_here
TERMII_DEVICE_ID=your_whatsapp_device_id_here
TERMII_BASE_URL=https://api.ng.termii.com
```

### Setting Variables in Supabase

1. Go to Supabase Dashboard → **Settings** → **Edge Functions**
2. Add each environment variable:
   - Click **Add Secret**
   - Name: `TERMII_API_KEY`
   - Value: Your API key
   - Click **Save**
3. Repeat for `TERMII_DEVICE_ID` and `TERMII_BASE_URL`

### Verifying Variables

Deploy the `termii-balance` function and test:

```bash
supabase functions deploy termii-balance
```

Test it:
```bash
curl -X GET https://your-project.supabase.co/functions/v1/termii-balance \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

Expected response:
```json
{
  "success": true,
  "balance": 1000.50,
  "currency": "NGN",
  "user": "your_email@example.com"
}
```

## Database Setup

### Run Migration

The database migration creates two tables:

1. **termii_settings**: Stores Termii configuration per school
2. **whatsapp_message_logs**: Logs all WhatsApp messages

Apply the migration:

```bash
cd supabase
psql -h your-db-host -U postgres -d postgres -f migrations/20251209_add_termii_tables.sql
```

Or via Supabase Dashboard:
1. Go to **SQL Editor**
2. Open `migrations/20251209_add_termii_tables.sql`
3. Click **Run**

### Configure School Settings

Insert Termii settings for your school:

```sql
INSERT INTO termii_settings (school_id, api_key, device_id, is_active)
VALUES (1, 'your_termii_api_key', 'your_device_id', true);
```

## Webhook Configuration

Configure Termii to send delivery status updates.

### Step 1: Get Webhook URL

Your webhook URL is:
```
https://your-project.supabase.co/functions/v1/termii-webhook
```

### Step 2: Configure in Termii

1. Log in to Termii dashboard
2. Go to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Fill in:
   - URL: Your Supabase function URL
   - Events: Select all WhatsApp events
     - Message Sent
     - Message Delivered
     - Message Read
     - Message Failed
5. Save webhook configuration

### Step 3: Test Webhook

Send a test message and verify webhook logs:

```sql
SELECT * FROM whatsapp_message_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

Check for status updates from `sent` → `delivered`.

## Testing Guide

### 1. Test Balance Check

```bash
curl -X GET https://your-project.supabase.co/functions/v1/termii-balance \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 2. Test Sending Template Message

```bash
curl -X POST https://your-project.supabase.co/functions/v1/termii-send-whatsapp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "2348012345678",
    "template_id": "your_template_id",
    "message_type": "template",
    "data": {
      "1": "John Doe",
      "2": "5,000.00",
      "3": "Bank Transfer",
      "4": "REF123456",
      "5": "9th December 2025",
      "6": "5,000.00",
      "7": "0.00"
    }
  }'
```

### 3. Test Conversational Message

```bash
curl -X POST https://your-project.supabase.co/functions/v1/termii-send-whatsapp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "2348012345678",
    "message_type": "conversational",
    "message": "Hello! This is a test message from School Guardian 360.",
    "from": "SchoolGuardian"
  }'
```

### 4. Test Payment Receipt (Automatic)

Trigger a test payment via Paystack:
1. Make a test payment to a DVA or via card
2. Webhook automatically triggers
3. Check logs:

```sql
SELECT 
  wml.*,
  s.name as student_name
FROM whatsapp_message_logs wml
LEFT JOIN students s ON s.parent_phone_number_1 = wml.recipient_phone
WHERE message_type = 'conversational'
  AND message_content->>'reference' IS NOT NULL
ORDER BY created_at DESC;
```

## Use Cases

### 1. Payment Receipts (Automatic)

Automatically sent when:
- DVA payment received (`dedicatedaccount.credit`)
- Card payment successful (`charge.success`)

Template variables:
- Student name
- Amount paid
- Payment method
- Reference number
- Payment date
- Total paid to date
- Remaining balance

### 2. Fee Reminders (Manual/Scheduled)

Send fee reminders to parents:

```javascript
// Via frontend code
await supabase.functions.invoke('termii-send-whatsapp', {
  body: {
    phone_number: parent.phone,
    template_id: 'fee_reminder',
    message_type: 'template',
    data: {
      '1': student.name,
      '2': student.class_name,
      '3': amountDue.toFixed(2),
      '4': dueDate,
      '5': paymentLink
    }
  }
});
```

### 3. Attendance Alerts (Real-time)

Send when student checks in/out:

```javascript
await supabase.functions.invoke('termii-send-whatsapp', {
  body: {
    phone_number: parent.phone,
    template_id: 'attendance_alert',
    message_type: 'template',
    data: {
      '1': student.name,
      '2': status, // "Checked In" or "Checked Out"
      '3': time,
      '4': date,
      '5': location
    }
  }
});
```

### 4. Report Cards with PDF (Media)

Send report card with PDF attachment:

```javascript
await supabase.functions.invoke('termii-send-whatsapp', {
  body: {
    phone_number: parent.phone,
    template_id: 'report_card_ready',
    message_type: 'template_media',
    data: {
      '1': student.name,
      '2': term,
      '3': session,
      '4': downloadLink
    },
    media: {
      url: pdfUrl, // Publicly accessible PDF URL
      caption: `${student.name} - ${term} Report Card`
    }
  }
});
```

### 5. Emergency Broadcasts

Send urgent alerts to all parents:

```javascript
// Get all parents
const { data: students } = await supabase
  .from('students')
  .select('parent_phone_number_1')
  .not('parent_phone_number_1', 'is', null);

// Send to each parent
for (const student of students) {
  await supabase.functions.invoke('termii-send-whatsapp', {
    body: {
      phone_number: student.parent_phone_number_1,
      message_type: 'conversational',
      message: 'URGENT: School will close early today at 12 PM due to unforeseen circumstances. Please arrange for student pickup.',
      from: 'SchoolGuardian'
    }
  });
}
```

## Troubleshooting

### Message Not Sending

**Check 1: Balance**
```bash
curl -X GET https://your-project.functions.supabase.co/termii-balance
```
Ensure sufficient balance.

**Check 2: Device Status**
- Log in to Termii dashboard
- Go to WhatsApp → Devices
- Ensure device is "Active" and "Connected"

**Check 3: Phone Number Format**
- Must include country code (e.g., 2348012345678)
- No spaces, dashes, or special characters
- Nigerian format: 234 + 10 digits

**Check 4: Template Status**
- Ensure template is approved by WhatsApp
- Check template ID is correct
- Verify variable count matches

### Messages Stuck in "Sent" Status

**Issue**: Webhook not updating delivery status

**Solution**:
1. Verify webhook URL in Termii dashboard
2. Check webhook is receiving events:
   ```sql
   SELECT * FROM whatsapp_message_logs 
   WHERE updated_at > created_at
   ORDER BY created_at DESC;
   ```
3. Test webhook manually with Termii's test feature

### Template Variables Not Replacing

**Issue**: Message shows {{1}}, {{2}} instead of values

**Solution**:
- Check `data` object keys match template placeholders
- Use string values: `"1": "value"` not `1: "value"`
- Ensure all required variables are provided

### RLS Policy Errors

**Issue**: Can't insert/update logs

**Solution**:
- Edge functions use service role key (bypass RLS)
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify service role key in Supabase dashboard

### High Costs

**Monitor Usage**:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as messages_sent,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM whatsapp_message_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Cost Optimization**:
- Use templates instead of conversational messages (cheaper)
- Batch messages during off-peak hours
- Implement rate limiting for non-critical messages
- Remove duplicate phone numbers before sending

## Support and Resources

- **Termii Documentation**: [https://developers.termii.com](https://developers.termii.com)
- **WhatsApp Business API**: [https://developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **Supabase Edge Functions**: [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **School Guardian 360 Support**: Contact your system administrator

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Rotate API keys** periodically (every 90 days)
4. **Monitor logs** for suspicious activity
5. **Implement rate limiting** to prevent abuse
6. **Validate phone numbers** before sending
7. **Use HTTPS** for all webhook endpoints
8. **Audit message logs** regularly

## Next Steps

After completing setup:

1. ✅ Test balance check and message sending
2. ✅ Create essential WhatsApp templates
3. ✅ Configure webhook for delivery tracking
4. ✅ Train staff on WhatsApp messaging features
5. ✅ Monitor costs and usage patterns
6. ✅ Set up automated fee reminders
7. ✅ Enable payment receipt notifications

---

**Document Version**: 1.0  
**Last Updated**: December 9, 2025  
**Maintained By**: School Guardian 360 Development Team
