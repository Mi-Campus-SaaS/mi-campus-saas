import React from 'react'

type SkeletonProps = {
  width?: string | number
  height?: string | number
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, className }) => {
  const style: React.CSSProperties = { width, height }
  return <div className={["animate-pulse rounded bg-gray-200", className].filter(Boolean).join(' ')} style={style} />
}

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} className={i === lines - 1 ? 'w-2/3 mt-2' : 'w-full mt-2'} />
      ))}
    </div>
  )
}


