# Security policy and current limits

**Testnet only. Not audited. Do not store assets with real value.**

Contact the project maintainer privately through a GitHub security advisory rather than publishing exploitable details in a public issue. Avoid sharing seed phrases, wallet private keys, Supabase service-role keys or session bearer tokens.

## Key trust boundaries

- No backend custody: native DOGE transfers and savings writes require a wallet transaction on DogeOS Testnet `6281971`.
- The Doge ID registry is resolved on-chain. Always show final destination wallet on the payment review screen.
- SavingsVault must validate deployed bytecode and is source of truth for goal balances; clear-browser-cache must not remove the vault reference.
- The Social Edge Function verifies a signed, short-lived login challenge with `viem.verifyMessage`, stores only a SHA-256 hash of its 4-hour bearer token, and checks friendship ownership on messages and accept operations.
- The Postgres tables have RLS enabled, grant no direct access to `anon`/`authenticated`, and are accessed only by server-side service role. **Never expose service role in `VITE_*`.**
- API requests do not send private keys. CORS alone is not authorization.
- No arbitrary admin withdrawal in Savings. Circle multisig has not been audited/deployed and is not usable.
- Legacy Blob data is unavailable because the old store is suspended; do not overwrite/migrate by guessing.
- Free Supabase plans have usage limits; ensure backups/monitoring before relying on Chat for sensitive or critical information.

## Not yet verified
Full mobile-wallet/browser acceptance, denial-of-service limits and anti-spam hardening, complete contract audit, old Blob migration, mainnet readiness. Wallet signatures and testnet faucet are not proof of financial production readiness.
