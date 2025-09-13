import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const useRealTimeData = () => {
  const [energyData, setEnergyData] = useState({
    readings: [],
    marketData: null,
    timestamp: null
  });
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Attempting to fetch data from backend...');
        
        // Test backend connection first
        const healthResponse = await axios.get('http://localhost:5000/api/health');
        console.log('✅ Backend health check:', healthResponse.data);
        
        // Fetch actual data
        const [readingsResponse, marketResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/readings/current'),
          axios.get('http://localhost:5000/api/market/data')
        ]);
        
        console.log('📊 Readings response:', readingsResponse.data);
        console.log('💰 Market response:', marketResponse.data);
        
        if (readingsResponse.data.success && marketResponse.data.success) {
          setEnergyData({
            readings: readingsResponse.data.readings || [],
            marketData: marketResponse.data.market_data || null,
            timestamp: Date.now()
          });
          setConnected(true);
          console.log('✅ Successfully updated energy data');
        } else {
          console.log('❌ API responses indicate failure');
          setConnected(false);
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data
        });
        setConnected(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Poll every 10 seconds for debugging
    intervalRef.current = setInterval(fetchData, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { energyData, connected };
};
