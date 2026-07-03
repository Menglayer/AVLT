const NAV = 1.0945;
const RWA_NAMES = new Set(["inessa", "rwa"]);

const API = {
  reserves: "https://altura-liquidity-dashboard-tan.vercel.app/api/public/reserves",
  bank: "https://altura-liquidity-dashboard-tan.vercel.app/api/public/bank-transactions",
  dex:
    "https://api.dexscreener.com/latest/dex/tokens/0xd0Ee0CF300DFB598270cd7F4D0c6E0D8F6e13f29",
};

const els = {
  status: document.querySelector("#source-status"),
  light: document.querySelector(".status-light"),
  refresh: document.querySelector("#refresh-button"),
  navInline: document.querySelector("#nav-inline"),
  topSupply: document.querySelector("#top-supply"),
  topPrice: document.querySelector("#top-price"),
  topRatio: document.querySelector("#top-ratio"),
  updatedAt: document.querySelector("#updated-at"),
  recoveredUsd: document.querySelector("#recovered-usd"),
  recoveredCount: document.querySelector("#recovered-count"),
  marketPrice: document.querySelector("#market-price"),
  marketChange: document.querySelector("#market-change"),
  recoveryPrice: document.querySelector("#recovery-price"),
  recoveryRatio: document.querySelector("#recovery-ratio"),
  marketGap: document.querySelector("#market-gap"),
  marketGapSub: document.querySelector("#market-gap-sub"),
  progressValue: document.querySelector("#progress-value"),
  progressFill: document.querySelector("#progress-fill"),
  totalNav: document.querySelector("#total-nav"),
  navDiscount: document.querySelector("#nav-discount"),
  reserveTotal: document.querySelector("#reserve-total"),
  reserveTable: document.querySelector("#reserve-table"),
  marketCap: document.querySelector("#market-cap"),
  marketLiquidity: document.querySelector("#market-liquidity"),
  marketChangeLarge: document.querySelector("#market-change-large"),
  reservePerToken: document.querySelector("#reserve-per-token"),
  flowTotal: document.querySelector("#flow-total"),
  flowList: document.querySelector("#flow-list"),
};

els.navInline.textContent = formatUsd(NAV, 4);
els.refresh.addEventListener("click", loadData);

loadData();

