import { useEffect } from 'react';

export interface UseModalKeyboardOptions {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Optional function to execute on Ctrl+Enter/Cmd+Enter */
  onSubmit?: () => void;
  /** Whether the submit action should be enabled (e.g., form is valid) */
  canSubmit?: boolean;
  /** Selector for the first focusable element (defaults to 'input, select, textarea, button') */
  focusSelector?: string;
  /** ID of the modal container for focus management */
  modalId?: string;
  /** Whether to prevent body scroll when modal is open (default: true) */
  preventBodyScroll?: boolean;
  /** Whether to enable click-outside-to-close (handled by parent component) */
  enableClickOutside?: boolean;
}

/**
 * Custom hook that provides consistent keyboard behavior for modals:
 * - ESC key to close
 * - Ctrl+Enter/Cmd+Enter to submit (if onSubmit provided)
 * - Auto-focus management
 * - Body scroll prevention
 * - Click-outside-to-close helpers
 * - Proper cleanup
 * 
 * @example
 * ```tsx
 * const MyModal = ({ isOpen, onClose }) => {
 *   const { createClickOutsideHandler, preventClickThrough } = useModalKeyboard({
 *     isOpen,
 *     onClose,
 *     onSubmit: handleSubmit,
 *     canSubmit: formIsValid,
 *     modalId: 'my-modal'
 *   });
 * 
 *   if (!isOpen) return null;
 * 
 *   return (
 *     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
 *          onClick={createClickOutsideHandler(onClose)}>
 *       <div id="my-modal" className="bg-white p-6" onClick={preventClickThrough}>
 *         <h2>My Modal</h2>
 *         <form onSubmit={handleSubmit}>
 *           <input type="text" />
 *           <button type="submit">Save (Ctrl+Enter)</button>
 *         </form>
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 */
export const useModalKeyboard = ({
  isOpen,
  onClose,
  onSubmit,
  canSubmit = true,
  focusSelector = 'input, select, textarea, button',
  modalId,
  preventBodyScroll = true
}: UseModalKeyboardOptions) => {
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC key to close modal
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      
      // Ctrl+Enter or Cmd+Enter to submit (if enabled)
      if (onSubmit && canSubmit && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onSubmit();
        return;
      }
    };

    if (isOpen) {
      // Add keyboard event listener
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus management - focus the first focusable element
      const timer = setTimeout(() => {
        let firstFocusable: HTMLElement | null = null;
        
        if (modalId) {
          // Use modal ID if provided
          firstFocusable = document.querySelector(`#${modalId} ${focusSelector}`) as HTMLElement;
        } else {
          // Fallback to any modal element
          firstFocusable = document.querySelector(`.fixed.inset-0 ${focusSelector}`) as HTMLElement;
        }
        
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }, 100);

      // Prevent body scroll when modal is open
      if (preventBodyScroll) {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          document.body.style.overflow = originalOverflow;
          clearTimeout(timer);
        };
      } else {
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          clearTimeout(timer);
        };
      }
    }
  }, [isOpen, onClose, onSubmit, canSubmit, focusSelector, modalId, preventBodyScroll]);

  /**
   * Helper function to create click-outside-to-close handler
   * Usage: onClick={createClickOutsideHandler(onClose)}
   */
  const createClickOutsideHandler = (closeModal: () => void) => 
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    };

  /**
   * Helper function to prevent event propagation for modal content
   * Usage: onClick={preventClickThrough}
   */
  const preventClickThrough = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return {
    createClickOutsideHandler,
    preventClickThrough
  };
};

export default useModalKeyboard;