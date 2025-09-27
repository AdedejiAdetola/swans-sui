'use client'

import { useBalance } from '../hooks/useSuiData'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface BalanceCheckerProps {
  address: string | null
  className?: string
}

export function BalanceChecker({ address, className = '' }: BalanceCheckerProps) {
  const { data: balance, isLoading, error } = useBalance(address)

  if (!address) return null

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
        <LoadingSpinner size="sm" />
        <span>Checking balance...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        Unable to check balance
      </div>
    )
  }

  const suiBalance = balance ? parseInt(balance.totalBalance) / 1_000_000_000 : 0
  const hasInsufficientBalance = suiBalance < 0.1 // Less than 0.1 SUI

  if (hasInsufficientBalance) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Low SUI Balance</h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>
                Balance: <span className="font-medium">{suiBalance.toFixed(4)} SUI</span>
              </p>
              <p className="mt-1">
                You need SUI tokens to pay for gas fees. Get free tokens from the{' '}
                <a
                  href="https://faucet.devnet.sui.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-yellow-900"
                >
                  Sui Devnet Faucet
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`text-sm text-green-600 flex items-center space-x-1 ${className}`}>
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>Balance: {suiBalance.toFixed(4)} SUI</span>
    </div>
  )
}