import React from 'react'

type SpinnerProps = {
  size?: number
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = 24, className }) => {
  const border = Math.max(2, Math.floor(size / 8))
  return (
    <div
      className={['inline-block animate-spin rounded-full border-gray-300 border-t-blue-600', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, borderWidth: border }}
      aria-label="loading"
      role="status"
    />
  )
}

export default Spinner


