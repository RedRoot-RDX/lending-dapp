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
    },
    // ...
  ];
}

export default async function DemoPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
