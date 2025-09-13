import { useMemo } from 'react';
import { Contract } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESSES, debugEnvironment } from '../utils/constants';

// Contract ABIs
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function buyTokens() payable",
  "function getTokenPriceETH() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address, uint256) returns (bool)",
  "function getContractStats() view returns (uint256, uint256, uint256, uint256, uint256)",
  "function authorizedProducers(address) view returns (bool)",
  "event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost)"
];

const ERC721_ABI = [
  "function ownerOf(uint256) view returns (address)",
  "function totalProducers() view returns (uint256)", 
  "function getProducer(uint256) view returns (tuple(string location, uint256 capacity, uint256 efficiency, uint256 installationDate, string energyType, bool isActive, uint256 totalEnergyProduced, uint256 createdAt))",
  "function registerProducer(string, uint256, uint256, string, string) payable",
  "function getOwnerTokens(address) view returns (uint256[])",
  "function balanceOf(address) view returns (uint256)",
  "event ProducerRegistered(uint256 indexed tokenId, address indexed owner, string location, uint256 capacity)"
];

export const useContracts = () => {
  const { provider, signer, connected } = useWeb3();

  return useMemo(() => {
    // Debug environment variables
    debugEnvironment();

    if (!provider) {
      console.log('❌ No provider available');
      return { connected: false };
    }

    if (!CONTRACT_ADDRESSES.ERC20 || !CONTRACT_ADDRESSES.ERC721) {
      console.error('❌ Contract addresses not configured');
      console.error('ERC20:', CONTRACT_ADDRESSES.ERC20);
      console.error('ERC721:', CONTRACT_ADDRESSES.ERC721);
      return { connected: false };
    }

    try {
      const contractProvider = signer || provider;

      console.log('🔗 Initializing contracts...');
      console.log('📊 ERC20 Address:', CONTRACT_ADDRESSES.ERC20);
      console.log('🏠 ERC721 Address:', CONTRACT_ADDRESSES.ERC721);

      const erc20Contract = new Contract(
        CONTRACT_ADDRESSES.ERC20,
        ERC20_ABI,
        contractProvider
      );

      const erc721Contract = new Contract(
        CONTRACT_ADDRESSES.ERC721,
        ERC721_ABI,
        contractProvider
      );

      console.log('✅ Contracts initialized successfully');

      return {
        erc20: erc20Contract,
        erc721: erc721Contract,
        connected: true
      };
    } catch (error) {
      console.error('❌ Error initializing contracts:', error);
      return { connected: false };
    }
  }, [provider, signer, connected]);
};
