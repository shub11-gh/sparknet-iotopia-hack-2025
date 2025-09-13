import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const useCurrency = () => {
  const [ethToInrRate, setEthToInrRate] = useState(200000); // Default rate: 1 ETH = ₹2,00,000
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setLoading(true);
        console.log('💱 Fetching ETH to INR rate...');
        
        const response = await axios.get(`${API_BASE_URL}/currency/eth-inr-rate`);
        
        if (response.data.success) {
          setEthToInrRate(response.data.eth_to_inr_rate);
          setLastUpdated(new Date(response.data.last_updated));
          console.log(`✅ Updated ETH rate: ₹${response.data.eth_to_inr_rate.toLocaleString()}`);
        }
      } catch (error) {
        console.error('❌ Error fetching currency rate:', error);
        // Keep using the default/previous rate
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchRate();
    
    // Update rate every 5 minutes (300,000ms)
    const interval = setInterval(fetchRate, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // Conversion functions
  const ethToInr = (ethAmount) => {
    if (!ethAmount || isNaN(ethAmount)) return 0;
    return ethAmount * ethToInrRate;
  };

  const inrToEth = (inrAmount) => {
    if (!inrAmount || isNaN(inrAmount) || ethToInrRate === 0) return 0;
    return inrAmount / ethToInrRate;
  };

  // Formatting functions
  const formatINR = (amount) => {
    if (!amount || isNaN(amount)) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatETH = (amount) => {
    if (!amount || isNaN(amount)) return '0.000000 ETH';
    return `${parseFloat(amount).toFixed(6)} ETH`;
  };

  // Utility function to format large INR amounts
  const formatINRCompact = (amount) => {
    if (!amount || isNaN(amount)) return '₹0';
    
    if (amount >= 10000000) { // 1 crore
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) { // 1 lakh
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 thousand
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return formatINR(amount);
    }
  };

  return {
    ethToInrRate,
    ethToInr,
    inrToEth,
    formatINR,
    formatETH,
    formatINRCompact,
    loading,
    lastUpdated
  };
};
