/* ------------------ Imports ----------------- */
use ::redroot::redroot_test::*;
use scrypto_test::prelude::*;

/* ---------------- Test Setup ---------------- */
// Test config
const LOG_TX: bool = false;

// Struct to hold account data
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

/// Log transaction with name [func]
fn log_tx(func: &str, tx: &TransactionReceiptV1) {
    if LOG_TX {
        println!("[{}] Transaction Receipt:\n{}\n", func, tx.display(&AddressBech32Encoder::for_simulator()));
    }
}

/// Initialise default state for unit tests
fn setup() -> (
    LedgerSimulator<NoExtension, InMemorySubstateDatabase>, // Ledger simulation
    PackageAddress,                                         // Package
    ComponentAddress,                                       // Redroot
    (Account, Account),                                     // Accounts: Main, User 1
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
            manifest_args!(main_account.addr.clone())
        )
        .deposit_batch(main_account.addr)
        .build();
    let receipt = ledger.execute_manifest(manifest, vec![main_account.nf_global_id()]);

    log_tx("instantise", &receipt);
    receipt.expect_commit_success();

    let component = receipt.expect_commit(true).new_component_addresses()[0];
    let owner_badge = receipt.expect_commit(true).new_resource_addresses()[0];

    // println!("Owner Badge: {:?}", owner_badge);

    // for addr in receipt.expect_commit(true).new_resource_addresses() {
    //     println!("New Resource Address: {:?}", addr);
    //     println!(
    //         "Resource Name: {:?}",
    //         ledger.get_metadata(GlobalAddress::from_metadata_value(addr.to_metadata_entry().unwrap()).unwrap(), "name").unwrap()
    //     );
    // }

    // println!("{:?}", ledger.get_component_balance(main_account.addr, owner_badge));

    //. Return
    (ledger, package_address, component, (main_account, user_account), owner_badge)
}

/* ------------------- Tests ------------------ */
/// Basic test to check that Redroot instantises correctly
#[test]
fn instantisation_test() -> Result<(), RuntimeError> {
    // Deconstruct setup
    let (mut ledger, _, component, (_, _), _) = setup();

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
    // assert_eq!(&resources.len(), &2, "More than 2 resources found; expected RRT, XRD");

    Ok(())
}

/// Tests that a fungible asset can be added when everything is valid
#[test]
fn asset_add_test() -> Result<(), RuntimeError> {
    // Deconstruct setup
    let (mut ledger, _, component, (main_account, _), owner_badge) = setup();

    // Create dummy asset
    let dummy_asset = ledger.create_fungible_resource(dec!(10000), DIVISIBILITY_MAXIMUM, main_account.addr);
    println!("Created Assets:\n- Dummy Asset: {:?}\n", dummy_asset);

    // Valid addition
    #[rustfmt::skip]
    let manifest = ManifestBuilder::new()
        .lock_fee_from_faucet()
        .create_proof_from_account_of_amount(main_account.addr, owner_badge, dec!(1))
        .call_method(
            component,
            "add_asset",
            manifest_args!(dummy_asset)
        )
        .deposit_batch(main_account.addr)
        .build();
    let receipt = ledger.execute_manifest(manifest, vec![main_account.nf_global_id()]);

    log_tx("add_asset:valid", &receipt);
    receipt.expect_commit_success();

    // Test that component has the correct number of resources
    let resources = ledger.get_component_resources(component);

    println!("Resources: {:#?}", resources);
    assert!(&resources.contains_key(&dummy_asset), "Added resource not found");

    Ok(())
}

/// Tests that a fungible asset cannot be added when perms are incorrect
#[test]
fn asset_add_noperm_test() -> Result<(), RuntimeError> {
    // Deconstruct setup
    let (mut ledger, _, component, (main_account, user_account), _) = setup();

    // Create dummy asset
    let dummy_asset = ledger.create_fungible_resource(dec!(10000), DIVISIBILITY_MAXIMUM, main_account.addr);
    println!("Created Assets:\n- Dummy Asset: {:?}\n", dummy_asset);

    // Invalid addition; invalid permission for 'user_account'
    #[rustfmt::skip]
        let manifest = ManifestBuilder::new()
            .lock_fee_from_faucet()
            .call_method(
                component,
                "add_asset",
                manifest_args!(dummy_asset)
            )
            .deposit_batch(user_account.addr)
            .build();
    let receipt = ledger.execute_manifest(manifest, vec![user_account.nf_global_id()]);

    log_tx("add_asset:invalid", &receipt);
    receipt.expect_commit_failure();

    Ok(())
}

