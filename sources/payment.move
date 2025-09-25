module swans::payment {
    use sui::event;
    use std::string::{Self, String};
    
    use swans::types::{Self, PaymentType};

    // ===== Payment Receipt Struct =====
    public struct PaymentReceipt has key, store {
        id: UID,
        payment_type: PaymentType,
        amount: u64,
        campaign_id: String,
        recipient_id: String,
        recipient_address: address,
        payment_timestamp: u64,
        transaction_hash: String,
        description: String,
    }

    // ===== Events =====
    public struct PaymentProcessed has copy, drop {
        campaign_id: String,
        recipient_id: String,
        amount: u64,
        payment_type: u8,
        transaction_hash: String,
    }

    public struct PaymentReceiptCreated has copy, drop {
        receipt_id: String,
        payment_type: u8,
        amount: u64,
        recipient_id: String,
    }

    // ===== Payment Receipt Management =====

    /// Create a base payment receipt
    public fun create_base_payment_receipt(
        campaign_id: String,
        recipient_id: String,
        recipient_address: address,
        amount: u64,
        payment_timestamp: u64,
        ctx: &mut TxContext
    ) {
        let receipt = PaymentReceipt {
            id: object::new(ctx),
            payment_type: types::new_payment_type(types::payment_base()),
            amount,
            campaign_id,
            recipient_id,
            recipient_address,
            payment_timestamp,
            transaction_hash: generate_transaction_hash(ctx),
            description: string::utf8(b"Base payment for content publication"),
        };

        let receipt_id_str = generate_receipt_id(&receipt.id);

        event::emit(PaymentReceiptCreated {
            receipt_id: receipt_id_str,
            payment_type: types::payment_base(),
            amount,
            recipient_id,
        });

        event::emit(PaymentProcessed {
            campaign_id,
            recipient_id,
            amount,
            payment_type: types::payment_base(),
            transaction_hash: receipt.transaction_hash,
        });

        transfer::transfer(receipt, recipient_address);
    }

    /// Create a bonus payment receipt
    public fun create_bonus_payment_receipt(
        campaign_id: String,
        recipient_id: String,
        recipient_address: address,
        amount: u64,
        payment_timestamp: u64,
        ctx: &mut TxContext
    ) {
        let receipt = PaymentReceipt {
            id: object::new(ctx),
            payment_type: types::new_payment_type(types::payment_bonus()),
            amount,
            campaign_id,
            recipient_id,
            recipient_address,
            payment_timestamp,
            transaction_hash: generate_transaction_hash(ctx),
            description: string::utf8(b"Bonus payment based on engagement metrics"),
        };

        let receipt_id_str = generate_receipt_id(&receipt.id);

        event::emit(PaymentReceiptCreated {
            receipt_id: receipt_id_str,
            payment_type: types::payment_bonus(),
            amount,
            recipient_id,
        });

        event::emit(PaymentProcessed {
            campaign_id,
            recipient_id,
            amount,
            payment_type: types::payment_bonus(),
            transaction_hash: receipt.transaction_hash,
        });

        transfer::transfer(receipt, recipient_address);
    }

    /// Create a custom payment receipt
    public fun create_custom_payment_receipt(
        payment_type: u8,
        campaign_id: String,
        recipient_id: String,
        recipient_address: address,
        amount: u64,
        payment_timestamp: u64,
        description: String,
        ctx: &mut TxContext
    ) {
        let receipt = PaymentReceipt {
            id: object::new(ctx),
            payment_type: types::new_payment_type(payment_type),
            amount,
            campaign_id,
            recipient_id,
            recipient_address,
            payment_timestamp,
            transaction_hash: generate_transaction_hash(ctx),
            description,
        };

        let receipt_id_str = generate_receipt_id(&receipt.id);

        event::emit(PaymentReceiptCreated {
            receipt_id: receipt_id_str,
            payment_type,
            amount,
            recipient_id,
        });

        event::emit(PaymentProcessed {
            campaign_id,
            recipient_id,
            amount,
            payment_type,
            transaction_hash: receipt.transaction_hash,
        });

        transfer::transfer(receipt, recipient_address);
    }

    // ===== Helper Functions =====

    /// Generate a transaction hash (simplified for demo)
    fun generate_transaction_hash(_ctx: &TxContext): String {
        // In a real implementation, this would use the actual transaction digest
        string::utf8(b"sui_tx_hash_placeholder")
    }

    /// Generate a receipt ID from UID
    fun generate_receipt_id(_uid: &UID): String {
        // In a real implementation, this would convert the UID to a string
        string::utf8(b"receipt_id_placeholder")
    }

    // ===== View Functions =====

    public fun get_payment_type(receipt: &PaymentReceipt): u8 {
        types::payment_type_value(&receipt.payment_type)
    }

    public fun get_amount(receipt: &PaymentReceipt): u64 {
        receipt.amount
    }

    public fun get_campaign_id(receipt: &PaymentReceipt): String {
        receipt.campaign_id
    }

    public fun get_recipient_id(receipt: &PaymentReceipt): String {
        receipt.recipient_id
    }

    public fun get_recipient_address(receipt: &PaymentReceipt): address {
        receipt.recipient_address
    }

    public fun get_payment_timestamp(receipt: &PaymentReceipt): u64 {
        receipt.payment_timestamp
    }

    public fun get_transaction_hash(receipt: &PaymentReceipt): String {
        receipt.transaction_hash
    }

    public fun get_description(receipt: &PaymentReceipt): String {
        receipt.description
    }

    public fun is_base_payment(receipt: &PaymentReceipt): bool {
        types::payment_type_value(&receipt.payment_type) == types::payment_base()
    }

    public fun is_bonus_payment(receipt: &PaymentReceipt): bool {
        types::payment_type_value(&receipt.payment_type) == types::payment_bonus()
    }

    // ===== Payment Analysis Functions =====

    /// Calculate total payments made to a recipient
    public fun calculate_total_earnings(receipts: &vector<PaymentReceipt>): u64 {
        let mut total = 0;
        let mut i = 0;
        while (i < std::vector::length(receipts)) {
            let receipt = std::vector::borrow(receipts, i);
            total = total + receipt.amount;
            i = i + 1;
        };
        total
    }

    /// Count payments by type
    public fun count_payment_types(receipts: &vector<PaymentReceipt>): (u64, u64) {
        let mut base_count = 0;
        let mut bonus_count = 0;
        let mut i = 0;
        
        while (i < std::vector::length(receipts)) {
            let receipt = std::vector::borrow(receipts, i);
            if (is_base_payment(receipt)) {
                base_count = base_count + 1;
            } else if (is_bonus_payment(receipt)) {
                bonus_count = bonus_count + 1;
            };
            i = i + 1;
        };
        
        (base_count, bonus_count)
    }
}