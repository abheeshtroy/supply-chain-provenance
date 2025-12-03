// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    //Smart Contract owner will be the person who deploys the contract only he can authorize various roles like retailer, Manufacturer,etc
    address public Owner;

    //note this constructor will be called when smart contract will be deployed on blockchain
    constructor() {
        Owner = msg.sender;
    }

    //Roles (flow of agriculture supply chain)
    // RawMaterialSupplier; //This is where Manufacturer will get raw materials to make food products
    // Manufacturer;  //Various WHO guidelines should be followed by this person
    // Distributor; //This guy distributes the food products to retailers
    // Retailer; //Normal customer buys from the retailer

    //modifier to make sure only the owner is using the function
    modifier onlyByOwner() {
        require(msg.sender == Owner);
        _;
    }

    //stages of a food product in agriculture supply chain
    enum STAGE {
        Init,
        RawMaterialSupply,
        Manufacture,
        Distribution,
        Retail,
        sold
    }
    //using this we are going to track every single food product the owner orders

    //Food Product count
    uint256 public medicineCtr = 0;
    //Raw material supplier count
    uint256 public rmsCtr = 0;
    //Manufacturer count
    uint256 public manCtr = 0;
    //distributor count
    uint256 public disCtr = 0;
    //retailer count
    uint256 public retCtr = 0;

    //To store information about the food product
    struct FoodProduct {
        uint256 id; //unique food product id
        string name; //name of the food product
        string description; //about food product
        uint256 RMSid; //id of the Raw Material supplier for this particular food product
        uint256 MANid; //id of the Manufacturer for this particular food product
        uint256 DISid; //id of the distributor for this particular food product
        uint256 RETid; //id of the retailer for this particular food product
        STAGE stage; //current food product stage
        string ipfsHash; //IPFS hash for storing certificates and environmental data
        uint256 createdAt; //timestamp when product was created
        uint256 lastUpdatedAt; //timestamp of last update
    }

    //To store all the food products on the blockchain
    mapping(uint256 => FoodProduct) public MedicineStock;

    //To show status to client applications
    function showStage(uint256 _medicineID)
        public
        view
        returns (string memory stage)
    {
        require(medicineCtr > 0);
        if (MedicineStock[_medicineID].stage == STAGE.Init)
            return "Food Product Ordered";
        else if (MedicineStock[_medicineID].stage == STAGE.RawMaterialSupply)
            return "Raw Material Supply Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.Manufacture)
            return "Manufacturing Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.Distribution)
            return "Distribution Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.Retail)
            return "Retail Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.sold)
            return "Food Product Sold";
        return ""; // Default return for safety
    }

    //To store information about raw material supplier
    struct rawMaterialSupplier {
        address addr;
        uint256 id; //supplier id
        string name; //Name of the raw material supplier
        string place; //Place the raw material supplier is based in
    }

    //To store all the raw material suppliers on the blockchain
    mapping(uint256 => rawMaterialSupplier) public RMS;

    //To store information about manufacturer
    struct manufacturer {
        address addr;
        uint256 id; //manufacturer id
        string name; //Name of the manufacturer
        string place; //Place the manufacturer is based in
    }

    //To store all the manufacturers on the blockchain
    mapping(uint256 => manufacturer) public MAN;

    //To store information about distributor
    struct distributor {
        address addr;
        uint256 id; //distributor id
        string name; //Name of the distributor
        string place; //Place the distributor is based in
    }

    //To store all the distributors on the blockchain
    mapping(uint256 => distributor) public DIS;

    //To store information about retailer
    struct retailer {
        address addr;
        uint256 id; //retailer id
        string name; //Name of the retailer
        string place; //Place the retailer is based in
    }

    //To store all the retailers on the blockchain
    mapping(uint256 => retailer) public RET;

    //To add raw material suppliers. Only contract owner can add a new raw material supplier
    function addRMS(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        rmsCtr++;
        RMS[rmsCtr] = rawMaterialSupplier(_address, rmsCtr, _name, _place);
    }

    //To add manufacturer. Only contract owner can add a new manufacturer
    function addManufacturer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        manCtr++;
        MAN[manCtr] = manufacturer(_address, manCtr, _name, _place);
    }

    //To add distributor. Only contract owner can add a new distributor
    function addDistributor(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        disCtr++;
        DIS[disCtr] = distributor(_address, disCtr, _name, _place);
    }

    //To add retailer. Only contract owner can add a new retailer
    function addRetailer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        retCtr++;
        RET[retCtr] = retailer(_address, retCtr, _name, _place);
    }

    //To supply raw materials from RMS supplier to the manufacturer
    function RMSsupply(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        uint256 _id = findRMS(msg.sender);
        require(_id > 0);
        require(MedicineStock[_medicineID].stage == STAGE.Init);
        MedicineStock[_medicineID].RMSid = _id;
        MedicineStock[_medicineID].stage = STAGE.RawMaterialSupply;
        MedicineStock[_medicineID].lastUpdatedAt = block.timestamp;
        emit ProductTransferred(_medicineID, STAGE.RawMaterialSupply, msg.sender);
    }

    //To check if RMS is available in the blockchain
    function findRMS(address _address) private view returns (uint256) {
        require(rmsCtr > 0);
        for (uint256 i = 1; i <= rmsCtr; i++) {
            if (RMS[i].addr == _address) return RMS[i].id;
        }
        return 0;
    }

    //To manufacture food product
    function Manufacturing(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        uint256 _id = findMAN(msg.sender);
        require(_id > 0);
        require(MedicineStock[_medicineID].stage == STAGE.RawMaterialSupply);
        MedicineStock[_medicineID].MANid = _id;
        MedicineStock[_medicineID].stage = STAGE.Manufacture;
        MedicineStock[_medicineID].lastUpdatedAt = block.timestamp;
        emit ProductTransferred(_medicineID, STAGE.Manufacture, msg.sender);
    }

    //To check if Manufacturer is available in the blockchain
    function findMAN(address _address) private view returns (uint256) {
        require(manCtr > 0);
        for (uint256 i = 1; i <= manCtr; i++) {
            if (MAN[i].addr == _address) return MAN[i].id;
        }
        return 0;
    }

    //To supply food products from Manufacturer to distributor
    function Distribute(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        uint256 _id = findDIS(msg.sender);
        require(_id > 0);
        require(MedicineStock[_medicineID].stage == STAGE.Manufacture);
        MedicineStock[_medicineID].DISid = _id;
        MedicineStock[_medicineID].stage = STAGE.Distribution;
        MedicineStock[_medicineID].lastUpdatedAt = block.timestamp;
        emit ProductTransferred(_medicineID, STAGE.Distribution, msg.sender);
    }

    //To check if distributor is available in the blockchain
    function findDIS(address _address) private view returns (uint256) {
        require(disCtr > 0);
        for (uint256 i = 1; i <= disCtr; i++) {
            if (DIS[i].addr == _address) return DIS[i].id;
        }
        return 0;
    }

    //To supply food products from distributor to retailer
    function Retail(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        uint256 _id = findRET(msg.sender);
        require(_id > 0);
        require(MedicineStock[_medicineID].stage == STAGE.Distribution);
        MedicineStock[_medicineID].RETid = _id;
        MedicineStock[_medicineID].stage = STAGE.Retail;
        MedicineStock[_medicineID].lastUpdatedAt = block.timestamp;
        emit ProductTransferred(_medicineID, STAGE.Retail, msg.sender);
    }

    //To check if retailer is available in the blockchain
    function findRET(address _address) private view returns (uint256) {
        require(retCtr > 0);
        for (uint256 i = 1; i <= retCtr; i++) {
            if (RET[i].addr == _address) return RET[i].id;
        }
        return 0;
    }

    //To sell food products from retailer to consumer
    function sold(uint256 _medicineID) public {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        uint256 _id = findRET(msg.sender);
        require(_id > 0);
        require(_id == MedicineStock[_medicineID].RETid); //Only correct retailer can mark food product as sold
        require(MedicineStock[_medicineID].stage == STAGE.Retail);
        MedicineStock[_medicineID].stage = STAGE.sold;
        MedicineStock[_medicineID].lastUpdatedAt = block.timestamp;
        emit ProductSold(_medicineID, msg.sender);
        emit ProductTransferred(_medicineID, STAGE.sold, msg.sender);
    }

    // Events for tracking
    event ProductRegistered(uint256 indexed productId, string name, address indexed owner);
    event ProductTransferred(uint256 indexed productId, STAGE newStage, address indexed actor);
    event IPFSHashUpdated(uint256 indexed productId, string ipfsHash);
    event ProductSold(uint256 indexed productId, address indexed retailer);

    // To add new food products to the stock
    function addMedicine(string memory _name, string memory _description)
        public
        onlyByOwner()
    {
        require((rmsCtr > 0) && (manCtr > 0) && (disCtr > 0) && (retCtr > 0));
        medicineCtr++;
        MedicineStock[medicineCtr] = FoodProduct(
            medicineCtr,
            _name,
            _description,
            0,
            0,
            0,
            0,
            STAGE.Init,
            "",
            block.timestamp,
            block.timestamp
        );
        emit ProductRegistered(medicineCtr, _name, msg.sender);
    }

    // Update IPFS hash for a product (for storing certificates, environmental data, etc.)
    function updateIPFSHash(uint256 _medicineID, string memory _ipfsHash)
        public
        onlyByOwner()
    {
        require(_medicineID > 0 && _medicineID <= medicineCtr);
        MedicineStock[_medicineID].ipfsHash = _ipfsHash;
        MedicineStock[_medicineID].lastUpdatedAt = block.timestamp;
        emit IPFSHashUpdated(_medicineID, _ipfsHash);
    }
}
