import React from 'react';
import { Web3Provider } from './context/Web3Context';
import Dashboard from './components/Dashboard';
import './styles/Dashboard.css';

function App() {
  return (
    <Web3Provider>
      <div className="App">
        <Dashboard />
      </div>
    </Web3Provider>
  );
}

export default App;