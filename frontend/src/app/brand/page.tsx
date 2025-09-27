'use client'

import { useState } from 'react'
import { useSuiWallet } from '../../hooks/useSuiWallet'
import { useBrandProfile, useBrandCampaigns } from '../../hooks/useSuiData'
import { TransactionBuilder } from '../../lib/transaction-helpers'
import { TransactionStatus, TransactionButton } from '../../components/TransactionStatus'
import { LoadingState } from '../../components/ui/LoadingSpinner'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { BalanceChecker } from '../../components/BalanceChecker'
import Link from 'next/link'

export default function BrandDashboard() {
  const { connected, address, executeTransaction, transactionStatus, clearTransactionStatus } = useSuiWallet()
  const { brand, isRegistered, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useBrandProfile(address)
  const { data: campaignsData, isLoading: campaignsLoading, error: campaignsError } = useBrandCampaigns(address)
  const [registerForm, setRegisterForm] = useState({
    brandId: '',
    brandName: '',
    profileImage: '',
    description: ''
  })

  const campaigns = campaignsData?.data || []

  const handleRegisterBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connected) return

    try {
      const tx = TransactionBuilder.createRegisterBrandTx(
        registerForm.brandId,
        registerForm.brandName,
        registerForm.profileImage,
        registerForm.description
      )

      await executeTransaction(tx, {
        onSuccess: () => {
          // Refresh profile data
          refetchProfile()
          // Reset form
          setRegisterForm({
            brandId: '',
            brandName: '',
            profileImage: '',
            description: ''
          })
        }
      })
    } catch (error) {
      console.error('Error registering brand:', error)
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-4">Brand Dashboard</h1>
          <p className="text-gray-600 text-center mb-6">
            Please connect your wallet to access the brand dashboard
          </p>
          <div className="text-center">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                SWANS
              </Link>
              <span className="ml-2 text-gray-500">/ Brand Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <BalanceChecker address={address} />
              <span className="text-sm text-gray-600">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profileLoading ? (
          <LoadingState message="Loading brand profile..." />
        ) : profileError ? (
          <ErrorAlert
            title="Error Loading Profile"
            message={profileError.message || 'Failed to load brand profile'}
          />
        ) : !isRegistered ? (
          /* Registration Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Register Your Brand
              </h2>
              <p className="text-gray-600 mb-8">
                Create your brand profile to start creating campaigns and working with creators.
              </p>

              <BalanceChecker address={address} className="mb-6" />

              <TransactionStatus
                status={transactionStatus}
                onClear={clearTransactionStatus}
                loadingMessage="Registering brand..."
                successMessage="Brand registered successfully!"
              />

              <form onSubmit={handleRegisterBrand} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerForm.brandId}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, brandId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="unique-brand-id"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be unique and contain only letters, numbers, and hyphens</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerForm.brandName}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, brandName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Your Brand Name"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">Your public brand display name</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    value={registerForm.profileImage}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, profileImage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: URL to your brand logo or image</p>
                  {registerForm.profileImage && (
                    <div className="mt-2">
                      <img
                        src={registerForm.profileImage}
                        alt="Brand preview"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Description
                  </label>
                  <textarea
                    rows={4}
                    value={registerForm.description}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Describe your brand, industry, target audience, and what you're looking for in creators..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{registerForm.description.length}/500 characters</p>
                </div>

                <TransactionButton
                  onClick={() => handleRegisterBrand(new Event('submit') as any)}
                  disabled={!registerForm.brandId || !registerForm.brandName}
                  loading={transactionStatus.loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                >
                  Register Brand
                </TransactionButton>
              </form>
            </div>
          </div>
        ) : (
          /* Dashboard Content */
          <div className="space-y-8">
            {/* Brand Profile */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Brand Profile</h2>
              <div className="flex items-center space-x-4">
                {brand?.data?.content?.fields?.profile_image && (
                  <img
                    src={brand.data.content.fields.profile_image}
                    alt="Brand Logo"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">
                    {brand?.data?.content?.fields?.brand_name || 'Loading...'}
                  </h3>
                  <p className="text-gray-600">
                    {brand?.data?.content?.fields?.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href="/brand/create-campaign"
                  className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700 transition-colors"
                >
                  <div className="text-lg font-semibold">Create Campaign</div>
                  <div className="text-sm opacity-90">Start a new campaign</div>
                </Link>
                <Link
                  href="/brand/campaigns"
                  className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors"
                >
                  <div className="text-lg font-semibold">Manage Campaigns</div>
                  <div className="text-sm opacity-90">View all campaigns</div>
                </Link>
                <Link
                  href="/brand/analytics"
                  className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 transition-colors"
                >
                  <div className="text-lg font-semibold">Analytics</div>
                  <div className="text-sm opacity-90">Campaign performance</div>
                </Link>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Campaigns</h2>
              {campaignsLoading ? (
                <LoadingState message="Loading campaigns..." />
              ) : campaignsError ? (
                <ErrorAlert
                  title="Error Loading Campaigns"
                  message={campaignsError.message || 'Failed to load campaigns'}
                />
              ) : campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Campaign {campaign.data?.objectId?.slice(0, 8)}...
                          </h3>
                          <p className="text-gray-600">
                            Created: {new Date().toLocaleDateString()}
                          </p>
                        </div>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No campaigns yet. Create your first campaign to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}