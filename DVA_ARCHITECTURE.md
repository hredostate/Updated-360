# DVA Feature Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SCHOOL GUARDIAN 360                              │
│                     DVA (Dedicated Virtual Accounts)                     │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACES                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐         │
│  │   ADMIN/STAFF   │  │   ACCOUNTANT    │  │     STUDENTS      │         │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘         │
│          │                     │                      │                    │
│          │                     │                      │                    │
│          ▼                     ▼                      ▼                    │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    SETTINGS VIEW                              │        │
│  │  ┌────────────────────────────────────────────────┐          │        │
│  │  │      Payment Gateway Tab (NEW)                 │          │        │
│  │  │  - Configure Paystack API keys per campus      │          │        │
│  │  │  - Set test/live environment                   │          │        │
│  │  │  - Enable/disable configurations               │          │        │
│  │  └────────────────────────────────────────────────┘          │        │
│  └──────────────────────────────────────────────────────────────┘        │
│          │                     │                                           │
│          ▼                     ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │              STUDENT FINANCE VIEW                             │        │
│  │  ┌────────────────────────────────────────────────┐          │        │
│  │  │      Virtual Accounts Tab (NEW)                │          │        │
│  │  │  - Create DVA for students                     │          │        │
│  │  │  - View all DVAs                               │          │        │
│  │  │  - Search & filter DVAs                        │          │        │
│  │  │  - Deactivate DVAs                             │          │        │
│  │  │  - Statistics dashboard                        │          │        │
│  │  └────────────────────────────────────────────────┘          │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                            │               │
│                                                            ▼               │
│                              ┌──────────────────────────────────┐        │
│                              │     STUDENT PORTAL               │        │
│                              │  ┌──────────────────────┐        │        │
│                              │  │  My Wallet Tab (NEW) │        │        │
│                              │  │  - View DVA details  │        │        │
│                              │  │  - Account number    │        │        │
│                              │  │  - Bank name         │        │        │
│                              │  │  - Payment info      │        │        │
│                              │  └──────────────────────┘        │        │
│                              └──────────────────────────────────┘        │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        REACT COMPONENTS (NEW)                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ PaymentGateway       │  │   DVAManager     │  │ StudentWallet    │   │
│  │ Settings.tsx         │  │   .tsx           │  │ Widget.tsx       │   │
│  │                      │  │                  │  │                  │   │
│  │ - API key config     │  │ - Create DVA     │  │ - Display DVA    │   │
│  │ - Campus selection   │  │ - List DVAs      │  │ - Show account   │   │
│  │ - Environment toggle │  │ - Search DVAs    │  │ - Payment info   │   │
│  └──────────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                      │                                     │
└──────────────────────────────────────┼─────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER (NEW)                                  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │               paystackService.ts                                  │    │
│  │                                                                    │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  Functions:                                                 │  │    │
│  │  │  • fetchBankProviders(secretKey)                           │  │    │
│  │  │  • createOrGetPaystackCustomer(secretKey, student)         │  │    │
│  │  │  • createDedicatedVirtualAccount(secretKey, customer, bank)│  │    │
│  │  │  • fetchDedicatedVirtualAccount(secretKey, accountId)      │  │    │
│  │  │  • listDedicatedVirtualAccounts(secretKey, params)         │  │    │
│  │  │  • deactivateDedicatedVirtualAccount(secretKey, accountId) │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                      │                                     │
└──────────────────────────────────────┼─────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL API                                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                   PAYSTACK API                                    │    │
│  │              https://api.paystack.co                              │    │
│  │                                                                    │    │
│  │  Endpoints Used:                                                  │    │
│  │  • GET  /dedicated_account/available_providers                   │    │
│  │  • POST /customer                                                 │    │
│  │  • GET  /customer/:email                                          │    │
│  │  • POST /dedicated_account                                        │    │
│  │  • GET  /dedicated_account/:id                                    │    │
│  │  • GET  /dedicated_account?params                                 │    │
│  │  • DEL  /dedicated_account/:id                                    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (SUPABASE)                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │              paystack_api_settings (NEW)                          │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  Columns:                                                   │  │    │
│  │  │  • id, school_id, campus_id                                │  │    │
│  │  │  • secret_key (encrypted), public_key                      │  │    │
│  │  │  • environment ('test' | 'live')                           │  │    │
│  │  │  • enabled, created_at, updated_at                         │  │    │
│  │  │                                                             │  │    │
│  │  │  RLS: Only Admin & Accountant can access                   │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │         dedicated_virtual_accounts (NEW)                          │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  Columns:                                                   │  │    │
│  │  │  • id, school_id, student_id (FK → students)               │  │    │
│  │  │  • account_number, account_name                            │  │    │
│  │  │  • bank_name, bank_slug, bank_id                           │  │    │
│  │  │  • currency, active, assigned                              │  │    │
│  │  │  • paystack_account_id, paystack_customer_id              │  │    │
│  │  │  • created_at, updated_at                                   │  │    │
│  │  │                                                             │  │    │
│  │  │  RLS: Students can view own, Staff can manage all          │  │    │
│  │  │  UNIQUE: (student_id) - One DVA per student                │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                      students (EXISTING)                          │    │
│  │  • Linked via student_id FK                                       │    │
│  │  • One-to-one relationship with DVA                               │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘


DATA FLOW - CREATE DVA:
═══════════════════════

1. Admin configures Paystack API key in Settings → Payment Gateway
2. Staff navigates to Student Finance → Virtual Accounts
3. Staff selects student (without existing DVA) and preferred bank
4. DVAManager calls paystackService.createOrGetPaystackCustomer()
   → Creates/retrieves Paystack customer for student
5. DVAManager calls paystackService.createDedicatedVirtualAccount()
   → Paystack generates unique account number
6. DVAManager saves DVA details to dedicated_virtual_accounts table
7. Student can now view their account in Student Portal → My Wallet


DATA FLOW - STUDENT VIEWS WALLET:
══════════════════════════════════

1. Student logs into Student Portal
2. Student clicks "My Wallet" tab
3. StudentWalletWidget queries dedicated_virtual_accounts table
   → Filtered by student's student_record_id (RLS enforces security)
4. Widget displays account number, bank, and payment instructions
5. Student transfers fees to the displayed account number
6. Paystack tracks payment automatically


SECURITY LAYERS:
════════════════

┌─────────────────────────────────────────────────────────────┐
│  RLS (Row Level Security) Policies                          │
│  ────────────────────────────────────────────────────────── │
│  • paystack_api_settings: Admin & Accountant only           │
│  • dedicated_virtual_accounts: Students see own, Staff all  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Authentication (Supabase Auth)                              │
│  ────────────────────────────────────────────────────────── │
│  • JWT tokens                                                │
│  • Session management                                        │
│  • auth.uid() in RLS policies                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  API Key Security                                            │
│  ────────────────────────────────────────────────────────── │
│  • Stored encrypted in database                              │
│  • Never exposed to frontend                                 │
│  • Test/Live environment separation                          │
└─────────────────────────────────────────────────────────────┘


CAMPUS CONFIGURATION:
═══════════════════

School with Multiple Campuses:
  School ID: 1
    ├─ Campus A (campus_id: 1) → API Key A (test/live)
    ├─ Campus B (campus_id: 2) → API Key B (test/live)
    └─ Default (campus_id: null) → API Key Default (test/live)

Students automatically use their campus's API configuration when creating DVA.
If no campus-specific config exists, falls back to default configuration.
```
