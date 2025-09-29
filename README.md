## MyToken dApp 

This project was built using [Foundry](https://book.getfoundry.sh/), a fast and modular Ethereum development toolkit.  
It uses **Forge** for building and deploying the contracts and **Anvil** as a local blockchain for testing.

In addition, this project includes a simple frontend that allows you to interact with the deployed **ERC20 contract (MyToken)**.

It is designed as a minimal example of how to build, deploy, and use a custom ERC20 token with both command-line tools and a web interface.

Note: This project was developed with **macOS/Linux** in mind.
If you are using Windows, it is strongly recommended to run it inside **WSL** (Windows Subsystem for Linux) for compatibility with shell commands (export, awk, etc).

### Features

- View your MTK and ETH balances.
- Check the balance of any address.
- Transfer MTK to another address (any user).
- Mint new MTK tokens (only deployer/owner).
- Each transaction shows hash and ETH cost.

### Usage

#### 1. Start a local blockchain (in the first terminal)

Anvil simulates a local Ethereum blockchain with pre-funded accounts, ideal for development and testing.

```shell
$ cd ~/dev/subvisual-dapp
$ anvil
```

#### 2. Deploy the contract (in a second terminal)

Forge is used (part of Foundry) to deploy the contract.
**$RPC** specifies the RPC endpoint of Anvil, and **$PRIVATE_KEY** uses one of the pre-funded accounts.

```shell
$ cd ~/dev/subvisual-dapp
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
Open frontend/config.js and replace the CONTRACT_ADDRESS value with the address of your deployed contract (if needed):

```js
const CONTRACT_ADDRESS = "0x...";
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
$ cd ~/dev/subvisual-dapp/frontend
$ python3 -m http.server 5173
```
(or alternatively)

```shell
$ npx http-server .
```

#### 7. Open in browser

Go to http://localhost:5173 and connect **MetaMask**(required).
Make sure MetaMask is configured to use chainId 31337 (the default for Anvil).

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
