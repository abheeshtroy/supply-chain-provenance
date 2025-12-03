import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Web3 from 'web3';
import SupplyChainABI from '../artifacts/SupplyChain.json';
import { uploadToIPFS, uploadJSONToIPFS, getJSONFromIPFS, getIPFSGatewayURL, getFromLocalStorage } from '../services/ipfs';
import { Container, Row, Col, Card, Form, Button, Alert, Table } from 'react-bootstrap';

function EnvironmentalData() {
  const [currentaccount, setCurrentaccount] = useState('');
  const [loader, setLoader] = useState(true);
  const [SupplyChain, setSupplyChain] = useState();
  const [productId, setProductId] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');
  const [environmentalLogs, setEnvironmentalLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadWeb3();
    loadBlockchaindata();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error('User denied account access');
      }
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  };

  const loadBlockchaindata = async () => {
    setLoader(true);
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    setCurrentaccount(account);
    const networkId = await web3.eth.net.getId();
    const networkData = SupplyChainABI.networks[networkId];
    if (networkData) {
      const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
      setSupplyChain(supplychain);
      setLoader(false);
    } else {
      window.alert('The smart contract is not deployed to current network');
      setLoader(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCertificate(file);
    }
  };

  const loadEnvironmentalData = async () => {
    if (!productId) {
      setMessage({ type: 'danger', text: 'Please enter a product ID' });
      return;
    }

    try {
      const product = await SupplyChain.methods.MedicineStock(productId).call();
      const hash = product.ipfsHash;

      if (!hash || hash === '') {
        setMessage({ type: 'info', text: 'No environmental data found for this product' });
        setEnvironmentalLogs([]);
        return;
      }

      setIpfsHash(hash);
      const data = await getJSONFromIPFS(hash);
      
      if (data.logs && Array.isArray(data.logs)) {
        const productIdNum = parseInt(productId);
        const filteredLogs = data.logs.filter(log => {
          const logProductId = typeof log.productId === 'string' ? parseInt(log.productId) : log.productId;
          return logProductId === productIdNum;
        });
        setEnvironmentalLogs(filteredLogs);
      } else {
        const productIdNum = parseInt(productId);
        const logProductId = typeof data.productId === 'string' ? parseInt(data.productId) : data.productId;
        if (logProductId === productIdNum) {
          setEnvironmentalLogs([data]);
        } else {
          setEnvironmentalLogs([]);
        }
      }

      setMessage({ type: 'success', text: 'Environmental data loaded successfully' });
    } catch (error) {
      console.error('Error loading environmental data:', error);
      setMessage({ type: 'danger', text: 'Error loading environmental data: ' + error.message });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const logEntry = {
        productId: parseInt(productId),
        temperature: temperature || null,
        humidity: humidity || null,
        timestamp: timestamp || new Date().toISOString(),
        recordedBy: currentaccount,
        certificate: certificate ? certificate.name : null,
        certificateHash: null
      };

      let existingData = { logs: [] };
      if (ipfsHash) {
        try {
          existingData = await getJSONFromIPFS(ipfsHash);
          if (!existingData.logs) {
            existingData.logs = [];
          }
        } catch (error) {
          console.log('No existing data found, creating new log');
        }
      }

      existingData.logs.push(logEntry);

      if (certificate) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const certHash = await uploadToIPFS(e.target.result);
            logEntry.certificateHash = certHash;
            existingData.logs[existingData.logs.length - 1] = logEntry;
            
            const newHash = await uploadJSONToIPFS(existingData);
            
            await SupplyChain.methods.updateIPFSHash(productId, newHash).send({
              from: currentaccount
            });

            setIpfsHash(newHash);
            const productIdNum = parseInt(productId);
            const filteredLogs = existingData.logs.filter(log => {
              const logProductId = typeof log.productId === 'string' ? parseInt(log.productId) : log.productId;
              return logProductId === productIdNum;
            });
            setEnvironmentalLogs(filteredLogs);
            setMessage({ type: 'success', text: 'Environmental data and certificate uploaded successfully!' });
            setLoading(false);
            
            setTemperature('');
            setHumidity('');
            setTimestamp('');
            setCertificate(null);
          } catch (error) {
            console.error('Error uploading certificate:', error);
            setMessage({ type: 'danger', text: 'Error uploading certificate: ' + error.message });
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(certificate);
      } else {
        const newHash = await uploadJSONToIPFS(existingData);
        
        await SupplyChain.methods.updateIPFSHash(productId, newHash).send({
          from: currentaccount
        });

        setIpfsHash(newHash);
        const productIdNum = parseInt(productId);
        const filteredLogs = existingData.logs.filter(log => {
          const logProductId = typeof log.productId === 'string' ? parseInt(log.productId) : log.productId;
          return logProductId === productIdNum;
        });
        setEnvironmentalLogs(filteredLogs);
        setMessage({ type: 'success', text: 'Environmental data uploaded successfully!' });
        setLoading(false);
        
        setTemperature('');
        setHumidity('');
        setTimestamp('');
      }
    } catch (error) {
      console.error('Error submitting environmental data:', error);
      setMessage({ type: 'danger', text: 'Error: ' + error.message });
      setLoading(false);
    }
  };

  if (loader) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>Environmental Data & Certificates</h3>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-info">
                <strong>Current Account:</strong> {currentaccount}
              </div>

              {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Product ID</Form.Label>
                  <Form.Control
                    type="number"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    placeholder="Enter product ID"
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Temperature (°C)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="e.g., 4.5"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Humidity (%)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        value={humidity}
                        onChange={(e) => setHumidity(e.target.value)}
                        placeholder="e.g., 65.0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Timestamp</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Certificate (Optional)</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  <Form.Text className="text-muted">
                    Upload certificates, quality reports, or other documents
                  </Form.Text>
                </Form.Group>

                <div className="mb-3">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload Environmental Data'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="ms-2"
                    onClick={loadEnvironmentalData}
                    disabled={loading}
                  >
                    Load Existing Data
                  </Button>
                </div>
              </Form>

              {ipfsHash && (
                <div className="mt-3">
                  <details className="border p-2 rounded">
                    <summary className="cursor-pointer text-muted">
                      <small>Technical Details (IPFS Hash)</small>
                    </summary>
                    <div className="mt-2">
                      <p className="mb-1"><strong>IPFS Hash:</strong></p>
                      <code className="small">{ipfsHash}</code>
                      {getIPFSGatewayURL(ipfsHash) ? (
                        <p className="mt-2 mb-0">
                          <a href={getIPFSGatewayURL(ipfsHash)} target="_blank" rel="noopener noreferrer" className="small">
                            View on IPFS Gateway
                          </a>
                        </p>
                      ) : (
                        <p className="text-muted mt-2 mb-0">
                          <small>(Data stored locally for demo - not on IPFS network)</small>
                        </p>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {environmentalLogs.length > 0 && (
                <div className="mt-4">
                  <h5>Environmental Logs</h5>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Temperature (°C)</th>
                        <th>Humidity (%)</th>
                        <th>Recorded By</th>
                        <th>Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {environmentalLogs.map((log, index) => (
                        <tr key={index}>
                          <td>{log.timestamp || 'N/A'}</td>
                          <td>{log.temperature || 'N/A'}</td>
                          <td>{log.humidity || 'N/A'}</td>
                          <td>{log.recordedBy ? log.recordedBy.substring(0, 10) + '...' : 'N/A'}</td>
                          <td>
                            {log.certificateHash && log.certificateHash !== null && log.certificateHash !== '' ? (
                              (() => {
                                const gatewayURL = getIPFSGatewayURL(log.certificateHash);
                                const localData = getFromLocalStorage(log.certificateHash);
                                
                                if (localData && !gatewayURL) {
                                  try {
                                    const dataArray = JSON.parse(localData);
                                    const blob = new Blob([new Uint8Array(dataArray)], { type: 'application/pdf' });
                                    const url = URL.createObjectURL(blob);
                                    return (
                                      <a href={url} download={log.certificate || 'certificate.pdf'} target="_blank" rel="noopener noreferrer">
                                        Download Certificate
                                      </a>
                                    );
                                  } catch (e) {
                                    return <span className="text-muted">Certificate (local storage)</span>;
                                  }
                                } else if (gatewayURL) {
                                  return (
                                    <a href={gatewayURL} target="_blank" rel="noopener noreferrer">
                                      View Certificate
                                    </a>
                                  );
                                } else {
                                  return <span className="text-muted">Certificate unavailable</span>;
                                }
                              })()
                            ) : (
                              log.certificate ? log.certificate : 'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default EnvironmentalData;

