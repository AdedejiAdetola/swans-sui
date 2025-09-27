# Create Your First Coin on Sui: A Complete Guide for Solana Developers

Coming from Solana, you're used to SPL tokens with complex account structures and rent requirements. Sui's coin system is fundamentally different - simpler, safer, and more intuitive. In this comprehensive tutorial, we'll create "SWANSCOIN" while comparing every concept to Solana equivalents.

**Prerequisites**: Complete the [Sui Fundamentals for Solana Developers](./SUI_FUNDAMENTALS_FOR_SOLANA_DEVS.md) guide first.

## What We're Building: SPL Token vs Sui Coin

### SPL Token Architecture (What You Know)
```rust
// Solana SPL Token requires multiple accounts and programs
Token Mint Account (owned by Token Program)
├─ Authority: Mint authority pubkey
├─ Supply: Total token supply  
├─ Decimals: Decimal precision
└─ Token Accounts (one per holder)
    ├─ Owner: User pubkey
    ├─ Mint: Reference to mint account
    └─ Amount: Token balance
```

### Sui Coin Architecture (What We're Building)
```move
// Sui coins are simple objects with built-in safety
Coin<SWANSCOIN> Objects (owned by users)
├─ id: Unique object ID
├─ balance: Built-in balance type
└─ Phantom type parameter for safety

TreasuryCap<SWANSCOIN> (controls minting)
├─ id: Unique object ID  
└─ total_supply: Tracked automatically

CoinMetadata<SWANSCOIN> (token information)
├─ decimals, symbol, name, description
└─ Frozen after creation (immutable)
```

**Key Difference**: Solana uses program-owned accounts; Sui uses direct object ownership with type safety.

## Understanding Move vs Rust: Token Safety

### Solana SPL Token Vulnerabilities
```rust
// Common SPL token bugs that Move prevents:

// 1. Double spending (transferring same tokens twice)
pub fn vulnerable_transfer(from: &mut TokenAccount, to: &mut TokenAccount) {
    from.amount -= 100;
    to.amount += 100;
    // Bug: What if this function is called twice in same transaction?
}

// 2. Integer overflow/underflow  
pub fn vulnerable_mint(account: &mut TokenAccount) {
    account.amount += u64::MAX; // Overflow!
}

// 3. Lost tokens (forgetting to credit recipient)
pub fn vulnerable_burn(account: &mut TokenAccount, amount: u64) {
    account.amount -= amount; // Tokens vanish into thin air
}
```

### Move's Built-in Token Safety
```move
// Move prevents these bugs at compile time:

// 1. No double spending - objects move, don't copy
public fun safe_transfer<T>(coin: Coin<T>, recipient: address) {
    transfer::public_transfer(coin, recipient);
    // coin is moved - cannot use it again in this function
}

// 2. No overflow - built into Balance type
public fun safe_mint<T>(cap: &mut TreasuryCap<T>, amount: u64, ctx: &mut TxContext): Coin<T> {
    coin::mint(cap, amount, ctx) // Handles overflow protection internally
}

// 3. No lost tokens - must explicitly handle Balance
public fun safe_burn<T>(cap: &mut TreasuryCap<T>, coin: Coin<T>) {
    coin::burn(cap, coin); // Explicitly destroys tokens
}
```

**Move eliminates entire classes of token bugs through its type system.**

## Step 1: Project Setup - Sui vs Solana Comparison

### Solana Project Setup (Familiar)
```bash
# Solana Anchor project
anchor init my-spl-token
cd my-spl-token
anchor build
```

### Sui Project Setup (New)
```bash
# Sui Move project - simpler structure
mkdir swanscoin
cd swanscoin
sui move new swanscoin  
cd swanscoin
```

**Expected Output:**
```
Created package "swanscoin" at /Users/you/swanscoin
```

**What Happened**: Sui created a Move package (equivalent to Solana program) with:
- `Move.toml`: Package manifest (like `Anchor.toml`)
- `sources/`: Where Move modules go (like `programs/`)

## Step 2: Package Configuration Deep Dive

### Understanding Move.toml vs Anchor.toml

Open `Move.toml` and replace with:

```toml
[package]
name = "swanscoin"           # Package name (like Anchor program name)
version = "1.0.0"            # Semantic versioning
edition = "2024.beta"        # Move language edition

[dependencies]
# Sui framework - equivalent to Anchor + SPL dependencies  
Sui = { 
    git = "https://github.com/MystenLabs/sui.git", 
    subdir = "crates/sui-framework/packages/sui-framework", 
    rev = "framework/devnet" 
}

[addresses]
swanscoin = "0x0"           # Placeholder address (resolved at publish)
```

