#[test_only]
module swans::dispute_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::clock;
    use std::string;
    use std::option;
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand};
    use swans::creator::{Self, Creator};
    use swans::campaign::{Self, Campaign};
    use swans::content::{Self, Content};
    use swans::disputes::{Self, Dispute, DisputeResolutionCap};
    use swans::profiles::{Self, AdminCap};

    // Test addresses
    const ADMIN: address = @0x123;
    const BRAND_USER: address = @0x456;
    const CREATOR_USER: address = @0x789;
    const RESOLVER: address = @0x999;

    #[test]
    public fun test_brand_files_dispute() {
        let mut scenario_val = setup_basic_profiles();
        let scenario = &mut scenario_val;

        // Brand files a dispute against creator
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let brand_cap = test_scenario::take_from_sender<profiles::BrandCap>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            disputes::file_dispute_as_brand(
                &brand_cap,
                object::id_from_address(@0x1), // Mock campaign ID  
                option::some(object::id_from_address(@0x2)), // Mock content ID
                disputes::dispute_type_content(),
                string::utf8(b"dispute_1"),
                string::utf8(b"Content does not match requirements"),
                vector[string::utf8(b"https://evidence1.com")],
                CREATOR_USER,
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_to_sender(scenario, brand_cap);
            clock::destroy_for_testing(clock);
        };

        // Verify dispute was created
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let dispute = test_scenario::take_shared<Dispute>(scenario);
            
            assert!(disputes::get_dispute_string_id(&dispute) == string::utf8(b"dispute_1"), 0);
            assert!(disputes::get_dispute_initiator(&dispute) == BRAND_USER, 1);
            assert!(disputes::get_dispute_respondent(&dispute) == CREATOR_USER, 2);
            assert!(disputes::get_dispute_type(&dispute) == disputes::dispute_type_content(), 3);
            assert!(disputes::get_dispute_status(&dispute) == disputes::dispute_status_filed(), 4);
            assert!(disputes::is_dispute_active(&dispute), 5);
            assert!(!disputes::is_dispute_resolved(&dispute), 6);

            test_scenario::return_shared(dispute);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_creator_files_dispute() {
        let mut scenario_val = setup_basic_profiles();
        let scenario = &mut scenario_val;

        // Creator files a dispute against brand
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let creator_cap = test_scenario::take_from_sender<profiles::CreatorCap>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            disputes::file_dispute_as_creator(
                &creator_cap,
                object::id_from_address(@0x1), // Mock campaign ID
                option::none(),
                disputes::dispute_type_payment(),
                string::utf8(b"dispute_2"),
                string::utf8(b"Payment not received as agreed"),
                vector[string::utf8(b"https://evidence2.com")],
                BRAND_USER,
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_to_sender(scenario, creator_cap);
            clock::destroy_for_testing(clock);
        };

        // Verify dispute was created
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let dispute = test_scenario::take_shared<Dispute>(scenario);
            
            assert!(disputes::get_dispute_string_id(&dispute) == string::utf8(b"dispute_2"), 0);
            assert!(disputes::get_dispute_initiator(&dispute) == CREATOR_USER, 1);
            assert!(disputes::get_dispute_respondent(&dispute) == BRAND_USER, 2);
            assert!(disputes::get_dispute_type(&dispute) == disputes::dispute_type_payment(), 3);
            assert!(disputes::get_dispute_status(&dispute) == disputes::dispute_status_filed(), 4);

            test_scenario::return_shared(dispute);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_evidence_submission() {
        let mut scenario_val = setup_dispute_scenario();
        let scenario = &mut scenario_val;

        // Creator submits additional evidence
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let mut dispute = test_scenario::take_shared<Dispute>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            disputes::submit_evidence(
                &mut dispute,
                string::utf8(b"https://creator-evidence.com"),
                &clock,
                test_scenario::ctx(scenario)
            );

            // Verify evidence was added
            assert!(disputes::get_respondent_evidence_count(&dispute) == 1, 0);
            assert!(disputes::get_respondent_evidence_at(&dispute, 0) == string::utf8(b"https://creator-evidence.com"), 1);

            test_scenario::return_shared(dispute);
            clock::destroy_for_testing(clock);
        };

        // Brand submits additional evidence  
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let mut dispute = test_scenario::take_shared<Dispute>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            disputes::submit_evidence(
                &mut dispute,
                string::utf8(b"https://brand-additional-evidence.com"),
                &clock,
                test_scenario::ctx(scenario)
            );

            // Verify evidence was added (brand is initiator, so goes to initiator evidence)
            assert!(disputes::get_initiator_evidence_count(&dispute) == 2, 2); // Original + new
            assert!(disputes::get_initiator_evidence_at(&dispute, 1) == string::utf8(b"https://brand-additional-evidence.com"), 3);

            test_scenario::return_shared(dispute);
            clock::destroy_for_testing(clock);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_dispute_resolution_flow() {
        let mut scenario_val = setup_dispute_scenario();
        let scenario = &mut scenario_val;

        // Admin assigns resolver
        test_scenario::next_tx(scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(scenario);
            let mut dispute = test_scenario::take_shared<Dispute>(scenario);

            disputes::assign_resolver(
                &admin_cap,
                &mut dispute,
                RESOLVER,
                test_scenario::ctx(scenario)
            );

            assert!(disputes::get_dispute_status(&dispute) == disputes::dispute_status_in_review(), 0);
            assert!(disputes::get_dispute_resolver_address(&dispute) == option::some(RESOLVER), 1);

            test_scenario::return_to_sender(scenario, admin_cap);
            test_scenario::return_shared(dispute);
        };

        // Admin creates dispute resolution capability for resolver
        test_scenario::next_tx(scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(scenario);

            disputes::create_dispute_resolution_cap(
                &admin_cap,
                RESOLVER,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_to_sender(scenario, admin_cap);
        };

        // Resolver resolves the dispute
        test_scenario::next_tx(scenario, RESOLVER);
        {
            let resolution_cap = test_scenario::take_from_sender<DisputeResolutionCap>(scenario);
            let mut dispute = test_scenario::take_shared<Dispute>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            disputes::resolve_dispute(
                &resolution_cap,
                &mut dispute,
                string::utf8(b"After reviewing evidence, the brand's claim is valid. Creator must revise content."),
                &clock,
                test_scenario::ctx(scenario)
            );

            // Verify dispute was resolved
            assert!(disputes::get_dispute_status(&dispute) == disputes::dispute_status_resolved(), 0);
            assert!(disputes::is_dispute_resolved(&dispute), 1);
            assert!(!disputes::is_dispute_active(&dispute), 2);
            assert!(disputes::get_dispute_resolution(&dispute) == option::some(string::utf8(b"After reviewing evidence, the brand's claim is valid. Creator must revise content.")), 3);

            test_scenario::return_to_sender(scenario, resolution_cap);
            test_scenario::return_shared(dispute);
            clock::destroy_for_testing(clock);
        };

        // Admin closes the dispute
        test_scenario::next_tx(scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(scenario);
            let mut dispute = test_scenario::take_shared<Dispute>(scenario);

            disputes::close_dispute(
                &admin_cap,
                &mut dispute,
                test_scenario::ctx(scenario)
            );

            assert!(disputes::get_dispute_status(&dispute) == disputes::dispute_status_closed(), 0);

            test_scenario::return_to_sender(scenario, admin_cap);
            test_scenario::return_shared(dispute);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_dispute_helper_functions() {
        let mut scenario_val = setup_dispute_scenario();
        let scenario = &mut scenario_val;

        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let dispute = test_scenario::take_shared<Dispute>(scenario);

            // Test dispute type helper functions
            assert!(disputes::dispute_type_payment() == 0, 0);
            assert!(disputes::dispute_type_content() == 1, 1);
            assert!(disputes::dispute_type_contract() == 2, 2);

            // Test status helper functions
            assert!(disputes::dispute_status_filed() == 0, 3);
            assert!(disputes::dispute_status_in_review() == 1, 4);
            assert!(disputes::dispute_status_resolved() == 2, 5);
            assert!(disputes::dispute_status_closed() == 3, 6);

            // Test state checking functions
            assert!(disputes::is_dispute_active(&dispute), 7);
            assert!(!disputes::is_dispute_resolved(&dispute), 8);
            assert!(disputes::can_submit_evidence(&dispute), 9);

            test_scenario::return_shared(dispute);
        };

        test_scenario::end(scenario_val);
    }

    // Helper functions
    fun setup_basic_profiles(): Scenario {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Initialize admin and registry
        test_scenario::next_tx(scenario, ADMIN);
        {
            profiles::init_for_testing(test_scenario::ctx(scenario));
        };

        // Setup brand using profiles system
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            profiles::create_brand_profile(
                string::utf8(b"test_brand"),
                string::utf8(b"Test Brand"),
                string::utf8(b"Test brand description"),
                string::utf8(b"https://test.com/logo.png"),
                &clock,
                test_scenario::ctx(scenario)
            );

            clock::destroy_for_testing(clock);
        };

        // Setup creator using profiles system
        test_scenario::next_tx(scenario, CREATOR_USER);
        {
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            profiles::create_creator_profile(
                string::utf8(b"test_creator"),
                string::utf8(b"Test Creator"),
                string::utf8(b"https://test.com/avatar.png"),
                option::some(string::utf8(b"@testcreator")),
                option::some(string::utf8(b"@testcreator_ig")),
                option::none(),
                option::some(string::utf8(b"TestCreatorYT")),
                &clock,
                test_scenario::ctx(scenario)
            );

            clock::destroy_for_testing(clock);
        };

        scenario_val
    }

    fun setup_dispute_scenario(): Scenario {
        let mut scenario_val = setup_basic_profiles();
        let scenario = &mut scenario_val;

        // Brand files a dispute
        test_scenario::next_tx(scenario, BRAND_USER);
        {
            let brand_cap = test_scenario::take_from_sender<profiles::BrandCap>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            disputes::file_dispute_as_brand(
                &brand_cap,
                object::id_from_address(@0x1), // Mock campaign ID
                option::none(),
                disputes::dispute_type_content(),
                string::utf8(b"test_dispute"),
                string::utf8(b"Test dispute description"),
                vector[string::utf8(b"https://evidence1.com")],
                CREATOR_USER,
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_to_sender(scenario, brand_cap);
            clock::destroy_for_testing(clock);
        };

        scenario_val
    }
}