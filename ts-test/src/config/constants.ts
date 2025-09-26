// Network Configuration
export const NETWORK_CONFIG = {
  localnet: 'http://127.0.0.1:9000',
  devnet: 'https://fullnode.devnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443',
} as const;

// Default Gas Settings
export const GAS_SETTINGS = {
  DEFAULT_BUDGET: 100_000_000,
  MAX_BUDGET: 1_000_000_000,
  DEFAULT_PRICE: 1000,
} as const;

// Contract Module Names
export const MODULES = {
  REGISTRY: 'registry',
  BRAND: 'brand',
  CREATOR: 'creator',
  CAMPAIGN: 'campaign',
  CONTENT: 'content',
  PAYMENT: 'payment',
  DISPUTE: 'dispute',
  USDC: 'usdc',
} as const;

// Test Data Constants
export const TEST_DATA = {
  BRAND: {
    ID: 'test_brand_001',
    NAME: 'Test Brand',
    LOGO_URL: 'https://example.com/logo.png',
    DESCRIPTION: 'A test brand for automated testing',
  },
  CREATOR: {
    ID: 'test_creator_001',
    NAME: 'Test Creator',
    AVATAR_URL: 'https://example.com/avatar.png',
    CATEGORY: 'lifestyle',
    TWITTER: '@test_creator',
    INSTAGRAM: '@test_creator_ig',
    TIKTOK: '@test_creator_tik',
    YOUTUBE: 'TestCreator',
  },
  CAMPAIGN: {
    ID: 'test_campaign_001',
    TYPE: 'brand_campaign',
    BASE_PAY: 1000,
    TOTAL_BUDGET: 50000,
    MAX_WINNERS: 5,
    CPM_RATES: {
      LIKES: 10,
      VIEWS: 5,
      RETWEETS: 20,
      COMMENTS: 15,
      LINK_CLICKS: 25,
    },
  },
  CONTENT: {
    ID: 'test_content_001',
    LINK: 'https://twitter.com/creator/status/123456789',
  },
} as const;

// Test Timing (milliseconds from epoch)
export const TEST_TIMING = {
  APPLICATION_START: 1000,
  APPLICATION_END: 2000,
  CAMPAIGN_START: 3000,
  CAMPAIGN_END: 4000,
} as const;

// Error Messages
export const ERRORS = {
  NETWORK_CONNECTION: 'Failed to connect to Sui network',
  PACKAGE_NOT_FOUND: 'Package not found or not deployed',
  INSUFFICIENT_FUNDS: 'Insufficient funds for transaction',
  UNAUTHORIZED: 'Unauthorized operation',
  INVALID_INPUT: 'Invalid input parameters',
} as const;