**Key Differences from Solana**:
- **No program ID declaration**: Sui generates addresses at publish time
- **Single framework dependency**: Sui framework includes everything (coin, transfer, etc.)
- **Edition system**: Move evolves with backward-compatible editions

## Step 3: Understanding the One-Time Witness Pattern

This is unique to Move and crucial for token security:

```move
module swanscoin::swanscoin {
    // One-time witness - can only be used ONCE per deployment
    public struct SWANSCOIN has drop {}
    
    // This EXACT struct name must match the module name (swanscoin)
    // The struct name is UPPERCASE, module name is lowercase
    // This prevents token impersonation attacks
}
```

**Why One-Time Witness?**: Prevents anyone from creating fake versions of your token. In Solana, anyone could create accounts that look like official SPL tokens.

### Solana Equivalent (Manual Verification)
```rust
// Solana requires manual verification of mint authority
if mint_account.mint_authority != expected_authority {
    return Err(ErrorCode::UnauthorizedMint);
}
// Error-prone - developers must remember to check
```

### Sui Automatic Verification
```move
// Move compiler guarantees SWANSCOIN can only be created once
// No manual checks needed - type safety prevents counterfeits
```

## Step 4: Complete Token Implementation with Detailed Explanations

Create `sources/swanscoin.move`:

```move
module swanscoin::swanscoin {
    // === Imports (Optimized for Sui Linter) ===
    use sui::coin;           // Core token functionality
    use sui::url;            // For token metadata icons
    
    // === One-Time Witness ===
    /// One-time witness for SWANSCOIN creation
    /// CRITICAL: Must match module name exactly (case-insensitive)
    public struct SWANSCOIN has drop {}
    
    // === Constants ===
    const DECIMALS: u8 = 6;
    const SYMBOL: vector<u8> = b"SWANS";
    const NAME: vector<u8> = b"SwansCoin";
    const DESCRIPTION: vector<u8> = b"The official currency of the SWANS content creator platform";
    const ICON_URL: vector<u8> = b"https://swans.io/logo.png";
    
    // === Error Codes ===
    const EInvalidAmount: u64 = 0;
    const EInsufficientSupply: u64 = 1;

    // === Initialization Function ===
    /// Called automatically when package is published
    /// Equivalent to SPL token mint account creation
    fun init(witness: SWANSCOIN, ctx: &mut TxContext) {
        // Create the token with metadata
        let (treasury, metadata) = coin::create_currency<SWANSCOIN>(
            witness,                                    // One-time witness (proof of authenticity)
            DECIMALS,                                   // 6 decimals (like USDC)
            SYMBOL,                                     // Ticker symbol
            NAME,                                       // Full token name
            DESCRIPTION,                                // Token description
            option::some(url::new_unsafe_from_bytes(ICON_URL)), // Token icon URL
            ctx                                         // Transaction context
        );

        // Transfer treasury capability to package publisher
        // This is like being the mint authority in SPL tokens
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        
        // Make metadata immutable (prevents changes after deployment)
        // In Solana, you'd set mint authority to None to achieve similar effect
        transfer::public_freeze_object(metadata);
    }

    // === Minting Function ===
    /// Mint new tokens to a recipient
    /// Equivalent to SPL token mint_to instruction
    public fun mint(
        treasury: &mut coin::TreasuryCap<SWANSCOIN>,    // Proof of mint authority
        amount: u64,                                     // Amount in base units
        recipient: address,                              // Who receives tokens
        ctx: &mut TxContext                             // Transaction context
    ) {
        // Validate amount
        assert!(amount > 0, EInvalidAmount);
        
        // Mint coins - this creates a new Coin<SWANSCOIN> object
        let coins = coin::mint(treasury, amount, ctx);
        
        // Transfer to recipient
        // In Solana, you'd need to create/find their token account first
        transfer::public_transfer(coins, recipient);
    }

    // === Advanced Minting with Return ===
    /// Mint tokens and return them to caller (for programmatic use)
    /// Useful for DeFi protocols that need to handle tokens programmatically
    public fun mint_and_return(
        treasury: &mut coin::TreasuryCap<SWANSCOIN>,
        amount: u64,
        ctx: &mut TxContext
    ): coin::Coin<SWANSCOIN> {
        assert!(amount > 0, EInvalidAmount);
        coin::mint(treasury, amount, ctx)
    }

    // === Burning Function ===
    /// Burn tokens to reduce total supply
    /// Equivalent to SPL token burn instruction
    public fun burn(
        treasury: &mut coin::TreasuryCap<SWANSCOIN>,    // Proof of mint authority
        coins: coin::Coin<SWANSCOIN>                    // Tokens to burn
    ) {
        coin::burn(treasury, coins);
        // Tokens are permanently destroyed - supply decreases
    }

    // === Utility Functions ===
    /// Get total supply of tokens
    /// Equivalent to reading SPL mint account supply field
    public fun total_supply(treasury: &coin::TreasuryCap<SWANSCOIN>): u64 {
        coin::total_supply(treasury)
    }
    
    /// Get token decimals (view function)
    public fun decimals(): u8 {
        DECIMALS
    }
}
```

