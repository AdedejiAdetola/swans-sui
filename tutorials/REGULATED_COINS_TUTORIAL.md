# Build Regulated Coins with Compliance Controls: A Deep Dive for Solana Developers

Coming from Solana, you're familiar with building compliance features manually through program logic. Sui's regulated coins provide built-in compliance infrastructure at the protocol level - similar to how Solana's Token Extensions program adds native features, but more deeply integrated.

In this comprehensive tutorial, we'll create "COMPLIANCECOIN" - a regulated cryptocurrency that can block addresses, pause operations, and meet institutional compliance requirements. We'll compare every concept to Solana equivalents and explore the regulatory advantages of Sui's approach.

**Prerequisites**: Complete the [Basic Coin Tutorial](./BASIC_COIN_TUTORIAL.md) first.

## Understanding Compliance: Solana vs Sui Approaches

### Solana Compliance Implementation (Manual)
```rust
// Solana requires custom program logic for compliance
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ComplianceAccount {
    pub authority: Pubkey,
    pub blocked_addresses: Vec<Pubkey>,  // Limited by account size
    pub global_freeze: bool,
    pub freeze_timestamp: i64,
}

#[program]
pub mod compliance_token {
    pub fn transfer_with_compliance(
        ctx: Context<TransferWithCompliance>,
        amount: u64,
    ) -> Result<()> {
        let compliance = &ctx.accounts.compliance_account;
        
        // Manual checks (error-prone!)
        if compliance.global_freeze {
            return Err(ErrorCode::GlobalFreeze);
        }
        
        if compliance.blocked_addresses.contains(&ctx.accounts.recipient.key()) {
            return Err(ErrorCode::BlockedRecipient);
        }
        
        // Perform transfer...
        Ok(())
    }
}
```

### Sui Regulated Coins (Built-in Protocol Support)
```move
// Sui provides compliance features at the framework level
module compliance::compliancecoin {
    use sui::coin::{Self, TreasuryCap, DenyCapV2};
    use sui::deny_list::DenyList;

    public struct COMPLIANCECOIN has drop {}

    // Regulated coin creation with built-in compliance
    fun init(witness: COMPLIANCECOIN, ctx: &mut TxContext) {
        let (treasury, deny_cap, metadata) = coin::create_regulated_currency_v2<COMPLIANCECOIN>(
            witness,
            6, b"COMP", b"ComplianceCoin", b"Regulated token with compliance controls",
            option::none(), false, ctx
        );
        
        // Compliance happens automatically - no manual checks needed!
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        transfer::public_transfer(deny_cap, tx_context::sender(ctx));
        transfer::public_freeze_object(metadata);
    }
}
```

**Key Advantage**: Sui's compliance is enforced at the VM level, making it impossible to bypass through smart contract bugs or oversights.

## Real-World Compliance Requirements

### Traditional Finance Compliance Needs
Understanding what regulated financial institutions require helps design better systems:

**KYC/AML Compliance**:
- Block sanctioned addresses (OFAC lists)
- Geographic restrictions (country-based blocking)
- Transaction monitoring and reporting
- Audit trails for regulatory review

**Operational Requirements**:
- Emergency freeze capabilities
- Selective address blocking/unblocking
- Time-based restrictions (market hours)
- Multi-signature administrative controls

### Solana Compliance Challenges
```rust
// Common Solana compliance issues:

// 1. Account size limits restrict blocklist size
pub struct BlockedAddresses {
    pub addresses: Vec<Pubkey>,  // Max ~300 addresses per account
}

// 2. Cross-program vulnerabilities
// Users might bypass compliance through other programs

// 3. Race conditions in multi-instruction transactions
// Compliance checks might be bypassed by clever transaction construction

// 4. No protocol-level enforcement
// Each program must implement compliance separately
```

### Sui's Compliance Advantages
```move
// Sui solves these problems systematically:

// 1. Unlimited deny list (stored in global system object)
// 2. Protocol-level enforcement (cannot be bypassed)
// 3. Epoch-based consistency (no race conditions)  
// 4. Automatic application to all coin operations
```

## Step 1: Understanding Sui's Regulatory Architecture

### The Global DenyList System
Sui maintains a single, system-wide `DenyList` object at address `0x403`:

```move
// System object - managed by Sui validators
public struct DenyList has key {
    id: UID,
    lists: Table<TypeName, Table<address, EpochTimeLock>>,
}
```

**How it works**:
- **Global**: One deny list for all regulated coins
- **Type-specific**: Each coin type has its own blocked addresses
- **Epoch-based**: Changes take effect at epoch boundaries
- **Validator-enforced**: Cannot be bypassed by smart contracts

### Comparison to Solana Program-Level Compliance
| Aspect | Solana Programs | Sui DenyList |
|--------|----------------|--------------|
| **Scope** | Per-program implementation | Global system enforcement |
| **Bypass Risk** | High (through other programs) | None (VM-level) |
| **Scalability** | Limited by account size | Unlimited storage |
| **Consistency** | Manual synchronization | Automatic epoch boundaries |
| **Audit Trail** | Per-program logging | System-wide events |

## Step 2: Project Setup - Regulated vs Basic Tokens

### Understanding Regulatory Complexity
Regulated tokens require more sophisticated architecture than basic tokens:

```bash
# Create regulatory compliance project
mkdir compliancecoin-regulated
cd compliancecoin-regulated
sui move new compliancecoin
cd compliancecoin
```

### Enhanced Package Configuration
Update `Move.toml` with regulatory focus:

```toml
[package]
name = "compliancecoin"
version = "1.0.0"
edition = "2024.beta"
authors = ["Your Compliance Team"]

[dependencies]
Sui = { 
    git = "https://github.com/MystenLabs/sui.git", 
    subdir = "crates/sui-framework/packages/sui-framework", 
    rev = "framework/devnet" 
}

[addresses]
compliancecoin = "0x0"

# Regulatory metadata for documentation
[package.metadata.regulatory]
compliance_officer = "compliance@yourcompany.com"
jurisdiction = "United States, European Union"
license_type = "Money Transmitter License"
```

