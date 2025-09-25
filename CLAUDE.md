# SWANS - Sui Move Content Creator Platform

## Project Overview
**SWANS** is a comprehensive content creator platform built on Sui blockchain using Move. The system enables brands to create advertising campaigns with automated payments, content approval workflows, and transparent performance tracking. Built by the Harmonia Team, this platform serves as a bridge between content creators and brands with trustless smart contract execution.

## Architecture & Design

### Package Information
- **Name**: `swans`
- **Version**: 1.0.0
- **Edition**: 2024.beta
- **Authors**: Harmonia Team
- **License**: MIT
- **Framework**: Sui Framework (devnet branch)

### Named Addresses
```toml
swans = "0x0"      # Main package address
harmonia = "0x0"   # Harmonia ecosystem address
```

### Module Structure
The project follows Sui Move conventions with organized module responsibilities:

```
sources/
├── lib.move          # Core utilities and shared functions
├── types.move        # Common data structures and enums
├── events.move       # Platform-wide event definitions
├── registry.move     # Global registry and platform state
├── profiles.move     # User profile management (brands/creators)
├── creator.move      # Creator-specific functionality
├── brand.move        # Brand-specific functionality
├── campaign.move     # Campaign lifecycle management
├── content.move      # Content submission and review system
├── payment.move      # Payment processing and escrow
├── dispute.move      # Dispute resolution system
└── usdc.move         # USDC integration (mock for testing)
```

## Development Conventions

### Sui Move Code Standards

#### Import Best Practices
**AVOID** unnecessary default aliases to prevent linter warnings:
- ❌ `use sui::object::{Self, UID, ID};` 
- ❌ `use sui::tx_context::{Self, TxContext};`
- ❌ `use std::option::{Self, Option};`
- ❌ `use std::vector;`
- ❌ `use sui::transfer;`

**PREFER** minimal imports or omit default aliases entirely:
- ✅ `use sui::event;`
- ✅ `use sui::clock::{Self, Clock};` (when using both module and type)
- ✅ `use std::string::String;` (when explicitly using String type)

**Rationale**: These types are available by default in Move - explicit imports create duplicate alias warnings

#### Naming Conventions
- **Constants**: `UPPERCASE_SNAKE_CASE` for standard constants
- **Error Constants**: `EErrorDescription` (PascalCase with 'E' prefix)
- **Structs**: `PascalCase` with descriptive suffixes (`UserProfile`, `CampaignCreatedEvent`)
- **Functions**: `snake_case` with standard CRUD patterns
- **Modules**: `snake_case` for module names

#### Code Organization Pattern
Each module follows this structured layout:
```move
module swans::module_name {
    // === Imports ===
    // IMPORTANT: Avoid unnecessary default aliases - use minimal imports
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::String;
    
    // === Errors ===
    const EUnauthorized: u64 = 0;
    const EInvalidInput: u64 = 1;
    
    // === Constants ===
    const MAX_CAMPAIGNS_PER_BRAND: u64 = 100;
    const MIN_CAMPAIGN_DURATION: u64 = 86400000; // 1 day in ms
    
    // === Structs ===
    public struct MyObject has key, store {
        id: UID,
        // fields...
    }
    
    // === Events ===
    public struct MyEvent has copy, drop {
        // event fields...
    }
    
    // === Public Functions (no 'entry' modifier) ===
    
    // === Public View Functions ===
    
    // === Internal Functions ===
}
```

#### Object Design Principles
- **Owned Objects**: Used for user-specific assets (profiles, personal campaign applications)
- **Shared Objects**: Used for multi-party interactions (active campaigns, disputes)
- **Capability Pattern**: Access control through capability objects
- **Event-Driven**: Comprehensive events for off-chain indexing

#### Function Design Standards
- **Public Functions**: Remove `entry` modifier for better composability (use `public fun` not `public entry fun`)
- **View Functions**: Read-only functions for querying state
- **Internal Functions**: Private helper functions
- **Pure Functions**: Stateless functions when possible
- **Unused Parameters**: Prefix with underscore (`_ctx: &mut TxContext`) to suppress warnings

#### Linter Warning Prevention
**Always run `sui move build` and fix all warnings before committing**

Common warnings to avoid:
- **W02021 Duplicate Alias**: Remove unnecessary default imports
- **W99010 Unnecessary Entry**: Use `public fun` instead of `public entry fun`
- **W09002 Unused Variable**: Prefix unused params with `_`
- **W09001 Unused Import**: Remove unused use statements
- **W09011 Unused Constants**: Remove or suppress unused constants

