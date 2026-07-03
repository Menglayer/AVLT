const NAV = 1.0945;
const RWA_NAMES = new Set(["inessa", "rwa"]);
const AVLT_ADDRESS = "0xd0Ee0CF300DFB598270cd7F4D0c6E0D8F6e13f29";
const AVLT_DECIMALS = 6;

const API = {
  reserves: "https://altura-liquidity-dashboard-tan.vercel.app/api/public/reserves",
  bank: "https://altura-liquidity-dashboard-tan.vercel.app/api/public/bank-transactions",
  dex:
    "https://api.dexscreener.com/latest/dex/tokens/0xd0Ee0CF300DFB598270cd7F4D0c6E0D8F6e13f29",
  rpc: "https://rpc.hyperliquid.xyz/evm",
};

const i18n = {
  zh: {
    meta: {
      lang: "zh-CN",
      title: "AVLT 回款看板",
      description: "AVLT 已回款金额、DEX 二级价格、NAV 回款折算价与价差看板。",
    },
    nav: {
      main: "看板导航",
      overview: "概览",
      board: "AVLT 看板",
      proof: "储备证明",
      flows: "流水",
      sources: "数据来源",
      pending: "等待赎回",
    },
    notice: {
      risk: "只做信息展示，不是财务建议",
    },
    top: {
      quickStats: "核心参数",
      supply: "供应量",
      dexPrice: "DEX 价格",
      recovered: "回款比例",
      pending: "等待赎回中 AVLT",
    },
    lang: {
      switch: "语言切换",
    },
    action: {
      refresh: "刷新",
    },
    hero: {
      title: "回款折算价差看板",
      lastUpdate: "最后更新",
    },
    metrics: {
      core: "核心指标",
    },
    metric: {
      recoveredUsd: "已回款金额",
      dexPrice: "AVLT DEX 二级价",
      recoveryPrice: "回款折算价",
      gap: "二级相对差价",
    },
    calc: {
      detail: "计算细节",
      progress: "回款进度",
      totalBack: "总 NAV 口径",
      dexToNav: "距 NAV 折价",
    },
    formula: {
      recovered: "回款金额 = Total Back - RWA(Inessa) + Bank",
      ratio: "回款比例 = 回款金额 / Total Back",
      gap: "差价 = 二级价格 - NAV x 回款比例",
    },
    proof: {
      title: "储备分布",
    },
    basis: {
      title: "口径拆分",
    },
    flows: {
      title: "回款流水",
    },
    table: {
      source: "来源",
      amount: "金额",
      ratio: "占比",
    },
    state: {
      waiting: "等待数据",
      loading: "Loading...",
      loadingData: "加载数据中",
      synced: "DEX 二级价格已同步",
      dexFailed: "Altura 已同步，DEX 价格失败",
      alturaFailed: "Altura 数据读取失败",
      dexUnavailable: "DEX price unavailable",
      noReserves: "暂无储备明细",
      noBankFlows: "暂无 bank 流水",
      waitingDex: "等待 DEX 二级价格",
      recoveryRatio: "回款比例",
      totalBack: "total back",
      bankFlows: "笔 bank 流水",
      aboveRecovery: "二级高于回款折算",
      belowRecovery: "二级低于回款折算",
      recoveryBasis: "回款口径",
    },
  },
  en: {
    meta: {
      lang: "en",
      title: "AVLT Recovery Dashboard",
      description: "AVLT recovered amount, DEX price, NAV recovery value and price gap dashboard.",
    },
    nav: {
      main: "Dashboard navigation",
      overview: "Overview",
      board: "AVLT Board",
      proof: "Proof",
      flows: "Flows",
      sources: "Sources",
      pending: "Pending",
    },
    notice: {
      risk: "For information only. Not financial advice.",
    },
    top: {
      quickStats: "Quick stats",
      supply: "Supply",
      dexPrice: "DEX Price",
      recovered: "Recovered",
      pending: "Pending AVLT",
    },
    lang: {
      switch: "Language switch",
    },
    action: {
      refresh: "Refresh",
    },
    hero: {
      title: "Recovery Price Gap Dashboard",
      lastUpdate: "Last update",
    },
    metrics: {
      core: "Core metrics",
    },
    metric: {
      recoveredUsd: "Recovered amount",
      dexPrice: "AVLT DEX price",
      recoveryPrice: "Recovery price",
      gap: "Secondary market gap",
    },
    calc: {
      detail: "Calculation detail",
      progress: "Recovery progress",
      totalBack: "Total NAV basis",
      dexToNav: "DEX to NAV discount",
    },
    formula: {
      recovered: "Recovered amount = Total Back - RWA(Inessa) + Bank",
      ratio: "Recovery ratio = Recovered amount / Total Back",
      gap: "Gap = Secondary price - NAV x Recovery ratio",
    },
    proof: {
      title: "Reserve distribution",
    },
    basis: {
      title: "Basis breakdown",
    },
    flows: {
      title: "Recovery flows",
    },
    table: {
      source: "Source",
      amount: "Amount",
      ratio: "Ratio",
    },
    state: {
      waiting: "Waiting for data",
      loading: "Loading...",
      loadingData: "Loading data",
      synced: "DEX secondary price synced",
      dexFailed: "Altura synced, DEX price failed",
      alturaFailed: "Altura data failed",
      dexUnavailable: "DEX price unavailable",
      noReserves: "No reserve details",
      noBankFlows: "No bank flows",
      waitingDex: "Waiting for DEX secondary price",
      recoveryRatio: "Recovery ratio",
      totalBack: "total back",
      bankFlows: "bank flows",
      aboveRecovery: "Secondary price above recovery value",
      belowRecovery: "Secondary price below recovery value",
      recoveryBasis: "Recovery basis",
    },
  },
};

