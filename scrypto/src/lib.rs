/* ------------------ Imports ----------------- */
// Modules
mod assets;
mod pool;
mod utils;
// Usages
use assets::{FungibleAsset, ASSET_ADDRESSES};
use pool::Pool;
use scrypto::prelude::*;
use utils::LazyVec;

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
        }
    }

    struct Redroot {
        // Authorization
        global_component_caller_badge: NonFungibleGlobalId,
        owner_badge: ResourceAddress,
        admin_resource_manager: ResourceManager,
        // Asset Storage
        asset_list: LazyVec<ResourceAddress>,
        assets: KeyValueStore<ResourceAddress, FungibleAsset>,
        pools: KeyValueStore<ResourceAddress, Pool>,
    }

    impl Redroot {
        pub fn instantiate(dapp_definition_address: ComponentAddress) -> (Global<Redroot>, Bucket) {
            // Reserve address
            let (address_reservation, component_address) = Runtime::allocate_component_address(Redroot::blueprint_id());

            //. Authorization
            // Component
            let global_component_caller_badge = NonFungibleGlobalId::global_caller_badge(component_address);
            let global_component_access_rule: AccessRule = rule!(require(global_component_caller_badge.clone()));

            // Component Owner
            let owner_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "Redroot Owner Badge", locked;
                    "description" => "Badge representing the owner of the Redroot lending platform", locked;
                }})
                .mint_initial_supply(1)
                .into();
            let owner_access_rule: AccessRule = rule!(require(owner_badge.resource_address()));

            // Admin Badge
            let admin_resource_manager: ResourceManager = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "", locked;
                    "description" => "", locked;
                }})
                .mint_roles(mint_roles! {
                    minter         => global_component_access_rule.clone();
                    minter_updater => rule!(deny_all);
                })
                .recall_roles(recall_roles! {
                    recaller         => global_component_access_rule.clone();
                    recaller_updater => rule!(deny_all);
                })
                .burn_roles(burn_roles! {
                    burner         => global_component_access_rule.clone();
                    burner_updater => rule!(deny_all);
                })
                .create_with_no_initial_supply();
            let admin_access_rule: AccessRule = rule!(require(admin_resource_manager.address()));

            //. Internal Data Setup
            // Initialise component data
            let mut component_data: Redroot = Self {
                // Authorization
                global_component_caller_badge,
                owner_badge: owner_badge.resource_address(),
                admin_resource_manager,
                // Asset Storage
                asset_list: LazyVec::new(),
                assets: KeyValueStore::new(),
                pools: KeyValueStore::new(),
            };

            // Add all assets
            let mut assets: Vec<ResourceAddress> = ASSET_ADDRESSES.clone().to_vec();
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

            for addr in assets {
                Redroot::add_asset(&mut component_data, addr, owner_proof.clone());
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
                .prepare_to_globalize(OwnerRole::Fixed(owner_access_rule.clone()))
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
        pub fn add_asset(&mut self, address: ResourceAddress, owner_proof: Proof) -> FungibleAsset {
            info!("[add_asset] Adding asset: {:?}", address);

            // Validation
            assert!(address.is_fungible(), "Provided asset must be fungible.");
            assert!(self.pools.get(&address).is_none(), "Asset already has a pool");
            assert!(!self.validate_fungible(address), "Cannot add asset {:?}, as it is already added and tracked", address);

            // Create FungibleAsset
            let asset = FungibleAsset::new(address);
            info!("[add_asset] FungibleAsset: {:#?}", asset);

            info!("[add_asset] Creating pool for asset: {:?}", asset);
            let pool_manager_role = rule!(require(self.global_component_caller_badge.clone()) || require(self.owner_badge));
            let pool = Redroot::create_pool(owner_proof, pool_manager_role, asset.address, asset.symbol.clone());

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

        /// Add asset into the asset list
        pub fn track_asset(&mut self, asset: ResourceAddress) {
            info!("[track_asset] Tracking asset {:?}", asset);

            // Sanity checks
            assert!(!self.validate_fungible(asset), "Cannot add asset {:?}, as it is already added and tracked", asset);
            assert!(asset.is_fungible(), "Provided asset must be fungible.");
            assert!(self.pools.get(&asset).is_some(), "No pool for asset {:?}, run add_asset first", asset);

            // Append the asset into the asset list
            self.asset_list.append(asset);
        }

        /// Removes a (fungible) asset from the asset list, but does not remove its vault
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
        // TODO

        //. -------------- Private Methods ------------- /
        /// Checks that the given asset is generally valid, is in the asset_list, and has a corresponding vault
        fn validate_fungible(&self, addr: ResourceAddress) -> bool {
            info!("[validate_fungible] Validating asset with address {:?}", addr);

            if !addr.is_fungible() {
                info!("[validate_fungible] INVALID: Asset {:?} is not fungible", addr);
                return false;
            }

            // Check that a vault exists for the given address
            if self.pools.get(&addr).is_none() {
                info!("[validate_fungible] INVALID: No pool found for asset {:?}", addr);
                return false;
            }

            // Check that the asset is tracked in the asset_list
            let found = self.asset_list.find(&addr);
            if found.is_none() {
                info!("[validate_fungible] INVALID: Asset {:?} not tracked in the asset list", addr);
                return false;
            }

            // Return true if all checks passed
            info!("[validate_fungible] VALID: Asset {:?} successfully validated", addr);
            true
        }

        /// Calculates the total USD value of the given assets
        fn calculate_usd_kv(&self, assets: KeyValueStore<ResourceAddress, Decimal>) -> (Decimal, KeyValueStore<ResourceAddress, Decimal>) {
            let mut usd_values = KeyValueStore::new();
            let mut total = dec!(0.0);

            (total, usd_values)
        }

        /// Calculates the total USD value of the given assets
        fn calculate_usd(&self, assets: Vec<Bucket>) -> (Decimal, KeyValueStore<ResourceAddress, Decimal>) {
            let mut usd_values = KeyValueStore::new();
            let mut total = dec!(0.0);

            (total, usd_values)
        }

        /// Create a pool for a given asset; automatically sets metadata
        fn create_pool(owner_proof: Proof, pool_manager_role: AccessRule, asset: ResourceAddress, asset_symbol: String) -> Pool {
            info!("[create_pool] Creating pool for asset: {:?}", asset);
            info!("[create_pool] Asset symbol: {:?}", asset_symbol);

            let owner_role = OwnerRole::Fixed(rule!(require(owner_proof.resource_address())));

            //. Sanity checks
            assert!(asset.is_fungible(), "Asset with address {:?} is not fungible", asset);

            //. Create the pool
            let pool = Blueprint::<OneResourcePool>::instantiate(owner_role, pool_manager_role, asset, None);
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
