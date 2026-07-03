# AVLT Recovery Dashboard

A static AVLT recovery dashboard deployable on GitHub Pages.

一个可部署到 GitHub Pages 的 AVLT 回款看板。页面运行时直接读取 Altura 公开接口、DexScreener AVLT 二级价格，以及 HyperEVM 链上余额。

## Data Basis / 数据口径

- NAV: `1.0945`
- Total Back: Altura `reserves.reserves`
- Bank: Altura `bank-transactions.totalIncomingUsd`
- Raw RWA / 原始 RWA: `Inessa` from `reserves.items`
- Adjusted RWA / 调整后 RWA: `Raw RWA - Bank`
- Recovered amount / 回款金额: `Total Back - Adjusted RWA`
- Recovery ratio / 回款比例: `Recovered amount / Total Back`
- Recovery price / 回款折算价: `NAV * Recovery ratio`
- Secondary market gap / 二级相对差价: `DEX secondary price - Recovery price`
- Pending redemption AVLT / 等待赎回中 AVLT 数量: `balanceOf(AVLT contract)`

Reserve distribution / 储备分布:

- Shows latest `reserves.items`
- Adds `Bank` as a separate row from `bank-transactions.totalIncomingUsd`
- Shows `Inessa (RWA)` as `Raw Inessa - Bank`
- Table total remains `Total Back`

Altura API:

- `https://altura-liquidity-dashboard-tan.vercel.app/api/public/reserves`
- `https://altura-liquidity-dashboard-tan.vercel.app/api/public/bank-transactions`

DEX price API:

- `https://api.dexscreener.com/latest/dex/tokens/0xd0Ee0CF300DFB598270cd7F4D0c6E0D8F6e13f29`

On-chain read / 链上读取:

- HyperEVM RPC: `https://rpc.hyperliquid.xyz/evm`
- AVLT / pending contract: `0xd0Ee0CF300DFB598270cd7F4D0c6E0D8F6e13f29`

Risk notice / 风险提示:

- For information only. Not financial advice.
- 只做信息展示，不是财务建议。

## GitHub Pages

1. Push to the GitHub repository.
2. In `Settings -> Pages`, select `GitHub Actions`.
3. The workflow deploys the static files to GitHub Pages.
