# Build Gaming Economies with In-Game Tokens: A Complete Guide for Solana Developers

Coming from Solana's game development ecosystem, you understand the challenges of building in-game economies: complex token accounts, rent considerations, and managing cross-program composability. Sui's object model revolutionizes game development by making items truly owned by players and eliminating rent concerns.

In this comprehensive tutorial, we'll create "CRYSTAL REALMS" - a complete fantasy RPG economy featuring multiple currencies, item crafting, player progression, and marketplace mechanics. We'll compare every pattern to Solana game development and show how Sui's advantages create better player experiences.

**Prerequisites**: Complete the [Basic Coin Tutorial](./BASIC_COIN_TUTORIAL.md) first.

## Understanding Gaming on Blockchain: Solana vs Sui

### Solana Game Development Challenges
```rust
// Solana games face several architectural challenges:

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PlayerAccount {
    pub player: Pubkey,
    pub level: u16,
    pub experience: u64,
    pub inventory_items: Vec<Pubkey>,    // Limited by account size!
    // Max ~100 items due to 10KB account limit
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GameItem {
    pub item_type: ItemType,
    pub rarity: Rarity,
    pub stats: ItemStats,
    pub owner: Pubkey,                   // Player who owns this item
    // Each item requires its own account (rent costs!)
}

// Problems:
// 1. Inventory size limits (10KB accounts)
// 2. Rent costs for every item (~0.002 SOL each)
// 3. Complex cross-program item transfers
// 4. Account initialization overhead
// 5. No native item composability
```

### Sui Game Development Advantages
```move
// Sui eliminates these problems with native object ownership:

public struct Player has key {
    id: UID,
    level: u16,
    experience: u64,
    // Inventory is unlimited - items are owned objects
    // No account size restrictions!
}

public struct GameItem has key, store {
    id: UID,
    item_type: u8,
    rarity: u8,
    attack_power: u64,
    // Directly owned by player address
    // No rent costs, unlimited storage
}

// Advantages:
// 1. Unlimited inventory size
// 2. No rent costs for game items  
// 3. True item ownership (transferable by default)
// 4. Native item composability
// 5. Instant item creation
```

## Game Economy Architecture Comparison

### Traditional Web3 Game Stack (Solana)
```
Game Client (Unity/Unreal)
│
├─ Wallet Integration (Phantom/Solflare)
├─ RPC Calls (getAccountInfo)
├─ Program Instructions
│   ├─ Token Program (for currencies)
│   ├─ NFT Program (for items)
│   └─ Game Logic Program
│
└─ State Management
    ├─ Player Accounts (limited size)
    ├─ Item Accounts (rent costs)
    └─ Marketplace Accounts
```

### Sui Game Stack (What We're Building)
```
Game Client (Unity/Unreal) 
│
├─ Sui Wallet Integration
├─ Programmable Transaction Blocks
├─ Move Modules
│   ├─ Game Currency (built-in coin type)
│   ├─ Item System (native objects)
│   └─ Player Progression (unlimited data)
│
└─ Object Ownership
    ├─ Player Objects (unlimited size)
    ├─ Item Objects (no rent)
    └─ Dynamic NFTs (mutable stats)
```

## Economic Game Design Principles

### Understanding Closed-Loop Economies

**What is a Closed-Loop Economy?**
- Players can buy in-game currency with real money (SUI)
- In-game currency can only be spent within the game
- Items and currencies cannot be withdrawn as real money
- Prevents "play-to-earn" dynamics that can destabilize gameplay

**Why Choose Closed-Loop?**
1. **Gameplay Focus**: Players play for fun, not financial gain
2. **Economic Stability**: Game developers control inflation/deflation
3. **Regulatory Clarity**: Avoids securities law complications  
4. **Sustainable Revenue**: Clear monetization without token volatility

### Crystal Realms Economy Design

**Currencies**:
- **SUI**: Real money input (players purchase with this)
- **GEMS**: Primary in-game currency (buy items, services)
- **ESSENCE**: Rare crafting material (earned through gameplay)

