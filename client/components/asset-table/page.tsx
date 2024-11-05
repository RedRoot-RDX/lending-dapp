import { Asset, columns } from "./columns";
import { AssetTable } from "./asset-table";
import { assetAddrRecord } from "@/lib/utils";

async function getData(): Promise<Asset[]> {
  // Fetch data from your API here.
  return [
    {
      address: assetAddrRecord["XRD"],
      label: "XRD",
      wallet_balance: 100.5,
      select_native: 10,
      select_usd: 0,
      apy: "10.1%",
    },
    {
      address: assetAddrRecord["USDT"],
      label: "USDT",
      wallet_balance: 87,
      select_native: 87,
      select_usd: 87,
      apy: "5.5%",
    },
    {
      address: assetAddrRecord["HUG"],
      label: "HUG",
      wallet_balance: 123123,
      select_native: 123123,
      select_usd: 123123,
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
      />
    </div>
  );
}
