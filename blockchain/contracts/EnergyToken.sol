// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract EnergyToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    
    uint256 public tokenPrice;
    uint256 public totalEnergyProduced;
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18;
    
    mapping(address => bool) public authorizedProducers;
    mapping(address => uint256) public producerEnergyGenerated;
    
    struct PriceHistory {
        uint256 timestamp;
        uint256 price;
        uint256 totalSupply;
    }
    PriceHistory[] public priceHistory;
    
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event EnergyProduced(address indexed producer, uint256 amount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event ProducerAuthorized(address indexed producer);
    
    modifier onlyAuthorizedProducer() {
        require(authorizedProducers[msg.sender], "Not authorized producer");
        _;
    }
    
    constructor(uint256 _initialPrice) ERC20("Energy Token", "ENERGY") Ownable(msg.sender) {
        tokenPrice = _initialPrice;
        _mint(address(this), 1_000_000 * 10**18);
        
        priceHistory.push(PriceHistory({
            timestamp: block.timestamp,
            price: _initialPrice,
            totalSupply: totalSupply()
        }));
    }
    
    function buyTokens() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ETH to buy tokens");
        
        uint256 tokenAmount = (msg.value * 10**18) / tokenPrice;
        require(tokenAmount > 0, "Insufficient ETH for minimum token");
        require(balanceOf(address(this)) >= tokenAmount, "Insufficient token supply");
        
        _transfer(address(this), msg.sender, tokenAmount);
        
        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
    }
    
    function produceEnergy(uint256 energyAmount) external onlyAuthorizedProducer whenNotPaused {
        require(energyAmount > 0, "Energy amount must be positive");
        require(totalSupply() + energyAmount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(msg.sender, energyAmount);
        totalEnergyProduced += energyAmount;
        producerEnergyGenerated[msg.sender] += energyAmount;
        
        emit EnergyProduced(msg.sender, energyAmount);
    }
    
    function getTokenPriceETH() external view returns (uint256) {
        return tokenPrice;
    }
    
    function calculateCost(uint256 tokenAmount) external view returns (uint256) {
        return (tokenAmount * tokenPrice) / 10**18;
    }
    
    function updatePrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be positive");
        
        uint256 oldPrice = tokenPrice;
        tokenPrice = newPrice;
        
        priceHistory.push(PriceHistory({
            timestamp: block.timestamp,
            price: newPrice,
            totalSupply: totalSupply()
        }));
        
        emit PriceUpdated(oldPrice, newPrice);
    }
    
    function authorizeProducer(address producer) external onlyOwner {
        require(producer != address(0), "Invalid producer address");
        require(!authorizedProducers[producer], "Producer already authorized");
        
        authorizedProducers[producer] = true;
        emit ProducerAuthorized(producer);
    }
    
    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function getContractStats() external view returns (
        uint256 currentPrice,
        uint256 totalSupply_,
        uint256 totalEnergyProduced_,
        uint256 contractETHBalance,
        uint256 contractTokenBalance
    ) {
        return (
            tokenPrice,
            totalSupply(),
            totalEnergyProduced,
            address(this).balance,
            balanceOf(address(this))
        );
    }
}
