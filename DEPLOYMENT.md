# Deployment and source-of-truth

Deploy from the committed GitHub files. Set Vercel framework Vite, Node.js 22.x, output directory `dist`, install command `npm install`, build command `npm run build`.

Set `VITE_WALLETCONNECT_PROJECT_ID` in Vercel (public client identifier). Optional `VITE_IDENTITY_REGISTRY_ADDRESS` and `VITE_SAVINGS_VAULT_ADDRESS` are contract overrides; verify bytecode on the intended testnet before setting either.

For Supabase, create Postgres, apply `supabase/migrations/20261025_dogepay_social.sql`, then deploy `supabase/functions/social/index.ts` as an Edge Function with **`verify_jwt=false` only because the function validates independent wallet-signed session tokens itself**. Its database access uses server-side Supabase service-role credentials, never public browser env variables.

The historical Vercel production used build-time code patches held outside GitHub. Once equivalent source files are committed and a preview build passes with `npm run build`, change project build/install settings to the direct commands above. Preserve old READY deployment until a new build and smoke test pass.

Do not deploy CircleVault to mainnet; Circle is an unreviewed design. Do not restore/migrate historical Vercel Blob records without access authorization and verification. The old store remains suspended, and the new database has different records.

Rollback should promote a known working deployment through Vercel, without deleting Supabase data or savings contract references.