async function loadData() {
  setStatus("loading", "加载数据中");
  els.refresh.disabled = true;

  try {
    const [reserves, bank, market] = await Promise.all([
      fetchJson(API.reserves),
      fetchJson(API.bank),
      fetchDexMarket().catch((error) => ({
        error: error?.message || "DEX price unavailable",
      })),
    ]);

    render(buildModel({ reserves, bank, market }));
    setStatus(market.error ? "error" : "ok", market.error ? "Altura 已同步，DEX 价格失败" : "DEX 二级价格已同步");
  } catch (error) {
    console.error(error);
    setStatus("error", "Altura 数据读取失败");
  } finally {
    els.refresh.disabled = false;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json,text/plain,*/*" },
  });

  if (!response.ok) {
    throw new Error(`${url} HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchDexMarket() {
  const data = await fetchJson(API.dex);
  const pair = selectDexPair(data.pairs || []);

  if (!pair) {
    throw new Error("No AVLT DEX pair found");
  }

  return {
    source: "DexScreener",
    pairUrl: pair.url,
    pairAddress: pair.pairAddress,
    dexId: pair.dexId,
    quoteSymbol: pair.quoteToken?.symbol || "",
    price: number(pair.priceUsd),
    marketCap: number(pair.marketCap || pair.fdv),
    liquidity: number(pair.liquidity?.usd),
    volume24H: number(pair.volume?.h24),
    priceChange24H: number(pair.priceChange?.h24),
  };
}

function selectDexPair(pairs) {
  const avlt = "0xd0ee0cf300dfb598270cd7f4d0c6e0d8f6e13f29";
  return pairs
    .filter((pair) => {
      const baseAddress = String(pair.baseToken?.address || "").toLowerCase();
      const quoteAddress = String(pair.quoteToken?.address || "").toLowerCase();
      return pair.chainId === "hyperevm" && (baseAddress === avlt || quoteAddress === avlt);
    })
    .sort((a, b) => number(b.liquidity?.usd) - number(a.liquidity?.usd))[0];
}

function buildModel({ reserves, bank, market }) {
  const totalBackUsd = number(reserves.reserves);
  const supply = number(reserves.supply);
  const bankUsd = number(bank.totalIncomingUsd);
  const rwaItem = findRwaItem(reserves.items || []);
  const rwaUsd = number(rwaItem?.amount);
  const recoveredUsd = Math.max(totalBackUsd - rwaUsd + bankUsd, 0);
  const recoveredRatio = totalBackUsd > 0 ? recoveredUsd / totalBackUsd : 0;
  const recoveryPrice = NAV * recoveredRatio;
  const marketPrice = number(market.price);
  const hasMarketPrice = marketPrice > 0 && !market.error;
  const marketGap = hasMarketPrice ? marketPrice - recoveryPrice : null;

  return {
    updatedAt: new Date().toISOString(),
    reserves,
    bank,
    market,
    totalBackUsd,
    supply,
    bankUsd,
    rwaName: rwaItem?.name || "Inessa",
    rwaUsd,
    recoveredUsd,
    recoveredRatio,
    recoveryPrice,
    marketPrice,
    hasMarketPrice,
    marketGap,
    reservePerToken: supply > 0 ? totalBackUsd / supply : 0,
    navDiscountPct: hasMarketPrice ? marketPrice / NAV - 1 : null,
  };
}

function render(model) {
  const change24h = number(model.market.priceChange24H);
  const flowCount = number(model.bank.count);
  const marketGapPct = model.recoveryPrice > 0 && model.marketGap !== null ? model.marketGap / model.recoveryPrice : null;

  els.topSupply.textContent = formatCompact(model.supply);
  els.topPrice.textContent = model.hasMarketPrice ? formatUsd(model.marketPrice, 4) : "--";
  els.topRatio.textContent = formatPercent(model.recoveredRatio, 2);
  els.updatedAt.textContent = formatDate(model.updatedAt);

  els.recoveredUsd.textContent = formatUsd(model.recoveredUsd, 0);
  els.recoveredCount.textContent = `Total Back - RWA + Bank | ${flowCount} 笔 bank 流水`;

  els.marketPrice.textContent = model.hasMarketPrice ? formatUsd(model.marketPrice, 5) : "--";
  els.marketChange.textContent = model.hasMarketPrice
    ? `${String(model.market.dexId || "DEX").toUpperCase()}/${model.market.quoteSymbol || "USD"} · 24H ${formatSignedPercent(change24h / 100, 2)}`
    : "DEX price unavailable";
  setTone(els.marketChange, change24h);

  els.recoveryPrice.textContent = formatUsd(model.recoveryPrice, 5);
  els.recoveryRatio.textContent = `回款比例 ${formatPercent(model.recoveredRatio, 2)} of total back`;

  els.marketGap.textContent = model.marketGap === null ? "--" : formatSignedUsd(model.marketGap, 5);
  els.marketGapSub.textContent =
    marketGapPct === null
      ? "等待 DEX 二级价格"
      : `${model.marketGap >= 0 ? "二级高于回款折算" : "二级低于回款折算"} ${formatSignedPercent(marketGapPct, 2)}`;
  setTone(els.marketGap, model.marketGap || 0, true);
  setTone(els.marketGapSub, model.marketGap || 0, true);

  els.progressValue.textContent = formatPercent(model.recoveredRatio, 2);
  els.progressFill.style.width = `${Math.max(0, Math.min(100, model.recoveredRatio * 100))}%`;
  els.totalNav.textContent = formatUsd(model.totalBackUsd, 0);
  els.navDiscount.textContent = model.navDiscountPct === null ? "--" : formatSignedPercent(model.navDiscountPct, 2);
  setTone(els.navDiscount, model.navDiscountPct || 0);

  els.reserveTotal.textContent = formatUsd(model.totalBackUsd, 0);
  els.marketCap.textContent = "Recovery Basis";
  els.marketLiquidity.textContent = formatUsd(model.totalBackUsd, 0);
  els.marketChangeLarge.textContent = `${formatUsd(model.rwaUsd, 0)} ${model.rwaName}`;
  els.reservePerToken.textContent = formatUsd(model.bankUsd, 0);
  els.flowTotal.textContent = formatUsd(model.bankUsd, 0);

  renderReserves(model.reserves.items || [], model.totalBackUsd, model.rwaName);
  renderFlows(model.bank.items || []);
}

function renderReserves(items, total, rwaName) {
  if (!items.length) {
    els.reserveTable.innerHTML = `<tr><td colspan="3">暂无储备明细</td></tr>`;
    return;
  }

  els.reserveTable.innerHTML = items
    .slice()
    .sort((a, b) => number(b.amount) - number(a.amount))
    .map((item) => {
      const amount = number(item.amount);
      const ratio = total > 0 ? amount / total : 0;
      const isRwa = item.name === rwaName || RWA_NAMES.has(String(item.name || "").toLowerCase());
      return `
        <tr>
          <td>${escapeHtml(item.name || item.currency || "Unknown")}${isRwa ? " (RWA)" : ""}</td>
          <td>${formatUsd(amount, 0)}</td>
          <td>${formatPercent(ratio, 2)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderFlows(items) {
  if (!items.length) {
    els.flowList.innerHTML = `<div class="flow-item loading-row">暂无 bank 流水</div>`;
    return;
  }

  els.flowList.innerHTML = items
    .slice()
    .sort((a, b) => String(b.received_at || "").localeCompare(String(a.received_at || "")))
    .map((item) => {
      const usd = number(item.usd_value || item.amount);
      const original = `${formatNumber(number(item.amount), 0)} ${item.currency || ""}`;
      return `
        <div class="flow-item">
          <span>${escapeHtml(item.received_at || "--")}</span>
          <strong>${formatUsd(usd, 0)}</strong>
          <code title="${escapeHtml(item.reference || "")}">${escapeHtml(original)} | ${escapeHtml(item.reference || "--")}</code>
        </div>
      `;
    })
    .join("");
}

function findRwaItem(items) {
  return items.find((item) => RWA_NAMES.has(String(item.name || "").toLowerCase()));
}

function setStatus(type, label) {
  els.status.textContent = label;
  els.light.classList.remove("ok", "error");
  if (type === "ok") els.light.classList.add("ok");
  if (type === "error") els.light.classList.add("error");
}

function setTone(element, value, positiveIsWarning = false) {
  element.classList.remove("positive", "negative", "risk");
  if (value > 0) {
    element.classList.add(positiveIsWarning ? "positive" : "negative");
  } else if (value < 0) {
    element.classList.add(positiveIsWarning ? "negative" : "risk");
  }
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUsd(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(number(value));
}

function formatSignedUsd(value, digits = 2) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatUsd(value, digits)}`;
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(number(value));
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(number(value));
}

function formatPercent(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(number(value));
}

function formatSignedPercent(value, digits = 2) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPercent(value, digits)}`;
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
