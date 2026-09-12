import { avalanche, avalancheFuji } from "viem/chains";

export const AVALANCHE_CONFIG = {
  mainnet: {
    ...avalanche,
    explorerUrl: "https://snowtrace.io",
    faucetUrl: null,
  },
  fuji: {
    ...avalancheFuji,
    explorerUrl: "https://testnet.snowtrace.io",
    faucetUrl: "https://core.app/tools/testnet-faucet/?subnet=c&token=c",
  },
};

export function getExplorerAddressUrl(address: string, isTestnet = true): string {
  const base = isTestnet ? AVALANCHE_CONFIG.fuji.explorerUrl : AVALANCHE_CONFIG.mainnet.explorerUrl;
  return `${base}/address/${address}`;
}

export function getExplorerTxUrl(txHash: string, isTestnet = true): string {
  const base = isTestnet ? AVALANCHE_CONFIG.fuji.explorerUrl : AVALANCHE_CONFIG.mainnet.explorerUrl;
  return `${base}/tx/${txHash}`;
}
