#[test_only]
module swans::payment_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin;
    use sui::clock;
    use std::string;
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::creator::{Self, Creator};
    use swans::campaign::{Self, Campaign};
    use swans::content::{Self, Content};
    use swans::payment::{Self, PaymentReceipt};
    use swans::types;

    // Test addresses
    const ADMIN: address = @0x123;
    const BRAND_USER: address = @0x456;
    const CREATOR_USER: address = @0x789;

    #[test]
    public fun test_base_payment_creation() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Create base payment receipt
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            payment::create_base_payment_receipt(
                string::utf8(b"campaign_1"),
                string::utf8(b"creator_1"),
                CREATOR_USER,
                1000,
                123456789,
                test_scenario::ctx(scenario)
            );
        };

        // Verify payment receipt was created
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let receipt = test_scenario::take_from_sender<PaymentReceipt>(scenario);
            
            assert!(payment::get_campaign_id(&receipt) == string::utf8(b"campaign_1"), 0);
            assert!(payment::get_recipient_id(&receipt) == string::utf8(b"creator_1"), 1);
            assert!(payment::get_amount(&receipt) == 1000, 2);
            assert!(payment::get_recipient_address(&receipt) == CREATOR_USER, 3);
            assert!(payment::is_base_payment(&receipt), 4);
            assert!(!payment::is_bonus_payment(&receipt), 5);
            assert!(payment::get_payment_type(&receipt) == types::payment_base(), 6);

            test_scenario::return_to_sender(scenario, receipt);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_bonus_payment_creation() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Create bonus payment receipt
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            payment::create_bonus_payment_receipt(
                string::utf8(b"campaign_1"),
                string::utf8(b"creator_1"),
                CREATOR_USER,
                500,
                123456789,
                test_scenario::ctx(scenario)
            );
        };

        // Verify bonus payment receipt was created
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let receipt = test_scenario::take_from_sender<PaymentReceipt>(scenario);
            
            assert!(payment::get_campaign_id(&receipt) == string::utf8(b"campaign_1"), 0);
            assert!(payment::get_recipient_id(&receipt) == string::utf8(b"creator_1"), 1);
            assert!(payment::get_amount(&receipt) == 500, 2);
            assert!(payment::is_bonus_payment(&receipt), 3);
            assert!(!payment::is_base_payment(&receipt), 4);
            assert!(payment::get_payment_type(&receipt) == types::payment_bonus(), 5);

            test_scenario::return_to_sender(scenario, receipt);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_engagement_bonus_calculation() {
        let mut scenario_val = setup_campaign_with_published_content();
        let scenario = &mut scenario_val;

        // Test engagement bonus calculation
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);

            // Test with specific engagement numbers
            let bonus = campaign::calculate_engagement_bonus(
                &campaign,
                2000, // likes: 20 * 10 = 200
                10000, // views: 100 * 5 = 500  
                500,  // retweets: 5 * 20 = 100
                300,  // comments: 3 * 15 = 45
                200   // clicks: 2 * 25 = 50
            );

            // Total expected: 200 + 500 + 100 + 45 + 50 = 895
            assert!(bonus == 895, 0);

            test_scenario::return_shared(campaign);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_bonus_payment_processing_for_winner() {
        let mut scenario_val = setup_campaign_with_published_content();
        let scenario = &mut scenario_val;

        // First, select the creator as a winner
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_address<Creator>(scenario, CREATOR_USER);
            
            let mut winners = vector::empty();
            vector::push_back(&mut winners, creator::get_creator_id(&creator));

            campaign::select_campaign_winners(&mut campaign, winners, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER, creator);
        };

        // Update engagement metrics on the content
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER);

            content::update_engagement_metrics(
                &campaign,
                &mut content,
                1000, // likes
                5000, // views
                200,  // retweets
                100,  // comments
                50,   // link clicks
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER, content);
        };

        // Process bonus payment for the winning content
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER);
            let mut creator = test_scenario::take_from_address<Creator>(scenario, CREATOR_USER);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            let initial_earnings = creator::get_total_earnings(&creator);

            content::process_bonus_payment(
                &mut campaign,
                &content,
                &mut creator,
                &clock,
                test_scenario::ctx(scenario)
            );

            // Verify creator earnings were updated (base payment 1000 + bonus)
            // Bonus should be: 10*10 + 50*5 + 2*20 + 1*15 + 0*25 = 100 + 250 + 40 + 15 + 0 = 405
            assert!(creator::get_total_earnings(&creator) > initial_earnings, 1);

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER, content);
            test_scenario::return_to_address(CREATOR_USER, creator);
            clock::destroy_for_testing(clock);
        };

        // Verify bonus payment coin was transferred
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let bonus_coin = test_scenario::take_from_sender<coin::Coin<USDC>>(scenario);
            // Expected bonus: 405 (calculated above)
            assert!(coin::value(&bonus_coin) == 405, 2);
            coin::burn_for_testing(bonus_coin);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_payment_receipt_analysis() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Create multiple payment receipts
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            // Create base payment
            payment::create_base_payment_receipt(
                string::utf8(b"campaign_1"),
                string::utf8(b"creator_1"),
                CREATOR_USER,
                1000,
                123456789,
                test_scenario::ctx(scenario)
            );

            // Create bonus payment
            payment::create_bonus_payment_receipt(
                string::utf8(b"campaign_1"),
                string::utf8(b"creator_1"),
                CREATOR_USER,
                500,
                123456790,
                test_scenario::ctx(scenario)
            );

            // Create another base payment
            payment::create_base_payment_receipt(
                string::utf8(b"campaign_2"),
                string::utf8(b"creator_1"),
                CREATOR_USER,
                800,
                123456791,
                test_scenario::ctx(scenario)
            );
        };

        // Test payment analysis functions
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let receipt1 = test_scenario::take_from_sender<PaymentReceipt>(scenario);
            let receipt2 = test_scenario::take_from_sender<PaymentReceipt>(scenario);
            let receipt3 = test_scenario::take_from_sender<PaymentReceipt>(scenario);

            // Create vector of receipts for analysis
            let mut receipts = vector::empty();
            vector::push_back(&mut receipts, receipt1);
            vector::push_back(&mut receipts, receipt2);
            vector::push_back(&mut receipts, receipt3);

            // Test total earnings calculation
            let total_earnings = payment::calculate_total_earnings(&receipts);
            assert!(total_earnings == 2300, 0); // 1000 + 500 + 800

            // Test payment type counting
            let (base_count, bonus_count) = payment::count_payment_types(&receipts);
            assert!(base_count == 2, 1); // 2 base payments
            assert!(bonus_count == 1, 2); // 1 bonus payment

            // Clean up - destroy receipts
            let receipt1 = vector::pop_back(&mut receipts);
            let receipt2 = vector::pop_back(&mut receipts);
            let receipt3 = vector::pop_back(&mut receipts);
            
            // Destroy the receipts properly (they are test objects)
            test_scenario::return_to_sender(scenario, receipt3);
            test_scenario::return_to_sender(scenario, receipt2);
            test_scenario::return_to_sender(scenario, receipt1);
            
            vector::destroy_empty(receipts);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_campaign_payment_deduction() {
        let mut scenario_val = setup_campaign_scenario();
        let scenario = &mut scenario_val;

        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            
            let initial_balance = campaign::get_campaign_remaining_balance(&campaign);
            let payment_amount = 2500u64;
            
            // Make payment from campaign escrow
            let payment_coin = campaign::make_campaign_payment(
                &mut campaign,
                payment_amount,
                test_scenario::ctx(scenario)
            );

            // Verify payment coin and balance deduction
            assert!(coin::value(&payment_coin) == payment_amount, 0);
            assert!(campaign::get_campaign_remaining_balance(&campaign) == initial_balance - payment_amount, 1);

            coin::burn_for_testing(payment_coin);
            test_scenario::return_shared(campaign);
        };

        test_scenario::end(scenario_val);
    }

    // Helper functions
    fun setup_campaign_scenario(): Scenario {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Initialize registry
        test_scenario::next_tx(scenario, ADMIN);
        {
            registry::init_for_testing(test_scenario::ctx(scenario));
        };

        // Setup brand with campaign
        setup_brand_with_campaign(scenario);

        scenario_val
    }

    fun setup_campaign_with_published_content(): Scenario {
        let mut scenario_val = setup_campaign_scenario();
        let scenario = &mut scenario_val;

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
            clock::set_for_testing(&mut clock, 1500);

            campaign::apply_to_campaign(&mut campaign, &creator, &clock, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Creator submits and gets content approved and published
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let creator = test_scenario::take_from_sender<Creator>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::submit_content(
                &mut campaign,
                &creator,
                string::utf8(b"content_1"),
                string::utf8(b"https://twitter.com/creator/status/123"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(campaign);
            test_scenario::return_to_sender(scenario, creator);
            clock::destroy_for_testing(clock);
        };

        // Brand approves content
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            content::review_content(&campaign, &mut content, true, string::utf8(b"Approved"), &clock, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            test_scenario::return_to_address(CREATOR_USER, content);
            clock::destroy_for_testing(clock);
        };

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

        // Handle base payment coin
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let base_payment_coin = test_scenario::take_from_sender<coin::Coin<USDC>>(scenario);
            coin::burn_for_testing(base_payment_coin);
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