## Step 5: Understanding the Build Process

### Solana Build (Multi-Step)
```bash
anchor build              # Compile Rust program
anchor idl init           # Generate IDL
anchor idl build          # Build IDL
anchor deploy             # Deploy to cluster
```

### Sui Build (Single Step)
```bash
sui move build
```

**Expected Output:**
```
BUILDING swanscoin
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING swanscoin
```

**What Happened**:
1. **Dependency Resolution**: Downloaded Sui framework
2. **Compilation**: Compiled Move modules to bytecode
3. **Verification**: Checked resource safety and type constraints
4. **Optimization**: Applied Move-specific optimizations

**If Build Fails**: Common issues and solutions:
```bash
# Error: "Unused import"
# Solution: Remove unused imports or prefix with underscore

# Error: "Invalid ability"  
# Solution: Check struct abilities (key, store, copy, drop)

# Error: "Type parameter mismatch"
# Solution: Verify generic type parameters match usage
```

## Step 6: Deployment - Understanding Sui vs Solana Differences

### Pre-Deployment: Network Setup

```bash
# Switch to testnet (like Solana devnet)
sui client switch --env testnet

# Check active network
sui client active-env

# Fund your account with test SUI (like SOL)
sui client faucet
```

**Wait for faucet confirmation** - you need SUI for gas fees.

### Deployment Process Deep Dive

```bash
sui client publish --gas-budget 100000000
```

**What This Command Does**:
1. **Package Upload**: Sends compiled bytecode to network
2. **Object Creation**: Creates package object on-chain  
3. **Init Function Execution**: Runs `init()` function automatically
4. **Object Publishing**: Makes package callable by other transactions

**Expected Output (Annotated)**:
```bash
Transaction Digest: 7x8y9z...              # Transaction hash
│
├─ Created Objects:
│  ├─ Package ID: 0x1a2b3c...               # Your token package
│  ├─ TreasuryCap: 0x4d5e6f...              # Mint authority object
│  └─ CoinMetadata: 0x9e8f7d...             # Token info (frozen)
│
└─ Gas Used: 15,234,567 MIST                # Gas consumed
```

**SAVE THESE VALUES** - you'll need them for minting!

### Key Differences from Solana Deployment

| Aspect | Solana | Sui |
|--------|---------|-----|
| **Deploy Cost** | ~1-2 SOL | ~0.01 SUI |
| **Account Creation** | Manual (rent + space) | Automatic (in init) |
| **Upgradeability** | Programs are immutable | Packages can be upgradeable |
| **State Management** | Manual account creation | Objects created automatically |

## Step 7: Minting Tokens - Object Model in Action

### Understanding Sui Minting vs SPL Minting

**SPL Token Mint Process** (What you know):
```bash
# 1. Create token account (if doesn't exist)
spl-token create-account <MINT_ADDRESS>

# 2. Mint tokens to account  
spl-token mint <MINT_ADDRESS> <AMOUNT> <TOKEN_ACCOUNT>
```

