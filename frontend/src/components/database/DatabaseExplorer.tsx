import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { 
  Database, 
  Table, 
  ChevronRight,
  ChevronDown,
  Search,
  Eye,
  Play,
  Save,
  FileText,
  Copy,
  Download,
  Settings,
  Activity,
  Hash,
  Key,
  Type,
  Maximize2,
  Minimize2,
  History,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import useDatabaseStore from '@stores/databaseStore';
import { DatabaseStatus } from '@/types/database';
import CustomSelector from '@components/common/CustomSelector';
import CustomButton from '@components/common/CustomButton';
import CustomCheckbox from '@components/common/CustomCheckbox';
import { mockQueryHistory } from '@mocks/database/queries';

type ExplorerTab = 'schema' | 'data' | 'query' | 'saved';

interface DatabaseExplorerProps {
  preselectedConnectionId?: string;
}

const DatabaseExplorer: FC<DatabaseExplorerProps> = ({ preselectedConnectionId }) => {
  const {
    connections,
    databases,
    tables,
    columns,
    queryResults,
    savedQueries,
    isLoading,
    error,
    fetchConnections,
    fetchDatabases,
    fetchTables,
    fetchColumns,
    executeQuery,
    clearQueryResults,
    fetchSavedQueries,
    createSavedQuery,
    deleteSavedQuery
  } = useDatabaseStore();

  // Left panel state
  const [selectedConnection, setSelectedConnection] = useState<string>(() => {
    // Check for preselected connection first, then localStorage
    if (preselectedConnectionId) return preselectedConnectionId;
    return localStorage.getItem('denshimon_last_database_connection') || '';
  });
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyConnected, setShowOnlyConnected] = useState<boolean>(true);

  // Right panel state
  const [activeTab, setActiveTab] = useState<ExplorerTab>('schema');
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [queryName, setQueryName] = useState<string>('');
  const [queryLimit, setQueryLimit] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    fetchConnections();
    fetchSavedQueries();
  }, [fetchConnections, fetchSavedQueries]);

  // Handle preselected connection
  useEffect(() => {
    if (preselectedConnectionId && preselectedConnectionId !== selectedConnection) {
      setSelectedConnection(preselectedConnectionId);
      setSelectedDatabase('');
      setSelectedTable('');
    }
  }, [preselectedConnectionId, selectedConnection]);

  // Save selected connection to localStorage
  useEffect(() => {
    if (selectedConnection) {
      localStorage.setItem('denshimon_last_database_connection', selectedConnection);
      // Auto-fetch databases for the selected connection
      fetchDatabases(selectedConnection);
    }
  }, [selectedConnection, fetchDatabases]);

  const connectedConnections = connections.filter(conn => 
    showOnlyConnected ? conn.status === DatabaseStatus.CONNECTED : true
  ).filter(conn => 
    searchQuery === '' || 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.database.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDatabaseToggle = (connectionId: string, databaseName: string) => {
    const dbKey = `${connectionId}:${databaseName}`;
    const newExpanded = new Set(expandedDatabases);
    if (newExpanded.has(dbKey)) {
      newExpanded.delete(dbKey);
    } else {
      newExpanded.add(dbKey);
      fetchTables(connectionId, databaseName);
    }
    setExpandedDatabases(newExpanded);
  };

  const handleTableSelect = (connectionId: string, databaseName: string, tableName: string) => {
    setSelectedConnection(connectionId);
    setSelectedDatabase(databaseName);
    setSelectedTable(tableName);
    fetchColumns(connectionId, databaseName, tableName);
    
    // Auto-generate SELECT query for the table
    const autoQuery = `SELECT * FROM ${tableName} LIMIT ${queryLimit}`;
    setSqlQuery(autoQuery);
    
    // Switch to schema tab to show table details
    setActiveTab('schema');
  };

  const handleExecuteQuery = () => {
    if (!selectedConnection || !sqlQuery.trim()) return;
    executeQuery(selectedConnection, sqlQuery, queryLimit);
    setActiveTab('data'); // Switch to data tab to show results
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
    setActiveTab('query');
  };

  const loadHistoryQuery = (sql: string) => {
    setSqlQuery(sql);
    setActiveTab('query');
    setShowHistory(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const selectedConnectionObj = connections.find(c => c.id === selectedConnection);

  const renderLeftPanel = () => (
    <div className="w-80 flex-shrink-0 border-r border-white/20 flex flex-col" style={{ minHeight: '500px' }}>
      {/* Connection Selector */}
      <div className="p-4 border-b border-white/20">
        <CustomSelector
          value={selectedConnection}
          options={connectedConnections.map(conn => ({
            value: conn.id,
            label: `${conn.name} (${conn.type.toUpperCase()})`
          }))}
          onChange={(value) => {
            setSelectedConnection(value);
            setSelectedDatabase('');
            setSelectedTable('');
          }}
          placeholder="Select Database Connection"
          icon={Database}
          size="md"
          className="w-full"
        />
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center space-x-2 mb-3">
          <Search size={16} className="opacity-60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search databases and tables..."
            className="bg-transparent border-none outline-none flex-1 font-mono text-sm"
          />
        </div>
        <CustomCheckbox
          id="connected-only"
          checked={showOnlyConnected}
          onChange={setShowOnlyConnected}
          label="CONNECTED ONLY"
          variant="cyber"
          size="sm"
        />
      </div>

      {/* Database Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedConnection ? (
          <div className="text-center py-8">
            <Database size={32} className="mx-auto opacity-40 mb-2" />
            <div className="text-sm font-mono opacity-60">
              Select a connection to browse
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {databases.map((db) => (
              <div key={db.name} className="space-y-1">
                <button
                  onClick={() => handleDatabaseToggle(selectedConnection, db.name)}
                  className="flex items-center space-x-2 w-full text-left p-1 hover:bg-white/10 transition-colors font-mono text-xs"
                >
                  {expandedDatabases.has(`${selectedConnection}:${db.name}`) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  <Database size={12} />
                  <span className="flex-1">{db.name}</span>
                  <span className="opacity-60">({db.tableCount})</span>
                </button>

                {/* Tables */}
                {expandedDatabases.has(`${selectedConnection}:${db.name}`) && (
                  <div className="ml-4 space-y-1">
                    {tables.map((table) => (
                      <button
                        key={table.name}
                        onClick={() => handleTableSelect(selectedConnection, db.name, table.name)}
                        className={`flex items-center space-x-2 w-full text-left p-1 hover:bg-white/10 transition-colors font-mono text-xs ${
                          selectedTable === table.name && selectedDatabase === db.name ? 'bg-white/20' : ''
                        }`}
                      >
                        <Table size={10} />
                        <span className="flex-1">{table.name}</span>
                        <span className="opacity-60">({table.rowCount})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRightPanel = () => (
    <div className={`flex-1 flex flex-col ${isFullscreen ? 'w-full' : ''}`}>
      {/* Tab Navigation */}
      <div className="flex justify-between items-center border-b border-white/20">
        <div className="flex">
          {[
            { id: 'schema', label: 'SCHEMA', icon: Table },
            { id: 'data', label: 'DATA', icon: Eye },
            { id: 'query', label: 'QUERY', icon: Play },
            { id: 'saved', label: 'SAVED', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ExplorerTab)}
              className={`flex items-center space-x-2 px-4 py-3 font-mono text-sm transition-colors border-r border-white/20 last:border-r-0 ${
                activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Fullscreen and History toggles */}
        <div className="flex items-center space-x-2 px-4">
          {activeTab === 'query' && (
            <CustomButton
              icon={History}
              onClick={() => setShowHistory(!showHistory)}
              color={showHistory ? "white" : "gray"}
              className="w-auto px-2 py-1"
              title="Query History"
            />
          )}
          <CustomButton
            icon={isFullscreen ? Minimize2 : Maximize2}
            onClick={() => setIsFullscreen(!isFullscreen)}
            color="white"
            className="w-auto px-2 py-1"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4" style={{ maxHeight: isFullscreen ? 'calc(100vh - 80px)' : 'calc(100vh - 200px)' }}>
        {activeTab === 'schema' && renderSchemaTab()}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'query' && renderQueryTab()}
        {activeTab === 'saved' && renderSavedTab()}
      </div>
    </div>
  );

  const renderSchemaTab = () => {
    if (!selectedTable || !selectedConnectionObj) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Table size={48} className="mx-auto opacity-40 mb-4" />
            <h3 className="text-lg font-mono mb-2">SELECT A TABLE</h3>
            <p className="text-sm font-mono opacity-60">
              Choose a table from the database tree to view its schema
            </p>
          </div>
        </div>
      );
    }

    const table = tables.find(t => t.name === selectedTable);

    return (
      <div className="space-y-6">
        {/* Table Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Table size={20} />
            <div>
              <h3 className="text-lg font-mono">{selectedTable}</h3>
              <p className="text-sm font-mono opacity-60">
                {selectedConnectionObj.name} • {selectedDatabase}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CustomButton
              label="VIEW DATA"
              icon={Eye}
              onClick={() => {
                if (selectedConnection && selectedTable) {
                  const query = `SELECT * FROM ${selectedTable} LIMIT ${queryLimit}`;
                  setSqlQuery(query);
                  executeQuery(selectedConnection, query, queryLimit);
                  setActiveTab('data');
                }
              }}
              color="blue"
              className="w-auto"
            />
            <CustomButton
              label="QUERY TABLE"
              icon={Play}
              onClick={() => {
                if (selectedTable) {
                  setSqlQuery(`SELECT * FROM ${selectedTable} LIMIT ${queryLimit}`);
                  setActiveTab('query');
                }
              }}
              color="green"
              className="w-auto"
            />
          </div>
        </div>

        {/* Table Info */}
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-white p-3">
            <div className="text-xs font-mono opacity-60">ROWS</div>
            <div className="text-lg font-mono">
              {table?.rowCount.toLocaleString() || '0'}
            </div>
          </div>
          <div className="border border-white p-3">
            <div className="text-xs font-mono opacity-60">SIZE</div>
            <div className="text-lg font-mono">
              {((table?.size || 0) / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <div className="border border-white p-3">
            <div className="text-xs font-mono opacity-60">COLUMNS</div>
            <div className="text-lg font-mono">{columns.length}</div>
          </div>
          <div className="border border-white p-3">
            <div className="text-xs font-mono opacity-60">TYPE</div>
            <div className="text-lg font-mono">
              {table?.type.toUpperCase() || 'TABLE'}
            </div>
          </div>
        </div>

        {/* Column Schema */}
        <div className="border border-white">
          <div className="bg-white/5 p-3 border-b border-white">
            <h4 className="font-mono text-sm">COLUMN SCHEMA</h4>
          </div>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-xs font-mono">
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
                    <td className="p-2 border-r border-white/10">
                      <div className="flex items-center space-x-2">
                        {col.isPrimaryKey ? (
                          <Key size={10} className="text-yellow-400" />
                        ) : col.isIndex ? (
                          <Hash size={10} className="text-blue-400" />
                        ) : (
                          <Type size={10} className="opacity-60" />
                        )}
                        <span className={col.isPrimaryKey ? 'font-semibold' : ''}>{col.name}</span>
                      </div>
                    </td>
                    <td className="p-2 border-r border-white/10">{col.type}</td>
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
    );
  };

  const renderDataTab = () => {
    if (!queryResults) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Eye size={48} className="mx-auto opacity-40 mb-4" />
            <h3 className="text-lg font-mono mb-2">NO DATA</h3>
            <p className="text-sm font-mono opacity-60">
              Execute a query to view data or select a table and click "VIEW DATA"
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-sm">QUERY RESULTS</h4>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono opacity-60">
              {queryResults.rowCount} rows • {queryResults.duration}ms
            </span>
            <CustomButton
              label="EXPORT CSV"
              icon={Download}
              onClick={() => {
                // Export functionality would go here
                console.log('Export CSV functionality');
              }}
              color="white"
              className="w-auto"
            />
          </div>
        </div>

        {queryResults.error ? (
          <div className="p-4 text-red-400 font-mono text-sm border border-red-400 bg-red-900/20">
            ERROR: {queryResults.error}
          </div>
        ) : (
          <div className="border border-white overflow-auto" style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '400px', width: '100%' }}>
            <table className="text-sm font-mono w-full table-fixed">
              <thead className="bg-white/10 sticky top-0">
                <tr>
                  {queryResults.columns.map((col, i) => (
                    <th key={i} className="text-left p-2 border-r border-white/20 last:border-r-0 bg-white/10 whitespace-nowrap" style={{ width: `${Math.max(8, 100 / queryResults.columns.length)}%` }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryResults.rows.map((row, i) => (
                  <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                    {row.map((cell, j) => (
                      <td key={j} className="p-2 border-r border-white/10 last:border-r-0 whitespace-nowrap text-ellipsis overflow-hidden">
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
    );
  };

  const renderQueryTab = () => (
    <div className={`space-y-4 ${showHistory ? 'grid grid-cols-3 gap-4' : ''}`}>
      <div className={`space-y-4 ${showHistory ? 'col-span-2' : ''}`}>
        {/* Query Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-sm">SQL QUERY EDITOR</h4>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <label className="font-mono text-xs">LIMIT:</label>
              <input
                type="number"
                value={queryLimit}
                onChange={(e) => setQueryLimit(parseInt(e.target.value) || 100)}
                className="bg-black border border-white px-2 py-2 font-mono text-xs w-20 focus:outline-none focus:border-green-400"
                min="1"
                max="10000"
              />
            </div>
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

        {/* SQL Editor */}
        <textarea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          placeholder="-- Enter your SQL query here
SELECT * FROM users LIMIT 10;"
          className={`w-full bg-black border border-white p-4 font-mono text-sm focus:outline-none focus:border-green-400 resize-none ${
            isFullscreen ? 'h-64' : 'h-32'
          }`}
        />

        {/* Query Actions */}
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

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-red-400 bg-red-900/20 text-red-400 font-mono text-sm">
            ERROR: {error}
          </div>
        )}
      </div>

      {/* Query History Panel */}
      {showHistory && (
        <div className="col-span-1 border border-white">
          <div className="bg-white/5 p-3 border-b border-white">
            <h4 className="font-mono text-sm">QUERY HISTORY</h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
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
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSavedTab = () => (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-sm">SAVED QUERIES</h4>
          <span className="text-xs font-mono opacity-60">{savedQueries.length} queries</span>
        </div>

        {savedQueries.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText size={48} className="mx-auto opacity-40 mb-4" />
            <h3 className="text-lg font-mono mb-2">NO SAVED QUERIES</h3>
            <p className="text-sm font-mono opacity-60">
              Save frequently used queries for quick access
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {savedQueries.map((query) => (
            <div key={query.id} className="border border-white/20 p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => loadSavedQuery(query.sql)}
                  className="text-left flex-1"
                >
                  <div className="font-mono text-sm font-semibold">{query.name}</div>
                  <div className="font-mono text-xs opacity-60 truncate mt-1">
                    {query.sql.substring(0, 100)}...
                  </div>
                </button>
                <div className="flex items-center space-x-2">
                  <CustomButton
                    icon={Copy}
                    onClick={() => copyToClipboard(query.sql)}
                    color="white"
                    className="w-auto px-1 py-1"
                    title="Copy SQL"
                  />
                  <CustomButton
                    icon={Play}
                    onClick={() => {
                      setSqlQuery(query.sql);
                      setActiveTab('query');
                    }}
                    color="green"
                    className="w-auto px-1 py-1"
                    title="Load Query"
                  />
                  <CustomButton
                    icon={Settings}
                    onClick={() => {
                      // Settings functionality placeholder
                      console.log('Query settings for:', query.id);
                    }}
                    color="white"
                    className="w-auto px-1 py-1"
                    title="Query Settings"
                  />
                  <CustomButton
                    icon={Trash2}
                    onClick={async () => {
                      try {
                        await deleteSavedQuery(query.id);
                      } catch (error) {
                        console.error('Failed to delete query:', error);
                      }
                    }}
                    color="red"
                    className="w-auto px-1 py-1"
                    title="Delete Query"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 font-mono text-lg">
            ERROR: {error}
          </div>
          <CustomButton
            label="RETRY"
            onClick={() => fetchConnections()}
            color="red"
            className="mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      {!isFullscreen && renderLeftPanel()}
      {renderRightPanel()}
    </div>
  );
};

export default DatabaseExplorer;