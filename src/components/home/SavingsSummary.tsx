import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PiggyBank, Plus, ArrowDownToLine, ArrowUpFromLine, ExternalLink, ShieldCheck } from 'lucide-react';
import { type Address, isAddress, formatUnits, type Hex } from 'viem';
import { useAccount } from 'wagmi';
import { deployContract, waitForTransactionReceipt } from 'wagmi/actions';
import SavingsVaultArtifact from '@/abi/SavingsVaultABI.json';
import { StatusPill } from '@/components/common/StatusPill';
import { TxStatusPanel } from '@/components/tx/TxStatusPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CONTRACTS, TARGET_CHAIN, explorerAddressUrl } from '@/lib/config';
import { savingsVaultAbi } from '@/lib/contracts';
import { formatDoge } from '@/lib/format';
import { parseDogeAmount } from '@/lib/amount';
import { ensureTargetChain, wagmiConfig } from '@/lib/wagmi';
import { runTrackedTx, describeTxError, type TxState } from '@/lib/txService';
import { getGoalsOf, getVaultAddress, connectVerifiedVault, createGoal, depositToGoal, withdrawFromGoal, closeGoal, type SavingsGoal } from '@/lib/vaultService';

type Operation = { kind: 'deposit' | 'withdraw' | 'close'; goal: SavingsGoal } | null;