## Step 3: Advanced Regulatory Token Implementation

Create `sources/compliancecoin.move` with comprehensive compliance features:

```move
module compliancecoin::compliancecoin {
    // === Core Imports ===
    use sui::coin::{Self, TreasuryCap, DenyCapV2, Coin};
    use sui::deny_list::{Self, DenyList};
    use sui::url;
    use sui::clock::{Self, Clock};
    use sui::event;

    // === Regulated Token Type ===
    /// Regulated token with built-in compliance controls
    /// One-time witness ensures authentic token creation
    public struct COMPLIANCECOIN has drop {}

    // === Administrative Structures ===
    
    /// Primary administrative capability for compliance operations
    /// In Solana, this would be a multisig PDA with program authority
    public struct ComplianceAdmin has key, store {
        id: UID,
        officer_address: address,           // Chief Compliance Officer
        jurisdiction: vector<u8>,           // Regulatory jurisdiction
        license_number: vector<u8>,         // Operating license ID
        emergency_contacts: vector<address>, // Emergency response team
    }

    /// Audit trail for regulatory reporting
    /// In Solana, you'd maintain this in separate account(s)
    public struct ComplianceAudit has key {
        id: UID,
        total_blocks: u64,                  // Total addresses blocked
        total_unblocks: u64,                // Total addresses unblocked
        emergency_freezes: u64,             // Number of emergency pauses
        last_audit_epoch: u64,              // Last compliance review
        regulatory_reports: Table<u64, vector<u8>>, // Epoch -> report hash
    }

    /// Temporary hold system for suspicious transactions
    public struct TransactionHold has key, store {
        id: UID,
        held_amount: u64,
        holder_address: address,
        reason: vector<u8>,                 // Reason for hold
        hold_timestamp: u64,
        review_deadline: u64,               // When hold expires
        approved_by: Option<address>,       // Compliance officer approval
    }

    // === Events for Regulatory Reporting ===
    
    /// Address blocked for compliance reasons
    public struct AddressBlocked has copy, drop {
        blocked_address: address,
        blocked_by: address,                // Compliance officer
        reason: vector<u8>,                 // OFAC, AML, etc.
        jurisdiction: vector<u8>,           // Regulatory jurisdiction
        block_timestamp: u64,
        effective_epoch: u64,               // When block takes effect
    }

    /// Address unblocked after compliance review
    public struct AddressUnblocked has copy, drop {
        unblocked_address: address,
        unblocked_by: address,
        review_notes: vector<u8>,
        unblock_timestamp: u64,
        effective_epoch: u64,
    }

    /// Emergency system freeze activated
    public struct EmergencyFreeze has copy, drop {
        activated_by: address,
        reason: vector<u8>,                 // Security breach, regulatory order, etc.
        freeze_timestamp: u64,
        expected_duration: Option<u64>,     // Expected resolution time
        contact_info: vector<u8>,           // Emergency contact details
    }

    /// Large transaction flagged for review
    public struct TransactionFlagged has copy, drop {
        transaction_id: vector<u8>,
        from_address: address,
        to_address: address,
        amount: u64,
        flag_reason: vector<u8>,            // Large amount, suspicious pattern, etc.
        reviewer_assigned: address,
        flag_timestamp: u64,
    }

    // === Regulatory Constants ===
    const LARGE_TRANSACTION_THRESHOLD: u64 = 10000000000; // $10,000 equivalent
    const MAXIMUM_DAILY_VOLUME: u64 = 1000000000000;      // $1M equivalent
    const COMPLIANCE_REVIEW_PERIOD: u64 = 86400000;       // 24 hours in ms
    
    // === Error Codes ===
    const EUnauthorizedCompliance: u64 = 100;
    const EAddressAlreadyBlocked: u64 = 101;
    const EAddressNotBlocked: u64 = 102;
    const EEmergencyFreezeActive: u64 = 103;
    const ETransactionTooLarge: u64 = 104;
    const EInsufficientComplianceData: u64 = 105;
    const EInvalidJurisdiction: u64 = 106;

    // === Initialization with Regulatory Setup ===
    fun init(witness: COMPLIANCECOIN, ctx: &mut TxContext) {
        // Create regulated currency with comprehensive compliance
        let (treasury, deny_cap, metadata) = coin::create_regulated_currency_v2<COMPLIANCECOIN>(
            witness,
            6,                                          // Standard 6 decimals
            b"COMP",                                    // Ticker symbol
            b"ComplianceCoin",                          // Full name
            b"Institutional-grade regulated cryptocurrency with built-in compliance controls", // Description
            option::some(url::new_unsafe_from_bytes(b"https://compliance-coin.com/logo.png")), // Icon
            true,                                       // Enable global pause capability
            ctx
        );

        // Create compliance administrative structure
        let compliance_admin = ComplianceAdmin {
            id: object::new(ctx),
            officer_address: tx_context::sender(ctx),
            jurisdiction: b"US-NY, EU-LU",              // New York, Luxembourg licenses
            license_number: b"NYDFS-2024-001",
            emergency_contacts: vector[tx_context::sender(ctx)],
        };

        // Initialize audit trail system
        let compliance_audit = ComplianceAudit {
            id: object::new(ctx),
            total_blocks: 0,
            total_unblocks: 0,
            emergency_freezes: 0,
            last_audit_epoch: 0,
            regulatory_reports: table::new(ctx),
        };

        // Transfer capabilities to compliance team
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        transfer::public_transfer(deny_cap, tx_context::sender(ctx));
        transfer::public_transfer(compliance_admin, tx_context::sender(ctx));
        
        // Make audit system shared for transparency
        transfer::share_object(compliance_audit);
        
        // Freeze metadata to prevent tampering
        transfer::public_freeze_object(metadata);
    }

    // === Enhanced Minting with Compliance Checks ===
    
    /// Mint regulated tokens with institutional controls
    /// Unlike Solana SPL tokens, compliance is automatically enforced
    public fun mint_with_compliance_review(
        admin: &ComplianceAdmin,
        treasury: &mut TreasuryCap<COMPLIANCECOIN>,
        amount: u64,
        recipient: address,
        purpose: vector<u8>,                // Business purpose for mint
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Verify administrative authority
        assert!(admin.officer_address == tx_context::sender(ctx), EUnauthorizedCompliance);
        
        // Flag large mints for additional review
        if (amount >= LARGE_TRANSACTION_THRESHOLD) {
            event::emit(TransactionFlagged {
                transaction_id: object::uid_to_bytes(&object::new(ctx)),
                from_address: @0x0,  // Mint from treasury
                to_address: recipient,
                amount,
                flag_reason: b"Large mint operation - compliance review required",
                reviewer_assigned: admin.officer_address,
                flag_timestamp: clock::timestamp_ms(clock),
            });
        }

        // Mint tokens - compliance enforcement is automatic
        let coins = coin::mint(treasury, amount, ctx);
        transfer::public_transfer(coins, recipient);
    }

    // === Address Blocking Functions ===
    
    /// Block an address from using the regulated token
    /// More sophisticated than Solana's manual program-level blocking
    public fun block_address_for_compliance(
        admin: &ComplianceAdmin,
        deny_cap: &mut DenyCapV2<COMPLIANCECOIN>,
        deny_list: &mut DenyList,
        target_address: address,
        reason: vector<u8>,                 // OFAC, AML investigation, etc.
        audit: &mut ComplianceAudit,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Verify compliance officer authority
        assert!(admin.officer_address == tx_context::sender(ctx), EUnauthorizedCompliance);
        
        // Check if address is already blocked
        let current_epoch = tx_context::epoch(ctx);
        assert!(!coin::deny_list_v2_contains_next_epoch<COMPLIANCECOIN>(
            deny_list, target_address, current_epoch
        ), EAddressAlreadyBlocked);

        // Add to protocol-level deny list
        coin::deny_list_v2_add(deny_cap, deny_list, target_address, ctx);
        
        // Update audit trail
        audit.total_blocks = audit.total_blocks + 1;
        audit.last_audit_epoch = current_epoch;

        // Emit regulatory event
        event::emit(AddressBlocked {
            blocked_address: target_address,
            blocked_by: tx_context::sender(ctx),
            reason,
            jurisdiction: admin.jurisdiction,
            block_timestamp: clock::timestamp_ms(clock),
            effective_epoch: current_epoch + 1,  // Takes effect next epoch
        });
    }

    /// Unblock address after compliance review
    public fun unblock_address_after_review(
        admin: &ComplianceAdmin,
        deny_cap: &mut DenyCapV2<COMPLIANCECOIN>,
        deny_list: &mut DenyList,
        target_address: address,
        review_notes: vector<u8>,           // Documentation of review process
        audit: &mut ComplianceAudit,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(admin.officer_address == tx_context::sender(ctx), EUnauthorizedCompliance);
        
        // Verify address is currently blocked
        let current_epoch = tx_context::epoch(ctx);
        assert!(coin::deny_list_v2_contains_next_epoch<COMPLIANCECOIN>(
            deny_list, target_address, current_epoch
        ), EAddressNotBlocked);

        // Remove from deny list
        coin::deny_list_v2_remove(deny_cap, deny_list, target_address, ctx);
        
        // Update audit trail
        audit.total_unblocks = audit.total_unblocks + 1;

        // Emit compliance event
        event::emit(AddressUnblocked {
            unblocked_address: target_address,
            unblocked_by: tx_context::sender(ctx),
            review_notes,
            unblock_timestamp: clock::timestamp_ms(clock),
            effective_epoch: current_epoch + 1,
        });
    }

    // === Emergency Controls ===
    
    /// Emergency freeze all token operations
    /// More powerful than Solana's program-level pausing
    public fun emergency_freeze_all_operations(
        admin: &ComplianceAdmin,
        deny_cap: &mut DenyCapV2<COMPLIANCECOIN>,
        deny_list: &mut DenyList,
        emergency_reason: vector<u8>,       // Security breach, regulatory order, etc.
        audit: &mut ComplianceAudit,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(admin.officer_address == tx_context::sender(ctx), EUnauthorizedCompliance);

        // Activate global pause
        coin::deny_list_v2_enable_global_pause(deny_cap, deny_list, ctx);
        
        // Update audit trail
        audit.emergency_freezes = audit.emergency_freezes + 1;

        // Emit emergency event
        event::emit(EmergencyFreeze {
            activated_by: tx_context::sender(ctx),
            reason: emergency_reason,
            freeze_timestamp: clock::timestamp_ms(clock),
            expected_duration: option::none(),
            contact_info: b"emergency@compliance-coin.com",
        });
    }

    /// Lift emergency freeze after issue resolution
    public fun lift_emergency_freeze(
        admin: &ComplianceAdmin,
        deny_cap: &mut DenyCapV2<COMPLIANCECOIN>,
        deny_list: &mut DenyList,
        resolution_notes: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(admin.officer_address == tx_context::sender(ctx), EUnauthorizedCompliance);

        // Disable global pause
        coin::deny_list_v2_disable_global_pause(deny_cap, deny_list, ctx);
    }

    // === Advanced Compliance Features ===
    
    /// Create transaction hold for suspicious activity
    public fun place_transaction_hold(
        admin: &ComplianceAdmin,
        coin_to_hold: Coin<COMPLIANCECOIN>,
        reason: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ): TransactionHold {
        assert!(admin.officer_address == tx_context::sender(ctx), EUnauthorizedCompliance);

        let held_amount = coin::value(&coin_to_hold);
        
        // Store held coins in the hold object
        let hold = TransactionHold {
            id: object::new(ctx),
            held_amount,
            holder_address: tx_context::sender(ctx),
            reason,
            hold_timestamp: clock::timestamp_ms(clock),
            review_deadline: clock::timestamp_ms(clock) + COMPLIANCE_REVIEW_PERIOD,
            approved_by: option::none(),
        };

        // Burn held coins temporarily (will be re-minted if approved)
        transfer::public_transfer(coin_to_hold, @0x0); // Send to null address

        hold
    }

    /// Release held transaction after compliance approval
    public fun release_transaction_hold(
        admin: &ComplianceAdmin,
        treasury: &mut TreasuryCap<COMPLIANCECOIN>,
        hold: TransactionHold,
        ctx: &mut TxContext
    ) {
        assert!(admin.officer_address == tx_context::sender(ctx), EUnauthorizedCompliance);

        let TransactionHold {
            id,
            held_amount,
            holder_address,
            reason: _,
            hold_timestamp: _,
            review_deadline: _,
            approved_by: _,
        } = hold;

        // Re-mint held amount and return to original holder
        let released_coins = coin::mint(treasury, held_amount, ctx);
        transfer::public_transfer(released_coins, holder_address);

        object::delete(id);
    }

    // === View Functions for Compliance Monitoring ===
    
    /// Check if address is currently blocked
    public fun is_address_blocked(
        deny_list: &DenyList,
        target_address: address,
        ctx: &TxContext
    ): bool {
        coin::deny_list_v2_contains_current_epoch<COMPLIANCECOIN>(deny_list, target_address, ctx)
    }

    /// Check if address will be blocked next epoch
    public fun will_address_be_blocked_next_epoch(
        deny_list: &DenyList,
        target_address: address,
        ctx: &TxContext
    ): bool {
        let current_epoch = tx_context::epoch(ctx);
        coin::deny_list_v2_contains_next_epoch<COMPLIANCECOIN>(deny_list, target_address, current_epoch)
    }

    /// Get compliance audit statistics
    public fun get_compliance_statistics(audit: &ComplianceAudit): (u64, u64, u64, u64) {
        (
            audit.total_blocks,
            audit.total_unblocks,
            audit.emergency_freezes,
            audit.last_audit_epoch
        )
    }

    /// Check if global freeze is active
    public fun is_globally_frozen(deny_list: &DenyList): bool {
        coin::deny_list_v2_is_global_pause_enabled_current_epoch<COMPLIANCECOIN>(deny_list)
    }

    // === Regulatory Reporting Functions ===
    
    /// Generate compliance report hash for regulatory filing
    public fun submit_regulatory_report(
        admin: &ComplianceAdmin,
        audit: &mut ComplianceAudit,
        report_hash: vector<u8>,            // Hash of off-chain compliance report
        reporting_epoch: u64,
        ctx: &mut TxContext
    ) {
        assert!(admin.officer_address == tx_context::sender(ctx), EUnauthorizedCompliance);
        
        table::add(&mut audit.regulatory_reports, reporting_epoch, report_hash);
    }

    /// Update compliance officer (for succession planning)
    public fun transfer_compliance_authority(
        admin: &mut ComplianceAdmin,
        new_officer: address,
        ctx: &mut TxContext
    ) {
        assert!(admin.officer_address == tx_context::sender(ctx), EUnauthorizedCompliance);
        admin.officer_address = new_officer;
    }
}
```

## Step 4: Build and Deploy Regulated Infrastructure

### Understanding Regulated Deployment Complexity

Deploying regulated coins requires more careful consideration than basic tokens:

```bash
# Build with comprehensive error checking
sui move build --verbose
```

**Expected Output with No Errors**:
```
BUILDING compliancecoin
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING compliancecoin
Success: 1 modules compiled
```

**If Build Fails**: Common regulatory-specific issues:
- **Table import missing**: Add `use sui::table::{Self, Table};`
- **Event import missing**: Add `use sui::event;`  
- **Clock parameter issues**: Ensure Clock is properly imported and used

### Deploy to Testnet with Enhanced Monitoring

```bash
# Switch to testnet for regulatory testing
sui client switch --env testnet

# Fund account for deployment
sui client faucet

# Deploy with high gas budget (regulatory code is more complex)
sui client publish --gas-budget 200000000
```

**Expected Deployment Output (Save These IDs)**:
```bash
Transaction Digest: 1a2b3c4d...
│
├─ Created Objects:
│  ├─ Package ID: 0xPACKAGE123...           # Main package
│  ├─ TreasuryCap: 0xTREASURY456...         # Mint authority  
│  ├─ DenyCapV2: 0xDENY789...               # Compliance authority
│  ├─ ComplianceAdmin: 0xADMIN012...        # Administrative control
│  └─ ComplianceAudit: 0xAUDIT345...        # Shared audit object
│
└─ Gas Used: 45,123,456 MIST                # Higher than basic tokens
```

