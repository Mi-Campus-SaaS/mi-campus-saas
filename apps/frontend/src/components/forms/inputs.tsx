import React from 'react';

type CommonProps = {
  id: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: 'true' | 'false';
  'aria-describedby'?: string;
};

export const TextField: React.FC<CommonProps> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) => (
  <input
    id={id}
    className={`border rounded p-2 w-full ${className || ''}`}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    {...(ariaInvalid === 'true' && { 'aria-invalid': 'true' })}
    {...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy })}
  />
);

export const PasswordField: React.FC<CommonProps> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) => (
  <input
    id={id}
    type="password"
    className={`border rounded p-2 w-full ${className || ''}`}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    {...(ariaInvalid === 'true' && { 'aria-invalid': 'true' })}
    {...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy })}
  />
);

export const NumberField: React.FC<CommonProps & { min?: number; max?: number; step?: number }> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  min,
  max,
  step,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) => (
  <input
    id={id}
    type="number"
    className={`border rounded p-2 w-full ${className || ''}`}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    {...(ariaInvalid === 'true' && { 'aria-invalid': 'true' })}
    {...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy })}
    min={min}
    max={max}
    step={step}
  />
);

export const DateField: React.FC<CommonProps> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) => (
  <input
    id={id}
    type="date"
    className={`border rounded p-2 w-full ${className || ''}`}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    {...(ariaInvalid === 'true' && { 'aria-invalid': 'true' })}
    {...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy })}
  />
);

export const DateTimeField: React.FC<CommonProps> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) => (
  <input
    id={id}
    type="datetime-local"
    className={`border rounded p-2 w-full ${className || ''}`}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    {...(ariaInvalid === 'true' && { 'aria-invalid': 'true' })}
    {...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy })}
  />
);

export const FileField: React.FC<{
  id: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}> = ({ id, onChange, disabled, className, placeholder }) => (
  <input
    id={id}
    type="file"
    className={`border rounded p-2 w-full ${className || ''}`}
    onChange={(e) => onChange(e.target.files?.[0] ?? null)}
    disabled={disabled}
    aria-label={placeholder}
  />
);
