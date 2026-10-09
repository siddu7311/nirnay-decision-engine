import React from 'react';

// ---- Card ----
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`px-5 py-4 border-b border-gray-100 ${className}`} {...props}>{children}</div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`px-5 py-4 ${className}`} {...props}>{children}</div>
);

// ---- Badge ----
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'indigo' | 'gray';
const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger:  'bg-red-100 text-red-800',
  indigo:  'bg-indigo-100 text-indigo-800',
  gray:    'bg-gray-100 text-gray-500',
};
export const Badge: React.FC<{ variant?: BadgeVariant; children: React.ReactNode; className?: string }> = ({
  variant = 'default',
  children,
  className = '',
}) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${badgeStyles[variant]} ${className}`}>
    {children}
  </span>
);

// ---- Button ----
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
const btnStyles: Record<ButtonVariant, string> = {
  primary:   'bg-indigo-700 text-white hover:bg-indigo-800 focus-visible:ring-indigo-500',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  success:   'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
};
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}
const btnSizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', ...props }) => (
  <button
    className={`
      inline-flex items-center justify-center gap-2 font-medium rounded-lg
      transition-colors duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed
      ${btnStyles[variant]} ${btnSizes[size]} ${className}
    `}
    {...props}
  />
);

// ---- Input ----
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', id, ...props }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          placeholder:text-gray-400
          ${error ? 'border-red-400' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
};

// ---- Select ----
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}
export const Select: React.FC<SelectProps> = ({ label, error, className = '', id, children, ...props }) => {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          ${error ? 'border-red-400' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

// ---- Textarea ----
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white resize-none
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          placeholder:text-gray-400
          ${error ? 'border-red-400' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

// ---- Alert ----
type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
const alertStyles: Record<AlertVariant, string> = {
  info:    'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  danger:  'bg-red-50 border-red-200 text-red-900',
};
export const Alert: React.FC<{ variant?: AlertVariant; children: React.ReactNode; className?: string }> = ({
  variant = 'info',
  children,
  className = '',
}) => (
  <div className={`flex gap-3 p-3 rounded-lg border text-sm ${alertStyles[variant]} ${className}`}>
    {children}
  </div>
);

// ---- Section header ----
export const PageHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title,
  subtitle,
  action,
}) => (
  <div className="flex items-start justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// ---- Divider ----
export const Divider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="relative flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-gray-200" />
    {label && <span className="text-xs text-gray-400 whitespace-nowrap">{label}</span>}
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

// ---- Empty State ----
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && <div className="mb-4 text-gray-300">{icon}</div>}
    <p className="text-base font-semibold text-gray-700">{title}</p>
    {description && <p className="mt-1 text-sm text-gray-500 max-w-md">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// ---- Tooltip wrapper (simple title-based) ----
export const Tooltip: React.FC<{ content: string; children: React.ReactElement }> = ({ content, children }) =>
  React.cloneElement(children as React.ReactElement<{ title?: string }>, { title: content });
