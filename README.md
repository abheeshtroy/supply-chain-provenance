# AgriChain: Blockchain-Based Food Supply Chain Provenance System

AgriChain is a **blockchain-based supply chain provenance system** designed to track food products from farm to table. It ensures transparency, traceability, and trust across the entire supply chain by using Ethereum/Polygon smart contracts, IPFS for decentralized storage, and QR codes for consumer verification.

## Problem Statement

Modern food supply chains face challenges such as:
- Lack of transparency around sourcing  
- Difficulty in tracing contamination  
- Counterfeit or mislabelled food products  
- Fragmented and unreliable data across stakeholders  
- Regulatory compliance burdens  

## Solution

AgriChain creates a **tamper-proof, decentralized audit trail** of every product movement and associated environmental or certification data.

The system supports:
- Immutable records of product movement  
- Environmental condition tracking (temperature, humidity)  
- Off-chain storage of certificates via IPFS  
- QR codes for consumer-level traceability  
- Fine-grained role-based access control  
- A complete visual frontend interface  

## Key Features

- **Blockchain-backed product lifecycle tracking**  
- **IPFS integration** for temperature logs, certificates, and metadata  
- **QR code generation and scanning** for traceability  
- **React + Web3.js frontend** for stakeholder interaction  
- **Role-based permissions** for RMS, Manufacturer, Distributor, Retailer  
- **Environmental monitoring** with timestamped logs  
- **Full product history view** through UI or QR code  

## System Architecture

### Smart Contract — `contracts/SupplyChain.sol`
Responsible for:
- Stakeholder registration  
- Product creation & lifecycle transitions  
- Storing IPFS hashes  
- Emitting events for frontend updates  
- Role-based access control enforcement  

### Frontend — `client/`
A full React interface with:
- MetaMask integration  
- QR code generation & scanning  
- IPFS upload & retrieval  
- Product lifecycle management  
- Environmental data dashboard  

### IPFS Service — `client/src/services/ipfs.js`
Used to store:
- Certificates  
- Temperature/Humidity logs  
- Additional product metadata  

### QR Code System
- Each product generates a QR code  
- Scanning leads to the product’s tracking page  

## Supply Chain Flow

Raw Material Supplier → Manufacturer → Distributor → Retailer → Consumer

Every transition is immutably recorded with:
- Timestamp  
- Actor identity  
- Optional IPFS metadata  
- Environmental logs  

## Setup & Installation

### 1. Clone the Repository

git clone https://github.com/abheeshtroy/supply-chain-provenance.git
cd supply-chain-provenance
git checkout agri-supply-chain

shell
Copy code

### 2. Install Backend Dependencies

npm install

shell
Copy code

### 3. Install Frontend Dependencies

cd client
npm install
cd ..

markdown
Copy code

## IPFS Configuration (Optional)

### Web3.Storage  
Update `client/src/services/ipfs.js` with your API token.

### Infura IPFS  
Add `.env` inside `client`:

REACT_APP_INFURA_PROJECT_ID=xxx
REACT_APP_INFURA_PROJECT_SECRET=yyy

yaml
Copy code

### Local IPFS Node  
Run:

ipfs daemon

sql
Copy code

Then update IPFS config.

## Local Blockchain (Ganache)

Open Ganache → create workspace → use RPC:

http://127.0.0.1:7545

shell
Copy code

## Deploy Smart Contracts

truffle compile
truffle migrate --reset

css
Copy code

Artifacts saved to:

client/src/artifacts/SupplyChain.json

yaml
Copy code

## Connect MetaMask to Ganache

Network:
- RPC: http://127.0.0.1:7545  
- Chain ID: 1337  
- Currency: ETH  

Import accounts via private keys from Ganache.

## Run Frontend

cd client
npm start

markdown
Copy code

Opens `http://localhost:3000/`

## How to Use

### Register Stakeholders
Register:
- Raw Material Supplier  
- Manufacturer  
- Distributor  
- Retailer  

The Owner performs all registrations.

### Add Products  
Add product name + description.

### Move Product Through Supply Chain

Stages (enforced by smart contract):
1. RMS → supply  
2. Manufacturer → manufacture  
3. Distributor → distribute  
4. Retailer → retail  
5. Retailer → sold  

### Track Product

Enter Product ID to view:
- Full lifecycle  
- Timestamps  
- Actor details  
- IPFS logs  
- QR code  

### Environmental Data Logging

Upload:
- Temperature  
- Humidity  
- Certificate (PDF/image → IPFS)  

History is fully preserved.

## Testing

truffle test

markdown
Copy code

Tests include:
- Role assignment  
- Product creation  
- Lifecycle transitions  
- Event emissions  

## Project Structure

supply-chain-provenance/
├── contracts/
│ ├── SupplyChain.sol
│ └── Migrations.sol
├── migrations/
├── test/
│ └── SupplyChain.test.js
├── client/
│ ├── src/
│ │ ├── components/
│ │ ├── services/ipfs.js
│ │ ├── artifacts/SupplyChain.json
│ │ ├── AddProducts.js
│ │ ├── Supply.js
│ │ ├── Track.js
│ │ └── App.js
└── truffle-config.js

markdown
Copy code

## Smart Contract API

### Role Functions (Owner Only)
- addRMS(address, name, place)  
- addManufacturer(address, name, place)  
- addDistributor(address, name, place)  
- addRetailer(address, name, place)  

### Product Functions
- addMedicine(name, description)  
- updateIPFSHash(productId, ipfsHash)  

### Lifecycle Functions
- RMSsupply(productId)  
- Manufacturing(productId)  
- Distribute(productId)  
- Retail(productId)  
- sold(productId)  

### Public View
- MedicineStock(productId)  
- showStage(productId)  

## Events

- ProductRegistered  
- ProductTransferred  
- ProductSold  
- IPFSHashUpdated  

## Team

- **Abheesht Roy** — Smart Contract Dev, Documentation  
- **Hetavi Mehta** — Backend + Integration  
- **Jaykumar Parekh** — IPFS + Data Management  
- **Samarth Patel** — Frontend + Testing  

## References

1. Tian, F. (2016). "An agri-food supply chain traceability system for China based on RFID & blockchain technology"  
2. Kamilaris, A., et al. (2019). "The rise of blockchain technology in agriculture and food supply chains"  
3. Yiannas, F. (2018). "A new era of food transparency powered by blockchain"  
4. Liu, L., et al. (2022). "Improving agricultural product traceability using blockchain and a dual storage model of blockchain+IPFS"  
5. Kamble, S. S., et al. (2020). "Achieving sustainable performance in a blockchain-based food supply chain"