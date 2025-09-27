# Sui Fundamentals for Solana Developers

Welcome to Sui! As a Solana developer, you already understand blockchain fundamentals, smart contracts, and DeFi concepts. This guide will help you understand Sui's unique approach and how it differs from Solana's architecture.

## Core Philosophy: Objects vs Accounts

The fundamental difference between Sui and Solana is how they handle state and ownership.

### Solana: Program-Owned Accounts
```rust
// Solana - Everything is an account owned by a program
pub struct TokenAccount {
    pub owner: Pubkey,        // User who controls tokens
    pub mint: Pubkey,         // Which token type  
    pub amount: u64,          // Token balance
}

// Programs process accounts, but don't "own" the data
pub fn transfer(
    from_account: &mut Account,
    to_account: &mut Account, 
    amount: u64
) -> Result<()> {
    // Program logic validates and modifies account data
}
```

### Sui: Object-Owned Resources
```move
// Sui - Everything is an object with explicit ownership
public struct Coin<phantom T> has key, store {
    id: UID,              // Unique object identifier
    balance: Balance<T>,   // Token balance
    // No explicit owner field - ownership is tracked by Sui runtime
}

public fun transfer<T>(
    coin: Coin<T>,        // Object moves to function
    recipient: address    // Who receives it
) {
    transfer::public_transfer(coin, recipient); // Sui handles ownership transfer
}
```

**Key Difference**: In Solana, programs process account data. In Sui, objects are owned directly by addresses or other objects.

## Ownership Models Compared

### Solana Ownership Hierarchy
```
User Wallet
  └─ Controls multiple accounts
      ├─ SOL account (owned by System Program)
      ├─ Token accounts (owned by Token Program)
      └─ NFT accounts (owned by Token Program)
```

### Sui Ownership Hierarchy  
```
User Address
  └─ Owns objects directly
      ├─ Coin objects (type-safe tokens)
      ├─ NFT objects (unique digital assets)
      └─ Custom objects (app-specific data)
```

**Solana**: User controls accounts indirectly through programs  
**Sui**: User owns objects directly - cleaner ownership model

## Programming Language: Rust vs Move

### Solana: Rust + Anchor
```rust
use anchor_lang::prelude::*;

#[program]
pub mod my_program {
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let account = &mut ctx.accounts.my_account;
        account.data = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub my_account: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### Sui: Move Language
```move
module my_package::my_module {
    public struct MyObject has key, store {
        id: UID,
        data: u64,
    }

    public fun initialize(ctx: &mut TxContext): MyObject {
        MyObject {
            id: object::new(ctx),
            data: 0,
        }
    }
}
```

**Key Differences**:
- **Move** is designed for digital assets with built-in resource safety
- **No null/undefined** - Move prevents common bugs at compile time
- **Linear types** - objects can't be duplicated or lost accidentally
- **Simpler syntax** - fewer lifetime annotations and borrowing rules

## Gas Models: Rent vs Gas

### Solana: Account Rent Model
```rust
// Solana accounts require rent to stay on-chain
let rent = Rent::get()?;
let min_balance = rent.minimum_balance(space);

// Need to maintain minimum SOL balance or account gets deleted
if account.lamports < min_balance {
    // Account will be deleted by runtime
}
```

### Sui: Simple Gas Model
```move
// Sui uses straightforward gas fees
public entry fun my_function(ctx: &mut TxContext) {
    // Gas charged per operation
    // No ongoing rent requirements
    // Objects persist indefinitely once created
}
```

**Solana**: Pay rent to keep accounts alive  
**Sui**: Pay gas once, objects live forever

## Transaction Structure

### Solana Transaction
```rust
// Solana - specify all accounts upfront
let instruction = Instruction {
    program_id: my_program::ID,
    accounts: vec![
        AccountMeta::new(account1, false),
        AccountMeta::new(account2, true),
        AccountMeta::new_readonly(account3, false),
    ],
    data: instruction_data,
};
```

### Sui Programmable Transaction Block (PTB)
```bash
# Sui - compose multiple operations in one transaction
sui client ptb \
  --move-call $PKG::module::function @arg1 @arg2 \
  --move-call $PKG::module::another_function @result \
  --transfer-objects [@result2] @recipient
```

**Solana**: Static account list, single program call  
**Sui**: Dynamic object usage, multiple operations per transaction

## Development Workflow

### Solana Development Flow
```bash
# 1. Write Rust program with Anchor
anchor init my-project
cd my-project

# 2. Build program
anchor build

# 3. Deploy to cluster
anchor deploy --provider.cluster devnet

# 4. Create accounts and call instructions
anchor test
```

### Sui Development Flow
```bash
# 1. Write Move package
sui move new my-package
cd my-package

# 2. Build package
sui move build

# 3. Deploy to network  
sui client publish --gas-budget 100000000

