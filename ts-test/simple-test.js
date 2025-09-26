// Simple test to verify deployed SWANS contract functionality
import { SuiClient } from '@mysten/sui/client';

const client = new SuiClient({ url: 'https://fullnode.devnet.sui.io:443' });

// Contract details from deployment
const PACKAGE_ID = '0x819df9910ee7ff195918fe87fcc18c889a78d0608b1e1d3087412963c7bdd6d3';
const REGISTRY_ID = '0x3f03db054bd2e1c6676ab9ea11d6bb0832448f2aa11cc2f263ff5071c0512864';

async function runTests() {
  console.log('🚀 Testing SWANS Smart Contract...\n');

  try {
    // Test 1: Verify network connection
    console.log('1. Testing network connection...');
    const version = await client.getRpcApiVersion();
    console.log(`✅ Connected to Sui network (API version: ${version})\n`);

    // Test 2: Verify package deployment
    console.log('2. Verifying package deployment...');
    const packageInfo = await client.getObject({
      id: PACKAGE_ID,
      options: { showType: true, showContent: true }
    });

    if (packageInfo.data) {
      console.log('✅ Package deployed successfully');
      console.log(`   Package ID: ${PACKAGE_ID}\n`);
    } else {
      throw new Error('Package not found');
    }

    // Test 3: Verify registry object
    console.log('3. Verifying registry object...');
    const registryInfo = await client.getObject({
      id: REGISTRY_ID,
      options: { showContent: true, showType: true }
    });

    if (registryInfo.data) {
      console.log('✅ Registry object found');
      console.log(`   Registry ID: ${REGISTRY_ID}`);
      console.log(`   Object Type: ${registryInfo.data.type}\n`);
    } else {
      throw new Error('Registry not found');
    }

    // Test 4: Query package modules
    console.log('4. Checking available modules...');
    const modules = await client.getNormalizedMoveModulesByPackage({
      package: PACKAGE_ID
    });

    const moduleNames = Object.keys(modules);
    console.log('✅ Available modules:');
    moduleNames.forEach(name => console.log(`   - ${name}`));
    console.log('');

    // Test 5: Query recent events from the package
    console.log('5. Querying recent events...');
    try {
      const events = await client.queryEvents({
        query: { Package: PACKAGE_ID },
        limit: 5
      });

      console.log(`✅ Found ${events.data.length} recent events from the package`);
      if (events.data.length > 0) {
        console.log('   Recent event types:');
        events.data.forEach((event, i) => {
          console.log(`   ${i + 1}. ${event.type}`);
        });
      }
    } catch (error) {
      console.log('⚠️  No events found or events query not supported');
    }

    console.log('\n🎉 All basic contract verification tests passed!');
    console.log('\n📋 Smart Contract Status:');
    console.log(`   ✅ Package deployed: ${PACKAGE_ID}`);
    console.log(`   ✅ Registry initialized: ${REGISTRY_ID}`);
    console.log(`   ✅ Network: Devnet`);
    console.log(`   ✅ Modules: ${moduleNames.length} modules available`);
    console.log('\n🔧 Contract is ready for frontend integration!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests().catch(console.error);