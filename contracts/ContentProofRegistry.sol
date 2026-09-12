// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ContentProofRegistry
/// @notice Append-only publication provenance; content stays off-chain.
/// @dev Membership addresses are routing metadata on the specified chain, never called or verified here.
contract ContentProofRegistry {
    struct ContentMetadata {
        address creator;
        uint256 latestVersion;
        uint256 createdAt;
    }

    struct Proof {
        bytes32 contentHash;
        address membershipLock;
        uint256 membershipChainId;
        uint256 version;
        uint256 timestamp;
    }

    uint256 private _lastContentId;
    mapping(uint256 => ContentMetadata) private _contents;
    mapping(uint256 => mapping(uint256 => Proof)) private _proofs;

    error InvalidContentHash();
    error InvalidMembershipLock();
    error InvalidMembershipChainId();
    error ContentNotFound(uint256 contentId);
    error NotContentCreator(uint256 contentId, address caller);
    error VersionNotFound(uint256 contentId, uint256 version);

    event ContentRegistered(
        uint256 indexed contentId,
        address indexed creator,
        address indexed membershipLock,
        bytes32 contentHash,
        uint256 membershipChainId,
        uint256 version,
        uint256 timestamp
    );

    event VersionRegistered(
        uint256 indexed contentId,
        address indexed creator,
        address indexed membershipLock,
        bytes32 contentHash,
        uint256 membershipChainId,
        uint256 version,
        uint256 timestamp
    );

    /// @notice Register a publication owned by the caller with initial version 1.
    /// @param contentHash Nonzero hash of the off-chain content.
    /// @param membershipLock Nonzero membership address on membershipChainId.
    /// @param membershipChainId Nonzero EVM chain ID of the membership contract.
    /// @return contentId Sequential publication ID starting at 1; duplicate hashes are allowed.
    function registerContent(bytes32 contentHash, address membershipLock, uint256 membershipChainId)
        external returns (uint256 contentId)
    {
        _validateProof(contentHash, membershipLock, membershipChainId);
        contentId = ++_lastContentId;
        _contents[contentId] = ContentMetadata(msg.sender, 1, block.timestamp);
        _proofs[contentId][1] = Proof(contentHash, membershipLock, membershipChainId, 1, block.timestamp);
        emit ContentRegistered(contentId, msg.sender, membershipLock, contentHash, membershipChainId, 1, block.timestamp);
    }

    /// @notice Append a proof to an existing publication; only its original creator may do so.
    /// @param contentId Existing publication ID.
    /// @param newContentHash Nonzero hash of the new off-chain content version.
    /// @param membershipLock Nonzero membership address for this version.
    /// @param membershipChainId Nonzero EVM chain ID for this version's membership.
    /// @return version Newly appended version number. Earlier proofs remain unchanged.
    function registerVersion(uint256 contentId, bytes32 newContentHash, address membershipLock, uint256 membershipChainId)
        external returns (uint256 version)
    {
        _requireContent(contentId);
        ContentMetadata storage metadata = _contents[contentId];
        if (metadata.creator != msg.sender) revert NotContentCreator(contentId, msg.sender);
        _validateProof(newContentHash, membershipLock, membershipChainId);
        version = ++metadata.latestVersion;
        _proofs[contentId][version] = Proof(newContentHash, membershipLock, membershipChainId, version, block.timestamp);
        emit VersionRegistered(contentId, msg.sender, membershipLock, newContentHash, membershipChainId, version, block.timestamp);
    }

    /// @notice Return whether a publication ID has been registered; ID zero never exists.
    function contentExists(uint256 contentId) public view returns (bool) {
        return _contents[contentId].creator != address(0);
    }

    /// @notice Return the original creator, latest version number, and creation timestamp.
    /// @dev Reverts with ContentNotFound for an unregistered ID.
    function getContentMetadata(uint256 contentId) external view returns (ContentMetadata memory) {
        _requireContent(contentId);
        return _contents[contentId];
    }

    /// @notice Return an immutable historical proof for a publication and version.
    /// @dev Versions start at 1. Reverts if the publication or version does not exist.
    function getProof(uint256 contentId, uint256 version) external view returns (Proof memory) {
        _requireContent(contentId);
        if (version == 0 || version > _contents[contentId].latestVersion) {
            revert VersionNotFound(contentId, version);
        }
        return _proofs[contentId][version];
    }

    /// @notice Return the latest proof; reverts with ContentNotFound for an unregistered ID.
    function getLatestProof(uint256 contentId) external view returns (Proof memory) {
        _requireContent(contentId);
        return _proofs[contentId][_contents[contentId].latestVersion];
    }

    function _requireContent(uint256 contentId) private view {
        if (!contentExists(contentId)) revert ContentNotFound(contentId);
    }

    function _validateProof(bytes32 contentHash, address membershipLock, uint256 membershipChainId) private pure {
        if (contentHash == bytes32(0)) revert InvalidContentHash();
        if (membershipLock == address(0)) revert InvalidMembershipLock();
        if (membershipChainId == 0) revert InvalidMembershipChainId();
    }
}
