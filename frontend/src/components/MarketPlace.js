import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useContracts } from '../hooks/useContracts';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { useCurrency } from '../hooks/useCurrency';
import { ethers } from 'ethers';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const Marketplace = () => {
  const { account, connected, loading: walletLoading } = useWeb3();
  const { erc20, connected: contractsConnected } = useContracts();
  const { energyData } = useRealTimeData();
  const { ethToInr, inrToEth, formatINR, formatETH, ethToInrRate } = useCurrency();
  
  const [userTokenBalance, setUserTokenBalance] = useState('0');
  const [userEthBalance, setUserEthBalance] = useState('0');
  const [buyAmount, setBuyAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [showINR, setShowINR] = useState(true);
  const [contractPrice, setContractPrice] = useState('0.001');

  // Get current prices from real-time data
  const currentPriceETH = energyData.marketData?.current_price_eth || contractPrice;
  const currentPriceINR = energyData.marketData?.current_price_inr || ethToInr(parseFloat(currentPriceETH));
  const marketData = energyData.marketData;

  // Fetch balances and contract data
  useEffect(() => {
    const fetchBalances = async () => {
      if (!connected || !contractsConnected || !erc20 || !account) {
        console.log('❌ Not ready to fetch balances:', { connected, contractsConnected, account });
        return;
      }

      try {
        console.log('🔄 Fetching balances for:', account);

        // Get ETH balance
        const provider = erc20.runner.provider;
        const ethBalance = await provider.getBalance(account);
        setUserEthBalance(ethers.formatEther(ethBalance));

        // Get token balance
        const tokenBalance = await erc20.balanceOf(account);
        setUserTokenBalance(ethers.formatEther(tokenBalance));

        // Get contract price
        const price = await erc20.getTokenPriceETH();
        setContractPrice(ethers.formatEther(price));

        console.log('✅ Balances updated:', {
          eth: ethers.formatEther(ethBalance),
          tokens: ethers.formatEther(tokenBalance),
          price: ethers.formatEther(price)
        });

      } catch (error) {
        console.error('❌ Error fetching balances:', error);
      }
    };

    fetchBalances();
    
    // Update balances every 10 seconds
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [connected, contractsConnected, erc20, account]);

  // Fetch analytics summary
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/analytics/summary`);
        if (response.data.success) {
          setAnalytics(response.data.summary);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  // Real blockchain token purchase function
  const handleBuyTokens = async () => {
    if (!buyAmount || !connected || !contractsConnected || !erc20) {
      alert('❌ Please connect your wallet and enter an amount');
      return;
    }

    try {
      setLoading(true);
      
      const amount = parseFloat(buyAmount);
      if (amount <= 0) {
        alert('❌ Please enter a valid amount');
        return;
      }

      console.log('🔄 Starting token purchase...');
      console.log('💰 Amount:', amount, 'tokens');
      console.log('📊 Contract price:', contractPrice, 'ETH per token');

      // Calculate total cost in ETH
      const pricePerToken = parseFloat(contractPrice);
      const totalCostETH = amount * pricePerToken;
      const totalCostWei = ethers.parseEther(totalCostETH.toString());

      console.log('💵 Total cost:', totalCostETH, 'ETH');

      // Check if user has enough ETH
      const ethBalance = parseFloat(userEthBalance);
      if (ethBalance < totalCostETH) {
        alert(`❌ Insufficient ETH balance!\n\nRequired: ${totalCostETH.toFixed(6)} ETH\nAvailable: ${ethBalance.toFixed(6)} ETH`);
        return;
      }

      // Call smart contract buyTokens function
      console.log('🔗 Calling smart contract...');
      const tx = await erc20.buyTokens({
        value: totalCostWei
      });

      console.log('⏳ Transaction sent:', tx.hash);
      alert(`🔄 Transaction sent!\n\nHash: ${tx.hash.substring(0, 20)}...\n\nWaiting for confirmation...`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      // Show success message
      const totalCostINR = ethToInr(totalCostETH);
      alert(`🎉 Purchase Successful!\n\n💰 Purchased: ${amount} kWh tokens\n💵 Cost: ${totalCostETH.toFixed(6)} ETH (${formatINR(totalCostINR)})\n🔗 TX: ${receipt.hash.substring(0, 20)}...`);

      // Reset form and refresh balances
      setBuyAmount('');
      
      // Refresh balances after transaction
      setTimeout(async () => {
        try {
          const provider = erc20.runner.provider;
          const ethBalance = await provider.getBalance(account);
          setUserEthBalance(ethers.formatEther(ethBalance));

          const tokenBalance = await erc20.balanceOf(account);
          setUserTokenBalance(ethers.formatEther(tokenBalance));
        } catch (error) {
          console.error('Error refreshing balances:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      
      let errorMessage = 'Transaction failed: ';
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = '🚫 Transaction cancelled by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = '❌ Insufficient ETH for transaction';
      } else if (error.message.includes('user rejected')) {
        errorMessage = '🚫 Transaction rejected by user';
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    if (!buyAmount) return { eth: 0, inr: 0 };
    const ethCost = parseFloat(buyAmount) * parseFloat(contractPrice);
    const inrCost = ethToInr(ethCost);
    return { eth: ethCost, inr: inrCost };
  };

  const cost = calculateCost();

  // Show connection status
  if (walletLoading) {
    return <div className="marketplace">🔄 Connecting to wallet...</div>;
  }

  if (!connected) {
    return (
      <div className="marketplace">
        <h2>⚡ Energy Token Marketplace</h2>
        <div className="connect-prompt">
          <p>🔗 Please connect your MetaMask wallet to start trading energy tokens</p>
        </div>
      </div>
    );
  }

  if (!contractsConnected) {
    return (
      <div className="marketplace">
        <h2>⚡ Energy Token Marketplace</h2>
        <div className="connect-prompt">
          <p>❌ Smart contracts not available. Please check your network connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h2>⚡ Energy Token Marketplace</h2>
        <div className="currency-toggle">
          <button 
            className={showINR ? 'active' : ''} 
            onClick={() => setShowINR(true)}
          >
            ₹ INR
          </button>
          <button 
            className={!showINR ? 'active' : ''} 
            onClick={() => setShowINR(false)}
          >
            Ξ ETH
          </button>
        </div>
      </div>
      
      <div className="market-info">
        <div className="price-display">
          <h3>💰 Current Price per kWh</h3>
          {showINR ? (
            <div className="price-container">
              <p className="price-main">{formatINR(currentPriceINR)}</p>
              <p className="price-secondary">{formatETH(parseFloat(contractPrice))}</p>
            </div>
          ) : (
            <div className="price-container">
              <p className="price-main">{formatETH(parseFloat(contractPrice))}</p>
              <p className="price-secondary">{formatINR(currentPriceINR)}</p>
            </div>
          )}
          <small>Live blockchain price • 1 ETH = {formatINR(ethToInrRate)}</small>
        </div>
        
        {marketData && (
          <div className="market-stats">
            <h4>📊 Market Overview</h4>
            <div className="stat-grid">
              <div className="stat-item">
                <span>Total Supply:</span>
                <span>{marketData.total_supply_kwh} kWh</span>
              </div>
              <div className="stat-item">
                <span>Demand:</span>
                <span>{marketData.estimated_demand_kwh} kWh</span>
              </div>
              <div className="stat-item">
                <span>Active Producers:</span>
                <span>{marketData.active_producers}/{marketData.total_producers}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="balance-info">
          <h4>💼 Your Wallet</h4>
          <div className="balance-item">
            <span>Energy Tokens:</span>
            <span>{parseFloat(userTokenBalance).toFixed(4)} kWh</span>
          </div>
          <div className="balance-item">
            <span>ETH Balance:</span>
            <span>{formatETH(parseFloat(userEthBalance))} ({formatINR(ethToInr(parseFloat(userEthBalance)))})</span>
          </div>
        </div>
      </div>

      <div className="buy-section">
        <h3>🛒 Buy Energy Tokens</h3>
        <div className="buy-form">
          <input
            type="number"
            placeholder="Amount of kWh tokens"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            min="0"
            step="0.1"
          />
          
          {buyAmount && (
            <div className="cost-breakdown">
              <div className="cost-item">
                <span>💵 Total Cost:</span>
                {showINR ? (
                  <span className="cost-main">{formatINR(cost.inr)}</span>
                ) : (
                  <span className="cost-main">{formatETH(cost.eth)}</span>
                )}
              </div>
              <div className="cost-item secondary">
                <span>Equivalent:</span>
                {showINR ? (
                  <span>{formatETH(cost.eth)}</span>
                ) : (
                  <span>{formatINR(cost.inr)}</span>
                )}
              </div>
              <div className="blockchain-notice">
                🔗 Real blockchain transaction • Gas fees may apply
              </div>
            </div>
          )}
          
          <button 
            onClick={handleBuyTokens}
            disabled={loading || !buyAmount || parseFloat(buyAmount) <= 0}
            className="buy-button"
          >
            {loading ? '⏳ Processing Blockchain Transaction...' : '🚀 Buy Tokens (MetaMask)'}
          </button>
        </div>
      </div>

      {analytics && (
        <div className="market-analytics">
          <h4>📈 Network Statistics</h4>
          <div className="analytics-grid">
            <div className="analytic-item">
              <span>Network Capacity:</span>
              <span>{analytics.total_capacity_kw} kW</span>
            </div>
            <div className="analytic-item">
              <span>Current Production:</span>
              <span>{analytics.current_production_kwh} kWh</span>
            </div>
            <div className="analytic-item">
              <span>Capacity Utilization:</span>
              <span>{analytics.capacity_utilization}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;