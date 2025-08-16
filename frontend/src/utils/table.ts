/**
 * Generates a unique cell ID for table cells
 */
export const getCellId = (rowIndex: number, colIndex: number): string => {
  return `${rowIndex}-${colIndex}`;
};

/**
 * Calculates dynamic column width based on column name
 */
export const getColumnWidth = (colName: string): string => {
  const lowerCol = colName.toLowerCase();
  
  // Calculate minimum width based on column title length (roughly 8px per character + padding)
  const minWidthForTitle = Math.max(colName.length * 8 + 32, 80);
  
  let suggestedWidth = 150; // default
  
  if (lowerCol.includes('id') || lowerCol === 'id') {
    suggestedWidth = 80;
  } else if (lowerCol.includes('status') || lowerCol.includes('phase')) {
    suggestedWidth = 100;
  } else if (lowerCol.includes('count') || lowerCol.includes('cpu') || lowerCol.includes('memory')) {
    suggestedWidth = 120;
  } else if (lowerCol.includes('timestamp') || lowerCol.includes('created') || lowerCol.includes('updated')) {
    suggestedWidth = 180;
  } else if (lowerCol.includes('name') || lowerCol.includes('namespace')) {
    suggestedWidth = 200;
  } else if (lowerCol.includes('notes') || lowerCol.includes('description') || lowerCol.includes('skills')) {
    suggestedWidth = 300;
  }
  
  // Return the larger of suggested width or minimum title width
  return `${Math.max(suggestedWidth, minWidthForTitle)}px`;
};

/**
 * Sorts table data by column
 */
export const sortTableData = <T>(
  data: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...data].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filters table data by search query
 */
export const filterTableData = <T>(
  data: T[],
  searchQuery: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchQuery.trim()) return data;
  
  const query = searchQuery.toLowerCase();
  
  return data.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(query);
    })
  );
};

/**
 * Paginates table data
 */
export const paginateTableData = <T>(
  data: T[],
  page: number,
  pageSize: number
): { data: T[]; totalPages: number; hasNext: boolean; hasPrev: boolean } => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const totalPages = Math.ceil(data.length / pageSize);
  
  return {
    data: data.slice(startIndex, endIndex),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};