'use client'

import { LoadingSpinner } from './ui/LoadingSpinner'
import { ErrorAlert, SuccessAlert } from './ui/ErrorAlert'
import { TransactionStatus as TransactionStatusType } from '../hooks/useSuiWallet'

interface TransactionStatusProps {
  status: TransactionStatusType
  onClear?: () => void
  loadingMessage?: string
  successMessage?: string
}

export function TransactionStatus({
  status,
  onClear,
  loadingMessage = 'Processing transaction...',
  successMessage = 'Transaction completed successfully!'
}: TransactionStatusProps) {
  if (status.loading) {
    return (
      <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <LoadingSpinner size="sm" color="blue" />
        <span className="text-sm text-blue-700">{loadingMessage}</span>
      </div>
    )
  }

  if (status.error) {
    return (
      <ErrorAlert
        title="Transaction Failed"
        message={status.error}
        onDismiss={onClear}
        className="mb-4"
      />
    )
  }

  if (status.success) {
    return (
      <SuccessAlert
        title="Transaction Successful"
        message={
          status.digest
            ? `${successMessage} Transaction digest: ${status.digest.slice(0, 8)}...`
            : successMessage
        }
        onDismiss={onClear}
        className="mb-4"
      />
    )
  }

  return null
}

interface TransactionButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary'
}

export function TransactionButton({
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
  variant = 'primary'
}: TransactionButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  )
}