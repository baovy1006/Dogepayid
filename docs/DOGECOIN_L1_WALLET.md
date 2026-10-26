# Dogecoin Layer 1 wallet — connection only

DogePay ID offers two separate wallet surfaces:

- **DogeOS Chikyū Testnet (EVM):** RainbowKit/wagmi, `0x…` addresses, Doge ID, Friends, Pay, and Savings.
- **Dogecoin L1 mainnet:** dedicated optional connection for MyDoge browser extension (`window.doge`) or Doge Soft (`window.dogesoft`). It displays the address and wallet-reported balance without initiating L1 transactions.

## Security boundaries

- Dogecoin L1 is a **real-value mainnet**, not the DogeOS testnet. No transaction or signature APIs are called by this feature.
- No seed phrase, private key, or credentials are requested or stored.
- An address displayed in the UI is **not proof of identity linkage** with a Doge ID. Future linking requires a separate verified challenge/signature flow and consent.
- Wallet disconnect does not affect the other network's connector.
- Missing providers show an installation link; the application never auto-redirects the user.
- MyDoge's extension API returns integer koinu in `getBalance()`; divide by `100000000` for DOGE. Doge Soft `getBalance()` reports DOGE.

## Manual acceptance checklist

1. Without an installed Dogecoin wallet, `DOGE L1` opens a modal with clear install links; DogeOS connection continues to work.
2. With MyDoge extension, connect once after explicit approval, check address and DOGE amount, copy, then disconnect.
3. With Doge Soft, approve connection, confirm address/balance, reload and verify authorized session restores without a new approval prompt, then disconnect.
4. Reject an approval and confirm the modal displays an error without affecting the DogeOS wallet.
5. Confirm no L1 transaction, token approval, bridge request, or message signature is sent.
6. Confirm responsive layout on narrow mobile viewports.

### Wallet API references

- MyDoge official example: https://github.com/mydoge-com/mydogemask-next-example
- Doge Soft: https://docs.dogesoft.io/wallet/quickstart/
