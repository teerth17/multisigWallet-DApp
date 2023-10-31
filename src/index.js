// import React, { createRef } from "react";
// import ReactDOM from "react-dom/client";
// import "./index.css";
// import App from "./App";
// import reportWebVitals from "./reportWebVitals";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "@rainbow-me/rainbowkit/styles.css";

// import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
// import { chain, createClient, createConfig, WagmiConfig } from "wagmi";
// import { configureChains } from "@wagmi/core";
// import { sepolia, mainnet } from "@wagmi/core/chains";

// import { alchemyProvider } from "wagmi/providers/alchemy";
// import { publicProvider } from "wagmi/providers/public";

// const HardhatNetworkChain = {
//   id: 31337,
//   name: "Hardhat Network",
//   network: "Hardhat",
//   nativeCurrency: {
//     decimals: 18,
//     name: "ETH",
//     symbol: "ETH",
//   },
//   rpcUrls: {
//     default: "http://localhost:8545",
//   },
//   testnet: true,
// };

// const { chains, provider } = configureChains(
//   [mainnet, sepolia, HardhatNetworkChain],
//   [alchemyProvider({ alchemyId: process.env.ALCHEMY_KEY }), publicProvider()]
// );

// const { connectors } = getDefaultWallets({
//   appName: "MultisigWallet DApp",
//   chains,
// });

// const wagmiClient = createConfig({
//   autoConnect: true,
//   connectors,
//   provider,
// });

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(
//   <WagmiConfig config={wagmiClient}>
//     <RainbowKitProvider chains={chains}>
//       <App />
//     </RainbowKitProvider>
//   </WagmiConfig>
// );

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();

import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  chain,
  configureChains,
  createClient,
  createConfig,
  WagmiConfig,
} from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { mainnet, polygon, sepolia, hardhat } from "wagmi/chains";

/* adding hardhat network */
// const HardhatNetworkChain = {
//   id: 31337,
//   name: "Hardhat Network",
//   network: "Hardhat",
//   nativeCurrency: {
//     decimals: 18,
//     name: "ETH",
//     symbol: "ETH",
//   },
//   rpcUrls: {
//     default: "http://localhost:8545",
//   },
//   testnet: true,
// };
const { chains, publicClient } = configureChains(
  [mainnet, polygon, sepolia, hardhat],
  [alchemyProvider({ apiKey: process.env.ALCHEMY_KEY }), publicProvider()]
);

// const { chains, provider } = configureChains(
//   [
//     chain.mainnet,
//     chain.polygon,
//     chain.optimism,
//     chain.arbitrum,
//     chain.goerli,
//     HardhatNetworkChain,
//   ],
//   [alchemyProvider({ alchemyId: process.env.ALCHEMY_KEY }), publicProvider()]
// );

const { connectors } = getDefaultWallets({
  appName: "MultisigWallet DApp",
  projectId: "ae64df322c134ba0f648772659601924",
  chains,
});

const wagmiClient = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <WagmiConfig config={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
