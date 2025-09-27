'use client'

import { useState } from 'react'
import { useSuiWallet } from '../../hooks/useSuiWallet'
import { useCreatorProfile, useCreatorApplications, useCreatorContent, usePaymentReceipts } from '../../hooks/useSuiData'
import { TransactionBuilder } from '../../lib/transaction-helpers'
import { TransactionStatus, TransactionButton } from '../../components/TransactionStatus'
import { LoadingState } from '../../components/ui/LoadingSpinner'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { BalanceChecker } from '../../components/BalanceChecker'
import Link from 'next/link'

export default function CreatorDashboard() {
  const { connected, address, executeTransaction, transactionStatus, clearTransactionStatus } = useSuiWallet()
  const { creator, isRegistered, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useCreatorProfile(address)
  const { data: applicationsData } = useCreatorApplications(address)
  const { data: contentData } = useCreatorContent(address)
  const { data: paymentsData } = usePaymentReceipts(address)
  const [registerForm, setRegisterForm] = useState({
    creatorId: '',
    displayName: '',
    profileImage: '',
    category: 'lifestyle',
    twitterHandle: '',
    instagramHandle: '',
    tiktokHandle: '',
    youtubeHandle: ''
  })

  const applications = applicationsData?.data || []
  const content = contentData?.data || []
  const payments = paymentsData?.data || []

  const handleRegisterCreator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connected) return

    try {
      const tx = TransactionBuilder.createRegisterCreatorTx(
        registerForm.creatorId,
        registerForm.displayName,
        registerForm.profileImage,
        registerForm.category,
        registerForm.twitterHandle,
        registerForm.instagramHandle,
        registerForm.tiktokHandle,
        registerForm.youtubeHandle
      )

      await executeTransaction(tx, {
        onSuccess: () => {
          // Refresh profile data
          refetchProfile()
          // Reset form
          setRegisterForm({
            creatorId: '',
            displayName: '',
            profileImage: '',
            category: 'lifestyle',
            twitterHandle: '',
            instagramHandle: '',
            tiktokHandle: '',
            youtubeHandle: ''
          })
        }
      })
    } catch (error) {
      console.error('Error registering creator:', error)
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-4">Creator Dashboard</h1>
          <p className="text-gray-600 text-center mb-6">
            Please connect your wallet to access the creator dashboard
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
              <span className="ml-2 text-gray-500">/ Creator Dashboard</span>
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
          <LoadingState message="Loading creator profile..." />
        ) : profileError ? (
          <ErrorAlert
            title="Error Loading Profile"
            message={profileError.message || 'Failed to load creator profile'}
          />
        ) : !isRegistered ? (
          /* Registration Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Register as Creator
              </h2>
              <p className="text-gray-600 mb-8">
                Create your creator profile to start applying to campaigns and earning rewards.
              </p>

              <BalanceChecker address={address} className="mb-6" />

              <TransactionStatus
                status={transactionStatus}
                onClear={clearTransactionStatus}
                loadingMessage="Registering creator..."
                successMessage="Creator registered successfully!"
              />

              <form onSubmit={handleRegisterCreator} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Creator ID
                    </label>
                    <input
                      type="text"
                      required
                      value={registerForm.creatorId}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, creatorId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="unique-creator-id"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={registerForm.displayName}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Display Name"
                    />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/avatar.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={registerForm.category}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lifestyle">Lifestyle</option>
                    <option value="tech">Technology</option>
                    <option value="gaming">Gaming</option>
                    <option value="fashion">Fashion</option>
                    <option value="fitness">Fitness</option>
                    <option value="food">Food</option>
                    <option value="travel">Travel</option>
                    <option value="education">Education</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter Handle
                    </label>
                    <input
                      type="text"
                      value={registerForm.twitterHandle}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, twitterHandle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      value={registerForm.instagramHandle}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, instagramHandle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="@username"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TikTok Handle
                    </label>
                    <input
                      type="text"
                      value={registerForm.tiktokHandle}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, tiktokHandle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube Handle
                    </label>
                    <input
                      type="text"
                      value={registerForm.youtubeHandle}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, youtubeHandle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Channel Name"
                    />
                  </div>
                </div>

                <TransactionButton
                  onClick={() => handleRegisterCreator(new Event('submit') as any)}
                  disabled={!registerForm.creatorId || !registerForm.displayName}
                  loading={transactionStatus.loading}
                  className="w-full"
                >
                  Register as Creator
                </TransactionButton>
              </form>
            </div>
          </div>
        ) : (
          /* Dashboard Content */
          <div className="space-y-8">
            {/* Creator Profile */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Creator Profile</h2>
              <div className="flex items-center space-x-4">
                {creator?.data?.content?.fields?.profile_image && (
                  <img
                    src={creator.data.content.fields.profile_image}
                    alt="Creator Avatar"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">
                    {creator?.data?.content?.fields?.name || 'Loading...'}
                  </h3>
                  <p className="text-gray-600">
                    Category: {creator?.data?.content?.fields?.category || 'N/A'}
                  </p>
                  <div className="flex space-x-2 mt-2">
                    {creator?.data?.content?.fields?.twitter_handle && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        Twitter: {creator.data.content.fields.twitter_handle}
                      </span>
                    )}
                    {creator?.data?.content?.fields?.instagram_handle && (
                      <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs">
                        IG: {creator.data.content.fields.instagram_handle}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{applications.length}</div>
                <div className="text-gray-600">Applications</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{content.length}</div>
                <div className="text-gray-600">Content Pieces</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">{payments.length}</div>
                <div className="text-gray-600">Payments</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {creator?.data?.content?.fields?.total_earnings || 0}
                </div>
                <div className="text-gray-600">Total Earned</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href="/creator/campaigns"
                  className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors"
                >
                  <div className="text-lg font-semibold">Browse Campaigns</div>
                  <div className="text-sm opacity-90">Find new opportunities</div>
                </Link>
                <Link
                  href="/creator/content"
                  className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 transition-colors"
                >
                  <div className="text-lg font-semibold">My Content</div>
                  <div className="text-sm opacity-90">Manage submissions</div>
                </Link>
                <Link
                  href="/creator/earnings"
                  className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700 transition-colors"
                >
                  <div className="text-lg font-semibold">Earnings</div>
                  <div className="text-sm opacity-90">Track payments</div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Recent Applications */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Applications</h3>
                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded p-3">
                        <div className="text-sm text-gray-600">
                          Application {app.data?.objectId?.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Status: Pending Review
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No applications yet</p>
                )}
              </div>

              {/* Recent Content */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Content</h3>
                {content.length > 0 ? (
                  <div className="space-y-3">
                    {content.slice(0, 3).map((item: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded p-3">
                        <div className="text-sm text-gray-600">
                          Content {item.data?.objectId?.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Status: Published
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No content submitted yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}