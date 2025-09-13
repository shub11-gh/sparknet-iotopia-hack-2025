import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserProvider } from 'ethers';
import { NETWORK_CONFIG } from '../utils/constants';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState(null);

  const REQUIRED_CHAIN_ID = NETWORK_CONFIG.CHAIN_ID;

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('🦊 Please install MetaMask!\n\nVisit: https://metamask.io/download/');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Requesting MetaMask connection...');
      
      // Force MetaMask popup by requesting permissions
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{
          eth_accounts: {}
        }]
      });
      
      // Now request accounts (this should show if not already connected)
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      console.log('📝 User selected account:', accounts[0]);
      
      const web3Provider = new BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();
      
      console.log('✅ Connected to:', address);
      console.log('🌐 Network:', Number(network.chainId));
      
      // Check network
      if (Number(network.chainId) !== REQUIRED_CHAIN_ID) {
        console.log(`⚠️ Wrong network. Required: ${REQUIRED_CHAIN_ID}, Current: ${Number(network.chainId)}`);
        
        try {
          // Try to switch network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}` }],
          });
          
          // Re-get network info after switch
          const newNetwork = await web3Provider.getNetwork();
          setChainId(Number(newNetwork.chainId));
          
        } catch (switchError) {
          if (switchError.code === 4902) {
            // Network doesn't exist, add it
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}`,
                  chainName: 'Hardhat Local',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                  }
                }]
              });
            } catch (addError) {
              console.error('Failed to add network:', addError);
              alert(`❌ Please manually add Hardhat Local network:\n\nRPC: http://127.0.0.1:8545\nChain ID: ${REQUIRED_CHAIN_ID}`);
              setLoading(false);
              return;
            }
          } else {
            console.error('Failed to switch network:', switchError);
            alert(`⚠️ Please switch to the correct network!\n\nRequired: Chain ID ${REQUIRED_CHAIN_ID}`);
            setLoading(false);
            return;
          }
        }
      }

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setChainId(Number(network.chainId));
      setConnected(true);
      
      console.log('🎉 Wallet connected successfully!');
      
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      
      if (error.code === 4001) {
        alert('🚫 Connection rejected by user');
      } else if (error.code === -32002) {
        alert('🔄 MetaMask is already processing a request. Please check MetaMask.');
      } else {
        alert('❌ Failed to connect wallet: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setConnected(false);
    setChainId(null);
    console.log('🔌 Wallet disconnected');
  };

  // Listen for account/network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        console.log('👤 Accounts changed:', accounts);
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          console.log('👤 Account changed to:', accounts[0]);
        }
      };

      const handleChainChanged = (chainId) => {
        const newChainId = parseInt(chainId, 16);
        setChainId(newChainId);
        console.log('🌐 Network changed to:', newChainId);
        
        if (newChainId !== REQUIRED_CHAIN_ID) {
          alert(`⚠️ Wrong network! Please switch to Chain ID: ${REQUIRED_CHAIN_ID}`);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account, REQUIRED_CHAIN_ID]);

  // DON'T auto-connect - let user click the button
  // This ensures MetaMask popup always shows

  const value = {
    provider,
    signer,
    account,
    connected,
    loading,
    chainId,
    connectWallet,
    disconnectWallet,
    requiredChainId: REQUIRED_CHAIN_ID
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}