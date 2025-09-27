'use client'

import { useState } from 'react'
import { useSuiWallet } from '../../hooks/useSuiWallet'
import { useCreatorProfile, useCreatorApplications, useCreatorContent, usePaymentReceipts } from '../../hooks/useSuiData'
import { TransactionBuilder } from '../../lib/transaction-helpers'
import { TransactionStatus, TransactionButton } from '../../components/TransactionStatus'
import { LoadingState } from '../../components/ui/LoadingSpinner'
import { ErrorAlert } from '../../components/ui/ErrorAlert'
import { BalanceChecker } from '../../components/BalanceChecker'
import { DashboardLayout } from '../../components/DashboardLayout'
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
      <div className="min-h-screen bg-neutral-950 text-neutral-200 flex items-center justify-center">
        <div className="harmonia-glass rounded-2xl p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center mb-4 text-white">Creator Dashboard</h1>
          <p className="text-neutral-400 text-center mb-6">
            Please connect your wallet to access the creator dashboard
          </p>
          <div className="text-center">
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout title="Creator Dashboard" type="creator">
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
          <div className="harmonia-glass rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">
              Register as Creator
            </h2>
            <p className="text-neutral-400 mb-8">
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
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Creator ID
                  </label>
                  <input
                    type="text"
                    required
                    value={registerForm.creatorId}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, creatorId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500"
                    placeholder="unique-creator-id"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registerForm.displayName}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500"
                    placeholder="Your Display Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  value={registerForm.profileImage}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, profileImage: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500"
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Category
                </label>
                <select
                  value={registerForm.category}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
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
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Twitter Handle
                  </label>
                  <input
                    type="text"
                    value={registerForm.twitterHandle}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, twitterHandle: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={registerForm.instagramHandle}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, instagramHandle: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500"
                    placeholder="@username"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    TikTok Handle
                  </label>
                  <input
                    type="text"
                    value={registerForm.tiktokHandle}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, tiktokHandle: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    YouTube Handle
                  </label>
                  <input
                    type="text"
                    value={registerForm.youtubeHandle}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, youtubeHandle: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-neutral-500"
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
          <div className="harmonia-card">
            <h2 className="text-2xl font-bold text-white mb-4">Creator Profile</h2>
            <div className="flex items-center space-x-4">
              {creator?.data?.content?.fields?.profile_image && (
                <img
                  src={creator.data.content.fields.profile_image}
                  alt="Creator Avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {creator?.data?.content?.fields?.name || 'Loading...'}
                </h3>
                <p className="text-neutral-400">
                  Category: {creator?.data?.content?.fields?.category || 'N/A'}
                </p>
                <div className="flex space-x-2 mt-2">
                  {creator?.data?.content?.fields?.twitter_handle && (
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                      Twitter: {creator.data.content.fields.twitter_handle}
                    </span>
                  )}
                  {creator?.data?.content?.fields?.instagram_handle && (
                    <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded text-xs">
                      IG: {creator.data.content.fields.instagram_handle}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="harmonia-card text-center">
              <div className="text-3xl font-bold text-blue-400">{applications.length}</div>
              <div className="text-neutral-400">Applications</div>
            </div>
            <div className="harmonia-card text-center">
              <div className="text-3xl font-bold text-green-400">{content.length}</div>
              <div className="text-neutral-400">Content Pieces</div>
            </div>
            <div className="harmonia-card text-center">
              <div className="text-3xl font-bold text-purple-400">{payments.length}</div>
              <div className="text-neutral-400">Payments</div>
            </div>
            <div className="harmonia-card text-center">
              <div className="text-3xl font-bold text-orange-400">
                {creator?.data?.content?.fields?.total_earnings || 0}
              </div>
              <div className="text-neutral-400">Total Earned</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="harmonia-card">
            <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                href="/creator/campaigns"
                className="harmonia-button p-4 rounded-xl text-center justify-center"
              >
                <div>
                  <div className="text-lg font-semibold">Browse Campaigns</div>
                  <div className="text-sm opacity-90">Find new opportunities</div>
                </div>
              </Link>
              <Link
                href="/creator/content"
                className="harmonia-button p-4 rounded-xl text-center justify-center"
              >
                <div>
                  <div className="text-lg font-semibold">My Content</div>
                  <div className="text-sm opacity-90">Manage submissions</div>
                </div>
              </Link>
              <Link
                href="/creator/earnings"
                className="harmonia-button p-4 rounded-xl text-center justify-center"
              >
                <div>
                  <div className="text-lg font-semibold">Earnings</div>
                  <div className="text-sm opacity-90">Track payments</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Recent Applications */}
            <div className="harmonia-card">
              <h3 className="text-xl font-bold text-white mb-4">Recent Applications</h3>
              {applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app: any, index: number) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded p-3">
                      <div className="text-sm text-neutral-300">
                        Application {app.data?.objectId?.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Status: Pending Review
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400">No applications yet</p>
              )}
            </div>

            {/* Recent Content */}
            <div className="harmonia-card">
              <h3 className="text-xl font-bold text-white mb-4">Recent Content</h3>
              {content.length > 0 ? (
                <div className="space-y-3">
                  {content.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded p-3">
                      <div className="text-sm text-neutral-300">
                        Content {item.data?.objectId?.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Status: Published
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400">No content submitted yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}