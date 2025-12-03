import React, { useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Card } from 'react-bootstrap';
import jsQR from 'jsqr';

function QRScanner() {
  const history = useHistory();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  const startScanning = async () => {
    try {
      setError(null);
      setResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanQRCode();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    
    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setResult(code.data);
          stopScanning();
          const productId = extractProductId(code.data);
          if (productId) {
            history.push(`/track?productId=${productId}`);
          }
        }
      }
      
      if (scanning) {
        requestAnimationFrame(scan);
      }
    };
    
    scan();
  };

  const extractProductId = (qrData) => {
    const match = qrData.match(/(\d+)/);
    return match ? match[1] : qrData;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setResult(code.data);
          const productId = extractProductId(code.data);
          if (productId) {
            history.push(`/track?productId=${productId}`);
          }
        } else {
          setError('No QR code found in the image');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>Scan QR Code to Verify Product</h3>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {result && (
                <Alert variant="success">
                  <strong>QR Code Scanned:</strong> {result}
                </Alert>
              )}
              
              <div className="mb-3">
                {!scanning ? (
                  <Button variant="primary" onClick={startScanning} className="me-2">
                    Start Camera Scanner
                  </Button>
                ) : (
                  <Button variant="danger" onClick={stopScanning}>
                    Stop Scanning
                  </Button>
                )}
                
                <label className="btn btn-secondary ms-2">
                  Upload QR Image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    display: scanning ? 'block' : 'none',
                    border: '2px solid #007bff',
                    borderRadius: '8px'
                  }}
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                {!scanning && (
                  <div style={{
                    width: '100%',
                    paddingTop: '75%',
                    backgroundColor: '#f8f9fa',
                    border: '2px dashed #dee2e6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <p className="text-muted">Camera preview will appear here</p>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <p className="text-muted">
                  <small>
                    Point your camera at a QR code to scan, or upload an image containing a QR code.
                    The QR code should contain a product ID that you can use to track the product's provenance.
                  </small>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default QRScanner;

