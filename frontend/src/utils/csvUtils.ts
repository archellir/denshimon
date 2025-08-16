import { QueryResult } from '@/types/database';

/**
 * Escapes a CSV cell value by wrapping in quotes and escaping internal quotes
 */
export const escapeCsvCell = (cell: any): string => {
  if (cell === null || cell === undefined) return '';
  
  const cellStr = String(cell);
  
  // If cell contains comma, quote, or newline, wrap in quotes and escape quotes
  if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
    return `"${cellStr.replace(/"/g, '""')}"`;
  }
  
  return cellStr;
};

/**
 * Converts query results to CSV format
 */
export const convertToCSV = (queryResults: QueryResult): string => {
  if (!queryResults.columns || !queryResults.rows) {
    throw new Error('Invalid query results: missing columns or rows');
  }

  const csvContent = [
    // Header row
    queryResults.columns.join(','),
    // Data rows
    ...queryResults.rows.map(row => 
      row.map(cell => escapeCsvCell(cell)).join(',')
    )
  ].join('\n');

  return csvContent;
};

/**
 * Generates a timestamped filename for exports
 */
export const generateExportFilename = (prefix: string = 'export', extension: string = 'csv'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
};

/**
 * Downloads content as a file
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Exports query results to CSV and downloads the file
 */
export const exportQueryResultsToCSV = (queryResults: QueryResult): void => {
  if (!queryResults || !queryResults.columns || !queryResults.rows) {
    throw new Error('No data to export');
  }

  const csvContent = convertToCSV(queryResults);
  const filename = generateExportFilename('query_results', 'csv');
  
  downloadFile(csvContent, filename);
};