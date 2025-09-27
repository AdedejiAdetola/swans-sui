# Solana → Sui: Technical Migration Guide

## Core Paradigm Shift: Account Model vs Object Model

**Solana's Account Model**: Global state machine where all data lives in accounts with deterministic addresses. Programs operate on accounts through Program Derived Addresses (PDAs) and manual validation.

**Sui's Object Model**: Typed objects with unique IDs that can be owned, shared, or immutable. Objects carry their own access control and enable parallel execution through ownership isolation.

The fundamental difference: Solana optimizes for deterministic addressing and global state consistency. Sui optimizes for parallel execution and type safety through object ownership.

---

## Part 1: Account vs Object Fundamentals

### Solana: Account-Based Architecture

In Solana, you work with **accounts** - data structures at deterministic addresses:

```rust
// Account structure you're familiar with
#[account]
pub struct Counter {
    pub authority: Pubkey,    // Who controls this account
    pub count: u64,          // The counter value
}

// PDA generation for deterministic addressing
let (counter_pda, bump) = Pubkey::find_program_address(
    &[b"counter", user.key().as_ref()],
    program_id
);
```

**Key characteristics**:
- **Deterministic addresses** via PDAs
- **Global namespace** - all accounts exist in shared state
- **Manual ownership validation** in program logic
- **Rent-based lifecycle** management

### Sui: Object-Based Architecture  

In Sui, you work with **objects** - typed data structures with unique IDs:

```move
// Object structure (similar concept, different execution)
public struct Counter has key, store {
    id: UID,              // Globally unique identifier (auto-generated)
    owner: address,       // Built-in ownership
    value: u64,          // The counter value
}

// Object creation (no PDA calculation needed)
public fun create_counter(ctx: &mut TxContext): Counter {
    Counter {
        id: object::new(ctx),                    // Sui generates unique ID
        owner: tx_context::sender(ctx),          // Automatic owner assignment
        value: 0,
    }
}
```

**Key characteristics**:
- **Unique object IDs** (no deterministic calculation required)
- **Ownership isolation** enables parallel processing
- **Built-in access control** via object ownership
- **No rent** - objects exist until deleted or transferred

---

## Part 2: The Code - Side by Side (Super Simple)

### Solana Counter (What You Know)

```rust
// This is your data structure
#[account]  
pub struct Counter {
    pub owner: Pubkey,    // Who owns this counter
    pub count: u64,       // The actual number
}

// This is how you create it
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;  // Get the account
    counter.owner = ctx.accounts.user.key();  // Set owner
    counter.count = 0;                        // Set count to 0
    Ok(())
}

// This is how you increment it
pub fn increment(ctx: Context<Update>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;  // Get the account again
    counter.count += 1;                       // Add 1
    Ok(())
}
```

**What's happening here**:
1. You define what a counter account looks like
2. When someone calls `initialize`, you fill out a new account
3. When someone calls `increment`, you find that account and change the number

### Sui Counter (The New Way)

```move
// This is your data structure  
public struct Counter has key, store {
    id: UID,           // Unique ID (automatically managed)
    owner: address,    // Who owns this counter  
    value: u64,        // The actual number
}

// This is how you create it
public fun create(ctx: &mut TxContext): Counter {
    Counter {
        id: object::new(ctx),                    // Give it a unique ID
        owner: tx_context::sender(ctx),          // Set owner to caller
        value: 0,                                // Set count to 0
    }
}

// This is how you increment it
public fun increment(counter: &mut Counter) {
    counter.value = counter.value + 1;           // Just add 1
}
```

**What's happening here**:
1. You define what a counter object looks like
2. When someone calls `create`, you make a new object and return it
3. When someone calls `increment`, they pass you their object and you change it

---

## Part 3: The "Holy Shit" Differences

### Difference #1: PDA Generation vs Object ID Management

**Solana's PDA Pattern** (what you know):
```rust
// Calculate Program Derived Address
let (counter_pda, bump) = Pubkey::find_program_address(
    &[b"counter", user.key().as_ref()], 
    program_id
);

// Account validation in instruction context
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8,
        seeds = [b"counter", user.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

**Why you do this**: Deterministic addressing ensures users can always find their counter at the same PDA, enabling predictable state access.

**Sui's Object ID Pattern**:
```move
// Object creation with automatic ID generation
public fun create_counter(ctx: &mut TxContext): Counter {
    let counter = Counter {
        id: object::new(ctx),                    // System assigns unique ID
        owner: tx_context::sender(ctx),          // Built-in ownership
        value: 0,
    };
    counter
}

