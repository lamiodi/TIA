import React from 'react';

const Button = ({
  label,
  variant = 'primary',
  size = 'medium',
  stateProp = 'default',
  className = '',
  divClassName = '',
  iconClassName = '', // ✅ added for icon customization
  showIcon = false,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-Secondarycolor text-Primarycolor',
    secondary: 'bg-Primarycolor text-Secondarycolor',
    tertiary:
      'bg-Secondarycolor text-Primarycolor outline-solid outline-0.5 outline-Primarycolor active:bg-Primarycolor active:text-Secondarycolor',
  };

  const sizeStyles = {
    small: 'h-8 px-2 py-1 text-sm',
    medium: 'h-10 px-4 py-2 text-base',
    large: 'h-12 px-6 py-3 text-lg',
  };

  const stateStyles = {
    default: '',
    hover: 'hover:bg-Accent',
    active: 'active:bg-gray-200',
  };

  const baseStyles =
    'flex justify-center items-center rounded-sm border-[unset] overflow-[unset]';

  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`size-6 ml-2 ${iconClassName}`} // ✅ supports custom icon styling
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
      />
    </svg>
  );

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${stateStyles[stateProp]} ${className}`}
      {...props}
    >
      <div
        className={`flex justify-center items-center font-[351] whitespace-nowrap ${divClassName}`}
      >
        {label}
        {showIcon && icon}
      </div>
    </button>
  );
};

export default Button;