# 4. Call functions with objects
sui client call --package $ID --module mod --function func
```

**Similar workflow, but Sui's is simpler** - no account initialization complexity

## Resource Safety: Move's Killer Feature

### Solana: Manual Resource Management
```rust
// Easy to make mistakes with token transfers
pub fn transfer_tokens(
    from: &mut TokenAccount,
    to: &mut TokenAccount,
    amount: u64,
) -> Result<()> {
    // Bug: what if from.amount < amount?
    from.amount -= amount;  // Could underflow!
    to.amount += amount;    // Could overflow!
    Ok(())
}
```

### Sui: Built-in Resource Safety
```move
// Move prevents resource bugs at compile time
public fun transfer_balance<T>(
    from: &mut Balance<T>,
    amount: u64,
    ctx: &mut TxContext
): Balance<T> {
    balance::split(from, amount) // Fails if insufficient funds
    // Cannot create or destroy value accidentally
}
```

**Move's resource safety prevents**:
- Double-spending
- Token duplication  
- Lost assets
- Arithmetic overflows

## Object Types and Capabilities

### Sui's Object Abilities
```move
// Objects have explicit capabilities
public struct MyToken has key, store {     // Can be owned, stored
    id: UID,
}

public struct AdminCap has key {           // Can be owned, NOT stored
    id: UID,
}

public struct Witness has drop {}          // Can be dropped/destroyed
```

**Abilities define what can be done with objects**:
- `key`: Can be owned by addresses
- `store`: Can be stored inside other objects  
- `copy`: Can be copied (rare for assets)
- `drop`: Can be destroyed

### Solana Equivalent Concepts
```rust
// Solana uses ownership and programs for access control
#[account]
pub struct AdminAccount {
    pub authority: Pubkey,  // Who can use this
}

// Access control through account validation
if ctx.accounts.admin.authority != ctx.accounts.signer.key() {
    return Err(ErrorCode::Unauthorized);
}
```

## Data Storage Patterns

### Solana: Account-Based Storage
```rust
// Store data in accounts
#[account]
pub struct GameState {
    pub players: Vec<Pubkey>,    // Limited by account size
    pub scores: Vec<u64>,        // Max ~10KB per account
}

// Need complex account management for large datasets
```

### Sui: Object-Based Storage
```move
// Store data in objects - unlimited size
public struct GameState has key {
    id: UID,
    players: vector<address>,    // Can grow dynamically
    scores: Table<address, u64>, // Unlimited key-value storage
}

// Objects can reference other objects
public struct PlayerProfile has key, store {
    id: UID,
    game_state_id: ID,  // Reference to game state
    stats: PlayerStats,
}
```

**Sui advantages**:
- No 10KB account size limit
- Dynamic data structures
- Object composition patterns

## Consensus and Finality

### Solana: Proof of History + Proof of Stake
- ~400ms slot times
- Probabilistic finality
- Need to wait for confirmations
- Can have forks/rollbacks

### Sui: Narwhal + Bullshark Consensus  
- Instant finality for simple transactions
- No rollbacks once confirmed
- Parallel execution for independent objects
- ~2.5 second finality for complex transactions

**Sui provides stronger finality guarantees**

## Common Gotchas for Solana Devs

### 1. No Account Initialization
```move
// Wrong: No need to "initialize" accounts
public fun wrong_approach(ctx: &mut TxContext) {
    // This creates the object AND makes it owned by sender
    let obj = MyObject { id: object::new(ctx) };
    transfer::transfer(obj, tx_context::sender(ctx));
}
```

### 2. Objects Move, Don't Copy
```move
public fun transfer_coin(coin: Coin<SUI>) {
    // coin is moved here - cannot use it again
    transfer::public_transfer(coin, @0x123);
    
    // Error: coin was moved above!
    // let amount = coin::value(&coin);
}
```

### 3. No Explicit Account Lists
```move
// Wrong: No need to specify all objects upfront
// Sui automatically tracks object usage in transactions
```

### 4. Different Error Handling
```move
// Use assertions for validation
public fun withdraw(balance: &mut Balance<SUI>, amount: u64) {
    assert!(balance::value(balance) >= amount, EInsufficientFunds);
    // Function continues...
}
```

## Next Steps

Now that you understand Sui's fundamentals, you're ready to:

1. **Start with Basic Coins** - Learn object creation and transfers
2. **Explore Regulated Assets** - Understand compliance patterns  
3. **Build Game Economies** - Create closed-loop token systems
4. **Design Loyalty Programs** - Implement reward mechanisms
5. **Create Stablecoins** - Build DeFi primitives

The following tutorials assume you understand these fundamentals and will focus on practical implementation patterns.

## Quick Reference: Solana → Sui Equivalents

| Solana Concept | Sui Equivalent | Notes |
|----------------|---------------|-------|
| Program | Package/Module | Groups of related functions |
| Account | Object | Data with explicit ownership |
| Instruction | Function Call | Execute smart contract logic |
| PDA | Dynamic Fields | Computed addresses for storage |
| Associated Token Account | Coin<T> Object | User's token holdings |
| SPL Token | coin::Coin Standard | Token implementation |
| Anchor | Move Language | Smart contract framework |
| Account Rent | Gas Fees | One-time payment model |
| Cluster | Network (testnet/mainnet) | Deployment targets |

Ready to dive deeper? Let's start building!