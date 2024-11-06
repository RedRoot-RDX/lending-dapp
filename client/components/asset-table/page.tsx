import { columns } from "./columns";
import { Asset } from "@/types/asset";
import { AssetTable } from "./asset-table";
import { assetAddrRecord } from "@/lib/utils";

async function getData(): Promise<Asset[]> {
  // Fetch data from your API here.
  return [
    {
      address: assetAddrRecord["XRD"],
      label: "XRD",
      wallet_balance: 100.5,
      select_native: 0.00,
      apy: "10.1%",
    },
    {
      address: assetAddrRecord["USDT"],
      label: "USDT",
      wallet_balance: 87,
      select_native: 0.00,
      apy: "5.5%",
    },
    {
      address: assetAddrRecord["HUG"],
      label: "HUG",
      wallet_balance: 123123,
      select_native: 0.00,
      apy: "20.5%",
    },
    // ...
  ];
}

export default async function DemoPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <AssetTable 
        columns={columns} 
        data={data}
        rowSelection={{}}
        onRowSelectionChange={() => {}}
        onAmountChange={() => {}}
      />
    </div>
  );
}
