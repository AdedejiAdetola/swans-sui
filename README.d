# Swans Campaign Management System - Sui Move Implementation

A decentralized campaign management platform built on Sui blockchain using Move language, enabling brands to create advertising campaigns and manage creator partnerships with automated payments and dispute resolution.

## 🏗️ Architecture Overview

```
swans-sui/
├── Move.toml                    # Project configuration
├── sources/
│   ├── types.move              # Common types and enums
│   ├── registry.move           # Platform registry
│   ├── brand.move              # Brand management
│   ├── creator.move            # Creator management  
│   ├── campaign.move           # Campaign management
│   ├── content.move            # Content submission system
│   ├── payment.move            # Payment processing
│   ├── dispute.move            # Dispute resolution
│   └── lib.move                # Main library exports
├── tests/
│   └── basic_tests.move        # Integration tests
├── scripts/
│   ├── deploy.sh               # Deployment script
│   ├── setup_demo.sh           # Demo setup script
│   └── interact.sh             # CLI interaction script
└── docs/
    ├── API.md                  # API documentation
    └── WORKFLOW.md             # User workflow guide
```

## 🎯 Core Features

### Campaign Management
- ✅ **Campaign Creation**: Brands can create campaigns with custom timing and budgets
- ✅ **Application System**: Auto-accepted creator applications within time windows
- ✅ **Escrow System**: Secure fund management with automatic payments
- ✅ **Winner Selection**: Brand-controlled winner selection with bonus distributions

### Payment System
- ✅ **Base Payments**: Automatic payment when content is published
- ✅ **Bonus Payments**: CPM-based performance bonuses (cost per 100 engagements)
- ✅ **Payment Receipts**: On-chain payment tracking and history
- ✅ **Multi-metric CPM**: Likes, views, retweets, comments, link clicks

### Content Workflow
- ✅ **Content Submission**: Creators submit content for brand approval
- ✅ **Review System**: Brand approval/rejection with notes
- ✅ **Status Tracking**: Draft → Pending → Accepted → Published workflow
- ✅ **Engagement Metrics**: Post-publication metric updates

### User Management
- ✅ **Brand Profiles**: Registration, funding, reputation tracking
- ✅ **Creator Profiles**: Registration, social handles, performance metrics
- ✅ **Verification System**: Admin-controlled verification status
- ✅ **Reputation System**: 5-star rating system for both brands and creators

### Dispute Resolution
- ✅ **Dispute Creation**: Brand or creator can open disputes
- ✅ **Evidence System**: Both parties can submit evidence
- ✅ **Admin Resolution**: Platform admin resolves disputes
- ✅ **Mutual Agreement**: Parties can close disputes by agreement

## 🚀 Quick Start

