export type AssetName = 'XRD' | 'USDT' | 'USDC' | 'DAI' | 'HUG';

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
  colors: {
    bg: string;
    border: string;
  };
  apy: number;
}

export const assetConfigs: Record<AssetName, AssetConfig> = {
  XRD: {
    address: "resource_xrd",
    label: "XRD",
    colors: {
      bg: "bg-blue-500",
      border: "border-blue-500",
    },
    apy: 10.3,
  },
  USDT: {
    address: "resource_usdt",
    label: "USDT",
    colors: {
      bg: "bg-green-500",
      border: "border-green-500",
    },
    apy: 5.5,
  },
  USDC: {
    address: "resource_usdc",
    label: "USDC",
    colors: {
      bg: "bg-green-500",
      border: "border-green-500",
    },
    apy: 5.2,
  },
  DAI: {
    address: "resource_dai",
    label: "DAI",
    colors: {
      bg: "bg-green-500",
      border: "border-green-500",
    },
    apy: 4.8,
  },
  HUG: {
    address: "resource_hug",
    label: "HUG",
    colors: {
      bg: "bg-purple-500",
      border: "border-purple-500",
    },
    apy: 23.1,
  },
};

// Helper functions
export const getAssetConfig = (label: AssetName): AssetConfig => assetConfigs[label];
export const getAssetColors = (label: AssetName) => assetConfigs[label].colors;
export const getAssetAddress = (label: AssetName): string => assetConfigs[label].address;
export const getAssetApy = (label: AssetName): number => assetConfigs[label].apy; 