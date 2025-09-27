import type { Metadata } from 'next'
import './globals.css'
import '@mysten/dapp-kit/dist/index.css'
import { WalletProvider } from '../components/WalletProvider'

export const metadata: Metadata = {
  title: 'SWANS - Content Creator Platform',
  description: 'Decentralized content creator platform on Sui blockchain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}