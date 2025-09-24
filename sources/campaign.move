

module swans::campaign {
    use sui::object::{Self, ID, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::String;
    use std::vector;
    use std::option::{Self, Option};
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::creator::{Self, Creator};
    use swans::types::{Self, CampaignStatus, CpmRates};

    // ===== Campaign Structs =====

    /// Main campaign object
    public struct Campaign has key {
        id: UID,
        campaign_id: String,
        brand_id: String,
        brand_owner: address,
        campaign_type: String,
        
        // Timing
        application_start: u64,
        application_end: u64,
        campaign_start: u64,
        campaign_end: u64,
        
        // Payment structure
        base_pay_per_creator: u64,
        total_budget: u64,
        escrow_balance: Balance<USDC>,
        cpm_rates: CpmRates,
        
        // State
        status: CampaignStatus,
        applications: Table<String, ID>, // creator_id -> CampaignApplication ID
        content_submissions: Table<String, vector<ID>>, // creator_id -> Content IDs
        winners: vector<String>, // creator_ids
        max_winners: u64,
        
        creation_timestamp: u64,
    }

    /// Campaign application by creators
    public struct CampaignApplication has key, store {
        id: UID,
        campaign_id: String,
        applicant_id: String,
        applicant_address: address,
        is_accepted: bool,
        application_timestamp: u64,
        review_timestamp: Option<u64>,
    }

    // ===== Events =====
    public struct CampaignCreated has copy, drop {
        campaign_id: String,
        brand_id: String,
        budget: u64,
    }

    public struct CampaignApplicationSubmitted has copy, drop {
        campaign_id: String,
        creator_id: String,
    }

    public struct CampaignStatusUpdated has copy, drop {
        campaign_id: String,
        old_status: u8,
        new_status: u8,
    }

    public struct WinnersSelected has copy, drop {
        campaign_id: String,
        winners: vector<String>,
    }

    // ===== Campaign Management =====

    /// Create a new campaign
    public entry fun create_campaign(
        registry: &mut PlatformRegistry,
        brand: &mut Brand,
        campaign_id: String,
        campaign_type: String,
        application_start: u64,
        application_end: u64,
        campaign_start: u64,
        campaign_end: u64,
        base_pay_per_creator: u64,
        total_budget: u64,
        cpm_likes: u64,
        cpm_views: u64,
        cpm_retweets: u64,
        cpm_comments: u64,
        cpm_link_clicks: u64,
        max_winners: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(brand::is_brand_owner(brand, tx_context::sender(ctx)), types::err_not_authorized());
        assert!(brand::get_brand_balance(brand) >= total_budget, types::err_insufficient_funds());
        assert!(!registry::is_campaign_registered(registry, campaign_id), types::err_invalid_status());

        // Deduct funds from brand account
        let escrow_balance = brand::deduct_brand_funds(brand, total_budget);

        let cpm_rates = types::new_cpm_rates(
            cpm_likes,
            cpm_views,
            cpm_retweets,
            cpm_comments,
            cpm_link_clicks
        );

        let campaign = Campaign {
            id: object::new(ctx),
            campaign_id,
            brand_id: brand::get_brand_id(brand),
            brand_owner: brand::get_brand_owner(brand),
            campaign_type,
            application_start,
            application_end,
            campaign_start,
            campaign_end,
            base_pay_per_creator,
            total_budget,
            escrow_balance,
            cpm_rates,
            status: types::new_campaign_status(types::campaign_active()),
            applications: table::new(ctx),
            content_submissions: table::new(ctx),
            winners: vector::empty(),
            max_winners,
            creation_timestamp: clock::timestamp_ms(clock),
        };

        let campaign_object_id = object::id(&campaign);
        brand::add_campaign_to_brand(brand, campaign_object_id);
        registry::register_campaign_in_registry(registry, campaign.campaign_id, campaign_object_id);

        event::emit(CampaignCreated {
            campaign_id: campaign.campaign_id,
            brand_id: campaign.brand_id,
            budget: total_budget,
        });

        transfer::share_object(campaign);
    }

    /// Apply to a campaign
    public entry fun apply_to_campaign(
        campaign: &mut Campaign,
        creator: &Creator,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(creator::is_creator_owner(creator, tx_context::sender(ctx)), types::err_not_authorized());
        assert!(types::campaign_status_value(&campaign.status) == types::campaign_active(), types::err_campaign_not_active());
        assert!(clock::timestamp_ms(clock) >= campaign.application_start, types::err_invalid_status());
        assert!(clock::timestamp_ms(clock) <= campaign.application_end, types::err_invalid_status());
        assert!(!table::contains(&campaign.applications, creator::get_creator_id(creator)), types::err_already_applied());

        let application = CampaignApplication {
            id: object::new(ctx),
            campaign_id: campaign.campaign_id,
            applicant_id: creator::get_creator_id(creator),
            applicant_address: creator::get_creator_owner(creator),
            is_accepted: true, // Auto-accept as specified
            application_timestamp: clock::timestamp_ms(clock),
            review_timestamp: option::some(clock::timestamp_ms(clock)),
        };

        let app_id = object::id(&application);
        table::add(&mut campaign.applications, creator::get_creator_id(creator), app_id);

        event::emit(CampaignApplicationSubmitted {
            campaign_id: campaign.campaign_id,
            creator_id: creator::get_creator_id(creator),
        });
        
        transfer::transfer(application, creator::get_creator_owner(creator));
    }

    /// Update campaign status
    public entry fun update_campaign_status(
        campaign: &mut Campaign,
        new_status: u8,
        ctx: &mut TxContext
    ) {
        assert!(campaign.brand_owner == tx_context::sender(ctx), types::err_not_authorized());
        
        let old_status = types::campaign_status_value(&campaign.status);
        campaign.status = types::new_campaign_status(new_status);

        event::emit(CampaignStatusUpdated {
            campaign_id: campaign.campaign_id,
            old_status,
            new_status,
        });
    }

    /// Select winners for the campaign
    public entry fun select_campaign_winners(
        campaign: &mut Campaign,
        winners: vector<String>,
        ctx: &mut TxContext
    ) {
        assert!(campaign.brand_owner == tx_context::sender(ctx), types::err_not_authorized());
        assert!(vector::length(&winners) <= campaign.max_winners, types::err_invalid_winner_selection());
        
        // Verify all winners are valid applicants
        let mut i = 0;
        while (i < vector::length(&winners)) {
            let winner_id = vector::borrow(&winners, i);
            assert!(table::contains(&campaign.applications, *winner_id), types::err_invalid_winner_selection());
            i = i + 1;
        };

        campaign.winners = winners;

        event::emit(WinnersSelected {
            campaign_id: campaign.campaign_id,
            winners: campaign.winners,
        });

        // Mark campaign as completed
        campaign.status = types::new_campaign_status(types::campaign_completed());
    }

    /// Calculate engagement bonus for content
    public fun calculate_engagement_bonus(
        campaign: &Campaign, 
        likes: u64,
        views: u64,
        retweets: u64,
        comments: u64,
        link_clicks: u64
    ): u64 {
        let likes_bonus = (likes / 100) * types::get_cpm_likes(&campaign.cpm_rates);
        let views_bonus = (views / 100) * types::get_cpm_views(&campaign.cpm_rates);
        let retweets_bonus = (retweets / 100) * types::get_cpm_retweets(&campaign.cpm_rates);
        let comments_bonus = (comments / 100) * types::get_cpm_comments(&campaign.cpm_rates);
        let clicks_bonus = (link_clicks / 100) * types::get_cpm_link_clicks(&campaign.cpm_rates);
        
        likes_bonus + views_bonus + retweets_bonus + comments_bonus + clicks_bonus
    }

    /// Make payment from campaign escrow
    public fun make_campaign_payment(campaign: &mut Campaign, amount: u64, ctx: &mut TxContext): Coin<USDC> {
        assert!(balance::value(&campaign.escrow_balance) >= amount, types::err_insufficient_funds());
        let payment_balance = balance::split(&mut campaign.escrow_balance, amount);
        coin::from_balance(payment_balance, ctx)
    }

    /// Add content submission reference to campaign
    public fun add_content_to_campaign(
        campaign: &mut Campaign,
        creator_id: String,
        content_id: ID
    ) {
        if (!table::contains(&campaign.content_submissions, creator_id)) {
            table::add(&mut campaign.content_submissions, creator_id, vector::empty());
        };
        
        let creator_contents = table::borrow_mut(&mut campaign.content_submissions, creator_id);
        vector::push_back(creator_contents, content_id);
    }

    /// Check if creator is winner
    public fun is_winner(campaign: &Campaign, creator_id: String): bool {
        vector::contains(&campaign.winners, &creator_id)
    }

    /// Check if creator has applied
    public fun has_applied(campaign: &Campaign, creator_id: String): bool {
        table::contains(&campaign.applications, creator_id)
    }

    // ===== View Functions =====

    public fun get_campaign_id(campaign: &Campaign): String {
        campaign.campaign_id
    }

    public fun get_brand_id(campaign: &Campaign): String {
        campaign.brand_id
    }

    public fun get_brand_owner(campaign: &Campaign): address {
        campaign.brand_owner
    }

    public fun get_campaign_status(campaign: &Campaign): u8 {
        types::campaign_status_value(&campaign.status)
    }

    public fun get_campaign_budget(campaign: &Campaign): u64 {
        campaign.total_budget
    }

    public fun get_campaign_remaining_balance(campaign: &Campaign): u64 {
        balance::value(&campaign.escrow_balance)
    }

    public fun get_base_pay_per_creator(campaign: &Campaign): u64 {
        campaign.base_pay_per_creator
    }

    public fun get_max_winners(campaign: &Campaign): u64 {
        campaign.max_winners
    }

    public fun get_winners(campaign: &Campaign): vector<String> {
        campaign.winners
    }

    public fun is_campaign_active(campaign: &Campaign, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock);
        types::campaign_status_value(&campaign.status) == types::campaign_active() &&
        current_time >= campaign.campaign_start &&
        current_time <= campaign.campaign_end
    }

    public fun is_application_period_active(campaign: &Campaign, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock);
        current_time >= campaign.application_start &&
        current_time <= campaign.application_end
    }
}