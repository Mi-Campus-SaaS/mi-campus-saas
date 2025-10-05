import React from 'react';

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
};

export const Field: React.FC<FieldProps> = ({ id, label, error, children }) => {
  const errorId = error ? `${id}-error` : undefined;
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': errorId,
      } as Record<string, unknown>);
    }
    return child;
  });

  return (
    <div>
      <label htmlFor={id} className="block text-sm mb-1 muted">
        {label}
      </label>
      {childrenWithProps}
      {error && (
        <div id={errorId} className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default Field;
