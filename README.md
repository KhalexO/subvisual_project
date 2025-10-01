## MyToken dApp 

This project was built using [Foundry](https://book.getfoundry.sh/), a fast and modular Ethereum development toolkit.  
It uses **Forge** for building and deploying the contracts and **Anvil** as a local blockchain for testing.

In addition, this project includes a simple frontend that allows you to interact with the deployed **ERC20 contract (MyToken)**.

It is designed as a minimal example of how to build, deploy, and use a custom ERC20 token with both command-line tools and a web interface.

>**Note**: This project was developed with **macOS/Linux** in mind.
>If you are using Windows, it is strongly recommended to run it inside **WSL** (Windows Subsystem for Linux) for compatibility with shell commands (export, awk, etc).

>**Important**: All commands below must be run from the project root folder, named **subvisual_project**, unless explicitly stated otherwise.
>The only step that changes directory is when serving the frontend (step 6), where you should **cd frontend** in the third terminal.

### Features

- View your MTK and ETH balances.
- Check the balance of any address.
- Transfer MTK to another address (any user).
- Mint new MTK tokens (only deployer/owner).
- Each transaction shows hash and ETH cost.

### Prerequisites

Install Foundry (Forge & Anvil)

```shell
# 1) Install the Foundry toolchain
$ curl -L https://foundry.paradigm.xyz | bash

# 2) Load the environment (open a new shell OR source the profile)
$ source ~/.bashrc    # or ~/.zshrc depending on your shell

# 3) Get the latest binaries
$ foundryup

# Verify
$ forge --version
$ anvil --version
```
>If you’re on Windows, do this inside WSL.

### Usage

>Project root: subvisual_project
>(make sure your terminal is in this folder)

#### 1. Start a local blockchain (in the first terminal)

Anvil simulates a local Ethereum blockchain with pre-funded accounts, ideal for development and testing.

```shell
$ anvil
```

#### 2. Deploy the contract (in a second terminal)

Forge is used (part of Foundry) to deploy the contract.
**$RPC** specifies the RPC endpoint of Anvil, and **$PRIVATE_KEY** uses one of the pre-funded accounts.

```shell
$ export RPC=http://127.0.0.1:8545
$ export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
$ forge create src/MyToken.sol:MyToken \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY \
  --broadcast | tee /tmp/deploy.txt
```
#### 3. Copy the deployed contract address

Extract the contract address from the deployment log and save it in an environment variable for convenience:

```shell
$ export ADDR=$(awk '/Deployed to:/{print $3}' /tmp/deploy.txt | tail -n1)
$ echo "Deployed at: $ADDR"
```

#### 4. Configure the frontend

Update the frontend configuration so it knows which contract to interact with.
Open `frontend/config.js` and set the address for your current chainId:

```js
// Example: Anvil (chainId 31337)
window.CONTRACTS = {
  "31337": "0xDeployedContractAddressHere"
};
```

#### 5. Run automatic tests

You can test the contract automatically using **Forge**, which comes with a fast built-in testing framework.
Make sure you’re in the project’s root directory(cd ~/dev/subvisual-dapp) and run:

```shell
$ forge test
```

#### 6. Run a local web server (in a third terminal)

You need to serve the frontend locally. You can use either Python’s built-in HTTP server or Node’s http-server:

```shell
$ cd frontend
$ python3 -m http.server 5173
```
(or alternatively)

```shell
$ cd frontend
$ npx http-server .
```

#### 7. Open in browser

- Install the MetaMask browser extension.
- Go to http://localhost:5173 and connect **MetaMask**(required).
- Make sure MetaMask is configured to use chainId 31337 (the default for Anvil).
- You will import an account using the private key from Anvil (see “Default Anvil Accounts” below).
- Choose Import Account in MetaMask.
- Paste the private key of Account[0] (shown below).

Once connected, you can:
- Check your MTK balance
- Transfer tokens to other accounts
- Mint tokens if you are the contract owner

### Default Anvil Accounts

When Anvil starts, it automatically provides 10 pre-funded accounts, each with 10,000 ETH, which can be used for testing.

Example:

Account[0]: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80  
Balance: 10000 ETH  

(and similar for accounts 1–9)

### Key Technical Decisions

- **Framework:** Used [Foundry](https://book.getfoundry.sh/) for contract development and deployment, due to its speed and native integration with `anvil`, `forge`, and `cast`.  
- **Smart Contract:** Extended OpenZeppelin's `ERC20` and `Ownable` contracts to ensure standard-compliant and secure token behavior without reinventing logic.  
- **Frontend:** Built a static HTML/JS interface using `ethers.js` to interact directly with MetaMask and the deployed contract.  
- **Contract Discovery:** The frontend dynamically detects the deployed address via `config.js` (`window.CONTRACTS`) based on the current chainId.  
- **UX/UI:** The interface automatically hides owner-only actions (minting) for non-owners and displays connection state, balances, and transaction details.  
- **Error Handling:** Implemented friendly error messages to handle both blockchain errors and MetaMask actions gracefully.  
- **Deployment Flexibility:** Supports redeploying with any account by simply updating `config.js` without modifying the codebase.
