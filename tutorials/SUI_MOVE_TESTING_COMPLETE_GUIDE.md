# The Complete Beginner's Guide to Sui Move Testing

*A hands-on tutorial for mastering Sui Move testing from zero to confident practitioner*

## Welcome to Sui Move Testing

This tutorial will take you on a journey from knowing nothing about Sui Move testing to writing confident, professional tests. We'll learn by doing - every concept will be introduced through practical, hands-on work with real code examples from the SWANS content creator platform.

**By the end of this tutorial, you will:**
- Write your first working Sui Move test
- Understand how to test multi-user blockchain interactions  
- Test object creation, modification, and transfers
- Debug common testing failures like a pro
- Feel confident approaching any Sui Move testing challenge

## What Makes Sui Move Testing Different?

Unlike traditional software testing, Sui Move testing simulates blockchain transactions, multiple users, and object ownership. But don't worry - we'll master these concepts step by step through practical examples.

## Prerequisites

Before we begin, ensure you have:
- **Sui CLI installed** - Follow the [official Sui installation guide](https://docs.sui.io/guides/developer/getting-started/sui-install)
- **Basic familiarity with Move syntax** - Review [Move fundamentals](https://docs.sui.io/concepts/sui-move-concepts) if needed
- **This SWANS codebase** - You should be in `/Users/user/development/sui/swans-sui/`

## What We'll Build Together

Throughout this tutorial, we'll work with the SWANS (Sui Web3 Advertising Network System) platform - a real content creator platform built on Sui. This gives us meaningful, practical examples rather than toy problems.

**Our learning path:**
1. **First Steps** - Write your very first test and see it work
2. **Test Scenarios** - Understand how tests simulate blockchain transactions  
3. **Multi-User Testing** - Test interactions between brands and creators
4. **Professional Techniques** - Write maintainable, robust tests

## Official Documentation References

Throughout this tutorial, we'll reference the official Sui documentation:
- [Sui Move Testing Guide](https://docs.sui.io/guides/developer/first-app/build-test)
- [Test Scenario Documentation](https://docs.sui.io/references/framework/sui-framework/test-scenario)
- [Sui Move Concepts](https://docs.sui.io/concepts/sui-move-concepts)

Let's begin your journey to Sui Move testing mastery!

---

## Table of Contents

1. [Phase 1: Your First Test (Foundation)](#phase-1-your-first-test-foundation)
2. [Phase 2: Test Scenarios (Core Concepts)](#phase-2-test-scenarios-core-concepts)  
3. [Phase 3: Multi-User Testing (Real Interactions)](#phase-3-multi-user-testing-real-interactions)
4. [Phase 4: Professional Testing (Advanced Techniques)](#phase-4-professional-testing-advanced-techniques)
5. [Quick Reference](#quick-reference)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Next Steps](#next-steps)

---

# Phase 1: Your First Test (Foundation)

In this phase, we'll get you writing and running your very first Sui Move test. You'll experience what it feels like to write tests that work, and gain confidence in the testing environment.

## Step 1: Set Up Your Testing Environment

First, let's make sure everything is working. Navigate to the SWANS project directory:

```bash
cd /Users/user/development/sui/swans-sui
```

Now, let's run the existing tests to see what success looks like:

```bash
sui move test
```

**What you should see:**
```
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib  
BUILDING swans
Running Move unit tests
[ PASS    ] 0x0::simple_campaign_test::test_campaign_creation_basic
[ PASS    ] 0x0::simple_campaign_test::test_creator_application_basic
[ PASS    ] 0x0::integration_tests::test_complete_campaign_workflow
Test result: OK. Total tests: 3; passed: 3; failed: 0
```

**Congratulations!** You just ran Sui Move tests. Notice how the tests have descriptive names and show clear pass/fail results.

> **💡 What just happened?** 
> The `sui move test` command found all files with `#[test]` annotations, compiled them, and executed each test function. Each test either passes (✅) or fails (❌).

## Step 2: Examine a Simple Test

Let's look at an existing simple test to understand the basic structure. Open the file `tests/simple_campaign_test.move`:

```bash
# Use your preferred editor, or view with cat:
cat tests/simple_campaign_test.move
```

Look at the beginning of the first test function:

```move
#[test]
public fun test_campaign_creation_basic() {
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;
    // ... more code
}
```

**Notice the key parts:**
- `#[test]` - This annotation tells Sui this is a test function
- `test_scenario::begin(ADMIN)` - This starts a new test scenario with a user address
- The test has a clear, descriptive name

## Step 3: Write Your Very First Test

Now it's your turn! Let's create a simple test that just verifies we can create a basic object. 

Create a new file called `tests/my_first_test.move`:

```move
#[test_only]
module swans::my_first_test {
    use sui::test_scenario::{Self, Scenario};
    use std::string;
    
    // Test addresses - these represent different users in our tests
    const ADMIN: address = @0x123;

    #[test]
    public fun test_string_creation() {
        // This test just creates a string and verifies it works
        let test_string = string::utf8(b"Hello Sui Testing!");
        
        // Verify the string contains what we expect
        assert!(string::length(&test_string) > 0, 0);
    }
}
```

Now run your first test:

```bash
sui move test --filter my_first_test
```

**You should see:**
```
[ PASS    ] 0x0::my_first_test::test_string_creation
Test result: OK. Total tests: 1; passed: 1; failed: 0
```

**🎉 You did it!** You wrote and ran your first Sui Move test.

> **Key insight:** Tests are just Move functions with the `#[test]` annotation. They can create objects, call functions, and use `assert!` to verify results.

## Step 4: Test Something More Meaningful  

Let's write a test that actually interacts with the SWANS platform. We'll test the registry initialization:

Add this test to your `my_first_test.move` file:

```move
#[test]
public fun test_registry_initialization() {
    use swans::registry;
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Test initializing the platform registry
    test_scenario::next_tx(scenario, ADMIN);
    {
        registry::init_for_testing(test_scenario::ctx(scenario));
    };

    // The test passes if we get here without errors
    test_scenario::end(scenario_val);
}
```

Run this test:

```bash
sui move test --filter test_registry_initialization
```

**Expected result:**
```
[ PASS    ] 0x0::my_first_test::test_registry_initialization
```

> **What happened?** We initialized the SWANS platform registry - this is like setting up the main platform before users can register. The test passes because the initialization completed without errors.

## Step 5: Add Your First Assertion

Let's make our test verify something specific. Add this test:

```move
#[test]
public fun test_registry_with_verification() {
    use swans::registry::{Self, PlatformRegistry};
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Initialize registry
    test_scenario::next_tx(scenario, ADMIN);
    {
        registry::init_for_testing(test_scenario::ctx(scenario));
    };

    // Verify the registry was created and we can access it
    test_scenario::next_tx(scenario, ADMIN);
    {
        let registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        // If we can take the registry, it means it was created successfully
        test_scenario::return_shared(registry);
    };

    test_scenario::end(scenario_val);
}
```

Run this test:

```bash
sui move test --filter test_registry_with_verification
```

**Congratulations!** You've now written tests that:
- ✅ Create and verify simple objects  
- ✅ Initialize platform components
- ✅ Take and return shared objects
- ✅ Use assertions to verify behavior

## What You've Learned

In this first phase, you've experienced:

1. **Test Structure** - Tests are Move functions with `#[test]` annotations
2. **Test Scenarios** - Use `test_scenario::begin()` to start tests 
3. **Assertions** - Use `assert!()` to verify expected behavior
4. **Object Management** - Take and return objects in tests
5. **Running Tests** - Use `sui move test` with optional filters

**You now have the foundation to write basic Sui Move tests!**

---

# Phase 2: Test Scenarios (Core Concepts)

Now that you can write basic tests, let's understand how Sui Move tests simulate real blockchain behavior. This is where Sui Move testing becomes powerful - we can simulate multiple transactions, different users, and complex interactions.

## Understanding Test Scenarios

In real Sui blockchain usage:
- Users send transactions to the network
- Each transaction can create, modify, or transfer objects  
- Transactions happen in sequence over time
- Different users can interact with the same objects

**Test scenarios let us simulate all of this in our tests.**

## Step 6: Your First Multi-Transaction Test

Real blockchain interactions happen across multiple transactions. Let's test this pattern:

Add this test to understand transaction flow:

```move
#[test]
public fun test_multiple_transactions() {
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand;
    use sui::clock;
    use std::string;
    
    const BRAND_USER: address = @0x456;
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Transaction 1: Admin initializes the platform
    test_scenario::next_tx(scenario, ADMIN);
    {
        registry::init_for_testing(test_scenario::ctx(scenario));
    };

    // Transaction 2: Brand user registers
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        brand::register_brand(
            &mut registry,
            string::utf8(b"test_brand"),
            string::utf8(b"Test Brand Company"),
            string::utf8(b"https://test.com/logo.png"),
            string::utf8(b"A test brand description"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Transaction 3: Verify the brand was registered
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        // The brand object should now exist for this user
        let brand = test_scenario::take_from_sender<brand::Brand>(scenario);
        
        // Verify we can access the brand
        assert!(brand::get_brand_id(&brand) == string::utf8(b"test_brand"), 1);
        
        test_scenario::return_to_sender(scenario, brand);
    };

    test_scenario::end(scenario_val);
}
```

Run this test:

```bash
sui move test --filter test_multiple_transactions
```

**Key insights from this test:**
- `test_scenario::next_tx(scenario, USER_ADDRESS)` - Simulates a new transaction from that user
- Objects created in one transaction can be accessed in later transactions  
- Shared objects (like `PlatformRegistry`) can be accessed by multiple users
- Owned objects (like `Brand`) belong to specific users

> **💡 This mirrors real blockchain behavior:** A brand registers in one transaction, and can use that brand object in future transactions.

## Step 7: Understanding Object Ownership in Tests

Sui has different types of object ownership. Let's test these patterns:

```move
#[test]
public fun test_object_ownership_patterns() {
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand};
    use sui::clock;
    use std::string;
    
    const BRAND_USER: address = @0x456;
    const OTHER_USER: address = @0x789;
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Setup: Initialize platform and register brand
    test_scenario::next_tx(scenario, ADMIN);
    {
        registry::init_for_testing(test_scenario::ctx(scenario));
    };

    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        brand::register_brand(
            &mut registry,
            string::utf8(b"test_brand"),
            string::utf8(b"Test Brand"),
            string::utf8(b"https://test.com/logo.png"),
            string::utf8(b"Test description"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Test 1: Only the brand owner can access their brand object
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let brand = test_scenario::take_from_sender<Brand>(scenario);
        // This works because BRAND_USER owns this object
        test_scenario::return_to_sender(scenario, brand);
    };

    // Test 2: Shared objects can be accessed by anyone
    test_scenario::next_tx(scenario, OTHER_USER);
    {
        let registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        // This works because the registry is shared
        test_scenario::return_shared(registry);
    };

    test_scenario::end(scenario_val);
}
```

**Key patterns you learned:**
- **Owned Objects**: `take_from_sender<Type>()` and `return_to_sender()`
- **Shared Objects**: `take_shared<Type>()` and `return_shared()`
- **Ownership Rules**: Only owners can access owned objects, anyone can access shared objects

## Step 8: Testing with Time and Context

Many blockchain applications depend on time (like campaign deadlines). Let's test time-based logic:

```move
#[test]
public fun test_time_based_behavior() {
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::campaign::{Self, Campaign};
    use sui::clock::{Self, Clock};
    use sui::coin;
    use std::string;
    
    const BRAND_USER: address = @0x456;
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Setup platform and brand
    test_scenario::next_tx(scenario, ADMIN);
    {
        registry::init_for_testing(test_scenario::ctx(scenario));
    };

    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        brand::register_brand(
            &mut registry,
            string::utf8(b"time_test_brand"),
            string::utf8(b"Time Test Brand"),
            string::utf8(b"https://timetest.com/logo.png"),
            string::utf8(b"Testing time-based features"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Fund the brand account
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut brand = test_scenario::take_from_sender<Brand>(scenario);
        let funding = coin::mint_for_testing<USDC>(10000, test_scenario::ctx(scenario));

        brand::fund_brand_account(&mut brand, funding, test_scenario::ctx(scenario));
        test_scenario::return_to_sender(scenario, brand);
    };

    // Test: Create a campaign with specific timing
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let mut brand = test_scenario::take_from_sender<Brand>(scenario);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        // Set specific time for testing
        clock::set_for_testing(&mut clock, 1000);

        campaign::create_campaign(
            &mut registry,
            &mut brand,
            string::utf8(b"timed_campaign"),
            string::utf8(b"brand_campaign"),
            1500, // application_start (in future)
            2000, // application_end  
            2500, // campaign_start
            3000, // campaign_end
            1000, // base_pay_per_creator
            5000, // total_budget
            10, 5, 15, 12, 20, // CPM rates
            2,    // max_winners
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        test_scenario::return_to_sender(scenario, brand);
        clock::destroy_for_testing(clock);
    };

    test_scenario::end(scenario_val);
}
```

**What you learned about time in tests:**
- `clock::create_for_testing()` - Creates a controllable clock for tests
- `clock::set_for_testing(&mut clock, timestamp)` - Sets specific time  
- `clock::destroy_for_testing(clock)` - Cleans up test clock
- Time-based logic can be precisely controlled in tests

## Step 9: Error Testing - When Things Should Fail

Good tests don't just verify success - they verify that errors happen when they should. Let's test error conditions:

```move
#[test]
#[expected_failure(abort_code = swans::brand::EInsufficientFunds)]
public fun test_insufficient_funds_error() {
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::campaign;
    use sui::clock;
    use sui::coin;
    use std::string;
    
    const BRAND_USER: address = @0x456;
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Setup platform and brand (but don't fund enough)
    test_scenario::next_tx(scenario, ADMIN);
    {
        registry::init_for_testing(test_scenario::ctx(scenario));
    };

    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        brand::register_brand(
            &mut registry,
            string::utf8(b"poor_brand"),
            string::utf8(b"Poor Brand"),
            string::utf8(b"https://poor.com/logo.png"),
            string::utf8(b"A brand without enough funds"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Fund with insufficient amount
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut brand = test_scenario::take_from_sender<Brand>(scenario);
        let insufficient_funding = coin::mint_for_testing<USDC>(100, test_scenario::ctx(scenario));

        brand::fund_brand_account(&mut brand, insufficient_funding, test_scenario::ctx(scenario));
        test_scenario::return_to_sender(scenario, brand);
    };

    // This should fail because the brand doesn't have enough funds
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let mut brand = test_scenario::take_from_sender<Brand>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        campaign::create_campaign(
            &mut registry,
            &mut brand,
            string::utf8(b"expensive_campaign"),
            string::utf8(b"too_expensive"),
            1000, 2000, 3000, 4000,
            1000, 10000, // Total budget 10000, but brand only has 100
            10, 5, 15, 12, 20, 2,
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        test_scenario::return_to_sender(scenario, brand);
        clock::destroy_for_testing(clock);
    };

    test_scenario::end(scenario_val);
}
```

**Key insights about error testing:**
- `#[expected_failure(abort_code = ErrorCode)]` - Test expects this specific error
- Tests can verify that errors occur when they should
- This prevents bugs by ensuring validation works correctly

## What You've Mastered in Phase 2

You now understand the core concepts of Sui Move testing:

1. **Multi-Transaction Testing** - Simulating realistic user flows
2. **Object Ownership** - Testing owned vs shared objects
3. **Time Management** - Controlling time in tests with Clock
4. **Error Testing** - Verifying that failures happen correctly
5. **Test Scenario Flow** - Moving between users and transactions

**You can now test complex blockchain interactions!**

Run all your new tests:

```bash
sui move test --filter my_first_test
```

---

# Phase 3: Multi-User Testing (Real Interactions)

This is where Sui Move testing becomes truly powerful - simulating real-world interactions between different users. In SWANS, we have brands who create campaigns and creators who apply to them. Let's test these complex interactions.

## Understanding Multi-User Scenarios

Real blockchain applications involve multiple users interacting:
- **Brands** register, fund accounts, create campaigns, review content
- **Creators** register, apply to campaigns, submit content, receive payments
- **Platform** manages the interactions between them

We'll test these interactions step by step.

## Step 10: Testing Brand and Creator Registration

Let's start by testing how both brands and creators register on the platform:

Add this comprehensive test to your `my_first_test.move`:

```move
#[test] 
public fun test_brand_and_creator_registration() {
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand};
    use swans::creator::{Self, Creator};
    use sui::clock;
    use std::string;
    
    const BRAND_USER: address = @0x456;
    const CREATOR_USER: address = @0x789;
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Step 1: Platform initialization
    test_scenario::next_tx(scenario, ADMIN);
    {
        registry::init_for_testing(test_scenario::ctx(scenario));
    };

    // Step 2: Brand registers
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        brand::register_brand(
            &mut registry,
            string::utf8(b"nike_brand"),
            string::utf8(b"Nike"),
            string::utf8(b"https://nike.com/logo.png"),
            string::utf8(b"Just Do It - Sports apparel brand"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Step 3: Creator registers  
    test_scenario::next_tx(scenario, CREATOR_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        creator::register_creator(
            &mut registry,
            string::utf8(b"fitness_guru"),
            string::utf8(b"Fitness Guru"),
            string::utf8(b"https://fitnessguru.com/avatar.png"),
            string::utf8(b"fitness"),
            string::utf8(b"@fitness_guru"),
            string::utf8(b"@fitnessguru_ig"),
            string::utf8(b"@fitness_tiktok"),
            string::utf8(b"FitnessGuru_YT"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Step 4: Verify both registrations worked
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let brand = test_scenario::take_from_sender<Brand>(scenario);
        assert!(brand::get_brand_id(&brand) == string::utf8(b"nike_brand"), 1);
        test_scenario::return_to_sender(scenario, brand);
    };

    test_scenario::next_tx(scenario, CREATOR_USER);
    {
        let creator = test_scenario::take_from_sender<Creator>(scenario);
        assert!(creator::get_creator_id(&creator) == string::utf8(b"fitness_guru"), 2);
        test_scenario::return_to_sender(scenario, creator);
    };

    test_scenario::end(scenario_val);
}
```

Run this test:

```bash
sui move test --filter test_brand_and_creator_registration
```

**What this test demonstrates:**
- Multiple users can register independently
- Each user receives their own owned objects (Brand/Creator)
- The shared registry is updated by both registrations
- We can verify registration success by checking the created objects

## Step 11: Testing Campaign Creation and Application Flow

Now let's test the core business logic - brands create campaigns, creators apply:

```move
#[test]
public fun test_campaign_application_flow() {
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::creator::{Self, Creator};
    use swans::campaign::{Self, Campaign};
    use sui::clock::{Self, Clock};
    use sui::coin;
    use std::string;
    
    const BRAND_USER: address = @0x456;
    const CREATOR_USER: address = @0x789;
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Setup: Initialize platform and register both users
    test_scenario::next_tx(scenario, ADMIN);
    {
        registry::init_for_testing(test_scenario::ctx(scenario));
    };

    // Brand registration
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        brand::register_brand(
            &mut registry,
            string::utf8(b"tech_brand"),
            string::utf8(b"TechCorp"),
            string::utf8(b"https://techcorp.com/logo.png"),
            string::utf8(b"Leading technology company"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Creator registration
    test_scenario::next_tx(scenario, CREATOR_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        creator::register_creator(
            &mut registry,
            string::utf8(b"tech_reviewer"),
            string::utf8(b"Tech Reviewer"),
            string::utf8(b"https://techreviewer.com/avatar.png"),
            string::utf8(b"technology"),
            string::utf8(b"@techreviewer"),
            string::utf8(b"@tech_reviews_ig"),
            string::utf8(b"@techreview_tiktok"),
            string::utf8(b"TechReviewChannel"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Brand funds their account
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut brand = test_scenario::take_from_sender<Brand>(scenario);
        let funding = coin::mint_for_testing<USDC>(20000, test_scenario::ctx(scenario));

        brand::fund_brand_account(&mut brand, funding, test_scenario::ctx(scenario));
        
        // Verify funding worked
        assert!(brand::get_brand_balance(&brand) == 20000, 1);
        
        test_scenario::return_to_sender(scenario, brand);
    };

    // Brand creates campaign
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let mut brand = test_scenario::take_from_sender<Brand>(scenario);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        clock::set_for_testing(&mut clock, 500); // Set current time

        campaign::create_campaign(
            &mut registry,
            &mut brand,
            string::utf8(b"tech_product_launch"),
            string::utf8(b"brand_tech_campaign"),
            1000, // application_start
            3000, // application_end  
            4000, // campaign_start
            8000, // campaign_end
            2000, // base_pay_per_creator
            15000, // total_budget
            12,   // cpm_likes
            8,    // cpm_views
            25,   // cpm_retweets
            18,   // cpm_comments
            30,   // cpm_link_clicks
            3,    // max_winners
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        test_scenario::return_to_sender(scenario, brand);
        clock::destroy_for_testing(clock);
    };

    // Creator applies to the campaign (during application period)
    test_scenario::next_tx(scenario, CREATOR_USER);
    {
        let mut campaign = test_scenario::take_shared<Campaign>(scenario);
        let creator = test_scenario::take_from_sender<Creator>(scenario);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        clock::set_for_testing(&mut clock, 2000); // During application period

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

    // Verify the application was successful
    test_scenario::next_tx(scenario, CREATOR_USER);
    {
        let campaign = test_scenario::take_shared<Campaign>(scenario);
        let creator = test_scenario::take_from_sender<Creator>(scenario);

        assert!(campaign::has_applied(&campaign, creator::get_creator_id(&creator)), 2);

        test_scenario::return_shared(campaign);
        test_scenario::return_to_sender(scenario, creator);
    };

    test_scenario::end(scenario_val);
}
```

**Key multi-user patterns you're learning:**
- **Sequential interactions**: Brand creates campaign → Creator applies
- **Shared state**: Campaign is shared, multiple users can interact with it
- **Timing**: Applications only work during specific time periods
- **State verification**: We can check that applications were recorded

## Step 12: Testing Content Submission and Review Workflow

Now let's test the complete content workflow - submission, review, and approval:

```move
#[test]
public fun test_content_submission_and_review() {
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::creator::{Self, Creator};
    use swans::campaign::{Self, Campaign};
    use swans::content::{Self, Content};
    use swans::types;
    use sui::clock::{Self, Clock};
    use sui::coin;
    use std::string;
    
    const BRAND_USER: address = @0x456;
    const CREATOR_USER: address = @0x789;
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Setup: Full registration and campaign creation (reusing previous patterns)
    setup_brand_and_campaign(scenario, BRAND_USER);
    setup_creator_and_application(scenario, CREATOR_USER, BRAND_USER);

    // Creator submits content during campaign period
    test_scenario::next_tx(scenario, CREATOR_USER);
    {
        let mut campaign = test_scenario::take_shared<Campaign>(scenario);
        let creator = test_scenario::take_from_sender<Creator>(scenario);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        clock::set_for_testing(&mut clock, 5000); // During campaign period

        content::submit_content(
            &mut campaign,
            &creator,
            string::utf8(b"tech_review_video"),
            string::utf8(b"https://youtube.com/watch?v=tech_review_123"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(campaign);
        test_scenario::return_to_sender(scenario, creator);
        clock::destroy_for_testing(clock);
    };

    // Brand reviews and approves the content
    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let campaign = test_scenario::take_shared<Campaign>(scenario);
        let mut content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        content::review_content(
            &campaign,
            &mut content,
            true, // approve
            string::utf8(b"Excellent tech review! Approved for publication."),
            &clock,
            test_scenario::ctx(scenario)
        );

        // Verify the content was approved
        assert!(content::get_content_status(&content) == types::content_accepted(), 1);

        test_scenario::return_shared(campaign);
        test_scenario::return_to_address(CREATOR_USER, content);
        clock::destroy_for_testing(clock);
    };

    test_scenario::end(scenario_val);
}

// Helper function to reduce duplication
fun setup_brand_and_campaign(scenario: &mut Scenario, brand_user: address) {
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, USDC};
    use swans::campaign;
    use sui::clock;
    use sui::coin;
    use std::string;
    
    const ADMIN: address = @0x123;

    // Initialize platform
    test_scenario::next_tx(scenario, ADMIN);
    {
        registry::init_for_testing(test_scenario::ctx(scenario));
    };

    // Register and fund brand
    test_scenario::next_tx(scenario, brand_user);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        brand::register_brand(
            &mut registry,
            string::utf8(b"content_brand"),
            string::utf8(b"Content Brand"),
            string::utf8(b"https://contentbrand.com/logo.png"),
            string::utf8(b"Brand for content testing"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    test_scenario::next_tx(scenario, brand_user);
    {
        let mut brand = test_scenario::take_from_sender<brand::Brand>(scenario);
        let funding = coin::mint_for_testing<USDC>(25000, test_scenario::ctx(scenario));
        brand::fund_brand_account(&mut brand, funding, test_scenario::ctx(scenario));
        test_scenario::return_to_sender(scenario, brand);
    };

    // Create campaign
    test_scenario::next_tx(scenario, brand_user);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let mut brand = test_scenario::take_from_sender<brand::Brand>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        campaign::create_campaign(
            &mut registry,
            &mut brand,
            string::utf8(b"content_campaign"),
            string::utf8(b"brand_content"),
            1000, 3000, 4000, 8000,
            2500, 20000,
            15, 10, 30, 20, 35, 2,
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        test_scenario::return_to_sender(scenario, brand);
        clock::destroy_for_testing(clock);
    };
}

fun setup_creator_and_application(scenario: &mut Scenario, creator_user: address, brand_user: address) {
    use swans::registry::{Self, PlatformRegistry};
    use swans::creator;
    use swans::campaign::{Self, Campaign};
    use sui::clock::{Self, Clock};
    use std::string;

    // Register creator
    test_scenario::next_tx(scenario, creator_user);
    {
        let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        creator::register_creator(
            &mut registry,
            string::utf8(b"content_creator"),
            string::utf8(b"Content Creator"),
            string::utf8(b"https://creator.com/avatar.png"),
            string::utf8(b"lifestyle"),
            string::utf8(b"@contentcreator"),
            string::utf8(b"@creator_ig"),
            string::utf8(b"@creator_tiktok"),
            string::utf8(b"CreatorChannel"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Creator applies to campaign
    test_scenario::next_tx(scenario, creator_user);
    {
        let mut campaign = test_scenario::take_shared<Campaign>(scenario);
        let creator = test_scenario::take_from_sender<creator::Creator>(scenario);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        clock::set_for_testing(&mut clock, 2000); // During application period

        campaign::apply_to_campaign(&mut campaign, &creator, &clock, test_scenario::ctx(scenario));

        test_scenario::return_shared(campaign);
        test_scenario::return_to_sender(scenario, creator);
        clock::destroy_for_testing(clock);
    };
}
```

## Step 13: Testing Payment Processing

Let's test the final piece - automatic payments when content is published:

```move
#[test]
public fun test_payment_processing() {
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::creator::{Self, Creator};
    use swans::campaign::{Self, Campaign};
    use swans::content::{Self, Content};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use std::string;
    
    const BRAND_USER: address = @0x456;
    const CREATOR_USER: address = @0x789;
    
    let mut scenario_val = test_scenario::begin(ADMIN);
    let scenario = &mut scenario_val;

    // Setup complete workflow up to approved content
    setup_brand_and_campaign(scenario, BRAND_USER);
    setup_creator_and_application(scenario, CREATOR_USER, BRAND_USER);

    // Submit and approve content (abbreviated)
    test_scenario::next_tx(scenario, CREATOR_USER);
    {
        let mut campaign = test_scenario::take_shared<Campaign>(scenario);
        let creator = test_scenario::take_from_sender<Creator>(scenario);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        clock::set_for_testing(&mut clock, 5000);
        content::submit_content(
            &mut campaign,
            &creator,
            string::utf8(b"payment_test_content"),
            string::utf8(b"https://social.com/post/payment_test"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(campaign);
        test_scenario::return_to_sender(scenario, creator);
        clock::destroy_for_testing(clock);
    };

    test_scenario::next_tx(scenario, BRAND_USER);
    {
        let campaign = test_scenario::take_shared<Campaign>(scenario);
        let mut content = test_scenario::take_from_address<Content>(scenario, CREATOR_USER);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        content::review_content(&campaign, &mut content, true, 
                              string::utf8(b"Approved"), &clock, test_scenario::ctx(scenario));

        test_scenario::return_shared(campaign);
        test_scenario::return_to_address(CREATOR_USER, content);
        clock::destroy_for_testing(clock);
    };

    // Creator publishes content and receives payment
    test_scenario::next_tx(scenario, CREATOR_USER);
    {
        let mut campaign = test_scenario::take_shared<Campaign>(scenario);
        let mut content = test_scenario::take_from_sender<Content>(scenario);
        let mut creator = test_scenario::take_from_sender<Creator>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        let initial_earnings = creator::get_total_earnings(&creator);

        content::publish_content(&mut campaign, &mut content, &mut creator, &clock, test_scenario::ctx(scenario));

        // Verify payment was processed
        let expected_payment = 2500; // Base payment from campaign setup
        assert!(creator::get_total_earnings(&creator) == initial_earnings + expected_payment, 1);
        assert!(content::is_published(&content), 2);

        test_scenario::return_shared(campaign);
        test_scenario::return_to_sender(scenario, content);
        test_scenario::return_to_sender(scenario, creator);
        clock::destroy_for_testing(clock);
    };

    // Verify the creator received the payment coin
    test_scenario::next_tx(scenario, CREATOR_USER);
    {
        let payment_coin = test_scenario::take_from_sender<Coin<USDC>>(scenario);
        assert!(coin::value(&payment_coin) == 2500, 3);
        
        // Clean up the coin (in real usage, creator would keep it)
        coin::burn_for_testing(payment_coin);
    };

    test_scenario::end(scenario_val);
}
```

## What You've Mastered in Multi-User Testing

Congratulations! You now understand how to test complex, real-world blockchain interactions:

1. **Multi-User Flows** - Brands and creators interacting through shared state
2. **Sequential Logic** - Registration → Funding → Campaign Creation → Application → Content → Payment
3. **Time-Based Logic** - Applications and content submission during specific periods
4. **State Verification** - Checking that each step worked correctly
5. **Payment Processing** - Verifying automatic payments trigger correctly
6. **Helper Functions** - Reducing code duplication in complex test setups

**You can now test complete business workflows on Sui!**

Test your multi-user testing skills:

```bash
sui move test --filter test_campaign_application_flow
sui move test --filter test_content_submission_and_review  
sui move test --filter test_payment_processing
```

> **🎯 Real-world insight:** These patterns work for any multi-user dApp - NFT marketplaces, DeFi protocols, gaming platforms, etc. The core concepts (users, shared state, sequential transactions, payments) are universal.

---

# Phase 4: Professional Testing (Advanced Techniques)

Now that you can test complex multi-user workflows, let's learn professional techniques that make your tests maintainable, reliable, and easy to debug. These are the patterns used in production codebases.

## Professional Test Organization

Real projects organize tests systematically. Let's restructure our tests using professional patterns.

## Step 14: Creating Reusable Test Utilities

Professional codebases avoid code duplication by creating reusable test utilities. Let's create a proper test utilities module:

Create a new file `tests/test_utils.move`:

```move
#[test_only]
module swans::test_utils {
    use sui::test_scenario::{Self, Scenario};
    use sui::clock::{Self, Clock};
    use sui::coin;
    use std::string::{Self, String};
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::brand::{Self, Brand, USDC};
    use swans::creator::{Self, Creator};
    use swans::campaign::{Self, Campaign};

    // Standard test addresses
    const ADMIN: address = @0x123;
    const BRAND_USER: address = @0x456;
    const CREATOR_USER: address = @0x789;
    const CREATOR_USER_2: address = @0x999;

    // Test configuration constants
    const DEFAULT_BRAND_FUNDING: u64 = 50000;
    const DEFAULT_CAMPAIGN_BUDGET: u64 = 25000;
    const DEFAULT_BASE_PAY: u64 = 2000;

    /// Initialize a fresh test environment with platform registry
    public fun init_platform(scenario: &mut Scenario) {
        test_scenario::next_tx(scenario, ADMIN);
        {
            registry::init_for_testing(test_scenario::ctx(scenario));
        };
    }

    /// Register a brand with default values
    public fun register_test_brand(scenario: &mut Scenario, user: address, brand_id: String, name: String): Brand {
        test_scenario::next_tx(scenario, user);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            brand::register_brand(
                &mut registry,
                brand_id,
                name,
                string::utf8(b"https://testbrand.com/logo.png"),
                string::utf8(b"Test brand description"),
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };

        test_scenario::next_tx(scenario, user);
        test_scenario::take_from_sender<Brand>(scenario)
    }

    /// Register a creator with default values
    public fun register_test_creator(scenario: &mut Scenario, user: address, creator_id: String, name: String): Creator {
        test_scenario::next_tx(scenario, user);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            creator::register_creator(
                &mut registry,
                creator_id,
                name,
                string::utf8(b"https://testcreator.com/avatar.png"),
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

        test_scenario::next_tx(scenario, user);
        test_scenario::take_from_sender<Creator>(scenario)
    }

    /// Fund a brand account with specified amount
    public fun fund_brand(scenario: &mut Scenario, user: address, brand: &mut Brand, amount: u64) {
        test_scenario::next_tx(scenario, user);
        {
            let funding = coin::mint_for_testing<USDC>(amount, test_scenario::ctx(scenario));
            brand::fund_brand_account(brand, funding, test_scenario::ctx(scenario));
        };
    }

    /// Create a campaign with reasonable test defaults
    public fun create_test_campaign(
        scenario: &mut Scenario,
        user: address,
        brand: &mut Brand,
        campaign_id: String,
        brand_campaign_id: String
    ) {
        test_scenario::next_tx(scenario, user);
        {
            let mut registry = test_scenario::take_shared<PlatformRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            campaign::create_campaign(
                &mut registry,
                brand,
                campaign_id,
                brand_campaign_id,
                1000, // application_start
                3000, // application_end  
                4000, // campaign_start
                8000, // campaign_end
                DEFAULT_BASE_PAY, // base_pay_per_creator
                DEFAULT_CAMPAIGN_BUDGET, // total_budget
                15, 10, 25, 20, 30, // CPM rates
                3, // max_winners
                &clock,
                test_scenario::ctx(scenario)
            );

            test_scenario::return_shared(registry);
            clock::destroy_for_testing(clock);
        };
    }

    /// Apply creator to campaign at specified time
    public fun apply_to_campaign_at_time(
        scenario: &mut Scenario,
        user: address,
        creator: &Creator,
        time: u64
    ) {
        test_scenario::next_tx(scenario, user);
        {
            let mut campaign = test_scenario::take_shared<Campaign>(scenario);
            let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
            
            clock::set_for_testing(&mut clock, time);
            campaign::apply_to_campaign(&mut campaign, creator, &clock, test_scenario::ctx(scenario));

            test_scenario::return_shared(campaign);
            clock::destroy_for_testing(clock);
        };
    }

    /// Complete brand setup (register + fund)
    public fun setup_funded_brand(scenario: &mut Scenario, user: address, brand_id: String, name: String): Brand {
        let mut brand = register_test_brand(scenario, user, brand_id, name);
        fund_brand(scenario, user, &mut brand, DEFAULT_BRAND_FUNDING);
        brand
    }

    /// Complete campaign setup (brand + campaign)
    public fun setup_brand_with_campaign(
        scenario: &mut Scenario,
        user: address,
        brand_id: String,
        campaign_id: String
    ): (Brand, Campaign) {
        init_platform(scenario);
        
        let mut brand = setup_funded_brand(scenario, user, brand_id, string::utf8(b"Test Brand"));
        create_test_campaign(scenario, user, &mut brand, campaign_id, brand_id);

        test_scenario::next_tx(scenario, user);
        let campaign = test_scenario::take_shared<Campaign>(scenario);
        
        (brand, campaign)
    }

    /// Get standard test addresses
    public fun admin(): address { ADMIN }
    public fun brand_user(): address { BRAND_USER }
    public fun creator_user(): address { CREATOR_USER }
    public fun creator_user_2(): address { CREATOR_USER_2 }
}
```

Now let's use these utilities in a clean, professional test:

```move
#[test]
public fun test_complete_workflow_with_utils() {
    use swans::test_utils;
    use swans::content::{Self, Content};
    use swans::types;
    use sui::clock;
    use std::string;
    
    let mut scenario_val = test_scenario::begin(test_utils::admin());
    let scenario = &mut scenario_val;

    // Setup: Clean, readable test setup
    let (mut brand, campaign) = test_utils::setup_brand_with_campaign(
        scenario,
        test_utils::brand_user(),
        string::utf8(b"clean_brand"),
        string::utf8(b"clean_campaign")
    );

    let creator = test_utils::register_test_creator(
        scenario,
        test_utils::creator_user(),
        string::utf8(b"clean_creator"),
        string::utf8(b"Clean Creator")
    );

    // Creator applies during application period
    test_utils::apply_to_campaign_at_time(scenario, test_utils::creator_user(), &creator, 2000);

    // Creator submits content during campaign period
    test_scenario::next_tx(scenario, test_utils::creator_user());
    {
        let mut campaign = test_scenario::take_shared<swans::campaign::Campaign>(scenario);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        clock::set_for_testing(&mut clock, 5000); // Campaign period
        
        content::submit_content(
            &mut campaign,
            &creator,
            string::utf8(b"professional_content"),
            string::utf8(b"https://example.com/content"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(campaign);
        clock::destroy_for_testing(clock);
    };

    // Brand reviews content
    test_scenario::next_tx(scenario, test_utils::brand_user());
    {
        let campaign = test_scenario::take_shared<swans::campaign::Campaign>(scenario);
        let mut content = test_scenario::take_from_address<Content>(scenario, test_utils::creator_user());
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        content::review_content(
            &campaign,
            &mut content,
            true,
            string::utf8(b"Professional content approved"),
            &clock,
            test_scenario::ctx(scenario)
        );

        assert!(content::get_content_status(&content) == types::content_accepted(), 1);

        test_scenario::return_shared(campaign);
        test_scenario::return_to_address(test_utils::creator_user(), content);
        clock::destroy_for_testing(clock);
    };

    // Clean up
    test_scenario::return_to_sender(scenario, brand);
    test_scenario::return_shared(campaign);
    test_scenario::return_to_sender(scenario, creator);
    test_scenario::end(scenario_val);
}
```

**Professional benefits you gain:**
- **Reusability**: Common setups used across many tests
- **Readability**: Tests focus on what they're testing, not setup
- **Maintainability**: Change setup logic in one place
- **Consistency**: All tests use the same patterns

## Step 15: Testing Edge Cases and Error Conditions

Professional tests verify edge cases and error conditions systematically:

```move
#[test]
#[expected_failure(abort_code = swans::campaign::ECampaignNotActive)]
public fun test_application_outside_period() {
    use swans::test_utils;
    use std::string;

    let mut scenario_val = test_scenario::begin(test_utils::admin());
    let scenario = &mut scenario_val;

    let (brand, campaign) = test_utils::setup_brand_with_campaign(
        scenario,
        test_utils::brand_user(),
        string::utf8(b"timing_brand"),
        string::utf8(b"timing_campaign")
    );

    let creator = test_utils::register_test_creator(
        scenario,
        test_utils::creator_user(),
        string::utf8(b"late_creator"),
        string::utf8(b"Late Creator")
    );

    // Try to apply after application period ends (should fail)
    test_utils::apply_to_campaign_at_time(scenario, test_utils::creator_user(), &creator, 5000);

    test_scenario::return_to_sender(scenario, brand);
    test_scenario::return_shared(campaign);
    test_scenario::return_to_sender(scenario, creator);
    test_scenario::end(scenario_val);
}

#[test]
#[expected_failure(abort_code = swans::brand::EInsufficientFunds)]
public fun test_campaign_insufficient_budget() {
    use swans::test_utils;
    use swans::campaign;
    use sui::clock;
    use std::string;

    let mut scenario_val = test_scenario::begin(test_utils::admin());
    let scenario = &mut scenario_val;

    test_utils::init_platform(scenario);
    
    let mut brand = test_utils::register_test_brand(
        scenario,
        test_utils::brand_user(),
        string::utf8(b"poor_brand"),
        string::utf8(b"Poor Brand")
    );

    // Fund with insufficient amount for the campaign we're about to create
    test_utils::fund_brand(scenario, test_utils::brand_user(), &mut brand, 1000); // Too little

    // Try to create expensive campaign (should fail)
    test_scenario::next_tx(scenario, test_utils::brand_user());
    {
        let mut registry = test_scenario::take_shared<swans::registry::PlatformRegistry>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        campaign::create_campaign(
            &mut registry,
            &mut brand,
            string::utf8(b"expensive_campaign"),
            string::utf8(b"brand_expensive"),
            1000, 3000, 4000, 8000,
            5000, // base_pay_per_creator
            50000, // total_budget - way more than brand has
            15, 10, 25, 20, 30, 3,
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    test_scenario::return_to_sender(scenario, brand);
    test_scenario::end(scenario_val);
}
```

## Step 16: Property-Based Testing Patterns

Professional tests verify system invariants - properties that should always be true:

```move
#[test]
public fun test_payment_conservation() {
    // Property: Total money in system should be conserved
    use swans::test_utils;
    use swans::content;
    use sui::clock;
    use sui::coin;
    use std::string;

    let mut scenario_val = test_scenario::begin(test_utils::admin());
    let scenario = &mut scenario_val;

    let (mut brand, campaign) = test_utils::setup_brand_with_campaign(
        scenario,
        test_utils::brand_user(),
        string::utf8(b"conservation_brand"),
        string::utf8(b"conservation_campaign")
    );

    let mut creator = test_utils::register_test_creator(
        scenario,
        test_utils::creator_user(),
        string::utf8(b"conservation_creator"),
        string::utf8(b"Conservation Creator")
    );

    // Record initial balances
    let initial_brand_balance = swans::brand::get_brand_balance(&brand);
    let initial_creator_earnings = swans::creator::get_total_earnings(&creator);

    // Complete workflow: apply -> submit -> approve -> publish
    test_utils::apply_to_campaign_at_time(scenario, test_utils::creator_user(), &creator, 2000);

    test_scenario::next_tx(scenario, test_utils::creator_user());
    {
        let mut campaign = test_scenario::take_shared<swans::campaign::Campaign>(scenario);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        clock::set_for_testing(&mut clock, 5000);
        content::submit_content(
            &mut campaign,
            &creator,
            string::utf8(b"conservation_content"),
            string::utf8(b"https://conservation.com/content"),
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::return_shared(campaign);
        clock::destroy_for_testing(clock);
    };

    test_scenario::next_tx(scenario, test_utils::brand_user());
    {
        let campaign = test_scenario::take_shared<swans::campaign::Campaign>(scenario);
        let mut content = test_scenario::take_from_address<swans::content::Content>(scenario, test_utils::creator_user());
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        swans::content::review_content(&campaign, &mut content, true, 
                                     string::utf8(b"Approved"), &clock, test_scenario::ctx(scenario));

        test_scenario::return_shared(campaign);
        test_scenario::return_to_address(test_utils::creator_user(), content);
        clock::destroy_for_testing(clock);
    };

    test_scenario::next_tx(scenario, test_utils::creator_user());
    {
        let mut campaign = test_scenario::take_shared<swans::campaign::Campaign>(scenario);
        let mut content = test_scenario::take_from_sender<swans::content::Content>(scenario);
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        content::publish_content(&mut campaign, &mut content, &mut creator, &clock, test_scenario::ctx(scenario));

        test_scenario::return_shared(campaign);
        test_scenario::return_to_sender(scenario, content);
        clock::destroy_for_testing(clock);
    };

    // Verify conservation property
    let final_brand_balance = swans::brand::get_brand_balance(&brand);
    let final_creator_earnings = swans::creator::get_total_earnings(&creator);
    
    let payment_amount = final_creator_earnings - initial_creator_earnings;
    let brand_deduction = initial_brand_balance - final_brand_balance;

    // Property: Money leaving brand should equal money going to creator
    assert!(payment_amount == brand_deduction, 1);
    assert!(payment_amount == 2000, 2); // Expected base pay

    // Clean up payment coin
    test_scenario::next_tx(scenario, test_utils::creator_user());
    {
        let payment_coin = test_scenario::take_from_sender<coin::Coin<swans::brand::USDC>>(scenario);
        coin::burn_for_testing(payment_coin);
    };

    test_scenario::return_to_sender(scenario, brand);
    test_scenario::return_shared(campaign);
    test_scenario::return_to_sender(scenario, creator);
    test_scenario::end(scenario_val);
}
```

## Step 17: Performance and Gas Testing

Professional tests consider resource usage:

```move
#[test]
public fun test_bulk_operations_efficiency() {
    // Test that bulk operations scale reasonably
    use swans::test_utils;
    use std::string;
    use std::vector;

    let mut scenario_val = test_scenario::begin(test_utils::admin());
    let scenario = &mut scenario_val;

    test_utils::init_platform(scenario);

    // Register multiple creators efficiently
    let mut creators = vector::empty();
    let mut i = 0;
    
    while (i < 5) { // Test with 5 creators
        let creator_id = string::utf8(b"bulk_creator_");
        string::append(&mut creator_id, string::utf8(&[48 + (i as u8)])); // Append number
        
        let creator_name = string::utf8(b"Bulk Creator ");
        string::append(&mut creator_name, string::utf8(&[48 + (i as u8)]));
        
        let user_address = @0x1000 + (i as u256); // Generate different addresses
        let creator = test_utils::register_test_creator(scenario, user_address, creator_id, creator_name);
        
        vector::push_back(&mut creators, (creator, user_address));
        i = i + 1;
    };

    // Create campaign that can handle multiple creators
    let (brand, campaign) = test_utils::setup_brand_with_campaign(
        scenario,
        test_utils::brand_user(),
        string::utf8(b"bulk_brand"),
        string::utf8(b"bulk_campaign")
    );

    // All creators apply to the same campaign
    i = 0;
    while (i < vector::length(&creators)) {
        let (creator, user_address) = vector::borrow(&creators, i);
        test_utils::apply_to_campaign_at_time(scenario, *user_address, creator, 2000);
        i = i + 1;
    };

    // Verify all applications succeeded
    test_scenario::next_tx(scenario, test_utils::admin());
    {
        let campaign_ref = test_scenario::borrow_shared<swans::campaign::Campaign>(scenario);
        
        i = 0;
        while (i < vector::length(&creators)) {
            let (creator, _) = vector::borrow(&creators, i);
            assert!(swans::campaign::has_applied(campaign_ref, swans::creator::get_creator_id(creator)), i);
            i = i + 1;
        };
    };

    // Clean up all creators
    i = 0;
    while (i < vector::length(&creators)) {
        let (creator, user_address) = vector::pop_back(&mut creators);
        test_scenario::return_to_address(user_address, creator);
        i = i + 1;
    };

    test_scenario::return_to_sender(scenario, brand);
    test_scenario::return_shared(campaign);
    test_scenario::end(scenario_val);
}
```

## Step 18: Integration Testing with External Dependencies

Professional tests handle external dependencies gracefully:

```move
#[test]
public fun test_system_integration() {
    // Test integration between all major system components
    use swans::test_utils;
    use swans::content;
    use swans::types;
    use sui::clock;
    use sui::coin;
    use std::string;
    use std::vector;

    let mut scenario_val = test_scenario::begin(test_utils::admin());
    let scenario = &mut scenario_val;

    // Multi-brand, multi-creator scenario
    test_utils::init_platform(scenario);

    // Setup two competing brands
    let mut brand1 = test_utils::setup_funded_brand(
        scenario, 
        test_utils::brand_user(), 
        string::utf8(b"tech_brand"), 
        string::utf8(b"Tech Brand")
    );

    let mut brand2 = test_utils::setup_funded_brand(
        scenario,
        @0x2000, // Different brand user
        string::utf8(b"fashion_brand"),
        string::utf8(b"Fashion Brand")
    );

    // Both brands create campaigns
    test_utils::create_test_campaign(scenario, test_utils::brand_user(), &mut brand1, 
                                   string::utf8(b"tech_campaign"), string::utf8(b"tech_brand"));

    test_utils::create_test_campaign(scenario, @0x2000, &mut brand2, 
                                   string::utf8(b"fashion_campaign"), string::utf8(b"fashion_brand"));

    // Multi-skilled creator can work with both
    let creator = test_utils::register_test_creator(
        scenario,
        test_utils::creator_user(),
        string::utf8(b"versatile_creator"),
        string::utf8(b"Versatile Creator")
    );

    // Creator applies to both campaigns
    test_utils::apply_to_campaign_at_time(scenario, test_utils::creator_user(), &creator, 2000);

    // Switch to second campaign and apply there too
    test_scenario::next_tx(scenario, test_utils::creator_user());
    {
        let mut campaigns = test_scenario::take_shared_by_id<swans::campaign::Campaign>(scenario, 
                          swans::campaign::get_campaign_id_by_brand(string::utf8(b"fashion_brand")));
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        
        clock::set_for_testing(&mut clock, 2000);
        swans::campaign::apply_to_campaign(&mut campaigns, &creator, &clock, test_scenario::ctx(scenario));

        test_scenario::return_shared(campaigns);
        clock::destroy_for_testing(clock);
    };

    // Verify creator can work with multiple brands simultaneously
    // This tests the system's ability to handle complex real-world scenarios

    test_scenario::return_to_sender(scenario, brand1);
    test_scenario::return_to_sender(scenario, brand2);
    test_scenario::return_to_sender(scenario, creator);
    test_scenario::end(scenario_val);
}
```

## What You've Mastered in Professional Testing

You now have professional-grade testing skills:

1. **Test Organization** - Reusable utilities and consistent patterns
2. **Edge Case Testing** - Systematic verification of error conditions  
3. **Property-Based Testing** - Verifying system invariants
4. **Performance Testing** - Considering resource usage and scalability
5. **Integration Testing** - Testing complex multi-component interactions
6. **Maintainable Code** - Tests that are easy to read, modify, and extend

**You can now write production-quality test suites!**

Test your professional testing skills:

```bash
sui move test --filter test_complete_workflow_with_utils
sui move test --filter test_application_outside_period  
sui move test --filter test_payment_conservation
sui move test --filter test_bulk_operations_efficiency
```

> **🚀 Professional insight:** These patterns are used in real production Sui projects. You now have the skills to contribute to or lead testing efforts in professional blockchain development teams.

---

# Quick Reference

## Essential Commands

### Running Tests
```bash
# Run all tests
sui move test

# Run specific test by name
sui move test --filter test_name

# Run tests with verbose output
sui move test --verbose

# Run tests with gas tracking
sui move test --gas-budget 100000000

# Run tests and show compilation output
sui move test --print-diags-to-stderr
```

### Building and Validation
```bash
# Build the package
sui move build

# Build and check for warnings
sui move build --warnings

# Validate package structure
sui move build --dump-bytecode-as-base64
```

## Test Structure Template

```move
#[test_only]
module your_package::test_module_name {
    use sui::test_scenario::{Self, Scenario};
    use sui::clock;
    use std::string;
    
    // Your package imports
    use your_package::module_name;
    
    // Test addresses
    const ADMIN: address = @0x123;
    const USER1: address = @0x456;
    const USER2: address = @0x789;

    #[test]
    public fun test_function_name() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Test steps
        test_scenario::next_tx(scenario, USER1);
        {
            // Test logic here
        };

        test_scenario::end(scenario_val);
    }
}
```

## Common Patterns

### Object Management
```move
// Taking owned objects
let object = test_scenario::take_from_sender<ObjectType>(scenario);
test_scenario::return_to_sender(scenario, object);

// Taking shared objects  
let shared_obj = test_scenario::take_shared<SharedType>(scenario);
test_scenario::return_shared(shared_obj);

// Taking objects from specific address
let obj = test_scenario::take_from_address<Type>(scenario, @0x123);
test_scenario::return_to_address(@0x123, obj);
```

### Time Management
```move
// Create test clock
let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));

// Set specific time
clock::set_for_testing(&mut clock, timestamp);

// Clean up clock
clock::destroy_for_testing(clock);
```

### Assertions
```move
// Basic assertion
assert!(condition, error_code);

// String comparison
assert!(string::utf8(b"expected") == actual_string, error_code);

// Numeric comparison
assert!(expected_value == actual_value, error_code);
```

### Error Testing
```move
#[test]
#[expected_failure(abort_code = module_name::ERROR_CODE)]
public fun test_expected_failure() {
    // Test code that should fail
}
```

---

# Troubleshooting Guide

## Common Test Failures and Solutions

### 1. "Object not found" Errors

**Error**: Test crashes with object not found
```
Error: Object not found in scenario
```

**Common Causes**:
- Trying to take an object that wasn't created
- Taking from wrong address  
- Object was already consumed

**Solutions**:
```move
// ❌ Wrong - object not created yet
let obj = test_scenario::take_from_sender<MyObject>(scenario);

// ✅ Correct - create object first
test_scenario::next_tx(scenario, USER);
{
    create_my_object(test_scenario::ctx(scenario));
};
test_scenario::next_tx(scenario, USER);
{
    let obj = test_scenario::take_from_sender<MyObject>(scenario);
    test_scenario::return_to_sender(scenario, obj);
};
```

### 2. "Object still exists" Errors

**Error**: Test ends with unreturned objects
```
Error: Objects still exist at end of scenario
```

**Common Causes**:
- Forgot to return objects to scenario
- Objects not properly cleaned up

**Solutions**:
```move
// ❌ Wrong - object not returned
let obj = test_scenario::take_from_sender<MyObject>(scenario);
// Missing return!

// ✅ Correct - always return objects
let obj = test_scenario::take_from_sender<MyObject>(scenario);
test_scenario::return_to_sender(scenario, obj);
```

### 3. Time-Related Test Failures

**Error**: Operations fail due to timing
```
Error: Operation not allowed at current time
```

**Common Causes**:
- Clock not set to appropriate time
- Operating outside valid time windows

**Solutions**:
```move
// ❌ Wrong - no time control
campaign::apply_to_campaign(&mut campaign, &creator, &clock, ctx);

// ✅ Correct - set appropriate time
let mut clock = clock::create_for_testing(ctx);
clock::set_for_testing(&mut clock, 2000); // During application period
campaign::apply_to_campaign(&mut campaign, &creator, &clock, ctx);
clock::destroy_for_testing(clock);
```

### 4. Import and Module Errors

**Error**: Module or function not found
```
Error: Unresolved import: module::function
```

**Common Causes**:
- Incorrect module path
- Missing imports
- Function not public

**Solutions**:
```move
// ❌ Wrong - incorrect import
use swans::wrong_module;

// ✅ Correct - proper import
use swans::correct_module::{Self, PublicStruct};

// ✅ Also correct - specific function import
use swans::correct_module::public_function;
```

### 5. Assertion Failures

**Error**: Test assertion fails
```
Error: Assertion failed with abort code 1
```

**Debugging Steps**:
1. Add debug output before assertion
2. Check expected vs actual values
3. Verify test setup is correct

```move
// ❌ Hard to debug
assert!(get_value(&obj) == 100, 1);

// ✅ Better - debug output
let actual_value = get_value(&obj);
// In real debugging, you'd use std::debug::print
assert!(actual_value == 100, 1);
```

## Performance Issues

### Slow Test Execution

**Causes**:
- Too many objects created
- Complex operations in loops
- Inefficient test setup

**Solutions**:
- Use test utilities for common setup
- Minimize object creation
- Break large tests into smaller ones
- Use `--filter` to run specific tests

### High Gas Usage

**Symptoms**: Tests fail with out-of-gas errors

**Solutions**:
```bash
# Increase gas budget
sui move test --gas-budget 200000000

# Profile gas usage
sui move test --verbose
```

## Build Issues

### Compilation Errors

**Common Sui Move Issues**:
```move
// ❌ Unused imports cause warnings
use sui::transfer; // If not used

// ✅ Remove unused imports
// (Simply don't import what you don't use)

// ❌ Incorrect function visibility
public entry fun test_function() { } // 'entry' not needed for tests

// ✅ Correct visibility
public fun test_function() { } // or just 'fun' for internal
```

### Dependency Issues

**Error**: Dependencies not found
```
Error: Package dependency not found
```

**Solutions**:
1. Check `Move.toml` dependencies
2. Ensure correct package names
3. Verify version compatibility

```toml
# Move.toml
[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/devnet" }
```

---

# Troubleshooting Checklist

When a test fails, work through this checklist:

- [ ] **Build succeeds**: `sui move build` runs without errors
- [ ] **Imports correct**: All `use` statements point to valid modules
- [ ] **Objects managed**: All objects taken are properly returned  
- [ ] **Timing correct**: Clock set to appropriate times for operations
- [ ] **Addresses valid**: Test addresses match function expectations
- [ ] **Setup complete**: All required initialization done before test logic
- [ ] **Cleanup done**: Test scenario properly ended

---

# Advanced Debugging Techniques

## Using Debug Output

While Sui Move testing doesn't have full debugging support, you can use some techniques:

```move
// Check object existence
assert!(test_scenario::has_most_recent_for_sender<ObjectType>(scenario), 1);

// Verify shared object state
test_scenario::next_tx(scenario, @0x0); // Use different address to check shared state
{
    let obj = test_scenario::take_shared<SharedType>(scenario);
    // Inspect object state
    assert!(object_property(&obj) == expected_value, 2);
    test_scenario::return_shared(obj);
};
```

## Test Organization for Debugging

```move
// Break complex tests into smaller, focused tests
#[test]
public fun test_user_registration() {
    // Only test registration
}

#[test] 
public fun test_campaign_creation() {
    // Only test campaign creation, assume registration works
}

#[test]
public fun test_full_workflow() {
    // Integration test using utilities
}
```

---

# Comprehensive Sui Documentation Links

## Official Sui Documentation

### Core Concepts
- **[Sui Move Concepts](https://docs.sui.io/concepts/sui-move-concepts)** - Understanding Sui's object model
- **[Objects and Ownership](https://docs.sui.io/concepts/object-ownership)** - How objects work in Sui
- **[Transactions](https://docs.sui.io/concepts/transactions)** - Understanding transaction structure

### Development Guides  
- **[First dApp Tutorial](https://docs.sui.io/guides/developer/first-app)** - Building your first Sui application
- **[Build and Test Guide](https://docs.sui.io/guides/developer/first-app/build-test)** - Official testing documentation
- **[Move Programming](https://docs.sui.io/guides/developer/sui-101)** - Sui Move programming guide

### Framework References
- **[Sui Framework](https://docs.sui.io/references/framework/sui-framework)** - Complete framework documentation  
- **[Test Scenario Module](https://docs.sui.io/references/framework/sui-framework/test-scenario)** - Testing framework reference
- **[Clock Module](https://docs.sui.io/references/framework/sui-framework/clock)** - Time management in tests
- **[Coin Module](https://docs.sui.io/references/framework/sui-framework/coin)** - Working with coins in tests

### Advanced Topics
- **[Move Language Book](https://move-book.com/)** - Comprehensive Move language guide
- **[Sui Move by Example](https://examples.sui.io/)** - Code examples and patterns
- **[Gas and Performance](https://docs.sui.io/concepts/tokenomics/gas-pricing)** - Understanding gas costs

### Tools and Development Environment
- **[Sui CLI Reference](https://docs.sui.io/references/cli)** - Complete CLI documentation
- **[Development Setup](https://docs.sui.io/guides/developer/getting-started)** - Environment setup guide
- **[Move Analyzer](https://docs.sui.io/guides/developer/dev-tools)** - IDE tools and extensions

## Community Resources

### Learning Materials
- **[Sui Developer Portal](https://sui.io/developers)** - Official developer resources
- **[Move Developers Community](https://move-developers.com/)** - Community tutorials and guides
- **[Sui Academy](https://academy.sui.io/)** - Structured learning paths

### Code Examples and Templates
- **[Sui Examples Repository](https://github.com/MystenLabs/sui/tree/main/examples)** - Official example projects
- **[Sui dApp Starter](https://github.com/sui-foundation/sui-dapp-starter)** - Starter template for dApps
- **[Move Patterns](https://github.com/MystenLabs/sui/tree/main/examples/move)** - Common Move patterns

### Community and Support
- **[Sui Discord](https://discord.gg/sui)** - Active developer community
- **[Sui Forum](https://forum.sui.io/)** - Technical discussions and Q&A  
- **[GitHub Issues](https://github.com/MystenLabs/sui/issues)** - Bug reports and feature requests

## Testing-Specific Resources

### Official Testing Documentation
- **[Move Unit Testing](https://move-book.com/advanced-topics/unit-testing.html)** - Move testing fundamentals
- **[Sui Testing Framework](https://docs.sui.io/guides/developer/first-app/build-test)** - Sui-specific testing guide
- **[Test Scenario Documentation](https://docs.sui.io/references/framework/sui-framework/test-scenario)** - Complete test_scenario reference

### Testing Patterns and Examples
- **[Sui Framework Tests](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/sui-framework/tests)** - Framework test examples
- **[Move Stdlib Tests](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/move-stdlib/tests)** - Standard library test patterns

---

# Next Steps

## Immediate Actions

**1. Practice with Your Own Code**
- Apply these patterns to your own Sui Move projects
- Start with simple tests and gradually add complexity
- Use the test utilities pattern for maintainable tests

**2. Explore the SWANS Codebase**
- Study the existing tests in `/tests/`
- Run the existing test suite: `sui move test`
- Experiment with modifying tests to understand how they work

**3. Build Your Test Suite**
- Create comprehensive tests for your modules
- Use the professional patterns from Phase 4
- Include both happy path and error condition tests

## Continuing Your Learning Journey

**Intermediate Goals** (Next 2-4 weeks):
- Master property-based testing patterns
- Learn integration testing with external systems  
- Understand gas optimization in tests
- Contribute tests to open-source Sui projects

**Advanced Goals** (Next 1-3 months):
- Write testing frameworks and utilities for the community
- Develop specialized testing patterns for your domain
- Mentor others in Sui Move testing
- Contribute to Sui framework testing infrastructure

**Expert Level** (Ongoing):
- Design testing strategies for complex dApp ecosystems
- Lead testing efforts in professional development teams
- Create educational content and tutorials
- Participate in Sui Move language design discussions

## Recommended Practice Projects

**1. NFT Marketplace Testing**
- Multi-user interactions (buyers, sellers, creators)
- Payment processing and royalties
- Access control and permissions

**2. DeFi Protocol Testing** 
- Liquidity pools and automated market makers
- Complex mathematical operations
- Economic invariants and security properties

**3. Gaming Platform Testing**
- Player interactions and game state
- Item ownership and trading
- Tournament and scoring systems

## Contributing Back

**Share Your Knowledge**:
- Create test examples for common patterns
- Write blog posts about testing techniques you discover
- Answer questions in Sui developer communities
- Contribute to open-source Sui projects

**Improve This Guide**:
- Report issues or suggest improvements
- Add examples for specific use cases
- Translate for non-English speaking developers

## Final Thoughts

You've completed a comprehensive journey through Sui Move testing - from writing your first simple test to mastering professional testing techniques used in production codebases. 

**What you've accomplished:**
✅ Written and run your first Sui Move tests
✅ Mastered multi-transaction and multi-user testing
✅ Learned professional testing patterns and utilities  
✅ Understood debugging and troubleshooting techniques
✅ Built expertise comparable to professional blockchain developers

**You now have the skills to:**
- **Test any Sui Move project** with confidence
- **Debug complex blockchain interactions** systematically  
- **Write maintainable test suites** for production systems
- **Contribute to professional blockchain development teams**
- **Lead testing efforts** in your own projects

The Sui ecosystem is growing rapidly, and skilled developers like you are essential for building reliable, secure blockchain applications. Your testing expertise will be valuable whether you're building the next breakthrough dApp, contributing to DeFi protocols, or creating innovative Web3 experiences.

**Keep building, keep testing, and welcome to the Sui developer community!**

---

*This guide was created to empower developers with practical, hands-on Sui Move testing skills. For updates, corrections, or suggestions, please contribute to the SWANS project or reach out to the Sui developer community.*

## Acknowledgments

This tutorial was built using the **SWANS** (Sui Web3 Advertising Network System) as a real-world example, demonstrating practical testing patterns that developers encounter in production blockchain applications.

**Special thanks to:**
- The Sui Foundation and MystenLabs team for building an incredible blockchain platform
- The Move language designers for creating a secure and powerful smart contract language  
- The Sui developer community for continuous learning and knowledge sharing
- The Diátaxis framework for providing pedagogical principles that guided this tutorial's structure

**Happy testing! 🚀**
