// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Token.sol";

contract TokenFactory {

    struct TokenInfo {
        address tokenAddress;
        string  name;
        string  symbol;
        uint256 totalSupply;
        address creator;
        string  imageUrl;
        string  description;
        uint256 createdAt;
    }

    address public owner;
    uint256 public launchFee;
    uint256 public tokenCount;

    TokenInfo[] public tokens;
    mapping(address => address[]) public creatorTokens;
    mapping(address => TokenInfo) public tokenDetails;

    event TokenLaunched(
        address indexed tokenAddress,
        address indexed creator,
        string  name,
        string  symbol,
        uint256 totalSupply,
        string  imageUrl,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        launchFee = 0;
    }

    function launchToken(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        string memory _imageUrl,
        string memory _description
    ) external payable returns (address) {
        require(msg.value >= launchFee, "Insufficient fee");
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0 && _totalSupply > 0, "Invalid params");

        LaunchToken newToken = new LaunchToken(
            _name, _symbol, _totalSupply,
            msg.sender, _imageUrl, _description
        );
        address tokenAddr = address(newToken);

        TokenInfo memory info = TokenInfo(
            tokenAddr, _name, _symbol, _totalSupply,
            msg.sender, _imageUrl, _description, block.timestamp
        );
        tokens.push(info);
        tokenDetails[tokenAddr] = info;
        creatorTokens[msg.sender].push(tokenAddr);
        tokenCount++;

        emit TokenLaunched(tokenAddr, msg.sender, _name, _symbol, _totalSupply, _imageUrl, block.timestamp);
        return tokenAddr;
    }

    function getAllTokens() external view returns (TokenInfo[] memory) { return tokens; }

    function getLatestTokens(uint256 count) external view returns (TokenInfo[] memory) {
        uint256 total = tokens.length;
        uint256 length = count > total ? total : count;
        TokenInfo[] memory result = new TokenInfo[](length);
        for (uint256 i = 0; i < length; i++) result[i] = tokens[total - 1 - i];
        return result;
    }

    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }

    function setLaunchFee(uint256 _fee) external onlyOwner { launchFee = _fee; }

    function withdrawFees() external onlyOwner {
        require(address(this).balance > 0, "No fees");
        payable(owner).transfer(address(this).balance);
    }
}