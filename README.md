# DogePay ID 🐕
**Send DOGE to people, not just addresses.**

DogePay ID is a testnet-only, non-custodial social payments dApp for [DogeOS Chikyū Testnet](https://docs.dogeos.com/). It combines an on-chain Doge ID, native DOGE transfers, requests, goal-based Savings and wallet-authenticated Friends & Chat.

[Live Testnet App](https://dogepay-id-hackathon.vercel.app) · [Explorer](https://dogeos-testnet.l2scan.co) · [Faucet](https://faucet.testnet.dogeos.com/)

## Features
| Feature | Trust boundary |
| --- | --- |
| Unified wallet connect | Official DogeOS wallet modal when a registered SDK Client ID is configured; otherwise a testnet-compatible wallet fallback. X/Google identity links are optional and separately verified |
| Register/resolve Doge ID | On-chain IdentityRegistry |
| Send, Receive, Request DOGE | Native DOGE transfer signed by user's wallet |
| Savings Goals | On-chain SavingsVault. No APY or lockup |
| Activity | Real on-chain receipts and local submitted-transaction journal |
| Friends, Chat, notifications, read state | Supabase Postgres through signed-wallet API |

## Dogecoin Layer 1 Wallet

Dogecoin L1 wallet connection can use compatible injected wallet providers where available, initially **MyDoge** and **Doge Soft**. MyDoge v3 Social Wallet is mobile-first; an extension is NOT assumed on desktop. Users can connect, see their L1 address and available wallet-reported balance, copy their address, and disconnect. This integration is intentionally read-only: no mainnet transfers or bridges are initiated.

**Network separation:** Dogecoin L1 mainnet balances are not DogeOS Chikyū testnet balances; Doge ID, Pay, Savings and Friends remain on DogeOS. Cross-network asset transfers require separately implemented and verified bridging.

## Future Roadmap

**In-app Swap**
Swap DOGE and supported ecosystem tokens directly within DogePay ID, with clear quotes, slippage controls and wallet authorization.

**DogePay Circle — Social Treasury**
Create social finance groups with shared DOGE goals, group chat, Split Bill, contribution tracking and transparent member-approved spending.

**Mainnet Expansion**
Advance wallet UX, payment infrastructure, security reviews, automated tests and production readiness.

*These are planned product capabilities, separate from the current testnet features.*

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

## Unified DogePay Account

Wallet + X + optional Google onboarding: [3-in-1 identity architecture and setup](./docs/IDENTITY_3IN1.md). OAuth providers and the verification backend must be configured before claiming account linking works.

## Hackathon Demo (core only)

1. Connect a DogeOS Chikyū Testnet EVM wallet (Chain ID `6281971`).
2. Register or recover `@name.doge` through the on-chain registry.
3. Search a registered friend, send and accept an invitation, and chat.
4. Review a test DOGE payment, sign it in the wallet, and verify the receipt on the explorer.
5. Refresh and verify state; use **Disconnect** to leave the account.

X/Google linking is OPTIONAL. It must not block Doge ID, Pay, or Friends. Dogecoin L1 wallet connectivity does not by itself provide an EVM signer for Chikyū transactions.

### DogeOS SDK activation

- Install of `@dogeos/dogeos-sdk` is part of this build. The SDK modal activates ONLY after a real `VITE_DOGEOS_CLIENT_ID` has been registered through [DogeOS](https://sdk.dogeos.com/).
- Until then DogePay retains the existing RainbowKit/DogeOS fallback. Do not present SDK or MyDoge mobile integration as verified before testing on a real device.
- SDK wallet X/Google login and Supabase X/Google identity are separate systems; never infer the same verified account from provider names alone.
- Keep Dogecoin L1 mainnet and DogeOS Testnet balances, keys and signing policies separate.

### MyDoge V3 / X acceptance boundary

The official DogeOS SDK can sign in with X and return the SDK wallet address. On Chikyū EVM, the SDK may synchronize this address to Wagmi; Pay uses ONLY that wallet's signer. **Do not assume signing into the same X account proves the SDK wallet equals the Social Wallet already stored on a user's phone.** Compare the DogeOS `0x` address with the MyDoge mobile DogeOS address and verify a wallet signature. Dogecoin L1 `D...` addresses are distinct.

Do not call an X identity verified solely because a wallet connected. The prior Supabase X/Google OAuth system is a separate identity service and is optional to Pay/Friends. Never auto-pay, auto-sign or request private keys.
