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

    // Get package ID and registry ID from environment
    this.packageId = process.env.PACKAGE_ID || '0x0';
    this.registryId = process.env.REGISTRY_ID || null;

    // Initialize keypairs
    this.adminKeypair = this.createOrLoadKeypair('ADMIN_PRIVATE_KEY');
    this.brandKeypair = this.createOrLoadKeypair('BRAND_PRIVATE_KEY');
    this.creatorKeypair = this.createOrLoadKeypair('CREATOR_PRIVATE_KEY');
  }

  private createOrLoadKeypair(envKey: string): Ed25519Keypair {
    // For this test setup, we'll generate new keypairs
    // Note: In production, you'd load actual funded keypairs
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
    // Fund test accounts using Sui CLI faucet (more reliable than HTTP)
    const addresses = [
      this.adminKeypair.toSuiAddress(),
      this.brandKeypair.toSuiAddress(),
      this.creatorKeypair.toSuiAddress()
    ];

    for (const address of addresses) {
      try {
        // Check if account already has sufficient funds
        const balance = await this.client.getBalance({ owner: address });
        const currentBalance = parseInt(balance.totalBalance);

        if (currentBalance < 1000000000) { // Less than 1 SUI
          console.log(`Funding account ${address} via CLI...`);

          try {
            // Use Sui CLI faucet command which is more reliable
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            await execAsync(`sui client faucet --address ${address}`);
            console.log(`✅ Funded ${address}`);

            // Wait a bit for the funding to propagate
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (cliError) {
            console.warn(`CLI faucet failed for ${address}, trying HTTP fallback...`);

            // Fallback to HTTP faucet with better error handling
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

              const faucetResponse = await fetch('https://faucet.devnet.sui.io/gas', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  FixedAmountRequest: {
                    recipient: address
                  }
                }),
                signal: controller.signal
              });

              clearTimeout(timeoutId);

              if (faucetResponse.ok) {
                console.log(`✅ Funded ${address} via HTTP fallback`);
                await new Promise(resolve => setTimeout(resolve, 3000));
              } else {
                console.warn(`HTTP faucet failed for ${address}: ${faucetResponse.statusText}`);
              }
            } catch (httpError) {
              console.warn(`Both faucet methods failed for ${address}:`, httpError);
            }
          }
        } else {
          console.log(`✅ Account ${address} already funded`);
        }
      } catch (error) {
        console.warn(`Error checking/funding ${address}:`, error);
      }
    }
  }

  private async ensurePackageDeployed(): Promise<void> {
    if (this.packageId === '0x0') {
      throw new Error('Package ID not set. Please set PACKAGE_ID in .env');
    }

    try {
      await this.client.getObject({
        id: this.packageId,
        options: { showType: true }
      });
      console.log(`✅ Package ${this.packageId} found`);
    } catch (error) {
      throw new Error(`Package ${this.packageId} not found: ${error}`);
    }

    // Verify registry exists
    if (this.registryId) {
      try {
        await this.client.getObject({
          id: this.registryId,
          options: { showContent: true }
        });
        console.log(`✅ Registry ${this.registryId} found`);
      } catch (error) {
        console.warn(`Registry ${this.registryId} not found: ${error}`);
      }
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