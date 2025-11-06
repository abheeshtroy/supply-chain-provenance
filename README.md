# Supply Chain Provenance on Blockchain

## Description

This project implements a **blockchain-based supply chain provenance system** using Solidity.
It tracks products as they move through a simplified supply chain:

- Producer → Distributor → Retailer → Consumer

The system is designed to demonstrate how blockchain can provide **transparency, traceability,
and trust** in multi-party supply chains, aligning with the CSE 540: Engineering Blockchain
Applications project requirements.

The core logic is implemented in the smart contract:

- `contracts/SupplyChainProvenance.sol`

The contract:

- Manages participant **roles** (Admin, Producer, Distributor, Retailer, Regulator).
- Allows **producers** to register new products on-chain.
- Records **custody transfers** between producer, distributor, and retailer.
- Allows retailers to mark products as **sold** to an end consumer.
- Allows regulators to **verify** products as authentic.
- Stores the current owner, stage, and timestamps for each product.

## Dependencies / Setup Instructions

At this milestone, the project is kept intentionally lightweight.

You will need:

- A modern web browser (Chrome/Firefox/Edge/Brave)
- [Remix IDE](https://remix.ethereum.org/) (browser-based)
- [MetaMask](https://metamask.io/) browser extension (for later deployment)
- Polygon Amoy Testnet (for later milestones; not strictly required for this draft)

There are **no local build tools** required yet (no Truffle/Hardhat).

## How to Use / Deploy (Draft)

> This section is intentionally high-level and will be expanded in later milestones.

1. Open [Remix](https://remix.ethereum.org/) in your browser.
2. Create a new file `SupplyChainProvenance.sol` under a folder named `contracts/`.
3. Copy the contents of `contracts/SupplyChainProvenance.sol` from this repository into Remix.
4. In the **Solidity Compiler** tab:
   - Select compiler version `0.8.20` or any compatible `0.8.x`
   - Click **Compile SupplyChainProvenance.sol**
5. In the **Deploy & Run Transactions** tab:
   - Environment: `Remix VM (Prague)` for quick local testing
   - Deploy the `SupplyChainProvenance` contract.

Example interactions:

- As the deployer (admin), call `setRole` to assign roles:
  - Assign a **Producer** address
  - Assign a **Distributor** address
  - Assign a **Retailer** address
  - Assign a **Regulator** address
- As the **Producer**:
  - Call `registerProduct("Apple Batch A", "Organic apples from Farm X")`
- As the **Producer** and product owner:
  - Call `transferToDistributor(productId, distributorAddress)`
- As the **Distributor**:
  - Call `transferToRetailer(productId, retailerAddress)`
- As the **Retailer**:
  - Call `markAsSold(productId, consumerAddress)`
- As the **Regulator**:
  - Call `verifyProduct(productId)`
- Use `getProduct(productId)` to read the stored details.

Later milestones will:

- Deploy the contract on **Polygon Amoy Testnet** via MetaMask.
- Add a simple frontend / UI.
- Provide a more detailed usage guide and architecture diagrams.

## Draft Contract Overview

**File:** `contracts/SupplyChainProvenance.sol`

Key components:

- `enum Role { None, Admin, Producer, Distributor, Retailer, Regulator }`  
  Maps each address to a single role using `mapping(address => Role) public roles`.

- `enum Stage { Created, AtDistributor, AtRetailer, Sold }`  
  Represents the current stage of a product in the supply chain.

- `struct Product { ... }`  
  Stores product ID, name, description, current owner, stage, verification flag, and timestamps.

- `setRole(address account, Role role)`  
  Admin-only function to assign roles.

- `registerProduct(string name, string description)`  
  Producer-only function to create a new on-chain product and emit `ProductRegistered`.

- `transferToDistributor(uint256 productId, address distributor)`  
  Producer-only, owner-only, moves product to a distributor and updates stage.

- `transferToRetailer(uint256 productId, address retailer)`  
  Distributor-only, owner-only, moves product to a retailer.

- `markAsSold(uint256 productId, address consumer)`  
  Retailer-only, owner-only, marks the product as sold and transfers to a consumer address.

- `verifyProduct(uint256 productId)`  
  Regulator-only, marks the product as verified.

- `getProduct(uint256 productId)`  
  View function to fetch the full `Product` struct by ID.

Events:

- `RoleAssigned`
- `ProductRegistered`
- `ProductTransferred`
- `ProductVerified`

These events enable easy tracking of the full lifecycle via logs or a frontend.
