'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'

export interface TransactionStatus {
  loading: boolean
  error: string | null
  success: boolean
  digest?: string
}

export function useSuiWallet() {
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction()
  const [address, setAddress] = useState<string | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    loading: false,
    error: null,
    success: false
  })

  useEffect(() => {
    if (currentAccount?.address) {
      setAddress(currentAccount.address)
    } else {
      setAddress(null)
    }
  }, [currentAccount])

  const executeTransaction = useCallback(async (
    transaction: any,
    options?: {
      onSuccess?: (result: any) => void
      onError?: (error: Error) => void
    }
  ) => {
    if (!currentAccount) {
      const error = new Error('Wallet not connected')
      setTransactionStatus({ loading: false, error: error.message, success: false })
      options?.onError?.(error)
      return
    }

    setTransactionStatus({ loading: true, error: null, success: false })

    try {
      signAndExecuteTransaction(
        {
          transaction,
          account: currentAccount,
          chain: 'sui:devnet'
        },
        {
          onSuccess: (result) => {
            setTransactionStatus({
              loading: false,
              error: null,
              success: true,
              digest: result.digest
            })
            options?.onSuccess?.(result)
          },
          onError: (error) => {
            let errorMessage = error.message || 'Transaction failed'

            // Provide helpful error messages for common issues
            if (errorMessage.includes('No valid gas coins found')) {
              errorMessage = 'Insufficient SUI balance for gas fees. Please get SUI tokens from the devnet faucet: https://faucet.devnet.sui.io/'
            } else if (errorMessage.includes('Insufficient gas')) {
              errorMessage = 'Not enough SUI tokens to cover gas fees. Please add more SUI to your wallet.'
            } else if (errorMessage.includes('Invalid signature')) {
              errorMessage = 'Transaction was rejected or signature failed. Please try again.'
            } else if (errorMessage.includes('ObjectNotFound')) {
              errorMessage = 'Required object not found. Please ensure all dependencies are met.'
            }

            setTransactionStatus({
              loading: false,
              error: errorMessage,
              success: false
            })
            options?.onError?.(error)
          }
        }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
      setTransactionStatus({
        loading: false,
        error: errorMessage,
        success: false
      })
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [currentAccount, signAndExecuteTransaction])

  const clearTransactionStatus = useCallback(() => {
    setTransactionStatus({ loading: false, error: null, success: false })
  }, [])

  return {
    connected: !!currentAccount,
    address,
    account: currentAccount,
    executeTransaction,
    transactionStatus,
    clearTransactionStatus,
    isTransactionPending: isPending || transactionStatus.loading,
    ConnectButton
  }
}