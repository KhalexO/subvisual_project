const RPC_URL = "http://127.0.0.1:8545";
// Fallback if config.js doesn't exist or doesn't have the current chainId
const DEFAULT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const ABI = [
  {"type":"function","name":"name","inputs":[],"outputs":[{"type":"string"}],"stateMutability":"view"},
  {"type":"function","name":"symbol","inputs":[],"outputs":[{"type":"string"}],"stateMutability":"view"},
  {"type":"function","name":"decimals","inputs":[],"outputs":[{"type":"uint8"}],"stateMutability":"view"},
  {"type":"function","name":"balanceOf","inputs":[{"type":"address"}],"outputs":[{"type":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"transfer","inputs":[{"type":"address"},{"type":"uint256"}],"outputs":[{"type":"bool"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"mint","inputs":[{"type":"address","name":"to"},{"type":"uint256","name":"amount"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"owner","inputs":[],"outputs":[{"type":"address"}],"stateMutability":"view"}
];

const els = {
  connState:  document.getElementById("connState"),
  role:       document.getElementById("role"),
  account:    document.getElementById("account"),
  balance:    document.getElementById("balance"),
  addr:       document.getElementById("addr"),
  net:        document.getElementById("net"),
  checked:    document.getElementById("checkedBal"),
  // per-section logs
  txTransfer: document.getElementById("txTransfer"),
  txMint:     document.getElementById("txMint"),
  txRead:     document.getElementById("txRead"),
  // gating
  gated:      Array.from(document.querySelectorAll(".gated")),
  mintSec:    document.getElementById("sec-mint"),
};

let provider, signer, contract, decimals = 18;
let isConnected = false, isOwner = false;

const parseUnits  = (n) => ethers.parseUnits((n ?? "0").toString(), decimals);
const formatUnits = (n) => ethers.formatUnits(n, decimals);
const logTo       = (el, msg) => { if (el) el.textContent = msg; };
const clearEl     = (el) => { if (el) el.textContent = ""; };

function trimError(text) {
  const firstLine = String(text || "").split(/\r?\n/)[0];
  return firstLine
    .replace(/^Error:\s*/i, "")
    .replace(/\(reason=.*?\)/i, "")
    .replace(/ \(see .*?\)$/i, "")
    .trim() || "Unexpected error.";
}

function normalizeError(err) {
  const msg = (err && (err.shortMessage || err.reason || err.message)) || String(err || "");
  const m = msg.toLowerCase();

  if (err && (err.code === 4001 || m.includes("user rejected") || m.includes("user denied"))) {
    return "Operation cancelled by the user.";
  }
  if (m.includes("circuit breaker") || m.includes("network error") || m.includes("missing provider")) {
    return "Could not reach the network. Make sure Anvil is running and try again.";
  }
  if (m.includes("invalid chain id") || m.includes("chain disconnected")) {
    return "Wrong network. Connect to chain 31337 (Anvil).";
  }
  if (m.includes("insufficient funds for gas") || m.includes("insufficient funds")) {
    return "Not enough ETH to pay gas.";
  }
  if (m.includes("cannot estimate gas") || m.includes("unpredictable gas")) {
    return "Transaction was rejected by gas estimation. Check address/amount.";
  }
  if (m.includes("erc20insufficientbalance") || m.includes("transfer amount exceeds balance")) {
    return "Not enough MTK for this transfer.";
  }
  if (m.includes("erc20insufficientallowance")) {
    return "Insufficient allowance.";
  }
  if (m.includes("ownableunauthorizedaccount") || m.includes("caller is not the owner")) {
    return "Only the owner can call this function.";
  }
  if (m.includes("code not found") || (m.includes("execution reverted") && m.includes("contract"))) {
    return "No contract at this address on this chain. Deploy and update config.";
  }
  return trimError(msg);
}
function showFriendlyError(targetEl, err) {
  const nice = normalizeError(err);
  if (targetEl) {
    targetEl.classList.add("error");
    targetEl.textContent = `Error: ${nice}`;
  }
}

async function getContractAddress() {
  try {
    const net = await provider.getNetwork();
    const cid = String(Number(net.chainId));
    const fromCfg = (typeof window.CONTRACTS === "object") ? window.CONTRACTS[cid] : null;
    return fromCfg || DEFAULT_CONTRACT_ADDRESS;
  } catch {
    return DEFAULT_CONTRACT_ADDRESS;
  }
}

function setGated(connected, owner){
  for (const node of els.gated) node.classList.toggle("hidden", !connected);
  els.mintSec.classList.toggle("hidden", !(connected && owner));
  els.connState.textContent = connected ? "Connected" : "Disconnected";
  els.role.textContent = connected ? (owner ? "Owner" : "User") : "—";
}

async function ensureProvider(){
  try {
    if (window.ethereum){
      await window.ethereum.request({ method:"wallet_addEthereumChain", params:[{
        chainId:"0x7A69", chainName:"Anvil Local",
        nativeCurrency:{ name:"ETH", symbol:"ETH", decimals:18 },
        rpcUrls:[RPC_URL],
      }]});
      provider = new ethers.BrowserProvider(window.ethereum);
      try { signer = await provider.getSigner(); isConnected = !!signer; }
      catch { signer = null; isConnected = false; }
    } else {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      signer = null; isConnected = false;
    }
    setGated(isConnected, false);
  } catch (e) {
    showFriendlyError(els.txRead, e);
  }
}

async function initContract(){
  try {
    const net = await provider.getNetwork();
    els.net.textContent = `chainId: ${Number(net.chainId)}`;
  } catch {}

  const CONTRACT_ADDRESS = await getContractAddress();
  els.addr.textContent = CONTRACT_ADDRESS;

  try {
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (!code || code === "0x") {
      els.balance.textContent = "—";
      showFriendlyError(els.txRead, new Error("No contract at this address on this chain."));
      contract = null;
      setGated(isConnected, false);
      return;
    }
  } catch (e) {
    showFriendlyError(els.txRead, e);
    contract = null;
    setGated(isConnected, false);
    return;
  }

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer ?? provider);
  try { decimals = Number(await contract.decimals()); } catch { decimals = 18; }

  if (signer){
    try {
      const [owner, me] = await Promise.all([contract.owner(), signer.getAddress()]);
      isOwner = owner.toLowerCase() === me.toLowerCase();
    } catch { isOwner = false; }
  } else {
    isOwner = false;
  }
  setGated(isConnected, isOwner);
}

async function connect(){
  await ensureProvider();
  try {
    if (window.ethereum) await window.ethereum.request({ method:"eth_requestAccounts" });
    signer = await provider.getSigner(); isConnected = true;
    els.account.textContent = await signer.getAddress();
    await initContract(); await refresh();
  } catch (e) {
    showFriendlyError(els.txRead, e);
  }
}

async function refresh(){
  if (!(signer && contract)) return;
  try {
    const me = await signer.getAddress();
    const [balMTK, balETH] = await Promise.all([
      contract.balanceOf(me),
      provider.getBalance(me),
    ]);
    els.balance.textContent = `${formatUnits(balMTK)} MTK | ${ethers.formatEther(balETH)} ETH`;
    if (els.txRead) els.txRead.textContent = "";
  } catch (e) {
    els.balance.textContent = "—";
    showFriendlyError(els.txRead, e);
  }
}

async function showBalanceOf(addr, outEl){
  if (!contract) return;
  try {
    const bal = await contract.balanceOf(addr);
    outEl.textContent = `${formatUnits(bal)} MTK`;
    if (els.txRead) els.txRead.textContent = "";
  } catch (e) {
    outEl.textContent = "—";
    showFriendlyError(els.txRead, e);
  }
}

function txCostEth(receipt, tx) {
  const price =
    (receipt && receipt.effectiveGasPrice) ??
    (tx && tx.gasPrice) ??
    (tx && tx.maxFeePerGas) ??
    0n;
  if (!receipt || receipt.gasUsed == null) return null;
  try {
    const wei = receipt.gasUsed * price;
    return ethers.formatEther(wei);
  } catch {
    return null;
  }
}

async function doMint(){
  if (!(signer && contract && isOwner)) return alert("Connect your wallet as the owner.");
  clearEl(els.txTransfer);
  els.txMint?.classList.remove("error");
  try {
    const to  = document.getElementById("mintTo").value.trim();
    const amt = document.getElementById("mintAmt").value;
    if (!to || !amt) return showFriendlyError(els.txMint, new Error("Please fill in address and amount."));
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return showFriendlyError(els.txMint, new Error("Invalid address."));

    const tx = await contract.connect(signer).mint(to, parseUnits(amt));
    const receipt = await tx.wait();
    const cost = txCostEth(receipt, tx);
    logTo(els.txMint, `Tx: ${tx.hash}${cost ? ` | Cost: ${cost} ETH` : ""}`);

    await refresh();
  } catch (e) {
    showFriendlyError(els.txMint, e);
  }
}

async function doTransfer(){
  if (!(signer && contract)) return alert("Connect your wallet.");
  clearEl(els.txMint);
  els.txTransfer?.classList.remove("error");
  try {
    const to  = document.getElementById("to").value.trim();
    const amt = document.getElementById("amt").value;
    if (!to || !amt) return showFriendlyError(els.txTransfer, new Error("Please fill in address and amount."));
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return showFriendlyError(els.txTransfer, new Error("Invalid address."));

    const me = await signer.getAddress();
    const need = parseUnits(amt);
    const have = await contract.balanceOf(me);
    if (have < need) return showFriendlyError(els.txTransfer, new Error("ERC20InsufficientBalance"));

    const tx = await contract.connect(signer).transfer(to, need);
    const receipt = await tx.wait();
    const cost = txCostEth(receipt, tx);
    logTo(els.txTransfer, `Tx: ${tx.hash}${cost ? ` | Cost: ${cost} ETH` : ""}`);

    await refresh();
  } catch (e) {
    showFriendlyError(els.txTransfer, e);
  }
}

// handlers
document.getElementById("connect").onclick  = connect;
document.getElementById("refresh").onclick  = refresh;
document.getElementById("mint").onclick     = doMint;
document.getElementById("transfer").onclick = doTransfer;
document.getElementById("checkBal").onclick = async () => {
  const a = document.getElementById("checkAddr").value.trim();
  if (a) await showBalanceOf(a, els.checked);
};

// (read-only, UI locked until connected)
(async () => { await ensureProvider(); await initContract(); })().catch(e => showFriendlyError(els.txRead, e));






