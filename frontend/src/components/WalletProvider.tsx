'use client'

import { SuiClientProvider, WalletProvider as DappWalletProvider, createNetworkConfig } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, createContext, useContext } from 'react'
import { SUI_NETWORK } from '../lib/constants'

interface Props {
  children: ReactNode
}

interface WalletContextType {
  isInitialized: boolean
  error: string | null
}

const WalletContext = createContext<WalletContextType>({
  isInitialized: false,
  error: null
})

export const useWalletContext = () => useContext(WalletContext)

const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
})

export function WalletProvider({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60000, // 1 minute
        retry: (failureCount, error) => {
          // Retry up to 3 times, but not for certain error types
          if (failureCount >= 3) return false
          if (error instanceof Error && error.message.includes('not found')) return false
          return true
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      }
    }
  }))
  const [isInitialized, setIsInitialized] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const contextValue: WalletContextType = {
    isInitialized,
    error
  }

  return (
    <WalletContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider
          networks={networkConfig}
          defaultNetwork={SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet'}
          onNetworkChange={(network) => {
            console.log('Network changed to:', network)
          }}
        >
          <DappWalletProvider
            autoConnect={true}
            stashedWallet={{
              name: 'SWANS Wallet Connection'
            }}
          >
            {children}
          </DappWalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </WalletContext.Provider>
  )
}