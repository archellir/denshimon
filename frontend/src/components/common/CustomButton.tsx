import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ButtonColor, BUTTON_COLORS } from '@constants';

interface CustomButtonProps {
  label?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  color?: ButtonColor;
  disabled?: boolean;
  className?: string;
  title?: string;
}

const CustomButton: FC<CustomButtonProps> = ({
  label,
  icon: Icon,
  onClick,
  color = ButtonColor.WHITE,
  disabled = false,
  className = '',
  title
}) => {
  const getColorClasses = (color: ButtonColor): string => {
    return BUTTON_COLORS[color] || BUTTON_COLORS[ButtonColor.WHITE];
  };

  const isIconOnly = !label || label === '';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center ${isIconOnly ? '' : 'space-x-2'} ${isIconOnly ? 'px-2' : 'px-4'} py-2 border font-mono text-xs transition-all ${isIconOnly ? 'w-auto' : 'w-28'} justify-center ${getColorClasses(color)} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {!isIconOnly && <span>{label}</span>}
    </button>
  );
};

export default CustomButton;