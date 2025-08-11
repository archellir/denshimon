import { useEffect, useCallback } from 'react';

interface KeyboardNavigationConfig {
  onTabSwitch?: (tabId: string) => void;
  onRefresh?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
  disabled?: boolean;
}

export const useKeyboardNavigation = (config: KeyboardNavigationConfig) => {
  const {
    onTabSwitch,
    onRefresh,
    onSearch,
    onEscape,
    onEnter,
    disabled = false
  } = config;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts if disabled or if user is typing in an input/textarea
    if (disabled || isInputFocused()) {
      // Allow Escape even when input is focused to clear/close
      if (event.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }
      // Allow Ctrl/Cmd+F even when input is focused for search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f' && onSearch) {
        event.preventDefault();
        onSearch();
        return;
      }
      // Allow Enter when input is focused to apply search/filter
      if (event.key === 'Enter' && onEnter) {
        onEnter();
        return;
      }
      return;
    }

    // Primary tab navigation (only when not in input)
    switch (event.key.toLowerCase()) {
      case 'i':
        event.preventDefault();
        onTabSwitch?.('infrastructure');
        break;
      case 'w':
        event.preventDefault();
        onTabSwitch?.('workloads');
        break;
      case 's':
        event.preventDefault();
        onTabSwitch?.('mesh');
        break;
      case 'd':
        event.preventDefault();
        onTabSwitch?.('deployments');
        break;
      case 'o':
        event.preventDefault();
        onTabSwitch?.('observability');
        break;
      case 'r':
        event.preventDefault();
        onRefresh?.();
        break;
      case '/':
        event.preventDefault();
        onSearch?.();
        break;
      case 'f':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onSearch?.();
        }
        break;
      case 'escape':
        onEscape?.();
        break;
      case 'enter':
        onEnter?.();
        break;
    }
  }, [onTabSwitch, onRefresh, onSearch, onEscape, onEnter, disabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Helper function to check if an input element is currently focused
const isInputFocused = (): boolean => {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  
  const tagName = activeElement.tagName.toLowerCase();
  const inputTypes = ['input', 'textarea', 'select'];
  
  // Check if it's an input element
  if (inputTypes.includes(tagName)) {
    return true;
  }
  
  // Check if it's a contenteditable element
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }
  
  // Check if it's inside a search input (by checking for search-related classes/attributes)
  if (activeElement.closest('[role="search"]') || 
      activeElement.closest('.search-input') ||
      activeElement.closest('input[type="search"]')) {
    return true;
  }
  
  return false;
};

export default useKeyboardNavigation;