// Environment variables with fallback values
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const CONTRACT_ADDRESSES = {
  ERC20: process.env.REACT_APP_ERC20_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  ERC721: process.env.REACT_APP_ERC721_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
};

export const NETWORK_CONFIG = {
  CHAIN_ID: parseInt(process.env.REACT_APP_CHAIN_ID || '31337'),
  RPC_URL: process.env.REACT_APP_PROVIDER_URL || 'http://localhost:8545'
};

// Debug function
export const debugEnvironment = () => {
  console.log('🔍 Environment Variables:');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('ERC20 Address:', CONTRACT_ADDRESSES.ERC20);
  console.log('ERC721 Address:', CONTRACT_ADDRESSES.ERC721);
  console.log('Chain ID:', NETWORK_CONFIG.CHAIN_ID);
  console.log('RPC URL:', NETWORK_CONFIG.RPC_URL);
};