import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import { NETWORK_CONFIG, GAS_SETTINGS, MODULES } from '../config/constants.js';

export class TestEnvironment {
  public client: SuiClient;
  public packageId: string;

  // Test keypairs
  public adminKeypair: Ed25519Keypair;
  public brandKeypair: Ed25519Keypair;
  public creatorKeypair: Ed25519Keypair;

  // Object IDs
  public registryId: string | null = null;
  public brandId: string | null = null;
  public creatorId: string | null = null;
  public campaignId: string | null = null;

  constructor() {
    // Initialize network connection
    const networkUrl = process.env.SUI_RPC_URL || NETWORK_CONFIG.localnet;
    this.client = new SuiClient({ url: networkUrl });

    // Get package ID from environment
    this.packageId = process.env.PACKAGE_ID || '0x0';

    // Initialize keypairs
    this.adminKeypair = this.createOrLoadKeypair('ADMIN_PRIVATE_KEY');
    this.brandKeypair = this.createOrLoadKeypair('BRAND_PRIVATE_KEY');
    this.creatorKeypair = this.createOrLoadKeypair('CREATOR_PRIVATE_KEY');
  }

  private createOrLoadKeypair(envKey: string): Ed25519Keypair {
    const privateKey = process.env[envKey];

    if (privateKey) {
      try {
        // The private keys from our generator are already base64 encoded secret keys
        const secretKey = fromBase64(privateKey);
        return Ed25519Keypair.fromSecretKey(secretKey);
      } catch (error) {
        console.warn(`Failed to load keypair from ${envKey}: ${error}, generating new one`);
      }
    }

    console.warn(`No private key found for ${envKey}, generating new one`);
    return new Ed25519Keypair();
  }

  async initialize(): Promise<void> {
    console.log('Initializing test environment...');

    // Check network connection
    await this.checkNetworkConnection();

    // Fund test accounts if needed
    await this.fundTestAccounts();

    // Deploy package if not available
    await this.ensurePackageDeployed();

    console.log('Test environment initialized successfully');
  }

  private async checkNetworkConnection(): Promise<void> {
    try {
      await this.client.getRpcApiVersion();
    } catch (error) {
      throw new Error(`Failed to connect to Sui network: ${error}`);
    }
  }

  private async fundTestAccounts(): Promise<void> {
    const accounts = [
      { name: 'admin', address: this.adminKeypair.toSuiAddress() },
      { name: 'brand', address: this.brandKeypair.toSuiAddress() },
      { name: 'creator', address: this.creatorKeypair.toSuiAddress() },
    ];

    for (const account of accounts) {
      const balance = await this.client.getBalance({ owner: account.address });
      const balanceValue = parseInt(balance.totalBalance);

      if (balanceValue < 1_000_000_000) { // Less than 1 SUI
        console.log(`Funding ${account.name} account: ${account.address}`);
        // In real scenario, you would request from faucet or transfer funds
        // For local testing, this might not be needed if accounts are pre-funded
      }
    }
  }

  private async ensurePackageDeployed(): Promise<void> {
    if (this.packageId === '0x0') {
      console.warn('Package ID not set. Please deploy the package first and set PACKAGE_ID in .env');
      return;
    }

    try {
      await this.client.getObject({
        id: this.packageId,
        options: { showType: true }
      });
    } catch (error) {
      throw new Error(`Package ${this.packageId} not found. Please deploy the package first.`);
    }
  }

  // Utility method to create a transaction
  createTransaction(): Transaction {
    return new Transaction();
  }

  // Execute transaction with proper error handling
  async executeTransaction(
    tx: Transaction,
    signer: Ed25519Keypair,
    options: {
      showEvents?: boolean;
      showEffects?: boolean;
      showObjectChanges?: boolean;
    } = {}
  ) {
    try {
      const result = await this.client.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEvents: options.showEvents ?? true,
          showEffects: options.showEffects ?? true,
          showObjectChanges: options.showObjectChanges ?? true,
        },
      });

      // Check if transaction was successful
      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
      }

      return result;
    } catch (error) {
      console.error('Transaction execution failed:', error);
      throw error;
    }
  }

  // Get module address for function calls
  getModuleAddress(moduleName: string): string {
    return `${this.packageId}::${moduleName}`;
  }

  // Helper to find created objects by type
  findCreatedObjectByType(result: any, type: string): string | null {
    const changes = result.objectChanges || [];
    const created = changes.find((change: any) =>
      change.type === 'created' &&
      change.objectType.includes(type)
    );
    return created?.objectId || null;
  }

  // Helper to extract events by type
  extractEventsByType(result: any, eventType: string): any[] {
    const events = result.events || [];
    return events.filter((event: any) => event.type.includes(eventType));
  }

  // Wait for transaction confirmation
  async waitForTransaction(digest: string): Promise<any> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        const result = await this.client.getTransactionBlock({
          digest,
          options: {
            showEvents: true,
            showEffects: true,
            showObjectChanges: true,
          },
        });

        if (result.effects?.status?.status === 'success') {
          return result;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    throw new Error(`Transaction ${digest} not confirmed after ${maxAttempts} attempts`);
  }

  async cleanup(): Promise<void> {
    // Cleanup logic if needed
    console.log('Test environment cleanup complete');
  }

  // Helper methods for common operations
  async getObjectDetails(objectId: string) {
    return await this.client.getObject({
      id: objectId,
      options: { showContent: true, showType: true },
    });
  }

  async getOwnedObjects(address: string, objectType?: string) {
    return await this.client.getOwnedObjects({
      owner: address,
      filter: objectType ? { StructType: objectType } : undefined,
      options: { showContent: true, showType: true },
    });
  }

  // Test data getters
  get addresses() {
    return {
      admin: this.adminKeypair.toSuiAddress(),
      brand: this.brandKeypair.toSuiAddress(),
      creator: this.creatorKeypair.toSuiAddress(),
    };
  }
}