# Build Advanced Loyalty Systems: A Complete Guide for Solana Developers

Coming from Solana's ecosystem, you've likely built or seen loyalty programs using complex program architectures, PDA management, and account-based reward tracking. Sui's object model transforms loyalty program development by eliminating account rent costs, enabling unlimited user data storage, and providing true composability between reward systems.

In this comprehensive tutorial, we'll create "SKYWARD REWARDS" - a multi-tier airline loyalty ecosystem featuring dynamic tier progression, partner integrations, NFT rewards, and sophisticated redemption mechanics. We'll compare every pattern to Solana equivalents and demonstrate how Sui's advantages create better customer experiences.

**Prerequisites**: Complete the [Basic Coin Tutorial](./BASIC_COIN_TUTORIAL.md) and [Gaming Tokens Tutorial](./IN_GAME_TOKENS_TUTORIAL.md) first.

## Understanding Loyalty Systems: Solana vs Sui Architecture

### Solana Loyalty Program Challenges
```rust
// Solana loyalty systems face significant architectural constraints:

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CustomerAccount {
    pub customer_id: String,              // Limited string size
    pub current_points: u64,
    pub lifetime_points: u64,
    pub tier_level: u8,
    pub transaction_history: Vec<Transaction>, // Limited by 10KB account size!
    pub partner_balances: Vec<PartnerBalance>, // Maybe 5-10 partners max
    // Account is nearly full with basic data
}

#[derive(AnchorSerialize, AnchorDeserialize)]  
pub struct RewardItem {
    pub item_id: u64,
    pub owner: Pubkey,
    pub expiry_date: i64,
    pub redemption_rules: String,          // Limited rule complexity
    // Each reward requires separate account (rent cost!)
}

// Problems:
// 1. Account size limits transaction history (~50 transactions)
// 2. Rent costs for every reward item (~0.002 SOL each)
// 3. Limited partner integration (account space)
// 4. Complex cross-program reward transfers
// 5. No native composability between programs
// 6. Expensive state management (getAccountInfo calls)
```

### Sui Loyalty System Advantages
```move
// Sui eliminates these constraints with native object composition:

public struct CustomerProfile has key {
    id: UID,
    customer_id: String,
    current_points: u64,
    lifetime_points: u64,
    tier_level: u8,
    // Transaction history stored in dynamic fields (unlimited!)
    // Partner balances stored as owned objects
    // No account size restrictions whatsoever
}

public struct RewardItem has key, store {
    id: UID,
    reward_type: u8,
    expiry_date: u64,
    redemption_value: u64,
    // Directly owned by customer address
    // No rent costs, unlimited quantity
    // Fully composable with other systems
}

// Advantages:
// 1. Unlimited transaction history via dynamic fields
// 2. No rent costs for reward items
// 3. Unlimited partner integrations
// 4. True reward item ownership and transferability  
// 5. Native cross-system composability
// 6. Efficient object-based queries
```

## Loyalty Program Architecture Evolution

### Traditional Loyalty Stack (Solana)
```
Customer Mobile App
│
├─ Wallet Integration (Phantom/Solflare)
├─ RPC Intensive Operations (getAccountInfo)
├─ Program Instructions
│   ├─ Points Program (core loyalty)
│   ├─ Rewards Program (redemption items)
│   ├─ Partner Program A (hotel points)
│   ├─ Partner Program B (car rental)
│   └─ Tier Management Program
│
└─ State Management (Complex)
    ├─ Customer Accounts (10KB limit)
    ├─ Reward Accounts (rent costs)
    ├─ Partner Accounts (limited integration)
    └─ Transaction Logs (size constrained)
```

### Modern Sui Loyalty Stack (What We're Building)
```
Customer Mobile/Web App
│
├─ Sui Wallet Integration
├─ Programmable Transaction Blocks (Batch Operations)
├─ Move Modules (Unified System)
│   ├─ Core Loyalty (points, tiers, history)
│   ├─ Reward Catalog (unlimited items)
│   ├─ Partner Ecosystem (seamless integration)
│   └─ NFT Achievements (collectible status)
│
└─ Object Ownership (Elegant)
    ├─ Customer Profiles (unlimited data)
    ├─ Reward Objects (no rent)
    ├─ Partner Tokens (native composability)
    └─ Dynamic History (infinite scalability)
```

## Advanced Loyalty Economics Design

### Multi-Tier Value Proposition

**Tier Structure with Exponential Benefits**:
- **Bronze** (0-9,999 pts): 1x earning, basic rewards
- **Silver** (10,000-24,999 pts): 1.5x earning, priority support
- **Gold** (25,000-49,999 pts): 2x earning, lounge access, upgrades
- **Platinum** (50,000-99,999 pts): 2.5x earning, companion benefits
- **Diamond** (100,000+ pts): 3x earning, exclusive experiences

**Multi-Currency Ecosystem**:
- **SKYPOINTS**: Primary loyalty currency (earned/spent)
- **TIER_CREDITS**: Qualification currency (earned, never spent)
- **PARTNER_MILES**: Cross-brand currencies (hotel, car, etc.)
- **STATUS_NFTS**: Achievement badges (collectible proof)

**Economic Flow Design**:
```
Real World Activity → Multiple Currencies → Tier Progression → Enhanced Earning → Premium Rewards
     ↓                      ↓                    ↓               ↓                ↓
   Flights              SKYPOINTS          Silver Tier      1.5x Multiplier    Lounge Access
   Hotels            PARTNER_MILES         Gold Tier        2x Multiplier      Free Upgrades  
   Purchases         TIER_CREDITS       Platinum Tier       2.5x Multiplier    Companion Pass
   Achievements       STATUS_NFTS        Diamond Tier       3x Multiplier      VIP Experiences
```

## Step 1: Advanced Loyalty Architecture Setup

### Enterprise Loyalty Project Structure
```bash
# Create comprehensive loyalty ecosystem
mkdir skyward-rewards
cd skyward-rewards
sui move new skyward_rewards
cd skyward_rewards

# Create sophisticated module organization
mkdir -p sources/{core,rewards,partners,nfts,analytics}
```