**Acceptable Warnings**:
- **W99001 Self Transfer**: Expected for user registration and withdrawal functions

## Development Workflow

### Setup & Installation
```bash
# Install Sui CLI (latest version)
curl -fsSL https://sui.io/install.sh | sh

# Verify installation
sui --version

# Navigate to project directory
cd /Users/user/development/sui/swans-sui
```

### Local Development Commands

#### Build & Compilation
```bash
# Build the package
sui move build

# Build with verbose output
sui move build --dump-bytecode-as-base64

# Check package dependencies
sui move build --print-diags-to-stderr
```

#### Testing
```bash
# Run all tests
sui move test

# Run specific test module
sui move test --filter campaign_tests

# Run tests with coverage
sui move test --coverage

# Generate coverage summary
sui move coverage summary --include-test-functions
```

#### Project Validation
```bash
# Run system validation (custom script)
./validate_system.sh

# Run test validation (custom script)
./test_validation.sh
```

### Network Configuration

#### Connect to Networks
```bash
# Switch to devnet (development)
sui client switch --env devnet

# Switch to testnet (testing)
sui client switch --env testnet

# Switch to mainnet (production)
sui client switch --env mainnet

# Check current network
sui client active-env
```

#### Account Management
```bash
# Check active address
sui client active-address

# List all addresses
sui client addresses

# Get SUI tokens from faucet (testnet/devnet only)
sui client faucet

# Check balance
sui client balance
```

### Deployment Process

#### Local Deployment
```bash
# Deploy to current network
sui client publish --gas-budget 100000000

# Deploy with specific gas budget
sui client publish --gas-budget 200000000 --skip-fetch-latest-git-deps
```

#### Using Custom Scripts
```bash
# Deploy using custom deployment script
./scripts/deploy.sh

# Setup demo environment
./scripts/setup_demo.sh
```

## Key Development Patterns

### Object Lifecycle Management
```move
// Standard object creation pattern
public fun create_campaign(/* params */, ctx: &mut TxContext): Campaign {
    let campaign = Campaign {
        id: object::new(ctx),
        // initialize fields...
    };
    campaign
}

// Transfer patterns
transfer::transfer(object, recipient);           // Owned object
transfer::share_object(object);                  // Shared object
transfer::public_transfer(object, recipient);    // Public transfer
```

### Capability-Based Access Control
```move
// Define capabilities
public struct AdminCap has key, store { id: UID }
public struct BrandCap has key, store { id: UID, brand_id: ID }

// Use in functions
public fun admin_function(_: &AdminCap, /* params */) {
    // Only admin can call this function
}
```

### Event Emission Pattern
```move
use sui::event;

// Define event
public struct CampaignCreated has copy, drop {
    campaign_id: ID,
    brand_id: String,
    budget: u64,
}

// Emit event
event::emit(CampaignCreated {
    campaign_id: object::uid_to_inner(&campaign.id),
    brand_id: campaign.brand_id,
    budget: campaign.total_budget,
});
```

## Testing Strategy

### Test Organization
```
tests/
├── unit/
│   ├── campaign_tests.move      # Campaign lifecycle
│   ├── content_tests.move       # Content workflows
│   ├── payment_tests.move       # Payment processing
│   └── dispute_tests.move       # Dispute resolution
├── integration/
│   ├── e2e_campaign_flow.move   # End-to-end scenarios
│   └── multi_user_scenarios.move
└── scenario/
    ├── brand_workflows.move     # Brand user journeys
    └── creator_workflows.move   # Creator user journeys
```

### Test Categories
1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Module interaction testing
3. **Scenario Tests**: Complete workflow testing
4. **Property Tests**: Invariant verification

## Error Handling

### Error Code Ranges
```move
// Registry errors (1-99)
const EInvalidRegistry: u64 = 1;
const ERegistryNotInitialized: u64 = 2;

// Campaign errors (100-199)
const ECampaignNotFound: u64 = 100;
const ECampaignNotActive: u64 = 101;
const EInsufficientFunds: u64 = 102;

// Content errors (200-299)
const EContentNotFound: u64 = 200;
const EContentAlreadyReviewed: u64 = 201;

// Payment errors (300-399)
const EPaymentAlreadyProcessed: u64 = 300;
const EInsufficientBalance: u64 = 301;

// Access control errors (400-499)
const EUnauthorized: u64 = 400;
const EInvalidCapability: u64 = 401;
```

## Gas Management

