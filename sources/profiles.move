/// Brand and Creator profile management module
module swans::profiles {
    use std::string::{Self, String};
    use sui::clock::{Self, Clock};
    

    // === Error Constants ===
    const EINVALID_REPUTATION: u64 = 1;
    const EUNAUTHORIZED: u64 = 2;

    // === Core Structs ===

    /// Social media handle verification
    public struct SocialHandles has store, copy, drop {
        twitter_handle: Option<String>,
        instagram_handle: Option<String>,
        tiktok_handle: Option<String>,
        youtube_handle: Option<String>,
    }

    /// Brand profile object
    public struct Brand has key, store {
        id: UID,
        brand_id: String,                  // Unique brand identifier
        brand_name: String,                // Brand display name
        token_wallet: address,             // Payment wallet address
        brand_coin_balance: u64,           // USDC balance tracking
        reputation: u64,                   // 5-star rating (0-5000, scaled by 1000)
        joined_at: u64,                    // Registration timestamp
        profile_image_url: String,         // Profile image URL
        description: String,               // Brand description
        total_campaigns: u64,              // Campaign count
        total_spent: u64,                  // Total USDC spent
    }

    /// Creator profile object
    public struct Creator has key, store {
        id: UID,
        creator_id: String,                // Unique creator identifier
        name: String,                      // Creator display name
        token_wallet: address,             // Payment wallet address
        reputation: u64,                   // 5-star rating (0-5000)
        joined_at: u64,                    // Registration timestamp
        profile_image_url: String,         // Profile image URL
        rank: u64,                         // Creator ranking score
        total_campaigns: u64,              // Campaigns participated
        total_earned: u64,                 // Total USDC earned
        social_handles: SocialHandles,     // Social media accounts
    }

    /// Brand capability for campaign management
    public struct BrandCap has key, store {
        id: UID,
        brand_id: ID,                      // Associated brand
    }

    /// Creator capability for applications and content
    public struct CreatorCap has key, store {
        id: UID,
        creator_id: ID,                    // Associated creator
    }

    /// Master admin capability for platform
    public struct AdminCap has key, store {
        id: UID,
    }

    // === Public Functions ===

    /// Create a new brand profile
    public fun create_brand_profile(
        brand_id: String,
        brand_name: String,
        description: String,
        profile_image_url: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let brand_uid = object::new(ctx);
        let brand_obj_id = object::uid_to_inner(&brand_uid);
        
        let brand = Brand {
            id: brand_uid,
            brand_id,
            brand_name,
            token_wallet: tx_context::sender(ctx),
            brand_coin_balance: 0,
            reputation: 0,
            joined_at: clock::timestamp_ms(clock),
            profile_image_url,
            description,
            total_campaigns: 0,
            total_spent: 0,
        };

        let brand_cap = BrandCap {
            id: object::new(ctx),
            brand_id: brand_obj_id,
        };

        // Transfer both objects to the brand
        transfer::public_transfer(brand, tx_context::sender(ctx));
        transfer::public_transfer(brand_cap, tx_context::sender(ctx));
    }

    /// Create a new creator profile
    public fun create_creator_profile(
        creator_id: String,
        name: String,
        profile_image_url: String,
        twitter_handle: Option<String>,
        instagram_handle: Option<String>,
        tiktok_handle: Option<String>,
        youtube_handle: Option<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let creator_uid = object::new(ctx);
        let creator_obj_id = object::uid_to_inner(&creator_uid);
        
        let social_handles = SocialHandles {
            twitter_handle,
            instagram_handle,
            tiktok_handle,
            youtube_handle,
        };

        let creator = Creator {
            id: creator_uid,
            creator_id,
            name,
            token_wallet: tx_context::sender(ctx),
            reputation: 0,
            joined_at: clock::timestamp_ms(clock),
            profile_image_url,
            rank: 0,
            total_campaigns: 0,
            total_earned: 0,
            social_handles,
        };

        let creator_cap = CreatorCap {
            id: object::new(ctx),
            creator_id: creator_obj_id,
        };

        // Transfer both objects to the creator
        transfer::public_transfer(creator, tx_context::sender(ctx));
        transfer::public_transfer(creator_cap, tx_context::sender(ctx));
    }

    /// Update brand profile information
    public fun update_brand_profile(
        brand_cap: &BrandCap,
        brand: &mut Brand,
        brand_name: String,
        description: String,
        profile_image_url: String,
        _ctx: &mut TxContext
    ) {
        // Verify brand cap matches brand object
        assert!(brand_cap.brand_id == object::uid_to_inner(&brand.id), EUNAUTHORIZED);
        
        brand.brand_name = brand_name;
        brand.description = description;
        brand.profile_image_url = profile_image_url;
    }

