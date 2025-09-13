import React from 'react';
import ConnectWallet from './ConnectWallet';
import ProducerList from './ProducerList';
import Marketplace from './MarketPlace';
import PriceChart from './PriceChart';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🌞SparkNet - Decentralized Energy Trading Platform</h1>
        <ConnectWallet />
      </header>
      
      <main className="dashboard-content">
        <div className="dashboard-grid">
          <section className="producers-section">
            <ProducerList />
          </section>
          
          <section className="marketplace-section">
            <Marketplace />
          </section>
          
          <section className="analytics-section">
            <PriceChart />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;