

module swans::brand {
    use sui::object::{Self, ID, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use std::string::String;
    use std::vector;
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::types;

    // Mock USDC token type
    public struct USDC has drop {}

    // ===== Brand Struct =====
    public struct Brand has key, store {
        id: UID,
        brand_id: String,
        brand_name: String,
        owner: address,
        token_balance: Balance<USDC>,
        reputation: u8, // 1-5 stars
        joined_at: u64,
        profile_image: String,
        description: String,
        active_campaigns: vector<ID>,
        total_campaigns_created: u64,
        total_spent: u64,
    }

    // ===== Events =====
    public struct BrandRegistered has copy, drop {
        brand_id: String,
        brand_name: String,
        owner: address,
    }

    public struct BrandFunded has copy, drop {
        brand_id: String,
        amount: u64,
    }

    // ===== Brand Management =====

    /// Register a new brand
    public entry fun register_brand(
        registry: &mut PlatformRegistry,
        brand_id: String,
        brand_name: String,
        profile_image: String,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check if brand ID is already taken
        assert!(!registry::is_brand_registered(registry, brand_id), types::err_invalid_status());

        let brand = Brand {
            id: object::new(ctx),
            brand_id,
            brand_name,
            owner: tx_context::sender(ctx),
            token_balance: balance::zero(),
            reputation: 5, // Start with max reputation
            joined_at: clock::timestamp_ms(clock),
            profile_image,
            description,
            active_campaigns: vector::empty(),
            total_campaigns_created: 0,
            total_spent: 0,
        };

        let brand_object_id = object::id(&brand);
        registry::register_brand_in_registry(registry, brand.brand_id, brand_object_id);

        sui::event::emit(BrandRegistered {
            brand_id: brand.brand_id,
            brand_name: brand.brand_name,
            owner: brand.owner,
        });
        
        transfer::transfer(brand, tx_context::sender(ctx));
    }

    /// Fund brand account with USDC
    public entry fun fund_brand_account(
        brand: &mut Brand,
        payment: Coin<USDC>,
        ctx: &mut TxContext
    ) {
        assert!(brand.owner == tx_context::sender(ctx), types::err_not_authorized());
        
        let amount = coin::value(&payment);
        let coin_balance = coin::into_balance(payment);
        balance::join(&mut brand.token_balance, coin_balance);

        sui::event::emit(BrandFunded {
            brand_id: brand.brand_id,
            amount,
        });
    }

    /// Withdraw funds from brand account
    public entry fun withdraw_brand_funds(
        brand: &mut Brand,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(brand.owner == tx_context::sender(ctx), types::err_not_authorized());
        assert!(balance::value(&brand.token_balance) >= amount, types::err_insufficient_funds());

        let withdrawn_balance = balance::split(&mut brand.token_balance, amount);
        let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);
        transfer::public_transfer(withdrawn_coin, tx_context::sender(ctx));
    }

    /// Update brand profile
    public entry fun update_brand_profile(
        brand: &mut Brand,
        brand_name: String,
        profile_image: String,
        description: String,
        ctx: &mut TxContext
    ) {
        assert!(brand.owner == tx_context::sender(ctx), types::err_not_authorized());
        
        brand.brand_name = brand_name;
        brand.profile_image = profile_image;
        brand.description = description;
    }

    /// Add campaign to brand's active campaigns list
    public fun add_campaign_to_brand(brand: &mut Brand, campaign_id: ID) {
        vector::push_back(&mut brand.active_campaigns, campaign_id);
        brand.total_campaigns_created = brand.total_campaigns_created + 1;
    }

    /// Remove campaign from brand's active campaigns list
    public fun remove_campaign_from_brand(brand: &mut Brand, campaign_id: ID) {
        let (found, index) = vector::index_of(&brand.active_campaigns, &campaign_id);
        if (found) {
            vector::remove(&mut brand.active_campaigns, index);
        };
    }

    /// Deduct funds from brand balance (used by campaigns)
    public fun deduct_brand_funds(brand: &mut Brand, amount: u64): Balance<USDC> {
        assert!(balance::value(&brand.token_balance) >= amount, types::err_insufficient_funds());
        brand.total_spent = brand.total_spent + amount;
        balance::split(&mut brand.token_balance, amount)
    }

    /// Update brand reputation
    public entry fun update_brand_reputation(
        brand: &mut Brand,
        new_reputation: u8,
        ctx: &mut TxContext
    ) {
        // This would typically be called by the admin or through a rating system
        assert!(new_reputation >= 1 && new_reputation <= 5, types::err_invalid_status());
        brand.reputation = new_reputation;
    }

    // ===== View Functions =====

    public fun get_brand_id(brand: &Brand): String {
        brand.brand_id
    }

    public fun get_brand_name(brand: &Brand): String {
        brand.brand_name
    }

    public fun get_brand_owner(brand: &Brand): address {
        brand.owner
    }

    public fun get_brand_balance(brand: &Brand): u64 {
        balance::value(&brand.token_balance)
    }

    public fun get_brand_reputation(brand: &Brand): u8 {
        brand.reputation
    }

    public fun get_active_campaigns_count(brand: &Brand): u64 {
        vector::length(&brand.active_campaigns)
    }

    public fun get_total_campaigns_created(brand: &Brand): u64 {
        brand.total_campaigns_created
    }

    public fun get_total_spent(brand: &Brand): u64 {
        brand.total_spent
    }

    public fun is_brand_owner(brand: &Brand, addr: address): bool {
        brand.owner == addr
    }
}