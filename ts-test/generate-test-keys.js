import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { toBase64 } from '@mysten/sui/utils';

// Generate test keypairs
const adminKeypair = new Ed25519Keypair();
const brandKeypair = new Ed25519Keypair();
const creatorKeypair = new Ed25519Keypair();

console.log('# Test Account Configuration');
console.log('# Add these to your .env file\n');

console.log(`ADMIN_PRIVATE_KEY=${toBase64(adminKeypair.getSecretKey())}`);
console.log(`ADMIN_ADDRESS=${adminKeypair.toSuiAddress()}`);
console.log();

console.log(`BRAND_PRIVATE_KEY=${toBase64(brandKeypair.getSecretKey())}`);
console.log(`BRAND_ADDRESS=${brandKeypair.toSuiAddress()}`);
console.log();

console.log(`CREATOR_PRIVATE_KEY=${toBase64(creatorKeypair.getSecretKey())}`);
console.log(`CREATOR_ADDRESS=${creatorKeypair.toSuiAddress()}`);
console.log();

console.log('# Fund these accounts with devnet SUI:');
console.log(`# sui client faucet --address ${adminKeypair.toSuiAddress()}`);
console.log(`# sui client faucet --address ${brandKeypair.toSuiAddress()}`);
console.log(`# sui client faucet --address ${creatorKeypair.toSuiAddress()}`);