export const SavingsSummary = () => {
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [vaultAddress, setVaultAddress] = useState<Address | undefined>(() => getVaultAddress());
    const [contractInput, setContractInput] = useState('');
    const [contractBusy, setContractBusy] = useState(false);
    const [error, setError] = useState('');
    const [createName, setCreateName] = useState('');
    const [createTarget, setCreateTarget] = useState('');
    const [operation, setOperation] = useState<Operation>(null);
    const [amount, setAmount] = useState('');
    const [tx, setTx] = useState<TxState>({phase:'idle'});

    const goalsQuery = useQuery({
        queryKey:['savings','goals',address,vaultAddress],
        queryFn:() => getGoalsOf(address!),
        enabled:!!address && !!vaultAddress,
        refetchInterval:30000
    });
    const goals = goalsQuery.data ?? [];
    const activeGoals = goals.filter(g => !g.closed);
    const total = goals.reduce((n,g)=>n + g.balance,0n);
    const busy = contractBusy || tx.phase === 'signing' || (tx.phase === 'pending' && !tx.error);

    const activate = async (deploy: boolean) => {
        if (busy || !address) return;
        setContractBusy(true); setError('');
        try {
            await ensureTargetChain();
            let result: Address;
            if (deploy) {
                const hash = await deployContract(wagmiConfig, {
                    abi:savingsVaultAbi,
                    bytecode:SavingsVaultArtifact.bytecode as Hex,
                    chainId:TARGET_CHAIN.id
                });
                const receipt = await waitForTransactionReceipt(wagmiConfig,{hash,chainId:TARGET_CHAIN.id});
                if(receipt.status !== 'success' || !receipt.contractAddress)
                    throw new Error('Savings contract deployment not confirmed.');
                result=receipt.contractAddress;
            } else {
                if(!isAddress(contractInput.trim())) throw new Error('Enter a valid deployed contract address.');
                result=contractInput.trim() as Address;
            }
            await connectVerifiedVault(result);
            setVaultAddress(result);
            setContractInput('');
        } catch(e) {setError(describeTxError(e));}
        finally {setContractBusy(false);}
    };
    const transact = async (
        send: () => Promise<Hex>,
        meta: {kind:'savings_create'|'savings_deposit'|'savings_withdraw'|'savings_close', amountWei?:string, goalId?:string, label?:string}
    ) => {
        setError(''); setTx({phase:'idle'});
        const receipt = await runTrackedTx(send,meta,setTx);
        if(receipt?.status === 'success') {
            await queryClient.invalidateQueries({queryKey:['savings']});
            await goalsQuery.refetch();
            setOperation(null);setAmount('');setCreateName('');setCreateTarget('');
        }
    };
    const submitCreate = async () => {
        const target=parseDogeAmount(createTarget);
        if(!target || !createName.trim() || createName.trim().length>40){setError('Enter a goal name (1–40 characters) and a positive target.');return;}
        await transact(()=>createGoal(createName.trim(),target,0n),{kind:'savings_create',label:createName.trim()});
    };
    const submitOperation = async () => {
        if(!operation) return;
        const {goal,kind}=operation;
        if(kind === 'close') {
            await transact(()=>closeGoal(goal.id),{kind:'savings_close',goalId:String(goal.id),amountWei:goal.balance.toString(),label:goal.name});
            return;
        }
        const value=parseDogeAmount(amount);
        if(!value){setError('Enter a positive DOGE amount.');return;}
        if(kind==='withdraw' && value>goal.balance){setError('Cannot withdraw more than this goal holds.');return;}
        await transact(()=>kind==='deposit'?depositToGoal(goal.id,value):withdrawFromGoal(goal.id,value),
            {kind:kind==='deposit'?'savings_deposit':'savings_withdraw',amountWei:value.toString(),goalId:String(goal.id),label:goal.name});
    };
    const view = (kind:Operation) => {setOperation(kind);setAmount('');setError('');setTx({phase:'idle'});};

    return <>
        <section className="glass-card p-6" aria-labelledby="savings-title">
            <div className="flex items-center justify-between gap-3">
                <h2 id="savings-title" className="flex items-center gap-2 text-sm font-medium">
                    <PiggyBank className="h-4 w-4 text-primary" /> Savings goals
                </h2>
                <StatusPill tone={vaultAddress ? 'success':'muted'}>{vaultAddress ? 'On-chain' : 'Testnet setup'}</StatusPill>
            </div>
            <p className="mt-5 font-display text-2xl">{vaultAddress ? formatDoge(total) + ' DOGE' : 'Save DOGE on-chain'}</p>
            <p className="mt-2 text-sm text-muted-foreground">
                {vaultAddress ? activeGoals.length + ' active goals · Withdraw anytime' :
                'No yield, no lockups. Create a real on-chain savings vault with your wallet.'}
            </p>
            <Button className="mt-4 w-full rounded-full" variant="secondary" onClick={()=>{setOpen(true);setError('');}}>
                {vaultAddress ? 'Manage savings' : 'Set up savings'}
            </Button>
        </section>
        <Dialog open={open} onOpenChange={next=>{if(!busy) setOpen(next);}}>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-xl border-border bg-popover">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-normal">Savings goals</DialogTitle>
                    <DialogDescription>Real DogeOS Testnet transactions. Test DOGE has no monetary value.</DialogDescription>
                </DialogHeader>
                {!vaultAddress ? <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Activate the open-source SavingsVault contract on DogeOS. Deployment requires your wallet signature and a small testnet DOGE gas fee. Your deposits remain withdrawable only by your wallet.</p>
                    <Button className="w-full rounded-full" disabled={contractBusy || !address} onClick={()=>activate(true)}>
                        {contractBusy?'Confirm in wallet / verifying…':'Deploy testnet SavingsVault'}
                    </Button>
                    <div className="border-t border-border pt-4">
                        <p className="mb-2 text-xs text-muted-foreground">Already deployed on another device? Connect the exact same version of SavingsVault:</p>
                        <Input placeholder="0x SavingsVault contract address" value={contractInput} onChange={e=>setContractInput(e.target.value)} className="font-mono text-xs"/>
                        <Button variant="secondary" className="mt-2 w-full rounded-full" disabled={!isAddress(contractInput.trim()) || contractBusy} onClick={()=>activate(false)}>Verify and use this vault</Button>
                    </div>
                    <p className="text-xs text-warning">Contract is not independently audited. Testnet use only. Verify every wallet prompt.</p>
                </div> : <>
                    <a href={explorerAddressUrl(vaultAddress)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <ShieldCheck className="h-3.5 w-3.5"/> Verified SavingsVault · {vaultAddress.slice(0,8)}…{vaultAddress.slice(-6)} <ExternalLink className="h-3 w-3"/>
                    </a>
                    <div className="rounded-xl border border-border bg-background/30 p-4">
                        <p className="text-xs text-muted-foreground">Your saved DOGE</p>
                        <p className="mt-1 font-display text-3xl">{formatDoge(total)} DOGE</p>
                        <p className="mt-1 text-xs text-muted-foreground">{activeGoals.length} active goals. These are contract balances, not wallet balances.</p>
                    </div>
                    {goalsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading on-chain savings…</p>
                    : goalsQuery.isError ? <p className="text-sm text-destructive">Could not load goals from DogeOS RPC. <button onClick={()=>goalsQuery.refetch()} className="underline">Retry</button></p>
                    : <div className="space-y-3">
                        {goals.map(goal=><div key={String(goal.id)} className="rounded-lg border border-border p-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-medium">{goal.name}</p><span className="text-xs text-muted-foreground">{goal.closed?'Closed':formatDoge(goal.balance)+' DOGE'}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full bg-primary" style={{width:goal.target>0n ? Math.min(100,Number(goal.balance * 10000n / goal.target) / 100)+'%':'0%'}} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{formatDoge(goal.balance)} / {formatDoge(goal.target)} DOGE</p>
                            {!goal.closed && <div className="mt-3 flex flex-wrap gap-2">
                                <Button size="sm" variant="secondary" disabled={busy} className="rounded-full" onClick={()=>view({kind:'deposit',goal})}><ArrowDownToLine className="h-3.5 w-3.5"/> Deposit</Button>
                                <Button size="sm" variant="secondary" disabled={busy || goal.balance===0n} className="rounded-full" onClick={()=>view({kind:'withdraw',goal})}><ArrowUpFromLine className="h-3.5 w-3.5"/> Withdraw</Button>
                                <Button size="sm" variant="ghost" disabled={busy} onClick={()=>view({kind:'close',goal})}>Close goal</Button>
                            </div>}
                        </div>)}
                        {!goals.length && <p className="text-sm text-muted-foreground">No goals yet. Create the first one below.</p>}
                    </div>}
                    {!operation && !busy && <div className="space-y-2 border-t border-border pt-4">
                        <p className="flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4"/> Create goal</p>
                        <Input value={createName} onChange={e=>setCreateName(e.target.value)} placeholder="Goal name (e.g. My DOGE Fund)" maxLength={40}/>
                        <Input value={createTarget} onChange={e=>setCreateTarget(e.target.value)} placeholder="Target in DOGE" inputMode="decimal"/>
                        <Button className="w-full rounded-full" disabled={!address || !createName.trim() || !parseDogeAmount(createTarget)} onClick={submitCreate}>Create on-chain goal</Button>
                    </div>}
                    {operation && !busy && <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-sm font-semibold">{operation.kind==='close'?'Close goal':operation.kind==='deposit'?'Deposit test DOGE':'Withdraw test DOGE'} · {operation.goal.name}</p>
                        {operation.kind !== 'close' ? <Input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="DOGE amount" inputMode="decimal"/> :
                            <p className="text-xs text-muted-foreground">Closing will return all remaining {formatDoge(operation.goal.balance)} DOGE to your wallet.</p>}
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={()=>view(null)} className="flex-1 rounded-full">Cancel</Button>
                            <Button className="flex-1 rounded-full" disabled={operation.kind!=='close' && !parseDogeAmount(amount)} onClick={submitOperation}>Review in wallet</Button>
                        </div>
                    </div>}
                    {tx.phase!=='idle' && <TxStatusPanel state={tx}/>}
                </>}
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </DialogContent>
        </Dialog>
    </>;
};