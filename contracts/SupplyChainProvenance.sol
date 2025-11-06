// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Supply Chain Provenance System
/// @notice Tracks products as they move from producer -> distributor -> retailer -> consumer.
contract SupplyChainProvenance {
    // ============ Roles ============

    /// @notice Possible roles for participants in the system.
    enum Role {
        None,
        Admin,
        Producer,
        Distributor,
        Retailer,
        Regulator
    }

    /// @notice Address of the contract admin (initially the deployer).
    address public admin;

    /// @notice Mapping from participant address to their assigned role.
    mapping(address => Role) public roles;

    // ============ Product Lifecycle ============

    /// @notice Stages in the product journey.
    enum Stage {
        Created,
        AtDistributor,
        AtRetailer,
        Sold
    }

    /// @notice Core data stored for each product on-chain.
    struct Product {
        uint256 id;              // Unique numeric ID
        string name;             // Human-readable name
        string description;      // Optional description / metadata
        address currentOwner;    // Address that currently holds custody
        Stage stage;             // Current stage in supply chain
        bool isVerified;         // Set by regulator once verified
        uint256 createdAt;       // Block timestamp when created
        uint256 lastUpdatedAt;   // Block timestamp of last state change
    }

    /// @notice Mapping from productId to Product struct.
    mapping(uint256 => Product) public products;

    /// @notice Next product ID to assign. Increments with each registration.
    uint256 public nextProductId;

    // ============ Events ============

    /// @notice Emitted whenever a role is assigned or changed.
    event RoleAssigned(address indexed account, Role role);

    /// @notice Emitted when a new product is registered by a producer.
    event ProductRegistered(uint256 indexed productId, address indexed producer);

    /// @notice Emitted when ownership / custody of a product changes.
    event ProductTransferred(
        uint256 indexed productId,
        address indexed from,
        address indexed to,
        Stage newStage
    );

    /// @notice Emitted when a regulator verifies a product.
    event ProductVerified(uint256 indexed productId, address indexed regulator);

    // ============ Modifiers ============

    /// @dev Restricts a function to be callable only by the admin.
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    /// @dev Restricts a function to be callable only by a specific role.
    modifier onlyRole(Role role) {
        require(roles[msg.sender] == role, "Incorrect role");
        _;
    }

    /// @dev Ensures that the caller is the current owner of the given product.
    modifier onlyProductOwner(uint256 productId) {
        require(
            products[productId].currentOwner == msg.sender,
            "Not product owner"
        );
        _;
    }

    /// @dev Ensures that the product with the given ID exists.
    modifier productExists(uint256 productId) {
        require(productId < nextProductId, "Product does not exist");
        _;
    }

    // ============ Constructor ============

    /// @notice Deploys the contract and assigns the deployer as the first admin.
    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.Admin;
        emit RoleAssigned(msg.sender, Role.Admin);
    }

    // ============ Role Management ============

    /// @notice Assigns a role to an account.
    /// @dev Only the admin can call this function.
    /// @param account Address of the participant.
    /// @param role Role to assign (Admin, Producer, Distributor, Retailer, Regulator).
    function setRole(address account, Role role) external onlyAdmin {
        roles[account] = role;
        emit RoleAssigned(account, role);
    }

    // ============ Product Functions ============

    /// @notice Registers a new product on the blockchain.
    /// @dev Only callable by an address with Producer role.
    /// @param name Human-readable name of the product.
    /// @param description Short description or metadata for the product.
    /// @return productId The ID assigned to the newly registered product.
    function registerProduct(
        string calldata name,
        string calldata description
    )
        external
        onlyRole(Role.Producer)
        returns (uint256 productId)
    {
        productId = nextProductId;
        nextProductId += 1;

        Product storage p = products[productId];
        p.id = productId;
        p.name = name;
        p.description = description;
        p.currentOwner = msg.sender;
        p.stage = Stage.Created;
        p.isVerified = false;
        p.createdAt = block.timestamp;
        p.lastUpdatedAt = block.timestamp;

        emit ProductRegistered(productId, msg.sender);
    }

    /// @notice Transfers a product from its producer to a distributor.
    /// @dev Caller must be the product owner and a Producer.
    /// @param productId ID of the product to transfer.
    /// @param distributor Address of the distributor (must have Distributor role).
    function transferToDistributor(
        uint256 productId,
        address distributor
    )
        external
        productExists(productId)
        onlyRole(Role.Producer)
        onlyProductOwner(productId)
    {
        require(
            roles[distributor] == Role.Distributor,
            "Target not distributor"
        );

        _transferProduct(productId, distributor, Stage.AtDistributor);
    }

    /// @notice Transfers a product from distributor to retailer.
    /// @dev Caller must be the product owner and a Distributor.
    /// @param productId ID of the product to transfer.
    /// @param retailer Address of the retailer (must have Retailer role).
    function transferToRetailer(
        uint256 productId,
        address retailer
    )
        external
        productExists(productId)
        onlyRole(Role.Distributor)
        onlyProductOwner(productId)
    {
        require(
            roles[retailer] == Role.Retailer,
            "Target not retailer"
        );

        _transferProduct(productId, retailer, Stage.AtRetailer);
    }

    /// @notice Marks a product as sold to a consumer.
    /// @dev Caller must be the product owner and a Retailer.
    /// @param productId ID of the product being sold.
    /// @param consumer Address of the end consumer (can be any address).
    function markAsSold(
        uint256 productId,
        address consumer
    )
        external
        productExists(productId)
        onlyRole(Role.Retailer)
        onlyProductOwner(productId)
    {
        require(consumer != address(0), "Invalid consumer");

        _transferProduct(productId, consumer, Stage.Sold);
    }

    /// @notice Verifies a product as valid / authentic.
    /// @dev Only callable by an address with Regulator role.
    /// @param productId ID of the product to verify.
    function verifyProduct(
        uint256 productId
    )
        external
        productExists(productId)
        onlyRole(Role.Regulator)
    {
        Product storage p = products[productId];
        p.isVerified = true;
        p.lastUpdatedAt = block.timestamp;

        emit ProductVerified(productId, msg.sender);
    }

    // ============ View Functions ============

    /// @notice Returns all stored details for a given product ID.
    /// @param productId ID of the product to fetch.
    /// @return product Full Product struct.
    function getProduct(
        uint256 productId
    )
        external
        view
        productExists(productId)
        returns (Product memory product)
    {
        product = products[productId];
    }

    // ============ Internal Helpers ============

    /// @dev Internal helper to update owner, stage and timestamps, and emit event.
    function _transferProduct(
        uint256 productId,
        address newOwner,
        Stage newStage
    ) internal {
        Product storage p = products[productId];

        address previousOwner = p.currentOwner;
        p.currentOwner = newOwner;
        p.stage = newStage;
        p.lastUpdatedAt = block.timestamp;

        emit ProductTransferred(productId, previousOwner, newOwner, newStage);
    }
}
