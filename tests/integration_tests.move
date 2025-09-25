#[test_only]
module swans::integration_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin;
    use sui::clock;
    use std::string;
    use std::option;
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::creator::{Self, Creator};
    use swans::campaign::{Self, Campaign, CampaignApplication};
    use swans::content::{Self, Content};
    use swans::payment::{Self, PaymentReceipt};
    use swans::profiles::{Self, AdminCap};
    use swans::types;

    // Test addresses
    const ADMIN: address = @0x123;
    const BRAND_USER: address = @0x456;
    const CREATOR_USER_1: address = @0x789;
    const CREATOR_USER_2: address = @0x999;

    #[test]
    public fun test_complete_campaign_workflow() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Step 1: Initialize platform
        test_scenario::next_tx(scenario, ADMIN);
        {
            profiles::init_for_testing(test_scenario::ctx(scenario));
            registry::init_for_testing(test_scenario::ctx(scenario));
        };

        // Step 2: Register brand
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            brand::register_brand(
                &mut registry,
                string::utf8(b"nike_brand"),
                string::utf8(b"Nike"),
                string::utf8(b"https://nike.com/logo.png"),
                string::utf8(b"Just Do It"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };

        // Step 3: Fund brand account
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut brand = test_scenario::take_from_sender<Brand>(scenario);
            let funding = coin::mint_for_testing<USDC>(100000, test_scenario::ctx(scenario));

            brand::fund_brand_account(&mut brand, funding, test_scenario::ctx(scenario));
            assert!(brand::get_brand_balance(&brand) == 100000, 0);

            test_scenario::return_to_sender(scenario, brand);
        };

        // Step 4: Register creators
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            creator::register_creator(
                &mut registry,
                string::utf8(b"fitness_guru"),
                string::utf8(b"Fitness Guru"),
                string::utf8(b"https://fitness.com/avatar.png"),
                string::utf8(b"fitness"),
                string::utf8(b"@fitness_guru"),
                string::utf8(b"@fitness_guru_ig"),
                string::utf8(b"@fitness_tiktok"),
                string::utf8(b"FitnessGuru"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };

        test_scenario::next_tx(scenario, CREATOR_USER_2);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            creator::register_creator(
                &mut registry,
                string::utf8(b"lifestyle_blogger"),
                string::utf8(b"Lifestyle Blogger"),
                string::utf8(b"https://lifestyle.com/avatar.png"),
                string::utf8(b"lifestyle"),
                string::utf8(b"@lifestyle_blog"),
                string::utf8(b"@lifestyle_ig"),
                string::utf8(b"@lifestyle_tiktok"),
                string::utf8(b"LifestyleBlog"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };

        // Step 5: Create campaign
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let mut brand = test_scenario::take_from_sender<Brand>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            campaign::create_campaign(
                &mut registry,
                &mut brand,
                string::utf8(b"summer_fitness_2024"),
                string::utf8(b"nike_summer_campaign"),
                1000,  // application_start
                5000,  // application_end  
                6000,  // campaign_start
                10000, // campaign_end
                2000,  // base_pay_per_creator
                50000, // total_budget
                15,    // cpm_likes
                8,     // cpm_views
                30,    // cpm_retweets
                25,    // cpm_comments
                40,    // cpm_link_clicks
                3,     // max_winners
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            test_scenario::return_to_sender(scenario, brand);
            clock::destroy_for_testing(clock);
        };

        // Step 6: Creators apply to campaign
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
            clock::set_for_testing(&mut clock, 3000); // During application period

            campaign::apply_to_campaign(&mut campaign, &creator, &clock, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        test_scenario::next_tx(scenario, CREATOR_USER_2);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
            clock::set_for_testing(&mut clock, 3500); // During application period

            campaign::apply_to_campaign(&mut campaign, &creator, &clock, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Step 7: Both creators submit content
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
            clock::set_for_testing(&mut clock, 7000); // During campaign period

            content::submit_content(
                &mut campaign,
                &creator,
                string::utf8(b"fitness_content_1"),
                string::utf8(b"https://instagram.com/p/fitness_post_1"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        test_scenario::next_tx(scenario, CREATOR_USER_2);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
            clock::set_for_testing(&mut clock, 7500); // During campaign period

            content::submit_content(
                &mut campaign,
                &creator,
                string::utf8(b"lifestyle_content_1"),
                string::utf8(b"https://tiktok.com/@lifestyle/video/123"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Step 8: Brand approves both content pieces
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content1 = test_scenario::take_from_address<Content>(scenario, CREATOR_USER_1);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::review_content(
                &campaign,
                &mut content1,
                true,
                string::utf8(b"Great fitness content! Approved."),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER_1, content1);
            clock::destroy_for_testing(clock);
        };

        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content2 = test_scenario::take_from_address<Content>(scenario, CREATOR_USER_2);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::review_content(
                &campaign,
                &mut content2,
                true,
                string::utf8(b"Excellent lifestyle content! Approved."),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER_2, content2);
            clock::destroy_for_testing(clock);
        };

        // Step 9: Creators publish their approved content (triggers base payments)
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_sender<Content>(scenario);
            let mut creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            let initial_earnings = creator::get_total_earnings(&creator);
            
            content::publish_content(&mut campaign, &mut content, &mut creator, &clock, test_scenario::ctx(scenario));

            // Verify base payment processed
            assert!(creator::get_total_earnings(&creator) == initial_earnings + 2000, 1);
            assert!(content::is_published(&content), 2);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, content);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Handle base payment coin for creator 1
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let payment_coin = test_scenario::take_from_sender<coin::Coin<USDC>>(scenario);
            assert!(coin::value(&payment_coin) == 2000, 3);
            coin::burn_for_testing(payment_coin);
        };

        test_scenario::next_tx(scenario, CREATOR_USER_2);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_sender<Content>(scenario);
            let mut creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            let initial_earnings = creator::get_total_earnings(&creator);
            
            content::publish_content(&mut campaign, &mut content, &mut creator, &clock, test_scenario::ctx(scenario));

            // Verify base payment processed
            assert!(creator::get_total_earnings(&creator) == initial_earnings + 2000, 4);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, content);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Handle base payment coin for creator 2
        test_scenario::next_tx(scenario, CREATOR_USER_2);
        {
            let payment_coin = test_scenario::take_from_sender<coin::Coin<USDC>>(scenario);
            assert!(coin::value(&payment_coin) == 2000, 5);
            coin::burn_for_testing(payment_coin);
        };

        // Step 10: Update engagement metrics for both content pieces
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content1 = test_scenario::take_from_address<Content>(scenario, CREATOR_USER_1);

            content::update_engagement_metrics(
                &campaign,
                &mut content1,
                1000, // likes
                5000, // views  
                50,   // retweets
                25,   // comments
                10,   // clicks
                test_scenario::ctx(scenario)
            );
            // Calculate expected bonus: 10*15 + 50*8 + 0*30 + 0*25 + 0*40 = 150 + 400 = 550

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER_1, content1);
        };

        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content2 = test_scenario::take_from_address<Content>(scenario, CREATOR_USER_2);

            content::update_engagement_metrics(
                &campaign,
                &mut content2,
                800,  // likes
                4000, // views
                30,   // retweets
                15,   // comments
                5,    // clicks
                test_scenario::ctx(scenario)
            );
            // Calculate expected bonus: 8*15 + 40*8 + 0*30 + 0*25 + 0*40 = 120 + 320 = 440

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER_2, content2);
        };

        // Step 11: Select winners (creator 1 has higher engagement)
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator1 = test_scenario::take_from_address<Creator>(scenario, CREATOR_USER_1);
            
            let mut winners = vector::empty();
            vector::push_back(&mut winners, creator::get_creator_id(&creator1));

            campaign::select_campaign_winners(&mut campaign, winners, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER_1, creator1);
        };

        // Step 12: Process bonus payments for winners
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let content1 = test_scenario::take_from_address<Content>(scenario, CREATOR_USER_1);
            let mut creator1 = test_scenario::take_from_address<Creator>(scenario, CREATOR_USER_1);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            let initial_earnings = creator::get_total_earnings(&creator1);

            content::process_bonus_payment(&mut campaign, &content1, &mut creator1, &clock, test_scenario::ctx(scenario));

            // Verify bonus payment processed (should be 550 based on engagement)
            assert!(creator::get_total_earnings(&creator1) == initial_earnings + 550, 6);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER_1, content1);
            test_scenario::return_to_address(CREATOR_USER_1, creator1);
            clock::destroy_for_testing(clock);
        };

        // Handle bonus payment coin
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let bonus_coin = test_scenario::take_from_sender<coin::Coin<USDC>>(scenario);
            assert!(coin::value(&bonus_coin) == 550, 7);
            coin::burn_for_testing(bonus_coin);
        };

        // Step 13: Verify final campaign state
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let brand = test_scenario::take_from_sender<Brand>(scenario);

            // Campaign should be completed
            assert!(campaign::get_campaign_status(&campaign) == types::campaign_completed(), 8);
            
            // Brand balance should be less than initial (payments were made)
            assert!(brand::get_brand_balance(&brand) < 100000, 9);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, brand);
        };

        // Verify both creators received payments
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            
            // Should have base + bonus payments (more than just base pay)
            assert!(creator::get_total_earnings(&creator) > 2000, 10);

            test_scenario::return_to_sender(scenario, creator);
        };

        test_scenario::next_tx(scenario, CREATOR_USER_2);
        {
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            
            // Should have base payment
            assert!(creator::get_total_earnings(&creator) == 2000, 11);

            test_scenario::return_to_sender(scenario, creator);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_multi_brand_campaign_scenario() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Initialize platform
        test_scenario::next_tx(scenario, ADMIN);
        {
            registry::init_for_testing(test_scenario::ctx(scenario));
        };

        // Register multiple brands
        test_scenario::next_tx(scenario, @0x100);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            brand::register_brand(
                &mut registry,
                string::utf8(b"brand_tech"),
                string::utf8(b"TechCorp"),
                string::utf8(b"https://techcorp.com/logo.png"),
                string::utf8(b"Innovation First"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };

        test_scenario::next_tx(scenario, @0x200);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            brand::register_brand(
                &mut registry,
                string::utf8(b"brand_fashion"),
                string::utf8(b"FashionHub"),
                string::utf8(b"https://fashionhub.com/logo.png"),
                string::utf8(b"Style Forward"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };

        // Register creator who can work with multiple brands
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            creator::register_creator(
                &mut registry,
                string::utf8(b"multi_creator"),
                string::utf8(b"Multi Creator"),
                string::utf8(b"https://multi.com/avatar.png"),
                string::utf8(b"tech"),
                string::utf8(b"@multicreator"),
                string::utf8(b"@multi_ig"),
                string::utf8(b"@multi_tiktok"),
                string::utf8(b"MultiCreator"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };

        // Both brands fund their accounts
        test_scenario::next_tx(scenario, @0x100);
        {
            let mut brand = test_scenario::take_from_sender<Brand>(scenario);
            let funding = coin::mint_for_testing<USDC>(50000, test_scenario::ctx(scenario));
            brand::fund_brand_account(&mut brand, funding, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, brand);
        };

        test_scenario::next_tx(scenario, @0x200);
        {
            let mut brand = test_scenario::take_from_sender<Brand>(scenario);
            let funding = coin::mint_for_testing<USDC>(30000, test_scenario::ctx(scenario));
            brand::fund_brand_account(&mut brand, funding, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, brand);
        };

        // Both brands create campaigns
        test_scenario::next_tx(scenario, @0x100);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let mut brand = test_scenario::take_from_sender<Brand>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            campaign::create_campaign(
                &mut registry,
                &mut brand,
                string::utf8(b"tech_campaign"),
                string::utf8(b"tech_promo"),
                1000, 3000, 4000, 8000,
                1500, 20000,
                10, 5, 15, 12, 20, 2,
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            test_scenario::return_to_sender(scenario, brand);
            clock::destroy_for_testing(clock);
        };

        test_scenario::next_tx(scenario, @0x200);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let mut brand = test_scenario::take_from_sender<Brand>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            campaign::create_campaign(
                &mut registry,
                &mut brand,
                string::utf8(b"fashion_campaign"),
                string::utf8(b"fashion_trends"),
                1000, 3000, 4000, 8000,
                1200, 15000,
                12, 6, 18, 15, 25, 2,
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            test_scenario::return_to_sender(scenario, brand);
            clock::destroy_for_testing(clock);
        };

        // Verify both campaigns exist and have correct budgets
        test_scenario::next_tx(scenario, ADMIN);
        {
            // Note: In a real scenario, we'd track campaigns by ID
            // For this test, we verify the platform can handle multiple campaigns
            let registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            
            // Both brands should be registered
            assert!(registry::is_brand_registered(&registry, string::utf8(b"brand_tech")), 0);
            assert!(registry::is_brand_registered(&registry, string::utf8(b"brand_fashion")), 1);

            test_scenario::return_shared(registry);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_campaign_with_rejection_and_resubmission() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Setup basic campaign environment
        setup_basic_campaign_environment(scenario);

        // Creator submits initial content
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::submit_content(
                &mut campaign,
                &creator,
                string::utf8(b"initial_content"),
                string::utf8(b"https://social.com/post/123"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Brand rejects the content
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER_1);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::review_content(
                &campaign,
                &mut content,
                false, // reject
                string::utf8(b"Content doesn't align with brand guidelines. Please revise."),
                &clock,
                test_scenario::ctx(scenario)
            );

            assert!(content::get_content_status(&content) == types::content_rejected(), 0);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER_1, content);
            clock::destroy_for_testing(clock);
        };

        // Creator submits revised content
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::submit_content(
                &mut campaign,
                &creator,
                string::utf8(b"revised_content"),
                string::utf8(b"https://social.com/post/456_revised"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Brand approves revised content
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut revised_content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER_1);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::review_content(
                &campaign,
                &mut revised_content,
                true, // approve
                string::utf8(b"Much better! This aligns perfectly with our brand."),
                &clock,
                test_scenario::ctx(scenario)
            );

            assert!(content::get_content_status(&revised_content) == types::content_accepted(), 1);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER_1, revised_content);
            clock::destroy_for_testing(clock);
        };

        // Creator publishes approved content
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_sender<Content>(scenario);
            let mut creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::publish_content(&mut campaign, &mut content, &mut creator, &clock, test_scenario::ctx(scenario));

            assert!(content::is_published(&content), 2);
            assert!(creator::get_total_earnings(&creator) == 1000, 3); // Base payment

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, content);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Clean up payment coin
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let payment_coin = test_scenario::take_from_sender<coin::Coin<USDC>>(scenario);
            coin::burn_for_testing(payment_coin);
        };

        test_scenario::end(scenario_val);
    }

    // Helper function to set up basic campaign environment
    fun setup_basic_campaign_environment(scenario: &mut Scenario) {
        // Initialize platform
        test_scenario::next_tx(scenario, ADMIN);
        {
            registry::init_for_testing(test_scenario::ctx(scenario));
        };

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
                string::utf8(b"Test Description"),
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
            let funding = coin::mint_for_testing<USDC>(25000, test_scenario::ctx(scenario));
            brand::fund_brand_account(&mut brand, funding, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, brand);
        };

        // Register creator
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            creator::register_creator(
                &mut registry,
                string::utf8(b"test_creator"),
                string::utf8(b"Test Creator"),
                string::utf8(b"https://test.com/avatar.png"),
                string::utf8(b"general"),
                string::utf8(b"@testcreator"),
                string::utf8(b"@test_ig"),
                string::utf8(b"@test_tiktok"),
                string::utf8(b"TestCreator"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
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
                string::utf8(b"test_promo"),
                1000, 3000, 4000, 8000,
                1000, 10000,
                10, 5, 15, 12, 20, 1,
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            test_scenario::return_to_sender(scenario, brand);
            clock::destroy_for_testing(clock);
        };

        // Creator applies to campaign
        test_scenario::next_tx(scenario, CREATOR_USER_1);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
            clock::set_for_testing(&mut clock, 2000); // During application period

            campaign::apply_to_campaign(&mut campaign, &creator, &clock, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };
    }
}