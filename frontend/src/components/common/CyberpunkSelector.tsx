import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

export interface SelectorOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface CyberpunkSelectorProps {
  value: string;
  options: SelectorOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  iconSize?: number;
  className?: string;
  disabled?: boolean;
  maxHeight?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
  showPulse?: boolean;
}

const CyberpunkSelector: FC<CyberpunkSelectorProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  icon: Icon,
  iconSize,
  className = '',
  disabled = false,
  maxHeight = 'max-h-64',
  size = 'md',
  variant = 'default',
  showPulse = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  // Size configurations
  const sizeConfig = {
    xs: {
      button: 'px-2 py-1 text-xs',
      dropdown: 'px-2 py-1 text-xs',
      icon: iconSize || 10,
      chevron: 12
    },
    sm: {
      button: 'px-3 py-2 text-sm',
      dropdown: 'px-3 py-2 text-sm',
      icon: iconSize || 12,
      chevron: 14
    },
    md: {
      button: 'px-4 py-3 text-sm',
      dropdown: 'px-4 py-3 text-sm',
      icon: iconSize || 16,
      chevron: 16
    },
    lg: {
      button: 'px-6 py-4 text-base',
      dropdown: 'px-6 py-4 text-base',
      icon: iconSize || 20,
      chevron: 20
    }
  };

  const config = sizeConfig[size];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const renderOptionContent = (option: SelectorOption, isSelected: boolean) => {
    if (variant === 'detailed' && option.description) {
      return (
        <div>
          <div className={`font-semibold ${isSelected ? 'text-green-400' : ''}`}>
            {option.label}
          </div>
          <div className="text-xs opacity-60">{option.description}</div>
        </div>
      );
    }
    return <span>{option.label}</span>;
  };

  const renderSelectedContent = () => {
    if (selectedOption) {
      if (variant === 'detailed' && selectedOption.description) {
        return (
          <div className="text-left">
            <div className="font-semibold">{selectedOption.label}</div>
            <div className="text-xs opacity-60">{selectedOption.description}</div>
          </div>
        );
      }
      return <span>{selectedOption.label}</span>;
    }
    return <span className="opacity-60">{placeholder}</span>;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full bg-black border border-white text-white font-mono 
          focus:outline-none focus:border-green-400 hover:border-green-400 
          transition-colors flex items-center justify-between
          ${config.button}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-green-400' : ''}
        `}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {Icon && (
            <Icon 
              size={config.icon} 
              className={`${selectedOption ? 'text-green-400' : 'opacity-60'} flex-shrink-0`} 
            />
          )}
          <div className="flex-1 min-w-0 overflow-hidden">
            {renderSelectedContent()}
          </div>
        </div>
        {!disabled && (
          <div className="flex-shrink-0 ml-2">
            {isOpen ? (
              <ChevronUp size={config.chevron} className="text-green-400" />
            ) : (
              <ChevronDown size={config.chevron} className="opacity-60" />
            )}
          </div>
        )}
      </button>

      {isOpen && !disabled && (
        <div className={`absolute top-full left-0 right-0 z-50 bg-black border border-white border-t-0 ${maxHeight} overflow-y-auto`}>
          {/* Empty option for clearing selection */}
          {placeholder && (
            <button
              onClick={() => handleSelect('')}
              className={`w-full text-left font-mono hover:bg-white/10 transition-colors flex items-center border-b border-white/20 ${config.dropdown}`}
            >
              <div className="flex items-center space-x-2">
                {Icon && <Icon size={config.icon} className="opacity-60" />}
                <span className="opacity-60">{placeholder}</span>
              </div>
            </button>
          )}

          {/* Options */}
          {options.map((option) => {
            const isSelected = option.value === value;
            const isDisabled = option.disabled;
            
            return (
              <button
                key={option.value}
                onClick={() => !isDisabled && handleSelect(option.value)}
                disabled={isDisabled}
                className={`
                  w-full text-left font-mono transition-colors flex items-center justify-between 
                  border-b border-white/10 last:border-b-0
                  ${config.dropdown}
                  ${isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-green-400/20 cursor-pointer'
                  }
                  ${isSelected ? 'bg-green-400/10 text-green-400' : ''}
                `}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {Icon && (
                    <Icon 
                      size={config.icon} 
                      className={`${isSelected || !isDisabled ? 'text-green-400' : 'opacity-40'} flex-shrink-0`} 
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {renderOptionContent(option, isSelected)}
                  </div>
                </div>
                {showPulse && !isDisabled && (
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CyberpunkSelector;