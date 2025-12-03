# AgriChain: Blockchain-Based Food Supply Chain Provenance System

## Description

AgriChain is a **blockchain-based supply chain provenance system** designed for tracking food products from farm to table. The system ensures transparency, traceability, and trust throughout the supply chain by leveraging smart contracts on Ethereum/Polygon and IPFS for off-chain data storage.

### Problem Statement

Food supply chains face challenges with:
- **Lack of transparency**: Consumers cannot verify product origin and handling
- **Food safety concerns**: Difficult to trace contamination sources
- **Fraud prevention**: Counterfeit products and false certifications
- **Regulatory compliance**: Complex documentation requirements

### Solution

AgriChain provides an immutable, decentralized ledger that tracks:
- Product movement through supply chain stages
- Environmental conditions (temperature, humidity) at each stage
- Certificates and quality reports
- Stakeholder information at each stage
- Complete audit trail with timestamps

### Key Features

- **Immutable Product Tracking**: Every product movement is recorded on the blockchain
- **IPFS Integration**: Certificates and environmental data (temperature, humidity) stored off-chain via IPFS
- **QR Code Support**: Generate and scan QR codes for consumer verification
- **Role-Based Access Control**: Secure access for different stakeholders (Raw Material Supplier, Manufacturer, Distributor, Retailer)
- **Environmental Monitoring**: Track temperature and humidity logs throughout the supply chain
- **Complete Audit Trail**: All transactions are recorded with timestamps

### Architecture

The system consists of:

1. **Smart Contract** (`contracts/SupplyChain.sol`): Solidity contract deployed on blockchain
   - Manages roles and permissions
   - Tracks product stages
   - Stores IPFS hashes for off-chain data
   - Emits events for tracking

2. **Frontend** (`client/`): React application with Web3.js integration
   - User interface for all stakeholders
   - Web3.js for blockchain interaction
   - IPFS integration for data storage
   - QR code generation and scanning

3. **IPFS Service**: For storing certificates and environmental data
   - Decentralized storage for large files
   - Content-addressed storage (immutable)
   - Gateway access for retrieval

4. **QR Code System**: Generation and scanning for product verification
   - Generate QR codes with product IDs
   - Scan QR codes to view product history
   - Direct navigation to product tracking

### Supply Chain Flow

```
Raw Material Supplier → Manufacturer → Distributor → Retailer → Consumer
```

Each stage is recorded on the blockchain with:
- Timestamp
- Stakeholder information
- Environmental conditions (optional)
- Certificates (optional)

---

## Dependencies & Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MetaMask** browser extension - [Download](https://metamask.io/)
- **Ganache** (for local development) - [Download](https://trufflesuite.com/ganache/)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/abheeshtroy/supply-chain-provenance.git
cd supply-chain-provenance
git checkout agri-supply-chain
```

### Step 2: Install Backend Dependencies

Install Truffle and other backend dependencies:

```bash
npm install
```

This installs:
- `truffle` - Smart contract development framework
- `web3` - Ethereum JavaScript API
- `@truffle/hdwallet-provider` - Wallet provider for deployment

### Step 3: Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

This installs:
- `react` - Frontend framework
- `web3` - Blockchain interaction
- `ipfs-http-client` - IPFS integration
- `qrcode` & `jsqr` - QR code generation and scanning
- `react-bootstrap` - UI components

### Step 4: Configure IPFS (Optional)

The project uses IPFS for storing off-chain data. By default, it uses localStorage for demo purposes. For production:

**Option 1: Use Web3.Storage (Recommended - Free, No Auth)**
1. Sign up at [web3.storage](https://web3.storage/)
2. Get your API token
3. Update `client/src/services/ipfs.js` to use Web3.Storage

**Option 2: Use Infura IPFS**
1. Create account at [Infura](https://infura.io/)
2. Get project ID and secret
3. Create `.env` file in `client/` directory:
```env
REACT_APP_INFURA_PROJECT_ID=your_project_id
REACT_APP_INFURA_PROJECT_SECRET=your_project_secret
```

**Option 3: Use Local IPFS Node**
```bash
npm install -g ipfs
ipfs init
ipfs daemon
```

Then update `client/src/services/ipfs.js`:
```javascript
const ipfs = create({
  host: 'localhost',
  port: 5001,
  protocol: 'http'
});
```

### Step 5: Start Local Blockchain (Ganache)

1. Download and install [Ganache](https://trufflesuite.com/ganache/)
2. Open Ganache and create a new workspace
3. Note the following:
   - **RPC Server**: Usually `http://127.0.0.1:7545`
   - **Network ID**: Usually `5777` (but Chain ID is `1337`)
   - **Mnemonic**: Copy the 12-word phrase

### Step 6: Configure Truffle

The `truffle-config.js` is already configured for default Ganache setup. Verify the network settings:

```javascript
development: {
  host: "127.0.0.1",
  port: 7545,
  network_id: "*", // Match any network id
}
```

### Step 7: Deploy Smart Contract

```bash
# Compile contracts
npm run compile
# OR
truffle compile

# Deploy to local network
npm run migrate
# OR
truffle migrate
```

**Note**: If you need to redeploy from scratch:
```bash
truffle migrate --reset
```

After deployment:
- Contract address is automatically saved in `client/src/artifacts/SupplyChain.json`
- Note the contract address for reference

### Step 8: Connect MetaMask to Ganache

1. **Add Network in MetaMask**:
   - Open MetaMask
   - Click network dropdown → "Add Network" → "Add a network manually"
   - Enter:
     - **Network Name**: `Agri-Supply-Chain` (or any name)
     - **RPC URL**: `http://127.0.0.1:7545`
     - **Chain ID**: `1337`
     - **Currency Symbol**: `ETH`

2. **Import Account from Ganache**:
   - In Ganache, click the key icon next to an account to copy private key
   - In MetaMask, click account icon → "Import Account"
   - Paste the private key
   - The account should now show ~100 ETH balance

3. **Verify Connection**:
   - Make sure MetaMask is on the "Agri-Supply-Chain" network
   - Check that the account has ETH balance

### Step 9: Run the Frontend

**Development Mode**:
```bash
cd client
npm start
```

The application will open at `http://localhost:3000`

**Production Build**:
```bash
cd client
npm run build
npx serve -s build -l 3000
```

---

## How to Use

### 1. Register Stakeholders

**Navigate to**: "Register" page (`/roles`)

**Steps**:
1. Ensure you're using the **Owner account** (the account that deployed the contract)
2. For each role type, enter:
   - **Ethereum Address**: The MetaMask address of the stakeholder
   - **Name**: Company/Organization name
   - **Place**: Location (city, state, country)
3. Click "Register" for each stakeholder
4. Approve the transaction in MetaMask

**Required Roles**:
- At least 1 Raw Material Supplier
- At least 1 Manufacturer
- At least 1 Distributor
- At least 1 Retailer

**Note**: You must register all roles before adding products.

### 2. Place Order (Add Product)

**Navigate to**: "Place Order" page (`/addproducts`)

**Steps**:
1. Ensure you're using the **Owner account**
2. Enter:
   - **Product Name**: e.g., "Organic Wheat Flour"
   - **Description**: e.g., "Premium organic wheat flour, 5kg bag"
3. Click "Add Product"
4. Approve the transaction in MetaMask
5. Note the **Product ID** (displayed in the table)

### 3. Manage Supply Chain Flow

**Navigate to**: "Manage Supply Chain" page (`/supply`)

The supply chain flow must be followed in order:

#### Step 1: Supply Raw Materials
1. **Switch to Raw Material Supplier account** in MetaMask
2. Click "Supply Raw Materials" tab
3. Enter Product ID
4. Click "Supply"
5. Approve transaction

#### Step 2: Manufacture
1. **Switch to Manufacturer account** in MetaMask
2. Click "Manufacture" tab
3. Enter Product ID
4. Click "Manufacture"
5. Approve transaction

#### Step 3: Distribute
1. **Switch to Distributor account** in MetaMask
2. Click "Distribute" tab
3. Enter Product ID
4. Click "Distribute"
5. Approve transaction

#### Step 4: Retail
1. **Switch to Retailer account** in MetaMask
2. Click "Retail" tab
3. Enter Product ID
4. Click "Retail"
5. Approve transaction

#### Step 5: Mark as Sold
1. **Stay on Retailer account** in MetaMask
2. Click "Retail" tab (or "Mark as Sold" if available)
3. Enter Product ID
4. Click "Mark as Sold"
5. Approve transaction

**Important**: Each stage requires the correct account type. The contract validates that only registered stakeholders can perform their respective actions.

### 4. Track Products

**Navigate to**: "Track Food Items" page (`/track`)

**View All Products**:
- See all registered products in a table
- View current processing stage for each product

**Track Specific Product**:
1. Enter Product ID in the input field
2. Click "Track"
3. View complete supply chain history:
   - Which supplier provided raw materials
   - Which manufacturer processed it
   - Which distributor handled it
   - Which retailer sold it
   - Current stage

**QR Code Scanning**:
- Scan a QR code to automatically view that product's tracking information

### 5. Environmental Data & Certificates

**Navigate to**: "Environmental Data" page (`/environmental`)

**Upload Environmental Data**:
1. Ensure you're using the **Owner account**
2. Enter Product ID
3. Fill in:
   - **Temperature** (°C): e.g., 4.5
   - **Humidity** (%): e.g., 65.0
   - **Timestamp**: Date and time (optional, defaults to now)
   - **Certificate**: Upload PDF/image (optional)
4. Click "Upload Environmental Data"
5. Approve transaction in MetaMask

**View Existing Data**:
1. Enter Product ID
2. Click "Load Existing Data"
3. View all environmental logs for that product:
   - Historical temperature and humidity readings
   - Timestamps
   - Who recorded each entry
   - Download certificates (if uploaded)

**Note**: 
- Each upload adds a new log entry (history is preserved)
- Only logs for the entered Product ID are displayed
- Certificates are stored on IPFS and can be downloaded

### 6. QR Code Generation

**Navigate to**: "QR Generator" page (`/qrcode`)

**Steps**:
1. Enter Product ID
2. Click "Generate QR Code"
3. QR code is displayed
4. Click "Download QR Code" to save as image
5. Print or share the QR code

**Use Case**: 
- Attach QR code to product packaging
- Consumers can scan to verify authenticity and view history

### 7. QR Code Scanning

**Navigate to**: "QR Scanner" page (`/qrscan`)

**Option 1: Camera Scanner**:
1. Click "Start Camera Scanner"
2. Allow camera permissions
3. Point camera at QR code
4. Automatically redirects to product tracking page

**Option 2: Upload Image**:
1. Click "Upload QR Image"
2. Select image file containing QR code
3. Automatically redirects to product tracking page

---

## Deployment

### Local Development

The setup above is for local development using Ganache. This is suitable for:
- Testing and development
- Class demos
- Learning blockchain development

### Deployment to Testnet

#### Polygon Amoy Testnet

1. **Get Testnet Tokens**:
   - Visit [Polygon Faucet](https://faucet.polygon.technology/)
   - Request testnet MATIC tokens

2. **Install HDWalletProvider**:
```bash
npm install @truffle/hdwallet-provider
```

3. **Update `truffle-config.js`**:
```javascript
const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = 'your twelve word mnemonic phrase here';

module.exports = {
  networks: {
    polygon_amoy: {
      provider: () => new HDWalletProvider(mnemonic, `https://rpc-amoy.polygon.technology`),
      network_id: 80002,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  }
};
```

4. **Deploy**:
```bash
truffle migrate --network polygon_amoy
```

5. **Update Frontend**:
   - Contract address is automatically updated in artifacts
   - Update MetaMask to connect to Polygon Amoy testnet
   - Network details:
     - Network Name: `Polygon Amoy`
     - RPC URL: `https://rpc-amoy.polygon.technology`
     - Chain ID: `80002`
     - Currency Symbol: `MATIC`

---

## Testing

Run the test suite:

```bash
npm test
# OR
truffle test
```

The test suite covers:
- Contract deployment
- Role management (add/verify roles)
- Product registration
- Supply chain flow (all stages)
- IPFS hash management
- Event emissions

---

## Project Structure

```
supply-chain-provenance/
├── contracts/
│   ├── SupplyChain.sol          # Main smart contract
│   └── Migrations.sol           # Truffle migrations
├── migrations/
│   ├── 1_initial_migration.js
│   └── 2_deploy_contracts.js
├── test/
│   └── SupplyChain.test.js     # Test suite
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── QR_gen.js        # QR code generator
│   │   │   ├── QR_scanner.js    # QR code scanner
│   │   │   └── EnvironmentalData.js
│   │   ├── services/
│   │   │   └── ipfs.js          # IPFS service
│   │   ├── artifacts/
│   │   │   └── SupplyChain.json # Contract ABI and address
│   │   ├── App.js
│   │   ├── Home.js
│   │   ├── AssignRoles.js
│   │   ├── AddProducts.js
│   │   ├── Supply.js
│   │   └── Track.js
│   └── package.json
├── truffle-config.js
├── package.json
└── README.md
```

---

## Smart Contract Functions

### Role Management (Owner Only)
- `addRMS(address, name, place)` - Add Raw Material Supplier
- `addManufacturer(address, name, place)` - Add Manufacturer
- `addDistributor(address, name, place)` - Add Distributor
- `addRetailer(address, name, place)` - Add Retailer

### Product Management (Owner Only)
- `addMedicine(name, description)` - Register new product
- `updateIPFSHash(productId, ipfsHash)` - Update IPFS hash for product

### Supply Chain Flow (Role-Specific)
- `RMSsupply(productId)` - Move to Raw Material Supply stage (RMS only)
- `Manufacturing(productId)` - Move to Manufacturing stage (Manufacturer only)
- `Distribute(productId)` - Move to Distribution stage (Distributor only)
- `Retail(productId)` - Move to Retail stage (Retailer only)
- `sold(productId)` - Mark product as sold (Retailer only)

### View Functions (Public)
- `MedicineStock(productId)` - Get product details
- `showStage(productId)` - Get current stage as string
- `rmsCtr`, `manCtr`, `disCtr`, `retCtr` - Get role counts

## Events

- `ProductRegistered(uint256 productId, string name, address owner)`
- `ProductTransferred(uint256 productId, STAGE newStage, address actor)`
- `ProductSold(uint256 productId, address retailer)`
- `IPFSHashUpdated(uint256 productId, string ipfsHash)`

---

## Team Members

- **Abheesht Roy**: Smart Contract Development, Documentation
- **Hetavi Mehta**: Backend, Integration
- **Jaykumar Parekh**: IPFS, Data Modeling
- **Samarth Patel**: Frontend, Testing

---

## License

MIT License

---

## References

1. Tian, F. (2016). "An agri-food supply chain traceability system for China based on RFID & blockchain technology"
2. Kamilaris, A., et al. (2019). "The rise of blockchain technology in agriculture and food supply chains"
3. Yiannas, F. (2018). "A new era of food transparency powered by blockchain"
4. Liu, L., et al. (2022). "Improving agricultural product traceability using blockchain and a dual storage model of blockchain+IPFS"
5. Kamble, S. S., et al. (2020). "Achieving sustainable performance in a blockchain-based food supply chain"