### Enterprise Package Configuration

Update `Move.toml` with loyalty-specific architecture:

```toml
[package]
name = "skyward_rewards"
version = "2.0.0"
edition = "2024.beta"
authors = ["Skyward Airlines Loyalty Team"]

[dependencies]
Sui = { 
    git = "https://github.com/MystenLabs/sui.git", 
    subdir = "crates/sui-framework/packages/sui-framework", 
    rev = "framework/devnet" 
}

[addresses]
skyward_rewards = "0x0"

# Enterprise loyalty metadata
[package.metadata.loyalty]
program_name = "Skyward Rewards"
industry = "Travel & Hospitality"
customer_base = "global"
currency_types = ["SKYPOINTS", "TIER_CREDITS", "PARTNER_MILES"]
tier_levels = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]  
partner_ecosystem = ["hotels", "car_rental", "dining", "shopping"]
nft_collections = ["status_badges", "achievement_trophies", "exclusive_access"]
```

## Step 2: Multi-Currency Loyalty System Implementation

Create `sources/core/loyalty_currencies.move`:

```move
module skyward_rewards::loyalty_currencies {
    // === Core Framework Imports ===
    use sui::coin::{Self, TreasuryCap, Coin};
    use sui::clock::{Self, Clock};
    use sui::url;
    use sui::event;
    use sui::dynamic_field as df;

    // === Loyalty Currency Types ===
    
    /// Primary loyalty points - earned and spent for rewards
    public struct SKYPOINTS has drop {}
    
    /// Tier qualification credits - earned but never spent (status only)
    public struct TIER_CREDITS has drop {}
    
    /// Partner ecosystem miles - earned through partner activities
    public struct PARTNER_MILES has drop {}

    // === Advanced Loyalty Management ===
    
    /// Central loyalty ecosystem coordinator
    public struct LoyaltyEcosystem has key {
        id: UID,
        skypoints_treasury: TreasuryCap<SKYPOINTS>,
        tier_credits_treasury: TreasuryCap<TIER_CREDITS>, 
        partner_miles_treasury: TreasuryCap<PARTNER_MILES>,
        
        // Economic tracking and controls
        total_skypoints_issued: u64,
        total_tier_credits_issued: u64,
        total_partner_miles_issued: u64,
        
        // Tier thresholds (can be updated by governance)
        silver_threshold: u64,
        gold_threshold: u64,
        platinum_threshold: u64,
        diamond_threshold: u64,
        
        // Earning multipliers by tier (basis points, 10000 = 1.0x)
        bronze_multiplier: u64,
        silver_multiplier: u64,
        gold_multiplier: u64,
        platinum_multiplier: u64,
        diamond_multiplier: u64,
        
        // System controls
        program_active: bool,
        emergency_paused: bool,
        
        // Partner program integration
        active_partners: Table<String, PartnerConfig>,
    }

    /// Customer loyalty profile with unlimited scalability
    public struct CustomerProfile has key {
        id: UID,
        customer_id: String,                    // External system ID
        
        // Core loyalty metrics
        current_skypoints: u64,
        lifetime_skypoints: u64,
        current_tier_credits: u64,
        tier_level: u8,                         // 1=Bronze, 2=Silver, etc.
        tier_qualification_date: u64,           // When they achieved current tier
        
        // Engagement tracking
        enrollment_date: u64,
        last_activity_date: u64,
        total_transactions: u64,
        
        // Partner ecosystem balances
        partner_balances: Table<String, u64>,   // Partner ID -> Miles balance
        
        // Achievement tracking
        achievement_nfts: vector<ID>,           // Owned achievement NFTs
        
        // Advanced features
        referral_code: String,                  // Personal referral code
        referred_customers: u64,                // Successful referrals
        
        // Privacy and preferences
        communication_preferences: u64,        // Bitfield for preferences
        data_sharing_consent: bool,
    }

    /// Partner integration configuration
    public struct PartnerConfig has store {
        partner_name: String,
        earning_rate: u64,                      // Points per dollar/unit
        active: bool,
        integration_date: u64,
        total_miles_issued: u64,
    }

    /// Activity tracking for sophisticated analytics
    public struct ActivityRecord has store {
        activity_type: String,                  // "flight", "hotel", "dining", etc.
        activity_date: u64,
        base_points_earned: u64,
        bonus_points_earned: u64,
        tier_credits_earned: u64,
        partner_miles_earned: u64,
        transaction_value: u64,                 // Dollar value if applicable
        partner_id: Option<String>,             // Which partner generated this
    }

    // === Events for Advanced Analytics ===
    
    /// Points earned from any source
    public struct PointsEarned has copy, drop {
        customer: address,
        customer_id: String,
        activity_type: String,
        base_points: u64,
        bonus_points: u64,
        tier_credits: u64,
        current_tier: u8,
        multiplier_applied: u64,                // Basis points
        partner_id: Option<String>,
        timestamp: u64,
    }

    /// Customer achieved new tier status
    public struct TierAdvancement has copy, drop {
        customer: address,
        customer_id: String,
        previous_tier: u8,
        new_tier: u8,
        tier_credits_required: u64,
        tier_credits_accumulated: u64,
        benefits_unlocked: vector<String>,
        advancement_date: u64,
    }

    /// Partner activity integration
    public struct PartnerActivityRecorded has copy, drop {
        customer: address,
        partner_id: String,
        activity_type: String,
        partner_miles_earned: u64,
        skypoints_earned: u64,                  // Cross-program earning
        transaction_value: u64,
        timestamp: u64,
    }

    /// Loyalty ecosystem statistics updated
    public struct EcosystemStatsUpdated has copy, drop {
        total_customers: u64,
        total_skypoints_issued: u64,
        total_tier_credits_issued: u64,
        active_partners: u64,
        tier_distribution: vector<u64>,         // [bronze_count, silver_count, ...]
        timestamp: u64,
    }

    // === Tier Thresholds (Configurable) ===
    const DEFAULT_SILVER_THRESHOLD: u64 = 10000;
    const DEFAULT_GOLD_THRESHOLD: u64 = 25000;
    const DEFAULT_PLATINUM_THRESHOLD: u64 = 50000;
    const DEFAULT_DIAMOND_THRESHOLD: u64 = 100000;

    // === Earning Multipliers (Basis Points) ===
    const BRONZE_MULTIPLIER: u64 = 10000;      // 1.0x
    const SILVER_MULTIPLIER: u64 = 15000;      // 1.5x
    const GOLD_MULTIPLIER: u64 = 20000;        // 2.0x  
    const PLATINUM_MULTIPLIER: u64 = 25000;    // 2.5x
    const DIAMOND_MULTIPLIER: u64 = 30000;     // 3.0x

    // === Error Codes ===
    const ELoyaltySystemPaused: u64 = 300;
    const EInvalidTierLevel: u64 = 301;
    const ECustomerNotFound: u64 = 302;
    const EPartnerNotActive: u64 = 303;
    const EInsufficientTierCredits: u64 = 304;
    const EUnauthorizedAdmin: u64 = 305;

    // === System Initialization ===
    fun init(ctx: &mut TxContext) {
        // Create SKYPOINTS currency (primary loyalty currency)
        let (skypoints_treasury, skypoints_metadata) = coin::create_currency<SKYPOINTS>(
            SKYPOINTS {},
            0,                                     // Whole points only (no decimals)
            b"SKY",                               // Symbol
            b"Skyward Points",                    // Name
            b"Primary loyalty currency for Skyward Airlines rewards ecosystem",
            option::some(url::new_unsafe_from_bytes(b"https://skyward.com/points-icon.png")),
            ctx
        );

        // Create TIER_CREDITS currency (qualification only)
        let (tier_credits_treasury, tier_credits_metadata) = coin::create_currency<TIER_CREDITS>(
            TIER_CREDITS {},
            0,                                     // Whole credits only
            b"TQC",                               // Tier Qualification Credits
            b"Tier Credits",                      // Name
            b"Tier qualification credits for Skyward Airlines status progression",
            option::some(url::new_unsafe_from_bytes(b"https://skyward.com/tier-icon.png")),
            ctx
        );

        // Create PARTNER_MILES currency (ecosystem integration)
        let (partner_miles_treasury, partner_miles_metadata) = coin::create_currency<PARTNER_MILES>(
            PARTNER_MILES {},
            0,                                     // Whole miles only
            b"PMILES",                            // Symbol
            b"Partner Miles",                     // Name  
            b"Cross-brand loyalty miles earned through Skyward partner ecosystem",
            option::some(url::new_unsafe_from_bytes(b"https://skyward.com/partner-icon.png")),
            ctx
        );

        // Create comprehensive loyalty ecosystem
        let loyalty_ecosystem = LoyaltyEcosystem {
            id: object::new(ctx),
            skypoints_treasury,
            tier_credits_treasury,
            partner_miles_treasury,
            
            // Initialize tracking
            total_skypoints_issued: 0,
            total_tier_credits_issued: 0,
            total_partner_miles_issued: 0,
            
            // Set tier thresholds
            silver_threshold: DEFAULT_SILVER_THRESHOLD,
            gold_threshold: DEFAULT_GOLD_THRESHOLD,
            platinum_threshold: DEFAULT_PLATINUM_THRESHOLD,
            diamond_threshold: DEFAULT_DIAMOND_THRESHOLD,
            
            // Set earning multipliers
            bronze_multiplier: BRONZE_MULTIPLIER,
            silver_multiplier: SILVER_MULTIPLIER,
            gold_multiplier: GOLD_MULTIPLIER,
            platinum_multiplier: PLATINUM_MULTIPLIER,
            diamond_multiplier: DIAMOND_MULTIPLIER,
            
            // System state
            program_active: true,
            emergency_paused: false,
            
            // Initialize partner system
            active_partners: table::new(ctx),
        };

        // Share loyalty ecosystem
        transfer::share_object(loyalty_ecosystem);
        
        // Freeze currency metadata
        transfer::public_freeze_object(skypoints_metadata);
        transfer::public_freeze_object(tier_credits_metadata);
        transfer::public_freeze_object(partner_miles_metadata);
    }

    // === Customer Profile Management ===
    
    /// Create comprehensive customer loyalty profile
    public fun create_customer_profile(
        customer_id: String,
        referral_code: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): CustomerProfile {
        let current_time = clock::timestamp_ms(clock);
        
        CustomerProfile {
            id: object::new(ctx),
            customer_id,
            
            // Initialize loyalty metrics  
            current_skypoints: 0,
            lifetime_skypoints: 0,
            current_tier_credits: 0,
            tier_level: 1,                          // Start as Bronze
            tier_qualification_date: current_time,
            
            // Initialize engagement tracking
            enrollment_date: current_time,
            last_activity_date: current_time,
            total_transactions: 0,
            
            // Initialize collections
            partner_balances: table::new(ctx),
            achievement_nfts: vector::empty(),
            
            // Social features
            referral_code,
            referred_customers: 0,
            
            // Default preferences
            communication_preferences: 0,           // Default all off
            data_sharing_consent: false,
        }
    }

    // === Core Earning Functions ===
    
    /// Award points for flight activity with tier multipliers
    public fun award_flight_points(
        ecosystem: &mut LoyaltyEcosystem,
        profile: &mut CustomerProfile,
        miles_flown: u64,
        fare_paid: u64,                            // Dollars spent
        route_type: String,                        // "domestic", "international"
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(ecosystem.program_active && !ecosystem.emergency_paused, ELoyaltySystemPaused);

        // Calculate base points (5 points per mile + 1 per dollar)
        let base_skypoints = miles_flown * 5 + fare_paid;
        let base_tier_credits = miles_flown;                // 1 credit per mile flown

        // Apply tier multiplier to SKYPOINTS only (not tier credits)
        let multiplier = get_tier_multiplier(ecosystem, profile.tier_level);
        let total_skypoints = (base_skypoints * multiplier) / 10000;

        // Add bonus for international routes
        let bonus_skypoints = if (route_type == string::utf8(b"international")) {
            total_skypoints / 2                     // 50% bonus for international
        } else {
            0
        };

        let final_skypoints = total_skypoints + bonus_skypoints;

        // Update customer profile
        profile.current_skypoints = profile.current_skypoints + final_skypoints;
        profile.lifetime_skypoints = profile.lifetime_skypoints + final_skypoints;
        profile.current_tier_credits = profile.current_tier_credits + base_tier_credits;
        profile.last_activity_date = clock::timestamp_ms(clock);
        profile.total_transactions = profile.total_transactions + 1;

        // Check for tier advancement
        check_and_advance_tier(ecosystem, profile, clock, ctx);

        // Mint and transfer points to customer
        let skypoints = coin::mint(&mut ecosystem.skypoints_treasury, final_skypoints, ctx);
        let tier_credits = coin::mint(&mut ecosystem.tier_credits_treasury, base_tier_credits, ctx);
        
        transfer::public_transfer(skypoints, tx_context::sender(ctx));
        transfer::public_transfer(tier_credits, tx_context::sender(ctx));

        // Update ecosystem tracking
        ecosystem.total_skypoints_issued = ecosystem.total_skypoints_issued + final_skypoints;
        ecosystem.total_tier_credits_issued = ecosystem.total_tier_credits_issued + base_tier_credits;

        // Record activity in dynamic fields for unlimited history
        let activity = ActivityRecord {
            activity_type: string::utf8(b"flight"),
            activity_date: clock::timestamp_ms(clock),
            base_points_earned: base_skypoints,
            bonus_points_earned: bonus_skypoints,
            tier_credits_earned: base_tier_credits,
            partner_miles_earned: 0,
            transaction_value: fare_paid,
            partner_id: option::none(),
        };
        
        df::add(&mut profile.id, profile.total_transactions, activity);

        // Emit comprehensive analytics event
        event::emit(PointsEarned {
            customer: tx_context::sender(ctx),
            customer_id: profile.customer_id,
            activity_type: route_type,
            base_points: base_skypoints,
            bonus_points: bonus_skypoints,
            tier_credits: base_tier_credits,
            current_tier: profile.tier_level,
            multiplier_applied: multiplier,
            partner_id: option::none(),
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Award points for partner activity (hotels, car rentals, etc.)
    public fun award_partner_points(
        ecosystem: &mut LoyaltyEcosystem,
        profile: &mut CustomerProfile,
        partner_id: String,
        transaction_amount: u64,
        activity_type: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(ecosystem.program_active && !ecosystem.emergency_paused, ELoyaltySystemPaused);
        assert!(table::contains(&ecosystem.active_partners, partner_id), EPartnerNotActive);

        let partner_config = table::borrow(&ecosystem.active_partners, partner_id);
        assert!(partner_config.active, EPartnerNotActive);

        // Calculate partner miles based on partner's earning rate
        let partner_miles = transaction_amount * partner_config.earning_rate;
        
        // Calculate cross-program SKYPOINTS (typically lower rate)
        let cross_program_skypoints = transaction_amount / 2;  // 0.5 skypoints per dollar

        // Apply tier multiplier to skypoints
        let multiplier = get_tier_multiplier(ecosystem, profile.tier_level);
        let final_skypoints = (cross_program_skypoints * multiplier) / 10000;

        // Update customer partner balance
        if (!table::contains(&profile.partner_balances, partner_id)) {
            table::add(&mut profile.partner_balances, partner_id, 0);
        };
        let current_balance = table::borrow_mut(&mut profile.partner_balances, partner_id);
        *current_balance = *current_balance + partner_miles;

        // Update main loyalty metrics
        profile.current_skypoints = profile.current_skypoints + final_skypoints;
        profile.lifetime_skypoints = profile.lifetime_skypoints + final_skypoints;
        profile.last_activity_date = clock::timestamp_ms(clock);
        profile.total_transactions = profile.total_transactions + 1;

        // Mint currencies
        let skypoints = coin::mint(&mut ecosystem.skypoints_treasury, final_skypoints, ctx);
        let p_miles = coin::mint(&mut ecosystem.partner_miles_treasury, partner_miles, ctx);
        
        transfer::public_transfer(skypoints, tx_context::sender(ctx));
        transfer::public_transfer(p_miles, tx_context::sender(ctx));

        // Update partner statistics
        let partner_config_mut = table::borrow_mut(&mut ecosystem.active_partners, partner_id);
        partner_config_mut.total_miles_issued = partner_config_mut.total_miles_issued + partner_miles;

        // Record activity
        let activity = ActivityRecord {
            activity_type,
            activity_date: clock::timestamp_ms(clock),
            base_points_earned: cross_program_skypoints,
            bonus_points_earned: 0,
            tier_credits_earned: 0,
            partner_miles_earned: partner_miles,
            transaction_value: transaction_amount,
            partner_id: option::some(partner_id),
        };
        
        df::add(&mut profile.id, profile.total_transactions, activity);

        // Emit partner activity event
        event::emit(PartnerActivityRecorded {
            customer: tx_context::sender(ctx),
            partner_id,
            activity_type,
            partner_miles_earned: partner_miles,
            skypoints_earned: final_skypoints,
            transaction_value: transaction_amount,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // === Tier Management Functions ===
    
    /// Check and advance customer tier if qualified
    fun check_and_advance_tier(
        ecosystem: &LoyaltyEcosystem,
        profile: &mut CustomerProfile,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let previous_tier = profile.tier_level;
        let new_tier = calculate_tier_from_credits(ecosystem, profile.current_tier_credits);

        if (new_tier > previous_tier) {
            profile.tier_level = new_tier;
            profile.tier_qualification_date = clock::timestamp_ms(clock);

            // Generate benefits list based on new tier
            let benefits = get_tier_benefits(new_tier);

            // Emit tier advancement event
            event::emit(TierAdvancement {
                customer: tx_context::sender(ctx),
                customer_id: profile.customer_id,
                previous_tier,
                new_tier,
                tier_credits_required: get_tier_threshold(ecosystem, new_tier),
                tier_credits_accumulated: profile.current_tier_credits,
                benefits_unlocked: benefits,
                advancement_date: clock::timestamp_ms(clock),
            });
        }
    }

    /// Calculate tier level from tier credits
    fun calculate_tier_from_credits(ecosystem: &LoyaltyEcosystem, tier_credits: u64): u8 {
        if (tier_credits >= ecosystem.diamond_threshold) {
            5  // Diamond
        } else if (tier_credits >= ecosystem.platinum_threshold) {
            4  // Platinum
        } else if (tier_credits >= ecosystem.gold_threshold) {
            3  // Gold
        } else if (tier_credits >= ecosystem.silver_threshold) {
            2  // Silver
        } else {
            1  // Bronze
        }
    }

    /// Get tier threshold for specific tier level
    fun get_tier_threshold(ecosystem: &LoyaltyEcosystem, tier_level: u8): u64 {
        if (tier_level == 5) ecosystem.diamond_threshold
        else if (tier_level == 4) ecosystem.platinum_threshold
        else if (tier_level == 3) ecosystem.gold_threshold
        else if (tier_level == 2) ecosystem.silver_threshold
        else 0
    }

    /// Get earning multiplier for tier level
    fun get_tier_multiplier(ecosystem: &LoyaltyEcosystem, tier_level: u8): u64 {
        if (tier_level == 5) ecosystem.diamond_multiplier
        else if (tier_level == 4) ecosystem.platinum_multiplier
        else if (tier_level == 3) ecosystem.gold_multiplier
        else if (tier_level == 2) ecosystem.silver_multiplier
        else ecosystem.bronze_multiplier
    }

    /// Get tier benefits description
    fun get_tier_benefits(tier_level: u8): vector<String> {
        let benefits = vector::empty<String>();
        
        if (tier_level >= 2) {
            vector::push_back(&mut benefits, string::utf8(b"Priority customer service"));
            vector::push_back(&mut benefits, string::utf8(b"Free checked bag"));
        };
        if (tier_level >= 3) {
            vector::push_back(&mut benefits, string::utf8(b"Complimentary upgrades"));
            vector::push_back(&mut benefits, string::utf8(b"Airport lounge access"));
        };
        if (tier_level >= 4) {
            vector::push_back(&mut benefits, string::utf8(b"Companion benefits"));
            vector::push_back(&mut benefits, string::utf8(b"Bonus award availability"));
        };
        if (tier_level == 5) {
            vector::push_back(&mut benefits, string::utf8(b"Exclusive experiences"));
            vector::push_back(&mut benefits, string::utf8(b"Personal concierge"));
        };
        
        benefits
    }

    // === Partner Management Functions ===
    
    /// Add new partner to ecosystem (admin only)
    public fun add_partner(
        ecosystem: &mut LoyaltyEcosystem,
        partner_id: String,
        partner_name: String,
        earning_rate: u64,                        // Points per dollar
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let partner_config = PartnerConfig {
            partner_name,
            earning_rate,
            active: true,
            integration_date: clock::timestamp_ms(clock),
            total_miles_issued: 0,
        };
        
        table::add(&mut ecosystem.active_partners, partner_id, partner_config);
    }

    /// Deactivate partner (admin only)
    public fun deactivate_partner(
        ecosystem: &mut LoyaltyEcosystem,
        partner_id: String,
        _ctx: &mut TxContext
    ) {
        let partner_config = table::borrow_mut(&mut ecosystem.active_partners, partner_id);
        partner_config.active = false;
    }

    // === Advanced Analytics Functions ===
    
    /// Get customer activity history from dynamic fields
    public fun get_customer_activity_history(
        profile: &CustomerProfile,
        start_transaction: u64,
        count: u64
    ): vector<ActivityRecord> {
        let activities = vector::empty<ActivityRecord>();
        let mut i = start_transaction;
        let end = start_transaction + count;
        
        while (i < end && i <= profile.total_transactions) {
            if (df::exists_(&profile.id, i)) {
                let activity = *df::borrow<u64, ActivityRecord>(&profile.id, i);
                vector::push_back(&mut activities, activity);
            };
            i = i + 1;
        };
        
        activities
    }

    /// Get comprehensive customer profile data
    public fun get_customer_profile_summary(profile: &CustomerProfile): (String, u64, u64, u64, u8, u64, u64) {
        (
            profile.customer_id,
            profile.current_skypoints,
            profile.lifetime_skypoints,
            profile.current_tier_credits,
            profile.tier_level,
            profile.total_transactions,
            profile.referred_customers
        )
    }

    /// Get partner balance for customer
    public fun get_partner_balance(profile: &CustomerProfile, partner_id: String): u64 {
        if (table::contains(&profile.partner_balances, partner_id)) {
            *table::borrow(&profile.partner_balances, partner_id)
        } else {
            0
        }
    }

    /// Get ecosystem statistics
    public fun get_ecosystem_stats(ecosystem: &LoyaltyEcosystem): (u64, u64, u64, u64, bool) {
        (
            ecosystem.total_skypoints_issued,
            ecosystem.total_tier_credits_issued,
            ecosystem.total_partner_miles_issued,
            table::length(&ecosystem.active_partners),
            ecosystem.program_active
        )
    }

    /// Get tier thresholds configuration
    public fun get_tier_thresholds(ecosystem: &LoyaltyEcosystem): (u64, u64, u64, u64) {
        (
            ecosystem.silver_threshold,
            ecosystem.gold_threshold,
            ecosystem.platinum_threshold,
            ecosystem.diamond_threshold
        )
    }

    // === Emergency Controls ===
    
    /// Emergency pause loyalty program (admin only)
    public fun emergency_pause_program(
        ecosystem: &mut LoyaltyEcosystem,
        _ctx: &mut TxContext
    ) {
        ecosystem.emergency_paused = true;
    }

    /// Resume loyalty program (admin only)
    public fun resume_program(
        ecosystem: &mut LoyaltyEcosystem,
        _ctx: &mut TxContext
    ) {
        ecosystem.emergency_paused = false;
    }

    /// Update tier thresholds (admin only, for program evolution)
    public fun update_tier_thresholds(
        ecosystem: &mut LoyaltyEcosystem,
        silver: u64,
        gold: u64,
        platinum: u64,
        diamond: u64,
        _ctx: &mut TxContext
    ) {
        ecosystem.silver_threshold = silver;
        ecosystem.gold_threshold = gold;
        ecosystem.platinum_threshold = platinum;
        ecosystem.diamond_threshold = diamond;
    }
}
```

