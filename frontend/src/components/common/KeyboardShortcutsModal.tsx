import { useEffect } from 'react';
import type { FC } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsModal: FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['I'], description: 'Switch to Infrastructure tab' },
        { keys: ['W'], description: 'Switch to Workloads tab' },
        { keys: ['S'], description: 'Switch to Service Mesh tab' },
        { keys: ['D'], description: 'Switch to Deployments tab' },
        { keys: ['O'], description: 'Switch to Observability tab' },
      ]
    },
    {
      category: 'Search & Navigation',
      items: [
        { keys: ['Cmd', 'K'], description: 'Open global search' },
        { keys: ['Ctrl', 'K'], description: 'Open global search (Windows/Linux)' },
        { keys: ['↑', '↓'], description: 'Navigate search results' },
        { keys: ['Enter'], description: 'Select search result' },
        { keys: ['Escape'], description: 'Close global search' },
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['R'], description: 'Refresh current view' },
        { keys: ['Escape'], description: 'Clear local search/close modals' },
      ]
    },
    {
      category: 'Help',
      items: [
        { keys: ['?'], description: 'Show/hide this help modal' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black border border-white max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Keyboard size={20} />
            <h2 className="text-lg font-mono">KEYBOARD SHORTCUTS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:text-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="font-mono text-sm opacity-60 mb-3 uppercase tracking-wide">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center">
                          <kbd className="px-2 py-1 bg-white text-black font-mono text-xs border border-gray-300 rounded">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-xs opacity-60">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-sm opacity-80 text-right">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white bg-gray-900/20">
          <p className="font-mono text-xs opacity-60 text-center">
            Shortcuts are disabled when typing in input fields. Press <kbd className="px-1 bg-white text-black">Escape</kbd> to close this modal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;