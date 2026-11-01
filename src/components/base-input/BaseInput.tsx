import React from 'react';

export interface Option {
  value: string | number;
  label: string;
}

export interface BaseInputProps {
  name: string;
  label?: React.ReactNode;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'select' | 'textarea';
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  error?: string | false | undefined;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  options?: Option[];
  helperText?: React.ReactNode;
  rows?: number;
  autoFocus?: boolean;
}

const BaseInput = React.forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, BaseInputProps>(({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  disabled,
  icon,
  className,
  options,
  helperText,
  rows = 4,
  autoFocus = false,
}, ref) => {
  const paddingLeft = icon ? 'pl-10' : 'pl-3.5';

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block mb-1.5 text-sm font-semibold text-gray-900"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}

        {type === 'select' ? (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            id={name}
            name={name}
            className={`
              block w-full ${paddingLeft} pr-8 py-2.5 sm:py-3
              bg-gray-50 border border-gray-200 rounded-xl
              text-gray-900 text-sm appearance-none
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white
              disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-600
              ${error && touched ? 'border-red-400 ring-1 ring-red-400' : ''}
              ${className || ''}
            `}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={name}
            name={name}
            rows={rows}
            className={`
              block w-full ${paddingLeft} pr-3.5 py-2.5 sm:py-3
              bg-gray-50 border border-gray-200 rounded-xl
              text-gray-900 text-sm resize-none
              placeholder-gray-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white
              disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-600
              ${error && touched ? 'border-red-400 ring-1 ring-red-400' : ''}
              ${className || ''}
            `}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            id={name}
            name={name}
            className={`
              block w-full ${paddingLeft} pr-3.5 py-2.5 sm:py-3
              bg-gray-50 border border-gray-200 rounded-xl
              text-gray-900 text-sm
              placeholder-gray-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white
              disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-600
              ${error && touched ? 'border-red-400 ring-1 ring-red-400' : ''}
              ${className || ''}
            `}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            autoFocus={autoFocus}
          />
        )}

        {/* Dropdown chevron for select inputs */}
        {type === 'select' && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Helper / Info Text below input */}
      {helperText && (
        <p className="mt-1.5 text-xs text-gray-500 leading-normal">
          {helperText}
        </p>
      )}

      {/* Validation Error Message */}
      {error && touched && (
        <p className="mt-1.5 text-xs text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
});

BaseInput.displayName = 'BaseInput';

export default BaseInput;
