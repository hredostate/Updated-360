import * as XLSX from 'xlsx';

export interface ExcelColumn {
  key: string;
  header: string;
  width?: number;
  type?: 'string' | 'number' | 'date' | 'currency' | 'boolean';
  format?: (value: any) => any;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  includeTimestamp?: boolean;
}

/**
 * Format a value based on its type
 */
const formatValue = (value: any, type?: ExcelColumn['type'], customFormat?: (value: any) => any): any => {
  // Apply custom format first if provided
  if (customFormat) {
    return customFormat(value);
  }

  if (value === null || value === undefined) {
    return '';
  }

  switch (type) {
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleDateString();
      }
      return value;
    
    case 'currency':
      if (typeof value === 'number') {
        return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return value;
    
    case 'number':
      if (typeof value === 'number') {
        return value;
      }
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    
    case 'boolean':
      return value ? 'Yes' : 'No';
    
    case 'string':
    default:
      return String(value);
  }
};

/**
 * Format data for export based on column configuration
 */
export const formatDataForExport = (data: any[], columns: ExcelColumn[]): any[] => {
  return data.map(row => {
    const formattedRow: any = {};
    columns.forEach(col => {
      formattedRow[col.header] = formatValue(row[col.key], col.type, col.format);
    });
    return formattedRow;
  });
};

/**
 * Export data to Excel file
 */
export const exportToExcel = (
  data: any[],
  columns: ExcelColumn[],
  options: ExportOptions
): void => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  try {
    // Format the data
    const formattedData = formatDataForExport(data, columns);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Set column widths if specified
    const columnWidths: XLSX.ColInfo[] = columns.map(col => ({
      wch: col.width || 15
    }));
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    const sheetName = options.sheetName || 'Sheet1';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with optional timestamp
    let filename = options.filename;
    if (options.includeTimestamp !== false) {
      const timestamp = new Date().toISOString().split('T')[0];
      const nameParts = filename.split('.');
      const extension = nameParts.pop();
      filename = `${nameParts.join('.')}_${timestamp}.${extension}`;
    }

    // Ensure .xlsx extension
    if (!filename.endsWith('.xlsx')) {
      filename += '.xlsx';
    }

    // Write the file
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Export data to Excel with multiple sheets
 */
export const exportToExcelMultiSheet = (
  sheets: Array<{
    data: any[];
    columns: ExcelColumn[];
    sheetName: string;
  }>,
  filename: string
): void => {
  if (!sheets || sheets.length === 0) {
    console.warn('No sheets to export');
    return;
  }

  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Add each sheet
    sheets.forEach(({ data, columns, sheetName }) => {
      if (data && data.length > 0) {
        const formattedData = formatDataForExport(data, columns);
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Set column widths
        const columnWidths: XLSX.ColInfo[] = columns.map(col => ({
          wch: col.width || 15
        }));
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const nameParts = filename.split('.');
    const extension = nameParts.pop();
    let finalFilename = `${nameParts.join('.')}_${timestamp}.${extension || 'xlsx'}`;

    // Ensure .xlsx extension
    if (!finalFilename.endsWith('.xlsx')) {
      finalFilename += '.xlsx';
    }

    // Write the file
    XLSX.writeFile(workbook, finalFilename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Create download progress tracker (for UI feedback with large datasets)
 */
export const createExportProgress = () => {
  let progress = 0;
  
  return {
    update: (current: number, total: number) => {
      progress = Math.round((current / total) * 100);
      return progress;
    },
    get: () => progress,
    reset: () => {
      progress = 0;
    }
  };
};
