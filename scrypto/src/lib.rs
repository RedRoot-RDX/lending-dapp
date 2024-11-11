/* ------------------ Imports ----------------- */
// Modules
mod asset;
mod pool;
mod position;
mod utils;
// Usages
use asset::{Asset, ADDRESSES};
use pool::Pool;
use position::Position;
use scrypto::prelude::*;
use utils::{LazyVec, ValueMap};

/* ------------------ Events ------------------ */
#[derive(ScryptoSbor, ScryptoEvent)]
struct InstantiseEvent {
    component_address: ComponentAddress,
    asset_list: Vec<ResourceAddress>,
    // vaults:            KeyValueStore<ResourceAddress, Vault>,
    // pools:             KeyValueStore<ResourceAddress, Pool>,
}

#[derive(ScryptoSbor, ScryptoEvent)]
struct AddAssetEvent {
    asset: ResourceAddress,
    pool_address: ComponentAddress,
    pool_unit_address: GlobalAddress,
}

#[derive(ScryptoSbor, ScryptoEvent)]
struct TrackAssetEvent {
    asset: ResourceAddress,
}

#[derive(ScryptoSbor, ScryptoEvent)]
struct UntrackAssetEvent {
    asset: ResourceAddress,
}

/* ----------------- Blueprint ---------------- */
#[blueprint]
#[events(InstantiseEvent, AddAssetEvent, TrackAssetEvent, UntrackAssetEvent)]
mod redroot {
    enable_method_auth! {
        roles {
            admin => updatable_by: [OWNER];
        },
        methods {
            // Position management
            position_supply   => PUBLIC;
            position_borrow   => PUBLIC;
            position_withdraw => PUBLIC;
            position_repay    => PUBLIC;
            // Asset management
            add_asset     => restrict_to: [SELF, OWNER];
            track_asset   => restrict_to: [SELF, OWNER, admin];
            untrack_asset => restrict_to: [SELF, OWNER, admin];
            // Pool management

            // Temporary methods
            log_asset_list => PUBLIC;
            log_assets     => PUBLIC;
            log_pools      => PUBLIC;
        }
    }

    struct Redroot {
        component_address: ComponentAddress,

        owner_badge_address: ResourceAddress,
        admin_manager: ResourceManager,

        asset_list: LazyVec<ResourceAddress>,
        assets: KeyValueStore<ResourceAddress, Asset>,
        pools: KeyValueStore<ResourceAddress, Pool>,

        position_manager: ResourceManager,
    }

