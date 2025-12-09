import React, { useState } from 'react';
import { exportToExcel, type ExcelColumn } from '../../utils/excelExport';
import { Download } from './icons';
import Button from './Button';

interface ExportButtonProps {
  data: any[];
  columns: ExcelColumn[];
  filename: string;
  sheetName?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  includeTimestamp?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  columns,
  filename,
  sheetName = 'Data',
  disabled = false,
  label = 'Export to Excel',
  className = '',
  includeTimestamp = true,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      setIsExporting(true);
      
      // Small delay to show loading state for large datasets
      await new Promise(resolve => setTimeout(resolve, 100));
      
      exportToExcel(data, columns, {
        filename,
        sheetName,
        includeTimestamp,
      });
      
      // Success feedback could be added here
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting || !data || data.length === 0}
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? 'Exporting...' : label}
    </Button>
  );
};

export default ExportButton;
