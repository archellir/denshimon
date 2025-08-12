import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  onFilter?: () => void;
  debounceMs?: number;
  showFilter?: boolean;
  className?: string;
}

const SearchBar: FC<SearchBarProps> = ({ 
  placeholder = 'Search...',
  value: externalValue = '',
  onChange,
  onFilter,
  debounceMs = 300,
  showFilter = false,
  className = ''
}) => {
  const [internalValue, setInternalValue] = useState(externalValue);

  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== externalValue) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, externalValue, onChange, debounceMs]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative flex-1">
        <Search 
          size={16} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40"
        />
        <input
          type="text"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-black border border-white/20 text-white font-mono text-sm placeholder-white/40 focus:outline-none focus:border-green-400 transition-colors"
        />
        {internalValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {showFilter && (
        <button
          onClick={onFilter}
          className="p-2 border border-white/20 hover:bg-white hover:text-black transition-colors"
        >
          <Filter size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;