**Conversion Rates**:
- 1 SUI = 100 GEMS (fixed rate)
- ESSENCE cannot be purchased (gameplay only)

**Items & Pricing**:
- Common Sword: 50 GEMS
- Rare Shield: 200 GEMS + 10 ESSENCE
- Legendary Armor: 1000 GEMS + 100 ESSENCE
- Crafting Materials: 5-25 GEMS each

**Economic Sinks** (remove currency from economy):
- Item purchases (permanent removal)
- Crafting failures (materials lost)
- Repair costs (equipment maintenance)
- Guild fees (social features)

**Economic Sources** (add currency to economy):
- SUI purchases (controlled by developer)
- Quest rewards (GEMS and ESSENCE)
- Achievement bonuses
- Daily login rewards

## Step 1: Advanced Project Setup for Game Development

### Game Development Project Structure
```bash
# Create comprehensive game project
mkdir crystal-realms
cd crystal-realms
sui move new crystal_realms
cd crystal_realms

# Create proper game module structure
mkdir -p sources/{currencies,items,player,crafting,marketplace}
```

### Enhanced Package Configuration for Games

Update `Move.toml` with game-specific configuration:

```toml
[package]
name = "crystal_realms"
version = "1.0.0"
edition = "2024.beta"
authors = ["Crystal Realms Studios"]

[dependencies]
Sui = { 
    git = "https://github.com/MystenLabs/sui.git", 
    subdir = "crates/sui-framework/packages/sui-framework", 
    rev = "framework/devnet" 
}

[addresses]
crystal_realms = "0x0"

# Game-specific metadata
[package.metadata.game]
name = "Crystal Realms"
genre = "Fantasy RPG"
max_players = "unlimited"
economy_type = "closed_loop"
currencies = ["GEMS", "ESSENCE"]
item_categories = ["weapons", "armor", "consumables", "crafting_materials"]
```

## Step 2: Multi-Currency Game Economy Implementation

Create `sources/currencies/game_currencies.move`:

```move
module crystal_realms::game_currencies {
    // === Core Imports ===
    use sui::coin::{Self, TreasuryCap, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::url;
    use sui::event;

    // === Game Currency Types ===
    
    /// Primary in-game currency - purchasable with SUI
    public struct GEMS has drop {}
    
    /// Rare crafting material - earned only through gameplay
    public struct ESSENCE has drop {}

    // === Game Economy Management ===
    
    /// Central economic management system
    public struct GameEconomy has key {
        id: UID,
        gem_treasury: TreasuryCap<GEMS>,           // Controls GEM supply
        essence_treasury: TreasuryCap<ESSENCE>,    // Controls ESSENCE supply  
        sui_reserves: Balance<SUI>,                // SUI from gem purchases
        gem_to_sui_rate: u64,                     // How many GEMS per SUI
        total_gems_sold: u64,                     // Economic tracking
        total_essence_minted: u64,                // Gameplay rewards tracking
        daily_gem_limit: u64,                     // Anti-whale protection
        emergency_paused: bool,                   // Emergency economic controls
    }

    /// Daily purchase tracking for players
    public struct DailyPurchaseTracker has key {
        id: UID,
        daily_purchases: Table<address, DailySpending>, // Player -> spending
        current_day: u64,                         // Current day epoch
    }

    /// Player's daily spending record
    public struct DailySpending has store {
        gems_purchased: u64,                      // GEMs purchased today
        sui_spent: u64,                          // SUI spent today
        last_purchase: u64,                      // Last purchase timestamp
    }

    // === Bundle Configuration ===
    
    /// Gem purchase bundles with bonuses
    public struct GemBundle has copy, drop {
        sui_cost: u64,                           // SUI required
        base_gems: u64,                          // Base GEM amount
        bonus_gems: u64,                         // Bonus GEMs (bulk discount)
        bundle_name: vector<u8>,                 // "Starter", "Hero", "Legend"
    }

    // === Events for Game Analytics ===
    
    /// Player purchased gems with SUI
    public struct GemsPurchased has copy, drop {
        player: address,
        sui_spent: u64,
        gems_received: u64,
        bundle_type: vector<u8>,
        bonus_gems: u64,
        timestamp: u64,
    }

    /// ESSENCE rewarded for gameplay achievements
    public struct EssenceRewarded has copy, drop {
        player: address,
        essence_amount: u64,
        reward_reason: vector<u8>,               // "quest", "boss_kill", "crafting"
        timestamp: u64,
    }

    /// Economic controls activated
    public struct EconomicControlActivated has copy, drop {
        control_type: vector<u8>,                // "pause", "rate_change", "limit_change"
        previous_value: u64,
        new_value: u64,
        reason: vector<u8>,
        timestamp: u64,
    }

    // === Economic Constants ===
    const DEFAULT_GEM_RATE: u64 = 100_000_000;      // 100 GEMS per 1 SUI  
    const DEFAULT_DAILY_LIMIT: u64 = 50_000_000_000; // $50 USD worth per day
    const STARTER_BUNDLE_COST: u64 = 5_000_000_000;   // 5 SUI
    const HERO_BUNDLE_COST: u64 = 20_000_000_000;     // 20 SUI
    const LEGEND_BUNDLE_COST: u64 = 50_000_000_000;   // 50 SUI

    // === Error Codes ===
    const EGamePaused: u64 = 200;
    const EDailyLimitExceeded: u64 = 201;
    const EInvalidBundle: u64 = 202;
    const EInsufficientSUI: u64 = 203;
    const EUnauthorizedGameOp: u64 = 204;

    // === Initialization ===
    fun init(ctx: &mut TxContext) {
        // Create GEMS currency (purchasable)
        let (gem_treasury, gem_metadata) = coin::create_currency<GEMS>(
            GEMS {},
            6,                                         // 6 decimals like USDC
            b"GEMS",                                   // Symbol
            b"Crystal Gems",                           // Name
            b"Primary currency for Crystal Realms RPG - purchase with SUI",
            option::some(url::new_unsafe_from_bytes(b"https://crystalrealms.game/gem-icon.png")),
            ctx
        );

        // Create ESSENCE currency (gameplay only)
        let (essence_treasury, essence_metadata) = coin::create_currency<ESSENCE>(
            ESSENCE {},
            0,                                         // No decimals - whole essence only
            b"ESSENCE",                                // Symbol  
            b"Mystical Essence",                       // Name
            b"Rare crafting material earned through gameplay in Crystal Realms",
            option::some(url::new_unsafe_from_bytes(b"https://crystalrealms.game/essence-icon.png")),
            ctx
        );

        // Create economic management system
        let game_economy = GameEconomy {
            id: object::new(ctx),
            gem_treasury,
            essence_treasury,
            sui_reserves: balance::zero<SUI>(),
            gem_to_sui_rate: DEFAULT_GEM_RATE,
            total_gems_sold: 0,
            total_essence_minted: 0,
            daily_gem_limit: DEFAULT_DAILY_LIMIT,
            emergency_paused: false,
        };

        // Create daily purchase tracking system
        let purchase_tracker = DailyPurchaseTracker {
            id: object::new(ctx),
            daily_purchases: table::new(ctx),
            current_day: 0,
        };

        // Share economic systems
        transfer::share_object(game_economy);
        transfer::share_object(purchase_tracker);
        
        // Freeze currency metadata
        transfer::public_freeze_object(gem_metadata);
        transfer::public_freeze_object(essence_metadata);
    }

    // === Gem Purchase Functions ===
    
    /// Purchase gems using predefined bundles with bonuses
    public fun buy_gem_bundle(
        economy: &mut GameEconomy,
        tracker: &mut DailyPurchaseTracker,
        bundle_type: u8,                          // 1=Starter, 2=Hero, 3=Legend
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): Coin<GEMS> {
        assert!(!economy.emergency_paused, EGamePaused);

        let bundle = get_bundle_config(bundle_type);
        let payment_amount = coin::value(&payment);
        
        assert!(payment_amount >= bundle.sui_cost, EInsufficientSUI);

        // Check daily spending limits
        check_and_update_daily_limit(tracker, tx_context::sender(ctx), 
            payment_amount, clock);

        // Process payment
        let sui_balance = coin::into_balance(payment);
        balance::join(&mut economy.sui_reserves, sui_balance);

        // Calculate total gems (base + bonus)
        let total_gems = bundle.base_gems + bundle.bonus_gems;
        
        // Mint gems
        let gems = coin::mint(&mut economy.gem_treasury, total_gems, ctx);
        
        // Update economic tracking
        economy.total_gems_sold = economy.total_gems_sold + total_gems;

        // Emit analytics event
        event::emit(GemsPurchased {
            player: tx_context::sender(ctx),
            sui_spent: bundle.sui_cost,
            gems_received: total_gems,
            bundle_type: bundle.bundle_name,
            bonus_gems: bundle.bonus_gems,
            timestamp: clock::timestamp_ms(clock),
        });

        gems
    }

    /// Purchase exact amount of gems (no bundles)
    public fun buy_gems_exact_amount(
        economy: &mut GameEconomy,
        tracker: &mut DailyPurchaseTracker, 
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): Coin<GEMS> {
        assert!(!economy.emergency_paused, EGamePaused);

        let sui_amount = coin::value(&payment);
        let gem_amount = (sui_amount * economy.gem_to_sui_rate) / 1_000_000_000; // Convert from SUI decimals

        // Check daily limits
        check_and_update_daily_limit(tracker, tx_context::sender(ctx), 
            sui_amount, clock);

        // Process payment
        let sui_balance = coin::into_balance(payment);
        balance::join(&mut economy.sui_reserves, sui_balance);

        // Mint gems
        let gems = coin::mint(&mut economy.gem_treasury, gem_amount, ctx);
        
        // Update tracking
        economy.total_gems_sold = economy.total_gems_sold + gem_amount;

        // Emit event
        event::emit(GemsPurchased {
            player: tx_context::sender(ctx),
            sui_spent: sui_amount,
            gems_received: gem_amount,
            bundle_type: b"custom_amount",
            bonus_gems: 0,
            timestamp: clock::timestamp_ms(clock),
        });

        gems
    }

    // === Essence Reward Functions (Gameplay Only) ===
    
    /// Reward essence for gameplay achievements (admin only)
    public fun reward_essence_for_achievement(
        economy: &mut GameEconomy,
        player: address,
        amount: u64,
        reason: vector<u8>,                       // "boss_kill", "quest_complete", etc.
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Note: In production, this would check for game authority
        // For tutorial, we'll allow any caller
        
        let essence = coin::mint(&mut economy.essence_treasury, amount, ctx);
        economy.total_essence_minted = economy.total_essence_minted + amount;

        // Transfer to player
        transfer::public_transfer(essence, player);

        // Emit reward event
        event::emit(EssenceRewarded {
            player,
            essence_amount: amount,
            reward_reason: reason,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // === Economic Management Functions ===
    
    /// Emergency pause all purchases (admin only)
    public fun emergency_pause_economy(
        economy: &mut GameEconomy,
        reason: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        economy.emergency_paused = true;
        
        event::emit(EconomicControlActivated {
            control_type: b"emergency_pause",
            previous_value: 0,
            new_value: 1,
            reason,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Resume economic activity (admin only)
    public fun resume_economy(
        economy: &mut GameEconomy,
        _ctx: &mut TxContext
    ) {
        economy.emergency_paused = false;
    }

    /// Update gem-to-SUI exchange rate (admin only)
    public fun update_gem_rate(
        economy: &mut GameEconomy,
        new_rate: u64,
        reason: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let old_rate = economy.gem_to_sui_rate;
        economy.gem_to_sui_rate = new_rate;
        
        event::emit(EconomicControlActivated {
            control_type: b"rate_change",
            previous_value: old_rate,
            new_value: new_rate,
            reason,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // === Helper Functions ===
    
    /// Get bundle configuration based on type
    fun get_bundle_config(bundle_type: u8): GemBundle {
        if (bundle_type == 1) {
            // Starter Bundle: 5 SUI -> 500 GEMS + 50 bonus = 550 GEMS total (10% bonus)
            GemBundle {
                sui_cost: STARTER_BUNDLE_COST,
                base_gems: 500_000_000,    // 500 GEMS
                bonus_gems: 50_000_000,    // 50 bonus GEMS  
                bundle_name: b"Starter Pack"
            }
        } else if (bundle_type == 2) {
            // Hero Bundle: 20 SUI -> 2000 GEMS + 400 bonus = 2400 GEMS total (20% bonus)
            GemBundle {
                sui_cost: HERO_BUNDLE_COST,
                base_gems: 2000_000_000,   // 2000 GEMS
                bonus_gems: 400_000_000,   // 400 bonus GEMS
                bundle_name: b"Hero Pack"
            }
        } else if (bundle_type == 3) {
            // Legend Bundle: 50 SUI -> 5000 GEMS + 1500 bonus = 6500 GEMS total (30% bonus)
            GemBundle {
                sui_cost: LEGEND_BUNDLE_COST,
                base_gems: 5000_000_000,   // 5000 GEMS
                bonus_gems: 1500_000_000,  // 1500 bonus GEMS
                bundle_name: b"Legend Pack"
            }
        } else {
            abort EInvalidBundle
        }
    }

    /// Check and update daily spending limits
    fun check_and_update_daily_limit(
        tracker: &mut DailyPurchaseTracker,
        player: address,
        sui_amount: u64,
        clock: &Clock,
    ) {
        let current_timestamp = clock::timestamp_ms(clock);
        let current_day = current_timestamp / 86400000; // Convert to day number

        // Update tracker's current day if needed
        if (current_day > tracker.current_day) {
            tracker.current_day = current_day;
            // Note: In production, you'd clean up old daily records here
        }

        // Get or create player's daily spending record
        if (!table::contains(&tracker.daily_purchases, player)) {
            let new_spending = DailySpending {
                gems_purchased: 0,
                sui_spent: 0,
                last_purchase: 0,
            };
            table::add(&mut tracker.daily_purchases, player, new_spending);
        };

        let spending = table::borrow_mut(&mut tracker.daily_purchases, player);
        
        // Reset if it's a new day
        let last_purchase_day = spending.last_purchase / 86400000;
        if (current_day > last_purchase_day) {
            spending.gems_purchased = 0;
            spending.sui_spent = 0;
        }

        // Check daily limit
        assert!(spending.sui_spent + sui_amount <= DEFAULT_DAILY_LIMIT, EDailyLimitExceeded);
        
        // Update spending record
        spending.sui_spent = spending.sui_spent + sui_amount;
        spending.last_purchase = current_timestamp;
    }

    // === View Functions ===
    
    /// Get current economic statistics
    public fun get_economic_stats(economy: &GameEconomy): (u64, u64, u64, bool) {
        (
            economy.total_gems_sold,
            economy.total_essence_minted,
            economy.gem_to_sui_rate,
            economy.emergency_paused
        )
    }

    /// Get player's daily spending
    public fun get_daily_spending(tracker: &DailyPurchaseTracker, player: address): (u64, u64) {
        if (table::contains(&tracker.daily_purchases, player)) {
            let spending = table::borrow(&tracker.daily_purchases, player);
            (spending.gems_purchased, spending.sui_spent)
        } else {
            (0, 0)
        }
    }

    /// Get current SUI reserves (for withdrawal by game developers)
    public fun get_sui_reserves(economy: &GameEconomy): u64 {
        balance::value(&economy.sui_reserves)
    }
}
```

