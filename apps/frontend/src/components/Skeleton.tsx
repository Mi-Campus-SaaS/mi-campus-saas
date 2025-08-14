import React from 'react';

type SkeletonProps = {
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return <div className={['animate-pulse rounded bg-gray-200', className].filter(Boolean).join(' ')} />;
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={`sk-${lines}-${i}`} className={i === lines - 1 ? 'w-2/3 mt-2 h-3' : 'w-full mt-2 h-3'} />
      ))}
    </div>
  );
};