### Prerequisites
- [Sui CLI](https://docs.sui.io/build/install) installed
- Active Sui wallet with testnet SUI tokens

### Installation & Deployment

```bash
# Clone the repository
git clone <repository-url>
cd swans-sui

# Install dependencies and build
sui move build

# Run tests
sui move test

# Deploy to testnet
./scripts/deploy.sh testnet

# Or deploy with custom gas budget
./scripts/deploy.sh testnet 200000000
```

### Demo Setup

```bash
# Run the demo setup script
./scripts/setup_demo.sh

# This will:
# 1. Register a demo brand
# 2. Register demo creators  
# 3. Create a sample campaign
# 4. Walk through the complete workflow
```

## 📋 Usage Examples

### 1. Register a Brand

```bash
sui client call --package $PACKAGE_ID --module brand --function register_brand \
  --args $REGISTRY_ID "nike" "Nike" "https://nike.com/logo.png" "Just Do It" $CLOCK_ID \
  --gas-budget 10000000
```

### 2. Create a Campaign

```bash
sui client call --package $PACKAGE_ID --module campaign --function create_campaign \
  --args $REGISTRY_ID $BRAND_ID "summer_2024" "lifestyle" 1000000 2000000 2500000 5000000 100 5000 1 2 5 3 10 5 $CLOCK_ID \
  --gas-budget 50000000
```

### 3. Apply to Campaign (Creator)

```bash
sui client call --package $PACKAGE_ID --module campaign --function apply_to_campaign \
  --args $CAMPAIGN_ID $CREATOR_ID $CLOCK_ID \
  --gas-budget 10000000
```

## 💡 Key Concepts

### Campaign Lifecycle
1. **Creation**: Brand creates campaign with budget and CPM rates
2. **Application Period**: Creators apply (auto-accepted)
3. **Campaign Period**: Content creation and submission
4. **Review Phase**: Brand reviews and approves content
5. **Publication**: Content goes live, triggers base payment
6. **Engagement Tracking**: Metrics updated post-publication
7. **Winner Selection**: Brand selects winners, processes bonus payments
8. **Completion**: Campaign marked as completed

### Payment Structure
```
Total Payment = Base Payment + Engagement Bonus

Engagement Bonus = 
  (Likes ÷ 100) × CPM_Likes +
  (Views ÷ 100) × CPM_Views +
  (Retweets ÷ 100) × CPM_Retweets +
  (Comments ÷ 100) × CPM_Comments +
  (Link Clicks ÷ 100) × CPM_Link_Clicks
```

### Content Status Flow
```
Draft → Pending → Rejected/Accepted → Published
```

## 🔧 API Reference

### Brand Functions
- `register_brand()` - Register new brand
- `fund_brand_account()` - Add USDC to brand balance
- `withdraw_brand_funds()` - Withdraw unused funds
- `update_brand_profile()` - Update brand information

### Creator Functions  
- `register_creator()` - Register new creator
- `update_creator_profile()` - Update creator information
- `update_social_media_handles()` - Update social media links

### Campaign Functions
- `create_campaign()` - Create new campaign
- `apply_to_campaign()` - Apply to campaign (creator)
- `update_campaign_status()` - Update campaign status
- `select_campaign_winners()` - Select winning creators

### Content Functions
- `submit_content()` - Submit content for review
- `review_content()` - Approve/reject content (brand)
- `publish_content()` - Publish approved content
- `update_engagement_metrics()` - Update post metrics
- `process_bonus_payment()` - Process engagement bonuses

### Dispute Functions
- `open_dispute()` - Create new dispute
- `add_dispute_evidence()` - Add evidence to dispute
- `resolve_dispute()` - Resolve dispute (admin)
- `close_dispute_by_agreement()` - Mutual resolution

## 🧪 Testing

```bash
# Run all tests
sui move test

# Run specific test module
sui move test swans::basic_tests

# Run with verbose output
sui move test --verbose
```

### Test Coverage
- ✅ Full campaign workflow (creation → application → content → payment)
- ✅ Brand and creator registration
- ✅ Dispute resolution workflow
- ✅ Payment processing and receipts
- ✅ Content review and publication
- ✅ Error handling and access control

## 🔒 Security Features

### Access Control
- **Brand-only functions**: Campaign creation, content review, winner selection
- **Creator-only functions**: Content submission, publication
- **Admin-only functions**: Dispute resolution, user verification
- **Owner validation**: All functions verify caller ownership

### Financial Security
- **Escrow system**: Campaign funds held in secure escrow until distributed
- **Balance validation**: Insufficient fund checks before operations
- **Payment receipts**: All payments tracked with on-chain receipts
- **Dispute protection**: Formal dispute resolution for payment conflicts

### Data Integrity
- **Immutable records**: All major actions recorded in events
- **Status validation**: Strict state machine enforcement
- **Time-based controls**: Application and campaign period validation
- **Unique identifiers**: Prevents duplicate registrations

## 🌍 Network Configuration

### Testnet Deployment
```bash
Network: Sui Testnet
RPC: https://fullnode.testnet.sui.io:443
Faucet: https://faucet.testnet.sui.io/
```

### Mainnet Considerations
- Increase gas budgets for production
- Implement proper key management
- Set up monitoring and alerting
- Consider multi-sig for admin functions

## 📈 Metrics & Analytics

The platform emits comprehensive events for off-chain analytics:

- `CampaignCreated` - New campaign data
- `ContentSubmitted` - Content submission tracking
- `PaymentProcessed` - All payment events
- `WinnersSelected` - Winner announcement
- `DisputeOpened` - Dispute tracking
- `EngagementMetricsUpdated` - Performance data

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`sui move test`)
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub issues
- **Community**: Join our Discord for discussions

## 🗺️ Roadmap

- [ ] **V1.1**: Multi-token support (not just USDC)
- [ ] **V1.2**: Automated dispute resolution via oracles
- [ ] **V1.3**: Creator NFT badges and achievements
- [ ] **V1.4**: Campaign templates and cloning
- [ ] **V1.5**: Advanced analytics dashboard
- [ ] **V2.0**: Cross-chain campaign support

---

**Built with ❤️ on Sui blockchain using Move language**