const SNAPSHOT_URL = "./data/snapshot.json";
const NAV = 1.0945;
const embeddedSnapshot = window.__AVLT_SNAPSHOT__;

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
els.refresh.addEventListener("click", () => loadSnapshot(true));

if (embeddedSnapshot) {
  render(embeddedSnapshot);
  setStatus("ok", "快照已加载");
}

if (window.location.protocol !== "file:" || !embeddedSnapshot) {
  loadSnapshot();
}

async function loadSnapshot(force = false) {
  setStatus("loading", "加载数据中");
  els.refresh.disabled = true;

  try {
    const url = force ? `${SNAPSHOT_URL}?t=${Date.now()}` : SNAPSHOT_URL;
    const response = await fetch(url, { cache: force ? "reload" : "no-store" });
    if (!response.ok) {
      throw new Error(`Snapshot HTTP ${response.status}`);
    }
    const snapshot = await response.json();
    render(snapshot);
    setStatus("ok", "数据已同步");
  } catch (error) {
    if (embeddedSnapshot) {
      render(embeddedSnapshot);
      setStatus("ok", "使用内置快照");
    } else {
      console.error(error);
      setStatus("error", "数据读取失败");
    }
  } finally {
    els.refresh.disabled = false;
  }
}

function render(snapshot) {
  const nav = Number(snapshot.nav || NAV);
  const supply = readNumber(snapshot, "reserves.supply");
  const reserveUsd = readNumber(snapshot, "reserves.reserves");
  const incomingUsd = readNumber(snapshot, "recovery.totalIncomingUsd");
  const price = readNumber(snapshot, "market.price");
  const marketCap = readNumber(snapshot, "market.marketCap");
  const liquidity = readNumber(snapshot, "market.liquidity");
  const change24h = readNumber(snapshot, "market.priceChange24H");
  const flowCount = Number(readValue(snapshot, "recovery.count") || 0);

  const totalNavUsd = supply * nav;
  const recoveredRatio = totalNavUsd > 0 ? incomingUsd / totalNavUsd : 0;
  const recoveryPrice = nav * recoveredRatio;
  const marketGap = price - recoveryPrice;
  const marketGapPct = recoveryPrice > 0 ? marketGap / recoveryPrice : 0;
  const navGapPct = nav > 0 ? price / nav - 1 : 0;
  const reservePerToken = supply > 0 ? reserveUsd / supply : 0;

  els.topSupply.textContent = formatCompact(supply);
  els.topPrice.textContent = formatUsd(price, 4);
  els.topRatio.textContent = formatPercent(recoveredRatio, 2);
  els.updatedAt.textContent = formatDate(snapshot.updatedAt);

  els.recoveredUsd.textContent = formatUsd(incomingUsd, 0);
  els.recoveredCount.textContent = `${flowCount} 笔入账流水`;

  els.marketPrice.textContent = formatUsd(price, 5);
  els.marketChange.textContent = `24H ${formatSignedPercent(change24h / 100, 2)}`;
  setTone(els.marketChange, change24h);

  els.recoveryPrice.textContent = formatUsd(recoveryPrice, 5);
  els.recoveryRatio.textContent = `已回款比例 ${formatPercent(recoveredRatio, 2)}`;

  els.marketGap.textContent = formatSignedUsd(marketGap, 5);
  els.marketGapSub.textContent = `${marketGap >= 0 ? "二级高于回款折算" : "二级低于回款折算"} ${formatSignedPercent(marketGapPct, 2)}`;
  setTone(els.marketGap, marketGap, true);
  setTone(els.marketGapSub, marketGap, true);

  els.progressValue.textContent = formatPercent(recoveredRatio, 2);
  els.progressFill.style.width = `${Math.max(0, Math.min(100, recoveredRatio * 100))}%`;
  els.totalNav.textContent = formatUsd(totalNavUsd, 0);
  els.navDiscount.textContent = formatSignedPercent(navGapPct, 2);
  setTone(els.navDiscount, navGapPct);

  els.reserveTotal.textContent = formatUsd(reserveUsd, 0);
  els.marketCap.textContent = formatUsd(marketCap, 0);
  els.marketLiquidity.textContent = formatUsd(liquidity, 0);
  els.marketChangeLarge.textContent = formatSignedPercent(change24h / 100, 2);
  setTone(els.marketChangeLarge, change24h);
  els.reservePerToken.textContent = formatUsd(reservePerToken, 4);
  els.flowTotal.textContent = formatUsd(incomingUsd, 0);

  renderReserves(snapshot.reserves?.items || [], reserveUsd);
  renderFlows(snapshot.recovery?.items || []);
}

function renderReserves(items, total) {
  if (!items.length) {
    els.reserveTable.innerHTML = `<tr><td colspan="3">暂无储备明细</td></tr>`;
    return;
  }

  els.reserveTable.innerHTML = items
    .slice()
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .map((item) => {
      const amount = Number(item.amount || 0);
      const ratio = total > 0 ? amount / total : 0;
      return `
        <tr>
          <td>${escapeHtml(item.name || item.currency || "Unknown")}</td>
          <td>${formatUsd(amount, 0)}</td>
          <td>${formatPercent(ratio, 2)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderFlows(items) {
  if (!items.length) {
    els.flowList.innerHTML = `<div class="flow-item loading-row">暂无回款流水</div>`;
    return;
  }

  els.flowList.innerHTML = items
    .slice()
    .sort((a, b) => String(b.received_at || "").localeCompare(String(a.received_at || "")))
    .map((item) => {
      const usd = Number(item.usd_value || item.amount || 0);
      const original = `${formatNumber(Number(item.amount || 0), 0)} ${item.currency || ""}`;
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

function readValue(target, path) {
  return path.split(".").reduce((value, key) => value?.[key], target);
}

function readNumber(target, path) {
  const value = Number(readValue(target, path));
  return Number.isFinite(value) ? value : 0;
}

function formatUsd(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatSignedUsd(value, digits = 2) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatUsd(value, digits)}`;
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
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
