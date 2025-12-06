# Dedicated Virtual Accounts (DVA) Feature - User Guide

## Overview
The DVA feature integrates with Paystack to create unique bank account numbers for each student, making it easier to track and reconcile school fee payments automatically.

## For School Administrators

### Setting Up Paystack API

1. **Get Your Paystack API Keys**
   - Log in to your [Paystack Dashboard](https://dashboard.paystack.com/)
   - Navigate to **Settings → API Keys & Webhooks**
   - Copy your **Secret Key** (starts with `sk_test_` for test mode or `sk_live_` for production)

2. **Configure in School Guardian**
   - Go to **Settings → Payment Gateway** tab
   - Select the campus (or leave as "All Campuses" for default)
   - Paste your Paystack Secret Key
   - (Optional) Add your Public Key
   - Choose environment: **Test** or **Live**
   - Check **Enable this configuration**
   - Click **Save**

### Creating Virtual Accounts for Students

1. **Navigate to Student Finance**
   - Go to **Student Finance → Virtual Accounts** tab

2. **Create DVA**
   - Select a student from the dropdown (only students without DVA will show)
   - Choose a preferred bank (e.g., Wema Bank)
   - Click **Create DVA**
   - The system will:
     - Create a Paystack customer for the student
     - Generate a unique account number
     - Save the details to the database

3. **View and Manage DVAs**
   - All created virtual accounts are listed below
   - Each shows:
     - Student name and admission number
     - Bank name
     - Account number
     - Account name
     - Status (Active/Inactive)
   - Use the **Search** box to find specific students
   - Click **Deactivate** to disable an account

### Important Notes
- Each student can only have ONE active virtual account
- Payments to these accounts are automatically tracked by Paystack
- Use **Test mode** for testing before going live
- Keep your Secret Key secure - never share it publicly

## For Students

### Viewing Your Payment Wallet

1. **Access Student Portal**
   - Log in to your student account
   - Click on **My Wallet** tab

2. **Your Virtual Account Details**
   - You'll see a card displaying:
     - Your unique account number
     - Bank name
     - Account name
     - Status

3. **Making Payments**
   - Transfer your school fees to the displayed account number
   - Use any bank transfer method (mobile banking, ATM, branch)
   - Payments are automatically recorded

### Payment Instructions
- **Account Number**: The unique number shown on your wallet
- **Bank**: The bank name displayed
- **Amount**: Your school fees amount (check with school accountant)
- **Reference**: Include your admission number if prompted

## API Configuration Per Campus

If your school has multiple campuses, you can configure different Paystack accounts for each:

1. In **Settings → Payment Gateway**
2. Add separate configurations for each campus
3. Students will automatically use their campus's configuration

## Troubleshooting

### "Payment Gateway Not Configured" Error
- **Solution**: Admin needs to set up Paystack API keys in Settings → Payment Gateway

### "Student already has a virtual account" Error
- **Solution**: Check the Virtual Accounts list - the student may already have an account

### "Failed to fetch bank providers" Error
- **Solution**: 
  - Verify your Secret Key is correct
  - Check your internet connection
  - Ensure you're using a valid Paystack account

### Student can't see their wallet
- **Solution**: 
  - Admin must create a DVA for the student first
  - Student must log out and log back in to see updates

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use Test mode during development**
3. **Rotate API keys periodically**
4. **Only give Payment Gateway access to trusted staff** (Admin and Accountant roles)
5. **Monitor the Paystack dashboard** for suspicious activity

## Support

For issues with:
- **Paystack API**: Contact Paystack support at support@paystack.com
- **School Guardian DVA**: Contact your system administrator

## Technical Details

### Database Tables
- `paystack_api_settings`: Stores API credentials per campus
- `dedicated_virtual_accounts`: Stores DVA details per student

### Permissions
- **Admin and Accountant**: Can view and manage API settings
- **All Staff**: Can view and create DVAs for students
- **Students**: Can view their own DVA only

### Supported Banks
The list of available banks is fetched directly from Paystack based on your account location (Nigeria or Ghana).
