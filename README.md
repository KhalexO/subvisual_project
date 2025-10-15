## MyToken dApp

This project was built using Foundry (https://book.getfoundry.sh/), a fast and modular Ethereum development toolkit.
It uses Forge for building/testing and Anvil as a local blockchain.

In addition, this project includes a modern frontend (Vite/React/TypeScript) that interacts with the deployed ERC20 contract (MyToken) using wagmi (hooks) and viem (clients). Contract ABIs/types are generated automatically via @wagmi/cli from Foundry’s outputs (no hardcoded ABI).

It is designed as a minimal example of how to build, deploy, and use a custom ERC20 token with both command-line tools and a web interface.

> Note: This project was developed with macOS/Linux in mind.
> If you are on Windows, it is strongly recommended to run it inside WSL (Windows Subsystem for Linux).

> Important: All commands below are run from the project root folder (subvisual-dapp), unless explicitly stated otherwise.


### Features

- View your MTK and ETH balances.
- Check the balance of any address (manual action via button).
- Transfer MTK to another address (any user).
- Mint MTK (owner-only). The Mint form is hidden for non-owners.
- Single message area: shows the latest result only (Tx hash + “Confirmed”, errors, or info messages).


### Prerequisites

Install Foundry (Forge & Anvil)

  #### 1) Install the Foundry toolchain
  ```shell
  curl -L https://foundry.paradigm.xyz | bash
  ```
  #### 2) Load the environment (open a new shell OR source the profile)
  ```shell
  source ~/.bashrc    # or ~/.zshrc depending on your shell
  ```
  #### 3) Get the latest binaries
  ```shell
  foundryup
  ```
  #### Verify
  ```shell
  forge --version
  anvil --version
  ```

Install Node.js (LTS recommended) for the frontend.


### Usage (three terminals)

Terminal 1 — start a local blockchain

  ```shell
  anvil
  ```
  - If you use WSL and need Windows MetaMask to reach it:
  - anvil --host 0.0.0.0 --port 8545 --chain-id 31337


Terminal 2 — deploy the contract with Forge (script)
  ```shell
  forge script script/MyToken.s.sol:MyTokenScript \
    --rpc-url http://127.0.0.1:8545 \
    --broadcast \
    --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  ```
  - Copy the “MyToken deployed to: 0x...” address printed in the logs.
  - Update the frontend file: frontend/src/addresses.ts
  - Example:
  - export const CONTRACTS = { 31337: '0xYourNewAddressHere' } as const


Terminal 3 — run the frontend (Vite)
  ```shell
  cd frontend
  ```
  ```shell
  npm install # first time only          
  ```
  ```shell
  npm run wagmi:gen    
  ```
  ```shell
  npm run dev
  ```
Open the browser at the printed URL (e.g., http://localhost:5173).
Install MetaMask, connect to the Anvil network (chainId 31337), and import an Anvil account (see below).


### Run automatic tests (optional)

From the project root:
  ```shell
  forge test
  ```

### Default Anvil Accounts

When Anvil starts, it provides 10 pre-funded accounts (each with 10,000 ETH) for testing.

Example:

  Account[0]: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  Balance: 10000 ETH

(and similarly for accounts 1–9)

Import one of these into MetaMask to be able to deploy/own the contract or interact with the dApp.


### Key Technical Decisions / What Changed

- Frontend moved from static HTML + ethers UMD and hardcoded ABI to Vite/React/TypeScript + wagmi/viem.
- Contract bindings are generated via @wagmi/cli (plugin “foundry”) directly from Foundry’s “out/” artifacts — no manual ABI JSON and no hardcoding.
- The contract address is configured in frontend/src/addresses.ts (per chainId) instead of a window.CONTRACTS config.js.
- Owner-only “Mint” form is conditionally rendered (hidden for non-owners).
- A single message area shows only the latest outcome (transaction hash + “Confirmed”, or errors/info).
- Deployment now uses “forge script … --broadcast” rather than “forge create”.