## Step 1: Create the Game Project

Set up the gaming currency project:

```bash
mkdir fantasy-rpg
cd fantasy-rpg  
sui move new fantasy_rpg
cd fantasy_rpg
```

## Step 2: Configure the Package

Update `Move.toml`:

```toml
[package]
name = "fantasy_rpg"
version = "1.0.0"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/devnet" }

[addresses]
fantasy_rpg = "0x0"
```

## Step 3: Create the Game Currency Module

Create `sources/game_currency.move`:

```move
module fantasy_rpg::game_currency {
    use sui::coin::{Self, TreasuryCap, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::url;

    // Gaming currency token
    public struct GEMCOIN has drop {}

    // Game store for purchasing gems and items
    public struct GameStore has key {
        id: UID,
        treasury: TreasuryCap<GEMCOIN>,
        sui_balance: Balance<SUI>,
        gem_price_per_sui: u64,  // How many gems per 1 SUI
    }

    // Game items that can be purchased
    public struct Sword has key, store {
        id: UID,
        attack_power: u64,
    }

    public struct Shield has key, store {
        id: UID,  
        defense_power: u64,
    }

    public struct Potion has key, store {
        id: UID,
        healing_power: u64,
    }

    // Events
    public struct GemsaPurchased has copy, drop {
        player: address,
        sui_paid: u64,
        gems_received: u64,
    }

    public struct ItemPurchased has copy, drop {
        player: address,
        item_type: vector<u8>,
        gems_spent: u64,
    }

    // Item prices in GEMS
    const SWORD_PRICE: u64 = 50_000_000;    // 50 GEMS
    const SHIELD_PRICE: u64 = 30_000_000;   // 30 GEMS  
    const POTION_PRICE: u64 = 10_000_000;   // 10 GEMS

    // Bundle configurations
    const SMALL_BUNDLE_GEMS: u64 = 500_000_000;   // 500 GEMS
    const MEDIUM_BUNDLE_GEMS: u64 = 1200_000_000; // 1200 GEMS
    const LARGE_BUNDLE_GEMS: u64 = 2500_000_000;  // 2500 GEMS

    const SMALL_BUNDLE_COST: u64 = 5_000_000_000;   // 5 SUI
    const MEDIUM_BUNDLE_COST: u64 = 10_000_000_000; // 10 SUI (20% bonus)
    const LARGE_BUNDLE_COST: u64 = 20_000_000_000;  // 20 SUI (25% bonus)

    // Errors
    const EInsufficientGems: u64 = 0;
    const EInvalidBundle: u64 = 1;

    // Initialize the gaming currency
    fun init(witness: GEMCOIN, ctx: &mut TxContext) {
        // Create the gem currency
        let (treasury, metadata) = coin::create_currency<GEMCOIN>(
            witness,
            6,                                    // decimals
            b"GEMS",                             // symbol
            b"Fantasy RPG Gems",                 // name
            b"In-game currency for Fantasy RPG purchases", // description
            option::some(url::new_unsafe_from_bytes(b"https://fantasy-rpg.io/gem.png")), // icon
            ctx
        );

        // Create game store
        let store = GameStore {
            id: object::new(ctx),
            treasury,
            sui_balance: balance::zero<SUI>(),
            gem_price_per_sui: 100_000_000, // 100 GEMS per 1 SUI
        };

        // Make store a shared object so anyone can interact
        transfer::share_object(store);
        
        // Freeze metadata
        transfer::public_freeze_object(metadata);
    }

    // Purchase gems with SUI using predefined bundles
    public fun buy_gem_bundle(
        store: &mut GameStore,
        bundle_type: u8, // 1=small, 2=medium, 3=large
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ): Coin<GEMCOIN> {
        let (expected_cost, gem_amount) = if (bundle_type == 1) {
            (SMALL_BUNDLE_COST, SMALL_BUNDLE_GEMS)
        } else if (bundle_type == 2) {
            (MEDIUM_BUNDLE_COST, MEDIUM_BUNDLE_GEMS)  
        } else if (bundle_type == 3) {
            (LARGE_BUNDLE_COST, LARGE_BUNDLE_GEMS)
        } else {
            abort EInvalidBundle
        };

        // Verify payment amount
        assert!(coin::value(&payment) >= expected_cost, EInvalidBundle);

        // Take payment
        let sui_balance = coin::into_balance(payment);
        balance::join(&mut store.sui_balance, sui_balance);

        // Mint gems
        let gems = coin::mint(&mut store.treasury, gem_amount, ctx);

        // Emit event
        event::emit(GemsPurchased {
            player: tx_context::sender(ctx),
            sui_paid: expected_cost,
            gems_received: gem_amount,
        });

        gems
    }

    // Purchase custom amount of gems with SUI
    public fun buy_gems_custom(
        store: &mut GameStore,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ): Coin<GEMCOIN> {
        let sui_amount = coin::value(&payment);
        let gem_amount = sui_amount * store.gem_price_per_sui / 1_000_000_000; // Convert from SUI decimals

        // Take payment
        let sui_balance = coin::into_balance(payment);
        balance::join(&mut store.sui_balance, sui_balance);

        // Mint gems
        let gems = coin::mint(&mut store.treasury, gem_amount, ctx);

        // Emit event
        event::emit(GemsPurchased {
            player: tx_context::sender(ctx),
            sui_paid: sui_amount,
            gems_received: gem_amount,
        });

        gems
    }

    // Buy a sword with gems
    public fun buy_sword(
        payment: Coin<GEMCOIN>,
        ctx: &mut TxContext
    ): Sword {
        assert!(coin::value(&payment) >= SWORD_PRICE, EInsufficientGems);
        
        // Take payment and burn gems
        let _burned_balance = coin::into_balance(payment);
        // Note: In a real game, you might transfer gems to treasury rather than burn

        // Create sword
        let sword = Sword {
            id: object::new(ctx),
            attack_power: 100,
        };

        // Emit event
        event::emit(ItemPurchased {
            player: tx_context::sender(ctx),
            item_type: b"sword",
            gems_spent: SWORD_PRICE,
        });

        sword
    }

    // Buy a shield with gems
    public fun buy_shield(
        payment: Coin<GEMCOIN>,
        ctx: &mut TxContext
    ): Shield {
        assert!(coin::value(&payment) >= SHIELD_PRICE, EInsufficientGems);
        
        let _burned_balance = coin::into_balance(payment);

        let shield = Shield {
            id: object::new(ctx),
            defense_power: 75,
        };

        event::emit(ItemPurchased {
            player: tx_context::sender(ctx),
            item_type: b"shield", 
            gems_spent: SHIELD_PRICE,
        });

        shield
    }

    // Buy a potion with gems
    public fun buy_potion(
        payment: Coin<GEMCOIN>,
        ctx: &mut TxContext
    ): Potion {
        assert!(coin::value(&payment) >= POTION_PRICE, EInsufficientGems);
        
        let _burned_balance = coin::into_balance(payment);

        let potion = Potion {
            id: object::new(ctx),
            healing_power: 50,
        };

        event::emit(ItemPurchased {
            player: tx_context::sender(ctx),
            item_type: b"potion",
            gems_spent: POTION_PRICE,
        });

        potion
    }

    // View functions
    public fun get_gem_price_per_sui(store: &GameStore): u64 {
        store.gem_price_per_sui
    }

    public fun get_sword_attack(sword: &Sword): u64 {
        sword.attack_power
    }

    public fun get_shield_defense(shield: &Shield): u64 {
        shield.defense_power
    }

    public fun get_potion_healing(potion: &Potion): u64 {
        potion.healing_power
    }

    // Admin function to withdraw SUI earnings (in a real game, this would have proper access controls)
    public fun withdraw_earnings(
        store: &mut GameStore,
        ctx: &mut TxContext
    ): Coin<SUI> {
        let amount = balance::value(&store.sui_balance);
        let withdrawn = balance::split(&mut store.sui_balance, amount);
        coin::from_balance(withdrawn, ctx)
    }
}
```

