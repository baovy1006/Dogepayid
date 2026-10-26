# Contributing

DogePay ID is in active Testnet development. Small, reviewed pull requests with a minimal test case are welcome.

1. Fork and make a topic branch.
2. Use Node.js 22 and run `npm install && npm run build`.
3. Keep all signing flows wallet-bound and Testnet-only.
4. Never include keys, `.env`, bearer tokens, wallet seeds, session files or private chats in commits.
5. For backend modifications, preserve RLS, service-role isolation and signed-wallet authentication.
6. Explain what changed, how it was tested, and any acceptance gaps.
7. Keep user-facing UI in plain English; do not expose transaction success until the chain receipt verifies.

Do not remove existing Friends, Chat or Savings to silence a failing external service. Report unavailable backend separately.
