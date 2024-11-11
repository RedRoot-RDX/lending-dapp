/* ------------------ Imports ----------------- */
use scrypto::prelude::*;

/* --------------- Asset Struct --------------- */
// TODO: Implement non-fixed APY and utilization
#[derive(Debug, Clone, ScryptoSbor)]
pub struct FungibleAsset {
    // Scrypto info
    pub address: ResourceAddress,
    pub resource_manager: ResourceManager,
    // Metadata
    pub name: String,
    pub symbol: String,
    // pub description: String,
    // Finance
    pub apy: Decimal, // 0.1 == 10%
    pub utilization: Decimal,
}

impl FungibleAsset {
    /* ------------------- Inits ------------------ */
    pub fn new(address: ResourceAddress) -> FungibleAsset {
        let resource_manager: ResourceManager = ResourceManager::from_address(address.clone());

        let name: String = resource_manager.get_metadata("name").expect("Cannot get asset name").expect("Asset name is None");
        let symbol: String = resource_manager.get_metadata("symbol").expect("Cannot get asset symbol").expect("Asset symbol is None");
        // let description: String = resource_manager.get_metadata("description").expect("Cannot get asset description").expect("Asset description is None");

        let apy: Decimal = dec!(0.1);
        let utilization: Decimal = dec!(0.0);

        FungibleAsset {
            // Scrypto info
            address,
            resource_manager,
            // Metadata
            name,
            symbol,
            // description
            // Finance
            apy,
            utilization,
        }
    }

    /* ------------------ Methods ----------------- */
    // ! All of these methods are mockups; to be replaced when dynamic APY and utilization is implemented
    pub fn update(&mut self) {
        self.apy = self.calc_apy();
        self.utilization = self.calc_utilization();
    }

    pub fn calc_apy(&self) -> Decimal {
        dec!(0.1)
    }

    pub fn calc_utilization(&self) -> Decimal {
        dec!(0.0)
    }
}

/* ------------------ Assets ------------------ */
pub const ASSET_ADDRESSES: [ResourceAddress; 1] = [XRD];
