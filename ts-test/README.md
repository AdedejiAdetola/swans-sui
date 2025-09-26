# SWANS TypeScript Test Suite

Comprehensive TypeScript tests for the SWANS content creator platform smart contract on Sui blockchain. These tests validate all contract functionality from a frontend integration perspective.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Sui CLI installed and configured
- SWANS smart contract deployed to your target network

### Installation

```bash
cd /Users/favourolaboye/Downloads/sui-frontend/swans-sui-main/ts-test
npm install
```

### Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
SUI_NETWORK=localnet
SUI_RPC_URL=http://127.0.0.1:9000
PACKAGE_ID=0x...your_deployed_package_id
ADMIN_PRIVATE_KEY=your_admin_private_key
BRAND_PRIVATE_KEY=your_brand_private_key
CREATOR_PRIVATE_KEY=your_creator_private_key
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test src/tests/01-setup.test.ts

# Run with UI interface
npm run test:ui

# Run tests once without watch mode
npm run test:run
```

## 📁 Project Structure

```
ts-test/
├── src/
│   ├── config/           # Configuration files
│   │   ├── constants.ts  # Test constants and data
│   │   └── test-setup.ts # Global test setup
│   ├── types/            # TypeScript type definitions
│   │   └── sui-objects.ts # Smart contract object types
│   ├── utils/            # Utility modules
│   │   ├── test-environment.ts  # Test environment management
│   │   ├── transaction-helpers.ts # Transaction builders
│   │   └── assertions.ts # Custom test assertions
│   └── tests/            # Test files
│       ├── 01-setup.test.ts      # Platform setup tests
│       ├── 02-registration.test.ts # Registration tests
│       ├── 03-campaign.test.ts    # Campaign lifecycle tests
│       ├── 04-content.test.ts     # Content workflow tests
│       ├── 05-payment.test.ts     # Payment processing tests
│       └── 06-integration.test.ts # End-to-end integration tests
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Test runner configuration
└── README.md            # This file
```

## 🧪 Test Coverage

### 1. Platform Setup Tests (`01-setup.test.ts`)
- ✅ Network connectivity
- ✅ Package deployment verification
- ✅ Registry initialization
- ✅ Account funding validation
- ✅ Transaction building utilities

### 2. Registration Tests (`02-registration.test.ts`)
- ✅ Brand registration and profile management
- ✅ Creator registration and social handles
- ✅ Account funding workflows
- ✅ Duplicate registration prevention
- ✅ Registry state updates

### 3. Campaign Tests (`03-campaign.test.ts`)
- ✅ Campaign creation and configuration
- ✅ Creator application process
- ✅ Application period validation
- ✅ Budget and timing management
- ✅ Campaign state queries

### 4. Content Tests (`04-content.test.ts`)
- ✅ Content submission workflow
- ✅ Brand review and approval process
- ✅ Content publication and base payments
- ✅ Engagement metrics tracking
- ✅ Content status management

### 5. Payment Tests (`05-payment.test.ts`)
- ✅ Base payment processing
- ✅ Bonus payment calculations (CPM-based)
- ✅ Payment receipt generation
- ✅ Winner selection and bonuses
- ✅ Budget tracking and validation

### 6. Integration Tests (`06-integration.test.ts`)
- ✅ Complete brand workflow
- ✅ Complete creator workflow
- ✅ Multi-user scenarios
- ✅ System state consistency
- ✅ Performance and scalability
- ✅ Frontend integration readiness

## 🛠 Development Guide

### Creating New Tests

1. **Follow the test file naming pattern**: `##-description.test.ts`
2. **Use the test environment**: Import and use `getTestEnvironment()`
3. **Leverage transaction helpers**: Use `TransactionHelpers` for contract interactions
4. **Apply custom assertions**: Use `SuiAssertions` for validations
5. **Maintain test isolation**: Each test should be independent

Example test structure:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { getTestEnvironment } from '../config/test-setup.js';
import { TransactionHelpers } from '../utils/transaction-helpers.js';
import { SuiAssertions } from '../utils/assertions.js';

