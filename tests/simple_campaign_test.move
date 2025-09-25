#[test_only]
module swans::simple_campaign_test {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin;
    use sui::clock::{Self, Clock};
    use std::string;
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::creator::{Self, Creator};
    use swans::campaign::{Self, Campaign};
    use swans::types;

    // Test addresses
    const ADMIN: address = @0x123;
    const BRAND_USER: address = @0x456;
    const CREATOR_USER: address = @0x789;

    #[test]
    public fun test_campaign_creation_basic() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Step 1: Initialize platform registry
        test_scenario::next_tx(scenario, ADMIN);
        {
            registry::init_for_testing(test_scenario::ctx(scenario));
        };

        // Step 2: Register brand
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            brand::register_brand(
                &mut registry,
                string::utf8(b"test_brand"),
                string::utf8(b"Test Brand"),
                string::utf8(b"https://test.com/logo.png"),
                string::utf8(b"Test brand description"),
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
            let funding = coin::mint_for_testing<USDC>(50000, test_scenario::ctx(scenario));

            brand::fund_brand_account(&mut brand, funding, test_scenario::ctx(scenario));

            // Verify funding
            assert!(brand::get_brand_balance(&brand) == 50000, 0);

            test_scenario::return_to_sender(scenario, brand);
        };

        // Step 4: Create campaign
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
                1000, // application_start
                2000, // application_end  
                3000, // campaign_start
                4000, // campaign_end
                1000, // base_pay_per_creator
                10000, // total_budget
                10, // cpm_likes
                5,  // cpm_views
                20, // cpm_retweets
                15, // cpm_comments
                25, // cpm_link_clicks
                5,  // max_winners
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            test_scenario::return_to_sender(scenario, brand);
            clock::destroy_for_testing(clock);
        };

        // Step 5: Verify campaign was created successfully
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            
            assert!(campaign::get_campaign_id(&campaign) == string::utf8(b"test_campaign"), 1);
            assert!(campaign::get_campaign_budget(&campaign) == 10000, 2);
            assert!(campaign::get_base_pay_per_creator(&campaign) == 1000, 3);
            assert!(campaign::get_campaign_status(&campaign) == types::campaign_active(), 4);

            test_scenario::return_shared(campaign);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_creator_application_basic() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Setup registry
        test_scenario::next_tx(scenario, ADMIN);
        {
            registry::init_for_testing(test_scenario::ctx(scenario));
        };

        // Setup brand and campaign
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

            campaign::apply_to_campaign(
                &mut campaign,
                &creator,
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Verify application was successful
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);

            assert!(campaign::has_applied(&campaign, creator::get_creator_id(&creator)), 5);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
        };

        test_scenario::end(scenario_val);
    }

    // Helper function to setup brand with campaign
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