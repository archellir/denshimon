import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { 
  ArrowLeft, 
  Database, 
  Table, 
  Play, 
  Download, 
  RefreshCw, 
  ChevronRight,
  ChevronDown,
  Activity,
  Eye,
  Plus
} from 'lucide-react';
import useDatabaseStore from '@stores/databaseStore';

interface DatabaseManagementProps {
  connectionId: string;
  onBack: () => void;
}

type ViewMode = 'browser' | 'query' | 'table';

const DatabaseManagement: FC<DatabaseManagementProps> = ({ connectionId, onBack }) => {
  const {
    connections,
    databases,
    tables,
    columns,
    queryResults,
    isLoading,
    error,
    fetchDatabases,
    fetchTables,
    fetchColumns,
    executeQuery,
    clearQueryResults
  } = useDatabaseStore();

  const [viewMode, setViewMode] = useState<ViewMode>('browser');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [queryLimit, setQueryLimit] = useState<number>(100);

  const connection = connections.find(c => c.id === connectionId);

  useEffect(() => {
    if (connectionId) {
      fetchDatabases(connectionId);
    }
  }, [connectionId, fetchDatabases]);

  const handleDatabaseToggle = (databaseName: string) => {
    const newExpanded = new Set(expandedDatabases);
    if (newExpanded.has(databaseName)) {
      newExpanded.delete(databaseName);
    } else {
      newExpanded.add(databaseName);
      fetchTables(connectionId, databaseName);
    }
    setExpandedDatabases(newExpanded);
  };

  const handleTableSelect = (databaseName: string, tableName: string) => {
    setSelectedDatabase(databaseName);
    setSelectedTable(tableName);
    fetchColumns(connectionId, databaseName, tableName);
    setViewMode('table');
  };

  const handleExecuteQuery = () => {
    if (sqlQuery.trim()) {
      executeQuery(connectionId, sqlQuery, queryLimit);
    }
  };

  const handleQuickQuery = (query: string) => {
    setSqlQuery(query);
    setViewMode('query');
  };

  if (!connection) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 font-mono">Connection not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
          >
            <ArrowLeft size={16} />
            <span>BACK</span>
          </button>
          <div className="flex items-center space-x-2">
            <Database size={20} />
            <div>
              <h2 className="text-lg font-mono">{connection.name}</h2>
              <p className="text-sm font-mono opacity-60">
                {connection.type.toUpperCase()} • {connection.status.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('browser')}
            className={`px-3 py-2 border font-mono text-sm transition-colors ${
              viewMode === 'browser' ? 'bg-white text-black' : 'hover:bg-white/10'
            }`}
          >
            BROWSER
          </button>
          <button
            onClick={() => setViewMode('query')}
            className={`px-3 py-2 border font-mono text-sm transition-colors ${
              viewMode === 'query' ? 'bg-white text-black' : 'hover:bg-white/10'
            }`}
          >
            QUERY
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-400 bg-red-900/20 text-red-400 font-mono">
          ERROR: {error}
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-12 gap-6 min-h-96">
        {/* Sidebar - Database Tree */}
        <div className="col-span-3 border border-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono font-semibold">DATABASES</h3>
            <button
              onClick={() => fetchDatabases(connectionId)}
              disabled={isLoading}
              className="p-1 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="space-y-1 text-sm">
            {databases.map((db) => (
              <div key={db.name} className="space-y-1">
                <button
                  onClick={() => handleDatabaseToggle(db.name)}
                  className="flex items-center space-x-2 w-full text-left p-1 hover:bg-white/10 transition-colors font-mono"
                >
                  {expandedDatabases.has(db.name) ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  <Database size={14} />
                  <span>{db.name}</span>
                  <span className="text-xs opacity-60">({db.tableCount})</span>
                </button>
                
                {expandedDatabases.has(db.name) && (
                  <div className="ml-4 space-y-1">
                    {tables
                      .filter(t => t.schema === 'main' || t.schema === 'public') // Filter relevant tables
                      .map((table) => (
                      <button
                        key={table.name}
                        onClick={() => handleTableSelect(db.name, table.name)}
                        className={`flex items-center space-x-2 w-full text-left p-1 hover:bg-white/10 transition-colors font-mono ${
                          selectedTable === table.name ? 'bg-white/20' : ''
                        }`}
                      >
                        <Table size={12} />
                        <span>{table.name}</span>
                        <span className="text-xs opacity-60">({table.rowCount})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {/* Browser View */}
          {viewMode === 'browser' && (
            <div className="space-y-4">
              <h3 className="font-mono font-semibold">DATABASE OVERVIEW</h3>
              
              {databases.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-sm font-mono opacity-60">
                    {isLoading ? 'Loading databases...' : 'No databases found'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {databases.map((db) => (
                    <div key={db.name} className="border border-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-mono font-semibold">{db.name}</h4>
                        <Database size={16} />
                      </div>
                      <div className="space-y-1 text-sm font-mono opacity-80">
                        <div>Tables: {db.tableCount}</div>
                        <div>Size: {(db.size / 1024 / 1024).toFixed(2)} MB</div>
                        {db.encoding && <div>Encoding: {db.encoding}</div>}
                        {db.owner && <div>Owner: {db.owner}</div>}
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => handleQuickQuery(`SELECT * FROM information_schema.tables WHERE table_schema = '${db.name}' LIMIT 10;`)}
                          className="px-2 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-xs"
                        >
                          SHOW TABLES
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Query View */}
          {viewMode === 'query' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono font-semibold">SQL QUERY EDITOR</h3>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-mono">LIMIT:</label>
                  <input
                    type="number"
                    value={queryLimit}
                    onChange={(e) => setQueryLimit(parseInt(e.target.value) || 100)}
                    className="bg-black border border-white px-2 py-1 font-mono text-xs w-20 focus:outline-none focus:border-green-400"
                    min="1"
                    max="10000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM your_table LIMIT 10;"
                  className="w-full h-32 bg-black border border-white p-3 font-mono text-sm focus:outline-none focus:border-green-400 resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={handleExecuteQuery}
                      disabled={!sqlQuery.trim() || isLoading}
                      className="flex items-center space-x-2 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Activity size={16} className="animate-spin" />
                      ) : (
                        <Play size={16} />
                      )}
                      <span>EXECUTE</span>
                    </button>
                    <button
                      onClick={() => {
                        setSqlQuery('');
                        clearQueryResults();
                      }}
                      className="px-4 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
                    >
                      CLEAR
                    </button>
                  </div>
                  
                  {queryResults && (
                    <div className="text-sm font-mono opacity-60">
                      {queryResults.rowCount} rows • {queryResults.duration}ms
                    </div>
                  )}
                </div>
              </div>

              {/* Query Results */}
              {queryResults && (
                <div className="border border-white">
                  <div className="bg-white/5 p-2 border-b border-white">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">QUERY RESULTS</span>
                      <button className="flex items-center space-x-1 px-2 py-1 border border-white hover:bg-white hover:text-black transition-colors font-mono text-xs">
                        <Download size={12} />
                        <span>EXPORT</span>
                      </button>
                    </div>
                  </div>
                  
                  {queryResults.error ? (
                    <div className="p-4 text-red-400 font-mono text-sm">
                      ERROR: {queryResults.error}
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-96">
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
          )}

          {/* Table View */}
          {viewMode === 'table' && selectedTable && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Table size={16} />
                  <h3 className="font-mono font-semibold">{selectedTable}</h3>
                  <span className="text-sm font-mono opacity-60">
                    {selectedDatabase}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleQuickQuery(`SELECT * FROM ${selectedTable} LIMIT ${queryLimit};`)}
                    className="flex items-center space-x-1 px-3 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-xs"
                  >
                    <Eye size={12} />
                    <span>VIEW DATA</span>
                  </button>
                  <button className="flex items-center space-x-1 px-3 py-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-xs">
                    <Plus size={12} />
                    <span>ADD ROW</span>
                  </button>
                </div>
              </div>

              {/* Table Schema */}
              <div className="border border-white">
                <div className="bg-white/5 p-2 border-b border-white">
                  <span className="font-mono text-sm">TABLE STRUCTURE</span>
                </div>
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-sm font-mono">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="text-left p-2 border-r border-white/20">COLUMN</th>
                        <th className="text-left p-2 border-r border-white/20">TYPE</th>
                        <th className="text-left p-2 border-r border-white/20">NULL</th>
                        <th className="text-left p-2 border-r border-white/20">DEFAULT</th>
                        <th className="text-left p-2">CONSTRAINTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, i) => (
                        <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                          <td className="p-2 border-r border-white/10 font-semibold">
                            {col.name}
                          </td>
                          <td className="p-2 border-r border-white/10">
                            {col.type}
                          </td>
                          <td className="p-2 border-r border-white/10">
                            {col.nullable ? 'YES' : 'NO'}
                          </td>
                          <td className="p-2 border-r border-white/10">
                            {col.default || '-'}
                          </td>
                          <td className="p-2">
                            <div className="flex space-x-1">
                              {col.isPrimaryKey && (
                                <span className="px-1 bg-yellow-600 text-black text-xs">PK</span>
                              )}
                              {col.isUnique && (
                                <span className="px-1 bg-blue-600 text-white text-xs">UQ</span>
                              )}
                              {col.isIndex && (
                                <span className="px-1 bg-green-600 text-white text-xs">IDX</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagement;