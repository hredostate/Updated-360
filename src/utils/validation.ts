/**
 * Validation utilities for CSV data upload
 */

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
  studentName?: string;
}

/**
 * Email validation regex - shared between client and server
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return true; // Email is optional
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Extracts email from student object (case-insensitive)
 */
export function extractEmail(student: any): string {
  return (student.email || student.Email || student.EMAIL || '').trim();
}

/**
 * Validates a phone number format
 * Expects numeric string, typically 11 digits for Nigerian numbers
 */
export function isValidPhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: true }; // Phone is optional
  }
  
  const trimmed = phone.trim();
  
  // Check for scientific notation (e.g., 2.35E+12)
  if (/[eE][+-]?\d+/.test(trimmed)) {
    return {
      valid: false,
      error: 'appears to be in scientific notation - please re-export from Excel with the column formatted as Text'
    };
  }
  
  // Remove common formatting characters
  const cleaned = trimmed.replace(/[\s\-()]/g, '');
  
  // Check if it's numeric
  if (!/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      error: 'contains non-numeric characters'
    };
  }
  
  // Check length (expecting 10-15 digits, with 11 being most common for Nigerian numbers)
  if (cleaned.length < 10) {
    return {
      valid: false,
      error: `appears to be missing digits (has ${cleaned.length} digits, expected 10-15)`
    };
  }
  
  if (cleaned.length > 15) {
    return {
      valid: false,
      error: `has too many digits (has ${cleaned.length} digits, expected 10-15)`
    };
  }
  
  return { valid: true };
}

/**
 * Converts array index to CSV row number
 * (accounts for 1-based row numbering and header row)
 */
export function indexToCsvRow(index: number): number {
  return index + 2; // +2 because row 1 is header, array is 0-indexed
}

/**
 * Converts CSV row number back to array index
 */
export function csvRowToIndex(row: number): number {
  return row - 2;
}

/**
 * Validates a single student row from CSV
 */
export function validateStudentRow(
  student: any,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const studentName = student.name || `Row ${indexToCsvRow(rowIndex)}`;
  const csvRow = indexToCsvRow(rowIndex);
  
  // Validate required field: name
  if (!student.name || student.name.trim() === '') {
    errors.push({
      row: csvRow,
      field: 'name',
      value: '',
      message: 'Name is required',
      studentName
    });
  }
  
  // Validate email if provided
  const email = extractEmail(student);
  if (email && !isValidEmail(email)) {
    errors.push({
      row: csvRow,
      field: 'email',
      value: email,
      message: 'Invalid email format',
      studentName
    });
  }
  
  // Validate parent phone numbers
  const phoneFields = [
    'parent_phone_number_1',
    'Parent Phone Number 1',
    'parent_phone_number_2',
    'Parent Phone Number 2'
  ];
  
  for (const field of phoneFields) {
    if (student[field]) {
      const phone = student[field];
      const validation = isValidPhoneNumber(phone);
      if (!validation.valid) {
        errors.push({
          row: csvRow,
          field: field,
          value: phone,
          message: `Phone number ${validation.error}`,
          studentName
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validates all student rows from CSV data
 */
export function validateStudentData(students: any[]): {
  valid: boolean;
  errors: ValidationError[];
  validCount: number;
  invalidCount: number;
} {
  const allErrors: ValidationError[] = [];
  const rowsWithErrors = new Set<number>();
  
  students.forEach((student, index) => {
    const errors = validateStudentRow(student, index);
    if (errors.length > 0) {
      allErrors.push(...errors);
      rowsWithErrors.add(indexToCsvRow(index));
    }
  });
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    validCount: students.length - rowsWithErrors.size,
    invalidCount: rowsWithErrors.size
  };
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  const lines = ['Validation errors found:'];
  errors.forEach(error => {
    const name = error.studentName || `Row ${error.row}`;
    lines.push(`- Row ${error.row} (${name}): ${error.field} - ${error.message} (value: "${error.value}")`);
  });
  
  return lines.join('\n');
}