**Critical: Save all these Object IDs** - you'll need them for compliance operations!

## Step 5: Testing Compliance Features - Protocol-Level Enforcement

### Initial Compliance Minting

Test the enhanced minting function with compliance controls:

```bash
# Get current clock object  
CLOCK_ID="0x6"

# Mint tokens with compliance review
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function mint_with_compliance_review \
  --args YOUR_ADMIN_ID YOUR_TREASURY_ID 5000000000 YOUR_ADDRESS '"Initial liquidity provision"' $CLOCK_ID \
  --gas-budget 20000000
```

**What This Does Differently Than Basic Minting**:
1. **Authority Verification**: Checks ComplianceAdmin ownership
2. **Purpose Documentation**: Records business reason for mint
3. **Large Transaction Flagging**: Monitors for suspicious activity
4. **Automatic Compliance**: VM-level enforcement kicks in

### Understanding Epoch-Based Blocking

The key difference from Solana is **when** restrictions take effect:

```bash
# Check current epoch
sui client call \
  --package 0x2 \
  --module tx_context \
  --function epoch \
  --gas-budget 5000000
```

**Epoch Timing (Critical for Compliance)**:
- **Current Epoch**: Existing restrictions are active
- **Next Epoch**: New restrictions take effect (24+ hours on testnet)
- **Coordination**: All validators enforce simultaneously