/// Tests that a fungible asset can be removed when everything is valid
#[test]
fn asset_remove_test() -> Result<(), RuntimeError> {
    // Deconstruct setup
    let (mut ledger, _, component, (main_account, _), owner_badge) = setup();

    // Create dummy asset
    let dummy_asset = ledger.create_fungible_resource(dec!(10000), DIVISIBILITY_MAXIMUM, main_account.addr);
    println!("Created Assets:\n- Dummy Asset: {:?}\n", dummy_asset);

    //. Add asset
    // Valid addition
    #[rustfmt::skip]
        let manifest = ManifestBuilder::new()
            .lock_fee_from_faucet()
            .create_proof_from_account_of_amount(main_account.addr, owner_badge, dec!(1))
            .call_method(
                component,
                "add_asset",
                manifest_args!(dummy_asset)
            )
            .deposit_batch(main_account.addr)
            .build();
    let receipt = ledger.execute_manifest(manifest, vec![main_account.nf_global_id()]);

    log_tx("add_asset:valid", &receipt);
    receipt.expect_commit_success();

    //. Remove asset
    // Valid removal
    #[rustfmt::skip]
    let manifest = ManifestBuilder::new()
        .lock_fee_from_faucet()
        .create_proof_from_account_of_amount(main_account.addr, owner_badge, dec!(1))
        .call_method(
            component,
            "remove_asset",
            manifest_args!(dummy_asset)
        )
        .deposit_batch(main_account.addr)
        .build();
    let receipt = ledger.execute_manifest(manifest, vec![main_account.nf_global_id()]);

    log_tx("remove_asset", &receipt);
    receipt.expect_commit_success();

    // ! Can't check the asset_list state, or at least I can't find a way to access it for now
    // Test that component has the correct number of resources
    // let resources = ledger.get_component_resources(component);

    // println!("Resources: {:#?}", resources);
    // assert!(!&resources.contains_key(&dummy_asset), "Added resource found after removal");

    Ok(())
}

/// Tests that a fungible asset cannot be removed when perms are incorrect
#[test]
fn asset_remove_noperm_test() -> Result<(), RuntimeError> {
    // Deconstruct setup
    let (mut ledger, _, component, (main_account, user_account), owner_badge) = setup();

    // Create dummy asset
    let dummy_asset = ledger.create_fungible_resource(dec!(10000), DIVISIBILITY_MAXIMUM, main_account.addr);

    // Add asset
    #[rustfmt::skip]
        let manifest = ManifestBuilder::new()
            .lock_fee_from_faucet()
            .create_proof_from_account_of_amount(main_account.addr, owner_badge, dec!(1))
            .call_method(
                component,
                "add_asset",
                manifest_args!(dummy_asset)
            )
            .deposit_batch(main_account.addr)
            .build();
    let receipt = ledger.execute_manifest(manifest, vec![main_account.nf_global_id()]);

    log_tx("add_asset:valid", &receipt);
    receipt.expect_commit_success();

    let resources = ledger.get_component_resources(component);
    assert!(resources.contains_key(&dummy_asset), "Added resource not found");

    // Remove asset with a user who doesn't have the necessary badge
    #[rustfmt::skip]
        let manifest = ManifestBuilder::new()
            .lock_fee_from_faucet()
            .call_method(
                component,
                "remove_asset",
                manifest_args!(dummy_asset)
            )
            .deposit_batch(user_account.addr)
            .build();
    let receipt = ledger.execute_manifest(manifest, vec![user_account.nf_global_id()]);

    log_tx("remove_asset:noperm", &receipt);
    receipt.expect_commit_failure();

    Ok(())
}

/// Tests that the program correctly panics when a fungible asset that doesn't exist is removed
#[test]
fn asset_remove_invalid_test() -> () {
    // Deconstruct setup
    let (mut ledger, _, component, (main_account, _), owner_badge) = setup();

    // Create dummy asset
    let dummy_asset = ledger.create_fungible_resource(dec!(10000), DIVISIBILITY_MAXIMUM, main_account.addr);

    // Invalid removal; 'invalid_asset' not added
    #[rustfmt::skip]
        let manifest = ManifestBuilder::new()
            .lock_fee_from_faucet()
            .create_proof_from_account_of_amount(main_account.addr, owner_badge, dec!(1))
            .call_method(
                component,
                "remove_asset",
                manifest_args!(dummy_asset)
            )
            .deposit_batch(main_account.addr)
            .build();
    let receipt = ledger.execute_manifest(manifest, vec![main_account.nf_global_id()]);

    log_tx("remove_asset:invalid", &receipt);
    receipt.expect_commit_failure();
}
