# Absence Request System - Quick Start Guide

## What Was Implemented

A complete student absence/time-off request system with:
- ✅ Database schema with RLS security
- ✅ 4 React components (Form, List, Review, Main View)
- ✅ Full CRUD operations in App.tsx
- ✅ Sidebar navigation integration
- ✅ Mobile-responsive UI
- ✅ Permission-based access control

## How to Use

### For Database Setup
1. The migration file is at: `supabase/migrations/20251211_add_absence_requests.sql`
2. Apply it to your Supabase database
3. The table will be created with proper RLS policies

### For Students
1. Click on "Student Affairs" → "Absence Requests" in sidebar
2. Click "New Request" button
3. Fill in:
   - Request Type (Sick, Family Emergency, Medical Appointment, Vacation, Other)
   - Start Date and End Date
   - Reason (required)
   - Supporting Document URL (optional)
4. Click "Submit Request"
5. Track status on the main page

### For Teachers/Admins
1. Navigate to "Student Affairs" → "Absence Requests"
2. View dashboard with statistics:
   - Pending requests count
   - Total approved
   - Total denied
   - Approved this month
3. Use tabs to filter: All / Pending / Approved / Denied
4. Click "Review" on any request to:
   - View full details
   - Approve with optional notes
   - Deny with required notes

## Key Features

### Filtering & Search
- Filter by status (pending/approved/denied)
- Search by student name or reason text
- View counts update in real-time

### Request Information
- Student name and details
- Request type and date range
- Duration calculation
- Reason for absence
- Supporting documents (if provided)
- Review history (who approved/denied and when)

### Color-Coded Status
- 🟡 Yellow: Pending review
- 🟢 Green: Approved
- 🔴 Red: Denied

## Permissions

| User Type | Can View | Can Create | Can Review |
|-----------|----------|------------|------------|
| Student | Own requests | Own requests | No |
| Parent | (Future) | (Future) | No |
| Teacher | All school requests | Yes | Yes |
| Team Lead | All school requests | Yes | Yes |
| Admin | All school requests | Yes | Yes |
| Principal | All school requests | Yes | Yes |

## Data Flow

```
1. Student submits request
   ↓
2. Stored in absence_requests table
   ↓
3. Status: "pending"
   ↓
4. Teacher/Admin reviews
   ↓
5. Status: "approved" or "denied"
   ↓
6. Student sees updated status
```

## Database Schema

```sql
absence_requests
├── id (serial)
├── school_id (references schools)
├── student_id (references students)
├── requested_by (references user_profiles - UUID)
├── request_type (varchar: sick|family|appointment|vacation|other)
├── start_date (date)
├── end_date (date)
├── reason (text)
├── supporting_document_url (text, optional)
├── status (varchar: pending|approved|denied)
├── reviewed_by (references user_profiles, optional)
├── reviewed_at (timestamp, optional)
├── review_notes (text, optional)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## Security

- Row Level Security (RLS) enabled
- Students can only see/create their own requests
- Staff can see all requests for their school
- Cross-school data isolation enforced
- Automatic user association on creation

## Component Structure

```
AbsenceRequestsView (Main Container)
├── Statistics Cards (Pending, Approved, Denied, This Month)
├── Tab Filters (All, Pending, Approved, Denied)
└── AbsenceRequestsList
    ├── Search & Filter Controls
    └── Request Cards
        └── Click → AbsenceRequestReview (Modal)
            ├── Request Details
            ├── Student Information
            └── Approve/Deny Actions (if authorized)

New Request Button → AbsenceRequestForm (Modal)
├── Student Selection (if admin/teacher)
├── Request Type Dropdown
├── Date Range Picker
├── Reason Text Area
└── Supporting Document URL Input
```

## Files Modified

1. **Database**
   - `supabase/migrations/20251211_add_absence_requests.sql` (NEW)

2. **Types**
   - `src/types.ts` (Added AbsenceRequest types)

3. **Constants**
   - `src/constants.ts` (Added ABSENCE_REQUESTS view)

4. **Components**
   - `src/components/AbsenceRequestForm.tsx` (NEW)
   - `src/components/AbsenceRequestsList.tsx` (NEW)
   - `src/components/AbsenceRequestReview.tsx` (NEW)
   - `src/components/AbsenceRequestsView.tsx` (NEW)
   - `src/components/Sidebar.tsx` (Added navigation item)
   - `src/components/AppRouter.tsx` (Added route)

5. **State Management**
   - `src/App.tsx` (Added state, handlers, data fetching)

## Testing Checklist

Before deploying to production:

- [ ] Apply database migration
- [ ] Verify RLS policies work (students can't see others' requests)
- [ ] Test student submission flow
- [ ] Test teacher approval flow
- [ ] Test teacher denial flow
- [ ] Verify filters work (All/Pending/Approved/Denied)
- [ ] Test search functionality
- [ ] Check mobile responsiveness
- [ ] Verify toast notifications appear
- [ ] Test with multiple students
- [ ] Test with no requests (empty state)

## Future Enhancements

Possible additions for v2:
- Email/SMS notifications on status change
- File upload for supporting documents
- Calendar integration
- Attendance system integration
- Bulk approval
- Export to CSV/PDF
- Parent portal access
- Recurring absence patterns
- Absence quota tracking

## Support

For issues or questions:
1. Check the implementation docs: `ABSENCE_REQUEST_IMPLEMENTATION.md`
2. Review component code for inline comments
3. Check database RLS policies if access issues occur
4. Verify user permissions in `src/constants.ts`
