# Acceptance checklist

## Build
- Node.js 22: `npm install && npm run build` without external Vercel code overlays.
- Keep GitHub CI passing before release.

## Identity & Send
- Register and resolve two different Doge IDs on DogeOS Chikyū Testnet.
- Send native DOGE by Doge ID and by `0x...` address; confirm actual hash/receipt, chain and destination.
- Reject wrong network, insufficient funds, self-send as applicable, invalid name and unsupported Swap flows.

## Friends & Chat (signed-wallet E2E)
- Wallet A and B independently sign challenge, receive distinct sessions and reload.
- A requests B; B sees pending; B accepts; both see accepted.
- A sends message; B receives; unread increments 1; mark read resets to 0; A sees read status.
- Reject an unrelated third wallet reading or sending to either peer; reject invalid signatures and expired tokens.
- Notifications mark as read; switching wallets cannot reuse another wallet session.
- Check emoji picker and mobile responsiveness manually on devices.

## Savings and Clear
- Connect verified contract, create goal, deposit, withdraw and close with actual Testnet receipts.
- Reject unauthorized wallet withdrawal.
- Clear Settings cache; reload account and confirm verified SavingsVault address and on-chain goals remain accessible.

## Migration/operations
- Historical Blob (91 objects) is still inaccessible; do not report historical chat as restored.
- Check database quota, backup and security advisors.
- Verify Production and deployed Edge Functions, then mobile-wallet manual acceptance.

All financial and cross-wallet UI acceptance results must include reproducible evidence. An isolated automated two-wallet API test passed on 2026-10-25, but that alone does not prove a full browser and wallet acceptance.