## Step 1: Create the Loyalty System Project

Set up the loyalty rewards system:

```bash
mkdir sky-rewards
cd sky-rewards
sui move new sky_rewards
cd sky_rewards
```

## Step 2: Configure the Package

Update `Move.toml`:

```toml
[package]
name = "sky_rewards"
version = "1.0.0"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/devnet" }

[addresses]
sky_rewards = "0x0"
```

## Step 3: Create the Loyalty System Module

Create `sources/loyalty_system.move`:

```move
module sky_rewards::loyalty_system {
    use sui::coin::{Self, TreasuryCap, Coin};
    use sui::url;

    // Loyalty points token
    public struct SKYPOINTS has drop {}

    // Customer loyalty account
    public struct LoyaltyAccount has key, store {
        id: UID,
        customer_id: vector<u8>,
        tier_level: u8,  // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
        lifetime_points: u64,
        current_points: u64,
    }

    // Airline system capability for managing rewards
    public struct AirlineAdmin has key, store {
        id: UID,
        treasury: TreasuryCap<SKYPOINTS>,
    }

    // Redeemable rewards
    public struct SeatUpgrade has key, store {
        id: UID,
        flight_class: vector<u8>, // "business" or "first"
        expiry_date: u64,
    }

    public struct LoungePass has key, store {
        id: UID,
        airport_code: vector<u8>,
        expiry_date: u64,
    }

    public struct FreeFlight has key, store {
        id: UID,
        destination: vector<u8>,
        expiry_date: u64,
    }

    // Events for tracking
    public struct PointsEarned has copy, drop {
        customer: address,
        customer_id: vector<u8>,
        points_earned: u64,
        activity_type: vector<u8>,
        new_total: u64,
    }

    public struct PointsRedeemed has copy, drop {
        customer: address,
        customer_id: vector<u8>,
        points_spent: u64,
        reward_type: vector<u8>,
        remaining_points: u64,
    }

    public struct TierUpgraded has copy, drop {
        customer: address,
        customer_id: vector<u8>,
        old_tier: u8,
        new_tier: u8,
        lifetime_points: u64,
    }

    // Tier thresholds
    const SILVER_THRESHOLD: u64 = 10000;
    const GOLD_THRESHOLD: u64 = 25000;
    const PLATINUM_THRESHOLD: u64 = 50000;

    // Tier multipliers (in basis points, 10000 = 1x)
    const BRONZE_MULTIPLIER: u64 = 10000;   // 1.0x
    const SILVER_MULTIPLIER: u64 = 15000;   // 1.5x
    const GOLD_MULTIPLIER: u64 = 20000;     // 2.0x
    const PLATINUM_MULTIPLIER: u64 = 30000; // 3.0x

    // Reward costs
    const SEAT_UPGRADE_COST: u64 = 5000;
    const LOUNGE_PASS_COST: u64 = 2000;
    const FREE_FLIGHT_COST: u64 = 25000;

    // Errors
    const EInsufficientPoints: u64 = 0;
    const EInvalidTier: u64 = 1;
    const EUnauthorized: u64 = 2;

    // Initialize loyalty system
    fun init(witness: SKYPOINTS, ctx: &mut TxContext) {
        // Create loyalty points currency
        let (treasury, metadata) = coin::create_currency<SKYPOINTS>(
            witness,
            0,  // No decimals - whole points only
            b"SKY",
            b"SkyPoints", 
            b"Loyalty rewards points for Sky Airlines",
            option::some(url::new_unsafe_from_bytes(b"https://skyairlines.com/points.png")),
            ctx
        );

        // Create admin capability
        let admin = AirlineAdmin {
            id: object::new(ctx),
            treasury,
        };

        // Transfer to airline operator
        transfer::public_transfer(admin, tx_context::sender(ctx));
        transfer::public_freeze_object(metadata);
    }

    // Register new loyalty account
    public fun create_loyalty_account(
        customer_id: vector<u8>,
        ctx: &mut TxContext
    ): LoyaltyAccount {
        LoyaltyAccount {
            id: object::new(ctx),
            customer_id,
            tier_level: 1, // Start as Bronze
            lifetime_points: 0,
            current_points: 0,
        }
    }

    // Award points for flight miles
    public fun award_flight_points(
        admin: &mut AirlineAdmin,
        account: &mut LoyaltyAccount,
        miles_flown: u64,
        ctx: &mut TxContext
    ) {
        let base_points = miles_flown * 5; // 5 points per mile
        let multiplier = get_tier_multiplier(account.tier_level);
        let total_points = base_points * multiplier / 10000;

        // Mint points
        let points = coin::mint(&mut admin.treasury, total_points, ctx);
        
        // Update account
        account.current_points = account.current_points + total_points;
        account.lifetime_points = account.lifetime_points + total_points;
        
        // Check for tier upgrade
        check_tier_upgrade(account, ctx);

        // Transfer points to customer
        transfer::public_transfer(points, tx_context::sender(ctx));

        // Emit event
        event::emit(PointsEarned {
            customer: tx_context::sender(ctx),
            customer_id: account.customer_id,
            points_earned: total_points,
            activity_type: b"flight_miles",
            new_total: account.current_points,
        });
    }

    // Award points for spending
    public fun award_spending_points(
        admin: &mut AirlineAdmin,
        account: &mut LoyaltyAccount,
        dollars_spent: u64,
        ctx: &mut TxContext
    ) {
        let base_points = dollars_spent; // 1 point per dollar
        let multiplier = get_tier_multiplier(account.tier_level);
        let total_points = base_points * multiplier / 10000;

        // Mint points
        let points = coin::mint(&mut admin.treasury, total_points, ctx);
        
        // Update account
        account.current_points = account.current_points + total_points;
        account.lifetime_points = account.lifetime_points + total_points;
        
        // Check for tier upgrade
        check_tier_upgrade(account, ctx);

        // Transfer points to customer
        transfer::public_transfer(points, tx_context::sender(ctx));

        // Emit event
        event::emit(PointsEarned {
            customer: tx_context::sender(ctx),
            customer_id: account.customer_id,
            points_earned: total_points,
            activity_type: b"spending",
            new_total: account.current_points,
        });
    }

    // Redeem seat upgrade
    public fun redeem_seat_upgrade(
        account: &mut LoyaltyAccount,
        points_payment: Coin<SKYPOINTS>,
        flight_class: vector<u8>,
        expiry_timestamp: u64,
        ctx: &mut TxContext
    ): SeatUpgrade {
        assert!(coin::value(&points_payment) >= SEAT_UPGRADE_COST, EInsufficientPoints);
        assert!(account.current_points >= SEAT_UPGRADE_COST, EInsufficientPoints);
        
        // Burn the points
        let _burned = coin::into_balance(points_payment);
        
        // Update account
        account.current_points = account.current_points - SEAT_UPGRADE_COST;
        
        // Create upgrade reward
        let upgrade = SeatUpgrade {
            id: object::new(ctx),
            flight_class,
            expiry_date: expiry_timestamp,
        };

        // Emit event
        event::emit(PointsRedeemed {
            customer: tx_context::sender(ctx),
            customer_id: account.customer_id,
            points_spent: SEAT_UPGRADE_COST,
            reward_type: b"seat_upgrade",
            remaining_points: account.current_points,
        });

        upgrade
    }

    // Redeem lounge pass
    public fun redeem_lounge_pass(
        account: &mut LoyaltyAccount,
        points_payment: Coin<SKYPOINTS>,
        airport_code: vector<u8>,
        expiry_timestamp: u64,
        ctx: &mut TxContext
    ): LoungePass {
        assert!(coin::value(&points_payment) >= LOUNGE_PASS_COST, EInsufficientPoints);
        assert!(account.current_points >= LOUNGE_PASS_COST, EInsufficientPoints);
        
        // Burn the points
        let _burned = coin::into_balance(points_payment);
        
        // Update account
        account.current_points = account.current_points - LOUNGE_PASS_COST;
        
        // Create lounge pass
        let pass = LoungePass {
            id: object::new(ctx),
            airport_code,
            expiry_date: expiry_timestamp,
        };

        // Emit event
        event::emit(PointsRedeemed {
            customer: tx_context::sender(ctx),
            customer_id: account.customer_id,
            points_spent: LOUNGE_PASS_COST,
            reward_type: b"lounge_pass",
            remaining_points: account.current_points,
        });

        pass
    }

    // Redeem free flight
    public fun redeem_free_flight(
        account: &mut LoyaltyAccount,
        points_payment: Coin<SKYPOINTS>,
        destination: vector<u8>,
        expiry_timestamp: u64,
        ctx: &mut TxContext
    ): FreeFlight {
        assert!(coin::value(&points_payment) >= FREE_FLIGHT_COST, EInsufficientPoints);
        assert!(account.current_points >= FREE_FLIGHT_COST, EInsufficientPoints);
        
        // Burn the points
        let _burned = coin::into_balance(points_payment);
        
        // Update account
        account.current_points = account.current_points - FREE_FLIGHT_COST;
        
        // Create free flight
        let flight = FreeFlight {
            id: object::new(ctx),
            destination,
            expiry_date: expiry_timestamp,
        };

        // Emit event
        event::emit(PointsRedeemed {
            customer: tx_context::sender(ctx),
            customer_id: account.customer_id,
            points_spent: FREE_FLIGHT_COST,
            reward_type: b"free_flight",
            remaining_points: account.current_points,
        });

        flight
    }

    // Internal function to check and upgrade tier
    fun check_tier_upgrade(account: &mut LoyaltyAccount, ctx: &mut TxContext) {
        let old_tier = account.tier_level;
        let new_tier = if (account.lifetime_points >= PLATINUM_THRESHOLD) {
            4
        } else if (account.lifetime_points >= GOLD_THRESHOLD) {
            3
        } else if (account.lifetime_points >= SILVER_THRESHOLD) {
            2
        } else {
            1
        };

        if (new_tier > old_tier) {
            account.tier_level = new_tier;
            
            event::emit(TierUpgraded {
                customer: tx_context::sender(ctx),
                customer_id: account.customer_id,
                old_tier,
                new_tier,
                lifetime_points: account.lifetime_points,
            });
        }
    }

    // Get tier multiplier
    fun get_tier_multiplier(tier_level: u8): u64 {
        if (tier_level == 1) BRONZE_MULTIPLIER
        else if (tier_level == 2) SILVER_MULTIPLIER
        else if (tier_level == 3) GOLD_MULTIPLIER
        else if (tier_level == 4) PLATINUM_MULTIPLIER
        else abort EInvalidTier
    }

    // View functions
    public fun get_account_details(account: &LoyaltyAccount): (vector<u8>, u8, u64, u64) {
        (account.customer_id, account.tier_level, account.lifetime_points, account.current_points)
    }

    public fun get_tier_name(tier_level: u8): vector<u8> {
        if (tier_level == 1) b"Bronze"
        else if (tier_level == 2) b"Silver"
        else if (tier_level == 3) b"Gold"
        else if (tier_level == 4) b"Platinum"
        else b"Unknown"
    }

    public fun get_upgrade_details(upgrade: &SeatUpgrade): (vector<u8>, u64) {
        (upgrade.flight_class, upgrade.expiry_date)
    }

    public fun get_lounge_details(pass: &LoungePass): (vector<u8>, u64) {
        (pass.airport_code, pass.expiry_date)
    }

    public fun get_flight_details(flight: &FreeFlight): (vector<u8>, u64) {
        (flight.destination, flight.expiry_date)
    }
}
```

