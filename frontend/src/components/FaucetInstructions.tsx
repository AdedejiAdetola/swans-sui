'use client'

interface FaucetInstructionsProps {
  className?: string
}

export function FaucetInstructions({ className = '' }: FaucetInstructionsProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Need Testnet SUI?</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              To test transactions on the Sui devnet, you need SUI tokens for gas fees.
            </p>
            <div className="bg-white rounded p-3 border border-blue-200">
              <p className="font-medium mb-2">Get free testnet SUI:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Visit the{' '}
                  <a
                    href="https://faucet.devnet.sui.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Sui Devnet Faucet
                  </a>
                </li>
                <li>Connect your wallet or enter your address</li>
                <li>Click "Request Sui" to receive testnet tokens</li>
                <li>Wait for the transaction to complete</li>
                <li>Refresh this page to see your updated balance</li>
              </ol>
            </div>
            <p className="text-xs">
              💡 Tip: You can request SUI multiple times if needed. Testnet tokens have no real value.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}