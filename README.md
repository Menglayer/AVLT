# AVLT Recovery Dashboard

一个可部署到 GitHub Pages 的 AVLT 看板，展示 Altura 已回款金额、OKX AVLT 二级价格、固定 NAV 口径下的回款比例和二级价差。

## 数据口径

- NAV: `1.0945`
- 已回款金额: Altura `bank-transactions.totalIncomingUsd`
- 供应量: Altura `reserves.supply`
- 回款比例: `已回款金额 / (AVLT supply * NAV)`
- 回款折算价: `NAV * 回款比例`
- 二级相对差价: `OKX 二级价格 - 回款折算价`

## GitHub Pages

1. 推送到 GitHub 仓库。
2. 在仓库 `Settings -> Pages` 中选择 `GitHub Actions`。
3. workflow 会在 push、手动触发、以及每 30 分钟定时刷新 `data/snapshot.json` 并部署页面。

本地刷新数据:

```bash
node scripts/update-data.mjs
```