### Estimated Gas Costs
| Operation | Gas Budget | Notes |
|-----------|------------|-------|
| Register Brand | 15M SUI | One-time setup |
| Register Creator | 12M SUI | One-time setup |
| Create Campaign | 50M SUI | Creates shared objects |
| Apply to Campaign | 10M SUI | Simple application |
| Submit Content | 15M SUI | Content creation |
| Review Content | 12M SUI | Brand review process |
| Publish Content | 25M SUI | Includes base payment |
| Process Bonus Payment | 20M SUI | Complex calculation |
| File Dispute | 18M SUI | Creates shared dispute |

### Gas Optimization Tips
- Batch operations when possible
- Use efficient data structures
- Minimize object creation
- Leverage parallel execution through object design

## Security Best Practices

### Input Validation
```move
// Always validate inputs
assert!(!string::is_empty(&name), EInvalidInput);
assert!(amount > 0, EInvalidAmount);
assert!(vector::length(&items) <= MAX_ITEMS, ETooManyItems);
```

### Access Control
```move
// Verify ownership/capability
assert!(object::owner(obj) == tx_context::sender(ctx), EUnauthorized);

// Use capability pattern
public fun restricted_function(_cap: &AdminCap, /* params */) {
    // Function body - capability proves authorization
}
```

### Safe Arithmetic
```move
// Handle overflow/underflow
let result = (a as u128) + (b as u128);
assert!(result <= (U64_MAX as u128), EArithmeticOverflow);
```

## Resources & Documentation

### Sui Ecosystem
- [Sui Documentation](https://docs.sui.io/)
- [Sui Move Book](https://move-book.com/)
- [Sui Examples](https://github.com/MystenLabs/sui/tree/main/examples)

### Development Tools
- **VS Code Extension**: Move Analyzer
- **Sui CLI**: Primary development tool
- **Sui Explorer**: Transaction and object inspection

### Community Resources
- [Sui Discord](https://discord.gg/sui)
- [Sui Forum](https://forum.sui.io/)
- [Move Developer Portal](https://move-developers.com/)

## Project-Specific Workflows

### Brand Workflow
1. Register brand account: `brand::register_brand()`
2. Fund brand account: `brand::fund_brand_account()`
3. Create campaign: `campaign::create_campaign()`
4. Review content submissions: `content::review_content()`
5. Update engagement metrics: `content::update_engagement_metrics()`
6. Select winners: `campaign::select_campaign_winners()`

### Creator Workflow
1. Register creator account: `creator::register_creator()`
2. Apply to campaigns: `campaign::apply_to_campaign()`
3. Submit content: `content::submit_content()`
4. Publish approved content: `content::publish_content()`
5. Receive payments automatically
6. Track performance metrics

### Payment System
- **Base Payments**: Automatic on content publication
- **Bonus Payments**: Performance-based using CPM rates
- **Escrow System**: Secure fund holding via shared objects
- **Receipt Generation**: On-chain payment records

## Important CLI Commands

### Object Inspection
```bash
# View object details
sui client object <OBJECT_ID>

# List owned objects
sui client objects

# View object by type
sui client objects --filter <TYPE>
```

### Function Calls
```bash
# Call package function
sui client call --package <PKG_ID> --module <MODULE> --function <FUNC> --args <ARGS> --gas-budget <BUDGET>

# Example: Register as creator
sui client call --package $PACKAGE_ID --module creator --function register_creator \
  --args $REGISTRY_ID "creator_id" "Display Name" "image_url" "category" "@twitter" "@instagram" "@tiktok" "@youtube" $CLOCK_ID \
  --gas-budget 15000000
```

### Transaction Analysis
```bash
# View transaction details
sui client transaction-block <TX_HASH>

# View transaction events
sui client transaction-block <TX_HASH> --show-events
```

## Status & Roadmap

### Current Implementation Status
- ✅ Core object definitions
- ✅ Basic campaign lifecycle
- ✅ Content submission workflow
- ✅ Payment processing system
- ⏳ Dispute resolution (in development)
- ⏳ Advanced analytics (planned)

### Next Steps
1. Complete dispute resolution system
2. Implement batch operations for efficiency
3. Add governance mechanisms
4. Integrate with external APIs
5. Deploy to mainnet

## Contact & Support

For technical questions or contributions:
- Project Repository: Current directory
- Team: Harmonia Development Team
- License: MIT

This CLAUDE.md serves as the comprehensive guide for developing, testing, and deploying the SWANS content creator platform on Sui blockchain.