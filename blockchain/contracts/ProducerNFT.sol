// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ProducerNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    
    uint256 private _tokenIdCounter = 1;
    
    struct Producer {
        string location;
        uint256 capacity;
        uint256 efficiency;
        uint256 installationDate;
        string energyType;
        bool isActive;
        uint256 totalEnergyProduced;
        uint256 createdAt;
    }
    
    mapping(uint256 => Producer) public producers;
    mapping(address => uint256[]) public ownerTokens;
    
    uint256 public constant REGISTRATION_FEE = 0.01 ether;
    uint256 public maxProducers = 10000;
    
    event ProducerRegistered(
        uint256 indexed tokenId,
        address indexed owner,
        string location,
        uint256 capacity
    );
    
    constructor() ERC721("Energy Producer NFT", "PRODUCER") Ownable(msg.sender) {}
    
    function registerProducer(
        string memory location,
        uint256 capacity,
        uint256 efficiency,
        string memory energyType,
        string memory _tokenURI
    ) external payable nonReentrant {
        require(msg.value >= REGISTRATION_FEE, "Insufficient registration fee");
        require(capacity > 0, "Capacity must be positive");
        require(efficiency > 0 && efficiency <= 100, "Invalid efficiency");
        require(bytes(location).length > 0, "Location required");
        require(_tokenIdCounter <= maxProducers, "Max producers reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        producers[tokenId] = Producer({
            location: location,
            capacity: capacity,
            efficiency: efficiency,
            installationDate: block.timestamp,
            energyType: energyType,
            isActive: true,
            totalEnergyProduced: 0,
            createdAt: block.timestamp
        });
        
        ownerTokens[msg.sender].push(tokenId);
        
        emit ProducerRegistered(tokenId, msg.sender, location, capacity);
    }
    
    function getProducer(uint256 tokenId) external view returns (Producer memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return producers[tokenId];
    }
    
    function getOwnerTokens(address owner) external view returns (uint256[] memory) {
        return ownerTokens[owner];
    }
    
    function totalProducers() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