**Sui Coin Mint Process** (What we're doing):
```bash
# Single step - account creation handled automatically
sui client call \
  --package YOUR_PACKAGE_ID \
  --module swanscoin \
  --function mint \
  --args YOUR_TREASURY_ID 1000000000 YOUR_ADDRESS \
  --gas-budget 10000000
```

### Decimal Handling Explained

```bash
# We want 1,000 SWANS tokens
# SWANS has 6 decimals (like USDC)
# So we pass: 1,000 * 10^6 = 1,000,000,000

AMOUNT=1000000000  # 1,000 tokens with 6 decimals
```

### Command Breakdown

```bash
sui client call \
  --package YOUR_PACKAGE_ID \          # Which package to call
  --module swanscoin \                 # Which module in package
  --function mint \                    # Which function in module
  --args YOUR_TREASURY_ID \            # TreasuryCap object ID
         1000000000 \                  # Amount to mint
         YOUR_ADDRESS \                # Recipient address
  --gas-budget 10000000                # Max gas to spend
```

**Expected Output**:
```bash
Transaction Digest: abc123...
│
├─ Object Changes:
│  ├─ Mutated: TreasuryCap (supply increased)
│  └─ Created: Coin<SWANSCOIN> (your tokens)
│
└─ Events:
   └─ MintEvent: 1,000 SWANS minted to YOUR_ADDRESS
```

## Step 8: Verifying Your Tokens

### Method 1: CLI Object Inspection
```bash
# List all your objects
sui client objects

# Filter for your tokens  
sui client objects | grep SWANSCOIN
```

### Method 2: Query Specific Object
```bash
# Get details of your coin object
sui client object YOUR_COIN_OBJECT_ID
```

**Expected Output**:
```json
{
  "objectId": "0x...",
  "version": "1",
  "digest": "...",
  "type": "0xPACKAGE_ID::swanscoin::SWANSCOIN",
  "fields": {
    "id": { "id": "0x..." },
    "balance": "1000000000"
  }
}
```

### Method 3: Check Total Supply
```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module swanscoin \
  --function total_supply \
  --args YOUR_TREASURY_ID \
  --gas-budget 5000000
```

## Step 9: Token Transfers - Understanding Sui's Object Model

### SPL Token Transfer (Complex)
```bash
# Solana requires multiple accounts and validation
spl-token transfer \
  --from SOURCE_TOKEN_ACCOUNT \
  --to DEST_TOKEN_ACCOUNT \
  AMOUNT
```

### Sui Coin Transfer (Simple)

#### Method 1: Using Built-in Transfer Functions
```bash
# Split coins and send to another address
sui client call \
  --package 0x2 \
  --module coin \
  --function split_and_transfer \
  --type-args YOUR_PACKAGE_ID::swanscoin::SWANSCOIN \
  --args YOUR_COIN_OBJECT_ID 100000000 RECIPIENT_ADDRESS \
  --gas-budget 10000000
```

#### Method 2: Direct Object Transfer
```bash
# Transfer entire coin object to another address
sui client transfer \
  --to RECIPIENT_ADDRESS \
  --object-id YOUR_COIN_OBJECT_ID \
  --gas-budget 5000000
```

### Understanding the Difference

**split_and_transfer**:
- Splits your coin into two parts
- Sends specified amount to recipient
- You keep the remainder

**transfer**:
- Transfers entire coin object
- All tokens go to recipient
- You keep nothing

## Step 10: Advanced Token Operations

### Combining Coins (Merging)
```bash
# If you have multiple coin objects, merge them
sui client call \
  --package 0x2 \
  --module coin \
  --function join \
  --type-args YOUR_PACKAGE_ID::swanscoin::SWANSCOIN \
  --args COIN_OBJECT_1 COIN_OBJECT_2 \
  --gas-budget 10000000
```

### Splitting Coins
```bash
# Split a coin into specific amounts
sui client call \
  --package 0x2 \
  --module coin \
  --function split \
  --type-args YOUR_PACKAGE_ID::swanscoin::SWANSCOIN \
  --args YOUR_COIN_OBJECT_ID 250000000 \
  --gas-budget 10000000
```

### Burning Tokens
```bash
# Burn tokens to reduce supply
sui client call \
  --package YOUR_PACKAGE_ID \
  --module swanscoin \
  --function burn \
  --args YOUR_TREASURY_ID YOUR_COIN_OBJECT_ID \
  --gas-budget 10000000
```

## Understanding What We've Built

### Comparison: SPL Token vs Sui Coin

| Feature | SPL Token | Sui Coin |
|---------|-----------|----------|
| **Creation** | Multiple accounts + programs | Single package deployment |
| **Storage** | Token accounts (rent required) | Coin objects (no ongoing costs) |
| **Transfers** | Program instructions | Direct object transfers |
| **Supply Control** | Mint authority keypair | TreasuryCap object |
| **Metadata** | Separate metadata program | Built into coin framework |
| **Safety** | Manual validation | Compile-time guarantees |

### Your SWANSCOIN Properties

✅ **Type Safety**: Cannot be counterfeited (one-time witness)  
✅ **Decimal Precision**: 6 decimals (like USDC)  
✅ **Professional Metadata**: Name, symbol, description, icon  
✅ **Supply Control**: Only TreasuryCap holder can mint  
✅ **Standard Compliance**: Works with all Sui wallets/dApps  
✅ **Gas Efficient**: No ongoing rent, one-time deployment cost

## Common Pitfalls for Solana Developers

### 1. Forgetting About Object Ownership
```move
// Wrong: Trying to use moved object
public fun wrong_approach(coin: Coin<SWANSCOIN>) {
    let amount = coin::value(&coin);
    transfer::public_transfer(coin, @0x123); // coin moved here
    
    // Error: coin was moved above!
    // let amount2 = coin::value(&coin);
}
```

### 2. Not Understanding Reference vs Owned
```move
// Reference (borrowed) - can read, not move
public fun check_balance(coin: &Coin<SWANSCOIN>): u64 {
    coin::value(coin) // OK - just reading
}

// Owned - can move/consume
public fun transfer_coin(coin: Coin<SWANSCOIN>) {
    transfer::public_transfer(coin, @0x456); // OK - consuming
}
```

### 3. Trying to Create Accounts Manually
```bash
# Wrong: No need to create "token accounts" in Sui
# Coins are objects that can be owned directly

# Right: Just mint and transfer
sui client call --package PKG --module mod --function mint ...
```

### 4. Not Saving Object IDs
```bash
# Always save these from deployment output:
Package ID: 0x...      # For calling functions
TreasuryCap ID: 0x...  # For minting/burning  
Coin Object IDs: 0x... # For transfers
```

## Production Considerations

### Security Best Practices

1. **Treasury Management**:
```move
// Consider multi-sig for treasury control
public struct MultiSigTreasury has key {
    id: UID,
    treasury: TreasuryCap<SWANSCOIN>,
    required_signatures: u8,
    signers: vector<address>,
}
```

2. **Supply Limits**:
```move
// Add maximum supply constraints
const MAX_SUPPLY: u64 = 1_000_000_000_000_000; // 1B tokens

public fun mint_with_limit(treasury: &mut TreasuryCap<SWANSCOIN>, amount: u64, ctx: &mut TxContext) {
    let current_supply = coin::total_supply(treasury);
    assert!(current_supply + amount <= MAX_SUPPLY, EExceedsMaxSupply);
    // ... mint logic
}
```

### Integration Patterns

1. **DeFi Integration**:
```move
// Make your token work with DEXs
public fun provide_liquidity<X, Y>(
    coin_x: Coin<X>,
    coin_y: Coin<Y>
) {
    // DEX integration logic
}
```

2. **Wallet Integration**:
- Sui wallets automatically recognize your token
- No additional integration needed (unlike Solana's token list)

## Next Steps: Building on Your Token

Now that you have a working token, you can:

1. **Create a DEX Pool**: List your token on SuiSwap or Cetus
2. **Build a DeFi Protocol**: Use your token for lending/borrowing
3. **Create NFT Marketplace**: Use tokens for payments
4. **Build a DAO**: Use tokens for governance voting
5. **Gaming Integration**: Use tokens as in-game currency

## Troubleshooting Guide

### Build Errors
```bash
# "Unused import" warning
# Fix: Remove unused imports or prefix with _

# "Invalid struct ability"
# Fix: Ensure structs have correct abilities (key, store, etc.)

# "Type parameter mismatch"  
# Fix: Check generic type usage matches declaration
```

### Deployment Errors
```bash
# "Insufficient gas"
# Fix: Increase --gas-budget (try 150000000)

# "Package already exists"
# Fix: This means you already published - check objects

# "Invalid address"
# Fix: Ensure you're on correct network (testnet/mainnet)
```

### Minting Errors  
```bash
# "Object not found"
# Fix: Double-check TreasuryCap object ID

# "Invalid amount"
# Fix: Check decimal calculations (6 decimals = multiply by 1,000,000)

# "Unauthorized"
# Fix: Ensure you own the TreasuryCap
```

### Transfer Errors
```bash
# "Coin not found"
# Fix: Verify coin object ID and ownership

# "Insufficient balance"
# Fix: Check coin balance with sui client object

# "Type mismatch"
# Fix: Ensure type arguments match exactly
```

## Summary: What Makes Sui Different

Congratulations! You've created a production-ready cryptocurrency on Sui. Here's what makes it special compared to SPL tokens:

| Advantage | Description |
|-----------|-------------|
| **Simpler Architecture** | No complex account hierarchies |
| **Better Safety** | Compile-time prevention of token bugs |
| **Lower Costs** | No rent, just one-time gas fees |  
| **Direct Ownership** | Users own tokens directly as objects |
| **Type Safety** | Impossible to confuse different token types |
| **Automatic Integration** | Works with all Sui infrastructure immediately |

Your SWANSCOIN is now ready for mainnet deployment, DeFi integration, or use in decentralized applications. The same patterns apply whether you're building a stablecoin, governance token, or utility token.

**Ready for the next challenge?** Try building regulated coins with compliance features!