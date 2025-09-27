import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { SUI_NETWORK } from './constants'

export const suiClient = new SuiClient({
  url: getFullnodeUrl(SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet')
})

export default suiClient