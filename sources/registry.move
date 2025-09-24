module swans::registry {
    use sui::object::{Self, ID, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use std::string::String;

    // ===== Platform Registry =====
    public struct PlatformRegistry has key {
        id: UID,
        admin: address,
        brands: Table<String, ID>, // brand_id -> Brand object ID
        creators: Table<String, ID>, // creator_id -> Creator object ID
        campaigns: Table<String, ID>, // campaign_id -> Campaign object ID
    }

    /// Initialize the platform registry - called once on deploy
    fun init(ctx: &mut TxContext) {
        let registry = PlatformRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            brands: table::new(ctx),
            creators: table::new(ctx),
            campaigns: table::new(ctx),
        };
        
        transfer::share_object(registry);
    }

    /// Initialize the platform registry for testing
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let registry = PlatformRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            brands: table::new(ctx),
            creators: table::new(ctx),
            campaigns: table::new(ctx),
        };

        transfer::share_object(registry);
    }

    // ===== Registry Management =====
    
    /// Register a brand in the platform registry
    public fun register_brand_in_registry(
        registry: &mut PlatformRegistry,
        brand_id: String,
        brand_object_id: ID
    ) {
        table::add(&mut registry.brands, brand_id, brand_object_id);
    }

    /// Register a creator in the platform registry
    public fun register_creator_in_registry(
        registry: &mut PlatformRegistry,
        creator_id: String,
        creator_object_id: ID
    ) {
        table::add(&mut registry.creators, creator_id, creator_object_id);
    }

    /// Register a campaign in the platform registry
    public fun register_campaign_in_registry(
        registry: &mut PlatformRegistry,
        campaign_id: String,
        campaign_object_id: ID
    ) {
        table::add(&mut registry.campaigns, campaign_id, campaign_object_id);
    }

    // ===== Query Functions =====
    
    /// Check if brand is registered
    public fun is_brand_registered(registry: &PlatformRegistry, brand_id: String): bool {
        table::contains(&registry.brands, brand_id)
    }

    /// Check if creator is registered
    public fun is_creator_registered(registry: &PlatformRegistry, creator_id: String): bool {
        table::contains(&registry.creators, creator_id)
    }

    /// Check if campaign is registered
    public fun is_campaign_registered(registry: &PlatformRegistry, campaign_id: String): bool {
        table::contains(&registry.campaigns, campaign_id)
    }

    /// Get brand object ID
    public fun get_brand_id(registry: &PlatformRegistry, brand_id: String): ID {
        *table::borrow(&registry.brands, brand_id)
    }

    /// Get creator object ID
    public fun get_creator_id(registry: &PlatformRegistry, creator_id: String): ID {
        *table::borrow(&registry.creators, creator_id)
    }

    /// Get campaign object ID
    public fun get_campaign_id(registry: &PlatformRegistry, campaign_id: String): ID {
        *table::borrow(&registry.campaigns, campaign_id)
    }

    /// Get admin address
    public fun get_admin(registry: &PlatformRegistry): address {
        registry.admin
    }

    // ===== Admin Functions =====
    
    /// Transfer admin rights
    public entry fun transfer_admin(
        registry: &mut PlatformRegistry,
        new_admin: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, 0);
        registry.admin = new_admin;
    }

    /// Remove brand from registry (admin only)
    public entry fun remove_brand(
        registry: &mut PlatformRegistry,
        brand_id: String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, 0);
        table::remove(&mut registry.brands, brand_id);
    }

    /// Remove creator from registry (admin only)
    public entry fun remove_creator(
        registry: &mut PlatformRegistry,
        creator_id: String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, 0);
        table::remove(&mut registry.creators, creator_id);
    }
}