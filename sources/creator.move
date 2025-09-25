

module swans::creator {
    use sui::clock::{Self, Clock};
    use std::string::String;
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::types;

    // ===== Creator Struct =====
    public struct Creator has key, store {
        id: UID,
        creator_id: String,
        name: String,
        owner: address,
        reputation: u8, // 1-5 stars
        joined_at: u64,
        profile_image: String,
        rank: u64,
        completed_campaigns: u64,
        total_earnings: u64,
        social_media_handles: SocialMediaHandles,
        verification_status: bool,
        category: String, // e.g., "lifestyle", "tech", "fashion"
    }

    /// Social media handles for creator
    public struct SocialMediaHandles has copy, drop, store {
        twitter: String,
        instagram: String,
        tiktok: String,
        youtube: String,
    }

    // ===== Events =====
    public struct CreatorRegistered has copy, drop {
        creator_id: String,
        name: String,
        owner: address,
    }

    public struct CreatorEarningsUpdated has copy, drop {
        creator_id: String,
        amount_earned: u64,
        total_earnings: u64,
    }

    // ===== Creator Management =====

    /// Register a new creator
    public fun register_creator(
        registry: &mut PlatformRegistry,
        creator_id: String,
        name: String,
        profile_image: String,
        category: String,
        twitter: String,
        instagram: String,
        tiktok: String,
        youtube: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check if creator ID is already taken
        assert!(!registry::is_creator_registered(registry, creator_id), types::err_invalid_status());

        let social_handles = SocialMediaHandles {
            twitter,
            instagram,
            tiktok,
            youtube,
        };

        let creator = Creator {
            id: object::new(ctx),
            creator_id,
            name,
            owner: tx_context::sender(ctx),
            reputation: 5, // Start with max reputation
            joined_at: clock::timestamp_ms(clock),
            profile_image,
            rank: 0,
            completed_campaigns: 0,
            total_earnings: 0,
            social_media_handles: social_handles,
            verification_status: false,
            category,
        };

        let creator_object_id = object::id(&creator);
        registry::register_creator_in_registry(registry, creator.creator_id, creator_object_id);

        sui::event::emit(CreatorRegistered {
            creator_id: creator.creator_id,
            name: creator.name,
            owner: creator.owner,
        });
        
        transfer::transfer(creator, tx_context::sender(ctx));
    }

    /// Update creator profile
    public fun update_creator_profile(
        creator: &mut Creator,
        name: String,
        profile_image: String,
        category: String,
        ctx: &mut TxContext
    ) {
        assert!(creator.owner == tx_context::sender(ctx), types::err_not_authorized());
        
        creator.name = name;
        creator.profile_image = profile_image;
        creator.category = category;
    }

    /// Update social media handles
    public fun update_social_media_handles(
        creator: &mut Creator,
        twitter: String,
        instagram: String,
        tiktok: String,
        youtube: String,
        ctx: &mut TxContext
    ) {
        assert!(creator.owner == tx_context::sender(ctx), types::err_not_authorized());
        
        creator.social_media_handles = SocialMediaHandles {
            twitter,
            instagram,
            tiktok,
            youtube,
        };
    }

    /// Mark creator as verified (admin function)
    public fun verify_creator(
        registry: &PlatformRegistry,
        creator: &mut Creator,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry::get_admin(registry), types::err_not_authorized());
        creator.verification_status = true;
    }

    /// Update creator earnings (called by payment system)
    public fun add_creator_earnings(creator: &mut Creator, amount: u64) {
        creator.total_earnings = creator.total_earnings + amount;

        sui::event::emit(CreatorEarningsUpdated {
            creator_id: creator.creator_id,
            amount_earned: amount,
            total_earnings: creator.total_earnings,
        });
    }

    /// Complete a campaign (update statistics)
    public fun complete_campaign(creator: &mut Creator) {
        creator.completed_campaigns = creator.completed_campaigns + 1;
        // Update rank based on completed campaigns and earnings
        creator.rank = calculate_creator_rank(creator.completed_campaigns, creator.total_earnings);
    }

    /// Update creator reputation
    public fun update_creator_reputation(
        creator: &mut Creator,
        new_reputation: u8,
        _ctx: &mut TxContext
    ) {
        // This would typically be called by the admin or through a rating system
        assert!(new_reputation >= 1 && new_reputation <= 5, types::err_invalid_status());
        creator.reputation = new_reputation;
    }

    /// Calculate creator rank based on performance
    fun calculate_creator_rank(completed_campaigns: u64, total_earnings: u64): u64 {
        // Simple ranking algorithm - can be made more sophisticated
        let campaign_points = completed_campaigns * 10;
        let earnings_points = total_earnings / 1000; // 1 point per 1000 tokens earned
        campaign_points + earnings_points
    }

    // ===== View Functions =====

    public fun get_creator_id(creator: &Creator): String {
        creator.creator_id
    }

    public fun get_creator_name(creator: &Creator): String {
        creator.name
    }

    public fun get_creator_owner(creator: &Creator): address {
        creator.owner
    }

    public fun get_creator_reputation(creator: &Creator): u8 {
        creator.reputation
    }

    public fun get_creator_rank(creator: &Creator): u64 {
        creator.rank
    }

    public fun get_completed_campaigns(creator: &Creator): u64 {
        creator.completed_campaigns
    }

    public fun get_total_earnings(creator: &Creator): u64 {
        creator.total_earnings
    }

    public fun is_creator_verified(creator: &Creator): bool {
        creator.verification_status
    }

    public fun get_creator_category(creator: &Creator): String {
        creator.category
    }

    public fun is_creator_owner(creator: &Creator, addr: address): bool {
        creator.owner == addr
    }

    public fun get_twitter_handle(creator: &Creator): String {
        creator.social_media_handles.twitter
    }

    public fun get_instagram_handle(creator: &Creator): String {
        creator.social_media_handles.instagram
    }

    public fun get_tiktok_handle(creator: &Creator): String {
        creator.social_media_handles.tiktok
    }

    public fun get_youtube_handle(creator: &Creator): String {
        creator.social_media_handles.youtube
    }
}