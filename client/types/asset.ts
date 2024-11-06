export type Asset = {
  address: string;
  label: string;
  wallet_balance: number;
  select_native: number;
  apy: string;
  type?: "supply" | "borrow";
}; 