import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { 
  Play, 
  Save, 
  Download, 
  History, 
  Database, 
  CheckCircle,
  XCircle,
  Activity,
  FileText,
  Trash2,
  Copy,
  Maximize2,
  Zap
} from 'lucide-react';
import useDatabaseStore from '@stores/databaseStore';
import { DatabaseStatus } from '@/types/database';
import { mockQueryHistory } from '@mocks/database';
import CustomSelector from '@components/common/CustomSelector';
import CustomButton from '@components/common/CustomButton';

const SQLQueryInterface: FC = () => {
  const {
    connections,
    queryResults,
    savedQueries,
    isLoading,
    error,
    executeQuery,
    clearQueryResults,
    fetchConnections,
    fetchSavedQueries,
    createSavedQuery,
    deleteSavedQuery
  } = useDatabaseStore();

  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [queryLimit, setQueryLimit] = useState<number>(100);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [queryName, setQueryName] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    fetchConnections();
    fetchSavedQueries();
  }, [fetchConnections, fetchSavedQueries]);


  const connectedConnections = connections.filter(conn => 
    conn.status === DatabaseStatus.CONNECTED
  );

  const handleExecuteQuery = () => {
    if (!selectedConnection || !sqlQuery.trim()) return;
    executeQuery(selectedConnection, sqlQuery, queryLimit);
  };

  const handleSaveQuery = async () => {
    if (!queryName.trim() || !sqlQuery.trim()) return;
    
    try {
      await createSavedQuery({
        name: queryName,
        sql: sqlQuery,
        connectionId: selectedConnection || undefined
      });
      setQueryName('');
    } catch (error) {
      console.error('Failed to save query:', error);
    }
  };

  const loadSavedQuery = (sql: string) => {
    setSqlQuery(sql);
    setShowHistory(false);
  };

  const loadHistoryQuery = (sql: string) => {
    setSqlQuery(sql);
    setShowHistory(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportResults = () => {
    if (!queryResults || !queryResults.columns || !queryResults.rows) return;
    
    // Convert to CSV
    const csvHeader = queryResults.columns.join(',');
    const csvRows = queryResults.rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    );
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-black p-6' : ''}`}>

      {/* Connection Selection */}
      <div className="flex items-center justify-between p-4 border border-white/20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Database size={16} />
            <label className="font-mono text-sm">CONNECTION:</label>
          </div>
          <CustomSelector
            value={selectedConnection}
            options={connectedConnections.map(conn => ({
              value: conn.id,
              label: `${conn.name} (${conn.type.toUpperCase()})`
            }))}
            onChange={(value) => setSelectedConnection(value)}
            placeholder="Select Database Connection"
            icon={Zap}
            size="md"
            className="min-w-64"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="font-mono text-sm">LIMIT:</label>
            <input
              type="number"
              value={queryLimit}
              onChange={(e) => setQueryLimit(parseInt(e.target.value) || 100)}
              className="bg-black border border-white px-2 py-1 font-mono text-sm w-20 focus:outline-none focus:border-green-400"
              min="1"
              max="10000"
            />
          </div>
          <CustomButton
            label="HISTORY"
            icon={History}
            onClick={() => setShowHistory(!showHistory)}
            color={showHistory ? "white" : "gray"}
            className="w-auto"
          />
          <CustomButton
            label="FULLSCREEN"
            icon={Maximize2}
            onClick={() => setIsFullscreen(!isFullscreen)}
            color="white"
            className="w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Query Editor */}
        <div className={`${showHistory ? 'col-span-8' : 'col-span-12'} space-y-4`}>
          {/* SQL Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-sm">SQL QUERY EDITOR</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  placeholder="Query name..."
                  className="bg-black border border-white px-2 py-2 font-mono text-xs w-32 focus:outline-none focus:border-green-400"
                />
                <CustomButton
                  label="SAVE"
                  icon={Save}
                  onClick={handleSaveQuery}
                  disabled={!queryName.trim() || !sqlQuery.trim()}
                  color="green"
                  className="w-auto px-2 py-1 text-xs"
                />
              </div>
            </div>
            
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="-- Enter your SQL query here
SELECT * FROM users LIMIT 10;"
              className={`w-full bg-black border border-white p-4 font-mono text-sm focus:outline-none focus:border-green-400 resize-none ${
                isFullscreen ? 'h-64' : 'h-32'
              }`}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <CustomButton
                  label="EXECUTE"
                  icon={isLoading ? Activity : Play}
                  onClick={handleExecuteQuery}
                  disabled={!selectedConnection || !sqlQuery.trim() || isLoading}
                  color="green"
                  className="w-auto px-4 py-2"
                />
                <CustomButton
                  label="CLEAR"
                  onClick={() => {
                    setSqlQuery('');
                    clearQueryResults();
                  }}
                  color="white"
                  className="w-auto px-4 py-2"
                />
                <CustomButton
                  label="COPY"
                  icon={Copy}
                  onClick={() => copyToClipboard(sqlQuery)}
                  color="white"
                  className="w-auto px-3 py-2"
                />
              </div>
              
              {queryResults && (
                <div className="text-sm font-mono opacity-60">
                  {queryResults.rowCount} rows • {queryResults.duration}ms
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 border border-red-400 bg-red-900/20 text-red-400 font-mono text-sm">
              ERROR: {error}
            </div>
          )}

          {/* Query Results */}
          {queryResults && (
            <div className="border border-white">
              <div className="bg-white/5 p-3 border-b border-white">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-sm">QUERY RESULTS</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono opacity-60">
                      {queryResults.rowCount} rows
                    </span>
                    <button
                      onClick={exportResults}
                      className="flex items-center space-x-1 px-2 py-1 border border-white hover:bg-white hover:text-black transition-colors font-mono text-xs"
                    >
                      <Download size={12} />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {queryResults.error ? (
                <div className="p-4 text-red-400 font-mono text-sm">
                  ERROR: {queryResults.error}
                </div>
              ) : (
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-sm font-mono">
                    <thead className="bg-white/10">
                      <tr>
                        {queryResults.columns.map((col, i) => (
                          <th key={i} className="text-left p-2 border-r border-white/20 last:border-r-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.rows.map((row, i) => (
                        <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                          {row.map((cell, j) => (
                            <td key={j} className="p-2 border-r border-white/10 last:border-r-0">
                              {cell === null ? (
                                <span className="opacity-50 italic">NULL</span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - History & Saved Queries */}
        {showHistory && (
          <div className="col-span-4 space-y-4">
            {/* Saved Queries */}
            <div className="border border-white">
              <div className="bg-white/5 p-3 border-b border-white">
                <h4 className="font-mono text-sm">SAVED QUERIES</h4>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {savedQueries.length === 0 ? (
                  <div className="p-4 text-center">
                    <FileText size={24} className="mx-auto opacity-40 mb-2" />
                    <div className="text-xs font-mono opacity-60">No saved queries</div>
                    <div className="text-xs font-mono opacity-40 mt-1">
                      Save frequently used queries for quick access
                    </div>
                  </div>
                ) : (
                  savedQueries.map((query) => (
                    <div key={query.id} className="p-2 border-b border-white/10 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => loadSavedQuery(query.sql)}
                          className="text-left flex-1 hover:bg-white/10 p-1 transition-colors"
                        >
                          <div className="font-mono text-xs font-semibold">{query.name}</div>
                          <div className="font-mono text-xs opacity-60 truncate">
                            {query.sql.substring(0, 50)}...
                          </div>
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteSavedQuery(query.id);
                            } catch (error) {
                              console.error('Failed to delete query:', error);
                            }
                          }}
                          className="p-1 hover:bg-red-400/20 text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Query History */}
            <div className="border border-white">
              <div className="bg-white/5 p-3 border-b border-white">
                <h4 className="font-mono text-sm">QUERY HISTORY</h4>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {mockQueryHistory.map((item) => (
                  <div key={item.id} className="p-2 border-b border-white/10 last:border-b-0">
                    <button
                      onClick={() => loadHistoryQuery(item.sql)}
                      className="text-left w-full hover:bg-white/10 p-1 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1">
                          {item.status === 'success' ? (
                            <CheckCircle size={10} className="text-green-400" />
                          ) : (
                            <XCircle size={10} className="text-red-400" />
                          )}
                          <span className="font-mono text-xs opacity-60">{item.duration}ms</span>
                        </div>
                        <span className="font-mono text-xs opacity-60">{item.rowCount} rows</span>
                      </div>
                      <div className="font-mono text-xs opacity-80 truncate">
                        {item.sql}
                      </div>
                      <div className="font-mono text-xs opacity-40">
                        {item.timestamp}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SQLQueryInterface;