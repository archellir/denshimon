import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { 
  Search, 
  Command, 
  ArrowUp, 
  ArrowDown, 
  CornerDownLeft,
  Clock,
  Database,
  Server,
  Globe,
  Box,
  Network,
  Layers
} from 'lucide-react';
import useGlobalSearchStore, { SearchResult } from '@stores/globalSearchStore';

const GlobalSearch: FC = () => {
  const {
    isOpen,
    query,
    results,
    isSearching,
    recentSearches,
    closeSearch,
    setQuery,
    search,
    selectResult,
    clearRecentSearches
  } = useGlobalSearchStore();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useGlobalSearchStore.getState().openSearch();
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          Math.min(prev + 1, (query ? results.length : recentSearches.length) - 1)
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      
      case 'Enter':
        e.preventDefault();
        if (query && results.length > 0) {
          selectResult(results[selectedIndex]);
        } else if (!query && recentSearches.length > 0) {
          setQuery(recentSearches[selectedIndex]);
        }
        break;
    }
  };

  // Scroll selected result into view
  useEffect(() => {
    if (resultRefs.current[selectedIndex]) {
      resultRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  const getResourceIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'pod':
        return <Box size={16} className="text-blue-400" />;
      case 'node':
        return <Server size={16} className="text-green-400" />;
      case 'service':
        return <Globe size={16} className="text-purple-400" />;
      case 'namespace':
        return <Layers size={16} className="text-yellow-400" />;
      case 'deployment':
        return <Database size={16} className="text-cyan-400" />;
      case 'endpoint':
        return <Network size={16} className="text-orange-400" />;
      default:
        return <Box size={16} className="text-gray-400" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-green-400 text-black font-semibold">
          {part}
        </mark>
      ) : part
    );
  };

  const displayItems = query ? results : recentSearches.map(search => ({
    type: 'recent' as const,
    name: search,
    id: search
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center pt-[20vh]">
      <div className="bg-black border border-white w-full max-w-2xl max-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-white/20">
          <Search size={20} className="text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pods, nodes, services, namespaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none font-mono"
          />
          {isSearching && (
            <div className="text-xs text-gray-400 font-mono">SEARCHING...</div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {displayItems.length === 0 ? (
            <div className="p-8 text-center">
              {query ? (
                <div className="space-y-2">
                  <div className="text-gray-400 font-mono text-sm">NO RESULTS FOUND</div>
                  <div className="text-gray-500 font-mono text-xs">
                    Try searching for pods, nodes, services, or namespaces
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-400 font-mono text-sm">START TYPING TO SEARCH</div>
                  <div className="text-gray-500 font-mono text-xs">
                    Search across all Kubernetes resources
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {!query && recentSearches.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-xs font-mono text-gray-400 uppercase">Recent Searches</div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs font-mono text-gray-500 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              )}
              
              {displayItems.map((item, index) => {
                const isRecent = 'type' in item && item.type === 'recent';
                const result = item as SearchResult;
                
                return (
                  <div
                    key={item.id}
                    ref={el => { resultRefs.current[index] = el; }}
                    onClick={() => {
                      if (isRecent) {
                        setQuery(item.name);
                      } else {
                        selectResult(result);
                      }
                    }}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      selectedIndex === index 
                        ? 'bg-white text-black' 
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {isRecent ? (
                        <Clock size={16} className="text-gray-400 flex-shrink-0" />
                      ) : (
                        <div className="flex-shrink-0">
                          {getResourceIcon(result.type)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm truncate">
                          {isRecent ? (
                            item.name
                          ) : (
                            highlightMatch(result.name, query)
                          )}
                        </div>
                        {!isRecent && result.description && (
                          <div className="text-xs opacity-60 truncate">
                            {result.description}
                          </div>
                        )}
                        {!isRecent && result.namespace && (
                          <div className="text-xs opacity-60">
                            namespace: {result.namespace}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {!isRecent && (
                        <div className="text-xs font-mono opacity-60 uppercase">
                          {result.type}
                        </div>
                      )}
                      <CornerDownLeft size={12} className="opacity-40" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-white/20 text-xs font-mono text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <ArrowUp size={12} />
              <ArrowDown size={12} />
              <span>Navigate</span>
            </div>
            <div className="flex items-center space-x-1">
              <CornerDownLeft size={12} />
              <span>Select</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">ESC</kbd>
              <span>Close</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Command size={12} />
            <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">K</kbd>
            <span>Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;