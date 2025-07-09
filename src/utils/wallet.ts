export const DOGEOS_CHAIN_ID = 221122420

export const DOGEOS_DEVNET_CONFIG = {
  chainId: `0x${DOGEOS_CHAIN_ID.toString(16)}`,
  chainName: 'DogeOS Devnet',
  nativeCurrency: {
    name: 'DOGE',
    symbol: 'DOGE',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.devnet.doge.xyz'],
  blockExplorerUrls: ['https://blockscout.devnet.doge.xyz'],
}

export const COMMON_NETWORKS = {
  ethereum: { chainId: '0x1', name: 'Ethereum Mainnet' },
  polygon: { chainId: '0x89', name: 'Polygon' },
  bsc: { chainId: '0x38', name: 'BNB Smart Chain' },
  arbitrum: { chainId: '0xa4b1', name: 'Arbitrum One' },
  optimism: { chainId: '0xa', name: 'Optimism' },
  avalanche: { chainId: '0xa86a', name: 'Avalanche' },
  fantom: { chainId: '0xfa', name: 'Fantom' },
  sepolia: { chainId: '0xaa36a7', name: 'Sepolia Testnet' },
  goerli: { chainId: '0x5', name: 'Goerli Testnet' },
  mumbai: { chainId: '0x13881', name: 'Polygon Mumbai' },
}

export interface Wallet {
  ethereum?: any
  myDoge?: any
  dogecoin?: any
}

declare global {
  interface Window extends Wallet {}
}

export function detectWallets() {
  return {
    hasMetaMask: !!(window.ethereum && window.ethereum.isMetaMask),
    hasMyDoge:
      typeof (window as any).doge !== 'undefined' ||
      typeof window.myDoge !== 'undefined' ||
      typeof window.dogecoin !== 'undefined' ||
      (typeof window.ethereum !== 'undefined' && window.ethereum.isMyDoge),
  }
}

export function getNetworkName(chainId: string): string {
  const network = Object.values(COMMON_NETWORKS).find(n => n.chainId === chainId)
  if (network) return network.name
  if (chainId === DOGEOS_DEVNET_CONFIG.chainId) return DOGEOS_DEVNET_CONFIG.chainName
  return `Network ${chainId}`
}

export function isDogeOSNetwork(chainId: string): boolean {
  const decimalChainId = parseInt(chainId, chainId.startsWith('0x') ? 16 : 10)
  return decimalChainId === DOGEOS_CHAIN_ID
}

export async function switchToDogeOSForPayment(provider: any): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: DOGEOS_DEVNET_CONFIG.chainId }],
    })
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [DOGEOS_DEVNET_CONFIG],
        })
      } catch (addError: any) {
        throw new Error(addError.message)
      }
    } else {
      throw new Error(switchError.message || 'Failed to switch network')
    }
  }
}

export async function connectMetaMask(): Promise<string[]> {
  if (!window.ethereum || !window.ethereum.isMetaMask) {
    throw new Error('MetaMask is not installed')
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    return accounts
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const connectMyDoge = async (): Promise<string[]> => {
  const myDogeProvider =
    (window as any).doge ||
    window.myDoge ||
    window.dogecoin ||
    (window.ethereum && window.ethereum.isMyDoge ? window.ethereum : null)

  if (!myDogeProvider) {
    throw new Error('MyDoge wallet is not installed')
  }

  try {
    const accounts = await myDogeProvider.request({
      method: 'doge_requestAccounts',
    })
    return accounts
  } catch (error) {
    throw error
  }
}

export const getCurrentChainId = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('No wallet detected')
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    })
    return chainId
  } catch (error) {
    throw error
  }
}

export const getWalletBalance = async (address: string): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('No wallet detected')
  }

  try {
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    })

    return (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)
  } catch (error) {
    return '0.0000'
  }
}

export const getCurrentNetworkSymbol = async (): Promise<string> => {
  if (!window.ethereum) {
    return 'ETH'
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })

    if (chainId === DOGEOS_DEVNET_CONFIG.chainId) {
      return 'DOGE'
    }

    const networkSymbols: Record<string, string> = {
      '0x1': 'ETH',
      '0x89': 'MATIC',
      '0x38': 'BNB',
      '0xa4b1': 'ETH',
      '0xa': 'ETH',
      '0xa86a': 'AVAX',
      '0xfa': 'FTM',
      '0xaa36a7': 'ETH',
      '0x5': 'ETH',
      '0x13881': 'MATIC',
    }

    return networkSymbols[chainId] || 'ETH'
  } catch (error) {
    return 'ETH'
  }
}
