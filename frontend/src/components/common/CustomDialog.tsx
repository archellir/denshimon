import { useState, useEffect, useRef } from 'react';
import type { FC, ReactNode } from 'react';
import { X, AlertTriangle, Info, CheckCircle, XCircle, LucideIcon } from 'lucide-react';
import useModalKeyboard from '@hooks/useModalKeyboard';

export type DialogVariant = 'default' | 'warning' | 'danger' | 'success' | 'info';

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: LucideIcon;
  showCloseButton?: boolean;
  preventClickOutside?: boolean;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  inputField?: {
    label: string;
    placeholder?: string;
    defaultValue?: string;
    type?: 'text' | 'number' | 'password';
    onChange?: (value: string) => void;
    value?: string;
    required?: boolean;
    min?: number;
    max?: number;
  };
}

const CustomDialog: FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  variant = 'default',
  icon: CustomIcon,
  showCloseButton = true,
  preventClickOutside = false,
  width = 'md',
  loading = false,
  inputField
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [inputValue, setInputValue] = useState(inputField?.value || inputField?.defaultValue || '');
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const variantConfig = {
    default: {
      borderColor: 'border-white',
      iconColor: 'text-white',
      buttonColor: 'border-green-400 text-green-400 hover:bg-green-400',
      icon: CustomIcon || Info
    },
    warning: {
      borderColor: 'border-yellow-400',
      iconColor: 'text-yellow-400',
      buttonColor: 'border-yellow-400 text-yellow-400 hover:bg-yellow-400',
      icon: CustomIcon || AlertTriangle
    },
    danger: {
      borderColor: 'border-red-400',
      iconColor: 'text-red-400',
      buttonColor: 'border-red-400 text-red-400 hover:bg-red-400',
      icon: CustomIcon || XCircle
    },
    success: {
      borderColor: 'border-green-400',
      iconColor: 'text-green-400',
      buttonColor: 'border-green-400 text-green-400 hover:bg-green-400',
      icon: CustomIcon || CheckCircle
    },
    info: {
      borderColor: 'border-cyan-400',
      iconColor: 'text-cyan-400',
      buttonColor: 'border-cyan-400 text-cyan-400 hover:bg-cyan-400',
      icon: CustomIcon || Info
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    if (inputField?.required && !inputValue) {
      return;
    }
    if (onConfirm) {
      await onConfirm();
    }
  };

  const canSubmit = !loading && (!inputField?.required || inputValue);

  const { createClickOutsideHandler, preventClickThrough } = useModalKeyboard({
    isOpen,
    onClose,
    onSubmit: handleConfirm,
    canSubmit: Boolean(onConfirm && canSubmit),
    modalId: 'custom-dialog'
  });

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      if (inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      setIsAnimating(false);
      setInputValue(inputField?.defaultValue || '');
    }
  }, [isOpen, inputField?.defaultValue]);

  useEffect(() => {
    if (inputField?.value !== undefined) {
      setInputValue(inputField.value);
    }
  }, [inputField?.value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    inputField?.onChange?.(value);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 transition-opacity ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={preventClickOutside ? undefined : createClickOutsideHandler(onClose)}
    >
      <div 
        id="custom-dialog"
        ref={dialogRef}
        className={`
          bg-black border-2 ${config.borderColor} p-6 ${widthClasses[width]} w-full mx-4
          transform transition-all duration-200 font-mono
          ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'}
          shadow-[0_0_30px_rgba(0,255,0,0.1)]
          relative overflow-hidden
        `}
        onClick={preventClickThrough}
      >
        {/* Animated corner accents */}
        <div className={`absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 ${config.borderColor}`} />
        <div className={`absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 ${config.borderColor}`} />
        <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 ${config.borderColor}`} />
        <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 ${config.borderColor}`} />

        {/* Scanning line effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50 animate-scan`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Icon size={24} className={`${config.iconColor} animate-pulse`} />
            <h3 className="text-xl font-bold text-white tracking-wider uppercase">
              {title}
            </h3>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 border border-white/30 text-white/60 hover:border-red-400 hover:text-red-400 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          {message && (
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {message}
            </p>
          )}
          
          {inputField && (
            <div className="mb-4">
              <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
                {inputField.label}
              </label>
              <input
                ref={inputRef}
                type={inputField.type || 'text'}
                value={inputValue}
                onChange={handleInputChange}
                placeholder={inputField.placeholder}
                min={inputField.min}
                max={inputField.max}
                className={`
                  w-full bg-black border ${config.borderColor} text-white px-3 py-2 
                  font-mono text-sm focus:outline-none focus:border-green-400
                  transition-colors
                `}
                disabled={loading}
              />
            </div>
          )}

          {children}
        </div>

        {/* Actions */}
        {(onConfirm || cancelText !== '') && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/20">
            {cancelText && (
              <button
                onClick={onClose}
                disabled={loading}
                className={`
                  px-4 py-2 border border-white/60 text-white/60 
                  hover:border-white hover:text-white 
                  transition-colors font-mono text-sm uppercase tracking-wider
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={handleConfirm}
                disabled={!canSubmit}
                className={`
                  px-6 py-2 border ${config.buttonColor} hover:text-black 
                  transition-colors font-mono text-sm uppercase tracking-wider
                  flex items-center space-x-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {loading && (
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                )}
                <span>{confirmText}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDialog;