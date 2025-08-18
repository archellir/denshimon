import { type FC } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import CustomButton from './CustomButton';
import useModalKeyboard from '@hooks/useModalKeyboard';
import { ButtonColor, DialogIcon } from '@constants';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: ButtonColor;
  cancelLabel?: string;
  icon?: DialogIcon;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'CONFIRM',
  confirmColor = ButtonColor.RED,
  cancelLabel = 'CANCEL',
  icon = DialogIcon.WARNING
}) => {
  const { createClickOutsideHandler, preventClickThrough } = useModalKeyboard({
    isOpen,
    onClose,
    onSubmit: onConfirm,
    canSubmit: Boolean(onConfirm),
    modalId: 'confirm-dialog'
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={createClickOutsideHandler(onClose)}
    >
      <div 
        id="confirm-dialog"
        className="bg-black border border-white p-6 min-w-96 max-w-lg mx-4"
        onClick={preventClickThrough}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon === DialogIcon.WARNING && <AlertTriangle size={20} className="text-yellow-400" />}
            {icon === DialogIcon.DANGER && <AlertTriangle size={20} className="text-red-400" />}
            <h3 className="font-mono text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="font-mono text-sm opacity-80 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <CustomButton
            label={cancelLabel}
            onClick={onClose}
            color={ButtonColor.GRAY}
            className="w-auto px-4 py-2"
          />
          <CustomButton
            label={confirmLabel}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            color={confirmColor}
            className="w-auto px-4 py-2"
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;