// Transfer to user or share globally
transfer::transfer(counter, tx_context::sender(ctx));  // Owned object
// OR
transfer::share_object(counter);                       // Shared object
```

**Trade-off**: You lose deterministic addressing but gain automatic ID management and built-in ownership semantics.

### Difference #2: Account Validation vs Type System

**Solana's Account Validation** (your current reality):
```rust
#[derive(Accounts)]
pub struct UpdateCounter<'info> {
    #[account(
        mut,
        seeds = [b"counter", authority.key().as_ref()],
        bump,
        has_one = authority,                    // Ownership validation
    )]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,               // Must be signer
}

pub fn increment(ctx: Context<UpdateCounter>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = counter.count.checked_add(1).unwrap();
    Ok(())
}
```

**What you're managing**: Account relationships, ownership validation, signer requirements, PDA constraints, and space calculations.

**Sui's Type System Approach**:
```move
// Direct object manipulation with compile-time guarantees
public fun increment(counter: &mut Counter) {
    counter.value = counter.value + 1;
}

// Ownership validation (if needed) happens in the function
public fun reset(counter: &mut Counter, ctx: &TxContext) {
    assert!(counter.owner == tx_context::sender(ctx), EUnauthorized);
    counter.value = 0;
}
```

**What Sui handles**: If the function compiles, the object types are guaranteed correct. No runtime account validation needed.

---

## Part 4: Frontend Integration Patterns

### Solana Frontend (Your Current Stack)

```typescript
// PDA calculation and transaction building
const [counterPda] = await PublicKey.findProgramAddress(
  [Buffer.from("counter"), wallet.publicKey.toBuffer()],
  programId
);

// Anchor-generated client with account validation
const tx = await program.methods
  .increment()
  .accounts({
    counter: counterPda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,  // Required for account operations
  })
  .transaction();

const signature = await wallet.sendTransaction(tx, connection);
await connection.confirmTransaction(signature);
```

**Your workflow**: 
1. Calculate PDA addresses
2. Validate account existence/initialization
3. Build instruction with all required accounts
4. Handle account rent and initialization logic

### Sui Frontend (New Patterns)

```typescript
// Direct object interaction via TransactionBlock
const tx = new TransactionBlock();

// Call Move functions directly with object references
tx.moveCall({
  target: `${packageId}::counter::increment`,
  arguments: [tx.object(counterId)],  // Object ID instead of PDA
});

const result = await signAndExecuteTransactionBlock({ 
  transactionBlock: tx 
});
```

**New workflow**:
1. Reference objects by ID (no PDA calculation)
2. Call Move functions directly  
3. Sui handles object existence and access control
4. No rent or account initialization concerns

---

## Part 5: Parallel Execution and Object Ownership

### Parallel Execution: Why It Matters

**Solana's Sequential Processing**:
Your familiar constraint - transactions that might conflict must be processed sequentially:

```typescript
// These transactions might conflict if they touch shared state
Transaction A: [Alice increments global counter] 
Transaction B: [Bob increments global counter]
// Result: B waits for A to complete
```

Even with different user counters, if they're implemented as PDAs of the same program, there can be lock contention.

**Sui's Parallel Processing**:
Object ownership enables true parallelism:

```move
// Alice owns counter object #123
// Bob owns counter object #456  
// These are completely independent objects

Transaction A: increment(counter_123)  // Alice's object
Transaction B: increment(counter_456)  // Bob's object
// Result: Both execute simultaneously
```

**Technical insight**: Sui's consensus can process transactions in parallel when they operate on different objects, dramatically improving throughput for user-specific operations.

### Object Ownership - The Key to Everything

**Three types of objects in Sui**:

1. **Owned Objects** = "This is mine, only I can use it"
   ```move
   transfer::transfer(counter, user_address);  // Give it to a specific user
   ```

2. **Shared Objects** = "Everyone can use this, but one at a time"
   ```move
   transfer::share_object(global_leaderboard);  // Make it shared
   ```

3. **Immutable Objects** = "No one can change this, ever"
   ```move
   transfer::freeze_object(game_config);  // Lock it forever
   ```

**Solana equivalent**: Everything is basically "shared" - it's all in the global state and you manually manage who can access what.

---

## Part 6: Common "Oh Shit" Moments

### Oh Shit Moment #1: No Rent

**Solana**: Your accounts need rent or they disappear. You have to calculate rent-exempt balances.

**Sui**: Objects just... exist. No rent. No worrying about accounts getting deleted.

### Oh Shit Moment #2: No PDAs to Calculate

**Solana**: Spend 30% of your brain calculating Program Derived Addresses correctly.

**Sui**: Object IDs are just random unique numbers. You don't calculate them, you just use them.

### Oh Shit Moment #3: Type Safety That Actually Works

**Solana**: Runtime errors when accounts don't match what you expect.

**Sui**: If your code compiles, the types are guaranteed to be correct.

---

## Part 7: The Actual Steps to Get Started

### Step 1: Install Sui (Instead of Anchor)

```bash
curl -fsSL https://sui.io/install.sh | sh
sui --version  # Make sure it worked
```

### Step 2: Create a Project

```bash
sui move new my_counter
cd my_counter
```

You'll get this structure:
```
my_counter/
├── Move.toml      # Like Cargo.toml but for Move
└── sources/
    └── my_counter.move  # Your code goes here
