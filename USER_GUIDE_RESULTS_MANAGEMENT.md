# Comprehensive User Guide: Assessment Templates to Publishing Results

This guide walks you through the complete workflow from creating assessment templates to publishing student results in SchoolGuardian360.

---

## Table of Contents

1. [Overview](#overview)
2. [Step 1: Create Grading Scheme](#step-1-create-grading-scheme)
3. [Step 2: Create Assessment Structure (Report Card Template)](#step-2-create-assessment-structure-report-card-template)
4. [Step 3: Set Up Academic Terms](#step-3-set-up-academic-terms)
5. [Step 4: Create Academic Classes](#step-4-create-academic-classes)
6. [Step 5: Assign Teachers to Classes (Teaching Assignments)](#step-5-assign-teachers-to-classes-teaching-assignments)
7. [Step 6: Enter Student Scores](#step-6-enter-student-scores)
8. [Step 7: Review and Lock Scores](#step-7-review-and-lock-scores)
9. [Step 8: Publish Results](#step-8-publish-results)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The results management system follows this workflow:

```
Grading Scheme → Assessment Structure → Terms → Academic Classes → Teaching Assignments → Score Entry → Lock Scores → Publish Results
```

**User Roles:**
- **Super Admin/Principal**: Can set up grading schemes, assessment structures, terms, and academic classes
- **Team Lead/Admin**: Can create teaching assignments and manage class results
- **Teacher**: Can enter scores for their assigned classes and subjects

---

## Step 1: Create Grading Scheme

The grading scheme defines how scores are converted to grades (e.g., 70-100 = A, 60-69 = B).

### Navigation
1. Go to **Super Admin Console** (only visible to Super Admins/Principals)
2. Click **"Academic Configuration"**
3. Select **"Grading Schemes"** tab

### Creating a New Grading Scheme

1. Click **"Create Grading Scheme"**
2. Enter a **Name** (e.g., "Standard Grading 2024")
3. Add grade rules:
   - **Grade**: Letter grade (e.g., "A")
   - **Min Score**: Minimum percentage for this grade (e.g., 70)
   - **Max Score**: Maximum percentage for this grade (e.g., 100)
   - **Description**: Optional description (e.g., "Excellent")
   - **Points**: Grade points for GPA calculation (e.g., 4.0)

4. Click **"Add Rule"** for each grade level
5. Click **"Save"**

### Example Grading Scheme

| Grade | Min Score | Max Score | Description | Points |
|-------|-----------|-----------|-------------|--------|
| A     | 70        | 100       | Excellent   | 4.0    |
| B     | 60        | 69        | Very Good   | 3.0    |
| C     | 50        | 59        | Good        | 2.0    |
| D     | 40        | 49        | Pass        | 1.0    |
| F     | 0         | 39        | Fail        | 0.0    |

### Setting Active Grading Scheme

1. In the grading schemes list, find the scheme you want to use
2. Click **"Set as Active"**
3. This scheme will now be used for all grade calculations

---

## Step 2: Create Assessment Structure (Report Card Template)

The assessment structure defines what columns appear on report cards (e.g., CA1, CA2, Exam).

### Navigation
1. Go to **Super Admin Console**
2. Click **"Academic Configuration"**
3. Select **"Assessment Structures"** tab

### Creating an Assessment Structure

1. Click **"Create Structure"**
2. Enter a **Name** (e.g., "Term Assessment Structure")
3. Add assessment components:

   **Example Components:**
   | Component Name | Weight (%) | Max Score | Type |
   |----------------|------------|-----------|------|
   | CA 1           | 10         | 100       | CA   |
   | CA 2           | 10         | 100       | CA   |
   | CA 3           | 10         | 100       | CA   |
   | Exam           | 70         | 100       | Exam |

4. Ensure weights add up to 100%
5. Click **"Save"**

### Component Types
- **CA** (Continuous Assessment): Tests, quizzes, assignments
- **Exam**: End of term examination
- **Project**: Project work
- **Practical**: Practical assessments

---

## Step 3: Set Up Academic Terms

Terms define the academic periods (e.g., First Term, Second Term).

### Navigation
1. Go to **Super Admin Console**
2. Click **"Academic Configuration"**
3. Select **"Terms"** tab

### Creating a Term

1. Click **"Create Term"**
2. Fill in:
   - **Name**: e.g., "First Term 2024/2025"
   - **Start Date**: When the term begins
   - **End Date**: When the term ends
   - **Academic Year**: e.g., "2024/2025"
   - **Is Current**: Check if this is the active term

3. Click **"Save"**

### Managing Terms
- Only one term can be marked as "Current" at a time
- Setting a new term as current will automatically unset the previous one
- Past terms are kept for historical records

---

## Step 4: Create Academic Classes

Academic classes link a class level (e.g., SS1), an arm (e.g., Gold), and an assessment structure.

### Navigation
1. Go to **Super Admin Console**
2. Click **"Academic Configuration"**
3. Select **"Academic Classes"** tab

### Creating an Academic Class

1. Click **"Create Class"**
2. Fill in:
   - **Class Level**: Select from dropdown (e.g., "SS1", "JSS2")
   - **Arm**: Select arm (e.g., "Gold", "Silver", "Copper")
   - **Assessment Structure**: Select the structure created in Step 2
   - **Grading Scheme**: Select the scheme created in Step 1

3. Click **"Save"**

### Example Academic Classes
- SS1 Gold (Assessment Structure: Term Assessment, Grading: Standard)
- SS1 Silver (Assessment Structure: Term Assessment, Grading: Standard)
- JSS1 Gold (Assessment Structure: Junior Assessment, Grading: Standard)

---

## Step 5: Assign Teachers to Classes (Teaching Assignments)

Teaching assignments link teachers to specific class-subject combinations for a term.

### Navigation
1. Go to **Super Admin Console**
2. Click **"Academic Configuration"**
3. Select **"Teaching Assignments"** tab

### Creating a Teaching Assignment

1. Click **"Create Assignment"**
2. Fill in:
   - **Term**: Select the active term
   - **Academic Class**: Select class (e.g., "SS1 Gold")
   - **Subject**: Select subject (e.g., "Mathematics")
   - **Teacher**: Select the teacher from staff list

3. Click **"Save"**

### Important Notes
- One teacher can have multiple assignments (different classes/subjects)
- One class-subject combination should have only one teacher per term
- Teachers can only enter scores for their assigned classes

---

## Step 6: Enter Student Scores

Teachers enter scores for students in their assigned classes.

### Navigation (For Teachers)
1. Go to **Result Manager** from the main menu
2. Select your teaching assignment (class and subject)

### Entering Scores

1. Select the **Term** from the dropdown
2. Select your **Class** (e.g., "SS1 Gold")
3. Select the **Subject** (e.g., "Mathematics")
4. The student list will appear with score columns based on the assessment structure

5. Enter scores for each student:
   - CA1, CA2, CA3, Exam (based on your assessment structure)
   - Scores are validated against max scores
   - Total and Grade are calculated automatically

6. Click **"Save Scores"** after entering scores

### Score Entry Tips
- Scores are saved per student, so you can save progress anytime
- Use Tab key to move between score fields quickly
- Leave fields empty for absent students (they'll show as "AB" on report cards)

---

## Step 7: Review and Lock Scores

Before publishing, scores should be reviewed and locked to prevent further changes.

### For Teachers
1. In **Result Manager**, review all entered scores
2. Check the **Total** and **Grade** columns for accuracy
3. Once satisfied, click **"Lock Scores"** for the class-subject

### For Admins/Team Leads
1. Go to **Result Manager**
2. Select **"All Classes"** view
3. Review score summaries across all classes
4. Use **"Lock Class Results"** to lock all subjects for a class at once

### Locked Scores
- Once locked, teachers cannot modify scores
- Only Admin/Principal can unlock scores if corrections are needed
- Locking is per class-subject-term combination

---

## Step 8: Publish Results

Publishing makes results visible to students and parents.

### Navigation
1. Go to **Result Manager**
2. Select the class to publish

### Publishing Process

#### Option A: Publish Individual Class Results
1. Select the **Class** (e.g., "SS1 Gold")
2. Ensure all subjects are locked
3. Click **"Publish Class Results"**
4. Confirm the action

#### Option B: Bulk Publish (Admin/Principal Only)
1. In Result Manager, select **"Bulk Actions"**
2. Select multiple classes to publish
3. Click **"Publish Selected"**
4. Confirm the action

### After Publishing
- Students can view their results in the Student Portal
- Parents can view results in the Parent Portal
- Results cannot be unpublished without admin intervention
- Report cards can be generated and printed

---

## Viewing Published Results

### For Students
1. Log into the Student Portal
2. Go to **"My Results"**
3. Select the term to view
4. View detailed subject breakdown and overall performance

### For Parents
1. Log into the Parent Portal
2. Go to **"Child's Results"**
3. Select the child (if multiple)
4. Select the term to view

### For Teachers
1. Go to **Result Manager**
2. View results for assigned classes
3. Export results to Excel/PDF if needed

---

## Generating Report Cards

### Navigation
1. Go to **Result Manager**
2. Select the class
3. Click **"Generate Report Cards"**

### Options
- **Single Student**: Generate for one student
- **Entire Class**: Generate for all students in the class
- **Format**: PDF or printable HTML

### Report Card Contents
- Student information (Name, Class, Admission Number)
- Subject scores (CA1, CA2, CA3, Exam, Total, Grade)
- Class position and average
- Teacher and Principal comments
- Attendance summary
- School stamp/logo

---

## Troubleshooting

### "Cannot enter scores"
- Verify you have a teaching assignment for that class-subject
- Check if scores are already locked
- Ensure the term is set as "Current"

### "Grades not calculating"
- Verify a grading scheme is set as active
- Check that the assessment structure weights add up to 100%
- Ensure all required score fields are filled

### "Cannot publish results"
- All subjects for the class must be locked first
- You must have Admin/Principal role
- Check for any validation errors in the score data

### "Students not appearing in class"
- Verify students are enrolled in the class
- Check student profile has correct class assignment
- Ensure students have active status (not withdrawn)

### "Report card not generating"
- Check all scores are entered and locked
- Verify the grading scheme is configured correctly
- Ensure student photos are uploaded (if required)

---

## Quick Reference: User Roles & Permissions

| Action | Super Admin | Principal | Team Lead | Teacher |
|--------|-------------|-----------|-----------|---------|
| Create Grading Scheme | ✅ | ✅ | ❌ | ❌ |
| Create Assessment Structure | ✅ | ✅ | ❌ | ❌ |
| Create Terms | ✅ | ✅ | ❌ | ❌ |
| Create Academic Classes | ✅ | ✅ | ✅ | ❌ |
| Create Teaching Assignments | ✅ | ✅ | ✅ | ❌ |
| Enter Scores | ✅ | ✅ | ✅ | ✅* |
| Lock Scores | ✅ | ✅ | ✅ | ✅* |
| Unlock Scores | ✅ | ✅ | ❌ | ❌ |
| Publish Results | ✅ | ✅ | ✅ | ❌ |
| Generate Report Cards | ✅ | ✅ | ✅ | ✅* |

*Teachers can only perform actions on their assigned classes/subjects

---

## Support

For technical support or questions:
- Contact your school's IT administrator
- Email: support@schoolguardian360.com
- Documentation: https://docs.schoolguardian360.com