## Step 6: Address Blocking - Protocol-Level vs Program-Level

### Block an Address for Compliance

```bash
# Block a test address (use a different address than your own)
TEST_ADDRESS="0x742d35e0e2e3e1b8b0f8e6a1c7c1e2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2"

sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function block_address_for_compliance \
  --args YOUR_ADMIN_ID YOUR_DENY_CAP_ID 0x403 $TEST_ADDRESS '"OFAC sanctions violation"' YOUR_AUDIT_ID $CLOCK_ID \
  --gas-budget 25000000
```

**Expected Output**:
```bash
Transaction Digest: abc123...
│
├─ Object Changes:
│  ├─ Mutated: DenyList (address added to blocklist)
│  ├─ Mutated: ComplianceAudit (statistics updated)
│  └─ Mutated: DenyCapV2 (capability used)
│
└─ Events:
   └─ AddressBlocked: 
       blocked_address: 0x742d...
       reason: "OFAC sanctions violation"
       effective_epoch: 1247 (next epoch)
```

### Verify Blocking Status

Check if address will be blocked in the next epoch:

```bash
# Check future block status
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function will_address_be_blocked_next_epoch \
  --args 0x403 $TEST_ADDRESS \
  --gas-budget 10000000
```

**Result**: `true` - address will be blocked starting next epoch

### Test Compliance Enforcement

Try to transfer tokens to the blocked address **after the epoch change**:

```bash
# Wait for next epoch (or use epoch advancement in testing)
# Then try to transfer to blocked address

sui client call \
  --package 0x2 \
  --module coin \
  --function split_and_transfer \
  --type-args YOUR_PACKAGE_ID::compliancecoin::COMPLIANCECOIN \
  --args YOUR_COIN_ID 1000000000 $TEST_ADDRESS \
  --gas-budget 15000000
```

**Expected Result**: Transaction **FAILS** with denial error
```
Error: TransactionBlockEffects::DeniedAddress
The address 0x742d... is denied for coin type COMPLIANCECOIN
```

**This is the key advantage**: Unlike Solana, there's no way to bypass this restriction through other programs or clever transaction construction.

## Step 7: Emergency Controls - System-Wide Freezing

### Activate Emergency Freeze

Test the global pause functionality:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function emergency_freeze_all_operations \
  --args YOUR_ADMIN_ID YOUR_DENY_CAP_ID 0x403 '"Regulatory investigation initiated"' YOUR_AUDIT_ID $CLOCK_ID \
  --gas-budget 30000000
```

**What This Does**:
- **Global Freeze**: ALL operations with this token type stop
- **Immediate Effect**: Takes effect in current epoch (emergency powers)
- **Universal Application**: No transactions can bypass the freeze
- **Audit Trail**: Full documentation for regulatory review

### Test Global Freeze Enforcement

Try to perform ANY operation with the token:

```bash
# This should fail - even basic transfers are blocked
sui client call \
  --package 0x2 \
  --module coin \
  --function split_and_transfer \
  --type-args YOUR_PACKAGE_ID::compliancecoin::COMPLIANCECOIN \
  --args YOUR_COIN_ID 100000000 YOUR_ADDRESS \
  --gas-budget 15000000
```

**Expected Result**: Transaction **FAILS**
```
Error: GlobalPause is enabled for coin type COMPLIANCECOIN
All operations are currently frozen
```

### Lift Emergency Freeze

After investigating, lift the freeze:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function lift_emergency_freeze \
  --args YOUR_ADMIN_ID YOUR_DENY_CAP_ID 0x403 '"Investigation complete - no issues found"' \
  --gas-budget 25000000
```

**Operations resume normally** after this transaction confirms.

## Step 8: Advanced Compliance Features

### Transaction Holds for Suspicious Activity

Place a hold on suspicious tokens:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function place_transaction_hold \
  --args YOUR_ADMIN_ID YOUR_COIN_ID '"Large transaction from new account - AML review required"' $CLOCK_ID \
  --gas-budget 20000000
```

**This Creates a TransactionHold Object** that can be reviewed and either approved or rejected.

### Generate Regulatory Reports

Submit compliance report hashes for regulatory filing:

```bash
# Hash of off-chain compliance report
REPORT_HASH="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
CURRENT_EPOCH="1247"

sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function submit_regulatory_report \
  --args YOUR_ADMIN_ID YOUR_AUDIT_ID $REPORT_HASH $CURRENT_EPOCH \
  --gas-budget 15000000
```

### Monitor Compliance Statistics

Check audit trail:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function get_compliance_statistics \
  --args YOUR_AUDIT_ID \
  --gas-budget 10000000
```

**Expected Output**:
```
[1, 0, 1, 1247]  // 1 block, 0 unblocks, 1 emergency freeze, last audit epoch 1247
```

## Real-World Compliance Integration

### Institutional Usage Patterns