## Step 4: Build and Deploy the Game

Build your game:

```bash
sui move build
```

Deploy to testnet:

```bash
sui client publish --gas-budget 100000000
```

Save these IDs from output:
- Package ID
- GameStore Object ID (shared object)

## Step 5: Test Gem Purchase

Buy a small gem bundle (500 gems for 5 SUI):

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module game_currency \
  --function buy_gem_bundle \
  --args YOUR_GAMESTORE_ID 1 YOUR_SUI_COIN_ID \
  --gas-budget 15000000
```

You should receive a GEM coin object with 500,000,000 base units (500 GEMS).

## Step 6: Buy Your First Sword

Purchase a sword using your gems:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module game_currency \
  --function buy_sword \
  --args YOUR_GEM_COIN_ID \
  --gas-budget 10000000
```

You now own a Sword object with 100 attack power!

## Step 7: Try Different Bundle Sizes

Buy a medium bundle for better value:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module game_currency \
  --function buy_gem_bundle \
  --args YOUR_GAMESTORE_ID 2 YOUR_SUI_COIN_ID \
  --gas-budget 15000000
```

This gives you 1,200 gems for 10 SUI (120 gems per SUI vs 100).

## Step 8: Purchase Multiple Items

With your gems, buy various items:

```bash
# Buy a shield (30 GEMS)
sui client call \
  --package YOUR_PACKAGE_ID \
  --module game_currency \
  --function buy_shield \
  --args YOUR_GEM_COIN_ID \
  --gas-budget 10000000

