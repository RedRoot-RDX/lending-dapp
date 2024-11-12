/* ------------------ Imports ----------------- */
use scrypto::prelude::*;

/* ------------------- Pool ------------------- */
// TODO: extract into separate global component
pub type TPool = Global<OneResourcePool>;

#[derive(ScryptoSbor)]
pub struct Pool {
    pub component: TPool,
    pub pool_address: ComponentAddress,
    pub pool_unit: ResourceAddress,
    pub pool_unit_global: GlobalAddress,
}

impl Pool {
    pub fn new(component: TPool, pool_address: ComponentAddress, pool_unit: ResourceAddress, pool_unit_global: GlobalAddress) -> Self {
        Pool { component, pool_address, pool_unit, pool_unit_global }
    }

    /// Create a pool for a given asset; automatically sets metadata
    // ! Assumes that the owner_proof is valid, and is the actual desired OwnerRole for the component
    pub fn create(owner_proof: Proof, pool_manager: AccessRule, asset: ResourceAddress, asset_symbol: String) -> Pool {
        info!("[create_pool] Creating pool for asset: {:?}", asset);
        info!("[create_pool] Asset symbol: {:?}", asset_symbol);

        let pool_owner = OwnerRole::Fixed(rule!(require(owner_proof.resource_address())));

        //. Sanity checks
        assert!(asset.is_fungible(), "Asset with address {:?} is not fungible", asset);

        //. Create the pool
        let pool = Blueprint::<OneResourcePool>::instantiate(pool_owner, pool_manager, asset, None);
        let pool_metadata_pu: Option<GlobalAddress> = pool.get_metadata("pool_unit").expect("Unable to get pool unit address");

        // let pool_name: Option<String> = pool.get_metadata("name").unwrap_or(Some(String::from("Unable to Fetch Name")));
        // let pool_description: Option<String> = pool.get_metadata("description").unwrap_or(Some(String::from("Unable to Fetch Description")));

        // info!("[create_pool] Pool name: {:?}", pool_name);
        // info!("[create_pool] Pool description: {:?}", pool_description);

        let pool_unit_global: GlobalAddress = pool_metadata_pu.expect("Unable to get pool unit GlobalAddress");
        let pool_unit_addr: ResourceAddress = ResourceAddress::try_from(pool_unit_global).expect("Unable to get pool unit ResourceAddress");
        let pool_unit_rm: ResourceManager = ResourceManager::from_address(pool_unit_addr.clone());

        //. Output
        let meta_symbol = format!("rrt{asset_symbol}").to_string();
        let meta_description = format!("Redroot pool unit for the {asset_symbol} pool").to_string();

        owner_proof.authorize(|| {
            pool_unit_rm.set_metadata("name", meta_symbol);
            pool_unit_rm.set_metadata("description", meta_description);
        });

        Pool::new(pool, pool.address(), pool_unit_addr, pool_unit_global)
    }
}
