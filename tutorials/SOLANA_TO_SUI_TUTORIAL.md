# From Solana to Sui: Building Your First Counter dApp

## Introduction: Why This Guide Exists

If you're a Solana developer curious about Sui, you're in the right place. This tutorial breaks down Sui's E2E Counter example specifically for developers familiar with Solana's development patterns. 

**What we'll build**: A simple counter that users can create, increment, and reset - similar to basic Solana programs you might have built.

**What you'll learn**: How your existing Solana knowledge translates to Sui, where the paradigms differ, and why those differences matter.

## Quick Mental Model: The Big Picture Difference

**Solana thinking**: "Everything is an account. My program manipulates accounts that store data."

**Sui thinking**: "Everything is an object. My module creates and manipulates typed objects."

This shift from accounts to objects is the key conceptual leap. Let's break it down step by step.

---

## Part 1: Smart Contract Architecture

### The Familiar: Solana Program Structure

In Solana, you might write a counter program like this:

```rust
// Solana - lib.rs
use anchor_lang::prelude::*;

#[program]
pub mod counter {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.authority = ctx.accounts.user.key();
        counter.count = 0;
        Ok(())
    }
    
    pub fn increment(ctx: Context<Update>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1).unwrap();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 16 + 16)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}
```

### The New: Sui Move Module Structure

Here's how the same concept looks in Sui Move:

```move
// Sui - counter.move
module counter::counter {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    // This is like your Solana account struct, but it's an object
    public struct Counter has key, store {
        id: UID,
        owner: address,
        value: u64,
    }

    // Similar to your initialize instruction
    public fun create(ctx: &mut TxContext): Counter {
        Counter {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            value: 0,
        }
    }

    // Similar to your increment instruction
    public fun increment(counter: &mut Counter) {
        counter.value = counter.value + 1;
    }

    // Similar to owner-only operations
    public fun reset(counter: &mut Counter, ctx: &TxContext) {
        assert!(counter.owner == tx_context::sender(ctx), 0);
        counter.value = 0;
    }
}
```

### Key Differences to Notice:

1. **No `#[program]` macro**: Sui uses standard module syntax
2. **No account validation structs**: Objects carry their own validation
3. **Direct object manipulation**: You work directly with typed objects, not through account contexts
4. **Built-in ownership**: Objects have built-in ownership concepts

---

## Part 2: The Account vs Object Mental Model

### Solana: Account-Based Storage

In Solana, you think in terms of accounts:

```rust
// Your data lives in accounts
// Accounts have addresses (PDAs)
// Your program validates which accounts can be passed to instructions
// You manually manage account relationships and access control

let counter_pda = Pubkey::find_program_address(&[b"counter", user.key().as_ref()], program_id).0;
```

**Mental model**: "I have a program that operates on accounts. Users pass me accounts, and I validate them."

### Sui: Object-Based Storage

In Sui, you think in terms of objects:

```move
// Your data lives in objects
// Objects have unique IDs and are typed
// Objects can be owned, shared, or immutable
// Access control is built into the object system

public fun create_counter(ctx: &mut TxContext): Counter {
    let counter = Counter {
        id: object::new(ctx),
        owner: tx_context::sender(ctx), 
        value: 0,
    };
    counter // This object can now be transferred, shared, or kept
}
```

**Mental model**: "I create typed objects. The system handles access control and ownership."

### The Big Difference: Object Ownership Models

| Solana | Sui |
|--------|-----|
| All accounts exist globally | Objects can be **owned**, **shared**, or **immutable** |
| Access control via PDAs and seeds | Access control via ownership |
| Manual account validation | Automatic based on object ownership |
| Single global state | Parallel execution via object isolation |

---

## Part 3: Transaction Patterns

### Solana Transaction Pattern

```typescript
// Solana - Creating and incrementing a counter
const tx = new Transaction();

// First, create the counter PDA
tx.add(
  await program.methods
    .initialize()
    .accounts({
      counter: counterPda,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction()
);

// Then increment it
tx.add(
  await program.methods
    .increment()
    .accounts({
      counter: counterPda,
      user: wallet.publicKey,
    })
    .instruction()
);

await wallet.sendTransaction(tx, connection);
```

### Sui Transaction Pattern

