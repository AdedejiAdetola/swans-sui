# SWANS Frontend

A Next.js frontend for the SWANS content creator platform on Sui blockchain.

## Features

- 🔗 **Wallet Integration**: Connect with Sui wallets (Sui Wallet, Suiet)
- 👤 **User Registration**: Brand and Creator registration workflows
- 📝 **Campaign Management**: Create and manage advertising campaigns
- 💰 **Payment Tracking**: View earnings and payment history
- 📊 **Dashboard**: Comprehensive brand and creator dashboards

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Sui SDK (`@mysten/sui`)
- **Wallet**: Wallet Kit (`@mysten/wallet-kit`)

## Getting Started

### Prerequisites

- Node.js 18+
- A Sui wallet (Sui Wallet or Suiet)
- Access to Sui devnet/testnet

### Installation

```bash
npm install
```

### Configuration

The app is pre-configured for the deployed SWANS smart contract on Sui devnet:

- **Package ID**: `0x819df9910ee7ff195918fe87fcc18c889a78d0608b1e1d3087412963c7bdd6d3`
- **Registry ID**: `0x3f03db054bd2e1c6676ab9ea11d6bb0832448f2aa11cc2f263ff5071c0512864`
- **Network**: Sui Devnet

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── brand/             # Brand dashboard and workflows
│   ├── creator/           # Creator dashboard and workflows
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   └── WalletProvider.tsx # Sui wallet provider
├── hooks/                 # Custom React hooks
│   └── useSuiWallet.ts   # Wallet connection hook
└── lib/                   # Utility libraries
    ├── constants.ts       # Contract addresses and constants
    ├── sui-client.ts     # Sui client configuration
    └── transaction-helpers.ts # Transaction builders
```

## Key Features

### Brand Workflow

1. **Connect Wallet**: Use Sui wallet to connect to the platform
2. **Register Brand**: Create brand profile with company information
3. **Create Campaign**: Set up advertising campaigns with budget and requirements
4. **Manage Applications**: Review and approve creator applications
5. **Track Performance**: Monitor campaign performance and payments

### Creator Workflow

1. **Connect Wallet**: Use Sui wallet to connect to the platform
2. **Register Creator**: Create creator profile with social media handles
3. **Browse Campaigns**: Find relevant campaigns to apply to
4. **Submit Content**: Create and submit content for approved campaigns
5. **Track Earnings**: Monitor payments and performance metrics

## Smart Contract Integration

The frontend integrates with the SWANS smart contract using:

- **Transaction Building**: Create and execute transactions using `@mysten/sui`
- **Object Queries**: Fetch user data, campaigns, and content from the blockchain
- **Event Monitoring**: Listen for smart contract events for real-time updates
- **Wallet Integration**: Seamless wallet connection and transaction signing

### Example Transaction

```typescript
// Create a brand registration transaction
const tx = TransactionBuilder.createRegisterBrandTx(
  'my-brand-id',
  'My Brand Name',
  'https://example.com/logo.png',
  'Brand description'
)

// Execute transaction
const result = await signAndExecuteTransaction({
  transaction: tx,
  options: { showEffects: true }
})
```

## Network Support

- **Devnet**: Default configuration (for development and testing)
- **Testnet**: Change `SUI_NETWORK` in `constants.ts`
- **Mainnet**: Update configuration for production deployment

## Development Notes

### Transaction Helpers

The `TransactionBuilder` class provides methods for all smart contract interactions:

- `createRegisterBrandTx()` - Brand registration
- `createRegisterCreatorTx()` - Creator registration
- `createCampaignTx()` - Campaign creation
- `createApplyToCampaignTx()` - Campaign applications
- `createSubmitContentTx()` - Content submission

### Object Queries

The app queries blockchain objects to display user data:

```typescript
// Get user's brands
const brands = await suiClient.getOwnedObjects({
  owner: address,
  filter: { StructType: `${PACKAGE_ID}::brand::Brand` },
  options: { showContent: true }
})
```

### Error Handling

The app includes comprehensive error handling for:

- Wallet connection issues
- Transaction failures
- Network connectivity problems
- Smart contract errors

## Deployment

### Build

```bash
npm run build
```

### Deploy

Deploy to your preferred hosting platform (Vercel, Netlify, etc.):

```bash
npm run start
```

## Testing

The frontend is designed to work with the comprehensive test suite in `/ts-test`. Run the integration tests to verify smart contract functionality before frontend testing.

## Contributing

1. Follow the existing code patterns
2. Use TypeScript for all new code
3. Test wallet integration thoroughly
4. Ensure responsive design works on mobile

## License

MIT License - see main project license for details.