```

### Step 3: Write Your First Counter

Copy this into `sources/my_counter.move`:

```move
module my_counter::counter {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    // Your counter object
    public struct Counter has key, store {
        id: UID,
        owner: address, 
        value: u64,
    }

    // Create a counter
    public fun create_counter(ctx: &mut TxContext) {
        let counter = Counter {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            value: 0,
        };
        transfer::transfer(counter, tx_context::sender(ctx));
    }

    // Increment a counter  
    public fun increment(counter: &mut Counter) {
        counter.value = counter.value + 1;
    }

    // Get the current value (read-only)
    public fun value(counter: &Counter): u64 {
        counter.value
    }
}
```

### Step 4: Build and Test

```bash
sui move build     # Compile (like anchor build)
sui move test      # Run tests (like anchor test)  
```

### Step 5: Deploy

```bash
sui client publish --gas-budget 100000000
```

It'll give you a Package ID. Save that - you need it for the frontend.

---

## Part 8: The Frontend (Super Practical)

### Install Dependencies

```bash
npm install @mysten/dapp-kit @mysten/sui.js @tanstack/react-query
```

### Basic Setup

```typescript
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
const packageId = 'YOUR_PACKAGE_ID_HERE';
```

### Create a Counter

```typescript
async function createCounter(wallet) {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: `${packageId}::counter::create_counter`,
    arguments: [],
  });

  const result = await wallet.signAndExecuteTransactionBlock({
    transactionBlock: tx,
  });
  
  return result;
}
```

### Increment a Counter

```typescript
async function incrementCounter(counterId, wallet) {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: `${packageId}::counter::increment`,
    arguments: [tx.object(counterId)],
  });

  const result = await wallet.signAndExecuteTransactionBlock({
    transactionBlock: tx,
  });
  
  return result;
}
```

### Get Counter Value

```typescript
async function getCounterValue(counterId) {
  const object = await client.getObject({
    id: counterId,
    options: {
      showContent: true,
    },
  });
  
  // The actual counter data
  const counterData = object.data.content.fields;
  return counterData.value;
}
```

---

## Part 9: What This All Means for You

### You'll Stop Worrying About:
- ❌ Calculating PDAs correctly
- ❌ Account size calculations  
- ❌ Rent exemption
- ❌ Account validation structs
- ❌ Which system programs to include
- ❌ Whether accounts exist or not

### You'll Start Thinking About:
- ✅ What objects your app needs
- ✅ Who should own each object
- ✅ What functions objects should have
- ✅ How objects interact with each other

### The Mental Shift:
- **Before**: "How do I manage this complex account structure?"
- **After**: "What kind of thing am I building and what should it do?"

---

## Part 10: Your First Day Checklist

1. **Install Sui CLI**: `curl -fsSL https://sui.io/install.sh | sh`
2. **Create a project**: `sui move new test_counter`
3. **Copy the counter code** from Part 7
4. **Build it**: `sui move build`
5. **Deploy it**: `sui client publish --gas-budget 100000000`
6. **Call it from the CLI**: `sui client call --package <ID> --module counter --function create_counter`
7. **Check your objects**: `sui client objects`
8. **Increment your counter**: `sui client call --package <ID> --module counter --function increment --args <COUNTER_ID>`

**Goal**: By the end of today, you should have created, deployed, and interacted with your first Sui object.

That's it. You're now a Sui developer. The rest is just building more complex objects and interactions.

---

## The Bottom Line

**Solana**: You're an account bookkeeper managing a complex spreadsheet.

**Sui**: You're creating things in the world and giving them behaviors.

The code is simpler, the concepts are cleaner, and the blockchain does more work for you. That's the whole point.