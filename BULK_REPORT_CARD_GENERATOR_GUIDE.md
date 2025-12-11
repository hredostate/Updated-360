# Bulk Report Card Generator - Implementation Guide

## Overview

The Bulk Report Card Generator allows administrators to generate and download report cards for an entire class in a single ZIP file. It includes financial debt checking to prevent report card generation for students with outstanding balances.

## Features

### 1. Financial Debt Check
- **Automatic Detection**: When the modal opens, the system queries the `student_invoices` table for all students in the selected class
- **Outstanding Balance Calculation**: Calculates `(total_amount - amount_paid)` for each student
- **Visual Indicators**:
  - Red badge with "Outstanding Debt" label
  - Shows the outstanding amount in Nigerian Naira (₦)
  - Yellow badge for "No Report" if student has no report data
- **Disabled Selection**: Students with debt are automatically excluded from checkbox selection

### 2. Student Selection
- **Auto-Select**: All eligible students (no debt + report exists) are automatically selected when modal opens
- **Manual Control**:
  - Individual checkboxes for each student
  - "Select All Eligible" button
  - "Deselect All" button
- **Search**: Filter students by name or admission number
- **Student Info Display**:
  - Student name
  - Admission number
  - Average score (if available)
  - Outstanding debt amount (if applicable)

### 3. Bulk PDF Generation
- **Progress Tracking**: Shows "Generating X of Y..." with progress bar
- **Individual PDFs**: Each student gets their own PDF file
- **Filename Format**: `StudentName_AdmNumber_Term_Report.pdf`
  - Example: `John_Doe_ADM001_First_Term_2024_Report.pdf`
- **Error Handling**: Gracefully handles failures for individual students and continues processing

### 4. ZIP Download
- **Package Format**: All PDFs are packaged in a single ZIP file
- **ZIP Filename Format**: `ClassName_Term_ReportCards.zip`
  - Example: `JSS1A_First_Term_2024_ReportCards.zip`
- **Automatic Download**: ZIP file downloads automatically when generation completes

## Usage

### Accessing the Feature

1. Navigate to **Result Manager**
2. Select a **Term** from the dropdown
3. Switch to **By Class** view
4. Each class card displays a "Generate Report Cards" button
5. Click the button to open the Bulk Report Card Generator modal

### Generating Report Cards

1. **Review Students**: The modal displays all students in the class with their financial status
2. **Adjust Selection**: 
   - Use checkboxes to select/deselect specific students
   - Use "Select All Eligible" or "Deselect All" for bulk actions
   - Search to filter the list
3. **Generate**: Click "Download as ZIP" button
4. **Monitor Progress**: Watch the progress bar as PDFs are generated
5. **Download**: The ZIP file will download automatically when complete

### Financial Debt Workflow

Students with outstanding debt cannot be included in bulk report generation:

```
Student has unpaid invoices → System marks as "Has Debt" → Checkbox disabled → Cannot generate report
```

To generate report for student with debt:
1. Have the parent/guardian clear the outstanding balance in Finance module
2. Verify invoice status is marked as "Paid"
3. Return to Result Manager and generate report cards

## Technical Implementation

### Files Modified/Created

1. **Created**: `src/components/BulkReportCardGenerator.tsx`
   - Main component handling the bulk generation logic
   - Student financial debt checking
   - PDF generation and ZIP packaging

2. **Modified**: `src/components/ResultManager.tsx`
   - Added "Generate Report Cards" button to class cards
   - Integrated BulkReportCardGenerator modal

3. **Modified**: `package.json`
   - Added JSZip dependency for ZIP file generation

### Key Dependencies

- **JSZip**: For creating ZIP archives
- **html2canvas**: For rendering report HTML to canvas
- **jsPDF**: For converting canvas to PDF
- **Supabase**: For database queries (invoices, reports, student data)

### Database Queries

#### Financial Debt Check
```typescript
const { data: invoices } = await supabase
  .from('student_invoices')
  .select('student_id, total_amount, amount_paid, status')
  .eq('term_id', termId)
  .in('student_id', enrolledStudentIds);

// Calculate outstanding amount
const totalOwed = studentInvoices.reduce(
  (sum, inv) => sum + (inv.total_amount - inv.amount_paid), 
  0
);
```

#### Report Data Fetch
```typescript
const { data: reportData } = await supabase.rpc(
  'get_student_term_report_details',
  {
    p_student_id: studentId,
    p_term_id: termId,
  }
);
```

### PDF Generation Process

1. **Fetch Report Data**: Call `get_student_term_report_details` RPC for each student
2. **Create HTML Template**: Generate simplified HTML with report data
3. **Render to Canvas**: Use `html2canvas` to capture the HTML
4. **Convert to PDF**: Use `jsPDF` to create PDF from canvas image
5. **Add to ZIP**: Package PDF into JSZip instance
6. **Download**: Generate ZIP blob and trigger browser download

## Report Card Template

The generated PDF includes:

### Header
- School name (large, bold)
- School address
- School motto (italic)
- Term label (highlighted badge)

### Student Information
- Name
- Class
- Admission number
- Term

### Subjects Table
- Subject name
- Score
- Grade
- Remark

### Summary Section
- Average score
- Position in class
- Number of students in class

### Comments
- Class teacher's remark
- Principal's remark

### Footer
- Generation date

## Statistics Display

The modal header shows real-time stats:

- **Total Students**: All students in the class
- **Eligible**: Students without debt and with reports
- **Has Debt**: Students with outstanding balances
- **No Report**: Students without generated reports

## Error Handling

### Common Scenarios

1. **No Reports Available**: Button is disabled if `reportsCount === 0`
2. **PDF Generation Fails**: 
   - Error logged to console
   - Continues with remaining students
   - Shows count of successful vs failed generations
3. **No Students Selected**: Toast message prompts user to select students
4. **Network Errors**: Toast message displays error details

## Performance Considerations

### Large Classes
- **Progress Indicator**: Shows current progress (e.g., "5 of 30")
- **Async Processing**: PDFs generated sequentially to avoid memory issues
- **Canvas Cleanup**: Temporary DOM elements removed after each PDF

### Optimization Tips
- For classes with 50+ students, generation may take 2-5 minutes
- Browser remains responsive during generation
- Users can cancel by closing the modal (though this stops generation)

## Permissions

The "Generate Report Cards" button is visible to all users, but:
- The button is **disabled** if no reports exist for the class
- Financial data access requires appropriate Supabase RLS policies

## Future Enhancements

Potential improvements for future versions:

1. **Admin Override**: Allow admins to override debt restriction with confirmation
2. **Batch Processing**: Generate PDFs in parallel batches for faster processing
3. **Email Distribution**: Option to email report cards directly to parents
4. **Custom Templates**: Allow selection of different report card designs
5. **Cloud Storage**: Save ZIP files to cloud storage with shareable links
6. **Print Queue**: Send to school printer for batch printing

## Troubleshooting

### Issue: PDFs are blank or incomplete
- **Cause**: Report data missing or RPC function error
- **Solution**: Check browser console for errors, verify `get_student_term_report_details` RPC exists

### Issue: Students with paid invoices still marked as having debt
- **Cause**: Invoice status not updated to "Paid"
- **Solution**: Update invoice status in Finance module

### Issue: ZIP download doesn't start
- **Cause**: Browser popup blocker or insufficient permissions
- **Solution**: Check browser console, allow popups for the site

### Issue: Generation is very slow
- **Cause**: Large class size or slow network
- **Solution**: Normal for large classes; wait for completion or reduce selection

## Testing Checklist

- [ ] Modal opens when "Generate Report Cards" button clicked
- [ ] Students with debt are visually marked and disabled
- [ ] Students without debt are auto-selected
- [ ] Search filters student list correctly
- [ ] Select All/Deselect All buttons work
- [ ] Progress bar updates during generation
- [ ] Individual PDFs contain correct student data
- [ ] ZIP file downloads successfully
- [ ] ZIP contains expected number of PDFs
- [ ] PDF filenames follow naming convention
- [ ] Error handling works for failed PDFs
- [ ] Toast messages display correctly
- [ ] Modal closes after successful generation

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify student has report data in database
3. Confirm invoice records are accurate
4. Test with a small class first (2-3 students)

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Component**: `BulkReportCardGenerator.tsx`  
**Related**: `ResultManager.tsx`, Financial Module