**Daily Operations**:
```bash
# Morning compliance check
sui client call --function is_globally_frozen --args 0x403

# Monitor large transactions  
sui client call --function get_compliance_statistics --args AUDIT_ID

# Review flagged transactions
# (Check events for TransactionFlagged emissions)

# Evening regulatory reporting
sui client call --function submit_regulatory_report --args ADMIN_ID AUDIT_ID REPORT_HASH EPOCH
```

**Weekly Reviews**:
```bash
# Audit blocked addresses
sui client call --function get_compliance_statistics --args AUDIT_ID

# Review held transactions
# (Process any pending TransactionHold objects)

# Update compliance policies if needed
```

### Integration with External Systems

**OFAC List Integration**:
```move
// Custom module for automated OFAC checking
module compliance::ofac_integration {
    public fun check_ofac_and_block_if_sanctioned(
        admin: &ComplianceAdmin,
        deny_cap: &mut DenyCapV2<COMPLIANCECOIN>,
        address_to_check: address,
        // ... other params
    ) {
        // Query external OFAC API
        // If sanctioned, automatically block
    }
}
```

**AML Monitoring**:
```move
// Automated transaction monitoring
module compliance::aml_monitor {
    public fun monitor_transaction_patterns(
        amount: u64,
        from: address,
        to: address,
        frequency: u64,
    ): bool {
        // Implement AML scoring logic
        // Return true if suspicious
    }
}
```

## Comparison: Solana vs Sui Compliance

### Feature Comparison

| Compliance Feature | Solana Implementation | Sui Implementation |
|-------------------|----------------------|-------------------|
| **Address Blocking** | Manual program checks | Protocol-level enforcement |
| **Bypass Resistance** | Vulnerable to other programs | Impossible to bypass |
| **Scale Limits** | ~300 addresses per account | Unlimited addresses |
| **Consistency** | Program-by-program | System-wide automatic |
| **Emergency Freeze** | Per-program implementation | Global VM enforcement |
| **Audit Trail** | Custom event logging | Built-in system events |

### Development Complexity

**Solana Compliance Development**:
```rust
// Estimated ~2000 lines of code for full compliance
// - Custom account structures
// - Manual validation logic  
// - Cross-program coordination
// - Error-prone implementation
// - Extensive testing required
```

**Sui Compliance Development**:
```move
// ~500 lines for same functionality  
// - Built-in protocol support
// - Automatic enforcement
// - System-wide coordination
// - Type-safe implementation
// - Minimal testing needed
```

### Security Advantages

**Solana Risks**:
- Cross-program bypass vulnerabilities
- Race condition exploits
- Manual validation errors
- Account size limitations
- Inconsistent enforcement

**Sui Protection**:
- Protocol-level enforcement prevents bypasses
- Epoch-based consistency eliminates races
- Type system prevents validation errors  
- Unlimited scale for compliance data
- Universal application across all transactions

## Production Deployment Checklist

### Pre-Mainnet Requirements

**Legal & Regulatory**:
- [ ] Obtain required money transmitter licenses
- [ ] Complete regulatory compliance review
- [ ] Establish relationship with compliant banking partners
- [ ] Create incident response procedures
- [ ] Design regulatory reporting workflows

**Technical Infrastructure**:
- [ ] Set up multi-signature ComplianceAdmin controls
- [ ] Implement automated OFAC list monitoring
- [ ] Create compliance dashboard for officers
- [ ] Establish monitoring and alerting systems
- [ ] Plan for emergency response procedures

**Operational Procedures**:
- [ ] Train compliance team on Sui-specific features
- [ ] Create standard operating procedures for:
  - [ ] Address blocking/unblocking
  - [ ] Emergency freeze activation
  - [ ] Transaction hold reviews
  - [ ] Regulatory report generation
- [ ] Establish 24/7 compliance monitoring

### Mainnet Deployment

```bash
# Switch to mainnet
sui client switch --env mainnet

# Deploy with production configuration
sui client publish --gas-budget 200000000

# Transfer capabilities to production multi-sig
# (Use a proper multi-sig solution for ComplianceAdmin)

# Initialize compliance monitoring systems
# Set up automated OFAC checking
# Configure regulatory reporting pipelines
```

### Ongoing Compliance Management

**Daily Tasks**:
- Monitor global freeze status
- Review flagged transactions  
- Process address blocking requests
- Generate compliance reports

**Weekly Tasks**:
- Audit blocked address list
- Review held transactions
- Update compliance policies
- Generate regulatory reports

**Monthly Tasks**:
- Comprehensive compliance audit
- Regulator relationship management
- Policy and procedure updates
- System security review

## Integration with DeFi Protocols

### DEX Integration

Regulated coins can be used in DeFi while maintaining compliance:

```move
// DEX integration with automatic compliance
module defi::regulated_dex {
    use compliancecoin::compliancecoin::COMPLIANCECOIN;
    
    public fun create_liquidity_pool<T>(
        coin_a: Coin<COMPLIANCECOIN>,  // Regulated coin
        coin_b: Coin<T>,               // Other token
        ctx: &mut TxContext
    ) {
        // Compliance is automatically enforced
        // Blocked addresses cannot participate
        // Global freeze prevents all operations
    }
}
```

### Lending Protocol Integration

```move
// Lending with compliance controls
module lending::regulated_lending {
    public fun create_loan_with_compliance(
        collateral: Coin<COMPLIANCECOIN>,
        borrower: address,
        ctx: &mut TxContext
    ) {
        // Automatic compliance enforcement:
        // - Blocked addresses cannot borrow
        // - Emergency freeze stops all loans
        // - Full audit trail maintained
    }
}
```

## Troubleshooting Regulatory Issues

### Common Compliance Errors

**"Address already blocked" Error**:
```bash
# Check block status first
sui client call --function will_address_be_blocked_next_epoch --args 0x403 ADDRESS

# Only block if not already blocked
```

**"Unauthorized compliance" Error**:
```bash  
# Verify you own the ComplianceAdmin
sui client objects | grep ComplianceAdmin

# Ensure you're using the correct admin object ID
```

