# DogePay ID · Wallet + X + Google (3-in-1)

## Intended onboarding
1. **Connect wallet.** Choose MyDoge or Doge Soft (Dogecoin L1), or an existing DogeOS EVM wallet for testnet workflows.
2. **Connect X.** Real Supabase Auth OAuth 2.0 sign-in. The user consents on X and returns to DogePay. **Google is optional**; when chosen, `linkIdentity({provider:'google'})` adds it to the SAME Supabase Auth user. Never call `signInWithOAuth('google')` to bind an existing X identity.
3. **Sign in wallet.** The backend creates a single-use 5-minute challenge containing the authenticated Supabase user ID, the wallet address/network, domain, nonce and expiry. The wallet signs that exact message; the backend validates the cryptographic signature and stores a unique binding.

**No automatic trust from having X and a wallet on the same phone.** Account linking is complete only once the backend verifies the signature. The UI never pretends it has linked accounts before that result.

## Dependencies and setup
- Public key: set `VITE_SUPABASE_PUBLISHABLE_KEY` for all relevant frontend environments. This is **public**, unlike Supabase secret/service-role credentials.
- Backend: apply `supabase/migrations/20261026_dogepay_identity_links.sql`; deploy `supabase/functions/identity-link/index.ts` under the name `identity-link` with `verify_jwt=true`.
- Enable X OAuth 2.0 and Google providers in **Supabase Authentication > Providers** using credentials owned by the project. This configuration is managed in the provider consoles and Supabase dashboard; do not paste client secrets into GitHub or frontend envs.
- Provider callback URL: `https://uivbqftrizhjwiftdyqz.supabase.co/auth/v1/callback` (register with X and Google).
- Add `https://dogepay-id-hackathon.vercel.app/**` to Supabase Auth redirect allow list, and set its Site URL accordingly. Test previews require additional vetted origins and CORS controls.
- Enable **Manual Identity Linking** in Supabase Auth configuration to support Google addition to an existing X user.

## Safety properties
- Existing DogeOS Pay, Friends and Savings functionality is unchanged. Dogecoin L1 connect remains non-transactional.
- A signed **message** is required to link a wallet. No token transfer, approval or PSBT is requested.
- Database tables have RLS and no anon/authenticated Data API privileges; server-side service role controls writes after OAuth JWT and wallet signature verification.
- A wallet can be linked to only one authenticated user per network; a user can link at most one wallet per network, and changing a wallet requires a new signature.
- The backend deletes a challenge before signature verification to prevent replays.
- The X connection does **not** grant DogeOS transaction permissions or access to an unrelated wallet.
- Mobile browsers must support the selected wallet's connection/signing interface. A linked X account on the phone does not automatically give the web app wallet access.

## Acceptance
1. User without a wallet sees installation links; no private key prompt.
2. Connect MyDoge, X OAuth redirect, return and sign; server status confirms binding.
3. Reload: the X session persists; disconnected wallet must reconnect before signing. The UI must never infer signing authorization from local storage.
4. Connect Google using manual identity linking; verify both provider identities belong to the same Supabase Auth user and existing verified wallet mapping remains unchanged.
5. Reject wrong address, malformed signature, nonce replay, expired challenge, a different X session, or an already-linked wallet.
6. Check MyDoge, Doge Soft, DogeOS separately and manual mobile testing. No Mainnet transactions involved.

> **Production launch gate:** X and Google OAuth setup, two-wallet proof, backend verification, browser tests, and a successful deployment. A successful Vite build alone is insufficient.
