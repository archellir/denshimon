import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { 
  Database, 
  Table, 
  Eye, 
  RefreshCw, 
  ChevronRight,
  ChevronDown,
  Search,
  BarChart3,
  Key,
  Hash,
  Type
} from 'lucide-react';
import useDatabaseStore from '@stores/databaseStore';
import { DatabaseStatus } from '@/types/database';

const DatabaseBrowser: FC = () => {
  const {
    connections,
    databases,
    tables,
    columns,
    isLoading,
    error,
    fetchConnections,
    fetchDatabases,
    fetchTables,
    fetchColumns
  } = useDatabaseStore();

  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set());
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyConnected, setShowOnlyConnected] = useState<boolean>(true);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const connectedConnections = connections.filter(conn => 
    showOnlyConnected ? conn.status === DatabaseStatus.CONNECTED : true
  ).filter(conn => 
    searchQuery === '' || 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.database.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConnectionToggle = (connectionId: string) => {
    const newExpanded = new Set(expandedConnections);
    if (newExpanded.has(connectionId)) {
      newExpanded.delete(connectionId);
    } else {
      newExpanded.add(connectionId);
      fetchDatabases(connectionId);
    }
    setExpandedConnections(newExpanded);
  };

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
  };

  const getConnectionDatabases = () => {
    return databases;
  };

  const getTablesByConnection = () => {
    return tables;
  };

  const selectedConnectionObj = connections.find(c => c.id === selectedConnection);

  if (error) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 font-mono text-lg">
            ERROR: {error}
          </div>
          <button
            onClick={() => fetchConnections()}
            className="px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-mono">DATABASE SCHEMA BROWSER</h2>
          <div className="text-sm font-mono opacity-60">
            {connectedConnections.length} DATABASE{connectedConnections.length !== 1 ? 'S' : ''}
          </div>
        </div>
        <button
          onClick={() => fetchConnections()}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 border border-white/20">
        <div className="flex items-center space-x-2 flex-1">
          <Search size={16} className="opacity-60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search databases and tables..."
            className="bg-transparent border-none outline-none flex-1 font-mono text-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="connected-only"
            checked={showOnlyConnected}
            onChange={(e) => setShowOnlyConnected(e.target.checked)}
            className="bg-black border-white"
          />
          <label htmlFor="connected-only" className="font-mono text-sm">
            CONNECTED ONLY
          </label>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Database Tree */}
        <div className="col-span-4 border border-white p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {connectedConnections.length === 0 ? (
              <div className="text-center py-8">
                <Database size={32} className="mx-auto opacity-40 mb-2" />
                <div className="text-sm font-mono opacity-60">
                  {showOnlyConnected ? 'No connected databases' : 'No databases found'}
                </div>
              </div>
            ) : (
              connectedConnections.map((connection) => (
                <div key={connection.id} className="space-y-1">
                  {/* Connection Level */}
                  <button
                    onClick={() => handleConnectionToggle(connection.id)}
                    className={`flex items-center space-x-2 w-full text-left p-2 hover:bg-white/10 transition-colors font-mono text-sm ${
                      selectedConnection === connection.id ? 'bg-white/20' : ''
                    }`}
                  >
                    {expandedConnections.has(connection.id) ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    <Database size={14} />
                    <span className="flex-1">{connection.name}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      connection.status === DatabaseStatus.CONNECTED ? 'bg-green-400' :
                      connection.status === DatabaseStatus.ERROR ? 'bg-red-400' :
                      connection.status === DatabaseStatus.CONNECTING ? 'bg-yellow-400' :
                      'bg-gray-400'
                    }`} />
                  </button>

                  {/* Database Level */}
                  {expandedConnections.has(connection.id) && (
                    <div className="ml-4 space-y-1">
                      {getConnectionDatabases().map((db) => (
                        <div key={db.name} className="space-y-1">
                          <button
                            onClick={() => handleDatabaseToggle(connection.id, db.name)}
                            className="flex items-center space-x-2 w-full text-left p-1 hover:bg-white/10 transition-colors font-mono text-xs"
                          >
                            {expandedDatabases.has(`${connection.id}:${db.name}`) ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                            <Database size={12} />
                            <span className="flex-1">{db.name}</span>
                            <span className="opacity-60">({db.tableCount})</span>
                          </button>

                          {/* Table Level */}
                          {expandedDatabases.has(`${connection.id}:${db.name}`) && (
                            <div className="ml-4 space-y-1">
                              {getTablesByConnection().map((table) => (
                                <button
                                  key={table.name}
                                  onClick={() => handleTableSelect(connection.id, db.name, table.name)}
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
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Schema Details */}
        <div className="col-span-8">
          {selectedTable && selectedConnectionObj ? (
            <div className="space-y-4">
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
                  <button className="flex items-center space-x-1 px-3 py-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-xs">
                    <Eye size={12} />
                    <span>VIEW DATA</span>
                  </button>
                  <button className="flex items-center space-x-1 px-3 py-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-xs">
                    <BarChart3 size={12} />
                    <span>ANALYZE</span>
                  </button>
                </div>
              </div>

              {/* Table Info */}
              <div className="grid grid-cols-4 gap-4">
                <div className="border border-white p-3">
                  <div className="text-xs font-mono opacity-60">ROWS</div>
                  <div className="text-lg font-mono">
                    {tables.find(t => t.name === selectedTable)?.rowCount.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="border border-white p-3">
                  <div className="text-xs font-mono opacity-60">SIZE</div>
                  <div className="text-lg font-mono">
                    {((tables.find(t => t.name === selectedTable)?.size || 0) / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div className="border border-white p-3">
                  <div className="text-xs font-mono opacity-60">COLUMNS</div>
                  <div className="text-lg font-mono">{columns.length}</div>
                </div>
                <div className="border border-white p-3">
                  <div className="text-xs font-mono opacity-60">TYPE</div>
                  <div className="text-lg font-mono">
                    {tables.find(t => t.name === selectedTable)?.type.toUpperCase() || 'TABLE'}
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
          ) : (
            <div className="border border-white/20 p-8 text-center">
              <Database size={48} className="mx-auto opacity-40 mb-4" />
              <h3 className="text-lg font-mono mb-2">SELECT A TABLE</h3>
              <p className="text-sm font-mono opacity-60">
                Choose a table from the database tree to view its schema and structure
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseBrowser;