import { useEffect, useMemo, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseUnits, formatUnits, isAddress } from 'viem'
import { myTokenAbi } from './abi/generated'
import { CONTRACTS } from './addresses'

type View = 'none' | 'tx' | 'info' | 'error'

export default function App() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const contract = CONTRACTS[chainId ?? 31337]

  const { data: ownerAddr } = useReadContract({
    abi: myTokenAbi,
    address: contract,
    functionName: 'owner',
    query: { enabled: !!contract },
  })
  const isOwner = useMemo(
    () =>
      !!address &&
      !!ownerAddr &&
      address.toLowerCase() === (ownerAddr as string).toLowerCase(),
    [address, ownerAddr]
  )

  const { data: balance, refetch: refetchMyBal } = useReadContract({
    abi: myTokenAbi,
    address: contract,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const [view, setView] = useState<View>('none')
  const [infoMsg, setInfoMsg] = useState('')
  const [errMsg, setErrMsg] = useState('')

  function clearMsgs(next: View = 'none') {
    setInfoMsg('')
    setErrMsg('')
    setView(next)
  }

  useEffect(() => {
    if (isSuccess) refetchMyBal()
  }, [isSuccess, refetchMyBal])

  function onMint(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearMsgs('tx')

    if (!isOwner) {
      setErrMsg('Only the owner can mint.')
      setView('error')
      return
    }

    const to  = (e.currentTarget.elements.namedItem('mintTo') as HTMLInputElement).value as `0x${string}`
    const amt = (e.currentTarget.elements.namedItem('mintAmt') as HTMLInputElement).value || '0'

    if (!isAddress(to)) {
      setErrMsg('Invalid address for mint.')
      setView('error')
      return
    }

    writeContract({
      abi: myTokenAbi,
      address: contract,
      functionName: 'mint',
      args: [to, parseUnits(amt, 18)],
    })
  }

  function onTransfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearMsgs('tx')

    const to  = (e.currentTarget.elements.namedItem('to') as HTMLInputElement).value as `0x${string}`
    const amt = (e.currentTarget.elements.namedItem('amt') as HTMLInputElement).value || '0'

    if (!isAddress(to)) {
      setErrMsg('Invalid recipient address.')
      setView('error')
      return
    }

    writeContract({
      abi: myTokenAbi,
      address: contract,
      functionName: 'transfer',
      args: [to, parseUnits(amt, 18)],
    })
  }

  const [checkAddr, setCheckAddr] = useState<`0x${string}` | ''>('' as any)
  const { refetch: refetchChecked } = useReadContract({
    abi: myTokenAbi,
    address: contract,
    functionName: 'balanceOf',
    args: checkAddr ? [checkAddr] : undefined,
    query: { enabled: false },
  })

  async function onCheck(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearMsgs('info')

    if (!checkAddr || !isAddress(checkAddr)) {
      setErrMsg('Invalid address to check.')
      setView('error')
      return
    }

    const r = await refetchChecked()
    const v = r.data ?? 0n
    setInfoMsg(`Address balance: ${Number(formatUnits(v, 18))} MTK`)
    setView('info')
  }

  return (
    <div id="appWrap">
      <h1>MyToken (ERC20) – dApp</h1>

      {!isConnected ? (
        <button onClick={() => connect({ connector: connectors[0] })}>Connect</button>
      ) : (
        <div className="row">
          <span>Account: {address}</span>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      )}

      <p>Contract: {contract}</p>
      <p>
        Balance: {balance != null ? `${Number(formatUnits(balance, 18))} MTK` : '—'}
      </p>

      {isOwner && (
        <form className="row" onSubmit={onMint}>
          <input name="mintTo"  placeholder="0x recipient" className="grow" />
          <input name="mintAmt" placeholder="amount" type="number" className="narrow" />
          <button type="submit" disabled={!isConnected || isPending || isMining}>Mint</button>
        </form>
      )}

      <form className="row" onSubmit={onTransfer}>
        <input name="to"  placeholder="0x recipient" className="grow" />
        <input name="amt" placeholder="amount" type="number" className="narrow" />
        <button type="submit" disabled={!isConnected || isPending || isMining}>Transfer</button>
      </form>

      <form className="row" onSubmit={onCheck}>
        <input
          value={checkAddr}
          onChange={(e) => setCheckAddr(e.target.value as any)}
          placeholder="0x address para consultar"
          className="grow"
        />
        <button type="submit">Check balance</button>
      </form>

      <button onClick={() => { clearMsgs('none'); refetchMyBal(); }} className="full">
        Refresh balance
      </button>

      <div style={{ marginTop: 8 }}>
        {view === 'tx' && (
          <>
            {txHash && <small>Tx: {txHash}</small>}<br />
            {isSuccess && <small>✅ Confirmed</small>}
            {error && !isSuccess && (
              <>
                <br />
                <small style={{ color: 'crimson' }}>Error: {error.message}</small>
              </>
            )}
          </>
        )}
        {view === 'info' && infoMsg && <small>{infoMsg}</small>}
        {view === 'error' && errMsg && (
          <small style={{ color: 'crimson' }}>Error: {errMsg}</small>
        )}
      </div>
    </div>
  )
}







