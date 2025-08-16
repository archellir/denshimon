import { useState, type FC } from 'react';
import { Copy } from 'lucide-react';
import { QueryResult } from '@/types/database';

interface QueryResultsTableProps {
  queryResults: QueryResult;
  isFullscreen: boolean;
}

const QueryResultsTable: FC<QueryResultsTableProps> = ({ queryResults, isFullscreen }) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getCellId = (rowIndex: number, colIndex: number) => `${rowIndex}-${colIndex}`;

  return (
    <div className="border border-white flex-shrink-0" style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '400px', width: '100%', overflow: 'hidden' }}>
      <div className="h-full w-full overflow-auto">
        <table className="text-sm font-mono border-collapse" style={{ tableLayout: 'auto' }}>
          <thead className="bg-white/10 sticky top-0">
            <tr>
              {queryResults.columns.map((col, i) => (
                <th key={i} className="text-left p-2 border-r border-white/20 last:border-r-0 bg-white/10 whitespace-nowrap" style={{ minWidth: '150px' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queryResults.rows.map((row, i) => (
              <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                {row.map((cell, j) => {
                  const cellId = getCellId(i, j);
                  const cellValue = cell === null ? 'NULL' : String(cell);
                  const isLongText = cellValue.length > 100;
                  const displayText = isLongText ? truncateText(cellValue) : cellValue;
                  
                  return (
                    <td 
                      key={j} 
                      className="p-2 border-r border-white/10 last:border-r-0 whitespace-nowrap relative group" 
                      style={{ minWidth: '150px', maxWidth: '300px' }}
                      onMouseEnter={() => setHoveredCell(cellId)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`${cell === null ? 'opacity-50 italic' : ''} text-ellipsis overflow-hidden`}>
                          {cell === null ? 'NULL' : displayText}
                        </span>
                        {hoveredCell === cellId && cellValue && (
                          <button
                            onClick={() => copyToClipboard(cellValue)}
                            className="ml-2 p-1 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            title="Copy cell value"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                      {isLongText && hoveredCell === cellId && (
                        <div className="absolute z-10 bg-black border border-white/40 p-2 mt-1 left-0 max-w-96 text-xs shadow-lg">
                          <div className="max-h-32 overflow-y-auto">
                            {cellValue}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueryResultsTable;