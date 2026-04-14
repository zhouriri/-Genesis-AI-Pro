'use client';

import { http, createConfig } from 'wagmi';
import { polygonZkEvm, polygonZkEvmTestnet } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

const projectId = 'genesis-ai-web-app';

export const wagmiConfig = createConfig({
  chains: [polygonZkEvm, polygonZkEvmTestnet],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [polygonZkEvm.id]: http(),
    [polygonZkEvmTestnet.id]: http(),
  },
});

export const SUPPORTED_CHAINS = [
  {
    id: polygonZkEvm.id,
    name: 'Polygon zkEVM',
    icon: '🟣',
    rpcUrl: 'https://rpc.public.zkevm.net',
    explorerUrl: 'https://zkevm.polygonscan.com',
    usdcAddress: '0xA8CE8aEa021516c3d80F159a95F15D0C8CfFB9D4', // USDC on Polygon zkEVM
  },
  {
    id: polygonZkEvmTestnet.id,
    name: 'Amoy Testnet',
    icon: '🧪',
    rpcUrl: 'https://rpc.public.zkevm-test.net',
    explorerUrl: 'https://testnet-zkevm.polygonscan.com',
    usdcAddress: '0x41E94Eb3c5302F8F03d3D2FcE41C1eA3EEFd8Ae8', // USDC on Amoy
  },
];

export const CHAINS_MAP = Object.fromEntries(
  SUPPORTED_CHAINS.map((c) => [c.id, c])
);
