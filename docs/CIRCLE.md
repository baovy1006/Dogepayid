# DogePay Circle — planned, not deployed

The intended Social DeFi group treasury allows **5, 10 or 15 members**, group chat, shared DOGE goals, Split Bill and an isolated CircleVault per group.

Design principles: the organizer is an administrator, **not an unrestricted owner of treasury DOGE**. Funds belong to a contract; spending needs defined member approval (2/3 small, 4/5 large), daily limits, and additional delay only for high-risk governance or large withdrawals. Preapproved quick-spend allowances reduce checkout delays but create bounded exposure. Cancel/refund distributes the remaining DOGE pro rata, not the original spent amount.

**Status:** no published, audited or deployed CircleVault product. Prototype requires tests for malicious admin, vote manipulation, collusion, reentrancy, replay, refund fairness, loss of signers, caps, locks and group deadlock. Never enable Create Circle with real funds based on this design alone.
