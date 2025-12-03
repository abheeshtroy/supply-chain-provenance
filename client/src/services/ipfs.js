let ipfsStorage = {};

export const uploadToIPFS = async (data) => {
  try {
    const hash = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    let dataString;
    if (typeof data === 'string') {
      dataString = data;
    } else if (data instanceof ArrayBuffer) {
      dataString = JSON.stringify(Array.from(new Uint8Array(data)));
    } else {
      dataString = JSON.stringify(data);
    }
    
    ipfsStorage[hash] = dataString;
    try {
      localStorage.setItem('ipfs_' + hash, dataString);
    } catch (e) {
      console.warn('Could not store in localStorage:', e);
    }
    
    return hash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

export const uploadJSONToIPFS = async (jsonData) => {
  try {
    const jsonString = JSON.stringify(jsonData);
    const hash = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    ipfsStorage[hash] = jsonString;
    try {
      localStorage.setItem('ipfs_' + hash, jsonString);
    } catch (e) {
      console.warn('Could not store in localStorage:', e);
    }
    
    return hash;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw error;
  }
};

export const getFromIPFS = async (hash) => {
  try {
    let data = null;
    try {
      data = localStorage.getItem('ipfs_' + hash);
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
    
    if (!data) {
      data = ipfsStorage[hash];
    }
    
    if (!data) {
      throw new Error('Data not found for hash: ' + hash);
    }
    
    return data;
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw error;
  }
};

export const getJSONFromIPFS = async (hash) => {
  try {
    const data = await getFromIPFS(hash);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error retrieving JSON from IPFS:', error);
    throw error;
  }
};

export const getIPFSGatewayURL = (hash) => {
  try {
    const data = localStorage.getItem('ipfs_' + hash);
    if (data) {
      return null;
    }
  } catch (e) {
    // localStorage not available
  }
  
  return `https://ipfs.io/ipfs/${hash}`;
};

export const getFromLocalStorage = (hash) => {
  try {
    return localStorage.getItem('ipfs_' + hash);
  } catch (e) {
    return null;
  }
};
