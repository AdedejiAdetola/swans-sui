#[test_only]
module swans::content_workflow_test {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin;
    use sui::clock::{Self, Clock};
    use std::string;
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::creator::{Self, Creator};
    use swans::campaign::{Self, Campaign};
    use swans::content::{Self, Content};
    use swans::types;

    // Test addresses
    const ADMIN: address = @0x123;
    const BRAND_USER: address = @0x456;
    const CREATOR_USER: address = @0x789;

    #[test]
    public fun test_content_submission_basic() {
        let mut scenario_val = setup_campaign_with_applied_creator();
        let scenario = &mut scenario_val;

        // Creator submits content
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::submit_content(
                &mut campaign,
                &creator,
                string::utf8(b"content_1"),
                string::utf8(b"https://twitter.com/creator/status/123456789"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Verify content was submitted
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let content = test_scenario::take_from_sender<Content>(scenario);
            
            assert!(content::get_content_id(&content) == string::utf8(b"content_1"), 0);
            assert!(content::get_content_link(&content) == string::utf8(b"https://twitter.com/creator/status/123456789"), 1);
            assert!(content::get_content_status(&content) == types::content_pending(), 2);
            assert!(content::is_pending_review(&content), 3);

            test_scenario::return_to_sender(scenario, content);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_content_review_and_approval() {
        let mut scenario_val = setup_campaign_with_submitted_content();
        let scenario = &mut scenario_val;

        // Brand reviews and approves content
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::review_content(
                &campaign,
                &mut content,
                true, // approve
                string::utf8(b"Great content! Approved."),
                &clock,
                test_scenario::ctx(scenario)
            );

            assert!(content::get_content_status(&content) == types::content_accepted(), 0);
            assert!(content::get_reviewer_notes(&content) == string::utf8(b"Great content! Approved."), 1);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER, content);
            clock::destroy_for_testing(clock);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_content_review_and_rejection() {
        let mut scenario_val = setup_campaign_with_submitted_content();
        let scenario = &mut scenario_val;

        // Brand reviews and rejects content
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::review_content(
                &campaign,
                &mut content,
                false, // reject
                string::utf8(b"Content does not meet our guidelines."),
                &clock,
                test_scenario::ctx(scenario)
            );

            assert!(content::get_content_status(&content) == types::content_rejected(), 0);
            assert!(content::get_reviewer_notes(&content) == string::utf8(b"Content does not meet our guidelines."), 1);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER, content);
            clock::destroy_for_testing(clock);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_content_publishing_with_payment() {
        let mut scenario_val = setup_campaign_with_approved_content();
        let scenario = &mut scenario_val;

        // Creator publishes approved content (triggers base payment)
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_sender<Content>(scenario);
            let mut creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            let initial_earnings = creator::get_total_earnings(&creator);

            content::publish_content(
                &mut campaign,
                &mut content,
                &mut creator,
                &clock,
                test_scenario::ctx(scenario)
            );

            // Verify content was published
            assert!(content::get_content_status(&content) == types::content_published(), 0);
            assert!(content::is_published(&content), 1);

            // Verify creator earnings updated
            assert!(creator::get_total_earnings(&creator) == initial_earnings + 1000, 2); // base pay

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, content);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Verify payment coin was transferred to creator
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let payment_coin = test_scenario::take_from_sender<coin::Coin<USDC>>(scenario);
            assert!(coin::value(&payment_coin) == 1000, 3); // base payment amount
            coin::burn_for_testing(payment_coin);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_engagement_metrics_update() {
        let mut scenario_val = setup_campaign_with_published_content();
        let scenario = &mut scenario_val;

        // Brand updates engagement metrics
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER);

            content::update_engagement_metrics(
                &campaign,
                &mut content,
                1500, // likes
                5000, // views
                300,  // retweets
                150,  // comments
                75,   // link clicks
                test_scenario::ctx(scenario)
            );

            // Verify metrics were updated
            let metrics = content::get_engagement_metrics(&content);
            assert!(types::get_likes(&metrics) == 1500, 0);
            assert!(types::get_views(&metrics) == 5000, 1);
            assert!(types::get_retweets(&metrics) == 300, 2);
            assert!(types::get_comments(&metrics) == 150, 3);
            assert!(types::get_link_clicks(&metrics) == 75, 4);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER, content);
        };

        test_scenario::end(scenario_val);
    }

