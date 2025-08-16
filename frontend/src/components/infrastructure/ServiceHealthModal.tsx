import { useEffect, type FC, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ServiceHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const ServiceHealthModal: FC<ServiceHealthModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-black border border-white max-w-6xl w-full max-h-screen overflow-y-auto">
        <div className="p-4 border-b border-white flex items-center justify-between">
          <h3 className="font-mono text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ServiceHealthModal;