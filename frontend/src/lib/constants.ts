// Contract deployment info
export const PACKAGE_ID = '0x819df9910ee7ff195918fe87fcc18c889a78d0608b1e1d3087412963c7bdd6d3'
export const REGISTRY_ID = '0x3f03db054bd2e1c6676ab9ea11d6bb0832448f2aa11cc2f263ff5071c0512864'

// Network configuration
export const SUI_NETWORK = 'devnet'
export const SUI_RPC_URL = 'https://fullnode.devnet.sui.io:443'

// Module names
export const MODULES = {
  BRAND: `${PACKAGE_ID}::brand`,
  CREATOR: `${PACKAGE_ID}::creator`,
  CAMPAIGN: `${PACKAGE_ID}::campaign`,
  CONTENT: `${PACKAGE_ID}::content`,
  PAYMENT: `${PACKAGE_ID}::payment`,
  REGISTRY: `${PACKAGE_ID}::registry`,
} as const

// Function targets
export const FUNCTIONS = {
  // Brand functions
  REGISTER_BRAND: `${MODULES.BRAND}::register_brand`,
  FUND_BRAND: `${MODULES.BRAND}::fund_brand_account`,

  // Creator functions
  REGISTER_CREATOR: `${MODULES.CREATOR}::register_creator`,

  // Campaign functions
  CREATE_CAMPAIGN: `${MODULES.CAMPAIGN}::create_campaign`,
  APPLY_TO_CAMPAIGN: `${MODULES.CAMPAIGN}::apply_to_campaign`,

  // Content functions
  SUBMIT_CONTENT: `${MODULES.CONTENT}::submit_content`,
  REVIEW_CONTENT: `${MODULES.CONTENT}::review_content`,
  PUBLISH_CONTENT: `${MODULES.CONTENT}::publish_content`,
} as const

// Gas budgets
export const GAS_BUDGET = {
  REGISTER_BRAND: 15_000_000,
  REGISTER_CREATOR: 12_000_000,
  CREATE_CAMPAIGN: 50_000_000,
  APPLY_TO_CAMPAIGN: 10_000_000,
  SUBMIT_CONTENT: 15_000_000,
  REVIEW_CONTENT: 12_000_000,
  PUBLISH_CONTENT: 25_000_000,
} as const