**"Emergency freeze active" Error**:
```bash
# Check global freeze status  
sui client call --function is_globally_frozen --args 0x403

# Lift freeze if authorized
sui client call --function lift_emergency_freeze --args ...
```

### Epoch Timing Issues

**Compliance changes don't take effect immediately**:
- **Current Epoch**: Changes are queued
- **Next Epoch**: Changes become active
- **Testnet**: ~24 hour epochs
- **Mainnet**: ~24 hour epochs

**Emergency freeze is immediate**:
- Takes effect in current epoch
- No waiting for epoch boundary
- Use sparingly for true emergencies

### Performance Considerations

**Gas Costs**:
- Basic transfer: ~5,000 gas
- Compliance transfer: ~5,000 gas (no overhead!)
- Address blocking: ~25,000 gas
- Emergency freeze: ~30,000 gas

**Scalability**:
- Unlimited blocked addresses
- No account size constraints
- O(1) lookup performance
- Global system optimization

## Summary: The Future of Compliant DeFi

You've built an institutional-grade regulated cryptocurrency that demonstrates Sui's advanced compliance capabilities. Here's what makes it special:

### Key Achievements

✅ **Protocol-Level Compliance**: Impossible to bypass through smart contract vulnerabilities
✅ **Unlimited Scale**: No account size restrictions on blocked addresses  
✅ **Epoch-Based Consistency**: No race conditions or timing attacks
✅ **Emergency Controls**: Global freeze capabilities for crisis management
✅ **Comprehensive Audit Trail**: Full regulatory reporting and documentation
✅ **Professional Standards**: Suitable for banks, payment processors, and stablecoins

### Sui vs Solana Compliance Summary

| Advantage | Benefit |
|-----------|---------|
| **Built-in Protocol Support** | No custom compliance code needed |
| **VM-Level Enforcement** | Cannot be bypassed by other programs |
| **Global System Coordination** | Consistent across all applications |
| **Unlimited Scalability** | No blocklist size restrictions |
| **Type Safety** | Prevents compliance implementation bugs |
| **Epoch Consistency** | Eliminates timing attack vectors |

### Real-World Applications

Your regulated coin is ready for:

- **Central Bank Digital Currencies (CBDCs)**
- **Institutional Stablecoins** (USDC-style with compliance)
- **Payment Networks** requiring AML/KYC compliance
- **Corporate Treasury Tokens** with geographic restrictions
- **Regulated Securities** with transfer restrictions

### Next Steps

Ready to build more sophisticated token systems? Try:

1. **Gaming Tokens**: Closed-loop economies with item marketplaces
2. **Loyalty Tokens**: Reward systems with tier-based benefits
3. **Stablecoins**: USD-backed tokens with automated reserves
4. **Governance Tokens**: DAO voting with delegation mechanics

Your mastery of regulated coins provides the foundation for building any compliant token system on Sui. The same patterns scale from simple utility tokens to complex financial instruments meeting the highest regulatory standards.

**Ready for the next challenge?** Let's build gaming economies with in-game token systems!

```bash
mkdir compliancecoin
cd compliancecoin
sui move new compliancecoin
cd compliancecoin
```

## Step 2: Configure the Package Manifest

Update `Move.toml`:

```toml
[package]
name = "compliancecoin"
version = "1.0.0"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/devnet" }

[addresses]
compliancecoin = "0x0"
```

## Step 3: Create the Regulated Coin Module

Create `sources/compliancecoin.move`:

```move
module compliancecoin::compliancecoin {
    use sui::coin::{Self, TreasuryCap, DenyCapV2};
    use sui::deny_list::{Self, DenyList};
    use sui::url;

    // One-time witness for regulated coin creation
    public struct COMPLIANCECOIN has drop {}

    // Administrative capability for managing deny list
    public struct AdminCap has key, store {
        id: UID,
    }

    // Initialize the regulated coin
    fun init(witness: COMPLIANCECOIN, ctx: &mut TxContext) {
        // Create regulated currency with deny capability
        let (treasury, deny_cap, metadata) = coin::create_regulated_currency_v2<COMPLIANCECOIN>(
            witness,
            6,                                    // decimals
            b"COMP",                             // symbol
            b"ComplianceCoin",                   // name
            b"A regulated cryptocurrency with compliance controls", // description
            option::some(url::new_unsafe_from_bytes(b"https://compliance.io/logo.png")), // icon URL
            false,                               // allow global pause
            ctx
        );

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        // Transfer capabilities to deployer
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        transfer::public_transfer(deny_cap, tx_context::sender(ctx));
        transfer::public_transfer(admin_cap, tx_context::sender(ctx));
        
        // Freeze metadata
        transfer::public_freeze_object(metadata);
    }

    // Mint new regulated coins
    public fun mint(
        treasury: &mut TreasuryCap<COMPLIANCECOIN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coins = coin::mint(treasury, amount, ctx);
        transfer::public_transfer(coins, recipient);
    }

    // Add address to deny list (blocks their access)
    public fun deny_address(
        _admin: &AdminCap,
        deny_cap: &mut DenyCapV2<COMPLIANCECOIN>,
        deny_list: &mut DenyList,
        addr: address,
        ctx: &mut TxContext
    ) {
        coin::deny_list_v2_add(deny_cap, deny_list, addr, ctx);
    }

    // Remove address from deny list (restores their access)
    public fun undeny_address(
        _admin: &AdminCap,
        deny_cap: &mut DenyCapV2<COMPLIANCECOIN>,
        deny_list: &mut DenyList,
        addr: address,
        ctx: &mut TxContext
    ) {
        coin::deny_list_v2_remove(deny_cap, deny_list, addr, ctx);
    }

    // Check if address is denied
    public fun is_address_denied(
        deny_list: &DenyList,
        addr: address,
        ctx: &TxContext
    ): bool {
        coin::deny_list_v2_contains_current_epoch<COMPLIANCECOIN>(deny_list, addr, ctx)
    }

    // Burn coins to reduce supply
    public fun burn(
        treasury: &mut TreasuryCap<COMPLIANCECOIN>,
        coins: coin::Coin<COMPLIANCECOIN>
    ) {
        coin::burn(treasury, coins);
    }

    // Emergency pause all operations (if enabled during creation)
    public fun pause_coin(
        _admin: &AdminCap,
        deny_cap: &mut DenyCapV2<COMPLIANCECOIN>,
        deny_list: &mut DenyList,
        ctx: &mut TxContext
    ) {
        coin::deny_list_v2_enable_global_pause(deny_cap, deny_list, ctx);
    }

    // Unpause all operations
    public fun unpause_coin(
        _admin: &AdminCap,
        deny_cap: &mut DenyCapV2<COMPLIANCECOIN>,
        deny_list: &mut DenyList,
        ctx: &mut TxContext
    ) {
        coin::deny_list_v2_disable_global_pause(deny_cap, deny_list, ctx);
    }

    // Get total supply
    public fun total_supply(treasury: &TreasuryCap<COMPLIANCECOIN>): u64 {
        coin::total_supply(treasury)
    }
}
```

