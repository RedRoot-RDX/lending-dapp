use std::path::Component;

/* ------------------ Imports ----------------- */
use ::redroot::redroot_test::*;
use scrypto_test::prelude::*;

/* ------------------- Misc. ------------------ */
struct Account {
    public_key: Secp256k1PublicKey,
    private_key: Secp256k1PrivateKey,
    addr: ComponentAddress,
}

impl Account {
    pub fn nf_global_id(&self) -> NonFungibleGlobalId {
        NonFungibleGlobalId::from_public_key(&self.public_key)
    }
}

/// Create default state for unit tests
fn setup() -> (
    LedgerSimulator<NoExtension, InMemorySubstateDatabase>, // Ledger simulation
    PackageAddress,                                         // Package
    ComponentAddress,                                       // Redroot
    (Account, Account),                                     // Main, User 1
    ResourceAddress,                                        // Owner Badge
) {
    //. Simulation Setup
    let mut ledger: LedgerSimulator<NoExtension, InMemorySubstateDatabase> = LedgerSimulatorBuilder::new().build();

    //. Account Setup
    // Main Account
    let (public_key, private_key, account) = ledger.new_allocated_account();
    let main_account = Account { public_key, private_key, addr: account };
    // User 1
    let (public_key, private_key, account) = ledger.new_allocated_account();
    let user_account = Account { public_key, private_key, addr: account };

    //. Package Setup
    let package_address = ledger.compile_and_publish(this_package!()); // Publish package

    // Instantiate component (Redroot)
    #[rustfmt::skip]
    let manifest = ManifestBuilder::new()
        .lock_fee_from_faucet()
        .call_function(
            package_address,
            "Redroot", "instantiate",
            manifest_args!()
        )
        .deposit_batch(main_account.addr)
        .build();
    let receipt = ledger.execute_manifest(manifest, vec![main_account.nf_global_id()]);

    println!("[instantise] Tx Receipt:\n{}\n", receipt.display(&AddressBech32Encoder::for_simulator()));
    receipt.expect_commit_success();

    let component = receipt.expect_commit(true).new_component_addresses()[0];
    let owner_badge = receipt.expect_commit(true).new_resource_addresses()[0];

    println!("Owner Badge: {:?}", owner_badge);

    for addr in receipt.expect_commit(true).new_resource_addresses() {
        println!("New Resource Address: {:?}", addr);
        println!(
            "Resource Name: {:?}",
            ledger.get_metadata(GlobalAddress::from_metadata_value(addr.to_metadata_entry().unwrap()).unwrap(), "name").unwrap()
        );
    }

    //. Return
    (ledger, package_address, component, (main_account, user_account), owner_badge)
}

/* ------------------- Tests ------------------ */
#[test]
fn instantisation_test() -> Result<(), RuntimeError> {
    // Deconstruct setup
    let (mut ledger, package_address, component, (main_account, user_account), owner_badge) = setup();

    return Ok(());

    let resources = ledger.get_component_resources(component);

    // Log all stored resources and vaults
    for (&addr, &amount) in &resources {
        println!(
            "Asset Name: {:?}",
            ledger.get_metadata(GlobalAddress::from_metadata_value(addr.to_metadata_entry().unwrap()).unwrap(), "name").unwrap()
        );
        println!(
            "- Description: {:?}",
            ledger
                .get_metadata(GlobalAddress::from_metadata_value(addr.to_metadata_entry().unwrap()).unwrap(), "description")
                .unwrap()
        );
        println!("- Amount: {:?}", amount);

        println!("Asset Vaults:");
        let vaults = ledger.get_component_vaults(component, addr);
        for vault in vaults {
            println!("- Vault NodeID: {:?}", vault);
            println!("- Vault Balance: {:?}", ledger.inspect_vault_balance(vault).unwrap());
        }
        println!("");
    }

    // Assert only 2 resources created
    assert_eq!(&resources.len(), &2, "More than 2 resources found; expected RRT, XRD");

    Ok(())
}

#[test]
fn add_asset_test() -> Result<(), RuntimeError> {
    // Deconstruct setup
    let (mut ledger, package_address, component, (main_account, user_account), owner_badge) = setup();

    return Ok(());

    // Create dummy asset
    let asset = ledger.create_fungible_resource(dec!(10000), DIVISIBILITY_MAXIMUM, main_account.addr);

    // TODO: Fix owner_badge proof

    // Add an asset
    #[rustfmt::skip]
    let manifest = ManifestBuilder::new()
        .lock_fee_from_faucet()
        .create_proof_from_account_of_amount(main_account.addr, owner_badge, dec!(1))
        .call_method(
            component,
            "add_asset",
            manifest_args!(asset)
        )
        .deposit_batch(main_account.addr)
        .build();
    let receipt = ledger.execute_manifest(manifest, vec![main_account.nf_global_id()]);

    println!("[add_asset] Tx Receipt:\n{}\n", receipt.display(&AddressBech32Encoder::for_simulator()));
    receipt.expect_commit_success();

    // Test that component has the correct number of resources
    let resources = ledger.get_component_resources(component);

    assert!(&resources.contains_key(&asset), "Added resource not found");

    Ok(())
}
