export const CONTENT_PROOF_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "contentHash", type: "bytes32" },
      { internalType: "string", name: "metadataUri", type: "string" },
      { internalType: "address", name: "lockAddress", type: "address" },
      { internalType: "bool", name: "isGated", type: "bool" },
    ],
    name: "registerContent",
    outputs: [{ internalType: "bytes32", name: "contentId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "contentId", type: "bytes32" },
      { internalType: "string", name: "metadataUri", type: "string" },
      { internalType: "address", name: "lockAddress", type: "address" },
      { internalType: "bool", name: "isGated", type: "bool" },
    ],
    name: "updateContent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "contentId", type: "bytes32" }],
    name: "getProof",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "contentHash", type: "bytes32" },
          { internalType: "address", name: "author", type: "address" },
          { internalType: "string", name: "metadataUri", type: "string" },
          { internalType: "address", name: "lockAddress", type: "address" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "bool", name: "isGated", type: "bool" },
        ],
        internalType: "struct ContentProofRegistry.ContentProof",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "author", type: "address" }],
    name: "getContentByAuthor",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllContentIds",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalContent",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const CONTENT_PROOF_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_CONTENT_PROOF_REGISTRY_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export interface ContentProofItem {
  id: string;
  contentHash: string;
  author: string;
  metadataUri: string;
  lockAddress: string;
  createdAt: number;
  isGated: boolean;
}
