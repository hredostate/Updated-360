/**
 * A utility to generate and download a CSV file from an array of objects.
 * @param data The array of data to export.
 * @param filename The desired name for the downloaded file (e.g., 'data.csv').
 */
export const exportToCsv = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.error("No data provided for CSV export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(fieldName => {
        let cell = row[fieldName] === null || row[fieldName] === undefined ? '' : String(row[fieldName]);
        // Escape double quotes by doubling them, and wrap in quotes if the cell contains a comma, newline, or double quote.
        if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Create a link and trigger the download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up the object URL
};