# Buy a potion (10 GEMS) 
sui client call \
  --package YOUR_PACKAGE_ID \
  --module game_currency \
  --function buy_potion \
  --args YOUR_GEM_COIN_ID \
  --gas-budget 10000000
```

## Step 9: Check Your Game Inventory

List all your game objects:

```bash
sui client objects --json | grep -E "(Sword|Shield|Potion|GEMCOIN)"
```

You should see your purchased weapons, armor, and remaining gems.

## Step 10: View Item Stats

Check your sword's attack power:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module game_currency \
  --function get_sword_attack \
  --args YOUR_SWORD_ID \
  --gas-budget 5000000
```

## What You've Accomplished

You have built a complete in-game economy featuring:

✅ **Closed-Loop Currency**: GEMS only usable within your game
✅ **Bundle Pricing**: Bulk discounts encourage larger purchases  
✅ **Item Shop**: Weapons, armor, and consumables
✅ **Economic Control**: Managed conversion rates and item pricing
✅ **Revenue System**: SUI earnings from gem purchases

## Key Game Design Features

**Bundle Economics**: 
- Small: 100 gems per SUI
- Medium: 120 gems per SUI (20% bonus)
- Large: 125 gems per SUI (25% bonus)

**Item Pricing**: 
- Sword: 50 gems (premium weapon)
- Shield: 30 gems (defensive item)  
- Potion: 10 gems (consumable)

**Closed Economy**: Gems cannot leave the game system, ensuring controlled inflation.

## Advanced Game Features

You can extend this system with:

**Player Progression**:
```move
public struct Player has key {
    id: UID,
    level: u64,
    experience: u64,
    inventory: vector<ID>,
}
```

**Item Crafting**:
```move
public fun craft_magic_sword(
    sword: Sword,
    gem_payment: Coin<GEMCOIN>
): MagicSword {
    // Combine items to create better equipment
}
```

**Marketplace**:
```move
public fun list_item_for_gems(
    item: Object,
    price: u64,
    ctx: &mut TxContext
) {
    // Allow players to trade items
}
```

## Revenue Model

The game earns SUI from gem purchases:
- Players buy gems with real crypto (SUI)
- Gems are spent on virtual items  
- Game developer keeps SUI earnings
- Items provide gameplay value

## Economic Balance

Monitor your game economy:
- Track gem inflation/deflation
- Adjust item prices based on demand
- Introduce gem sinks (item durability, repairs)
- Create gem sources (quest rewards, achievements)

This in-game currency system provides a foundation for building engaging blockchain-based games with controlled economies and real-world value exchange.