## Step 4: Build and Deploy the Loyalty System

Build your loyalty system:

```bash
sui move build
```

Deploy to testnet:

```bash
sui client publish --gas-budget 100000000
```

Save these important IDs:
- Package ID
- AirlineAdmin Object ID

## Step 5: Create Your Loyalty Account

Create a customer loyalty account:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module loyalty_system \
  --function create_loyalty_account \
  --args '"CUST12345"' \
  --gas-budget 10000000
```

Save your LoyaltyAccount Object ID from the transaction.

## Step 6: Earn Points from Flight Miles

Award yourself points for a 1,000-mile flight (5,000 base points):

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module loyalty_system \
  --function award_flight_points \
  --args YOUR_ADMIN_ID YOUR_LOYALTY_ACCOUNT_ID 1000 \
  --gas-budget 15000000
```

As a Bronze member (1x multiplier), you earn exactly 5,000 points.

## Step 7: Earn Points from Spending

Award points for $500 in airline spending:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module loyalty_system \
  --function award_spending_points \
  --args YOUR_ADMIN_ID YOUR_LOYALTY_ACCOUNT_ID 500 \
  --gas-budget 15000000
```

You earn 500 more points, bringing your total to 5,500 points.

## Step 8: Check Your Account Status

View your loyalty account details:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module loyalty_system \
  --function get_account_details \
  --args YOUR_LOYALTY_ACCOUNT_ID \
  --gas-budget 5000000
```

