/**
 * FormField Component
 * Reusable form field component for inputs, textareas, and selects
 */

import { ReactNode } from 'react';
import { cn } from '../../../../shared/lib/utils';

type InputType = 'text' | 'number' | 'email' | 'date' | 'color' | 'textarea' | 'select';

interface FormFieldProps {
  label: string;
  name: string;
  type?: InputType;
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  rows?: number; // For textarea
  options?: Array<{ value: string; label: string }>;
  children?: ReactNode;
  maxLength?: number;
  min?: number;
  max?: number;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  rows = 3,
  options = [],
  children,
  maxLength,
  min,
  max,
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-300"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            'w-full px-3 py-2 bg-zinc-800 border rounded text-zinc-100',
            'placeholder-zinc-500 resize-none',
            'focus:outline-none focus:border-amber-500/50',
            hasError ? 'border-red-500' : 'border-zinc-700'
          )}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 bg-zinc-800 border rounded text-zinc-100',
            'focus:outline-none focus:border-amber-500/50',
            hasError ? 'border-red-500' : 'border-zinc-700'
          )}
        >
          <option value="">Selecione uma opção</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
      ) : type === 'color' ? (
        <div className="flex gap-2">
          <input
            id={name}
            type="color"
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'h-10 w-12 bg-transparent border-none cursor-pointer',
              hasError ? 'border-red-500' : 'border-zinc-700'
            )}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            disabled={disabled}
            maxLength={7}
            className={cn(
              'flex-1 px-3 py-2 bg-zinc-800 border rounded text-zinc-100',
              'placeholder-zinc-500 uppercase',
              'focus:outline-none focus:border-amber-500/50',
              hasError ? 'border-red-500' : 'border-zinc-700'
            )}
            placeholder="#000000"
          />
        </div>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          min={min}
          max={max}
          className={cn(
            'w-full px-3 py-2 bg-zinc-800 border rounded text-zinc-100',
            'placeholder-zinc-500',
            'focus:outline-none focus:border-amber-500/50',
            hasError ? 'border-red-500' : 'border-zinc-700'
          )}
        />
      )}

      {hasError && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}
