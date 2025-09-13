import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { API_BASE_URL } from '../utils/constants';

const ProducerList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { energyData, connected } = useRealTimeData();

  // Fetch device information
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/devices`);
        if (response.data.success) {
          setDevices(response.data.devices);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Combine device info with live readings
  const getEnrichedProducers = () => {
    return devices.map(device => {
      const currentReading = energyData.readings.find(
        reading => reading.device_id === device.id
      );

      return {
        ...device,
        currentReading,
        isOnline: connected && currentReading && currentReading.current_power_kw > 0
      };
    });
  };

  if (loading) {
    return <div className="loading">Loading solar producers...</div>;
  }

  const enrichedProducers = getEnrichedProducers();

  return (
    <div className="producer-list">
      <div className="section-header">
        <h2>🌞 Solar Energy Producers</h2>
        <div className="connection-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Live Data' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      {enrichedProducers.length === 0 ? (
        <p>No producers found</p>
      ) : (
        <div className="producers-grid">
          {enrichedProducers.map((producer) => (
            <div key={producer.id} className="producer-card">
              <div className="producer-header">
                <h3>{producer.id}</h3>
                <span className={`status ${producer.isOnline ? 'online' : 'offline'}`}>
                  {producer.isOnline ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
              
              <div className="producer-details">
                <p><strong>Location:</strong> {producer.location}</p>
                <p><strong>Owner:</strong> {producer.owner.substring(0, 10)}...</p>
                <p><strong>Capacity:</strong> {producer.capacity_kw} kW</p>
                <p><strong>Efficiency:</strong> {(producer.efficiency * 100).toFixed(1)}%</p>
                
                {producer.currentReading && (
                  <div className="live-data">
                    <hr />
                    <p><strong>🔥 Live Power:</strong> {producer.currentReading.current_power_kw} kW</p>
                    <p><strong>⚡ Energy Today:</strong> {producer.currentReading.energy_produced_kwh} kWh</p>
                    <p><strong>🌤️ Weather:</strong> {producer.currentReading.weather_condition}</p>
                    <p><strong>🌡️ Temperature:</strong> {producer.currentReading.temperature_celsius}°C</p>
                    <p><strong>☀️ Sun Intensity:</strong> {(producer.currentReading.sunlight_intensity * 100).toFixed(0)}%</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProducerList;