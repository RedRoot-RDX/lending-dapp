"use client";
import { useEffect, useState } from "react";
import { RowSelectionState, Updater } from "@tanstack/react-table";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AssetTable } from "@/components/asset-table/asset-table";
import { columns } from "@/components/asset-table/columns";
import SupplyDialog from "@/components/supply-dialog";
import { useRadixContext } from "@/contexts/provider";
import { gatewayApi, rdt } from "@/lib/radix";
import { getAssetAddrRecord, Asset, AssetName, getAssetApy, getWalletBalance } from "@/types/asset";
import { PortfolioTable } from "@/components/portfolio-table/portfolio-table";
import { portfolioColumns } from "@/components/portfolio-table/portfolio-columns";
import { useToast } from "@/components/ui/use-toast";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { borrowColumns } from "@/components/asset-table/borrow-columns";
import BorrowDialog from "@/components/borrow-dialog";
import config from "@/lib/config.json";

interface SuppliedAsset {
  address: string;
  supplied_amount: number;
}

interface NFTMetadata {
  position_type?: string;
  supplied_assets?: string;
}

interface StateNonFungibleDetailsResponseItem {
  metadata?: NFTMetadata;
}

interface NFTData {
  data: {
    programmatic_json: {
      fields: Array<{
        field_name: string;
        entries: Array<{
          key: {
            value: string;  // resource address
          };
          value: {
            value: string;  // amount
          };
        }>;
      }>;
    };
  };
}

export default function App() {
  const { accounts } = useRadixContext();
  const [supplyRowSelection, setSupplyRowSelection] = React.useState<RowSelectionState>({});
  const [borrowRowSelection, setBorrowRowSelection] = React.useState<RowSelectionState>({});
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const { toast } = useToast();
  const [supplyData, setSupplyData] = useState<Asset[]>(
    Object.entries(getAssetAddrRecord()).map(([label, address]) => ({
      address,
      label: label as AssetName,
      wallet_balance: -1,
      select_native: 0,
      apy: 0,
    }))
  );
  const [portfolioData, setSupplyPortfolioData] = useState<Asset[]>([]);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [totalSupplyApy, setTotalSupplyApy] = useState<number>(0);
  const [showSupplyPreview, setShowSupplyPreview] = useState(false);
  const [showBorrowPreview, setShowBorrowPreview] = useState(false);
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false);
  const [borrowPortfolioData, setBorrowPortfolioData] = useState<Asset[]>([]);
  const [totalBorrowDebt, setTotalBorrowDebt] = useState<number>(0);
  const [totalBorrowApy, setTotalBorrowApy] = useState<number>(0);
  const [borrowPowerUsed, setBorrowPowerUsed] = useState<number>(0);
  const [netWorth, setNetWorth] = useState<number>(0);
  const [netApy, setNetApy] = useState<number>(0);
  const [health, setHealth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const hasSelectedSupplyAssets = Object.keys(supplyRowSelection).length > 0;
  const hasSelectedBorrowAssets = Object.keys(borrowRowSelection).length > 0;

  useEffect(() => {
    console.log("Account", accounts);
    console.log("RDT", rdt);
    console.log("GatewayApi", gatewayApi);
  }, [accounts]);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        if (!accounts || !gatewayApi) return;

        const borrowerBadgeAddr = config.borrowerBadgeAddr;
        if (!borrowerBadgeAddr) throw new Error("Borrower badge address not configured");

        const accountState = await gatewayApi.state.getEntityDetailsVaultAggregated(accounts[0].address);
        const getNFTBalance = accountState.non_fungible_resources.items.find(
          (fr: { resource_address: string }) => fr.resource_address === borrowerBadgeAddr
        )?.vaults.items[0];
        console.log("NFT Balance: ", getNFTBalance);
        if (!getNFTBalance) {
          return { assets: [], badgeValue: 0 };
        }

        const metadata = await gatewayApi.state.getNonFungibleData(
          JSON.parse(JSON.stringify(borrowerBadgeAddr)),
          JSON.parse(JSON.stringify(getNFTBalance)).items[0]
        ) as NFTData;

        // Extract supply positions
        const supplyField = metadata.data.programmatic_json.fields.find(
          field => field.field_name === "supply"
        );

        const suppliedAssets = supplyField?.entries.map(entry => ({
          address: entry.key.value,
          supplied_amount: parseFloat(entry.value.value)
        })) || [];

        // Convert to portfolio data
        const supplyPortfolioData: Asset[] = await Promise.all(
          suppliedAssets.map(async (suppliedAsset) => {
            const assetConfig = Object.entries(getAssetAddrRecord()).find(
              ([_, address]) => address === suppliedAsset.address
            );

            if (!assetConfig) return null;
            const [label] = assetConfig;

            return {
              address: suppliedAsset.address,
              label: label as AssetName,
              wallet_balance: await getWalletBalance(label as AssetName, accounts[0].address),
              select_native: suppliedAsset.supplied_amount,
              apy: getAssetApy(label as AssetName),
            };
          })
        ).then(results => results.filter((asset): asset is Asset => asset !== null));

        setSupplyPortfolioData(supplyPortfolioData);

        // New dummy borrow data
        const dummyBorrowedAssets = [
          {
            address: "resource_astrl",
            borrowed_amount: 99.12,
          },
          {
            address: "resource_xusdc",
            borrowed_amount: 130.01,
          }
        ];

        // Convert to portfolio data
        const borrowPortfolioData: Asset[] = await Promise.all(
          dummyBorrowedAssets
            .map(async borrowedAsset => {
              const assetConfig = Object.entries(getAssetAddrRecord()).find(
                ([_, address]) => address === borrowedAsset.address
              );

              if (!assetConfig) return null;
              const [label] = assetConfig;
              if(!accounts) return;

              return {
                address: borrowedAsset.address,
                label: label as AssetName,
                wallet_balance: await getWalletBalance(label as AssetName, accounts[0].address),
                select_native: borrowedAsset.borrowed_amount,
                apy: getAssetApy(label as AssetName)
              };
            })
        ).then(results => results.filter((asset: unknown): asset is Asset => asset !== null));

        setBorrowPortfolioData(borrowPortfolioData);
      } catch (error) {
        console.error("Error fetching portfolio data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch portfolio data",
        });
      }
    };

    fetchPortfolioData();

    const fetchPortfolioStats = async () => {
      try {
        // TODO: Fetch actual stats from backend
        const dummyStats = {
          totalSupply: 1234.56,
          totalApy: 10.3
        };
        setTotalSupply(dummyStats.totalSupply);
        setTotalSupplyApy(dummyStats.totalApy);

        const dummyBorrowStats = {
          totalDebt: 700.50,
          totalApy: 5.3,
          borrowPowerUsed: 51.4
        };
        setTotalBorrowDebt(dummyBorrowStats.totalDebt);
        setTotalBorrowApy(dummyBorrowStats.totalApy);
        setBorrowPowerUsed(dummyBorrowStats.borrowPowerUsed);
      } catch (error) {
        console.error("Error fetching portfolio stats:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch portfolio statistics",
        });
      }
    };

    fetchPortfolioStats();

    const fetchOverallStats = async () => {
      try {
        // TODO: Fetch actual stats from backend
        const dummyOverallStats = {
          netWorth: 2500.75,
          netApy: 8.5,
          health: 85.2
        };

        setNetWorth(dummyOverallStats.netWorth);
        setNetApy(dummyOverallStats.netApy);
        setHealth(dummyOverallStats.health);
      } catch (error) {
        console.error("Error fetching overall stats:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch overall statistics",
        });
      }
    };

    fetchOverallStats();
  }, [accounts]);

  useEffect(() => {
    const updateWalletBalances = async () => {
      if (!accounts) return;
      const updatedData = await Promise.all(
        supplyData.map(async (asset) => ({
          ...asset,
          wallet_balance: await getWalletBalance(asset.label as AssetName, accounts[0].address),
        }))
      );
      setSupplyData(updatedData);
      setIsLoading(false);
    };
    
    updateWalletBalances();
  }, [accounts]);

  if (isLoading) {
    return <div>Loading asset data...</div>;
  }

  const getSelectedSupplyAssets = () => {
    return Object.keys(supplyRowSelection).map(index => supplyData[Number(index)]);
  };

  const getSelectedBorrowAssets = () => {
    return Object.keys(borrowRowSelection).map(index => supplyData[Number(index)]);
  };

  const handleSupplyConfirm = () => {
    const selectedAssets = getSelectedSupplyAssets();
    const assetsToSupply = selectedAssets.map(asset => ({
      address: asset.address,
      amount: asset.select_native
    }));

    console.log("Supply confirmed!");
    console.log("Assets to supply:", assetsToSupply);

    // Reset supply row selection
    setSupplyRowSelection({});
    setIsPreviewDialogOpen(false);
  };

  const handleBorrowConfirm = () => {
    const selectedAssets = getSelectedBorrowAssets();
    const assetsToBorrow = selectedAssets.map(asset => ({
      address: asset.address,
      amount: asset.select_native
    }));

    console.log("Borrow confirmed!");
    console.log("Assets to borrow:", assetsToBorrow);

    setBorrowRowSelection({});
    setIsBorrowDialogOpen(false);
  };

  const validateSelectedSupplyAssets = () => {
    const selectedAssets = Object.keys(supplyRowSelection).filter(
      (key) => supplyRowSelection[key]
    );

    const hasInvalidAmount = selectedAssets.some((key) => {
      const asset = supplyData[parseInt(key)];
      return !asset || asset.select_native <= 0;
    });

    return !hasInvalidAmount;
  };

  const validateSelectedBorrowAssets = () => {
    const selectedAssets = Object.keys(borrowRowSelection).filter(
      (key) => borrowRowSelection[key]
    );

    const hasInvalidAmount = selectedAssets.some((key) => {
      const asset = supplyData[parseInt(key)];
      return !asset || asset.select_native <= 0;
    });

    return !hasInvalidAmount;
  };

  const handlePreviewSupply = () => {
    if (!validateSelectedSupplyAssets()) {
      toast({
        variant: "destructive",
        title: "Invalid Selection",
        description: "Please ensure all selected assets have an amount greater than 0",
      });
      return;
    }
    setIsPreviewDialogOpen(true);
  };

  const handleAmountChange = (address: string, amount: number, type: 'supply' | 'borrow') => {
    setSupplyData(current =>
      current.map(row =>
        row.address === address
          ? { ...row, select_native: amount }
          : row
      )
    );
    
    // Show preview button when amount is set
    if (amount > 0) {
      if (type === 'supply') {
        setShowSupplyPreview(true);
      } else {
        setShowBorrowPreview(true);
      }
    }
  };

  const handleSupplyRowSelectionChange = (updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
    setSupplyRowSelection(updaterOrValue);
  };

  const handlePreviewBorrow = () => {
    if (!validateSelectedBorrowAssets()) {
      toast({
        variant: "destructive",
        title: "Invalid Selection",
        description: "Please ensure all selected assets have an amount greater than 0",
      });
      return;
    }
    setIsBorrowDialogOpen(true);
  };

  return (
    <div>
      <main className="container py-4 flex-grow">
        <div className="grid grid-cols-2 gap-8">
          {/* Statistics Header */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Overall Statistics</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-row gap-8 [&>*]:flex [&>*]:flex-col [&>*>h1]:font-semibold">
              <div>
                <h1>Net Worth</h1>
                <p>${netWorth.toFixed(2)}</p>
              </div>
              <div>
                <h1>Net APY</h1>
                <p>{netApy.toFixed(1)}%</p>
              </div>
              <div>
                <h1>Health</h1>
                <p>{health.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Collateral Column */}
          <div className="space-y-4">
            {/* Your Collateral Card */}
            <Card>
              <CardHeader>
                <div className="grid grid-cols-2">
                  <CardTitle>Your Collateral</CardTitle>
                  <div className="flex justify-end">
                    <div className="space-y-0 text-left min-h-[60px]">
                      <div className="grid grid-cols-[auto,1fr] gap-x-6 items-center">
                        <CardDescription className="text-left">Total Supply:</CardDescription>
                        <CardDescription className="text-right mr-4">${totalSupply.toFixed(2)}</CardDescription>
                        <CardDescription className="text-left">Total APY:</CardDescription>
                        <CardDescription className="text-right mr-4">{totalSupplyApy.toFixed(1)}%</CardDescription>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PortfolioTable
                  columns={portfolioColumns}
                  data={portfolioData.map(asset => ({ 
                    ...asset, 
                    type: 'supply' as const,
                    supplied: asset.select_native // Rename debt to supplied
                  }))}
                />
              </CardContent>
            </Card>

            {/* Available Collateral Card */}
            <Card>
              <CardHeader>
                <div className="grid grid-cols-2 gap-4">
                  <CardTitle>Available Collateral</CardTitle>
                  {showSupplyPreview && hasSelectedSupplyAssets && (
                    <Button onClick={handlePreviewSupply}>Preview Supply</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <AssetTable
                  columns={columns}
                  data={supplyData}
                  rowSelection={supplyRowSelection}
                  onRowSelectionChange={handleSupplyRowSelectionChange}
                  onAmountChange={(address, amount) => handleAmountChange(address, amount, 'supply')}
                  type="supply"
                />
              </CardContent>
            </Card>
          </div>

          {/* Borrow Column */}
          <div className="space-y-4">
            {/* Your Borrows Card */}
            <Card>
              <CardHeader>
                <div className="grid grid-cols-2">
                  <CardTitle>Your Borrows</CardTitle>
                  <div className="flex justify-end">
                    <div className="grid grid-cols-[auto,1fr] gap-x-6 items-center">
                      <CardDescription className="text-left">Total Debt:</CardDescription>
                      <CardDescription className="text-right">${totalBorrowDebt.toFixed(2)}</CardDescription>
                      <CardDescription className="text-left">Total APY:</CardDescription>
                      <CardDescription className="text-right">{totalBorrowApy.toFixed(1)}%</CardDescription>
                      <CardDescription className="text-left">Borrow Power Used:</CardDescription>
                      <CardDescription className="text-right">{borrowPowerUsed.toFixed(1)}%</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PortfolioTable
                  columns={portfolioColumns}
                  data={borrowPortfolioData}
                />
              </CardContent>
            </Card>

            {/* Available Borrows Card */}
            <Card>
              <CardHeader>
                <div className="grid grid-cols-2 gap-4">
                  <CardTitle>Available Borrows</CardTitle>
                  {showBorrowPreview && hasSelectedBorrowAssets && (
                    <Button onClick={handlePreviewBorrow}>Preview Borrow</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <AssetTable
                  columns={borrowColumns}
                  data={supplyData.map(asset => ({
                    ...asset,
                    available: asset.wallet_balance * 0.8,
                    type: 'borrow'
                  }))}
                  rowSelection={borrowRowSelection}
                  onRowSelectionChange={setBorrowRowSelection}
                  onAmountChange={(address, amount) => handleAmountChange(address, amount, 'borrow')}
                  type="borrow"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <SupplyDialog
          isOpen={isPreviewDialogOpen}
          onClose={() => setIsPreviewDialogOpen(false)}
          onConfirm={handleSupplyConfirm}
          selectedAssets={getSelectedSupplyAssets()}
        />
        <BorrowDialog
          isOpen={isBorrowDialogOpen}
          onClose={() => setIsBorrowDialogOpen(false)}
          onConfirm={handleBorrowConfirm}
          selectedAssets={getSelectedBorrowAssets()}
        />
      </main>
      <ShootingStars className="pointer-events-none" />
    </div>
  );
}