    impl Redroot {
        pub fn instantiate(dapp_definition_address: ComponentAddress) -> (Global<Redroot>, Bucket) {
            // Reserve address
            let (address_reservation, component_address) = Runtime::allocate_component_address(Redroot::blueprint_id());

            //. Badges and Rules
            // Component
            let component_access_rule: AccessRule = rule!(require(global_caller(component_address)));

            // Component owner
            let owner_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "Redroot Owner Badge", locked;
                    "description" => "Badge representing the owner of the Redroot lending platform", locked;
                }})
                .mint_initial_supply(1)
                .into();
            let owner_access_rule: AccessRule = rule!(require(owner_badge.resource_address()));
            let owner_role: OwnerRole = OwnerRole::Fixed(owner_access_rule.clone());

            // Admin badge
            let admin_manager: ResourceManager = ResourceBuilder::new_fungible(owner_role.clone())
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "", locked;
                    "description" => "", locked;
                }})
                .mint_roles(mint_roles! {
                    minter         => component_access_rule.clone();
                    minter_updater => rule!(deny_all);
                })
                .recall_roles(recall_roles! {
                    recaller         => component_access_rule.clone();
                    recaller_updater => rule!(deny_all);
                })
                .burn_roles(burn_roles! {
                    burner         => component_access_rule.clone();
                    burner_updater => rule!(deny_all);
                })
                .create_with_no_initial_supply();
            let admin_access_rule: AccessRule = rule!(require(admin_manager.address()));

            // Position badge
            let position_manager: ResourceManager = ResourceBuilder::new_ruid_non_fungible::<Position>(owner_role.clone())
                .metadata(metadata! {init {
                    "name"        => "Redroot Position Badge", locked;
                    "description" => "Badge representing a position in the Redroot lending platform", locked;
                }})
                .mint_roles(mint_roles! {
                    minter         => component_access_rule.clone();
                    minter_updater => rule!(deny_all);
                })
                .burn_roles(burn_roles! {
                    burner         => component_access_rule.clone();
                    burner_updater => rule!(deny_all);
                })
                .create_with_no_initial_supply();

            //. Internal Data Setup
            // Initialise component data
            let mut component_data: Redroot = Self {
                component_address,
                owner_badge_address: owner_badge.resource_address(),
                admin_manager,
                asset_list: LazyVec::new(),
                assets: KeyValueStore::new(),
                pools: KeyValueStore::new(),
                position_manager,
            };

            // Add all assets
            let mut assets: Vec<ResourceAddress> = ADDRESSES.clone().to_vec();
            let owner_proof = owner_badge.create_proof_of_all();

            // ! ---------- TESTNET ----------
            // Create test 'Redroot' asset
            let rrt: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_MAXIMUM)
                .metadata(metadata! {init {
                    "name"        => "Redroot", locked;
                    "symbol"      => "RRT", locked;
                    "description" => "Redroot token", locked;
                }})
                .mint_initial_supply(10000)
                .into();
            assets.push(rrt.resource_address());
            // ! -/-/-/-/-/ TESTNET -/-/-/-/-/

            for address in assets {
                Redroot::add_asset(&mut component_data, address, owner_proof.clone());
            }

            // ! ---------- TESTNET ----------
            // Deposit all RRT into its pool
            owner_proof.authorize(|| {
                component_data.pools.get_mut(&rrt.resource_address()).unwrap().pool.protected_deposit(rrt);
            });
            // ! -/-/-/-/-/ TESTNET -/-/-/-/-/
            owner_proof.drop();

            //. Component
            let asset_list: Vec<ResourceAddress> = component_data.asset_list.to_vec();

            // Metadata
            let component_metadata = metadata! {
                roles {
                    metadata_setter         => OWNER;
                    metadata_setter_updater => OWNER;
                    metadata_locker         => OWNER;
                    metadata_locker_updater => rule!(deny_all);
                },
                init {
                    "name"            => "Redroot Lending Platform", locked;
                    "description"     => "Multi-collateralized lending platform", locked;
                    "dapp_definition" => dapp_definition_address, updatable;
                }
            };

            // Roles
            let component_roles = roles! {
                admin => admin_access_rule.clone();
            };

            // Instantisation
            let component: Global<Redroot> = component_data
                .instantiate()
                .prepare_to_globalize(owner_role)
                .roles(component_roles)
                .metadata(component_metadata)
                .with_address(address_reservation)
                .globalize();

            // Call instantisation event
            Runtime::emit_event(InstantiseEvent { component_address: component.address(), asset_list });

            // Return
            (component, owner_badge)
        }

        //. ------------ Position Management ----------- /
        // 0. Validate that all supplied resources are valid
        // 1. Check if user has an NFT
        // YES: continue -> #2
        // NO: create and issue new NFT
        // 2. Fetch NFT data
        // 3. Append supply
        // 4. Calculate position health
        // 5. Update NFT
        pub fn position_supply(&mut self, supply: Vec<Bucket>) {
            todo!()
        }

        pub fn position_borrow(&mut self, borrow: Vec<Bucket>) {
            todo!()
        }

        pub fn position_withdraw(&mut self, asset: Bucket) {
            todo!()
        }

        pub fn position_repay(&mut self, asset: Bucket) {
            todo!()
        }

        //. ------------- Asset Management ------------- /
        /// Add a fungible asset into the market, and output a FungibleAsset struct
        pub fn add_asset(&mut self, address: ResourceAddress, owner_proof: Proof) -> Asset {
            info!("[add_asset] Adding asset: {:?}", address);

            // Validation
            assert!(address.is_fungible(), "Provided asset must be fungible.");
            assert!(self.pools.get(&address).is_none(), "Asset already has a pool");
            assert!(!self.validate_fungible(address), "Cannot add asset {:?}, as it is already added and tracked", address);

            // Create FungibleAsset
            let asset = Asset::new(address);
            info!("[add_asset] FungibleAsset: {:#?}", asset);

            // Pool owned by: Redroot owner
            // Pool managed by: Redroot owner or component calls
            let pool_manager = rule!(require(global_caller(self.component_address)) || require(self.owner_badge_address));
            let pool = Redroot::create_pool(owner_proof, pool_manager, asset.address, asset.symbol.clone());

            // Fire AddAssetEvent
            Runtime::emit_event(AddAssetEvent {
                asset: asset.address,
                pool_address: pool.pool_address,
                pool_unit_address: pool.pool_unit_global,
            });

            self.pools.insert(asset.address, pool);
            self.track_asset(asset.address);

            asset
        }

        /// Add an asset into the asset list
        pub fn track_asset(&mut self, asset: ResourceAddress) {
            info!("[track_asset] Tracking asset {:?}", asset);

            // Sanity checks
            assert!(!self.validate_fungible(asset), "Cannot add asset {:?}, as it is already added and tracked", asset);
            assert!(asset.is_fungible(), "Provided asset must be fungible.");
            assert!(self.pools.get(&asset).is_some(), "No pool for asset {:?}, run add_asset first", asset);

            // Append the asset into the asset list
            self.asset_list.append(asset);
        }

        /// Removes an asset from the asset list
        pub fn untrack_asset(&mut self, asset: ResourceAddress) {
            info!("[untrack_asset] Removing asset: {:?}", asset);

            // Sanity checks
            assert!(self.validate_fungible(asset), "Asset with address {:?} is invalid", asset);

            // Remove asset
            let found = self.asset_list.find(&asset);
            if let Some(index) = found {
                // Remove the asset from the list
                self.asset_list.remove(&index);

                // Fire RemoveAssetEvent
                Runtime::emit_event(UntrackAssetEvent { asset });
            } else {
                panic!("Cannot find asset {:?} in the asset list. It is likely not added.", asset);
            }
        }

        //. -------------- Pool Management ------------- /
        // TODO; potentially extract all pool management functions to the pools module

        // ! ------------ Temporary Methods ------------ /
        pub fn log_asset_list(&self) {
            info!("[log_asset_list] Asset list: {:#?}", self.asset_list.to_vec());
        }

        pub fn log_assets(&self) {
            for (i, address, _) in self.asset_list.iter() {
                if let Some(asset) = self.assets.get(&address) {
                    info!("[log_assets] Data for asset {:?}:", address);
                    info!("[log_assets] {:#?}", asset.clone());
                } else {
                    info!("[log_assets] Asset with address {:?} not found", address);
                }
            }
        }

        pub fn log_pools(&self) {
            for (i, address, _) in self.asset_list.iter() {
                if let Some(pool) = self.pools.get(&address) {
                    info!("[log_pools] Data for pool {:?}:", address);
                    info!("[log_pools] Vault contains: {}", pool.pool.get_vault_amount());
                } else {
                    info!("[log_pools] Pool with address {:?} not found", address);
                }
            }
        }

        //. -------------- Private Methods ------------- /
        /// Checks that the given asset is generally valid, is in the asset_list, and has a corresponding vault
        fn validate_fungible(&self, address: ResourceAddress) -> bool {
            if !address.is_fungible() {
                info!("[validate_fungible] INVALID: Asset {:?} is not fungible", address);
                return false;
            }

            // Check that a vault exists for the given address
            if self.pools.get(&address).is_none() {
                info!("[validate_fungible] INVALID: No pool found for asset {:?}", address);
                return false;
            }

            // Check that the asset is tracked in the asset_list
            let found = self.asset_list.find(&address);
            if found.is_none() {
                info!("[validate_fungible] INVALID: Asset {:?} not tracked in the asset list", address);
                return false;
            }

            // Return true if all checks passed
            info!("[validate_fungible] VALID: Asset {:?} successfully validated", address);
            true
        }

        /// Calculates the USD values of all provided asset from the oracle
        // ! Currently uses a mock oracle
        // TODO: provide epoch to ensure data not out-of-date
        fn get_asset_values(&self, assets: ValueMap) -> (Decimal, ValueMap) {
            let mut usd_values = KeyValueStore::new();
            let mut total = dec!(0.0);

            (total, usd_values)
        }

        /// Generate a value map from a vector of buckets
        fn buckets_to_value_map(buckets: Vec<Bucket>) -> (ValueMap, Vec<Bucket>) {
            let mut kv: ValueMap = KeyValueStore::new();

            for bucket in &buckets {
                kv.insert(bucket.resource_address(), bucket.amount());
            }

            (kv, buckets)
        }

        /// Create a pool for a given asset; automatically sets metadata
        // ! Assumes that the owner_proof is valid, and is the actual desired OwnerRole for the component
        fn create_pool(owner_proof: Proof, pool_manager: AccessRule, asset: ResourceAddress, asset_symbol: String) -> Pool {
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
}
