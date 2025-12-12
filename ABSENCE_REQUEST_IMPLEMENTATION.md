# Absence Request System Implementation Summary

## Overview
This implementation adds a comprehensive student absence/time-off request system to the Updated-360 school management application.

## Components Created

### 1. Database Schema (`supabase/migrations/20251211_add_absence_requests.sql`)
- Creates `absence_requests` table with all required fields
- Implements Row Level Security (RLS) policies for students and staff
- Adds indexes for performance optimization
- Includes automatic timestamp updates

### 2. Type Definitions (`src/types.ts`)
```typescript
export type AbsenceRequestType = 'sick' | 'family' | 'appointment' | 'vacation' | 'other';
export type AbsenceRequestStatus = 'pending' | 'approved' | 'denied';
export interface AbsenceRequest { ... }
```

### 3. React Components

#### AbsenceRequestForm (`src/components/AbsenceRequestForm.tsx`)
- Form for submitting new absence requests
- Auto-selects student if user is a student
- Allows selection of request type, date range, reason
- Optional supporting document URL field
- Full validation and error handling

#### AbsenceRequestsList (`src/components/AbsenceRequestsList.tsx`)
- Displays requests in a card-based layout
- Filtering by status (pending/approved/denied)
- Search by student name or reason
- Color-coded status badges
- Click to review/view details

#### AbsenceRequestReview (`src/components/AbsenceRequestReview.tsx`)
- Detailed view of a single request
- Shows student information, request details, dates, duration
- Approve/Deny buttons for authorized users
- Review notes field
- Displays review history if already processed

#### AbsenceRequestsView (`src/components/AbsenceRequestsView.tsx`)
- Main view component that orchestrates all features
- Statistics cards showing pending/approved/denied counts
- Tab-based filtering (All/Pending/Approved/Denied)
- "New Request" button to open submission form
- Integrates all child components

### 4. App Integration

#### Constants (`src/constants.ts`)
- Added `ABSENCE_REQUESTS: 'Absence Requests'` to VIEWS

#### Sidebar (`src/components/Sidebar.tsx`)
- Added to "Student Affairs" section
- Available to all users with `view-dashboard` permission

#### App.tsx
- State management for `absenceRequests`
- Data fetching with joined student/user information
- CRUD functions:
  - `handleCreateAbsenceRequest()` - Submit new request
  - `handleApproveAbsenceRequest()` - Approve request with notes
  - `handleDenyAbsenceRequest()` - Deny request with notes

#### AppRouter (`src/components/AppRouter.tsx`)
- Added route for `VIEWS.ABSENCE_REQUESTS`
- Passes all necessary props to AbsenceRequestsView

## Features

### For Students/Parents
- Submit absence requests with reason and date range
- Track status of submitted requests (pending/approved/denied)
- View request history
- Optional document attachment support

### For Teachers/Admins
- View all pending requests
- Filter and search requests
- Approve or deny with review notes
- See approved absences for the current month
- Dashboard with statistics

## UI/UX Highlights
- Clean, modern glass-morphism design matching app theme
- Mobile-responsive layout
- Color-coded status badges:
  - Yellow for Pending
  - Green for Approved
  - Red for Denied
- Real-time statistics dashboard
- Smooth transitions and hover effects

## Permissions
- All users can view and create requests (`view-dashboard` permission)
- Teachers, Team Leads, Admins, and Principals can review/approve/deny
- Students see their own requests
- Staff see all requests for their school

## Database Security
- Row Level Security (RLS) enabled
- Students can only view/create their own requests
- Staff can view/manage all requests for their school
- Policies ensure data isolation between schools

## Usage

### Creating a Request
1. Navigate to "Student Affairs" → "Absence Requests"
2. Click "New Request" button
3. Fill in student (auto-selected for students), type, dates, reason
4. Optionally add supporting document URL
5. Submit

### Reviewing a Request (Staff Only)
1. Navigate to "Absence Requests"
2. Filter to "Pending" tab
3. Click "Review" on any request
4. Add review notes (required for denial)
5. Click "Approve" or "Deny"

## Next Steps / Future Enhancements
- [ ] Email notifications when request status changes
- [ ] Calendar integration to block out approved absences
- [ ] File upload for supporting documents (currently URL-based)
- [ ] Attendance system integration
- [ ] Bulk approval capabilities
- [ ] Export to CSV/PDF
- [ ] Parent portal integration
- [ ] Recurring absence patterns

## Testing Checklist
- [ ] Student can submit request
- [ ] Teacher can approve request
- [ ] Teacher can deny request
- [ ] Filters work correctly
- [ ] Search functionality works
- [ ] Statistics update properly
- [ ] Mobile responsive design
- [ ] Toast notifications appear
- [ ] RLS policies prevent unauthorized access
