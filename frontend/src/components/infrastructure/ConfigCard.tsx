import type { FC, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface ConfigCardItem {
  label: string;
  value: string | ReactNode;
  valueColor?: string;
}

interface ConfigCardButton {
  label: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'white';
  icon?: LucideIcon;
  variant?: 'full' | 'icon';
}

interface ConfigCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  items: ConfigCardItem[];
  buttons?: ConfigCardButton[];
  className?: string;
}

const ConfigCard: FC<ConfigCardProps> = ({
  title,
  icon: Icon,
  iconColor,
  items,
  buttons = [],
  className = ''
}) => {
  const getButtonClasses = (color: string, variant: string = 'full') => {
    const baseClasses = 'px-4 py-2 border transition-colors font-mono text-sm tracking-wider uppercase';
    
    if (variant === 'icon') {
      return `${baseClasses} border-white text-white hover:bg-white hover:text-black`;
    }
    
    const colorClasses = {
      blue: 'border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black',
      green: 'border-green-400 text-green-400 hover:bg-green-400 hover:text-black',
      white: 'border-white text-white hover:bg-white hover:text-black'
    };
    
    return `${baseClasses} ${colorClasses[color as keyof typeof colorClasses]}`;
  };

  return (
    <div className={`bg-black border border-white p-6 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <Icon size={20} className={iconColor} />
        <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">{title}</h3>
      </div>
      
      {/* Content - flex-1 pushes buttons to bottom */}
      <div className="flex-1 space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-300 font-mono tracking-wider">{item.label}</span>
            <div className={`text-sm font-mono tracking-wider ${item.valueColor || 'text-white'}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      
      {/* Buttons - fixed at bottom and centered */}
      {buttons.length > 0 && (
        <div className={`mt-4 flex justify-center ${buttons.length > 1 ? 'space-x-2' : ''}`}>
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className={`${getButtonClasses(button.color, button.variant)} ${
                button.variant === 'full' ? 'flex-1' : ''
              }`}
            >
              {button.icon && button.variant === 'icon' ? (
                <button.icon size={16} />
              ) : (
                button.label
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConfigCard;