'use client'

import { useSuiClientQuery } from '@mysten/dapp-kit'
import { PACKAGE_ID } from '../lib/constants'

export interface UseOwnedObjectsOptions {
  enabled?: boolean
  refetchInterval?: number
}

export function useOwnedObjects(
  address: string | null,
  structType: string,
  options: UseOwnedObjectsOptions = {}
) {
  return useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: address!,
      filter: { StructType: structType },
      options: { showContent: true, showDisplay: true }
    },
    {
      enabled: !!address && (options.enabled ?? true),
      refetchInterval: options.refetchInterval,
      staleTime: 30000, // 30 seconds
      retry: 3
    }
  )
}

export function useBrandProfile(address: string | null) {
  const query = useOwnedObjects(
    address,
    `${PACKAGE_ID}::brand::Brand`
  )

  return {
    ...query,
    brand: query.data?.data?.[0] || null,
    isRegistered: (query.data?.data?.length || 0) > 0
  }
}

export function useCreatorProfile(address: string | null) {
  const query = useOwnedObjects(
    address,
    `${PACKAGE_ID}::creator::Creator`
  )

  return {
    ...query,
    creator: query.data?.data?.[0] || null,
    isRegistered: (query.data?.data?.length || 0) > 0
  }
}

export function useBrandCampaigns(address: string | null) {
  return useOwnedObjects(
    address,
    `${PACKAGE_ID}::campaign::Campaign`
  )
}

export function useCreatorApplications(address: string | null) {
  return useOwnedObjects(
    address,
    `${PACKAGE_ID}::campaign::CampaignApplication`
  )
}

export function useCreatorContent(address: string | null) {
  return useOwnedObjects(
    address,
    `${PACKAGE_ID}::content::Content`
  )
}

export function usePaymentReceipts(address: string | null) {
  return useOwnedObjects(
    address,
    `${PACKAGE_ID}::payment::PaymentReceipt`
  )
}

export function useObjectDetails(objectId: string | null) {
  return useSuiClientQuery(
    'getObject',
    {
      id: objectId!,
      options: { showContent: true, showDisplay: true, showOwner: true }
    },
    {
      enabled: !!objectId,
      staleTime: 30000,
      retry: 3
    }
  )
}

export function useBalance(address: string | null, coinType?: string) {
  return useSuiClientQuery(
    'getBalance',
    {
      owner: address!,
      coinType: coinType || '0x2::sui::SUI'
    },
    {
      enabled: !!address,
      refetchInterval: 10000, // Refresh balance every 10 seconds
      staleTime: 5000
    }
  )
}

export function useTransactionBlock(digest: string | null) {
  return useSuiClientQuery(
    'getTransactionBlock',
    {
      digest: digest!,
      options: { showEffects: true, showEvents: true }
    },
    {
      enabled: !!digest,
      staleTime: 60000, // Transaction data is immutable
      retry: 3
    }
  )
}