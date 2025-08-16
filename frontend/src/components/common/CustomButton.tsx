import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';

interface CustomButtonProps {
  label?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'white';
  disabled?: boolean;
  className?: string;
  title?: string;
}

const CustomButton: FC<CustomButtonProps> = ({
  label,
  icon: Icon,
  onClick,
  color = 'white',
  disabled = false,
  className = '',
  title
}) => {
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black',
      green: 'border-green-500 text-green-500 hover:bg-green-500 hover:text-black',
      red: 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black',
      yellow: 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black',
      gray: 'border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-black',
      white: 'border-white text-white hover:bg-white hover:text-black'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.white;
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