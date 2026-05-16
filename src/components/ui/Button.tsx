'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'none';
  size?: 'sm' | 'md' | 'lg' | 'none';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
  role?: string;
  id?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  href,
  type = 'button',
  disabled = false,
  ariaLabel,
  role,
  id,
  // ...rest props to allow data attributes and other standard attributes
  ...rest
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const baseStyles = 'inline-flex items-center font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all';

  const variants = {
    primary: 'justify-center bg-blue-400 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 hover:shadow-blue-600/40 hover:-translate-y-0.5 rounded-xl backdrop-blur-sm',
    secondary: 'justify-center bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-indigo-600/40 hover:-translate-y-0.5 rounded-xl backdrop-blur-sm',
    outline: 'justify-center border-2 border-blue-400 text-blue-400 bg-white/80 dark:bg-slate-900/80 hover:bg-blue-50 hover:-translate-y-0.5 shadow-sm rounded-xl backdrop-blur-sm',
    ghost: 'justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 rounded-xl',
    none: '',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-8 py-3 text-sm',
    lg: 'px-10 py-4 text-base tracking-wide',
    none: '',
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${size !== 'none' ? sizes[size] : ''} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={combinedClassName}
        onClick={onClick as any}
        aria-label={ariaLabel}
        role={role}
        id={id}
        {...rest as any}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick as any}
      disabled={disabled}
      className={combinedClassName}
      aria-label={ariaLabel}
      role={role}
      id={id}
      {...rest as any}
    >
      {children}
    </button>
  );
}
