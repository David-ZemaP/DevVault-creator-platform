export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "DevVault Creator Platform API",
    version: "1.0.0",
    description:
      "Decentralized content creator platform with token gating on HashKey Chain (HSK) and cryptographic content proofs on Avalanche Fuji.",
    contact: {
      name: "DevVault Team",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Current environment API server",
    },
    {
      url: "http://localhost:3000/api",
      description: "Local development server",
    },
  ],
  tags: [
    {
      name: "Publications",
      description: "Content management, provenance proofs on Fuji, and HSK token-gated access",
    },
    {
      name: "Users",
      description: "Creator and subscriber Web3 wallet profiles",
    },
  ],
  paths: {
    "/publications": {
      get: {
        tags: ["Publications"],
        summary: "List all publications",
        description: "Returns all publications ordered by creation date, optionally filtered by creator wallet address.",
        parameters: [
          {
            name: "creatorWallet",
            in: "query",
            required: false,
            schema: {
              type: "string",
              example: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
            },
            description: "Filter publications by creator wallet address",
          },
        ],
        responses: {
          200: {
            description: "List of publications retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    publications: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/PublicationRecord",
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Publications"],
        summary: "Create a new publication",
        description:
          "Stores a new publication with cryptographic proof hash (anchored on Fuji) and optional Unlock Protocol lockAddress (on HSK).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreatePublicationInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Publication created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    publication: {
                      $ref: "#/components/schemas/PublicationRecord",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing required fields or invalid JSON payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          500: {
            description: "Failed to create publication",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/publications/{id}": {
      get: {
        tags: ["Publications"],
        summary: "Get publication by ID",
        description: "Retrieves a single publication record by its unique ID or content proof commitment hash.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "0xabc1230000000000000000000000000000000000000000000000000000000001",
            },
            description: "Unique publication ID or proof identifier",
          },
        ],
        responses: {
          200: {
            description: "Publication found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    publication: {
                      $ref: "#/components/schemas/PublicationRecord",
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Publication not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/users": {
      post: {
        tags: ["Users"],
        summary: "Upsert user profile",
        description: "Creates or updates a user profile associated with a Web3 wallet address.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateUserInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "User upserted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      $ref: "#/components/schemas/UserRecord",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing required wallet address",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/users/{wallet}": {
      get: {
        tags: ["Users"],
        summary: "Get user profile by wallet address",
        description: "Fetches user profile information for a specified EVM wallet address.",
        parameters: [
          {
            name: "wallet",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
            },
            description: "EVM wallet address of the user",
          },
        ],
        responses: {
          200: {
            description: "User profile found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      $ref: "#/components/schemas/UserRecord",
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      PublicationRecord: {
        type: "object",
        required: ["id", "creatorWallet", "title", "preview", "contentHash", "version", "createdAt", "author", "isGated"],
        properties: {
          id: {
            type: "string",
            example: "0xabc1230000000000000000000000000000000000000000000000000000000001",
            description: "Unique publication identifier",
          },
          creatorWallet: {
            type: "string",
            example: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
            description: "Author's EVM wallet address",
          },
          title: {
            type: "string",
            example: "Building High-Throughput Subnets on Avalanche",
          },
          description: {
            type: "string",
            nullable: true,
            example: "A deep architectural dive into customizing EVM execution runtimes",
          },
          preview: {
            type: "string",
            example: "Avalanche Subnets allow anyone to launch purpose-built blockchains...",
          },
          premiumContent: {
            type: "string",
            nullable: true,
            description: "Protected content decrypted or gated by Unlock Protocol on HSK",
          },
          contentHash: {
            type: "string",
            example: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
            description: "Keccak256 hash representing cryptographic proof of content",
          },
          lockAddress: {
            type: "string",
            nullable: true,
            example: "0x1234567890123456789012345678901234567890",
            description: "Unlock Protocol PublicLock address deployed on HashKey Chain (HSK)",
          },
          proofId: {
            type: "string",
            nullable: true,
            example: "0xabc1230000000000000000000000000000000000000000000000000000000001",
            description: "Content proof identifier registered on Avalanche Fuji",
          },
          avalancheTx: {
            type: "string",
            nullable: true,
            example: "0x892a014e36b819f72782e5b72e9894e63d41f5a9e3a61f5c0c283f6f1947b1c3",
            description: "Transaction hash on Avalanche Fuji testnet",
          },
          version: {
            type: "integer",
            example: 1,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-09-11T20:00:00.000Z",
          },
          author: {
            type: "string",
            example: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
          },
          isGated: {
            type: "boolean",
            example: false,
            description: "Indicates whether content requires holding an Unlock membership key on HSK",
          },
        },
      },
      CreatePublicationInput: {
        type: "object",
        required: ["creatorWallet", "title", "preview", "contentHash"],
        properties: {
          id: {
            type: "string",
            description: "Optional pre-calculated publication ID",
          },
          creatorWallet: {
            type: "string",
            example: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
          },
          title: {
            type: "string",
            example: "Scaling Modular Subnets",
          },
          description: {
            type: "string",
            example: "Brief overview for cards",
          },
          preview: {
            type: "string",
            example: "Public preview excerpt...",
          },
          premiumContent: {
            type: "string",
            description: "Protected text visible only to HSK Unlock key holders",
          },
          contentHash: {
            type: "string",
            example: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
          },
          lockAddress: {
            type: "string",
            example: "0x1234567890123456789012345678901234567890",
            description: "Unlock Lock address on HashKey Chain from unlock-hashkey",
          },
          proofId: {
            type: "string",
          },
          avalancheTx: {
            type: "string",
          },
          version: {
            type: "integer",
            default: 1,
          },
        },
      },
      UserRecord: {
        type: "object",
        required: ["wallet", "createdAt"],
        properties: {
          wallet: {
            type: "string",
            example: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
          },
          username: {
            type: "string",
            nullable: true,
            example: "avalanche_dev",
          },
          avatar: {
            type: "string",
            nullable: true,
            example: "https://api.dicebear.com/7.x/identicon/svg?seed=0x71C8...",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      CreateUserInput: {
        type: "object",
        required: ["wallet"],
        properties: {
          wallet: {
            type: "string",
            example: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
          },
          username: {
            type: "string",
            example: "avalanche_dev",
          },
          avatar: {
            type: "string",
            example: "https://api.dicebear.com/7.x/identicon/svg?seed=0x71C8...",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "string",
            example: "Missing required field: title",
          },
        },
      },
    },
  },
};
