# Swans API Documentation

Complete reference for all Swans smart contract functions and their usage.

## Table of Contents
- [Registry Functions](#registry-functions)
- [Brand Functions](#brand-functions)
- [Creator Functions](#creator-functions)
- [Campaign Functions](#campaign-functions)
- [Content Functions](#content-functions)
- [Payment Functions](#payment-functions)
- [Dispute Functions](#dispute-functions)
- [Events](#events)
- [Error Codes](#error-codes)

## Registry Functions

### Platform Management

#### `init()`
**Description**: Initialize the platform registry (called automatically on deploy)
**Access**: Deploy-time only
**Gas**: ~1M SUI

---

## Brand Functions

### Brand Registration & Management

#### `register_brand()`
```move
public entry fun register_brand(
    registry: &mut PlatformRegistry,
    brand_id: String,
    brand_name: String,
    profile_image: String,
    description: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Register a new brand on the platform
**Access**: Anyone
**Parameters**:
- `registry`: Platform registry object
- `brand_id`: Unique identifier (e.g., "nike")
- `brand_name`: Display name (e.g., "Nike")
- `profile_image`: Image URL
- `description`: Brand description
- `clock`: Sui clock object
- `ctx`: Transaction context

**Returns**: Creates Brand object, transfers to caller
**Events**: `BrandRegistered`
**Gas**: ~10M SUI

**CLI Example**:
```bash
sui client call --package $PACKAGE_ID --module brand --function register_brand \
  --args $REGISTRY_ID "nike" "Nike" "https://nike.com/logo.png" "Just Do It" $CLOCK_ID \
  --gas-budget 10000000
```

#### `fund_brand_account()`
```move
public entry fun fund_brand_account(
    brand: &mut Brand,
    payment: Coin<USDC>,
    ctx: &mut TxContext
)
```

**Description**: Add USDC funds to brand account for campaigns
**Access**: Brand owner only
**Parameters**:
- `brand`: Brand object
- `payment`: USDC coin to deposit
- `ctx`: Transaction context

**Events**: `BrandFunded`
**Gas**: ~5M SUI

#### `withdraw_brand_funds()`
```move
public entry fun withdraw_brand_funds(
    brand: &mut Brand,
    amount: u64,
    ctx: &mut TxContext
)
```

**Description**: Withdraw unused USDC from brand account
**Access**: Brand owner only
**Parameters**:
- `brand`: Brand object  
- `amount`: Amount to withdraw in USDC
- `ctx`: Transaction context

**Gas**: ~5M SUI

#### `update_brand_profile()`
```move
public entry fun update_brand_profile(
    brand: &mut Brand,
    brand_name: String,
    profile_image: String,
    description: String,
    ctx: &mut TxContext
)
```

**Description**: Update brand profile information
**Access**: Brand owner only
**Gas**: ~3M SUI

---

## Creator Functions

### Creator Registration & Management

#### `register_creator()`
```move
public entry fun register_creator(
    registry: &mut PlatformRegistry,
    creator_id: String,
    name: String,
    profile_image: String,
    category: String,
    twitter: String,
    instagram: String,
    tiktok: String,
    youtube: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Register a new creator on the platform
**Access**: Anyone
**Parameters**:
- `registry`: Platform registry object
- `creator_id`: Unique identifier (e.g., "fitness_guru")
- `name`: Display name (e.g., "John Doe")
- `profile_image`: Profile image URL
- `category`: Content category (e.g., "fitness", "lifestyle")
- `twitter`: Twitter handle
- `instagram`: Instagram handle
- `tiktok`: TikTok handle
- `youtube`: YouTube handle
- `clock`: Sui clock object
- `ctx`: Transaction context

**Returns**: Creates Creator object, transfers to caller
**Events**: `CreatorRegistered`
**Gas**: ~12M SUI

**CLI Example**:
```bash
sui client call --package $PACKAGE_ID --module creator --function register_creator \
  --args $REGISTRY_ID "fitness_guru" "John Doe" "https://example.com/john.jpg" "fitness" "@johndoe" "@johndoe_insta" "@johndoe_tiktok" "@johndoe_youtube" $CLOCK_ID \
  --gas-budget 15000000
```

#### `update_creator_profile()`
```move
public entry fun update_creator_profile(
    creator: &mut Creator,
    name: String,
    profile_image: String,
    category: String,
    ctx: &mut TxContext
)
```

**Description**: Update creator profile information
**Access**: Creator owner only
**Gas**: ~3M SUI

#### `update_social_media_handles()`
```move
public entry fun update_social_media_handles(
    creator: &mut Creator,
    twitter: String,
    instagram: String,
    tiktok: String,
    youtube: String,
    ctx: &mut TxContext
)
```

**Description**: Update social media handles
**Access**: Creator owner only
**Gas**: ~3M SUI

#### `verify_creator()`
```move
public entry fun verify_creator(
    registry: &PlatformRegistry,
    creator: &mut Creator,
    ctx: &mut TxContext
)
```

**Description**: Mark creator as platform-verified
**Access**: Admin only
**Gas**: ~2M SUI

---

## Campaign Functions

### Campaign Management

#### `create_campaign()`
```move
public entry fun create_campaign(
    registry: &mut PlatformRegistry,
    brand: &mut Brand,
    campaign_id: String,
    campaign_type: String,
    application_start: u64,
    application_end: u64,
    campaign_start: u64,
    campaign_end: u64,
    base_pay_per_creator: u64,
    total_budget: u64,
    cpm_likes: u64,
    cmp_views: u64,
    cpm_retweets: u64,
    cpm_comments: u64,
    cpm_link_clicks: u64,
    max_winners: u64,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Create a new advertising campaign
**Access**: Brand owner only
**Parameters**:
- `registry`: Platform registry
- `brand`: Brand object (must have sufficient funds)
- `campaign_id`: Unique campaign identifier
- `campaign_type`: Campaign category
- `application_start/end`: Application period (milliseconds)
- `campaign_start/end`: Campaign period (milliseconds)
- `base_pay_per_creator`: Fixed payment per content publication (USDC)
- `total_budget`: Total campaign budget (USDC)
- `cpm_*`: Cost per 100 engagements for each metric (USDC)
- `max_winners`: Maximum number of winners for bonuses
- `clock`: Sui clock object
- `ctx`: Transaction context

**Returns**: Creates shared Campaign object
**Events**: `CampaignCreated`
**Gas**: ~50M SUI

**CLI Example**:
```bash
sui client call --package $PACKAGE_ID --module campaign --function create_campaign \
  --args $REGISTRY_ID $BRAND_ID "summer_2024" "lifestyle" 1000000 2000000 2500000 5000000 100 5000 1 2 5 3 10 5 $CLOCK_ID \
  --gas-budget 50000000
```

#### `apply_to_campaign()`
```move
public entry fun apply_to_campaign(
    campaign: &mut Campaign,
    creator: &Creator,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Apply to participate in a campaign (auto-approved)
**Access**: Creator owner only
**Requirements**: 
- Campaign must be active
- Within application period
- Creator hasn't already applied

**Events**: `CampaignApplicationSubmitted`
**Gas**: ~10M SUI

#### `update_campaign_status()`
```move
public entry fun update_campaign_status(
    campaign: &mut Campaign,
    new_status: u8,
    ctx: &mut TxContext
)
```

**Description**: Update campaign status
**Access**: Brand owner only
**Parameters**:
- `new_status`: 0=Draft, 1=Active, 2=Paused, 3=Completed, 4=Cancelled

**Events**: `CampaignStatusUpdated`
**Gas**: ~3M SUI

#### `select_campaign_winners()`
```move
public entry fun select_campaign_winners(
    campaign: &mut Campaign,
    winners: vector<String>,
    ctx: &mut TxContext
)
```

**Description**: Select winning creators for bonus payments
**Access**: Brand owner only
**Parameters**:
- `winners`: Vector of creator IDs

**Events**: `WinnersSelected`
**Gas**: ~15M SUI

---

## Content Functions

### Content Submission & Review

#### `submit_content()`
```move
public entry fun submit_content(
    campaign: &mut Campaign,
    creator: &Creator,
    content_id: String,
    content_link: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Submit content for brand review
**Access**: Applied creator only
**Requirements**:
- Creator must have applied to campaign
- Campaign must be active

**Events**: `ContentSubmitted`
**Gas**: ~15M SUI

**CLI Example**:
```bash
sui client call --package $PACKAGE_ID --module content --function submit_content \
  --args $CAMPAIGN_ID $CREATOR_ID "content_001" "https://instagram.com/p/abc123/" $CLOCK_ID \
  --gas-budget 15000000
```

#### `review_content()`
```move
public entry fun review_content(
    campaign: &Campaign,
    content: &mut Content,
    approve: bool,
    reviewer_notes: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Review and approve/reject submitted content
**Access**: Brand owner only
**Parameters**:
- `approve`: true to approve, false to reject
- `reviewer_notes`: Feedback for creator

**Events**: `ContentReviewed`
**Gas**: ~10M SUI

#### `publish_content()`
```move
public entry fun publish_content(
    campaign: &mut Campaign,
    content: &mut Content,
    creator: &mut Creator,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Publish approved content (triggers base payment)
**Access**: Content owner only
**Requirements**: Content must be approved

**Side Effects**:
- Transfers base payment to creator
- Creates payment receipt
- Updates creator earnings

**Events**: `ContentPublished`, `PaymentProcessed`
**Gas**: ~20M SUI

#### `update_engagement_metrics()`
```move
public entry fun update_engagement_metrics(
    campaign: &Campaign,
    content: &mut Content,
    likes: u64,
    views: u64,
    retweets: u64,
    comments: u64,
    link_clicks: u64,
    ctx: &mut TxContext
)
```

**Description**: Update engagement metrics for published content
**Access**: Brand owner only
**Requirements**: Content must be published

**Events**: `EngagementMetricsUpdated`
**Gas**: ~10M SUI

#### `process_bonus_payment()`
```move
public entry fun process_bonus_payment(
    campaign: &mut Campaign,
    content: &Content,
    creator: &mut Creator,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Process engagement-based bonus payment
**Access**: Brand owner only
**Requirements**: 
- Creator must be selected as winner
- Content must be published
- Engagement metrics must be set

**Side Effects**:
- Calculates bonus based on CPM rates
- Transfers bonus payment to creator
- Creates payment receipt

**Events**: `PaymentProcessed`
**Gas**: ~20M SUI

---

## Payment Functions

### Payment Receipt Management

#### `create_base_payment_receipt()`
```move
public fun create_base_payment_receipt(
    campaign_id: String,
    recipient_id: String,
    recipient_address: address,
    amount: u64,
    payment_timestamp: u64,
    ctx: &mut TxContext
)
```

**Description**: Create receipt for base payment (internal function)
**Access**: Internal only
**Events**: `PaymentReceiptCreated`, `PaymentProcessed`

#### `create_bonus_payment_receipt()`
```move
public fun create_bonus_payment_receipt(
    campaign_id: String,
    recipient_id: String,
    recipient_address: address,
    amount: u64,
    payment_timestamp: u64,
    ctx: &mut TxContext
)
```

**Description**: Create receipt for bonus payment (internal function)
**Access**: Internal only
**Events**: `PaymentReceiptCreated`, `PaymentProcessed`

---

## Dispute Functions

### Dispute Resolution

#### `open_dispute()`
```move
public entry fun open_dispute(
    campaign: &Campaign,
    dispute_id: String,
    creator_id: String,
    dispute_type: String,
    description: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Open a dispute between brand and creator
**Access**: Brand owner or applied creator
**Parameters**:
- `dispute_type`: "payment", "content", "contract_violation", etc.
- `description`: Detailed dispute description

**Events**: `DisputeOpened`
**Gas**: ~15M SUI

#### `add_dispute_evidence()`
```move
public entry fun add_dispute_evidence(
    dispute: &mut Dispute,
    evidence: String,
    ctx: &mut TxContext
)
```

**Description**: Add evidence to existing dispute
**Access**: Brand or creator involved in dispute
**Events**: `DisputeEvidenceAdded`
**Gas**: ~8M SUI

#### `resolve_dispute()`
```move
public entry fun resolve_dispute(
    registry: &PlatformRegistry,
    dispute: &mut Dispute,
    resolution_notes: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Resolve dispute (admin decision)
**Access**: Platform admin only
**Events**: `DisputeResolved`
**Gas**: ~10M SUI

#### `close_dispute_by_agreement()`
```move
public entry fun close_dispute_by_agreement(
    dispute: &mut Dispute,
    agreement_notes: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Description**: Close dispute by mutual agreement
**Access**: Brand or creator involved in dispute
**Events**: `DisputeResolved`
**Gas**: ~10M SUI

---

## Events

### Campaign Events

#### `CampaignCreated`
```move
public struct CampaignCreated has copy, drop {
    campaign_id: String,
    brand_id: String,
    budget: u64,
}
```

#### `CampaignApplicationSubmitted`
```move
public struct CampaignApplicationSubmitted has copy, drop {
    campaign_id: String,
    creator_id: String,
}
```

#### `WinnersSelected`
```move
public struct WinnersSelected has copy, drop {
    campaign_id: String,
    winners: vector<String>,
}
```

### Content Events

#### `ContentSubmitted`
```move
public struct ContentSubmitted has copy, drop {
    content_id: String,
    campaign_id: String,
    creator_id: String,
}
```

#### `ContentReviewed`
```move
public struct ContentReviewed has copy, drop {
    content_id: String,
    campaign_id: String,
    approved: bool,
    reviewer_notes: String,
}
```

#### `ContentPublished`
```move
public struct ContentPublished has copy, drop {
    content_id: String,
    campaign_id: String,
    creator_id: String,
}
```

### Payment Events

#### `PaymentProcessed`
```move
public struct PaymentProcessed has copy, drop {
    campaign_id: String,
    recipient_id: String,
    amount: u64,
    payment_type: u8, // 0=base, 1=bonus
    transaction_hash: String,
}
```

### User Events

#### `BrandRegistered`
```move
public struct BrandRegistered has copy, drop {
    brand_id: String,
    brand_name: String,
    owner: address,
}
```

#### `CreatorRegistered`
```move
public struct CreatorRegistered has copy, drop {
    creator_id: String,
    name: String,
    owner: address,
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | `E_NOT_AUTHORIZED` | Caller not authorized for this action |
| 2 | `E_CAMPAIGN_NOT_ACTIVE` | Campaign is not in active state |
| 3 | `E_INSUFFICIENT_FUNDS` | Insufficient funds for operation |
| 4 | `E_INVALID_STATUS` | Invalid status for operation |
| 5 | `E_CAMPAIGN_ENDED` | Campaign has ended |
| 6 | `E_ALREADY_APPLIED` | Creator already applied to campaign |
| 7 | `E_CONTENT_NOT_FOUND` | Content not found |
| 8 | `E_INVALID_WINNER_SELECTION` | Invalid winner selection |

---

## Gas Estimates

| Function | Estimated Gas | Notes |
|----------|---------------|-------|
| `register_brand` | 10M SUI | One-time registration |
| `register_creator` | 12M SUI | One-time registration |
| `create_campaign` | 50M SUI | Creates shared object |
| `apply_to_campaign` | 10M SUI | Simple application |
| `submit_content` | 15M SUI | Content submission |
| `publish_content` | 20M SUI | Includes payment transfer |
| `process_bonus_payment` | 20M SUI | Includes bonus calculation |
| `open_dispute` | 15M SUI | Creates shared dispute |
| `resolve_dispute` | 10M SUI | Admin resolution |

---

## Rate Limits & Best Practices

### Transaction Timing
- Wait for confirmation before chaining transactions
- Use proper error handling in client applications
- Monitor gas prices for optimal timing

### Object Management
- Keep track of object IDs for owned objects
- Use shared object IDs for campaign interactions
- Implement proper object lifecycle management

### Security Considerations
- Validate all inputs in client applications
- Implement proper access control checks
- Monitor for suspicious activity patterns
- Use multi-sig for high-value brand accounts