/* ------------------ Imports ----------------- */
use scrypto::prelude::*;
use scrypto_avltree::AvlTree;

/* ----------------- Blueprint ---------------- */
#[blueprint]
mod radish {
    /* ------------ Role Authorization ------------ */
    enable_method_auth! {
        roles {
            owner => updatable_by: [];
            admin => updatable_by: [OWNER];
        },
        methods {
            add_asset => restrict_to: [admin];
            remove_asset => restrict_to: [admin];
        }
    }

    /* -------------- Component Data -------------- */
    struct Radish {
        // Asset Storage
        asset_list: AvlTree<Decimal, ResourceAddress>,
        vaults: KeyValueStore<ResourceAddress, Vault>,
    }

    impl Radish {
        /* -------------- Public Methods -------------- */
        pub fn instantiate() -> (Global<Radish>, Bucket) {
            // Keep track of the number of assets supported by Radish
            let mut _asset_count: Decimal = dec!(-1);
            let mut asset_count = || {
                _asset_count += dec!(1);
                _asset_count
            };

            /* --------------- Authorization -------------- */
            // Component Owner
            let owner_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "Radish Owner Badge", locked;
                    "description" => "Badge representing the owner of the Radish lending platform", locked;
                }})
                .mint_initial_supply(1)
                .into();
            let owner_access_rule: AccessRule = rule!(require(owner_badge.resource_address()));

            // Admin Badge
            let admin_resource_manager: ResourceManager = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name" => "", locked;
                    "description" => "", locked;
                }})
                .create_with_no_initial_supply();
            let admin_access_rule: AccessRule = rule!(require(admin_resource_manager.address()));

            //* Roles
            let component_roles = roles! {
                owner => owner_access_rule.clone();
                admin => admin_access_rule.clone();
            };

            /* ------------ Internal Data Setup ----------- */
            let mut asset_list: AvlTree<Decimal, ResourceAddress> = AvlTree::new();
            let asset_vaults: KeyValueStore<ResourceAddress, Vault> = KeyValueStore::new();

            // Radish
            let radish_bucket: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_MAXIMUM)
                .metadata(metadata! {init {
                    "name"        => "Radish", locked;
                    "symbol"      => "RSH",    locked;
                    "description" => "",       locked;
                }})
                .mint_initial_supply(10000)
                .into();
            let radish_vault: Vault = Vault::with_bucket(radish_bucket);

            asset_list.insert(asset_count(), radish_vault.resource_address());
            asset_vaults.insert(radish_vault.resource_address(), radish_vault);

            // XRD
            let xrd_vault: Vault = Vault::new(XRD);

            asset_list.insert(asset_count(), xrd_vault.resource_address());
            asset_vaults.insert(xrd_vault.resource_address(), xrd_vault);

            /* ----------------- Component ---------------- */
            //* Metadata
            let component_metadata = metadata! {
                roles {
                    metadata_setter         => OWNER;
                    metadata_setter_updater => OWNER;
                    metadata_locker         => OWNER;
                    metadata_locker_updater => rule!(deny_all);
                },
                init {
                    "name"        => "Radish Lending Platform", locked;
                    "description" => "Multi-collateralized lending platform", locked;
                }
            };

            // Instantising the component
            let component_data: Radish = Self {
                asset_list,
                vaults: asset_vaults,
            };

            let component: Global<Radish> = component_data
                .instantiate()
                .prepare_to_globalize(OwnerRole::Fixed(owner_access_rule.clone()))
                .roles(component_roles)
                .metadata(component_metadata)
                .globalize();

            (component, owner_badge)
        }

        /// Adds a (fungible) asset into the asset list and create a corresponding vault
        pub fn add_asset(&mut self, asset: ResourceAddress) {
            // Pre-run Checks
            assert!(!asset.is_fungible(), "Provided asset must be fungible.");

            for (_, list_asset, _) in self.asset_list.range(dec!(0)..self.asset_list_length()) {
                assert!(asset == list_asset, "Cannot add asset {:?}, as it is already added.", asset)
            }

            // Update the asset list and create a vault
            self.asset_list.insert(self.asset_list_length(), asset);
            self.vaults.insert(asset, Vault::new(asset));
        }

        /// Removes a (fungible) asset from the asset list, but does not remove its vault
        ///
        /// ! Can only remove an asset whose vault is empty
        /// ! This function cannot destroy a vault, only removes it from the assets list and thus prevents it from being used
        pub fn remove_asset(&mut self, asset: ResourceAddress) {
            // Pre-run Checks
            assert!(!asset.is_fungible(), "Provided asset must be fungible.");

            let mut found: bool = false;
            let mut index: Decimal = Decimal::MIN;
            for (i, list_asset, _) in self.asset_list.range(dec!(0)..self.asset_list_length()) {
                if asset == list_asset {
                    found = true;
                    index = i;
                    break;
                }
            }

            assert!(
                !found || index == Decimal::MIN,
                "Cannot find asset [{:?}] in the asset list. It is likely not added.",
                asset
            );
            assert!(
                !self.vaults.get_mut(&asset).unwrap().is_empty(),
                "Internal vault for the asset [{:?}] is not empty; cannot delete the asset.",
                asset
            );

            // Remove the asset from the list
            self.asset_list.remove(&index);

            // TODO: find some way to release the funds from the vault; might cause some problems with customers im just sayin
        }

        /* -------------- Private Methods ------------- */
        fn asset_list_length(&self) -> Decimal {
            return Decimal::from(self.asset_list.get_length());
        }
    }
}