    // Helper functions
    fun setup_campaign_with_applied_creator(): Scenario {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Initialize registry
        test_scenario::next_tx(scenario, ADMIN);
        {
            registry::init_for_testing(test_scenario::ctx(scenario));
        };

        // Setup brand with campaign
        setup_brand_with_campaign(scenario);

        // Register creator
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            creator::register_creator(
                &mut registry,
                string::utf8(b"test_creator"),
                string::utf8(b"Test Creator"),
                string::utf8(b"https://test.com/avatar.png"),
                string::utf8(b"lifestyle"),
                string::utf8(b"@testcreator"),
                string::utf8(b"@testcreator_ig"),
                string::utf8(b"@testcreator_tik"),
                string::utf8(b"TestCreator"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };

        // Creator applies to campaign
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
            clock::set_for_testing(&mut clock, 1500); // During application period

            campaign::apply_to_campaign(&mut campaign, &creator, &clock, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        scenario_val
    }

    fun setup_campaign_with_submitted_content(): Scenario {
        let mut scenario_val = setup_campaign_with_applied_creator();
        let scenario = &mut scenario_val;

        // Creator submits content
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::submit_content(
                &mut campaign,
                &creator,
                string::utf8(b"content_1"),
                string::utf8(b"https://twitter.com/creator/status/123456789"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        scenario_val
    }

    fun setup_campaign_with_approved_content(): Scenario {
        let mut scenario_val = setup_campaign_with_submitted_content();
        let scenario = &mut scenario_val;

        // Brand approves content
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::review_content(
                &campaign,
                &mut content,
                true,
                string::utf8(b"Approved for publication"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER, content);
            clock::destroy_for_testing(clock);
        };

        scenario_val
    }

    fun setup_campaign_with_published_content(): Scenario {
        let mut scenario_val = setup_campaign_with_approved_content();
        let scenario = &mut scenario_val;

        // Creator publishes content
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_sender<Content>(scenario);
            let mut creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::publish_content(&mut campaign, &mut content, &mut creator, &clock, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, content);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Handle payment coin
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let payment_coin = test_scenario::take_from_sender<coin::Coin<USDC>>(scenario);
            coin::burn_for_testing(payment_coin);
        };

        scenario_val
    }

    fun setup_brand_with_campaign(scenario: &mut Scenario) {
        // Register brand
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            brand::register_brand(
                &mut registry,
                string::utf8(b"test_brand"),
                string::utf8(b"Test Brand"),
                string::utf8(b"https://test.com/logo.png"),
                string::utf8(b"Test brand"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };

        // Fund brand
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut brand = test_scenario::take_from_sender<Brand>(scenario);
            let funding = coin::mint_for_testing<USDC>(50000, test_scenario::ctx(scenario));

            brand::fund_brand_account(&mut brand, funding, test_scenario::ctx(scenario));

            test_scenario::return_to_sender(scenario, brand);
        };

        // Create campaign
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let mut brand = test_scenario::take_from_sender<Brand>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            campaign::create_campaign(
                &mut registry,
                &mut brand,
                string::utf8(b"test_campaign"),
                string::utf8(b"brand_campaign"),
                1000, 2000, 3000, 4000,
                1000, 10000,
                10, 5, 20, 15, 25, 5,
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            test_scenario::return_to_sender(scenario, brand);
            clock::destroy_for_testing(clock);
        };
    }
}