export type AssetName = 'XRD' | 'xwBTC' | 'FLOOP' | 'xUSDC' | 'EARLY' | 'HUG' | 'DFP2' | 'xETH' | 'ASTRL' | 'CAVIAR';

export interface Asset {
  address: string;
  label: AssetName;
  wallet_balance: number;
  select_native: number;
  apy: number;
  type?: "supply" | "borrow";
}

export interface AssetConfig {
  address: string;
  label: AssetName;
  icon: string;
  apy: number;
}

export const assetConfigs: Record<AssetName, AssetConfig> = {
  XRD: {
    address: "resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd",
    label: "XRD",
    icon: "https://assets.radixdlt.com/icons/icon-xrd-32x32.png",
    apy: 10.3,
  },
  xwBTC: {
    address: "resource_usdt",
    label: "xwBTC",
    icon: "https://assets.instabridge.io/tokens/icons/xwBTC.png",
    apy: 5.5,
  },
  FLOOP: {
    address: "resource_usdc",
    label: "FLOOP",
    icon: "https://assets.caviarnine.com/tokens/floop_babylon.png",
    apy: 5.2,
  },
  xUSDC: {
    address: "resource_dai",
    label: "xUSDC",
    icon: "https://assets.instabridge.io/tokens/icons/xUSDC.png",
    apy: 4.8,
  },
  EARLY: {
    address: "resource_hug",
    label: "EARLY",
    icon: "https://arweave.net/uXCQ9YVGkEijn7PS2wdkXqwkU_YrdgpNtQPH2Y1-Qcs",
    apy: 23.1,
  },
  HUG: {
    address: "resource_hug",
    label: "HUG",
    icon: "https://tokens.defiplaza.net/cdn-cgi/imagedelivery/QTzOBjs3mHq3EhZxDosDSw/f5cdcf72-c7a2-4032-1252-1be08edb0700/token",
    apy: 23.1,
  },
  DFP2: {
    address: "resource_hug",
    label: "DFP2",
    icon: "https://radix.defiplaza.net/assets/img/babylon/defiplaza-icon.png",
    apy: 23.1,
  },
  xETH: {
    address: "resource_hug",
    label: "xETH",
    icon: "https://assets.instabridge.io/tokens/icons/xETH.png",
    apy: 23.1,
  },
  ASTRL: {
    address: "resource_hug",
    label: "ASTRL",
    icon: "https://astrolescent.com/assets/img/tokens/astrl.png",
    apy: 23.1,
  },
  CAVIAR: {
    address: "resource_hug",
    label: "CAVIAR",
    icon: "https://assets.caviarnine.com/tokens/caviar_babylon.png",
    apy: 23.1,
  },
};

// Helper functions
export const getAssetConfig = (label: AssetName): AssetConfig | undefined => assetConfigs[label];
export const getAssetIcon = (label: AssetName): string => 
  assetConfigs[label]?.icon || 'https://assets.radixdlt.com/icons/icon-default-32x32.png';
export const getAssetAddress = (label: AssetName): string => assetConfigs[label]?.address || '';
export const getAssetApy = (label: AssetName): number => assetConfigs[label]?.apy || 0;

// Remove the separate assetAddrRecord and instead create a helper function
export const getAssetAddrRecord = (): Record<AssetName, string> => {
  return Object.entries(assetConfigs).reduce((acc, [label, config]) => ({
    ...acc,
    [label]: config.address
  }), {} as Record<AssetName, string>);
};

export const mockWalletBalances: Record<AssetName, number> = {
  'XRD': 1000.50,
  'xwBTC': 2500.75,
  'FLOOP': 1500.25,
  'xUSDC': 5.5,
  'EARLY': 0.75,
  'HUG': 100.0,
  'DFP2': 50.0,
  'xETH': 2.5,
  'ASTRL': 1000.0,
  'CAVIAR': 500.0,
};

// You can later replace this with an actual API call
export const getWalletBalance = (asset: AssetName): number => {
  return mockWalletBalances[asset] || 0;
};