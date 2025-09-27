# Testnet Usage Guide

## Getting Started with Sui Devnet

The SWANS frontend is configured to work with the Sui devnet for testing purposes. To use the application, you'll need testnet SUI tokens for gas fees.

## Getting Testnet SUI Tokens

### Option 1: Sui Devnet Faucet (Recommended)
1. Visit [https://faucet.devnet.sui.io/](https://faucet.devnet.sui.io/)
2. Connect your wallet or enter your wallet address
3. Click "Request Sui" to receive free testnet tokens
4. Wait for the transaction to complete (usually 10-30 seconds)
5. You can request multiple times if needed

### Option 2: Discord Faucet
1. Join the [Sui Discord](https://discord.gg/sui)
2. Go to the `#devnet-faucet` channel
3. Use the command: `!faucet <your-wallet-address>`

## Common Issues and Solutions

### "No valid gas coins found for the transaction"
This error occurs when your wallet doesn't have enough SUI tokens to pay for gas fees.

**Solution:**
1. Check your SUI balance in the app (displayed in the header)
2. If balance is low (< 0.1 SUI), request more tokens from the faucet
3. Wait for the faucet transaction to complete
4. Refresh the page to see your updated balance
5. Try your transaction again

### "Insufficient gas"
This means you have some SUI but not enough for the specific transaction.

**Solution:**
1. Request more SUI from the faucet
2. Some transactions (like creating campaigns) require more gas than others

### Transaction Taking Too Long
Devnet can sometimes be slow or congested.

**Solution:**
1. Wait a few minutes for the transaction to complete
2. Check the transaction status in your wallet
3. If it fails, try again with a higher gas budget

## Estimated Gas Costs

| Operation | Estimated Cost | Notes |
|-----------|---------------|-------|
| Register Brand | ~0.01 SUI | One-time setup |
| Register Creator | ~0.008 SUI | One-time setup |
| Create Campaign | ~0.05 SUI | Creates shared objects |
| Apply to Campaign | ~0.005 SUI | Simple application |
| Submit Content | ~0.01 SUI | Content submission |

## Tips for Testing

1. **Always check your balance** before attempting transactions
2. **Request multiple times** from the faucet if needed (it's free!)
3. **Start small** - test with brand/creator registration first
4. **Be patient** - devnet can be slower than mainnet
5. **Use browser dev tools** to see detailed error messages if needed

## Wallet Setup

### Supported Wallets
- Sui Wallet (Browser Extension)
- Ethos Wallet
- Martian Wallet
- Any wallet supporting the Wallet Standard

### Network Configuration
The app automatically connects to:
- **Network**: Sui Devnet
- **RPC URL**: https://fullnode.devnet.sui.io:443
- **Chain ID**: sui:devnet

## Development Notes

- All testnet tokens have **no real value**
- Devnet state can be reset periodically
- Smart contracts are deployed on devnet for testing
- Transaction IDs and addresses are different from mainnet

## Need Help?

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your wallet is connected to the correct network
3. Ensure you have sufficient SUI balance
4. Try refreshing the page
5. Clear browser cache if problems persist

Remember: This is a testing environment - all tokens and transactions are for development purposes only!