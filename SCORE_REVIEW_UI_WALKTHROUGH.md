# Score Review Feature - UI Walkthrough

## User Interface Overview

This document describes the UI elements and user flows for the Score Review feature.

## 1. Navigation Access

### Location in Sidebar
The "Score Review" menu item appears under the **Academics** section in the sidebar navigation.

**Visibility Rules:**
- ✅ Visible to: Admin, Principal, Team Lead (users with `score_entries.view_all` permission)
- ❌ Hidden from: Teacher, Counselor, and other roles without the permission

**Menu Structure:**
```
📚 Academics
   ├── Timetable
   ├── Lesson Plans
   ├── My Gradebook
   ├── Assessments
   ├── Class Groups
   ├── Curriculum Map
   ├── Workload Analysis
   ├── Result Manager
   ├── 🆕 Score Review  ← NEW ITEM
   └── Coverage Feedback
```

## 2. Score Review Page Layout

### Header Section
```
┌──────────────────────────────────────────────────────────────┐
│  Score Review                                                 │
│  View and edit all teacher-entered scores. All changes       │
│  are logged for accountability.                              │
└──────────────────────────────────────────────────────────────┘
```

### Filter Panel
The filter panel allows users to narrow down the list of scores:

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Filters                                                  │
├─────────────────────────────────────────────────────────────┤
│  [Term Dropdown ▼]  [Class Dropdown ▼]  [Subject ▼] [Teacher ▼] │
│                                                               │
│  [🔍 Search by student name, subject, or teacher...]         │
└─────────────────────────────────────────────────────────────┘
```

**Filter Options:**
1. **Term**: All Terms | 2024/2025 - First Term | 2024/2025 - Second Term | etc.
2. **Class**: All Classes | JSS 1A | JSS 1B | JSS 2A | SS 1 | etc.
3. **Subject**: All Subjects | Mathematics | English | Biology | etc.
4. **Entered By**: All Teachers | Mr. Johnson | Mrs. Smith | etc.

**Search Bar:**
- Real-time search across student names, subjects, and teacher names
- Updates results as you type
- Case-insensitive

### Results Summary
```
Showing 45 score entries
```

### Scores Table

#### Table Structure (View Mode)
```
┌──────────────┬─────────┬─────────────┬──────────────┬───────┬───────┬──────────────┬─────────┐
│ Student      │ Class   │ Subject     │ Scores       │ Total │ Grade │ Entered By   │ Actions │
├──────────────┼─────────┼─────────────┼──────────────┼───────┼───────┼──────────────┼─────────┤
│ Ada Johnson  │ JSS 1A  │ Mathematics │ CA: 30       │ 80    │   B   │ 👤 Mr. Obi  │   ✏️    │
│              │         │             │ Exam: 50     │       │       │              │         │
├──────────────┼─────────┼─────────────┼──────────────┼───────┼───────┼──────────────┼─────────┤
│ Ben Adeyemi  │ JSS 1A  │ Mathematics │ CA: 35       │ 90    │   A   │ 👤 Mr. Obi  │   ✏️    │
│              │         │             │ Exam: 55     │       │       │              │         │
├──────────────┼─────────┼─────────────┼──────────────┼───────┼───────┼──────────────┼─────────┤
│ Clara Eze    │ JSS 1A  │ English     │ CA: 28       │ 73    │   C   │ 👤 Mrs. Ade │   ✏️    │
│              │         │             │ Exam: 45     │       │       │ Modified by: │         │
│              │         │             │              │       │       │ Principal    │         │
└──────────────┴─────────┴─────────────┴──────────────┴───────┴───────┴──────────────┴─────────┘
```

**Column Descriptions:**

1. **Student**: Student's full name
2. **Class**: Academic class (e.g., JSS 1A, SS 2B)
3. **Subject**: Subject name
4. **Scores**: Component breakdown (CA, Exam, etc.) displayed as badges
5. **Total**: Sum of all component scores
6. **Grade**: Letter grade based on grading scheme (A, B, C, etc.)
7. **Entered By**: Teacher who originally entered the score
   - Shows user icon and teacher name
   - If modified by someone else, shows "Modified by: [Name]" in smaller text
8. **Actions**: Edit button (pencil icon) - only visible to users with edit permission

#### Table Structure (Edit Mode)
When edit button is clicked:

```
┌──────────────┬─────────┬─────────────┬──────────────────────┬───────┬───────┬──────────────┬─────────┐
│ Ada Johnson  │ JSS 1A  │ Mathematics │ CA: [30]◄►          │ 80    │   B   │ 👤 Mr. Obi  │   ✓ ✗  │
│              │         │             │ Exam: [50]◄►        │       │       │              │         │
└──────────────┴─────────┴─────────────┴──────────────────────┴───────┴───────┴──────────────┴─────────┘
```

**Edit Mode Features:**
- Component scores become editable input fields
- Total is calculated automatically as you type
- ✓ (checkmark) button to save changes
- ✗ (X) button to cancel and revert changes
- Input validation ensures scores are within valid range

## 3. User Workflows

### Workflow 1: Reviewing Scores
```
1. Team Lead logs in
2. Navigates to Academics → Score Review
3. Selects term: "2024/2025 - First Term"
4. Selects class: "JSS 1A"
5. Reviews all scores entered by teachers
6. Verifies teacher attribution for each entry
```

### Workflow 2: Finding a Specific Student's Score
```
1. Admin opens Score Review page
2. Types student name in search bar: "Ada"
3. Table filters to show only Ada's scores
4. Reviews scores across all subjects
5. Checks which teachers entered each score
```

### Workflow 3: Correcting a Score
```
1. Team Lead finds incorrect score in table
2. Clicks ✏️ (edit) button next to the score
3. Component scores become editable
4. Updates CA from 30 to 32
5. Total automatically updates from 80 to 82
6. Clicks ✓ to save
7. Toast notification: "Score updated successfully"
8. Entry shows "Modified by: Team Lead" under teacher name
9. Change is logged to audit_log table
```

### Workflow 4: Filtering by Teacher
```
1. Principal wants to review a specific teacher's entries
2. Opens Score Review page
3. Selects "Mr. Obi" from "Entered By" dropdown
4. Table shows only scores entered by Mr. Obi
5. Can review consistency and accuracy
6. Can edit if needed
```

## 4. UI States

### Empty State
When no scores match the filters:
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    📊 No scores found                        │
│            No scores found matching your filters.            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Loading State
While data is being fetched or saved:
```
[🔄 Loading...] Spinner displayed
```

### Permission Denied
If user without permission tries to access:
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Access Denied                                           │
│                                                              │
│  You do not have permission to view this page.              │
│  Contact your administrator.                                │
└─────────────────────────────────────────────────────────────┘
```

## 5. Responsive Behavior

### Desktop View (> 1024px)
- Full table with all columns visible
- Filters in a single row
- Comfortable spacing for easy reading

### Tablet View (768px - 1024px)
- Table with horizontal scroll if needed
- Filters stack in 2x2 grid
- Maintains all functionality

### Mobile View (< 768px)
- Card-based layout instead of table
- Each score as a separate card
- Filters stack vertically
- Edit mode in overlay/modal

## 6. Visual Design Elements

### Color Coding
- **Grade Badges**: 
  - A: Blue background
  - B: Green background
  - C: Yellow background
  - D/E/F: Red background

- **Component Score Badges**: Light gray background
- **User Icon**: Gray/neutral color
- **Edit Button**: Blue (hover: darker blue)
- **Save Button**: Green
- **Cancel Button**: Red

### Dark Mode Support
All elements adapt to dark mode:
- Background: Dark slate
- Text: Light colors with proper contrast
- Borders: Lighter in dark mode
- Maintains readability in all lighting conditions

## 7. Toast Notifications

Success messages:
```
✅ Score updated successfully
```

Error messages:
```
❌ Failed to update score: [error message]
```

Info messages:
```
ℹ️ Changes saved. Audit log created.
```

## 8. Accessibility Features

- ✅ Keyboard navigation support
- ✅ ARIA labels on all interactive elements
- ✅ High contrast in both light and dark modes
- ✅ Screen reader friendly
- ✅ Focus indicators on all inputs
- ✅ Semantic HTML structure

## 9. Performance Considerations

- Client-side filtering for instant results
- Efficient re-rendering with React optimization
- Lazy loading of data when needed
- Debounced search input
- Minimal API calls through smart caching

## Summary

The Score Review UI provides an intuitive, powerful interface for Team Leaders and Admins to:
- View all scores with clear teacher attribution
- Filter and search efficiently
- Edit scores when necessary
- Maintain accountability through visible audit trails

The interface balances power with simplicity, ensuring users can accomplish their tasks quickly while maintaining data integrity.
