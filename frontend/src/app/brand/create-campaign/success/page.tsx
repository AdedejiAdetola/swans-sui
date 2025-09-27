'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export default function CampaignSuccess() {
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('id')
  const campaignTitle = searchParams.get('title')

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
              <span className="ml-2 text-gray-500">/ Campaign Created</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <CheckCircleIcon className="h-16 w-16 text-green-500" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Campaign Created Successfully!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Your campaign {campaignTitle ? `"${campaignTitle}"` : ''} has been created and is now live on the platform.
          </p>

          {/* Campaign Details */}
          {campaignId && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Details</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Campaign ID:</strong> {campaignId}</p>
                {campaignTitle && <p><strong>Title:</strong> {campaignTitle}</p>}
              </div>
            </div>
          )}

          {/* What Happens Next */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">What happens next?</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                Creators can now discover and apply to your campaign
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                You'll receive notifications when creators submit applications
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                Review and approve creators during the application period
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                Monitor content submissions and performance metrics
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/brand"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/brand/campaigns"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              Manage Campaigns
            </Link>
          </div>

          {/* Additional Tips */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Pro Tips</h4>
            <div className="text-sm text-gray-600 text-left max-w-2xl mx-auto">
              <ul className="space-y-1">
                <li>• Check your campaign regularly for new applications</li>
                <li>• Engage with creators early to build strong relationships</li>
                <li>• Provide clear feedback to help creators create better content</li>
                <li>• Monitor engagement metrics to optimize future campaigns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}