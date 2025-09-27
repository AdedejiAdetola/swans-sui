'use client'

import { useSuiWallet } from '../hooks/useSuiWallet'
import Link from 'next/link'

export default function HomePage() {
  const { connected, address, ConnectButton } = useSuiWallet()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">SWANS</h1>
            <p className="text-gray-600">Content Creator Platform on Sui</p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectButton />
            {connected && (
              <div className="text-sm text-gray-600">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-6xl font-bold text-gray-900 mb-6">
              Decentralized Creator Economy
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
              Connect brands with content creators through transparent smart contracts.
              Create campaigns, submit content, and earn rewards on the Sui blockchain.
            </p>

            {connected ? (
              <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                {/* Brand Card */}
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">For Brands</h3>
                  <p className="text-gray-600 mb-6">
                    Create campaigns, set budgets, and find the perfect creators for your brand.
                  </p>
                  <Link
                    href="/brand"
                    className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Brand Dashboard
                  </Link>
                </div>

                {/* Creator Card */}
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">For Creators</h3>
                  <p className="text-gray-600 mb-6">
                    Apply to campaigns, create content, and earn rewards transparently.
                  </p>
                  <Link
                    href="/creator"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Creator Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-lg max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Started</h3>
                <p className="text-gray-600 mb-6">
                  Connect your Sui wallet to access the platform
                </p>
                <ConnectButton />
              </div>
            )}
          </div>
        </main>

        {/* Features Section */}
        <section className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Platform Features
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Transparent Payments</h4>
              <p className="text-gray-600">Smart contracts ensure automatic and transparent payments to creators</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Creator Network</h4>
              <p className="text-gray-600">Connect with verified creators across multiple social platforms</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Performance Tracking</h4>
              <p className="text-gray-600">Real-time analytics and performance-based bonus payments</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}