```typescript
// Sui - Creating and incrementing a counter
const tx = new TransactionBlock();

// Create the counter (returns an object reference)
const [counter] = tx.moveCall({
  target: `${packageId}::counter::create`,
});

// Increment the same counter object
tx.moveCall({
  target: `${packageId}::counter::increment`, 
  arguments: [counter], // Pass the object directly
});

// Transfer the counter to the user (or share it)
tx.transferObjects([counter], tx.gas.owner);

await signAndExecuteTransactionBlock({ transactionBlock: tx });
```

### Key Insight: Object References vs Account Addresses

- **Solana**: You pass account addresses and hope they contain the right data
- **Sui**: You pass object references and the type system guarantees correctness

---

## Part 4: Frontend Integration Patterns

### Solana Frontend (Familiar Territory)

```typescript
// Solana - Wallet and connection setup
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

const { connection } = useConnection();
const { publicKey, sendTransaction } = useWallet();

// Query account data
const counterData = await program.account.counter.fetch(counterPda);

// Send transaction
const tx = await program.methods.increment()
  .accounts({ counter: counterPda })
  .transaction();
await sendTransaction(tx, connection);
```

### Sui Frontend (New Patterns)

```typescript
// Sui - Wallet and client setup  
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const client = useSuiClient();
const account = useCurrentAccount();

// Query object data
const counter = await client.getObject({
  id: counterId,
  options: { showContent: true }
});

// Send transaction
const tx = new TransactionBlock();
tx.moveCall({
  target: `${packageId}::counter::increment`,
  arguments: [tx.object(counterId)]
});
await signAndExecuteTransactionBlock({ transactionBlock: tx });
```

### Key Frontend Differences:

| Aspect | Solana | Sui |
|--------|--------|-----|
| **Data Queries** | Fetch account by PDA | Fetch object by ID |
| **Type Safety** | Manual validation | Built-in via Move types |
| **Transaction Building** | Instruction-based | Object method calls |
| **State Updates** | Poll account changes | Subscribe to object changes |

---

## Part 5: Why These Differences Matter

### 1. Parallel Execution

**Solana challenge**: All transactions touch global state, requiring sequential processing of conflicting operations.

**Sui advantage**: Different objects can be processed in parallel. If Alice increments her counter and Bob increments his, those transactions can run simultaneously.

### 2. Simplified State Management

**Solana complexity**: 
- Calculate PDAs correctly
- Validate account ownership
- Handle account initialization
- Manage rent and account lifetimes

**Sui simplicity**:
- Create objects with unique IDs
- Built-in ownership validation  
- No rent or account management
- Automatic garbage collection

### 3. Type Safety

**Solana**: Runtime account validation

```rust
// Hope this account contains Counter data
let counter = Account::<Counter>::try_from(&account_info)?;
```

**Sui**: Compile-time type safety

```move
// This parameter IS a Counter, guaranteed
public fun increment(counter: &mut Counter) { ... }
```

---

## Part 6: Getting Started Checklist

Ready to try Sui? Here's your migration checklist:

### 1. **Installation**
```bash
# Instead of anchor CLI
curl -fsSL https://sui.io/install.sh | sh

# Verify installation  
sui --version
```

### 2. **Project Setup**
```bash
# Instead of anchor init
sui move new my_counter
cd my_counter
```

### 3. **Basic Development Flow**
```bash
# Instead of anchor build
sui move build

# Instead of anchor test
sui move test  

# Instead of anchor deploy
sui client publish --gas-budget 100000000
```

### 4. **Network Configuration**
```bash
# Switch networks (like solana config set --url)
sui client switch --env testnet
sui client switch --env devnet
sui client switch --env mainnet
```

---

## Next Steps: Hands-On Practice

1. **Clone and run the E2E Counter example**: Try the official Sui tutorial
2. **Port a simple Solana program**: Take one of your existing programs and recreate it in Move
3. **Experiment with object ownership**: Try owned vs shared objects
4. **Build a frontend**: Use the Sui TypeScript SDK to interact with your Move module

---

## Summary: Mental Model Shift

| **From (Solana)** | **To (Sui)** |
|-------------------|--------------|
| Programs manipulate accounts | Modules create and manage objects |
| PDAs for deterministic addresses | Unique object IDs |
| Manual account validation | Built-in type safety |
| Sequential global state | Parallel object processing |
| Account rent and management | Automatic object lifecycle |
| Instruction-based transactions | Object method transactions |

The core insight: **Sui's object model eliminates much of the complexity you're used to managing in Solana, while enabling better performance through parallelization.**

Ready to build your first Sui dApp? The patterns you know translate well - they're just simpler and safer in Sui's object-centric world.