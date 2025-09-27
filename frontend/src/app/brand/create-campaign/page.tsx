'use client'

import { useState } from 'react'
import { useSuiWallet } from '../../../hooks/useSuiWallet'
import { useBrandProfile } from '../../../hooks/useSuiData'
import { TransactionBuilder } from '../../../lib/transaction-helpers'
import { TransactionStatus, TransactionButton } from '../../../components/TransactionStatus'
import { BalanceChecker } from '../../../components/BalanceChecker'
import { LoadingState } from '../../../components/ui/LoadingSpinner'
import { ErrorAlert } from '../../../components/ui/ErrorAlert'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CreateCampaign() {
  const { connected, address, executeTransaction, transactionStatus, clearTransactionStatus } = useSuiWallet()
  const { brand, isRegistered, isLoading: brandLoading, error: brandError } = useBrandProfile(address)
  const router = useRouter()
  const [formData, setFormData] = useState({
    campaignId: '',
    title: '',
    description: '',
    budget: '',
    basePayment: '',
    maxParticipants: '',
    applicationPeriodDays: '',
    campaignDurationDays: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connected) return

    try {
      // Calculate timestamps (simplified for demo)
      const now = Date.now()
      const applicationStart = now + 1000 * 60 * 60 // 1 hour from now
      const applicationEnd = applicationStart + (parseInt(formData.applicationPeriodDays) * 24 * 60 * 60 * 1000)
      const campaignStart = applicationEnd + 1000 * 60 * 60 // 1 hour after application ends
      const campaignEnd = campaignStart + (parseInt(formData.campaignDurationDays) * 24 * 60 * 60 * 1000)

      // Get the actual brand object ID from the user's brand profile
      if (!brand?.data?.objectId) {
        throw new Error('Brand profile not found. Please register as a brand first.')
      }
      const brandId = brand.data.objectId

      const tx = TransactionBuilder.createCampaignTx(
        brandId,
        formData.campaignId,
        formData.title,
        formData.description,
        parseInt(formData.budget),
        parseInt(formData.basePayment),
        applicationStart,
        applicationEnd,
        campaignStart,
        campaignEnd,
        parseInt(formData.maxParticipants)
      )

      await executeTransaction(tx, {
        onSuccess: () => {
          // Redirect to success page with campaign details
          const successUrl = `/brand/create-campaign/success?id=${encodeURIComponent(formData.campaignId)}&title=${encodeURIComponent(formData.title)}`
          router.push(successUrl)
        }
      })
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-4">Create Campaign</h1>
          <p className="text-gray-600 text-center mb-6">
            Please connect your wallet to create a campaign
          </p>
          <div className="text-center">
            <Link
              href="/brand"
              className="text-purple-600 hover:text-purple-800 underline"
            >
              ← Back to Brand Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingState message="Loading brand profile..." />
        </div>
      </div>
    )
  }

  if (brandError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ErrorAlert
            title="Error Loading Brand Profile"
            message={brandError.message || 'Failed to load brand profile'}
          />
          <div className="mt-4 text-center">
            <Link
              href="/brand"
              className="text-purple-600 hover:text-purple-800 underline"
            >
              ← Back to Brand Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-4">Create Campaign</h1>
          <p className="text-gray-600 text-center mb-6">
            You need to register as a brand before creating campaigns.
          </p>
          <div className="text-center">
            <Link
              href="/brand"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Register as Brand
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
              <span className="ml-2 text-gray-500">/ Create Campaign</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/brand"
                className="text-purple-600 hover:text-purple-800 underline"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Campaign</h1>
          <p className="text-gray-600 mb-8">
            Set up a new campaign to collaborate with content creators.
            Define your budget, requirements, and timeline.
          </p>

          <BalanceChecker address={address} className="mb-6" />

          <TransactionStatus
            status={transactionStatus}
            onClear={clearTransactionStatus}
            loadingMessage="Creating campaign..."
            successMessage="Campaign created successfully!"
          />

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.campaignId}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="unique-campaign-id"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Summer Product Launch"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe your campaign goals, target audience, and content requirements..."
                />
              </div>
            </div>

            {/* Budget & Payments */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Budget & Payments</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Budget (USDC) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="10000"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Total campaign budget in USDC tokens
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Payment per Creator (USDC) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.basePayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, basePayment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Base payment for each accepted content piece
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign Settings */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Campaign Settings</h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Period (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="30"
                    value={formData.applicationPeriodDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, applicationPeriodDays: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="7"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    How long creators can apply
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Duration (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="90"
                    value={formData.campaignDurationDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignDurationDays: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="30"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Content creation period
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base payments ({formData.maxParticipants || 0} × {formData.basePayment || 0} USDC):</span>
                  <span className="font-medium">
                    {(parseInt(formData.maxParticipants || '0') * parseInt(formData.basePayment || '0')).toLocaleString()} USDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Available for bonuses:</span>
                  <span className="font-medium">
                    {Math.max(0, parseInt(formData.budget || '0') - (parseInt(formData.maxParticipants || '0') * parseInt(formData.basePayment || '0'))).toLocaleString()} USDC
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Budget:</span>
                  <span>{parseInt(formData.budget || '0').toLocaleString()} USDC</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/brand"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <TransactionButton
                onClick={() => handleSubmit(new Event('submit') as any)}
                disabled={!formData.campaignId || !formData.title || !formData.budget}
                loading={transactionStatus.loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
              >
                Create Campaign
              </TransactionButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}