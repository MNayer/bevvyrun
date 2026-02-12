import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  // Neobrutalism Base Styles: Black border, hard shadow, no rounded corners, bold text
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-bold border-2 border-black focus:outline-none transition-all duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    // Primary: Vibrant Violet/Blue with black text
    primary: "bg-[#8b5cf6] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#7c3aed]",
    // Secondary: White with black text
    secondary: "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50",
    // Danger: Red
    danger: "bg-[#ef4444] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#dc2626]",
    // Ghost: Transparent but keeps border/style for consistency in this design system, or minimal
    ghost: "border-transparent bg-transparent text-black hover:bg-black/5 hover:border-black/10 active:shadow-none active:translate-y-0 active:translate-x-0"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};