describe('My Test Suite', () => {
  let testEnv: TestEnvironment;
  let txHelpers: TransactionHelpers;

  beforeAll(() => {
    testEnv = getTestEnvironment();
    txHelpers = new TransactionHelpers(testEnv);
  });

  it('should do something', async () => {
    const tx = testEnv.createTransaction();
    // ... build transaction
    const result = await testEnv.executeTransaction(tx, testEnv.adminKeypair);

    SuiAssertions.transactionSucceeded(result);
    expect(result.digest).toBeDefined();
  });
});
```

### Adding New Assertions

Custom assertions are defined in `src/utils/assertions.ts`. Add new assertions following this pattern:

```typescript
static isValidMyObject(obj: MyObject, expectedData?: Partial<MyObject>): void {
  this.hasValidObjectId(obj);
  expect(obj.my_field).toBeDefined();

  if (expectedData?.my_field) {
    expect(obj.my_field).toBe(expectedData.my_field);
  }
}
```

### Transaction Helpers

Add new transaction builders to `src/utils/transaction-helpers.ts`:

```typescript
createMyTransactionTx(param1: string, param2: number): Transaction {
  const tx = this.testEnv.createTransaction();

  tx.moveCall({
    target: `${this.testEnv.packageId}::my_module::my_function`,
    arguments: [
      tx.pure.string(param1),
      tx.pure.u64(param2),
    ],
  });

  return tx;
}
```

## 🎯 Frontend Integration

These tests are designed to validate patterns that will be used in frontend applications:

### Client Setup
```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

const client = new SuiClient({
  url: getFullnodeUrl('devnet')
});
```

### Transaction Building
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${packageId}::brand::register_brand`,
  arguments: [
    tx.object(registryId),
    tx.pure.string('brand_id'),
    tx.pure.string('Brand Name'),
    // ... other arguments
  ],
});
```

### Object Queries
```typescript
// Get owned objects by type
const brands = await client.getOwnedObjects({
  owner: address,
  filter: { StructType: `${packageId}::brand::Brand` },
  options: { showContent: true },
});

// Get object details
const brand = await client.getObject({
  id: brandId,
  options: { showContent: true },
});
```

### Event Monitoring
```typescript
// Query events
const events = await client.queryEvents({
  query: { Package: packageId },
  limit: 50,
  order: 'descending',
});

// Filter specific event types
const brandEvents = events.data.filter(event =>
  event.type.includes('BrandRegistered')
);
```

## 📊 Performance Considerations

### Gas Optimization
- Tests use appropriate gas budgets for each operation type
- Batch operations where possible to reduce transaction costs
- Monitor gas usage patterns for frontend cost estimation

### Query Efficiency
- Use type filters when querying objects to reduce data transfer
- Implement pagination for large result sets
- Cache frequently accessed data where appropriate

### Network Usage
- Tests work on localnet, devnet, testnet, and mainnet
- Use dedicated RPC endpoints for production applications
- Implement proper error handling and retry logic

## 🚨 Troubleshooting

### Common Issues

**"Package not found" error:**
- Ensure `PACKAGE_ID` in `.env` matches your deployed package
- Verify you're connected to the correct network
- Check that the package was deployed successfully

**"Insufficient funds" error:**
- Ensure test accounts have enough SUI for gas fees
- Use faucet for testnet: `sui client faucet`
- Check account balances: `sui client balance`

**Transaction execution failures:**
- Verify all object IDs are correct and objects exist
- Check function signatures match the smart contract
- Ensure proper argument types and order

**Test timeouts:**
- Increase timeout values in `vitest.config.ts` if needed
- Check network connectivity and RPC endpoint responsiveness
- Monitor for any infinite loops in test logic

### Debug Tips

1. **Enable verbose logging:**
```bash
npm run dev # Uses verbose reporter
```

2. **Run single test file:**
```bash
npm test src/tests/01-setup.test.ts
```

3. **Inspect transaction details:**
```typescript
console.log('Transaction result:', JSON.stringify(result, null, 2));
```

4. **Check object states:**
```typescript
const obj = await testEnv.getObjectDetails(objectId);
console.log('Object state:', obj.data?.content);
```

## 🤝 Contributing

1. Follow existing code patterns and naming conventions
2. Add comprehensive tests for new features
3. Update documentation for new test utilities
4. Ensure all tests pass before submitting changes
5. Use TypeScript strict mode and fix all type errors

## 📄 License

MIT License - See the main project license for details.

## 🔗 Related Resources

- [Sui Documentation](https://docs.sui.io/)
- [Sui TypeScript SDK](https://sdk.mystenlabs.com/)
- [SWANS Smart Contract](../sources/)
- [Vitest Documentation](https://vitest.dev/)