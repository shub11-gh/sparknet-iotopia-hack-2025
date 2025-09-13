import React from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function ConnectWallet() {
  const { 
    account, 
    connected, 
    connectWallet, 
    disconnectWallet, 
    loading, 
    chainId, 
    requiredChainId 
  } = useWeb3();

  const isCorrectNetwork = chainId === requiredChainId;

  const handleConnect = async () => {
    console.log('🔄 Connect button clicked - forcing fresh connection');
    await connectWallet();
  };

  if (!connected) {
    return (
      <div className="connect-wallet">
        <button 
          onClick={handleConnect} 
          disabled={loading}
          className="connect-button"
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: loading ? '#ccc' : '#c5c210ff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Connecting...' : '🦊 Connect MetaMask'}
        </button>
        {/* <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Click to connect your MetaMask wallet
        </div> */}
      </div>
    );
  }

  return (
    <div className="wallet-info">
      <div className="wallet-details">
        <span className="account-address" style={{ 
          background: '#2f8d18ff', 
          padding: '8px 12px', 
          borderRadius: '6px',
          fontSize: '14px',
          fontFamily: 'monospace'
        }}>
          Connected: {account ? `${account.substring(0, 6)}...${account.slice(-4)}` : ''}
        </span>
        
        {!isCorrectNetwork && (
          <span className="network-warning" style={{
            background: '#ffe6e6',
            color: '#d63031',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            marginLeft: '8px'
          }}>
            ⚠️ Wrong Network (Chain ID: {chainId})
          </span>
        )}
        
        {isCorrectNetwork && (
          <span className="network-status" style={{
            background: '#e8f5e8',
            color: '#00b894',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            marginLeft: '8px'
          }}>
            ✅ {requiredChainId === 31337 ? 'Hardhat Local' : `Chain ${requiredChainId}`}
          </span>
        )}
      </div>
      
      <button 
        onClick={disconnectWallet} 
        className="disconnect-button"
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Disconnect
      </button>
    </div>
  );
}