You should see: customer_id="CUST12345", tier=1 (Bronze), lifetime_points=5500, current_points=5500.

## Step 9: Redeem a Lounge Pass

Redeem 2,000 points for airport lounge access:

```bash
# Get expiry timestamp (30 days from now in milliseconds)
EXPIRY_TIME=$(date -d "+30 days" +%s)000

sui client call \
  --package YOUR_PACKAGE_ID \
  --module loyalty_system \
  --function redeem_lounge_pass \
  --args YOUR_LOYALTY_ACCOUNT_ID YOUR_SKYPOINTS_COIN_ID '"LAX"' $EXPIRY_TIME \
  --gas-budget 15000000
```

You now own a LoungePass object valid for LAX airport!

## Step 10: Earn More Points to Reach Silver Tier

To reach Silver tier (10,000 lifetime points), earn more through flights:

```bash
# Another 1,000-mile flight (5,000 points) brings you to 10,500 lifetime points
sui client call \
  --package YOUR_PACKAGE_ID \
  --module loyalty_system \
  --function award_flight_points \
  --args YOUR_ADMIN_ID YOUR_LOYALTY_ACCOUNT_ID 1000 \
  --gas-budget 15000000
```

Check your account - you should now be Silver tier (tier_level=2)!

## Step 11: Experience the Silver Multiplier

