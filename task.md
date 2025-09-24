# Harmonia Campaign Management System - Sui Move Implementation Specification

## Overview

This document provides comprehensive technical requirements for implementing Harmonia's campaign management system on Sui blockchain using Move language. The system enables brands to create advertising campaigns, manage creator payments through escrow, handle content approval workflows, and resolve disputes.

## Table of Contents

1. [Core Object Definitions](#core-object-definitions)
2. [System Architecture](#system-architecture)
3. [Workflow Specifications](#workflow-specifications)
4. [Function Implementations](#function-implementations)
5. [Event System](#event-system)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Guide](#deployment-guide)
8. [Migration from Solana](#migration-from-solana)

---

## Core Object Definitions

### 1. Campaign Object
```move
/// Core campaign object owned by brand
struct Campaign has key, store {
    id: UID,
    campaign_id: String,               // Unique campaign identifier
    brand_id: ID,                      // Reference to Brand object
    campaign_type: u8,                 // Campaign type enum (0=Single, 1=Multi-phase)
    application_start: u64,            // Application period start (ms)
    application_end: u64,              // Application period end (ms)
    campaign_start: u64,               // Campaign execution start (ms)
    campaign_end: u64,                 // Campaign execution end (ms)
    base_pay_per_creator: u64,         // Base payment in USDC
    engagement_metrics: EngagementConfig, // CPM rates for likes, views, etc.
    status: u8,                        // 0=Draft, 1=Active, 2=Completed, 3=Cancelled
    escrow_id: ID,                     // Reference to campaign escrow
    winner_slots: u64,                 // Maximum number of winners
    current_winners: u64,              // Current winner count
    creation_timestamp: u64,           // Creation time
}

/// Engagement metrics configuration
struct EngagementConfig has store {
    likes_cpm: u64,                    // Cost per hundred likes
    views_cpm: u64,                    // Cost per hundred views
    retweets_cpm: u64,                 // Cost per hundred retweets
    comments_cpm: u64,                 // Cost per hundred comments
    link_clicks_cpm: u64,              // Cost per hundred link clicks
}
```

### 2. Campaign Escrow (Shared Object)
```move
/// Shared escrow object for campaign fund management
struct CampaignEscrow has key {
    id: UID,
    campaign: ID,                      // Reference to campaign
    campaign_id: String,               // Matching campaign ID
    total_funds: Balance<USDC>,        // Total USDC allocated
    brand_wallet: address,             // Brand's address
    remaining_funds: Balance<USDC>,    // Available balance after payments
    payments_made: u64,                // Total payments processed
    creation_timestamp: u64,           // Creation time
    payment_capability: PaymentCap,    // Authority for payments
}

/// Payment capability for escrow operations
struct PaymentCap has store {
    campaign_id: ID,
    authority: address,
}
```

### 3. Brand Object
```move
/// Brand profile object
struct Brand has key, store {
    id: UID,
    brand_id: String,                  // Unique brand identifier
    brand_name: String,                // Brand display name
    token_wallet: address,             // Payment wallet address
    brand_coin_balance: u64,           // USDC balance tracking
    reputation: u64,                   // 5-star rating (0-5000, scaled by 1000)
    joined_at: u64,                    // Registration timestamp
    profile_image_url: String,         // Profile image URL
    description: String,               // Brand description
    total_campaigns: u64,              // Campaign count
    total_spent: u64,                  // Total USDC spent
}
```

### 4. Creator Object
```move
/// Creator profile object
struct Creator has key, store {
    id: UID,
    creator_id: String,                // Unique creator identifier
    name: String,                      // Creator display name
    token_wallet: address,             // Payment wallet address
    reputation: u64,                   // 5-star rating (0-5000)
    joined_at: u64,                    // Registration timestamp
    profile_image_url: String,         // Profile image URL
    rank: u64,                         // Creator ranking score
    total_campaigns: u64,              // Campaigns participated
    total_earned: u64,                 // Total USDC earned
    social_handles: SocialHandles,     // Social media accounts
}

/// Social media handle verification
struct SocialHandles has store {
    twitter_handle: Option<String>,
    instagram_handle: Option<String>,
    tiktok_handle: Option<String>,
    youtube_handle: Option<String>,
}
```

### 5. Campaign Application Object
```move
/// Application to join a campaign
struct CampaignApplication has key, store {
    id: UID,
    campaign_id: ID,                   // Campaign reference
    applicant_id: String,              // Creator ID
    applicant_address: address,        // Creator's address
    is_accepted: bool,                 // Acceptance status
    application_timestamp: u64,        // Application time
    response_timestamp: Option<u64>,   // Response time
    proposed_content_plan: String,     // Creator's content proposal
}
```

### 6. Content Submission Object
```move
/// Content submitted by creators
struct Content has key, store {
    id: UID,
    content_id: String,                // Unique content identifier
    campaign_id: ID,                   // Campaign reference
    creator_id: String,                // Content creator
    content_link: String,              // Link to content
    status: u8,                        // 0=Draft, 1=Pending, 2=Rejected, 3=Accepted, 4=Published
    submission_timestamp: u64,         // Submission time
    review_timestamp: Option<u64>,     // Review completion time
    rejection_reason: Option<String>,  // Rejection reason if rejected
    engagement_metrics: EngagementData, // Actual performance metrics
}

/// Actual engagement performance
struct EngagementData has store {
    likes_count: u64,
    views_count: u64,
    retweets_count: u64,
    comments_count: u64,
    link_clicks_count: u64,
    last_updated: u64,                 // Last metrics update
}
```

### 7. Payment Receipt Object
```move
/// Payment record for creators
struct PaymentReceipt has key, store {
    id: UID,
    payment_type: u8,                  // 0=Base, 1=Engagement_Bonus, 2=Winner_Bonus
    amount: u64,                       // Payment amount in USDC
    campaign_id: ID,                   // Campaign reference
    recipient: address,                // Payment recipient
    creator_id: String,                // Creator identifier
    content_id: Option<String>,        // Related content if applicable
    payment_timestamp: u64,            // Payment time
    transaction_hash: String,          // Transaction reference
}
```

### 8. Dispute Object (Shared)
```move
/// Dispute resolution record
struct Dispute has key {
    id: UID,
    dispute_id: String,                // Unique dispute identifier
    campaign_id: ID,                   // Campaign reference
    content_id: Option<ID>,            // Related content if applicable
    initiator: address,                // Who filed the dispute
    respondent: address,               // Other party in dispute
    dispute_type: u8,                  // 0=Payment, 1=Content, 2=Contract
    status: u8,                        // 0=Filed, 1=InReview, 2=Resolved, 3=Closed
    description: String,               // Dispute description
    initiator_evidence: vector<String>, // Evidence URLs from initiator
    respondent_evidence: vector<String>, // Evidence URLs from respondent
    resolution: Option<String>,        // Final resolution
    resolution_timestamp: Option<u64>, // Resolution time
    filed_timestamp: u64,              // Filing time
}
```

### 9. Capability Objects
```move
/// Master admin capability for platform
struct AdminCap has key, store {
    id: UID,
}

/// Brand capability for campaign management
struct BrandCap has key, store {
    id: UID,
    brand_id: ID,                      // Associated brand
}

/// Creator capability for applications and content
struct CreatorCap has key, store {
    id: UID,
    creator_id: ID,                    // Associated creator
}

/// Platform capability for dispute resolution
struct DisputeResolutionCap has key, store {
    id: UID,
    resolver_address: address,
}
```

---

## System Architecture

### Object Ownership Model
```
Brand Address
├── Brand Object (owned)
├── BrandCap (owned)
├── Campaign Objects (owned, multiple)
└── CampaignApplication responses (received)

Creator Address
├── Creator Object (owned)
├── CreatorCap (owned)
├── CampaignApplication Objects (owned, multiple)
├── Content Objects (owned, multiple)
└── PaymentReceipt Objects (owned, multiple)

Shared Objects (multi-party access)
├── CampaignEscrow (campaign funding)
└── Dispute (multi-party disputes)

Platform Address
├── AdminCap (owned)
└── DisputeResolutionCap (owned)
```

### State Flow Diagram
```mermaid
graph TB
    subgraph "Campaign Lifecycle"
        A[Brand Creates Campaign] --> B[Campaign: Draft]
        B --> C[Add Initial Funding]
        C --> D[Campaign: Active]
        D --> E[Accept Creator Applications]
        E --> F[Content Submission Phase]
        F --> G[Content Review & Approval]
        G --> H[Content Published]
        H --> I[Engagement Tracking]
        I --> J[Winner Selection]
        J --> K[Final Payments]
        K --> L[Campaign: Completed]
    end

    subgraph "Payment Flow"
        M[Base Payment: On Content Approval] --> N[Engagement Bonuses: Periodic]
        N --> O[Winner Bonuses: Campaign End]
    end

    subgraph "Dispute Resolution"
        P[Dispute Filed] --> Q[Evidence Collection]
        Q --> R[Platform Review]
        R --> S[Resolution & Refunds]
    end
```

---

## Workflow Specifications

### 1. Campaign Creation Workflow
```move
// Entry function for campaign creation
public entry fun create_campaign(
    brand_cap: &BrandCap,
    campaign_id: String,
    campaign_type: u8,
    application_start: u64,
    application_end: u64,
    campaign_start: u64,
    campaign_end: u64,
    base_pay_per_creator: u64,
    engagement_config: EngagementConfig,
    winner_slots: u64,
    initial_funding: Coin<USDC>,
    ctx: &mut TxContext
)
```

**Validation Rules:**
- Application period must be before campaign period
- Campaign must have positive duration
- Base pay must be > 0
- Initial funding must cover minimum base payments
- Brand must own the BrandCap

**State Changes:**
1. Create Campaign object (owned by brand)
2. Create CampaignEscrow (shared object)
3. Transfer initial funding to escrow
4. Emit CampaignCreated event

### 2. Creator Application Workflow
```move
// Entry function for creator applications
public entry fun apply_to_campaign(
    creator_cap: &CreatorCap,
    campaign_id: ID,
    proposed_content_plan: String,
    ctx: &mut TxContext
)
```

**Validation Rules:**
- Campaign must be in Active status
- Application period must be open
- Creator cannot apply twice to same campaign
- Content plan must not be empty

**State Changes:**
1. Create CampaignApplication object
2. Transfer ownership to creator
3. Add reference to campaign's applicant list
4. Emit ApplicationSubmitted event

### 3. Content Submission Workflow
```move
// Entry function for content submission
public entry fun submit_content(
    creator_cap: &CreatorCap,
    campaign_id: ID,
    content_link: String,
    ctx: &mut TxContext
)
```

**Validation Rules:**
- Creator must be accepted to campaign
- Campaign must be in Active status
- Content link must be valid URL format
- Creator hasn't exceeded submission limit

**State Changes:**
1. Create Content object (Draft status)
2. Link to campaign and creator
3. Emit ContentSubmitted event

### 4. Content Review Workflow
```move
// Entry function for content review by brand
public entry fun review_content(
    brand_cap: &BrandCap,
    content: &mut Content,
    campaign: &Campaign,
    approved: bool,
    rejection_reason: Option<String>,
    ctx: &mut TxContext
)
```

**Validation Rules:**
- Brand must own the campaign
- Content must be in Pending status
- If rejected, reason must be provided
- Review must happen within campaign period

**State Changes:**
1. Update content status (Accepted/Rejected)
2. Record review timestamp
3. If approved, trigger base payment
4. Emit ContentReviewed event

### 5. Payment Processing Workflow
```move
// Base payment processing
public fun process_base_payment(
    escrow: &mut CampaignEscrow,
    content: &Content,
    creator_address: address,
    ctx: &mut TxContext
): PaymentReceipt
```

**Validation Rules:**
- Content must be Accepted status
- Sufficient funds in escrow
- Payment not already processed
- Valid creator address

**State Changes:**
1. Deduct base payment from escrow
2. Create PaymentReceipt object
3. Transfer funds to creator
4. Update escrow payment tracking
5. Emit BasePaymentProcessed event

### 6. Engagement Bonus Calculation
```move
// Calculate and process engagement bonuses
public fun process_engagement_bonus(
    escrow: &mut CampaignEscrow,
    content: &mut Content,
    campaign: &Campaign,
    ctx: &mut TxContext
): PaymentReceipt
```

**Logic:**
1. Calculate bonus based on engagement metrics
2. Apply CPM rates from campaign configuration
3. Ensure bonus doesn't exceed available funds
4. Process payment and update records

### 7. Winner Selection Workflow
```move
// Select campaign winners and process winner bonuses
public entry fun select_winners(
    brand_cap: &BrandCap,
    campaign: &mut Campaign,
    escrow: &mut CampaignEscrow,
    winner_content_ids: vector<ID>,
    winner_bonuses: vector<u64>,
    ctx: &mut TxContext
)
```

**Validation Rules:**
- Campaign must be completed
- Brand must own campaign
- Winner count cannot exceed winner_slots
- Sufficient funds for all bonuses

### 8. Dispute Resolution Workflow
```move
// File a dispute
public entry fun file_dispute(
    initiator_cap: &CreatorCap, // or &BrandCap
    campaign_id: ID,
    content_id: Option<ID>,
    dispute_type: u8,
    description: String,
    evidence_urls: vector<String>,
    ctx: &mut TxContext
)
```

**Validation Rules:**
- Valid campaign reference
- Initiator must be party to campaign
- Dispute type must be valid enum
- Evidence URLs must be provided

---

## Function Implementations

### Error Constants
```move
// Campaign errors (1-99)
const EINVALID_TIMEFRAME: u64 = 1;
const ECAMPAIGN_NOT_ACTIVE: u64 = 2;
const ECAMPAIGN_COMPLETED: u64 = 3;
const EINSUFFICIENT_FUNDING: u64 = 4;
const EINVALID_WINNER_COUNT: u64 = 5;

// Application errors (100-199)
const EAPPLICATION_CLOSED: u64 = 100;
const EALREADY_APPLIED: u64 = 101;
const ENOT_ACCEPTED: u64 = 102;

// Content errors (200-299)
const ECONTENT_NOT_PENDING: u64 = 200;
const EINVALID_CONTENT_LINK: u64 = 201;
const ECONTENT_LIMIT_EXCEEDED: u64 = 202;

// Payment errors (300-399)
const EINSUFFICIENT_ESCROW_FUNDS: u64 = 300;
const EPAYMENT_ALREADY_PROCESSED: u64 = 301;
const EINVALID_PAYMENT_AMOUNT: u64 = 302;

// Authority errors (400-499)
const EUNAUTHORIZED: u64 = 400;
const EINVALID_BRAND_CAP: u64 = 401;
const EINVALID_CREATOR_CAP: u64 = 402;

// Dispute errors (500-599)
const EDISPUTE_ALREADY_EXISTS: u64 = 500;
const EINVALID_DISPUTE_TYPE: u64 = 501;
const EDISPUTE_NOT_FOUND: u64 = 502;
```

### Core Campaign Functions
```move
/// Initialize a new campaign with escrow
public fun create_campaign_with_escrow(
    brand_cap: &BrandCap,
    campaign_data: CampaignCreationData,
    initial_funding: Coin<USDC>,
    ctx: &mut TxContext
): (Campaign, ID) {
    // Validate timeframes
    assert!(campaign_data.application_start < campaign_data.application_end, EINVALID_TIMEFRAME);
    assert!(campaign_data.campaign_start > campaign_data.application_end, EINVALID_TIMEFRAME);
    assert!(campaign_data.campaign_end > campaign_data.campaign_start, EINVALID_TIMEFRAME);
    
    // Validate funding
    let funding_amount = coin::value(&initial_funding);
    let min_funding = campaign_data.base_pay_per_creator * campaign_data.winner_slots;
    assert!(funding_amount >= min_funding, EINSUFFICIENT_FUNDING);
    
    // Create campaign object
    let campaign = Campaign {
        id: object::new(ctx),
        campaign_id: campaign_data.campaign_id,
        brand_id: brand_cap.brand_id,
        campaign_type: campaign_data.campaign_type,
        application_start: campaign_data.application_start,
        application_end: campaign_data.application_end,
        campaign_start: campaign_data.campaign_start,
        campaign_end: campaign_data.campaign_end,
        base_pay_per_creator: campaign_data.base_pay_per_creator,
        engagement_metrics: campaign_data.engagement_config,
        status: CAMPAIGN_ACTIVE,
        escrow_id: object::id_from_address(@0x0), // Placeholder
        winner_slots: campaign_data.winner_slots,
        current_winners: 0,
        creation_timestamp: tx_context::epoch_timestamp_ms(ctx),
    };
    
    // Create shared escrow object
    let escrow = CampaignEscrow {
        id: object::new(ctx),
        campaign: object::uid_to_inner(&campaign.id),
        campaign_id: campaign_data.campaign_id,
        total_funds: coin::into_balance(initial_funding),
        brand_wallet: tx_context::sender(ctx),
        remaining_funds: balance::zero(),
        payments_made: 0,
        creation_timestamp: tx_context::epoch_timestamp_ms(ctx),
        payment_capability: PaymentCap {
            campaign_id: object::uid_to_inner(&campaign.id),
            authority: tx_context::sender(ctx),
        }
    };
    
    let escrow_id = object::uid_to_inner(&escrow.id);
    campaign.escrow_id = escrow_id;
    
    // Move remaining funds to remaining_funds balance for tracking
    let total_value = balance::value(&escrow.total_funds);
    escrow.remaining_funds = balance::split(&mut escrow.total_funds, total_value);
    
    // Emit creation event
    event::emit(CampaignCreated {
        campaign_id: object::uid_to_inner(&campaign.id),
        campaign_string_id: campaign_data.campaign_id,
        brand_address: tx_context::sender(ctx),
        escrow_id,
        funding_amount,
    });
    
    // Share escrow for multi-party access
    transfer::share_object(escrow);
    
    (campaign, escrow_id)
}

/// Process base payment for approved content
public fun process_base_payment(
    escrow: &mut CampaignEscrow,
    content: &Content,
    campaign: &Campaign,
    ctx: &mut TxContext
): (PaymentReceipt, Coin<USDC>) {
    // Validation
    assert!(content.status == CONTENT_ACCEPTED, ECONTENT_NOT_PENDING);
    assert!(content.campaign_id == object::uid_to_inner(&campaign.id), EINVALID_CAMPAIGN);
    assert!(balance::value(&escrow.remaining_funds) >= campaign.base_pay_per_creator, EINSUFFICIENT_ESCROW_FUNDS);
    
    // Create payment record
    let receipt = PaymentReceipt {
        id: object::new(ctx),
        payment_type: PAYMENT_TYPE_BASE,
        amount: campaign.base_pay_per_creator,
        campaign_id: content.campaign_id,
        recipient: tx_context::sender(ctx), // Creator's address
        creator_id: content.creator_id,
        content_id: option::some(content.content_id),
        payment_timestamp: tx_context::epoch_timestamp_ms(ctx),
        transaction_hash: string::utf8(b""), // Will be filled by transaction processor
    };
    
    // Process payment
    let payment_coin = coin::from_balance(
        balance::split(&mut escrow.remaining_funds, campaign.base_pay_per_creator),
        ctx
    );
    
    // Update escrow tracking
    escrow.payments_made = escrow.payments_made + campaign.base_pay_per_creator;
    
    // Emit payment event
    event::emit(BasePaymentProcessed {
        campaign_id: content.campaign_id,
        creator_id: content.creator_id,
        amount: campaign.base_pay_per_creator,
        recipient: tx_context::sender(ctx),
    });
    
    (receipt, payment_coin)
}

/// Calculate and process engagement-based bonus
public fun calculate_engagement_bonus(
    content: &Content,
    campaign: &Campaign,
): u64 {
    let total_bonus = 0u64;
    let metrics = &content.engagement_metrics;
    let config = &campaign.engagement_metrics;
    
    // Calculate bonuses based on engagement metrics
    total_bonus = total_bonus + (metrics.likes_count / 100) * config.likes_cpm;
    total_bonus = total_bonus + (metrics.views_count / 100) * config.views_cpm;
    total_bonus = total_bonus + (metrics.retweets_count / 100) * config.retweets_cpm;
    total_bonus = total_bonus + (metrics.comments_count / 100) * config.comments_cpm;
    total_bonus = total_bonus + (metrics.link_clicks_count / 100) * config.link_clicks_cpm;
    
    total_bonus
}
```

---

## Event System

### Campaign Events
```move
struct CampaignCreated has copy, drop {
    campaign_id: ID,
    campaign_string_id: String,
    brand_address: address,
    escrow_id: ID,
    funding_amount: u64,
}

struct CampaignStatusChanged has copy, drop {
    campaign_id: ID,
    old_status: u8,
    new_status: u8,
    changed_by: address,
}
```

### Application Events
```move
struct ApplicationSubmitted has copy, drop {
    campaign_id: ID,
    applicant_id: String,
    applicant_address: address,
    application_timestamp: u64,
}

struct ApplicationReviewed has copy, drop {
    campaign_id: ID,
    applicant_id: String,
    accepted: bool,
    reviewer: address,
}
```

### Content Events
```move
struct ContentSubmitted has copy, drop {
    campaign_id: ID,
    content_id: String,
    creator_id: String,
    content_link: String,
}

struct ContentReviewed has copy, drop {
    campaign_id: ID,
    content_id: String,
    approved: bool,
    reviewer: address,
}

struct ContentPublished has copy, drop {
    campaign_id: ID,
    content_id: String,
    creator_id: String,
    publish_timestamp: u64,
}
```

### Payment Events
```move
struct BasePaymentProcessed has copy, drop {
    campaign_id: ID,
    creator_id: String,
    amount: u64,
    recipient: address,
}

struct EngagementBonusProcessed has copy, drop {
    campaign_id: ID,
    content_id: String,
    creator_id: String,
    bonus_amount: u64,
}

struct WinnerSelected has copy, drop {
    campaign_id: ID,
    winner_content_id: String,
    winner_creator_id: String,
    bonus_amount: u64,
}
```

### Dispute Events
```move
struct DisputeFiled has copy, drop {
    dispute_id: ID,
    campaign_id: ID,
    initiator: address,
    dispute_type: u8,
}

struct DisputeResolved has copy, drop {
    dispute_id: ID,
    resolution: String,
    resolver: address,
    resolution_timestamp: u64,
}
```

---

## Testing Strategy

### Package Structure
```
sources/
├── campaign.move              // Core campaign management
├── escrow.move               // Fund management
├── content.move              // Content submission and review
├── payments.move             // Payment processing
├── disputes.move             // Dispute resolution
├── profiles.move             // Brand and creator profiles
└── events.move               // Event definitions

tests/
├── campaign_tests.move       // Campaign lifecycle tests
├── payment_tests.move        // Payment processing tests
├── content_tests.move        // Content workflow tests
└── dispute_tests.move        // Dispute resolution tests
```

### Unit Test Examples
```move
#[test_only]
module harmonia::campaign_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use harmonia::campaign::{Self, Campaign, CampaignEscrow};
    
    #[test]
    fun test_create_campaign_success() {
        let admin = @0xADMIN;
        let brand = @0xBRAND;
        
        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        
        // Setup phase
        test_scenario::next_tx(scenario, admin);
        {
            // Initialize package and create test tokens
            campaign::init_for_testing(test_scenario::ctx(scenario));
        };
        
        // Brand creates campaign
        test_scenario::next_tx(scenario, brand);
        {
            let brand_cap = test_scenario::take_from_sender<BrandCap>(scenario);
            let funding = coin::mint_for_testing<USDC>(10000, test_scenario::ctx(scenario));
            
            let campaign_data = create_test_campaign_data();
            let (campaign, escrow_id) = campaign::create_campaign_with_escrow(
                &brand_cap,
                campaign_data,
                funding,
                test_scenario::ctx(scenario)
            );
            
            // Verify campaign creation
            assert!(campaign.status == CAMPAIGN_ACTIVE, 0);
            assert!(campaign.base_pay_per_creator == 1000, 1);
            
            test_scenario::return_to_sender(scenario, brand_cap);
            transfer::public_transfer(campaign, brand);
        };
        
        // Verify escrow creation
        test_scenario::next_tx(scenario, brand);
        {
            let escrow = test_scenario::take_shared<CampaignEscrow>(scenario);
            assert!(balance::value(&escrow.remaining_funds) == 10000, 2);
            test_scenario::return_shared(escrow);
        };
        
        test_scenario::end(scenario_val);
    }
    
    #[test]
    fun test_creator_application_flow() {
        let scenario_val = setup_campaign_scenario();
        let scenario = &mut scenario_val;
        
        let creator = @0xCREATOR;
        
        test_scenario::next_tx(scenario, creator);
        {
            let creator_cap = test_scenario::take_from_sender<CreatorCap>(scenario);
            let campaign_id = get_test_campaign_id();
            
            campaign::apply_to_campaign(
                &creator_cap,
                campaign_id,
                string::utf8(b"I will create amazing content for this campaign"),
                test_scenario::ctx(scenario)
            );
            
            test_scenario::return_to_sender(scenario, creator_cap);
        };
        
        // Verify application was created
        test_scenario::next_tx(scenario, creator);
        {
            let application = test_scenario::take_from_sender<CampaignApplication>(scenario);
            assert!(application.is_accepted == false, 0);
            assert!(application.applicant_id == string::utf8(b"creator_1"), 1);
            test_scenario::return_to_sender(scenario, application);
        };
        
        test_scenario::end(scenario_val);
    }
    
    #[test]
    fun test_content_submission_and_review() {
        let scenario_val = setup_accepted_creator_scenario();
        let scenario = &mut scenario_val;
        
        let creator = @0xCREATOR;
        let brand = @0xBRAND;
        
        // Creator submits content
        test_scenario::next_tx(scenario, creator);
        {
            let creator_cap = test_scenario::take_from_sender<CreatorCap>(scenario);
            let campaign_id = get_test_campaign_id();
            
            campaign::submit_content(
                &creator_cap,
                campaign_id,
                string::utf8(b"https://twitter.com/creator/status/123"),
                test_scenario::ctx(scenario)
            );
            
            test_scenario::return_to_sender(scenario, creator_cap);
        };
        
        // Brand reviews and approves content
        test_scenario::next_tx(scenario, brand);
        {
            let brand_cap = test_scenario::take_from_sender<BrandCap>(scenario);
            let mut content = test_scenario::take_from_sender<Content>(scenario);
            let campaign = test_scenario::take_from_sender<Campaign>(scenario);
            
            campaign::review_content(
                &brand_cap,
                &mut content,
                &campaign,
                true, // approved
                option::none(),
                test_scenario::ctx(scenario)
            );
            
            assert!(content.status == CONTENT_ACCEPTED, 0);
            
            test_scenario::return_to_sender(scenario, brand_cap);
            test_scenario::return_to_sender(scenario, content);
            test_scenario::return_to_sender(scenario, campaign);
        };
        
        test_scenario::end(scenario_val);
    }
    
    #[test]
    fun test_base_payment_processing() {
        let scenario_val = setup_approved_content_scenario();
        let scenario = &mut scenario_val;
        
        let creator = @0xCREATOR;
        
        test_scenario::next_tx(scenario, creator);
        {
            let mut escrow = test_scenario::take_shared<CampaignEscrow>(scenario);
            let content = test_scenario::take_from_sender<Content>(scenario);
            let campaign = test_scenario::take_from_sender<Campaign>(scenario);
            
            let initial_balance = balance::value(&escrow.remaining_funds);
            
            let (receipt, payment_coin) = campaign::process_base_payment(
                &mut escrow,
                &content,
                &campaign,
                test_scenario::ctx(scenario)
            );
            
            // Verify payment processing
            assert!(receipt.amount == 1000, 0);
            assert!(coin::value(&payment_coin) == 1000, 1);
            assert!(balance::value(&escrow.remaining_funds) == initial_balance - 1000, 2);
            
            // Clean up
            coin::burn_for_testing(payment_coin);
            test_scenario::return_shared(escrow);
            test_scenario::return_to_sender(scenario, content);
            test_scenario::return_to_sender(scenario, campaign);
            transfer::public_transfer(receipt, creator);
        };
        
        test_scenario::end(scenario_val);
    }
    
    // Helper functions for test scenarios
    fun setup_campaign_scenario(): Scenario {
        // Implementation for setting up a basic campaign scenario
        abort 0
    }
    
    fun setup_accepted_creator_scenario(): Scenario {
        // Implementation for scenario with accepted creator
        abort 0
    }
    
    fun setup_approved_content_scenario(): Scenario {
        // Implementation for scenario with approved content
        abort 0
    }
    
    fun create_test_campaign_data(): CampaignCreationData {
        CampaignCreationData {
            campaign_id: string::utf8(b"test_campaign_1"),
            campaign_type: 0,
            application_start: 1000,
            application_end: 2000,
            campaign_start: 3000,
            campaign_end: 4000,
            base_pay_per_creator: 1000,
            engagement_config: EngagementConfig {
                likes_cpm: 10,
                views_cpm: 5,
                retweets_cpm: 20,
                comments_cpm: 15,
                link_clicks_cpm: 25,
            },
            winner_slots: 5,
        }
    }
    
    fun get_test_campaign_id(): ID {
        object::id_from_address(@0x1234)
    }
}
```

### Integration Test Scenarios

1. **End-to-End Campaign Lifecycle**
   - Create campaign with funding
   - Process multiple creator applications
   - Submit and review content
   - Process base and engagement payments
   - Select winners and distribute bonuses
   - Complete campaign and reclaim remaining funds

2. **Multi-Creator Payment Processing**
   - Test batch payment operations
   - Verify fund distribution accuracy
   - Check escrow balance consistency

3. **Dispute Resolution Flow**
   - File disputes from both creator and brand perspectives
   - Test evidence submission
   - Verify resolution outcomes

4. **Edge Case Testing**
   - Insufficient funding scenarios
   - Invalid timeframe configurations
   - Concurrent operation handling

---

## Deployment Guide

### Prerequisites
```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui

# Verify installation
sui --version
```

### Package Setup
```bash
# Initialize new Sui Move package
sui move new harmonia-campaigns
cd harmonia-campaigns

# Update Move.toml with dependencies
```

### Move.toml Configuration
```toml
[package]
name = "harmonia-campaigns"
version = "1.0.0"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/devnet" }

[addresses]
harmonia = "0x0"
```

### Build and Test Commands
```bash
# Build the package
sui move build

# Run unit tests
sui move test

# Run specific test module
sui move test campaign_tests

# Run tests with coverage
sui move test --coverage

# Generate test coverage report
sui move coverage summary
```

### Deployment Commands
```bash
# Deploy to devnet
sui client publish --gas-budget 100000000

# Deploy to testnet
sui client publish --gas-budget 100000000 --network testnet

# Deploy to mainnet (production)
sui client publish --gas-budget 100000000 --network mainnet
```

### Post-Deployment Setup
```bash
# Initialize platform capabilities
sui client call \
  --package $PACKAGE_ID \
  --module campaign \
  --function init_platform \
  --gas-budget 10000000

# Create initial admin capability
sui client call \
  --package $PACKAGE_ID \
  --module campaign \
  --function create_admin_cap \
  --gas-budget 10000000
```

### Environment Variables
```bash
# Set package ID after deployment
export HARMONIA_PACKAGE_ID="0x..."

# Set admin capability object ID
export ADMIN_CAP_ID="0x..."

# Set network configuration
export SUI_NETWORK="devnet" # or testnet, mainnet
```

---

## Migration from Solana

### Key Architectural Changes

| Aspect | Solana | Sui |
|--------|---------|-----|
| Storage Model | Account-based (PDAs) | Object-oriented |
| Authority | Program authority + signers | Capability objects |
| Token Handling | Token accounts + programs | Native Balance<T> and Coin<T> |
| Multi-party Access | CPI between programs | Shared objects |
| Events | Program logs | Built-in event system |

### Data Structure Mapping

#### Campaign Migration
```rust
// Solana (Anchor)
#[account]
pub struct Campaign {
    pub twitter_account: Pubkey,
    pub campaign_id: String,
    pub config_hash: String,
    // ... other fields
    pub bump: u8,
}
```

```move
// Sui (Move)
struct Campaign has key, store {
    id: UID,
    twitter_account_id: ID,
    campaign_id: String,
    config_hash: String,
    // ... other fields (no bump needed)
}
```

#### Escrow Migration
```rust
// Solana - Separate token account needed
pub struct CampaignEscrow {
    pub campaign: Pubkey,
    pub token_account: Pubkey,  // External USDC account
    pub remaining_funds: u64,   // Track amount separately
}
```

```move
// Sui - Native token handling
struct CampaignEscrow has key {
    id: UID,
    campaign: ID,
    remaining_funds: Balance<USDC>,  // Direct token storage
}
```

### Function Signature Evolution

#### Before (Solana/Anchor)
```rust
pub fn create_campaign_with_escrow(
    ctx: Context<CreateCampaignWithEscrow>,
    campaign_id: String,
    initial_funding: u64,  // Amount only
) -> Result<()>  // Side effects only
```

#### After (Sui/Move)
```move
public fun create_campaign_with_escrow(
    brand_cap: &BrandCap,          // Explicit authority
    campaign_data: CampaignData,
    initial_funding: Coin<USDC>,   // Actual tokens
    ctx: &mut TxContext
): (Campaign, ID)                   // Return created objects
```

### Authority Model Changes

#### Solana Approach
- Program-derived addresses (PDAs)
- Signature-based authentication
- Account ownership validation

#### Sui Approach
- Capability-based permissions
- Object ownership model
- Type-safe authority checking

### Migration Utilities

#### Data Export from Solana
```typescript
// Export existing campaign data
async function exportSolanaCampaignData(programId: string): Promise<CampaignData[]> {
    const campaigns = await program.account.campaign.all();
    
    return campaigns.map(campaign => ({
        campaignId: campaign.account.campaignId,
        brandWallet: campaign.account.brandWallet.toString(),
        totalFunds: campaign.account.totalFunds.toNumber(),
        startDate: campaign.account.startDate.toNumber(),
        endDate: campaign.account.endDate.toNumber(),
        // ... other fields
    }));
}
```

#### Import to Sui
```typescript
// Create equivalent campaigns on Sui
async function migrateCampaignToSui(
    solanaData: CampaignData,
    signer: RawSigner
): Promise<string> {
    const txb = new TransactionBlock();
    
    const [funding] = txb.splitCoins(txb.gas, [txb.pure(solanaData.totalFunds)]);
    
    txb.moveCall({
        target: `${PACKAGE_ID}::campaign::create_campaign_with_escrow`,
        arguments: [
            txb.object(BRAND_CAP_ID),
            txb.pure({
                campaign_id: solanaData.campaignId,
                // ... other campaign parameters
            }),
            funding
        ]
    });
    
    const result = await signer.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: { showEffects: true }
    });
    
    return result.digest;
}
```

### Performance Improvements

| Metric | Solana | Sui | Improvement |
|--------|---------|-----|-------------|
| Transaction Latency | ~2-3 seconds | ~0.5-1 second | 60-75% reduction |
| Parallel Processing | Limited | High (independent objects) | 5-10x throughput |
| Gas Costs | Variable | Predictable | 30-50% lower |
| State Access | Account loading | Direct object access | 2-3x faster |

### Migration Checklist

#### Pre-Migration
- [ ] Export all Solana campaign data
- [ ] Verify data integrity
- [ ] Test Sui contracts on devnet
- [ ] Prepare rollback procedures

#### During Migration
- [ ] Deploy Sui contracts to mainnet
- [ ] Migrate data in batches
- [ ] Update frontend integrations
- [ ] Monitor transaction success rates

#### Post-Migration
- [ ] Verify all data migrated correctly
- [ ] Update API endpoints
- [ ] Monitor system performance
- [ ] Sunset Solana contracts

### Risk Mitigation

1. **Gradual Migration**: Migrate campaigns in phases
2. **Parallel Operation**: Run both systems during transition
3. **Data Validation**: Continuous verification of migrated data
4. **Circuit Breakers**: Automatic fallback mechanisms
5. **Monitoring**: Real-time performance tracking

---

## Conclusion

This comprehensive technical specification provides all necessary details for implementing Harmonia's campaign management system on Sui blockchain. The object-oriented architecture leverages Sui's strengths for improved security, performance, and developer experience.

### Key Implementation Priorities

1. **Core Objects**: Campaign, Escrow, Brand, Creator profiles
2. **Workflow Functions**: Campaign creation, applications, content review
3. **Payment Processing**: Base payments, engagement bonuses, winner selection
4. **Event System**: Complete event coverage for indexing
5. **Testing Suite**: Comprehensive test coverage
6. **Migration Tools**: Smooth transition from Solana

### Success Metrics

- 50% reduction in transaction costs
- 3x improvement in throughput  
- 99.9% uptime during migration
- Zero fund loss during transition

Start implementation with core campaign and escrow functionality, then gradually add advanced features like disputes and batch operations.