/** Public EVM identifier; validate external input at the integration boundary. */
export type WalletAddress = `0x${string}`;

export interface Creator {
  readonly address: WalletAddress;
  readonly name: string;
  readonly bio: string;
  readonly initials: string;
}
