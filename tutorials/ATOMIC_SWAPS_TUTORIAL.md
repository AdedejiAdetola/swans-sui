# Atomic Swaps on Sui: A Complete Guide for Solana Developers

> **Target Audience**: Solana developers learning Sui blockchain development  
> **Prerequisites**: Basic understanding of Solana programs, accounts, and Move language fundamentals  
> **Estimated Time**: 3-4 hours to complete all sections

## Table of Contents

- [Section 1: Fundamentals & Mindset Shift](#section-1-fundamentals--mindset-shift)
- [Section 2: Basic Atomic Swap Implementation](#section-2-basic-atomic-swap-implementation) 
- [Section 3: Advanced Patterns](#section-3-advanced-patterns)
- [Section 4: Real-World Implementation](#section-4-real-world-implementation)
- [Section 5: Production Considerations](#section-5-production-considerations)

---

## Section 1: Fundamentals & Mindset Shift

### Part 1A: Core Concepts Comparison

Coming from Solana, your mental model needs to shift in several key ways:

#### **Solana vs Sui: The Big Picture**

| Concept | Solana | Sui |
|---------|--------|-----|
| **State Storage** | Accounts (owned by programs) | Objects (with built-in ownership) |
| **Execution Model** | Sequential transaction processing | Parallel execution via object ownership |
| **Data Structure** | Account data is a byte array | Structured objects with type safety |
| **Ownership** | Implicit via program ownership | Explicit ownership tracking |
| **Shared State** | All accounts can be accessed by programs | Shared objects vs owned objects distinction |

#### **Why This Matters for Atomic Swaps**

In Solana, you'd typically:
```rust
// Solana approach (conceptual)
pub fn atomic_swap(
    ctx: Context<AtomicSwap>,
    amount_a: u64,
    amount_b: u64,
) -> Result<()> {
    // Validate both parties have sufficient funds
    // Create escrow account
    // Transfer funds to escrow
    // Update escrow state
    // Transfer funds to recipients
}
```

In Sui, the approach is fundamentally different:
```move
// Sui approach - no central escrow needed!
public fun swap<T: key + store, U: key + store>(
    item1: Locked<T>,
    item2: Locked<U>, 
    key1: Key,
    key2: Key,
    recipient1: address,
    recipient2: address
) {
    // Verify keys can unlock items
    let unlocked1 = unlock(item1, key1);
    let unlocked2 = unlock(item2, key2);
    
    // Transfer items to new owners
    transfer::public_transfer(unlocked1, recipient2);
    transfer::public_transfer(unlocked2, recipient1);
}
```

### Part 1B: Object Model Deep Dive

#### **Solana Account Model**
```
┌─────────────────┐
│   Account A     │ ← Program owns this
│  (User's SPL)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Escrow Account  │ ← Program controls this
│  (Holds both)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Account B     │ ← Program owns this
│ (Other's SPL)   │
└─────────────────┘
```

#### **Sui Object Model**
```
┌─────────────────┐     ┌─────────────────┐
│  Locked<NFT>    │     │  Locked<Coin>   │
│ (Shared Object) │     │ (Shared Object) │
└─────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Key for NFT   │     │  Key for Coin   │
│ (Owned Object)  │     │ (Owned Object)  │
└─────────────────┘     └─────────────────┘
```

**Key Insight**: In Sui, the "escrow" is built into the object system itself. Locked objects can't be accessed without the corresponding key, eliminating the need for a trusted intermediary.

### Part 1C: Atomic Swap Theory

#### **What Makes a Swap "Atomic"**

An atomic swap has these properties:
1. **All-or-Nothing**: Either the entire swap completes or nothing happens
2. **No Trust Required**: Neither party can cheat the other
3. **Reversible**: Failed swaps return items to original owners
4. **Immediate**: No waiting periods or time locks (in basic version)

#### **Traditional Approaches vs Sui's Innovation**

**Traditional Escrow Pattern:**
```
Alice → Escrow ← Bob
   ↓      ↓      ↓
  Wait → Check → Execute
```

**Sui's Locked/Key Pattern:**
```
Alice: Lock(NFT) → Key_A
Bob:   Lock(Coin) → Key_B
         ↓
Atomic: swap(Lock(NFT), Lock(Coin), Key_A, Key_B)
         ↓
Alice gets Coin, Bob gets NFT
```

#### **Why Sui's Approach is Superior**

1. **No Escrow Contract**: Eliminates rug pull risks
2. **Parallel Execution**: Multiple swaps can happen simultaneously  
3. **Type Safety**: Move's type system prevents many classes of bugs
4. **Gas Efficiency**: Fewer transactions needed
5. **Composability**: Locked objects can be used in other protocols

---

*Ready to move to Section 2? We'll implement the basic Locked/Key mechanism from scratch, building your first atomic swap contract.*

**Next**: [Section 2: Basic Atomic Swap Implementation →](#section-2-basic-atomic-swap-implementation)

---

## Section 2: Basic Atomic Swap Implementation

*This section builds on the concepts from Section 1. If you haven't read that yet, please start there.*

### Part 2A: The Locked/Key Mechanism from Scratch

Let's build the atomic swap primitives step by step, explaining each concept as we go.

#### **Step 1: Understanding the Lock Structure**

In Solana, you might store swap data in a PDA (Program Derived Address). In Sui, we create a generic `Locked` object:

```move
module atomic_swap::locked {
    use sui::object::{Self, UID, ID};
    
    /// A locked object that can only be unlocked with the corresponding key
    public struct Locked<T: store> has key, store {
        id: UID,
        inner: T,
        key_id: ID,  // ID of the key that can unlock this
    }
    
    /// The key needed to unlock a Locked object
    public struct Key has key, store {
        id: UID,
        locked_id: ID,  // ID of the Locked object this key opens
    }
    
    /// Create a locked object and return both the lock and key
    public fun lock<T: store>(
        item: T,
        ctx: &mut TxContext
    ): (Locked<T>, Key) {
        let key = Key {
            id: object::new(ctx),
            locked_id: object::id_from_address(@0x0), // Temporary, will be updated
        };
        
        let key_id = object::uid_to_inner(&key.id);
        
        let locked = Locked {
            id: object::new(ctx),
            inner: item,
            key_id,
        };
        
        // Update the key with the actual locked object ID
        key.locked_id = object::uid_to_inner(&locked.id);
        
        (locked, key)
    }
    
    /// Unlock a Locked object using the corresponding key
    public fun unlock<T: store>(
        locked: Locked<T>,
        key: Key
    ): T {
        let Locked { id, inner, key_id } = locked;
        let Key { id: key_uid, locked_id } = key;
        
        // Verify the key matches the lock
        assert!(key_id == object::uid_to_inner(&key_uid), EKeyMismatch);
        assert!(locked_id == object::uid_to_inner(&id), ELockMismatch);
        
        // Clean up UIDs and return the inner object
        object::delete(id);
        object::delete(key_uid);
        inner
    }
    
    // Error constants
    const EKeyMismatch: u64 = 0;
    const ELockMismatch: u64 = 1;
}
```

#### **Step 2: Building the Swap Logic**

Now let's create the actual swap function:

```move
module atomic_swap::swap {
    use atomic_swap::locked::{Self, Locked, Key};
    use sui::transfer;
    
    /// Perform an atomic swap between two locked objects
    public fun swap<T: key + store, U: key + store>(
        locked1: Locked<T>,
        locked2: Locked<U>,
        key1: Key,
        key2: Key,
        recipient1: address,
        recipient2: address
    ) {
        // Unlock both objects
        let item1 = locked::unlock(locked1, key1);
        let item2 = locked::unlock(locked2, key2);
        
        // Cross-transfer the items
        transfer::public_transfer(item1, recipient2);  // Item 1 goes to person 2
        transfer::public_transfer(item2, recipient1);  // Item 2 goes to person 1
    }
}
```

#### **Key Differences from Solana**

| Solana Pattern | Sui Pattern |
|----------------|-------------|
| Create escrow PDA | Create Locked objects |
| Store both assets in escrow | Assets remain in locked state |
| Validate signatures | Validate key ownership |
| Transfer from escrow | Unlock and transfer directly |

### Part 2B: Complete Implementation

Let's put it all together in a comprehensive module:

```move
module atomic_swap::complete {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::event;
    
    // === Structs ===
    
    public struct Locked<T: store> has key, store {
        id: UID,
        inner: T,
        key_id: ID,
        creator: address,  // Who created this lock
    }
    
    public struct Key has key, store {
        id: UID,
        locked_id: ID,
    }
    
    // === Events ===
    
    public struct ObjectLocked has copy, drop {
        locked_id: ID,
        key_id: ID,
        creator: address,
    }
    
    public struct SwapCompleted has copy, drop {
        locked1_id: ID,
        locked2_id: ID,
        recipient1: address,
        recipient2: address,
    }
    
    // === Error Constants ===
    
    const EKeyMismatch: u64 = 0;
    const ELockMismatch: u64 = 1;
    const ENotAuthorized: u64 = 2;
    
    // === Public Functions ===
    
    /// Lock an object and create a key
    public fun lock<T: store>(
        item: T,
        ctx: &mut TxContext
    ): (Locked<T>, Key) {
        let creator = tx_context::sender(ctx);
        
        let key = Key {
            id: object::new(ctx),
            locked_id: object::id_from_address(@0x0), // Will update
        };
        
        let key_id = object::uid_to_inner(&key.id);
        
        let locked = Locked {
            id: object::new(ctx),
            inner: item,
            key_id,
            creator,
        };
        
        let locked_id = object::uid_to_inner(&locked.id);
        key.locked_id = locked_id;
        
        event::emit(ObjectLocked {
            locked_id,
            key_id,
            creator,
        });
        
        (locked, key)
    }
    
    /// Unlock an object (can only be done by key owner)
    public fun unlock<T: store>(
        locked: Locked<T>,
        key: Key,
        ctx: &TxContext
    ): T {
        let Locked { id, inner, key_id, creator: _ } = locked;
        let Key { id: key_uid, locked_id } = key;
        
        assert!(key_id == object::uid_to_inner(&key_uid), EKeyMismatch);
        assert!(locked_id == object::uid_to_inner(&id), ELockMismatch);
        
        object::delete(id);
        object::delete(key_uid);
        inner
    }
    
    /// Perform atomic swap
    public fun atomic_swap<T: key + store, U: key + store>(
        locked1: Locked<T>,
        locked2: Locked<U>,
        key1: Key,
        key2: Key,
        recipient1: address,
        recipient2: address,
        ctx: &TxContext
    ) {
        let locked1_id = object::uid_to_inner(&locked1.id);
        let locked2_id = object::uid_to_inner(&locked2.id);
        
        let item1 = unlock(locked1, key1, ctx);
        let item2 = unlock(locked2, key2, ctx);
        
        transfer::public_transfer(item1, recipient2);
        transfer::public_transfer(item2, recipient1);
        
        event::emit(SwapCompleted {
            locked1_id,
            locked2_id,
            recipient1,
            recipient2,
        });
    }
    
    // === View Functions ===
    
    /// Check if a key can unlock a specific locked object
    public fun can_unlock<T: store>(locked: &Locked<T>, key: &Key): bool {
        locked.key_id == object::uid_to_inner(&key.id) &&
        object::uid_to_inner(&locked.id) == key.locked_id
    }
    
    /// Get the creator of a locked object
    public fun get_creator<T: store>(locked: &Locked<T>): address {
        locked.creator
    }
}
```

### Part 2C: Testing and Validation

Let's create comprehensive tests to verify our implementation:

```move
#[test_only]
module atomic_swap::tests {
    use atomic_swap::complete::{Self, Locked, Key};
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    
    // Test helper struct
    public struct TestNFT has key, store {
        id: UID,
        name: String,
    }
    
    #[test]
    fun test_lock_unlock() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Create test NFT
        let nft = TestNFT {
            id: object::new(ctx),
            name: string::utf8(b"Test NFT"),
        };
        
        // Lock the NFT
        let (locked_nft, key) = complete::lock(nft, ctx);
        
        // Verify we can check the lock
        assert!(complete::can_unlock(&locked_nft, &key), 0);
        
        // Unlock the NFT
        let unlocked_nft = complete::unlock(locked_nft, key, ctx);
        
        // Clean up
        let TestNFT { id, name: _ } = unlocked_nft;
        object::delete(id);
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_atomic_swap() {
        let mut scenario = test_scenario::begin(@0xA);
        
        // === Setup Phase ===
        test_scenario::next_tx(&mut scenario, @0xA);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Alice creates an NFT and locks it
            let alice_nft = TestNFT {
                id: object::new(ctx),
                name: string::utf8(b"Alice's NFT"),
            };
            let (locked_nft, nft_key) = complete::lock(alice_nft, ctx);
            
            // Transfer locked NFT to shared state, key to Alice
            transfer::public_share_object(locked_nft);
            transfer::public_transfer(nft_key, @0xA);
        };
        
        // === Bob's Turn ===
        test_scenario::next_tx(&mut scenario, @0xB);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Bob creates a coin and locks it
            let bob_coin = coin::mint_for_testing<SUI>(1000, ctx);
            let (locked_coin, coin_key) = complete::lock(bob_coin, ctx);
            
            // Transfer locked coin to shared state, key to Bob
            transfer::public_share_object(locked_coin);
            transfer::public_transfer(coin_key, @0xB);
        };
        
        // === Swap Phase ===
        test_scenario::next_tx(&mut scenario, @0xC); // Third party can facilitate
        {
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Get all the objects
            let locked_nft = test_scenario::take_shared<Locked<TestNFT>>(&scenario);
            let locked_coin = test_scenario::take_shared<Locked<Coin<SUI>>>(&scenario);
            let nft_key = test_scenario::take_from_sender<Key>(&scenario);
            let coin_key = test_scenario::take_from_sender<Key>(&scenario);
            
            // Perform the swap
            complete::atomic_swap(
                locked_nft,
                locked_coin,
                nft_key,
                coin_key,
                @0xA, // Alice gets the coin
                @0xB, // Bob gets the NFT
                ctx
            );
        };
        
        // === Verification ===
        test_scenario::next_tx(&mut scenario, @0xA);
        {
            // Alice should now have the coin
            let coin = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == 1000, 0);
            test_scenario::return_to_sender(&scenario, coin);
        };
        
        test_scenario::next_tx(&mut scenario, @0xB);
        {
            // Bob should now have the NFT
            let nft = test_scenario::take_from_sender<TestNFT>(&scenario);
            assert!(nft.name == string::utf8(b"Alice's NFT"), 1);
            
            // Clean up
            let TestNFT { id, name: _ } = nft;
            object::delete(id);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    #[expected_failure(abort_code = complete::EKeyMismatch)]
    fun test_wrong_key_fails() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Create two NFTs and lock them
        let nft1 = TestNFT {
            id: object::new(ctx),
            name: string::utf8(b"NFT 1"),
        };
        let nft2 = TestNFT {
            id: object::new(ctx),
            name: string::utf8(b"NFT 2"),
        };
        
        let (locked1, key1) = complete::lock(nft1, ctx);
        let (locked2, key2) = complete::lock(nft2, ctx);
        
        // Try to unlock locked1 with key2 - should fail
        let _unlocked = complete::unlock(locked1, key2, ctx);
        
        // Clean up (won't reach here due to expected failure)
        let _unlocked2 = complete::unlock(locked2, key1, ctx);
        test_scenario::end(scenario);
    }
}
```

#### **Running the Tests**

```bash
# Build and test the module
sui move build
sui move test

# Test specific functions
sui move test --filter test_atomic_swap
```

---

*Excellent! You've now implemented a complete atomic swap system. In Section 3, we'll explore advanced patterns like multi-asset swaps, time locks, and conditional exchanges.*

**Next**: [Section 3: Advanced Patterns →](#section-3-advanced-patterns)

---

## Section 3: Advanced Patterns

*Building on our basic atomic swap implementation, let's explore more sophisticated patterns that leverage Sui's unique capabilities.*

### Part 3A: Multi-Asset Swaps

#### **Beyond 1:1 Swaps**

In Solana, complex swaps require intricate state management. Sui's object model makes multi-asset swaps surprisingly elegant:

```move
module atomic_swap::multi_asset {
    use atomic_swap::complete::{Locked, Key};
    use sui::transfer;
    use sui::event;
    use std::vector;
    
    /// Event for multi-asset swaps
    public struct MultiSwapCompleted has copy, drop {
        participant1: address,
        participant2: address,
        items_count1: u64,
        items_count2: u64,
    }
    
    /// Swap multiple locked items between two parties
    public fun multi_swap<T: key + store, U: key + store>(
        participant1_items: vector<Locked<T>>,
        participant1_keys: vector<Key>,
        participant2_items: vector<Locked<U>>,
        participant2_keys: vector<Key>,
        recipient1: address,
        recipient2: address,
        ctx: &TxContext
    ) {
        let items1_count = vector::length(&participant1_items);
        let items2_count = vector::length(&participant2_items);
        
        // Validate vectors have matching lengths
        assert!(items1_count == vector::length(&participant1_keys), ELengthMismatch);
        assert!(items2_count == vector::length(&participant2_keys), ELengthMismatch);
        
        // Unlock and transfer participant 1's items to participant 2
        let mut i = 0;
        while (i < items1_count) {
            let locked_item = vector::pop_back(&mut participant1_items);
            let key = vector::pop_back(&mut participant1_keys);
            let unlocked_item = complete::unlock(locked_item, key, ctx);
            transfer::public_transfer(unlocked_item, recipient2);
            i = i + 1;
        };
        
        // Unlock and transfer participant 2's items to participant 1
        i = 0;
        while (i < items2_count) {
            let locked_item = vector::pop_back(&mut participant2_items);
            let key = vector::pop_back(&mut participant2_keys);
            let unlocked_item = complete::unlock(locked_item, key, ctx);
            transfer::public_transfer(unlocked_item, recipient1);
            i = i + 1;
        };
        
        // Clean up empty vectors
        vector::destroy_empty(participant1_items);
        vector::destroy_empty(participant1_keys);
        vector::destroy_empty(participant2_items);
        vector::destroy_empty(participant2_keys);
        
        event::emit(MultiSwapCompleted {
            participant1: recipient1,
            participant2: recipient2,
            items_count1: items1_count,
            items_count2: items2_count,
        });
    }
    
    const ELengthMismatch: u64 = 0;
}
```

#### **Example: NFT Collection for Token Bundle**

```move
module atomic_swap::collection_swap {
    use atomic_swap::multi_asset;
    use sui::coin::Coin;
    use sui::sui::SUI;
    
    public struct GameNFT has key, store {
        id: UID,
        rarity: u8,
        power: u64,
    }
    
    /// Swap an entire NFT collection for a token bundle
    public fun swap_collection_for_tokens(
        nft_collection: vector<Locked<GameNFT>>,
        nft_keys: vector<Key>,
        token_bundle: vector<Locked<Coin<SUI>>>,
        token_keys: vector<Key>,
        nft_owner: address,
        token_owner: address,
        ctx: &TxContext
    ) {
        multi_asset::multi_swap(
            nft_collection,
            nft_keys,
            token_bundle, 
            token_keys,
            nft_owner,    // NFT owner gets tokens
            token_owner,  // Token owner gets NFTs
            ctx
        );
    }
}
```

### Part 3B: Conditional Swaps with Time Locks

#### **Time-Locked Swaps (HTLC Pattern)**

Hash Time Locked Contracts (HTLCs) are common in cross-chain swaps. Here's how to implement them in Sui:

```move
module atomic_swap::time_locked {
    use sui::clock::{Self, Clock};
    use sui::hash;
    use atomic_swap::complete::{Locked, Key};
    use sui::transfer;
    
    /// A time-locked swap that expires if not completed
    public struct TimeLocked<T: store> has key, store {
        id: UID,
        inner: Locked<T>,
        key: Key,
        hash_lock: vector<u8>,    // Hash of the secret
        expiry: u64,              // Timestamp when this expires
        beneficiary: address,     // Who can claim with the secret
        refund_recipient: address, // Who gets refund after expiry
    }
    
    /// Create a time-locked swap
    public fun create_time_locked<T: store>(
        item: T,
        secret_hash: vector<u8>,
        expiry_ms: u64,
        beneficiary: address,
        refund_recipient: address,
        clock: &Clock,
        ctx: &mut TxContext
    ): TimeLocked<T> {
        let current_time = clock::timestamp_ms(clock);
        assert!(expiry_ms > current_time, ETooEarly);
        
        let (locked_item, key) = complete::lock(item, ctx);
        
        TimeLocked {
            id: object::new(ctx),
            inner: locked_item,
            key,
            hash_lock: secret_hash,
            expiry: expiry_ms,
            beneficiary,
            refund_recipient,
        }
    }
    
    /// Claim the locked item with the secret (before expiry)
    public fun claim_with_secret<T: key + store>(
        time_locked: TimeLocked<T>,
        secret: vector<u8>,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let TimeLocked {
            id,
            inner: locked_item,
            key,
            hash_lock,
            expiry,
            beneficiary,
            refund_recipient: _,
        } = time_locked;
        
        // Check timing
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < expiry, ETooLate);
        
        // Verify secret
        let computed_hash = hash::keccak256(&secret);
        assert!(computed_hash == hash_lock, EWrongSecret);
        
        // Unlock and transfer to beneficiary
        let item = complete::unlock(locked_item, key, ctx);
        transfer::public_transfer(item, beneficiary);
        
        object::delete(id);
    }
    
    /// Refund after expiry (anyone can call this)
    public fun refund_after_expiry<T: key + store>(
        time_locked: TimeLocked<T>,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let TimeLocked {
            id,
            inner: locked_item,
            key,
            hash_lock: _,
            expiry,
            beneficiary: _,
            refund_recipient,
        } = time_locked;
        
        // Check expiry
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= expiry, ETooEarly);
        
        // Refund to original owner
        let item = complete::unlock(locked_item, key, ctx);
        transfer::public_transfer(item, refund_recipient);
        
        object::delete(id);
    }
    
    const ETooEarly: u64 = 0;
    const ETooLate: u64 = 1;
    const EWrongSecret: u64 = 2;
}
```

#### **Cross-Chain Atomic Swap Example**

```move
module atomic_swap::cross_chain {
    use atomic_swap::time_locked::{Self, TimeLocked};
    use sui::coin::Coin;
    use sui::sui::SUI;
    use sui::clock::Clock;
    
    /// Create a cross-chain swap setup
    /// Alice on Sui wants to swap with Bob on another chain
    public fun create_cross_chain_swap(
        sui_tokens: Coin<SUI>,
        secret_hash: vector<u8>, // Hash of secret Bob will reveal
        expiry_hours: u64,
        bob_address: address,
        alice_address: address,
        clock: &Clock,
        ctx: &mut TxContext
    ): TimeLocked<Coin<SUI>> {
        let current_time = clock::timestamp_ms(clock);
        let expiry = current_time + (expiry_hours * 60 * 60 * 1000); // Convert to ms
        
        time_locked::create_time_locked(
            sui_tokens,
            secret_hash,
            expiry,
            bob_address,     // Bob can claim with secret
            alice_address,   // Alice gets refund if expired
            clock,
            ctx
        )
    }
}
```

### Part 3C: Conditional Swaps and Oracles

#### **Oracle-Dependent Swaps**

Sometimes you want swaps that only execute under certain conditions:

```move
module atomic_swap::conditional {
    use sui::clock::Clock;
    use atomic_swap::complete::{Locked, Key};
    
    /// A swap that only executes if a condition is met
    public struct ConditionalSwap<T: store, U: store> has key {
        id: UID,
        locked1: Locked<T>,
        locked2: Locked<U>, 
        key1: Key,
        key2: Key,
        condition: SwapCondition,
        participant1: address,
        participant2: address,
        expiry: u64,
    }
    
    public struct SwapCondition has store {
        condition_type: u8,  // 0 = price condition, 1 = time condition, etc.
        threshold: u64,
        oracle_address: address,
    }
    
    /// Oracle price feed (simplified)
    public struct PriceFeed has key {
        id: UID,
        price: u64,
        last_updated: u64,
        oracle: address,
    }
    
    /// Create a price-conditional swap
    public fun create_price_conditional_swap<T: store, U: store>(
        item1: T,
        item2: T,
        price_threshold: u64,
        oracle_address: address,
        participant1: address,
        participant2: address,
        expiry_ms: u64,
        ctx: &mut TxContext
    ): ConditionalSwap<T, U> {
        let (locked1, key1) = complete::lock(item1, ctx);
        let (locked2, key2) = complete::lock(item2, ctx);
        
        ConditionalSwap {
            id: object::new(ctx),
            locked1,
            locked2,
            key1,
            key2,
            condition: SwapCondition {
                condition_type: 0, // Price condition
                threshold: price_threshold,
                oracle_address,
            },
            participant1,
            participant2,
            expiry: expiry_ms,
        }
    }
    
    /// Execute the swap if conditions are met
    public fun execute_conditional_swap<T: key + store, U: key + store>(
        conditional_swap: ConditionalSwap<T, U>,
        price_feed: &PriceFeed,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let ConditionalSwap {
            id,
            locked1,
            locked2,
            key1,
            key2,
            condition,
            participant1,
            participant2,
            expiry,
        } = conditional_swap;
        
        // Check expiry
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < expiry, EExpired);
        
        // Check condition
        match (condition.condition_type) {
            0 => {
                // Price condition
                assert!(price_feed.price >= condition.threshold, EConditionNotMet);
                assert!(price_feed.oracle == condition.oracle_address, EWrongOracle);
            },
            _ => abort EUnsupportedCondition,
        };
        
        // Execute the swap
        let item1 = complete::unlock(locked1, key1, ctx);
        let item2 = complete::unlock(locked2, key2, ctx);
        
        transfer::public_transfer(item1, participant2);
        transfer::public_transfer(item2, participant1);
        
        object::delete(id);
    }
    
    const EExpired: u64 = 0;
    const EConditionNotMet: u64 = 1;
    const EWrongOracle: u64 = 2;
    const EUnsupportedCondition: u64 = 3;
}
```

#### **Advanced Pattern: Auction-Based Swaps**

```move
module atomic_swap::auction {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::Clock;
    use std::vector;
    
    /// An auction where the highest bidder wins the right to swap
    public struct SwapAuction<T: store, U> has key {
        id: UID,
        item_for_sale: Locked<T>,
        item_key: Key,
        seller: address,
        highest_bid: Balance<U>,
        highest_bidder: Option<address>,
        end_time: u64,
        minimum_bid: u64,
    }
    
    /// Place a bid in the auction
    public fun place_bid<T: store, U>(
        auction: &mut SwapAuction<T, U>,
        bid: Coin<U>,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < auction.end_time, EAuctionEnded);
        
        let bid_amount = coin::value(&bid);
        let current_highest = balance::value(&auction.highest_bid);
        
        assert!(bid_amount > current_highest, EBidTooLow);
        assert!(bid_amount >= auction.minimum_bid, EBelowMinimum);
        
        // Return previous highest bid if exists
        if (option::is_some(&auction.highest_bidder)) {
            let prev_bidder = *option::borrow(&auction.highest_bidder);
            let prev_bid = balance::withdraw_all(&mut auction.highest_bid);
            let prev_coin = coin::from_balance(prev_bid, ctx);
            transfer::public_transfer(prev_coin, prev_bidder);
        };
        
        // Update with new highest bid
        coin::put(&mut auction.highest_bid, bid);
        option::fill(&mut auction.highest_bidder, tx_context::sender(ctx));
    }
    
    /// Finalize the auction and execute the swap
    public fun finalize_auction<T: key + store, U>(
        auction: SwapAuction<T, U>,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let SwapAuction {
            id,
            item_for_sale,
            item_key,
            seller,
            highest_bid,
            highest_bidder,
            end_time,
            minimum_bid: _,
        } = auction;
        
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= end_time, EAuctionNotEnded);
        
        if (option::is_some(&highest_bidder)) {
            let winner = option::extract(&mut highest_bidder);
            let winning_bid = balance::withdraw_all(&mut highest_bid);
            
            // Transfer item to winner
            let item = complete::unlock(item_for_sale, item_key, ctx);
            transfer::public_transfer(item, winner);
            
            // Transfer payment to seller
            let payment = coin::from_balance(winning_bid, ctx);
            transfer::public_transfer(payment, seller);
        } else {
            // No bids - return item to seller
            let item = complete::unlock(item_for_sale, item_key, ctx);
            transfer::public_transfer(item, seller);
        };
        
        // Clean up
        balance::destroy_zero(highest_bid);
        option::destroy_none(highest_bidder);
        object::delete(id);
    }
    
    const EAuctionEnded: u64 = 0;
    const EBidTooLow: u64 = 1;
    const EBelowMinimum: u64 = 2;
    const EAuctionNotEnded: u64 = 3;
}
```

---

*You've now mastered advanced atomic swap patterns! In Section 4, we'll integrate these concepts into a real-world application using the SWANS platform.*

**Next**: [Section 4: Real-World Implementation →](#section-4-real-world-implementation)

---

## Section 4: Real-World Implementation

*Now let's integrate atomic swaps into the SWANS content creator platform, showing how these patterns work in production systems.*

### Part 4A: Adding Atomic Swaps to SWANS Platform

#### **Understanding the SWANS Architecture**

SWANS is a content creator platform where:
- **Brands** create campaigns with budgets
- **Creators** apply to campaigns and submit content
- **Payments** are made automatically (base pay) and manually (bonus pay)

Let's add atomic swap functionality to enable:
1. Creator-to-creator asset trading
2. Campaign reward swapping
3. NFT marketplace integration

#### **Integration Architecture**

```move
module swans::atomic_swap_integration {
    use atomic_swap::complete::{Locked, Key};
    use swans::campaign::{Self, Campaign};
    use swans::creator::{Self, Creator};
    use swans::brand::{USDC};
    use sui::coin::Coin;
    use sui::transfer;
    use sui::event;
    
    /// A marketplace for creators to trade their rewards and NFTs
    public struct CreatorMarketplace has key {
        id: UID,
        active_listings: Table<ID, MarketplaceListing>,
        completed_swaps: u64,
        platform_fee_bps: u64, // Basis points (e.g., 250 = 2.5%)
    }
    
    /// A listing in the creator marketplace
    public struct MarketplaceListing has key, store {
        id: UID,
        seller: address,
        locked_item: ID,        // ID of the locked object
        asking_price: Option<u64>, // USDC price, None for barter only
        desired_category: Option<String>, // What they want in return
        expires_at: u64,
        listing_fee_paid: u64,
    }
    
    /// Event emitted when a swap happens through the marketplace
    public struct MarketplaceSwapCompleted has copy, drop {
        listing_id: ID,
        seller: address,
        buyer: address,
        item_sold: ID,
        payment_amount: Option<u64>,
    }
    
    // === Integration with SWANS Campaign System ===
    
    /// Lock a campaign reward for trading
    public fun lock_campaign_reward(
        campaign: &Campaign,
        creator: &Creator,
        reward_coin: Coin<USDC>,
        ctx: &mut TxContext
    ): (Locked<Coin<USDC>>, Key) {
        // Verify the creator is part of this campaign
        let creator_id = creator::get_creator_id(creator);
        assert!(campaign::has_applied(campaign, creator_id), ENotCampaignParticipant);
        
        // Lock the reward
        let (locked_reward, key) = complete::lock(reward_coin, ctx);
        
        event::emit(RewardLocked {
            campaign_id: campaign::get_campaign_id(campaign),
            creator_id,
            amount: coin::value(&reward_coin),
            locked_id: object::uid_to_inner(&locked_reward.id),
        });
        
        (locked_reward, key)
    }
    
    /// Create a listing in the marketplace
    public fun create_marketplace_listing<T: key + store>(
        marketplace: &mut CreatorMarketplace,
        locked_item: Locked<T>,
        key: Key,
        asking_price: Option<u64>,
        desired_category: Option<String>,
        duration_hours: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let seller = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        let expires_at = current_time + (duration_hours * 60 * 60 * 1000);
        
        // Calculate listing fee (e.g., 0.1% of asking price or flat fee)
        let listing_fee = if (option::is_some(&asking_price)) {
            let price = *option::borrow(&asking_price);
            (price * marketplace.platform_fee_bps) / 10000
        } else {
            1000000 // 1 USDC flat fee for barter listings
        };
        
        let listing = MarketplaceListing {
            id: object::new(ctx),
            seller,
            locked_item: object::uid_to_inner(&locked_item.id),
            asking_price,
            desired_category,
            expires_at,
            listing_fee_paid: listing_fee,
        };
        
        let listing_id = object::id(&listing);
        table::add(&mut marketplace.active_listings, listing_id, listing);
        
        // Store the locked item and key separately for security
        transfer::public_share_object(locked_item);
        transfer::transfer(key, seller);
    }
    
    const ENotCampaignParticipant: u64 = 0;
    const EListingExpired: u64 = 1;
    const EInvalidPayment: u64 = 2;
}
```

#### **Advanced Use Case: Campaign Reward Pools**

```move
module swans::reward_pools {
    use swans::campaign::{Self, Campaign};
    use atomic_swap::multi_asset;
    use sui::coin::{Self, Coin};
    use swans::brand::USDC;
    use std::vector;
    
    /// A pool where creators can combine their rewards for group purchases
    public struct CreatorRewardPool has key {
        id: UID,
        pool_name: String,
        participants: vector<address>,
        locked_contributions: vector<ID>, // IDs of locked coins
        contribution_keys: Table<address, Key>, // address -> key for their contribution
        target_amount: u64,
        current_amount: u64,
        expires_at: u64,
        pool_creator: address,
    }
    
    /// Add contribution to a reward pool
    public fun contribute_to_pool(
        pool: &mut CreatorRewardPool,
        contribution: Coin<USDC>,
        creator: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < pool.expires_at, EPoolExpired);
        
        let contribution_amount = coin::value(&contribution);
        
        // Lock the contribution
        let (locked_contribution, key) = complete::lock(contribution, ctx);
        let locked_id = object::uid_to_inner(&locked_contribution.id);
        
        // Update pool state
        vector::push_back(&mut pool.participants, creator);
        vector::push_back(&mut pool.locked_contributions, locked_id);
        table::add(&mut pool.contribution_keys, creator, key);
        pool.current_amount = pool.current_amount + contribution_amount;
        
        // Share the locked contribution
        transfer::public_share_object(locked_contribution);
        
        // If target reached, enable purchase
        if (pool.current_amount >= pool.target_amount) {
            event::emit(PoolTargetReached {
                pool_id: object::uid_to_inner(&pool.id),
                total_amount: pool.current_amount,
                participants: pool.participants,
            });
        };
    }
    
    /// Execute group purchase when target is reached
    public fun execute_group_purchase<T: key + store>(
        pool: CreatorRewardPool,
        locked_item: Locked<T>,
        item_key: Key,
        item_seller: address,
        distribution_plan: vector<address>, // Who gets the item (or shares)
        ctx: &TxContext
    ) {
        let CreatorRewardPool {
            id,
            pool_name: _,
            participants,
            locked_contributions,
            contribution_keys,
            target_amount,
            current_amount,
            expires_at: _,
            pool_creator: _,
        } = pool;
        
        assert!(current_amount >= target_amount, EInsufficientFunds);
        
        // Unlock all contributions
        let mut payment_coins = vector::empty<Coin<USDC>>();
        let mut i = 0;
        while (i < vector::length(&participants)) {
            let participant = *vector::borrow(&participants, i);
            let locked_id = *vector::borrow(&locked_contributions, i);
            let key = table::remove(&mut contribution_keys, participant);
            
            // Get the locked contribution (this is simplified - in reality you'd need a registry)
            let locked_contribution = /* get locked object by ID */;
            let contribution_coin = complete::unlock(locked_contribution, key, ctx);
            vector::push_back(&mut payment_coins, contribution_coin);
            i = i + 1;
        };
        
        // Combine all payments
        let total_payment = coin::zero<USDC>(ctx);
        while (!vector::is_empty(&payment_coins)) {
            let coin_to_merge = vector::pop_back(&mut payment_coins);
            coin::join(&mut total_payment, coin_to_merge);
        };
        
        // Unlock the item and pay seller
        let purchased_item = complete::unlock(locked_item, item_key, ctx);
        transfer::public_transfer(total_payment, item_seller);
        
        // Distribute the item (simplified - could be fractional NFTs, etc.)
        if (vector::length(&distribution_plan) == 1) {
            let recipient = *vector::borrow(&distribution_plan, 0);
            transfer::public_transfer(purchased_item, recipient);
        };
        
        // Clean up
        vector::destroy_empty(payment_coins);
        table::destroy_empty(contribution_keys);
        object::delete(id);
    }
    
    const EPoolExpired: u64 = 0;
    const EInsufficientFunds: u64 = 1;
}
```

### Part 4B: Creator-to-Creator Asset Trading

#### **NFT Trading System for Content Creators**

```move
module swans::creator_nft_trading {
    use atomic_swap::complete::{Locked, Key};
    use swans::creator::{Self, Creator};
    use sui::transfer;
    use std::string::String;
    
    /// NFT representing creator achievement or content
    public struct CreatorNFT has key, store {
        id: UID,
        creator_id: String,
        content_type: String, // "video", "image", "article"
        engagement_score: u64,
        campaign_id: String,
        mint_timestamp: u64,
        rarity: u8, // 1 = common, 2 = rare, 3 = legendary
    }
    
    /// Badge representing creator milestones
    public struct CreatorBadge has key, store {
        id: UID,
        badge_type: String, // "1K_followers", "viral_content", "brand_favorite"
        earned_timestamp: u64,
        campaign_context: Option<String>,
    }
    
    /// Direct creator-to-creator swap
    public fun creator_direct_swap<T: key + store, U: key + store>(
        creator1: &Creator,
        creator2: &Creator,
        locked_item1: Locked<T>,
        locked_item2: Locked<U>,
        key1: Key,
        key2: Key,
        ctx: &TxContext
    ) {
        let creator1_address = creator::get_creator_owner(creator1);
        let creator2_address = creator::get_creator_owner(creator2);
        
        // Verify ownership through creator objects
        assert!(creator1_address == tx_context::sender(ctx) || 
                creator2_address == tx_context::sender(ctx), EUnauthorizedSwap);
        
        // Execute the swap
        complete::atomic_swap(
            locked_item1,
            locked_item2,
            key1,
            key2,
            creator1_address,
            creator2_address,
            ctx
        );
        
        event::emit(CreatorSwapCompleted {
            creator1_id: creator::get_creator_id(creator1),
            creator2_id: creator::get_creator_id(creator2),
            timestamp: clock::timestamp_ms(clock),
        });
    }
    
    /// Create a special creator collaboration NFT from a swap
    public fun create_collaboration_nft(
        creator1_nft: CreatorNFT,
        creator2_nft: CreatorNFT,
        collaboration_name: String,
        ctx: &mut TxContext
    ): CreatorNFT {
        // Verify both NFTs are from different creators
        assert!(creator1_nft.creator_id != creator2_nft.creator_id, ESameCreator);
        
        // Calculate combined engagement score with bonus
        let combined_score = creator1_nft.engagement_score + creator2_nft.engagement_score;
        let collaboration_bonus = combined_score / 10; // 10% bonus for collaboration
        
        // Create new collaboration NFT
        let collab_nft = CreatorNFT {
            id: object::new(ctx),
            creator_id: collaboration_name, // Special ID for collaboration
            content_type: string::utf8(b"collaboration"),
            engagement_score: combined_score + collaboration_bonus,
            campaign_id: string::utf8(b"collaboration"),
            mint_timestamp: /* current timestamp */,
            rarity: std::u8::max(creator1_nft.rarity, creator2_nft.rarity) + 1, // Higher rarity
        };
        
        // Burn the original NFTs
        let CreatorNFT { id: id1, creator_id: _, content_type: _, engagement_score: _, 
                        campaign_id: _, mint_timestamp: _, rarity: _ } = creator1_nft;
        let CreatorNFT { id: id2, creator_id: _, content_type: _, engagement_score: _, 
                        campaign_id: _, mint_timestamp: _, rarity: _ } = creator2_nft;
        object::delete(id1);
        object::delete(id2);
        
        collab_nft
    }
    
    const EUnauthorizedSwap: u64 = 0;
    const ESameCreator: u64 = 1;
}
```

### Part 4C: Campaign Reward Swapping

#### **Advanced Campaign Integration**

```move
module swans::campaign_rewards {
    use swans::campaign::{Self, Campaign};
    use atomic_swap::time_locked::{Self, TimeLocked};
    use atomic_swap::conditional;
    use sui::coin::{Self, Coin};
    use swans::brand::USDC;
    
    /// Lock campaign rewards with performance conditions
    public fun create_performance_locked_reward(
        campaign: &Campaign,
        reward_amount: u64,
        min_engagement_threshold: u64,
        beneficiary: address,
        ctx: &mut TxContext
    ): ConditionalSwap<Coin<USDC>, /* placeholder */> {
        // Create reward coin from campaign escrow
        let reward_coin = campaign::make_campaign_payment(campaign, reward_amount, ctx);
        
        // Create performance condition
        let condition = SwapCondition {
            condition_type: 2, // Engagement condition
            threshold: min_engagement_threshold,
            oracle_address: @0x0, // Platform serves as oracle
        };
        
        // This would need full implementation of conditional swaps
        // integrated with SWANS engagement tracking
        conditional::create_engagement_conditional_swap(
            reward_coin,
            condition,
            beneficiary,
            campaign::get_brand_owner(campaign), // Refund to brand if not met
            /* expiry */,
            ctx
        )
    }
    
    /// Allow creators to pool their base payments for larger rewards
    public fun create_creator_reward_pool(
        participants: vector<Creator>,
        locked_base_payments: vector<Locked<Coin<USDC>>>,
        payment_keys: vector<Key>,
        pool_name: String,
        target_purchase: String, // Description of what they're buying
        ctx: &mut TxContext
    ): CreatorRewardPool {
        assert!(vector::length(&participants) == vector::length(&locked_base_payments), ELengthMismatch);
        assert!(vector::length(&participants) == vector::length(&payment_keys), ELengthMismatch);
        
        let mut total_amount = 0;
        let mut participant_addresses = vector::empty<address>();
        
        // Verify all participants and calculate total
        let mut i = 0;
        while (i < vector::length(&participants)) {
            let creator = vector::borrow(&participants, i);
            let locked_payment = vector::borrow(&locked_base_payments, i);
            let key = vector::borrow(&payment_keys, i);
            
            // Verify key can unlock payment
            assert!(complete::can_unlock(locked_payment, key), EInvalidKey);
            
            vector::push_back(&mut participant_addresses, creator::get_creator_owner(creator));
            i = i + 1;
        };
        
        CreatorRewardPool {
            id: object::new(ctx),
            pool_name,
            participants: participant_addresses,
            locked_contributions: /* convert to IDs */,
            contribution_keys: /* create table */,
            target_amount: total_amount,
            current_amount: total_amount,
            expires_at: /* set expiry */,
            pool_creator: tx_context::sender(ctx),
        }
    }
    
    const ELengthMismatch: u64 = 0;
    const EInvalidKey: u64 = 1;
}
```

#### **Integration with SWANS CLI**

Here's how the new atomic swap features integrate with existing SWANS workflows:

```bash
# Lock campaign rewards for trading
sui client call --package $PACKAGE_ID --module campaign_rewards \
  --function lock_campaign_reward \
  --args $CAMPAIGN_ID $CREATOR_ID $REWARD_COIN_ID \
  --gas-budget 20000000

# Create marketplace listing for locked reward
sui client call --package $PACKAGE_ID --module atomic_swap_integration \
  --function create_marketplace_listing \
  --args $MARKETPLACE_ID $LOCKED_REWARD_ID $KEY_ID "Some(5000000)" "None" 24 $CLOCK_ID \
  --gas-budget 15000000

# Execute creator-to-creator swap
sui client call --package $PACKAGE_ID --module creator_nft_trading \
  --function creator_direct_swap \
  --args $CREATOR1_ID $CREATOR2_ID $LOCKED_NFT1 $LOCKED_NFT2 $KEY1 $KEY2 \
  --gas-budget 25000000

# Contribute to creator reward pool
sui client call --package $PACKAGE_ID --module reward_pools \
  --function contribute_to_pool \
  --args $POOL_ID $CONTRIBUTION_COIN $CLOCK_ID \
  --gas-budget 18000000
```

---

*Section 4 complete! You now understand how atomic swaps integrate into real-world applications like SWANS. Let's move to the final section covering production considerations.*

**Next**: [Section 5: Production Considerations →](#section-5-production-considerations)

---

## Section 5: Production Considerations

*This final section covers everything you need to deploy atomic swaps in production: security patterns, gas optimization, and user experience.*

### Part 5A: Security Patterns and Gotchas

#### **Common Security Pitfalls (Coming from Solana)**

| Solana Risk | Sui Risk | Mitigation |
|-------------|----------|------------|
| Sysvar manipulation | Clock manipulation | Use trusted time oracles |
| Account ownership confusion | Object ownership bugs | Verify ownership in functions |
| PDA seed collision | Object ID collision | Use proper object creation |
| Missing signer checks | Missing capability checks | Implement capability patterns |

#### **Comprehensive Security Implementation**

```move
module atomic_swap::security {
    use atomic_swap::complete::{Locked, Key};
    use sui::clock::{Self, Clock};
    use sui::hash;
    
    /// Enhanced locked object with additional security features
    public struct SecureLocked<T: store> has key, store {
        id: UID,
        inner: Locked<T>,
        key_hash: vector<u8>,        // Hash of the key for verification
        creator: address,            // Who created this lock
        creation_time: u64,          // When it was created
        max_unlock_time: Option<u64>, // Optional expiry
        authorized_unlocker: Option<address>, // Optional specific unlocker
        nonce: u64,                  // Replay protection
    }
    
    /// Secure key with additional metadata
    public struct SecureKey has key, store {
        id: UID,
        locked_id: ID,
        secret_hash: vector<u8>,     // Hash of a secret for additional security
        valid_until: Option<u64>,    // Key expiry
        usage_count: u64,            // How many times this key has been used
        max_uses: u64,               // Maximum allowed uses
    }
    
    /// Create a secure lock with enhanced security features
    public fun secure_lock<T: store>(
        item: T,
        secret: vector<u8>,          // Additional secret for security
        max_unlock_time: Option<u64>,
        authorized_unlocker: Option<address>,
        max_key_uses: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): (SecureLocked<T>, SecureKey) {
        let (locked_item, basic_key) = complete::lock(item, ctx);
        let current_time = clock::timestamp_ms(clock);
        
        // Create secure key with metadata
        let secure_key = SecureKey {
            id: object::new(ctx),
            locked_id: object::uid_to_inner(&locked_item.id),
            secret_hash: hash::keccak256(&secret),
            valid_until: max_unlock_time,
            usage_count: 0,
            max_uses: max_key_uses,
        };
        
        let key_hash = hash::keccak256(/* serialize key data */);
        
        let secure_locked = SecureLocked {
            id: object::new(ctx),
            inner: locked_item,
            key_hash,
            creator: tx_context::sender(ctx),
            creation_time: current_time,
            max_unlock_time,
            authorized_unlocker,
            nonce: /* generate random nonce */,
        };
        
        (secure_locked, secure_key)
    }
    
    /// Secure unlock with comprehensive checks
    public fun secure_unlock<T: store>(
        secure_locked: SecureLocked<T>,
        secure_key: &mut SecureKey,
        secret: vector<u8>,
        clock: &Clock,
        ctx: &TxContext
    ): T {
        let SecureLocked {
            id,
            inner: locked_item,
            key_hash,
            creator: _,
            creation_time: _,
            max_unlock_time,
            authorized_unlocker,
            nonce: _,
        } = secure_locked;
        
        let current_time = clock::timestamp_ms(clock);
        let sender = tx_context::sender(ctx);
        
        // Time-based checks
        if (option::is_some(&max_unlock_time)) {
            let expiry = *option::borrow(&max_unlock_time);
            assert!(current_time < expiry, ELockExpired);
        };
        
        // Authorization checks
        if (option::is_some(&authorized_unlocker)) {
            let authorized = *option::borrow(&authorized_unlocker);
            assert!(sender == authorized, ENotAuthorized);
        };
        
        // Key validity checks
        if (option::is_some(&secure_key.valid_until)) {
            let key_expiry = *option::borrow(&secure_key.valid_until);
            assert!(current_time < key_expiry, EKeyExpired);
        };
        
        assert!(secure_key.usage_count < secure_key.max_uses, EKeyExhausted);
        
        // Secret verification
        let provided_secret_hash = hash::keccak256(&secret);
        assert!(provided_secret_hash == secure_key.secret_hash, EWrongSecret);
        
        // Key hash verification
        let computed_key_hash = hash::keccak256(/* serialize key data */);
        assert!(computed_key_hash == key_hash, EKeyMismatch);
        
        // Update key usage
        secure_key.usage_count = secure_key.usage_count + 1;
        
        // Extract the basic key and unlock
        let basic_key = /* extract from secure_key */;
        let unlocked_item = complete::unlock(locked_item, basic_key, ctx);
        
        object::delete(id);
        unlocked_item
    }
    
    // Error constants
    const ELockExpired: u64 = 0;
    const ENotAuthorized: u64 = 1;
    const EKeyExpired: u64 = 2;
    const EKeyExhausted: u64 = 3;
    const EWrongSecret: u64 = 4;
    const EKeyMismatch: u64 = 5;
}
```

#### **Reentrancy Protection**

```move
module atomic_swap::reentrancy_guard {
    use sui::tx_context;
    
    /// Global reentrancy guard
    public struct ReentrancyGuard has key {
        id: UID,
        active_transactions: Table<address, bool>,
    }
    
    /// Temporary lock acquired during sensitive operations
    public struct TransactionLock has drop {
        user: address,
    }
    
    /// Acquire a transaction lock to prevent reentrancy
    public fun acquire_lock(
        guard: &mut ReentrancyGuard,
        ctx: &TxContext
    ): TransactionLock {
        let user = tx_context::sender(ctx);
        assert!(!table::contains(&guard.active_transactions, user), EReentrantCall);
        
        table::add(&mut guard.active_transactions, user, true);
        
        TransactionLock { user }
    }
    
    /// Release transaction lock (automatic via drop)
    public fun release_lock(
        guard: &mut ReentrancyGuard,
        lock: TransactionLock
    ) {
        let TransactionLock { user } = lock;
        table::remove(&mut guard.active_transactions, user);
    }
    
    const EReentrantCall: u64 = 0;
}
```

### Part 5B: Gas Optimization Techniques

#### **Batch Operations for Efficiency**

```move
module atomic_swap::gas_optimized {
    use atomic_swap::complete::{Locked, Key};
    use std::vector;
    
    /// Batch multiple swaps in a single transaction
    public fun batch_atomic_swaps<T: key + store, U: key + store>(
        locked_items1: vector<Locked<T>>,
        locked_items2: vector<Locked<U>>,
        keys1: vector<Key>,
        keys2: vector<Key>,
        recipients1: vector<address>,
        recipients2: vector<address>,
        ctx: &TxContext
    ) {
        let len = vector::length(&locked_items1);
        assert!(len == vector::length(&locked_items2), ELengthMismatch);
        assert!(len == vector::length(&keys1), ELengthMismatch);
        assert!(len == vector::length(&keys2), ELengthMismatch);
        assert!(len == vector::length(&recipients1), ELengthMismatch);
        assert!(len == vector::length(&recipients2), ELengthMismatch);
        
        let mut i = 0;
        while (i < len) {
            let locked1 = vector::pop_back(&mut locked_items1);
            let locked2 = vector::pop_back(&mut locked_items2);
            let key1 = vector::pop_back(&mut keys1);
            let key2 = vector::pop_back(&mut keys2);
            let recipient1 = vector::pop_back(&mut recipients1);
            let recipient2 = vector::pop_back(&mut recipients2);
            
            complete::atomic_swap(
                locked1, locked2, key1, key2,
                recipient1, recipient2, ctx
            );
            
            i = i + 1;
        };
        
        // Clean up empty vectors
        vector::destroy_empty(locked_items1);
        vector::destroy_empty(locked_items2);
        vector::destroy_empty(keys1);
        vector::destroy_empty(keys2);
        vector::destroy_empty(recipients1);
        vector::destroy_empty(recipients2);
    }
    
    /// Optimized data structure for frequently accessed swaps
    public struct SwapCache has store {
        recent_swaps: Table<ID, SwapMetadata>,
        cache_size: u64,
        max_cache_size: u64,
    }
    
    public struct SwapMetadata has store {
        participants: vector<address>,
        timestamp: u64,
        gas_used: u64,
    }
    
    /// Cache swap metadata to reduce computation in future transactions
    public fun cache_swap_metadata(
        cache: &mut SwapCache,
        swap_id: ID,
        participants: vector<address>,
        timestamp: u64,
        gas_used: u64
    ) {
        // Remove oldest entry if cache is full
        if (cache.cache_size >= cache.max_cache_size) {
            // Simple FIFO eviction (in production, use LRU)
            let oldest_key = /* get oldest key */;
            table::remove(&mut cache.recent_swaps, oldest_key);
            cache.cache_size = cache.cache_size - 1;
        };
        
        let metadata = SwapMetadata {
            participants,
            timestamp,
            gas_used,
        };
        
        table::add(&mut cache.recent_swaps, swap_id, metadata);
        cache.cache_size = cache.cache_size + 1;
    }
    
    const ELengthMismatch: u64 = 0;
}
```

#### **Storage Optimization**

```move
module atomic_swap::storage_optimized {
    /// Compact representation of locked objects using bitfields
    public struct CompactLocked has key, store {
        id: UID,
        // Pack multiple values into single fields
        metadata: u128, // packed: creation_time(64) + creator_type(8) + flags(8) + reserved(48)
        item_hash: vector<u8>, // Hash instead of storing full item
        unlock_conditions: u64, // Bitfield for various conditions
    }
    
    /// Efficient key representation
    public struct CompactKey has key, store {
        id: UID,
        locked_ref: ID,
        unlock_data: u128, // Packed unlock information
    }
    
    /// Pack multiple values into a single u128
    public fun pack_metadata(
        creation_time: u64,
        creator_type: u8,
        flags: u8
    ): u128 {
        let packed = (creation_time as u128);
        packed = packed | ((creator_type as u128) << 64);
        packed = packed | ((flags as u128) << 72);
        packed
    }
    
    /// Unpack values from u128
    public fun unpack_metadata(metadata: u128): (u64, u8, u8) {
        let creation_time = ((metadata & 0xFFFFFFFFFFFFFFFF) as u64);
        let creator_type = (((metadata >> 64) & 0xFF) as u8);
        let flags = (((metadata >> 72) & 0xFF) as u8);
        (creation_time, creator_type, flags)
    }
}
```

### Part 5C: UI/UX Integration Patterns

#### **Frontend Integration Patterns**

```typescript
// TypeScript SDK integration example
import { TransactionBlock } from '@mysten/sui.js';
import { SuiClient } from '@mysten/sui.js/client';

interface AtomicSwapSDK {
  // Lock an item for swapping
  lockItem<T>(
    item: T,
    itemType: string
  ): Promise<{ lockedObject: string; key: string }>;
  
  // Execute atomic swap
  executeSwap(
    swap: {
      locked1: string;
      locked2: string;
      key1: string;
      key2: string;
      recipient1: string;
      recipient2: string;
    }
  ): Promise<string>; // transaction hash
  
  // Check if swap can be executed
  canExecuteSwap(
    locked1: string,
    locked2: string,
    key1: string,
    key2: string
  ): Promise<boolean>;
}

class SuiAtomicSwapSDK implements AtomicSwapSDK {
  constructor(
    private client: SuiClient,
    private packageId: string
  ) {}
  
  async lockItem<T>(item: T, itemType: string) {
    const tx = new TransactionBlock();
    
    const [lockedObject, key] = tx.moveCall({
      target: `${this.packageId}::complete::lock`,
      arguments: [
        tx.object(item as string),
      ],
      typeArguments: [itemType],
    });
    
    // Return the locked object and key to the caller
    tx.transferObjects([key], tx.pure(await this.getActiveAddress()));
    tx.transferObjects([lockedObject], tx.pure('0x0')); // Share object
    
    const result = await this.client.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: this.getSigner(),
    });
    
    return {
      lockedObject: result.objectChanges?.find(c => 
        c.type === 'created' && c.objectType.includes('Locked')
      )?.objectId || '',
      key: result.objectChanges?.find(c => 
        c.type === 'created' && c.objectType.includes('Key')
      )?.objectId || '',
    };
  }
  
  async executeSwap(swap: SwapParams) {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${this.packageId}::complete::atomic_swap`,
      arguments: [
        tx.object(swap.locked1),
        tx.object(swap.locked2),
        tx.object(swap.key1),
        tx.object(swap.key2),
        tx.pure(swap.recipient1),
        tx.pure(swap.recipient2),
      ],
      typeArguments: [swap.type1, swap.type2],
    });
    
    const result = await this.client.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: this.getSigner(),
    });
    
    return result.digest;
  }
}
```

#### **React Component Example**

```typescript
// React component for atomic swap UI
import React, { useState, useEffect } from 'react';
import { useWallet } from '@mysten/wallet-kit';

interface SwapComponentProps {
  sdk: AtomicSwapSDK;
}

export const AtomicSwapComponent: React.FC<SwapComponentProps> = ({ sdk }) => {
  const [userItems, setUserItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [counterpartyOffer, setCounterpartyOffer] = useState(null);
  const [swapStatus, setSwapStatus] = useState('idle');
  
  const { currentAccount } = useWallet();
  
  // Lock user's selected item
  const handleLockItem = async () => {
    if (!selectedItem) return;
    
    setSwapStatus('locking');
    try {
      const { lockedObject, key } = await sdk.lockItem(
        selectedItem.id,
        selectedItem.type
      );
      
      setSelectedItem(prev => ({
        ...prev,
        locked: lockedObject,
        key: key,
        isLocked: true
      }));
      
      setSwapStatus('locked');
    } catch (error) {
      console.error('Failed to lock item:', error);
      setSwapStatus('error');
    }
  };
  
  // Execute the swap
  const handleExecuteSwap = async () => {
    if (!selectedItem?.isLocked || !counterpartyOffer?.isLocked) return;
    
    setSwapStatus('swapping');
    try {
      const txHash = await sdk.executeSwap({
        locked1: selectedItem.locked,
        locked2: counterpartyOffer.locked,
        key1: selectedItem.key,
        key2: counterpartyOffer.key,
        recipient1: currentAccount?.address || '',
        recipient2: counterpartyOffer.owner,
        type1: selectedItem.type,
        type2: counterpartyOffer.type,
      });
      
      setSwapStatus('completed');
      console.log('Swap completed:', txHash);
    } catch (error) {
      console.error('Swap failed:', error);
      setSwapStatus('error');
    }
  };
  
  return (
    <div className="atomic-swap-container">
      <h2>Atomic Swap</h2>
      
      <div className="swap-sides">
        {/* Your items */}
        <div className="your-items">
          <h3>Your Items</h3>
          {userItems.map(item => (
            <div 
              key={item.id}
              className={`item ${selectedItem?.id === item.id ? 'selected' : ''}`}
              onClick={() => setSelectedItem(item)}
            >
              <img src={item.image} alt={item.name} />
              <span>{item.name}</span>
              {selectedItem?.id === item.id && selectedItem.isLocked && (
                <span className="locked-badge">🔒 Locked</span>
              )}
            </div>
          ))}
          
          {selectedItem && !selectedItem.isLocked && (
            <button onClick={handleLockItem} disabled={swapStatus === 'locking'}>
              {swapStatus === 'locking' ? 'Locking...' : 'Lock Item'}
            </button>
          )}
        </div>
        
        {/* Counterparty items */}
        <div className="counterparty-items">
          <h3>Available for Swap</h3>
          {/* List available locked items from other users */}
        </div>
      </div>
      
      {selectedItem?.isLocked && counterpartyOffer?.isLocked && (
        <div className="swap-action">
          <button 
            onClick={handleExecuteSwap} 
            disabled={swapStatus === 'swapping'}
            className="execute-swap-btn"
          >
            {swapStatus === 'swapping' ? 'Executing Swap...' : 'Execute Swap'}
          </button>
        </div>
      )}
      
      <div className="status">
        Status: {swapStatus}
      </div>
    </div>
  );
};
```

#### **Error Handling and User Feedback**

```move
module atomic_swap::user_feedback {
    /// Enhanced error reporting for better UX
    public struct SwapError has copy, drop {
        error_code: u64,
        error_message: String,
        suggested_action: String,
        retry_possible: bool,
    }
    
    /// Create user-friendly error messages
    public fun create_swap_error(code: u64): SwapError {
        let (message, action, retryable) = match (code) {
            0 => (string::utf8(b"Keys don't match the locked items"), 
                  string::utf8(b"Verify you have the correct keys"), false),
            1 => (string::utf8(b"Transaction expired"), 
                  string::utf8(b"Create a new swap transaction"), true),
            2 => (string::utf8(b"Insufficient gas"), 
                  string::utf8(b"Increase gas budget and retry"), true),
            3 => (string::utf8(b"Network congestion"), 
                  string::utf8(b"Wait a few minutes and retry"), true),
            _ => (string::utf8(b"Unknown error"), 
                  string::utf8(b"Contact support"), false),
        };
        
        SwapError {
            error_code: code,
            error_message: message,
            suggested_action: action,
            retry_possible: retryable,
        }
    }
    
    /// Progress tracking for multi-step swaps
    public struct SwapProgress has copy, drop {
        step: u8,        // Current step (1-5)
        total_steps: u8, // Total steps
        description: String,
        timestamp: u64,
    }
    
    public fun emit_progress(step: u8, description: String, clock: &Clock) {
        event::emit(SwapProgress {
            step,
            total_steps: 5,
            description,
            timestamp: clock::timestamp_ms(clock),
        });
    }
}
```

#### **Production Deployment Checklist**

```bash
# 1. Security Audit
sui move build --lint
sui move test --coverage

# 2. Gas Optimization Verification  
sui client dry-run --gas-budget 1000000 # Test with minimal gas

# 3. Network Deployment
sui client publish --gas-budget 100000000 --skip-fetch-latest-git-deps

# 4. Integration Testing
./scripts/test_atomic_swaps.sh

# 5. Monitoring Setup
# Set up event monitoring for SwapCompleted events
# Monitor gas usage patterns
# Track failed transaction rates

# 6. Documentation
# API documentation
# User guides  
# Security best practices
```

#### **Monitoring and Analytics**

```move
module atomic_swap::analytics {
    /// Analytics data for swap monitoring
    public struct SwapAnalytics has key {
        id: UID,
        total_swaps: u64,
        total_volume: u64,
        success_rate: u64, // Basis points
        average_gas_used: u64,
        daily_stats: Table<u64, DailyStats>, // day -> stats
    }
    
    public struct DailyStats has store {
        date: u64,
        swaps_count: u64,
        volume: u64,
        failures: u64,
        unique_users: u64,
    }
    
    /// Record swap completion for analytics
    public fun record_swap_completion(
        analytics: &mut SwapAnalytics,
        volume: u64,
        gas_used: u64,
        clock: &Clock
    ) {
        analytics.total_swaps = analytics.total_swaps + 1;
        analytics.total_volume = analytics.total_volume + volume;
        
        // Update running average of gas used
        analytics.average_gas_used = 
            (analytics.average_gas_used + gas_used) / 2;
        
        // Update daily stats
        let today = clock::timestamp_ms(clock) / (24 * 60 * 60 * 1000);
        
        if (!table::contains(&analytics.daily_stats, today)) {
            table::add(&mut analytics.daily_stats, today, DailyStats {
                date: today,
                swaps_count: 0,
                volume: 0,
                failures: 0,
                unique_users: 0,
            });
        };
        
        let daily_stats = table::borrow_mut(&mut analytics.daily_stats, today);
        daily_stats.swaps_count = daily_stats.swaps_count + 1;
        daily_stats.volume = daily_stats.volume + volume;
    }
}
```

---

## Conclusion

You've now mastered atomic swaps on Sui from a Solana developer's perspective! This comprehensive guide covered:

✅ **Fundamental differences** between Solana and Sui approaches  
✅ **Complete implementation** of the Locked/Key mechanism  
✅ **Advanced patterns** like time locks, conditional swaps, and auctions  
✅ **Real-world integration** with the SWANS platform  
✅ **Production considerations** for security, gas optimization, and UX  

### Key Takeaways

1. **Sui's object model eliminates escrow risks** - no trusted third parties needed
2. **Parallel execution** enables better performance than Solana's sequential model
3. **Type safety** prevents entire categories of bugs common in other blockchains
4. **Composability** allows atomic swaps to integrate seamlessly with existing dApps

### Next Steps

- Deploy your atomic swap contracts to Sui testnet
- Integrate with existing SWANS workflows
- Experiment with advanced patterns like oracles and time locks
- Build user interfaces using the provided React examples

The atomic swap pattern is foundational for DeFi, NFT marketplaces, and any application requiring trustless exchanges. With Sui's unique architecture, you can build more secure and efficient trading systems than ever before.

**Happy building on Sui! 🚀**
