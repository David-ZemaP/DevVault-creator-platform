export const CONTENT_PROOF_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "contentHash", type: "bytes32" },
      { internalType: "address", name: "membershipLock", type: "address" },
      { internalType: "uint256", name: "membershipChainId", type: "uint256" },
    ],
    name: "registerContent",
    outputs: [{ internalType: "uint256", name: "contentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "bytes32", name: "newContentHash", type: "bytes32" },
      { internalType: "address", name: "membershipLock", type: "address" },
      { internalType: "uint256", name: "membershipChainId", type: "uint256" },
    ],
    name: "registerVersion",
    outputs: [{ internalType: "uint256", name: "version", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "contentId", type: "uint256" }],
    name: "contentExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "contentId", type: "uint256" }],
    name: "getContentMetadata",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "uint256", name: "latestVersion", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
        ],
        internalType: "struct ContentProofRegistry.ContentMetadata",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "contentId", type: "uint256" },
      { internalType: "uint256", name: "version", type: "uint256" },
    ],
    name: "getProof",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "contentHash", type: "bytes32" },
          { internalType: "address", name: "membershipLock", type: "address" },
          { internalType: "uint256", name: "membershipChainId", type: "uint256" },
          { internalType: "uint256", name: "version", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct ContentProofRegistry.Proof",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "contentId", type: "uint256" }],
    name: "getLatestProof",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "contentHash", type: "bytes32" },
          { internalType: "address", name: "membershipLock", type: "address" },
          { internalType: "uint256", name: "membershipChainId", type: "uint256" },
          { internalType: "uint256", name: "version", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct ContentProofRegistry.Proof",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: true, internalType: "address", name: "membershipLock", type: "address" },
      { indexed: false, internalType: "bytes32", name: "contentHash", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "membershipChainId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "version", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ContentRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "contentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: true, internalType: "address", name: "membershipLock", type: "address" },
      { indexed: false, internalType: "bytes32", name: "contentHash", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "membershipChainId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "version", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "VersionRegistered",
    type: "event",
  },
] as const;

export const CONTENT_PROOF_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_CONTENT_PROOF_REGISTRY_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export interface ContentMetadataItem {
  creator: string;
  latestVersion: bigint;
  createdAt: bigint;
}

export interface ContentProofItem {
  contentHash: string;
  membershipLock: string;
  membershipChainId: bigint;
  version: bigint;
  timestamp: bigint;
}