    /// Update creator profile information
    public fun update_creator_profile(
        creator_cap: &CreatorCap,
        creator: &mut Creator,
        name: String,
        profile_image_url: String,
        twitter_handle: Option<String>,
        instagram_handle: Option<String>,
        tiktok_handle: Option<String>,
        youtube_handle: Option<String>,
        _ctx: &mut TxContext
    ) {
        // Verify creator cap matches creator object
        assert!(creator_cap.creator_id == object::uid_to_inner(&creator.id), EUNAUTHORIZED);
        
        creator.name = name;
        creator.profile_image_url = profile_image_url;
        creator.social_handles = SocialHandles {
            twitter_handle,
            instagram_handle,
            tiktok_handle,
            youtube_handle,
        };
    }

    /// Update brand reputation (admin only)
    public fun update_brand_reputation(
        _admin_cap: &AdminCap,
        brand: &mut Brand,
        new_reputation: u64,
        _ctx: &mut TxContext
    ) {
        assert!(new_reputation <= 5000, EINVALID_REPUTATION);
        brand.reputation = new_reputation;
    }

    /// Update creator reputation (admin only)
    public fun update_creator_reputation(
        _admin_cap: &AdminCap,
        creator: &mut Creator,
        new_reputation: u64,
        new_rank: u64,
        _ctx: &mut TxContext
    ) {
        assert!(new_reputation <= 5000, EINVALID_REPUTATION);
        creator.reputation = new_reputation;
        creator.rank = new_rank;
    }

    /// Increment brand campaign count and total spent
    public fun increment_brand_stats(
        brand: &mut Brand,
        amount_spent: u64,
    ) {
        brand.total_campaigns = brand.total_campaigns + 1;
        brand.total_spent = brand.total_spent + amount_spent;
    }

    /// Increment creator campaign count and total earned
    public fun increment_creator_stats(
        creator: &mut Creator,
        amount_earned: u64,
    ) {
        creator.total_campaigns = creator.total_campaigns + 1;
        creator.total_earned = creator.total_earned + amount_earned;
    }

    // === Getter Functions ===

    public fun get_brand_id(brand_cap: &BrandCap): ID {
        brand_cap.brand_id
    }

    public fun get_creator_id(creator_cap: &CreatorCap): ID {
        creator_cap.creator_id
    }

    public fun get_brand_id_string(brand: &Brand): String {
        brand.brand_id
    }

    public fun get_creator_id_string(_creator_cap: &CreatorCap): String {
        // Note: This function signature needs to match usage in campaign.move
        // In practice, you'd need access to the Creator object to get the string ID
        // For now, we'll return a placeholder
        string::utf8(b"creator_placeholder")
    }

    public fun get_brand_name(brand: &Brand): String {
        brand.brand_name
    }

    public fun get_creator_name(creator: &Creator): String {
        creator.name
    }

    public fun get_brand_reputation(brand: &Brand): u64 {
        brand.reputation
    }

    public fun get_creator_reputation(creator: &Creator): u64 {
        creator.reputation
    }

    public fun get_brand_total_campaigns(brand: &Brand): u64 {
        brand.total_campaigns
    }

    public fun get_creator_total_campaigns(creator: &Creator): u64 {
        creator.total_campaigns
    }

    public fun get_brand_total_spent(brand: &Brand): u64 {
        brand.total_spent
    }

    public fun get_creator_total_earned(creator: &Creator): u64 {
        creator.total_earned
    }

    public fun get_creator_rank(creator: &Creator): u64 {
        creator.rank
    }

    public fun get_brand_wallet(brand: &Brand): address {
        brand.token_wallet
    }

    public fun get_creator_wallet(creator: &Creator): address {
        creator.token_wallet
    }

    // === Helper Functions ===

    public fun create_social_handles(
        twitter_handle: Option<String>,
        instagram_handle: Option<String>,
        tiktok_handle: Option<String>,
        youtube_handle: Option<String>,
    ): SocialHandles {
        SocialHandles {
            twitter_handle,
            instagram_handle,
            tiktok_handle,
            youtube_handle,
        }
    }

    // === Admin Functions ===

    /// Initialize admin capability (should be called once during deployment)
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::public_transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Create additional admin capability (admin only)
    public fun create_admin_cap(
        _admin_cap: &AdminCap,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let new_admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::public_transfer(new_admin_cap, recipient);
    }

    // === Test Only Functions ===
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    #[test_only]
    public fun create_test_brand_cap(brand_id: ID, ctx: &mut TxContext): BrandCap {
        BrandCap {
            id: object::new(ctx),
            brand_id,
        }
    }

    #[test_only]
    public fun create_test_creator_cap(creator_id: ID, ctx: &mut TxContext): CreatorCap {
        CreatorCap {
            id: object::new(ctx),
            creator_id,
        }
    }
}