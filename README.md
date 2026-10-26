# DogePay ID 🐕
**Send DOGE to people, not just addresses.**

DogePay ID is a testnet-only, non-custodial social payments dApp for [DogeOS Chikyū Testnet](https://docs.dogeos.com/). It combines an on-chain Doge ID, native DOGE transfers, requests, goal-based Savings and wallet-authenticated Friends & Chat.

[Live Testnet App](https://dogepay-id-hackathon.vercel.app) · [Explorer](https://dogeos-testnet.l2scan.co) · [Faucet](https://faucet.testnet.dogeos.com/)

## Features
| Feature | Trust boundary |
| --- | --- |
| Wallet connect and chain switch | EVM wallet; chain ID `6281971` |
| Register/resolve Doge ID | On-chain IdentityRegistry |
| Send, Receive, Request DOGE | Native DOGE transfer signed by user's wallet |
| Savings Goals | On-chain SavingsVault. No APY or lockup |
| Activity | Real on-chain receipts and local submitted-transaction journal |
| Friends, Chat, notifications, read state | Supabase Postgres through signed-wallet API |
| Swap | **Disabled**: no verified native liquidity/router |
| Circle group treasury | Prototype/design **only**, not deployed or audited |

## Important caveats
- This is **TESTNET ONLY**; no real asset value and no independent contract audit.
- The previous Vercel Blob Friends/Chat store exceeded its quota (91 objects persisted at last inspection). The new Supabase backend has an **independent, initially empty database**. Old friendships/messages cannot appear until an authorized migration becomes possible.
- Never treat a GitHub build, wallet UI or Vercel READY state as evidence that every on-chain transaction succeeds.
- The project began in Noah AI during **VIBE CODE ON DOGE**, and this repository preserves the original work and its subsequent evolution.

## Local development
Requires Node.js 22+ and npm.

```bash
git clone https://github.com/baovy1006/Dogepayid.git
cd Dogepayid
cp .env.example .env
# Supply your *public* WalletConnect project ID in .env
npm install
npm run dev
npm run build
```

Production app default API: `https://uivbqftrizhjwiftdyqz.supabase.co/functions/v1/social`. The URL is public; credentials are **never** shipped to the frontend.

## Network
| Item | Value |
| --- | --- |
| Network | DogeOS Chikyū Testnet |
| Chain ID | `6281971` |
| Native asset | DOGE, 18 decimals |
| RPC | `https://rpc.testnet.dogeos.com/` |
| Registry | `0x007583D5B15A9B8ac928FD64460aD97866c5c947` |
| Vault address | Not canonical; may be linked to wallet in Testnet |
| Native DOGE ERC-20 view | `0x530000000000000000000000000000000000d09e` — same DOGE balance, do not add twice |

## Architecture and deployment
- `src/`: React/Vite frontend; Wallet, Doge ID, Send/Request, Savings, Activity, Friends & Chat.
- `solidity_workspace/`: Solidity contracts, tests and ABIs.
- `supabase/functions/social/`: wallet-signature API (challenge/login, friendships, messages, notices, read receipts).
- `supabase/migrations/`: private tables, RLS and service-role access.
- `docs/`: design and acceptance guidance.
- Vercel should use **`npm install`** and **`npm run build`**, not fetch source-modifying build scripts.

For rollout procedures and limitations see [DEPLOYMENT](./DEPLOYMENT.md), [SECURITY](./SECURITY.md) and [TESTING](./TESTING.md).

## License
No top-level software license has been chosen by the project owner. Do not assume an open-source license from the repository's public visibility or individual contract SPDX headers.
