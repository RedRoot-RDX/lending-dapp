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
        },
        methods {
            some => PUBLIC;
        }
    }

    /* -------------- Component Data -------------- */
    struct Radish {
        // Asset Storage
        asset_list: AvlTree<Decimal, ResourceAddress>,
        asset_vaults: KeyValueStore<ResourceAddress, Vault>,
    }

    /* ------------------ Methods ----------------- */
    impl Radish {
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

            // Rules
            let component_roles = roles! {
                owner => OWNER;
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
            // Metadata
            let component_metadata = metadata! {
                roles {
                    metadata_setter         =>  OWNER;
                    metadata_setter_updater =>  OWNER;
                    metadata_locker         =>  OWNER;
                    metadata_locker_updater =>  rule!(deny_all);
                },
                init {
                    "name"        => "Radish Lending Platform", locked;
                    "description" => "Multi-collateralized lending platform", locked;
                }
            };

            // Instantising the component
            let component_data: Radish = Self {
                asset_list,
                asset_vaults,
            };

            let component: Global<Radish> = component_data
                .instantiate()
                .prepare_to_globalize(OwnerRole::Fixed(owner_access_rule.clone()))
                .roles(component_roles)
                .metadata(component_metadata)
                .globalize();

            (component, owner_badge)
        }

        pub fn some(&self) {}
    }
}
