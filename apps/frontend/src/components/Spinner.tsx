import React from 'react'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeToClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-4',
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  return (
    <output
      className={[
        'inline-block animate-spin rounded-full border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400',
        sizeToClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="loading"
    />
  )
}

export default Spinner