const els = {
  status: document.querySelector("#source-status"),
  light: document.querySelector(".status-light"),
  refresh: document.querySelector("#refresh-button"),
  langButtons: document.querySelectorAll(".lang-btn"),
  topSupply: document.querySelector("#top-supply"),
  topPrice: document.querySelector("#top-price"),
  topRatio: document.querySelector("#top-ratio"),
  topNav: document.querySelector("#top-nav"),
  topPending: document.querySelector("#top-pending"),
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

let currentLang = getInitialLang();
let currentModel = null;

applyLanguage(currentLang);
els.topNav.textContent = formatUsd(NAV, 4);
els.refresh.addEventListener("click", loadData);
els.langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.lang);
  });
});

loadData();

async function loadData() {
  setStatus("loading", t("state.loadingData"));
  els.refresh.disabled = true;

  try {
    const [reserves, bank, market, pendingRedemption] = await Promise.all([
      fetchJson(API.reserves),
      fetchJson(API.bank),
      fetchDexMarket().catch((error) => ({
        error: error?.message || "DEX price unavailable",
      })),
      fetchPendingRedemptionAvlt().catch((error) => ({
        error: error?.message || "Pending AVLT unavailable",
      })),
    ]);

    currentModel = buildModel({ reserves, bank, market, pendingRedemption });
    render(currentModel);
    setStatus(market.error ? "error" : "ok", market.error ? t("state.dexFailed") : t("state.synced"));
  } catch (error) {
    console.error(error);
    setStatus("error", t("state.alturaFailed"));
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

async function fetchPendingRedemptionAvlt() {
  const balanceCall = `0x70a08231000000000000000000000000${AVLT_ADDRESS.slice(2).toLowerCase()}`;
  const response = await fetch(API.rpc, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: AVLT_ADDRESS,
          data: balanceCall,
        },
        "latest",
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`HyperEVM RPC HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.error || !data.result) {
    throw new Error(data.error?.message || "HyperEVM RPC result missing");
  }

  return {
    raw: data.result,
    amount: formatUnits(data.result, AVLT_DECIMALS),
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

function buildModel({ reserves, bank, market, pendingRedemption }) {
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
    pendingRedemption,
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
  els.topNav.textContent = formatUsd(NAV, 4);
  els.topPending.textContent = model.pendingRedemption?.error
    ? "--"
    : `${formatNumber(number(model.pendingRedemption?.amount), 2)} AVLT`;
  els.updatedAt.textContent = formatDate(model.updatedAt);

  els.recoveredUsd.textContent = formatUsd(model.recoveredUsd, 0);
  els.recoveredCount.textContent = `Total Back - RWA + Bank | ${flowCount} ${t("state.bankFlows")}`;

  els.marketPrice.textContent = model.hasMarketPrice ? formatUsd(model.marketPrice, 5) : "--";
  els.marketChange.textContent = model.hasMarketPrice
    ? `${String(model.market.dexId || "DEX").toUpperCase()}/${model.market.quoteSymbol || "USD"} · 24H ${formatSignedPercent(change24h / 100, 2)}`
    : t("state.dexUnavailable");
  setTone(els.marketChange, change24h);

  els.recoveryPrice.textContent = formatUsd(model.recoveryPrice, 5);
  els.recoveryRatio.textContent = `${t("state.recoveryRatio")} ${formatPercent(model.recoveredRatio, 2)} of ${t("state.totalBack")}`;

  els.marketGap.textContent = model.marketGap === null ? "--" : formatSignedUsd(model.marketGap, 5);
  els.marketGapSub.textContent =
    marketGapPct === null
      ? t("state.waitingDex")
      : `${model.marketGap >= 0 ? t("state.aboveRecovery") : t("state.belowRecovery")} ${formatSignedPercent(marketGapPct, 2)}`;
  setTone(els.marketGap, model.marketGap || 0, true);
  setTone(els.marketGapSub, model.marketGap || 0, true);

  els.progressValue.textContent = formatPercent(model.recoveredRatio, 2);
  els.progressFill.style.width = `${Math.max(0, Math.min(100, model.recoveredRatio * 100))}%`;
  els.totalNav.textContent = formatUsd(model.totalBackUsd, 0);
  els.navDiscount.textContent = model.navDiscountPct === null ? "--" : formatSignedPercent(model.navDiscountPct, 2);
  setTone(els.navDiscount, model.navDiscountPct || 0);

  els.reserveTotal.textContent = formatUsd(model.totalBackUsd, 0);
  els.marketCap.textContent = t("state.recoveryBasis");
  els.marketLiquidity.textContent = formatUsd(model.totalBackUsd, 0);
  els.marketChangeLarge.textContent = `${formatUsd(model.rwaUsd, 0)} ${model.rwaName}`;
  els.reservePerToken.textContent = formatUsd(model.bankUsd, 0);
  els.flowTotal.textContent = formatUsd(model.bankUsd, 0);

  renderReserves(model.reserves.items || [], model.totalBackUsd, model.rwaName);
  renderFlows(model.bank.items || []);
}

function renderReserves(items, total, rwaName) {
  if (!items.length) {
    els.reserveTable.innerHTML = `<tr><td colspan="3">${t("state.noReserves")}</td></tr>`;
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
    els.flowList.innerHTML = `<div class="flow-item loading-row">${t("state.noBankFlows")}</div>`;
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

function setLanguage(lang) {
  if (!i18n[lang] || lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem("avlt-lang", lang);
  applyLanguage(lang);
  if (currentModel) {
    render(currentModel);
    setStatus(currentModel.market.error ? "error" : "ok", currentModel.market.error ? t("state.dexFailed") : t("state.synced"));
  }
}

function applyLanguage(lang) {
  const dict = i18n[lang];
  document.documentElement.lang = dict.meta.lang;
  document.title = dict.meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", dict.meta.description);

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = getMessage(node.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", getMessage(node.dataset.i18nAria));
  });

  els.langButtons.forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function getInitialLang() {
  const saved = localStorage.getItem("avlt-lang");
  if (saved && i18n[saved]) return saved;
  return navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function getMessage(key) {
  return key.split(".").reduce((value, part) => value?.[part], i18n[currentLang]) || key;
}

function t(key) {
  return getMessage(key);
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

function formatUnits(hexValue, decimals) {
  const value = BigInt(hexValue);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return Number(`${whole.toString()}${fractionText ? `.${fractionText}` : ""}`);
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
  return new Intl.DateTimeFormat(currentLang === "zh" ? "zh-CN" : "en-US", {
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
