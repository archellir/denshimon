import { type FC } from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'cyber' | 'minimal';
}

const CustomCheckbox: FC<CustomCheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'cyber'
}) => {
  const sizeConfig = {
    sm: {
      box: 'w-4 h-4',
      check: 12,
      text: 'text-xs'
    },
    md: {
      box: 'w-5 h-5',
      check: 14,
      text: 'text-sm'
    },
    lg: {
      box: 'w-6 h-6',
      check: 16,
      text: 'text-base'
    }
  };

  const config = sizeConfig[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'cyber':
        return {
          container: 'relative group',
          box: `border-2 transition-all duration-200 cursor-pointer ${
            checked 
              ? 'border-green-400 bg-green-400/20' 
              : 'border-white/40 bg-black hover:border-green-400/60'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
          check: checked ? 'text-green-400' : 'text-transparent',
          label: `font-mono cursor-pointer transition-colors ${
            checked ? 'text-green-400' : 'text-white'
          } ${disabled ? 'cursor-not-allowed' : 'hover:text-green-400'}`
        };
      case 'minimal':
        return {
          container: 'relative',
          box: `border transition-colors cursor-pointer ${
            checked 
              ? 'border-white bg-white' 
              : 'border-white/40 bg-transparent hover:border-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
          check: checked ? 'text-black' : 'text-transparent',
          label: `font-mono cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`
        };
      default:
        return {
          container: 'relative',
          box: `border transition-colors cursor-pointer ${
            checked 
              ? 'border-green-400 bg-green-400/10' 
              : 'border-white/40 bg-transparent hover:border-green-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
          check: checked ? 'text-green-400' : 'text-transparent',
          label: `font-mono cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={variantClasses.container}>
        <div
          onClick={handleClick}
          className={`${config.box} ${variantClasses.box} flex items-center justify-center relative overflow-hidden`}
        >
          <Check 
            size={config.check} 
            className={`${variantClasses.check} transition-all duration-200 z-10`}
            strokeWidth={3}
          />
          {variant === 'cyber' && checked && (
            <>
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-green-400" />
              <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-green-400" />
              <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-green-400" />
              <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-green-400" />
            </>
          )}
        </div>
      </div>
      {label && (
        <label 
          htmlFor={id}
          onClick={handleClick}
          className={`${config.text} ${variantClasses.label} select-none`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default CustomCheckbox;