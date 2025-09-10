import React from 'react';

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
};

export const Field: React.FC<FieldProps> = ({ id, label, error, children }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm mb-1 muted">
        {label}
      </label>
      {children}
      {error && <div className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</div>}
    </div>
  );
};

export default Field;
