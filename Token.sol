// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LaunchToken {
    string public name;
    string public symbol;
    uint8  public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    address public creator;
    string  public imageUrl;
    string  public description;
    uint256 public createdAt;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _creator,
        string memory _imageUrl,
        string memory _description
    ) {
        name = _name; symbol = _symbol;
        totalSupply = _totalSupply * 10 ** 18;
        creator = _creator; imageUrl = _imageUrl; description = _description;
        createdAt = block.timestamp;
        balanceOf[_creator] = totalSupply;
        emit Transfer(address(0), _creator, totalSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        require(to != address(0), "Transfer to zero address");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(to != address(0), "Transfer to zero address");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}