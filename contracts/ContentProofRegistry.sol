// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ContentProofRegistry
 * @dev Stores verifiable proofs of content creation and association with Unlock locks on Avalanche.
 */
contract ContentProofRegistry is Ownable {
    struct ContentProof {
        bytes32 contentHash;
        address author;
        string metadataUri;
        address lockAddress;
        uint256 createdAt;
        bool isGated;
    }

    mapping(bytes32 => ContentProof) private _proofs;
    mapping(address => bytes32[]) private _authorContent;
    bytes32[] private _allContentIds;

    event ContentRegistered(
        bytes32 indexed contentId,
        bytes32 indexed contentHash,
        address indexed author,
        address lockAddress,
        string metadataUri,
        uint256 createdAt
    );

    event ContentUpdated(
        bytes32 indexed contentId,
        string metadataUri,
        address lockAddress,
        bool isGated
    );

    error ContentAlreadyExists(bytes32 contentId);
    error ContentNotFound(bytes32 contentId);
    error Unauthorized(address caller);
    error InvalidHash();

    constructor() Ownable(msg.sender) {}

    function registerContent(
        bytes32 contentHash,
        string calldata metadataUri,
        address lockAddress,
        bool isGated
    ) external returns (bytes32 contentId) {
        if (contentHash == bytes32(0)) revert InvalidHash();

        contentId = keccak256(abi.encodePacked(contentHash, msg.sender, block.timestamp));
        if (_proofs[contentId].createdAt != 0) revert ContentAlreadyExists(contentId);

        _proofs[contentId] = ContentProof({
            contentHash: contentHash,
            author: msg.sender,
            metadataUri: metadataUri,
            lockAddress: lockAddress,
            createdAt: block.timestamp,
            isGated: isGated
        });

        _authorContent[msg.sender].push(contentId);
        _allContentIds.push(contentId);

        emit ContentRegistered(
            contentId,
            contentHash,
            msg.sender,
            lockAddress,
            metadataUri,
            block.timestamp
        );
    }

    function updateContent(
        bytes32 contentId,
        string calldata metadataUri,
        address lockAddress,
        bool isGated
    ) external {
        ContentProof storage proof = _proofs[contentId];
        if (proof.createdAt == 0) revert ContentNotFound(contentId);
        if (proof.author != msg.sender && owner() != msg.sender) revert Unauthorized(msg.sender);

        proof.metadataUri = metadataUri;
        proof.lockAddress = lockAddress;
        proof.isGated = isGated;

        emit ContentUpdated(contentId, metadataUri, lockAddress, isGated);
    }

    function getProof(bytes32 contentId) external view returns (ContentProof memory) {
        ContentProof memory proof = _proofs[contentId];
        if (proof.createdAt == 0) revert ContentNotFound(contentId);
        return proof;
    }

    function getContentByAuthor(address author) external view returns (bytes32[] memory) {
        return _authorContent[author];
    }

    function getAllContentIds() external view returns (bytes32[] memory) {
        return _allContentIds;
    }

    function totalContent() external view returns (uint256) {
        return _allContentIds.length;
    }
}
