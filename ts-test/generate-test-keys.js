import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Generate test keypairs
const adminKeypair = new Ed25519Keypair();
const brandKeypair = new Ed25519Keypair();
const creatorKeypair = new Ed25519Keypair();

console.log('# Test Account Configuration');
console.log('# Add these to your .env file\n');

console.log('# Test Account Keys (use these private keys in the .env file)');
console.log(`ADMIN_PRIVATE_KEY=${adminKeypair.getSecretKey()}`);
console.log(`ADMIN_ADDRESS=${adminKeypair.toSuiAddress()}`);
console.log('');

console.log(`BRAND_PRIVATE_KEY=${brandKeypair.getSecretKey()}`);
console.log(`BRAND_ADDRESS=${brandKeypair.toSuiAddress()}`);
console.log('');

console.log(`CREATOR_PRIVATE_KEY=${creatorKeypair.getSecretKey()}`);
console.log(`CREATOR_ADDRESS=${creatorKeypair.toSuiAddress()}`);
console.log('');

console.log('\n🎯 Fund these addresses with devnet SUI:');
console.log(adminKeypair.toSuiAddress());
console.log(brandKeypair.toSuiAddress());
console.log(creatorKeypair.toSuiAddress());