import React from 'react';

export const Form: React.FC<{
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ onSubmit, children, className }) => {
  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      {children}
    </form>
  );
};

export const ErrorSummary: React.FC<{ errors: Record<string, string | undefined> }> = ({ errors }) => {
  const entries = Object.entries(errors).filter(([, msg]) => Boolean(msg));
  if (entries.length === 0) return null;
  return (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
      <ul className="list-disc ml-4">
        {entries.map(([key, msg]) => (
          <li key={key} className="text-sm">
            {msg}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Form;
