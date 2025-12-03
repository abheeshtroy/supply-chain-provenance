import React, { useState, useEffect } from 'react'
import { useHistory } from "react-router-dom"
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SupplyChain.json"
import { Tabs, Tab } from 'react-bootstrap';
import './Supply.css';

function Supply() {
    const history = useHistory()
    useEffect(() => {
        loadWeb3();
        loadBlockchaindata();
    }, [])

    const [currentaccount, setCurrentaccount] = useState("");
    const [loader, setloader] = useState(true);
    const [SupplyChain, setSupplyChain] = useState();
    const [MED, setMED] = useState();
    const [MedStage, setMedStage] = useState();
    const [ID, setID] = useState();
    const [transactionLoading, setTransactionLoading] = useState(false);


    const loadWeb3 = async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert(
                "Non-Ethereum browser detected. You should consider trying MetaMask!"
            );
        }
    };
    const loadBlockchaindata = async () => {
        setloader(true);
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        setCurrentaccount(account);
        const networkId = await web3.eth.net.getId();
        const networkData = SupplyChainABI.networks[networkId];
        if (networkData) {
            const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
            setSupplyChain(supplychain);
            var i;
            const medCtr = await supplychain.methods.medicineCtr().call();
            const med = {};
            const medStage = [];
            for (i = 0; i < medCtr; i++) {
                med[i] = await supplychain.methods.MedicineStock(i + 1).call();
                medStage[i] = await supplychain.methods.showStage(i + 1).call();
            }
            setMED(med);
            setMedStage(medStage);
            setloader(false);
        }
        else {
            window.alert('The smart contract is not deployed to current network')
        }
    }
    if (loader) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        )

    }
    const redirect_to_home = () => {
        history.push('/')
    }
    const handlerChangeID = (event) => {
        setID(event.target.value);
    }

    // Helper function to verify transaction status on blockchain
    const verifyTransactionStatus = async (txHash, expectedStage, productId) => {
        try {
            const web3 = window.web3;
            // Wait for transaction to be mined
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Get transaction receipt
            const receipt = await web3.eth.getTransactionReceipt(txHash);
            if (receipt && receipt.status) {
                // Verify the product stage changed
                const networkId = await web3.eth.net.getId();
                const networkData = SupplyChainABI.networks[networkId];
                if (networkData) {
                    const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
                    const currentStage = await supplychain.methods.showStage(productId).call();
                    return currentStage.includes(expectedStage);
                }
            }
            return false;
        } catch (err) {
            console.error("Error verifying transaction:", err);
            return false;
        }
    }

    // Helper function to send transaction with better error handling
    const sendTransactionWithRetry = async (methodCall, maxRetries = 2) => {
        let lastError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Estimate gas first
                const gasEstimate = await methodCall.estimateGas({ from: currentaccount });
                
                // Send transaction with estimated gas + buffer
                const receipt = await methodCall.send({ 
                    from: currentaccount,
                    gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
                });
                
                return { success: true, receipt };
            } catch (err) {
                lastError = err;
                
                // Check if user rejected the transaction
                if (err.code === 4001 || err.message?.includes("User denied") || err.message?.includes("User rejected")) {
                    return { success: false, error: "Transaction rejected by user", userRejected: true };
                }
                
                // Check if it's a revert (smart contract error)
                if (err.message?.includes("revert") || err.code === -32000) {
                    return { success: false, error: err, isRevert: true };
                }
                
                // For Internal JSON-RPC errors, check if transaction might have succeeded
                if (err.code === -32603 || err.message?.includes("Internal JSON-RPC error")) {
                    // If this is the last attempt, check if transaction actually went through
                    if (attempt === maxRetries) {
                        // Try to get the latest transaction hash from the account
                        try {
                            const web3 = window.web3;
                            const txCount = await web3.eth.getTransactionCount(currentaccount);
                            // The transaction might have succeeded, we'll verify later
                            return { success: false, error: err, mightHaveSucceeded: true };
                        } catch (checkErr) {
                            // Can't verify, return error
                            return { success: false, error: err };
                        }
                    }
                    
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
                
                // For other errors, return immediately
                return { success: false, error: err };
            }
        }
        
        return { success: false, error: lastError };
    }
    const handlerSubmitRMSsupply = async (event) => {
        event.preventDefault();
        if (!ID) {
            alert("Please enter a Product ID");
            return;
        }
        setTransactionLoading(true);
        
        const productId = parseInt(ID);
        const result = await sendTransactionWithRetry(SupplyChain.methods.RMSsupply(productId));
        
        if (result.success && result.receipt && result.receipt.status) {
            // Wait a bit for blockchain state to update
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Reload blockchain data
            await loadBlockchaindata();
            
            // Clear the input field
            setID("");
            
            alert("Raw materials supplied successfully! Product moved to Raw Material Supply stage.");
        } else if (result.mightHaveSucceeded) {
            // Transaction might have succeeded despite error
            // Wait and check the blockchain state
            await new Promise(resolve => setTimeout(resolve, 2000));
            await loadBlockchaindata();
            
            // Check if the product stage actually changed
            try {
                const currentStage = await SupplyChain.methods.showStage(productId).call();
                if (currentStage.includes("Raw Material Supply")) {
                    setID("");
                    alert("Raw materials supplied successfully! (Transaction may have taken longer to confirm)");
                } else {
                    throw new Error("Transaction status unclear. Please check the product status and try again if needed.");
                }
            } catch (checkErr) {
                alert("Transaction status unclear. Please refresh the page and check if the product stage changed. If not, please try again.");
            }
        } else if (result.userRejected) {
            alert("Transaction was cancelled.");
        } else {
            // Handle error
            const err = result.error;
            console.error("Transaction error:", err);
            let errorMessage = "An error occurred! ";
            
            if (result.isRevert) {
                errorMessage += "Transaction was reverted. ";
                const errMsg = err.message || "";
                if (errMsg.includes("findRMS")) {
                    errorMessage += "Your account is not registered as a Raw Material Supplier.";
                } else if (errMsg.includes("stage")) {
                    errorMessage += "Product is not in the correct stage (should be 'Init' stage).";
                } else if (errMsg.includes("medicineID")) {
                    errorMessage += "Invalid Product ID.";
                } else {
                    errorMessage += "Make sure your account is registered and the product ID is correct.";
                }
            } else if (err.message) {
                errorMessage += err.message;
            } else {
                errorMessage += "Make sure that your account is registered to continue and the item id is correct.";
            }
            
            alert(errorMessage);
        }
        
        setTransactionLoading(false);
    }
    const handlerSubmitManufacturing = async (event) => {
        event.preventDefault();
        if (!ID) {
            alert("Please enter a Product ID");
            return;
        }
        setTransactionLoading(true);
        
        const productId = parseInt(ID);
        const result = await sendTransactionWithRetry(SupplyChain.methods.Manufacturing(productId));
        
        if (result.success && result.receipt && result.receipt.status) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await loadBlockchaindata();
            setID("");
            alert("Manufacturing completed successfully! Product moved to Manufacturing stage.");
        } else if (result.mightHaveSucceeded) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await loadBlockchaindata();
            
            try {
                const currentStage = await SupplyChain.methods.showStage(productId).call();
                if (currentStage.includes("Manufacturing")) {
                    setID("");
                    alert("Manufacturing completed successfully! (Transaction may have taken longer to confirm)");
                } else {
                    throw new Error("Transaction status unclear.");
                }
            } catch (checkErr) {
                alert("Transaction status unclear. Please refresh the page and check if the product stage changed. If not, please try again.");
            }
        } else if (result.userRejected) {
            alert("Transaction was cancelled.");
        } else {
            const err = result.error;
            console.error("Transaction error:", err);
            let errorMessage = "An error occurred! ";
            
            if (result.isRevert) {
                errorMessage += "Transaction was reverted. ";
                const errMsg = err.message || "";
                if (errMsg.includes("findMAN")) {
                    errorMessage += "Your account is not registered as a Manufacturer.";
                } else if (errMsg.includes("stage")) {
                    errorMessage += "Product is not in the correct stage (should be 'Raw Material Supply' stage).";
                } else if (errMsg.includes("medicineID")) {
                    errorMessage += "Invalid Product ID.";
                } else {
                    errorMessage += "Make sure your account is registered and the product ID is correct.";
                }
            } else if (err.message) {
                errorMessage += err.message;
            } else {
                errorMessage += "Make sure that your account is registered to continue and the item id is correct.";
            }
            
            alert(errorMessage);
        }
        
        setTransactionLoading(false);
    }
    const handlerSubmitDistribute = async (event) => {
        event.preventDefault();
        if (!ID) {
            alert("Please enter a Product ID");
            return;
        }
        setTransactionLoading(true);
        
        const productId = parseInt(ID);
        const result = await sendTransactionWithRetry(SupplyChain.methods.Distribute(productId));
        
        if (result.success && result.receipt && result.receipt.status) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await loadBlockchaindata();
            setID("");
            alert("Distribution completed successfully! Product moved to Distribution stage.");
        } else if (result.mightHaveSucceeded) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await loadBlockchaindata();
            
            try {
                const currentStage = await SupplyChain.methods.showStage(productId).call();
                if (currentStage.includes("Distribution")) {
                    setID("");
                    alert("Distribution completed successfully! (Transaction may have taken longer to confirm)");
                } else {
                    throw new Error("Transaction status unclear.");
                }
            } catch (checkErr) {
                alert("Transaction status unclear. Please refresh the page and check if the product stage changed. If not, please try again.");
            }
        } else if (result.userRejected) {
            alert("Transaction was cancelled.");
        } else {
            const err = result.error;
            console.error("Transaction error:", err);
            let errorMessage = "An error occurred! ";
            
            if (result.isRevert) {
                errorMessage += "Transaction was reverted. ";
                const errMsg = err.message || "";
                if (errMsg.includes("findDIS")) {
                    errorMessage += "Your account is not registered as a Distributor.";
                } else if (errMsg.includes("stage")) {
                    errorMessage += "Product is not in the correct stage (should be 'Manufacture' stage).";
                } else if (errMsg.includes("medicineID")) {
                    errorMessage += "Invalid Product ID.";
                } else {
                    errorMessage += "Make sure your account is registered and the product ID is correct.";
                }
            } else if (err.message) {
                errorMessage += err.message;
            } else {
                errorMessage += "Make sure that your account is registered to continue and the item id is correct.";
            }
            
            alert(errorMessage);
        }
        
        setTransactionLoading(false);
    }
    const handlerSubmitRetail = async (event) => {
        event.preventDefault();
        if (!ID) {
            alert("Please enter a Product ID");
            return;
        }
        setTransactionLoading(true);
        
        const productId = parseInt(ID);
        const result = await sendTransactionWithRetry(SupplyChain.methods.Retail(productId));
        
        if (result.success && result.receipt && result.receipt.status) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await loadBlockchaindata();
            setID("");
            alert("Retail stage completed successfully! Product moved to Retail stage.");
        } else if (result.mightHaveSucceeded) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await loadBlockchaindata();
            
            try {
                const currentStage = await SupplyChain.methods.showStage(productId).call();
                if (currentStage.includes("Retail")) {
                    setID("");
                    alert("Retail stage completed successfully! (Transaction may have taken longer to confirm)");
                } else {
                    throw new Error("Transaction status unclear.");
                }
            } catch (checkErr) {
                alert("Transaction status unclear. Please refresh the page and check if the product stage changed. If not, please try again.");
            }
        } else if (result.userRejected) {
            alert("Transaction was cancelled.");
        } else {
            const err = result.error;
            console.error("Transaction error:", err);
            let errorMessage = "An error occurred! ";
            
            if (result.isRevert) {
                errorMessage += "Transaction was reverted. ";
                const errMsg = err.message || "";
                if (errMsg.includes("findRET")) {
                    errorMessage += "Your account is not registered as a Retailer.";
                } else if (errMsg.includes("stage")) {
                    errorMessage += "Product is not in the correct stage (should be 'Distribution' stage).";
                } else if (errMsg.includes("medicineID")) {
                    errorMessage += "Invalid Product ID.";
                } else {
                    errorMessage += "Make sure your account is registered and the product ID is correct.";
                }
            } else if (err.message) {
                errorMessage += err.message;
            } else {
                errorMessage += "Make sure that your account is registered to continue and the item id is correct.";
            }
            
            alert(errorMessage);
        }
        
        setTransactionLoading(false);
    }
    const handlerSubmitSold = async (event) => {
        event.preventDefault();
        if (!ID) {
            alert("Please enter a Product ID");
            return;
        }
        setTransactionLoading(true);
        
        const productId = parseInt(ID);
        const result = await sendTransactionWithRetry(SupplyChain.methods.sold(productId));
        
        if (result.success && result.receipt && result.receipt.status) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await loadBlockchaindata();
            setID("");
            alert("Product marked as sold successfully!");
        } else if (result.mightHaveSucceeded) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await loadBlockchaindata();
            
            try {
                const currentStage = await SupplyChain.methods.showStage(productId).call();
                if (currentStage.includes("Sold")) {
                    setID("");
                    alert("Product marked as sold successfully! (Transaction may have taken longer to confirm)");
                } else {
                    throw new Error("Transaction status unclear.");
                }
            } catch (checkErr) {
                alert("Transaction status unclear. Please refresh the page and check if the product stage changed. If not, please try again.");
            }
        } else if (result.userRejected) {
            alert("Transaction was cancelled.");
        } else {
            const err = result.error;
            console.error("Transaction error:", err);
            let errorMessage = "An error occurred! ";
            
            if (result.isRevert) {
                errorMessage += "Transaction was reverted. ";
                const errMsg = err.message || "";
                if (errMsg.includes("findRET")) {
                    errorMessage += "Your account is not registered as a Retailer.";
                } else if (errMsg.includes("RETid")) {
                    errorMessage += "You are not the assigned retailer for this product.";
                } else if (errMsg.includes("stage")) {
                    errorMessage += "Product is not in the correct stage (should be 'Retail' stage).";
                } else if (errMsg.includes("medicineID")) {
                    errorMessage += "Invalid Product ID.";
                } else {
                    errorMessage += "Make sure your account is registered and the product ID is correct.";
                }
            } else if (err.message) {
                errorMessage += err.message;
            } else {
                errorMessage += "Make sure that your account is registered to continue and the item id is correct.";
            }
            
            alert(errorMessage);
        }
        
        setTransactionLoading(false);
    }
    return (
        <div className="container mt-4">
        <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Manage Supply Chain</h2>
                <button onClick={redirect_to_home} className="btn btn-outline-danger">Home</button>
            </div>
            <div className="alert alert-info">
                <strong>Current Account Address:</strong> {currentaccount}
            </div>
            <div className="row">
                <div className="col-md-12">
                    <h6 className="mt-3"><b>Supply Chain Flow:</b></h6>
                    <p>Food Order --&gt; Supplier --&gt; Manufacturer --&gt; Distributor --&gt; Retailer --&gt; Consumer</p>
                </div>
            </div>
            <h5>Ordered Foods:</h5>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">Description</th>
                        <th scope="col">Current Stage</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(MED).map(function (key) {
                        return (
                            <tr key={key}>
                                <td>{MED[key].id}</td>
                                <td>{MED[key].name}</td>
                                <td>{MED[key].description}</td>
                                <td>
                                    {MedStage[key] && MedStage[key].replace(/Food Product|med|MED|Med/g, 'Product')}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <div className="row">
                <div className="col-md-12">
                    <Tabs defaultActiveKey="supply" id="uncontrolled-tab-example">
                        <Tab eventKey="supply" title="Supply Raw Materials">
                            <div className="row mt-3">
                                <div className="col-md-12">
                                    <h5 className="mt-3"><b>Step 1: Supply Raw Materials</b> (Only a registered Supplier can perform this step):</h5>
                                    <form onSubmit={handlerSubmitRMSsupply}>
                                        <div className="form-group">
                                            <input 
                                                className="form-control form-control-sm" 
                                                type="text" 
                                                onChange={handlerChangeID} 
                                                value={ID || ""}
                                                placeholder="Enter Product ID" 
                                                required 
                                                disabled={transactionLoading}
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="btn btn-success btn-sm"
                                            disabled={transactionLoading}
                                        >
                                            {transactionLoading ? "Processing..." : "Supply"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </Tab>
                        <Tab eventKey="manufacture" title="Manufacture">
                            <div className="row mt-3">
                                <div className="col-md-12">
                                    <h5 className="mt-3"><b>Step 2: Manufacture</b> (Only a registered Manufacturer can perform this step):</h5>
                                    <form onSubmit={handlerSubmitManufacturing}>
                                        <div className="form-group">
                                            <input 
                                                className="form-control form-control-sm" 
                                                type="text" 
                                                onChange={handlerChangeID} 
                                                value={ID || ""}
                                                placeholder="Enter Product ID" 
                                                required 
                                                disabled={transactionLoading}
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="btn btn-success btn-sm"
                                            disabled={transactionLoading}
                                        >
                                            {transactionLoading ? "Processing..." : "Manufacture"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </Tab>
                        <Tab eventKey="distribute" title="Distribute">
                            <div className="row mt-3">
                                <div className="col-md-12">
                                    <h5 className="mt-3"><b>Step 3: Distribute</b> (Only a registered Distributor can perform this step):</h5>
                                    <form onSubmit={handlerSubmitDistribute}>
                                        <div className="form-group">
                                            <input 
                                                className="form-control form-control-sm" 
                                                type="text" 
                                                onChange={handlerChangeID} 
                                                value={ID || ""}
                                                placeholder="Enter Product ID" 
                                                required 
                                                disabled={transactionLoading}
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="btn btn-success btn-sm"
                                            disabled={transactionLoading}
                                        >
                                            {transactionLoading ? "Processing..." : "Distribute"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </Tab>
                        <Tab eventKey="retail" title="Retail">
                            <div className="row mt-3">
                                <div className="col-md-12">
                                    <h5 className="mt-3"><b>Step 4: Retail</b> (Only a registered Retailer can perform this step):</h5>
                                    <form onSubmit={handlerSubmitRetail}>
                                        <div className="form-group">
                                            <input 
                                                className="form-control form-control-sm" 
                                                type="text" 
                                                onChange={handlerChangeID} 
                                                value={ID || ""}
                                                placeholder="Enter Product ID" 
                                                required 
                                                disabled={transactionLoading}
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="btn btn-success btn-sm"
                                            disabled={transactionLoading}
                                        >
                                            {transactionLoading ? "Processing..." : "Retail"}
                                        </button>
                                    </form>
                                    <h5 className="mt-3"><b>Step 5: Mark as sold</b>(Only a registered Retailer can perform this step):-</h5>
                                    <form onSubmit={handlerSubmitSold}>
                                    <div className="form-group">
                                        <input 
                                            className="form-control form-control-sm" 
                                            type="text" 
                                            onChange={handlerChangeID} 
                                            value={ID || ""}
                                            placeholder="Enter Product ID" 
                                            required 
                                            disabled={transactionLoading}
                                        />
                                    </div>
                                        <button 
                                            type="submit" 
                                            className="btn btn-success btn-sm"
                                            disabled={transactionLoading}
                                        >
                                            {transactionLoading ? "Processing..." : "Sold"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </Tab>
                        {/* Add more tabs for additional steps (if needed) */}
                    </Tabs>
                </div>
            </div>
        </div>
        </div>
    );
}

export default Supply;