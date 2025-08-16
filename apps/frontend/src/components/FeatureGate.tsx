import React from 'react';
import { useFeature, useFeatureMessage, type FeatureKey } from '../auth/useFeatures';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockIcon?: boolean;
  className?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showLockIcon = false,
  className = '',
}) => {
  const hasAccess = useFeature(feature);
  const message = useFeatureMessage(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLockIcon) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 dark:text-gray-400 ${className}`}>
        <Lock className="w-4 h-4" />
        <span className="text-sm">{message}</span>
      </div>
    );
  }

  return null;
};

interface FeatureButtonProps {
  feature: FeatureKey;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const FeatureButton: React.FC<FeatureButtonProps> = ({
  feature,
  children,
  onClick,
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
}) => {
  const hasAccess = useFeature(feature);
  const message = useFeatureMessage(feature);

  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline:
      'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (!hasAccess) {
    return (
      <button className={`${classes} opacity-50 cursor-not-allowed`} disabled title={message}>
        {children}
      </button>
    );
  }

  return (
    <button className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

interface FeatureLinkProps {
  feature: FeatureKey;
  children: React.ReactNode;
  href: string;
  className?: string;
  external?: boolean;
}

export const FeatureLink: React.FC<FeatureLinkProps> = ({
  feature,
  children,
  href,
  className = '',
  external = false,
}) => {
  const hasAccess = useFeature(feature);
  const message = useFeatureMessage(feature);

  if (!hasAccess) {
    return (
      <span className={`text-gray-400 cursor-not-allowed ${className}`} title={message}>
        {children}
      </span>
    );
  }

  const linkClasses = 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors';

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${linkClasses} ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} className={`${linkClasses} ${className}`}>
      {children}
    </a>
  );
};
