# AVLT Recovery Dashboard

一个可部署到 GitHub Pages 的 AVLT 看板。页面运行时直接读取 Altura 公开接口和 DexScreener AVLT 二级价格。

## 数据口径

- NAV: `1.0945`
- Total Back: Altura `reserves.reserves`
- RWA: reserves 明细中的 `Inessa`
- Bank: Altura `bank-transactions.totalIncomingUsd`
- 回款金额: `Total Back - RWA + Bank`
- 回款比例: `回款金额 / Total Back`
- 回款折算价: `NAV * 回款比例`
- 二级相对差价: `DEX 二级价格 - 回款折算价`

Altura API:

- `https://altura-liquidity-dashboard-tan.vercel.app/api/public/reserves`
- `https://altura-liquidity-dashboard-tan.vercel.app/api/public/bank-transactions`

DEX 价格 API:

- `https://api.dexscreener.com/latest/dex/tokens/0xd0Ee0CF300DFB598270cd7F4D0c6E0D8F6e13f29`

## GitHub Pages

1. 推送到 GitHub 仓库。
2. 在仓库 `Settings -> Pages` 中选择 `GitHub Actions`。
3. workflow 会把静态文件部署到 GitHub Pages。
