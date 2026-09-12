// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockPublicLock
 * @dev Mock implementation of the Unlock Protocol PublicLock contract deployed on HashKey Chain.
 * Conforms to the ABI received from the `unlock-hashkey` service.
 */
contract MockPublicLock {
    string private _lockName;
    uint256 private _keyPrice;
    address public lockOwner;

    mapping(address => uint256) private _keyExpirations;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor(string memory name_, uint256 price_) {
        _lockName = name_;
        _keyPrice = price_;
        lockOwner = msg.sender;
    }

    function name() external view returns (string memory) {
        return _lockName;
    }

    function keyPrice() external view returns (uint256) {
        return _keyPrice;
    }

    function getHasValidKey(address user) external view returns (bool) {
        return _keyExpirations[user] > block.timestamp;
    }

    function keyExpirationTimestampFor(address user) external view returns (uint256) {
        return _keyExpirations[user];
    }

    function grantKey(address recipient, uint256 duration) external {
        uint256 currentExpiry = _keyExpirations[recipient];
        uint256 start = currentExpiry > block.timestamp ? currentExpiry : block.timestamp;
        _keyExpirations[recipient] = start + duration;
        emit Transfer(address(0), recipient, 1);
    }

    function purchase(address recipient) external payable returns (uint256) {
        require(msg.value >= _keyPrice, "Insufficient HSK payment");
        uint256 currentExpiry = _keyExpirations[recipient];
        uint256 start = currentExpiry > block.timestamp ? currentExpiry : block.timestamp;
        _keyExpirations[recipient] = start + 30 days;
        emit Transfer(address(0), recipient, 1);
        return 1;
    }

    function expireKey(address user) external {
        _keyExpirations[user] = block.timestamp - 1;
    }
}
