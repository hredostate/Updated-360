# Class Subjects Manager Implementation

## Overview
The ClassSubjectsManager component allows school administrators to configure which subjects are available for each class level and mark subjects as compulsory. This solves the issue where students couldn't see any subjects in the Student Portal because the `class_subjects` table was empty.

## Problem Solved
**Issue**: Students were seeing "No subjects available for selection" in StudentPortal because the `class_subjects` table had no records linking class levels to subjects.

**Solution**: Created an admin interface (ClassSubjectsManager) to populate and manage the `class_subjects` table.

## Architecture

### Database Schema
```sql
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
    is_compulsory BOOLEAN DEFAULT FALSE,
    UNIQUE(class_id, subject_id)
);
```

### Components

#### 1. ClassSubjectsManager (`src/components/ClassSubjectsManager.tsx`)
Main component that provides the UI for managing class-subject mappings.

**Features**:
- Class selector dropdown to choose a class level (e.g., JSS 1, JSS 2, SS 1)
- Grid view of all subjects in the school
- Checkbox to enable/disable each subject for the selected class
- Toggle button to mark enabled subjects as compulsory
- Visual distinction: 
  - Compulsory subjects: Amber background with lock icon
  - Optional subjects: Blue background with check icon
  - Disabled subjects: Gray background
- Real-time state updates with loading spinners during operations

**Props**:
```typescript
interface ClassSubjectsManagerProps {
    classes: BaseDataObject[];          // All class levels
    subjects: BaseDataObject[];         // All subjects
    classSubjects: ClassSubject[];      // Current class-subject mappings
    onSave: (classId, subjectId, isCompulsory) => Promise<boolean>;
    onDelete: (classId, subjectId) => Promise<boolean>;
}
```

#### 2. Types (`src/types.ts`)
Added `ClassSubject` interface:
```typescript
export interface ClassSubject {
    id: number;
    class_id: number;
    subject_id: number;
    is_compulsory: boolean;
}
```

#### 3. State Management (`src/App.tsx`)
- Added `classSubjects` state variable
- Fetches `class_subjects` table data in background queries (index 13)
- Created handler functions:
  - `handleSaveClassSubject`: Upsert logic (update if exists, insert if new)
  - `handleDeleteClassSubject`: Deletes class-subject mapping

#### 4. Integration (`src/components/SuperAdminConsole.tsx`)
- Added "Class Subjects" subtab under the Structure tab
- Positioned after "Subjects" and before "Classes" tabs
- Accessible to users with `school.console.structure_edit` permission

## Usage

### Admin Workflow
1. Navigate to Super Admin Console → Structure → Class Subjects
2. Select a class level from the dropdown (e.g., "JSS 1")
3. Enable subjects by checking the checkbox next to each subject
4. For required subjects (like Mathematics, English), click "Make Compulsory"
5. Changes are saved automatically to the database

### Student Experience
1. After admin configures class subjects, students can see them in the Student Portal
2. StudentPortal queries `class_subjects` filtered by the student's `class_id`
3. Compulsory subjects are automatically included and cannot be deselected
4. Students can select from available optional subjects

## Data Flow

```
Admin Action → ClassSubjectsManager
    ↓
handleSaveClassSubject / handleDeleteClassSubject
    ↓
Offline.insert / Offline.update / Offline.del
    ↓
class_subjects table (Supabase)
    ↓
Background query fetch (App.tsx)
    ↓
StudentPortal component
    ↓
Student sees available subjects
```

## Key Implementation Details

### Upsert Pattern
The `handleSaveClassSubject` function uses an upsert pattern:
1. Check if a record exists for the class_id + subject_id combination
2. If exists: Update the `is_compulsory` flag
3. If not exists: Insert new record
4. Update local state to reflect changes

This is necessary because class_subjects uses a composite key (class_id, subject_id) rather than a simple ID.

### Compulsory Subjects Behavior
- Marked with amber/yellow styling and lock icon
- Cannot be deselected by students in StudentPortal
- Automatically included in student subject selections
- Examples: Mathematics, English, Basic Science

### Error Handling
- Loading states shown during save/delete operations
- Toast notifications for success/error
- Empty state messages when no classes or subjects exist
- Disabled states prevent rapid clicking during operations

## Testing Checklist
- [ ] Admin can select different class levels
- [ ] Admin can enable subjects for a class
- [ ] Admin can disable subjects for a class
- [ ] Admin can toggle compulsory status
- [ ] Compulsory subjects show amber styling and lock icon
- [ ] Changes persist to database
- [ ] Student Portal shows configured subjects
- [ ] Students can select optional subjects
- [ ] Students cannot deselect compulsory subjects
- [ ] Proper error messages on failures
- [ ] Loading states display correctly

## Related Files
- `/src/components/ClassSubjectsManager.tsx` - Main component
- `/src/components/SuperAdminConsole.tsx` - Integration point
- `/src/components/StudentPortal.tsx` - Consumer of class_subjects data
- `/src/App.tsx` - State management and handlers
- `/src/types.ts` - TypeScript interfaces
- `/src/components/AppRouter.tsx` - Routing and props passing

## Future Enhancements
- Bulk enable/disable all subjects for a class
- Copy subject configuration from one class to another
- Subject prerequisites (e.g., Further Math requires Math)
- Subject credit/unit allocation
- Subject teacher assignment at class level
- Import/export class subject configurations

## Security
- CodeQL scan: 0 alerts
- Follows existing authorization patterns
- Requires `school.console.structure_edit` permission
- Database-level CASCADE deletes maintain referential integrity