As a Silver member, earn points with 1.5x multiplier:

```bash
# $1,000 spending = 1,000 base points * 1.5 = 1,500 total points
sui client call \
  --package YOUR_PACKAGE_ID \
  --module loyalty_system \
  --function award_spending_points \
  --args YOUR_ADMIN_ID YOUR_LOYALTY_ACCOUNT_ID 1000 \
  --gas-budget 15000000
```

Notice you receive 1,500 points instead of 1,000!

## Step 12: Redeem a Seat Upgrade

Use 5,000 points for a business class upgrade:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module loyalty_system \
  --function redeem_seat_upgrade \
  --args YOUR_LOYALTY_ACCOUNT_ID YOUR_SKYPOINTS_COIN_ID '"business"' $EXPIRY_TIME \
  --gas-budget 15000000
```

You now have a SeatUpgrade object for business class!

## What You've Accomplished

You have built a comprehensive loyalty rewards system featuring:

✅ **Tiered Membership**: Bronze, Silver, Gold, Platinum with escalating benefits
✅ **Point Earning**: Multiple ways to earn with tier-based multipliers
✅ **Reward Redemption**: Seat upgrades, lounge access, and free flights  
✅ **Account Tracking**: Lifetime points, current balance, and tier status
✅ **Event Logging**: Complete audit trail of all point activities

## Loyalty Program Economics

**Tier Benefits**:
- Bronze: 1x earning rate
- Silver: 1.5x earning rate (10,000+ lifetime points)
- Gold: 2x earning rate (25,000+ lifetime points)  
- Platinum: 3x earning rate (50,000+ lifetime points)

**Reward Value**:
- Lounge Pass: 2,000 points (~$20 value)
- Seat Upgrade: 5,000 points (~$100 value)
- Free Flight: 25,000 points (~$500 value)

## Advanced Loyalty Features

Extend the system with:

**Expiring Points**:
```move
public struct PointsExpiry has store {
    points: u64,
    expiry_date: u64,
}
```

**Partner Earning**:
```move
public fun award_partner_points(
    hotel_stays: u64,
    car_rentals: u64
) {
    // Earn points from partner activities
}
```

**Elite Benefits**:
```move
public fun get_elite_perks(tier: u8): vector<u8> {
    // Free upgrades, priority boarding, etc.
}
```

## Real-World Applications

This loyalty system works for:
- **Airlines**: Frequent flyer programs
- **Hotels**: Guest reward programs  
- **Retail**: Customer loyalty points
- **Credit Cards**: Cashback and rewards
- **Gaming**: Achievement and progression systems

## Revenue Impact

Loyalty programs drive business value through:
- **Increased Spending**: Tier multipliers encourage more activity
- **Customer Retention**: Points create switching costs
- **Data Collection**: Track customer behavior patterns
- **Revenue Recognition**: Points are liabilities until redeemed

Your loyalty token system provides a foundation for building engaging customer reward programs with blockchain transparency and programmable redemption logic.