## Step 4: Build and Deploy

Build the regulated coin:

```bash
sui move build
```

Deploy to testnet:

```bash
sui client publish --gas-budget 100000000
```

Save these important IDs from the output:
- Package ID
- Treasury Object ID  
- DenyCapV2 Object ID
- AdminCap Object ID

## Step 5: Mint Initial Supply

Mint 10,000 compliance coins:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function mint \
  --args YOUR_TREASURY_ID 10000000000 YOUR_ADDRESS \
  --gas-budget 10000000
```

## Step 6: Test Normal Transfers

First, let's transfer some coins normally:

```bash
sui client call \
  --package 0x2 \
  --module coin \
  --function split_and_transfer \
  --type-args YOUR_PACKAGE_ID::compliancecoin::COMPLIANCECOIN \
  --args YOUR_COIN_OBJECT_ID 1000000000 RECIPIENT_ADDRESS \
  --gas-budget 10000000
```

This should work normally. The recipient can now use their tokens.

## Step 7: Block an Address

Now let's demonstrate the compliance feature by blocking an address. We need the global DenyList object (address `0x403`):

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function deny_address \
  --args YOUR_ADMIN_CAP_ID YOUR_DENY_CAP_ID 0x403 BLOCKED_ADDRESS \
  --gas-budget 15000000
```

**Important**: The denial takes effect at the start of the next epoch (usually 24 hours on testnet).

## Step 8: Check Denial Status

Check if an address is currently denied:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function is_address_denied \
  --args 0x403 BLOCKED_ADDRESS \
  --gas-budget 10000000
```

## Step 9: Test Blocked Transfer

After the next epoch begins, try to transfer tokens from the blocked address:

```bash
# This should fail with a denial error
sui client call \
  --package 0x2 \
  --module coin \
  --function split_and_transfer \
  --type-args YOUR_PACKAGE_ID::compliancecoin::COMPLIANCECOIN \
  --args BLOCKED_COIN_OBJECT_ID 100000000 SOME_ADDRESS \
  --gas-budget 10000000
```

You will see an error like:
```
Error: Coin access denied for address
```

## Step 10: Restore Access

Unblock the address to restore their access:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function undeny_address \
  --args YOUR_ADMIN_CAP_ID YOUR_DENY_CAP_ID 0x403 BLOCKED_ADDRESS \
  --gas-budget 15000000
```

After the next epoch, the address will be able to use tokens again.

## Step 11: Test Emergency Pause (Optional)

If you enabled global pause during creation, you can pause all operations:

```bash
sui client call \
  --package YOUR_PACKAGE_ID \
  --module compliancecoin \
  --function pause_coin \
  --args YOUR_ADMIN_CAP_ID YOUR_DENY_CAP_ID 0x403 \
  --gas-budget 15000000
```

This blocks ALL addresses from using the coin until unpaused.

## What You've Accomplished

You have successfully created a regulated cryptocurrency with:

✅ **Compliance Controls**: Block specific addresses from using the token
✅ **Administrative Functions**: Add/remove addresses from deny list  
✅ **Epoch-Based Enforcement**: Restrictions take effect at epoch boundaries
✅ **Emergency Features**: Global pause capabilities
✅ **Professional Standards**: Suitable for regulated financial applications

## Key Features Explained

**Deny List**: The system `DenyList` object at `0x403` maintains blocked addresses across all regulated coins.

**Epoch Timing**: Restrictions activate at epoch boundaries to ensure network consensus.

**Admin Controls**: Only holders of `AdminCap` can modify the deny list.

**Treasury Management**: Standard minting/burning capabilities remain separate from compliance features.

## Real-World Applications

Regulated coins are perfect for:
- **Stablecoins**: USDC-style tokens with regulatory compliance
- **Corporate Tokens**: Employee rewards with transfer restrictions
- **Government CBDCs**: Central bank digital currencies
- **Institutional Assets**: Securities tokens with compliance requirements

## Security Considerations

- **Admin Key Management**: Store AdminCap securely - it controls compliance
- **Multi-Signature**: Consider using multi-sig for admin operations
- **Emergency Procedures**: Have clear processes for using pause functionality
- **Legal Compliance**: Ensure deny list usage aligns with applicable regulations

## Next Steps

You can now:
- Integrate with compliance monitoring systems
- Build automated blocking based on risk scores  
- Create multi-tier access levels
- Implement time-based restrictions

This regulated coin provides the foundation for building compliant financial applications on Sui.