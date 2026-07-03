import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NAV = 1.0945;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "data", "snapshot.json");
const JS_OUTPUT = path.join(ROOT, "data", "snapshot.js");

const sources = {
  alturaProofOfReserves: "https://app.altura.trade/proof-of-reserves",
  alturaReservesApi: "https://altura-liquidity-dashboard-tan.vercel.app/api/public/reserves",
  alturaBankTransactionsApi:
    "https://altura-liquidity-dashboard-tan.vercel.app/api/public/bank-transactions",
  okxTokenPage:
    "https://web3.okx.com/zh-hans/token/hyper/0xd0ee0cf300dfb598270cd7f4d0c6e0d8f6e13f29",
};

const [reserves, recovery, okxHtml] = await Promise.all([
  fetchJson(sources.alturaReservesApi),
  fetchJson(sources.alturaBankTransactionsApi),
  fetchText(sources.okxTokenPage),
]);

const market = parseOkxMarket(okxHtml);
const calculations = calculate({
  nav: NAV,
  supply: Number(reserves.supply || 0),
  incomingUsd: Number(recovery.totalIncomingUsd || 0),
  price: Number(market.price || 0),
  reserveUsd: Number(reserves.reserves || 0),
});

const snapshot = {
  updatedAt: new Date().toISOString(),
  nav: NAV,
  sources,
  market,
  reserves,
  recovery,
  calculations,
};

await mkdir(path.dirname(OUTPUT), { recursive: true });
await writeFile(`${OUTPUT}.tmp`, `${JSON.stringify(snapshot, null, 2)}\n`);
await rename(`${OUTPUT}.tmp`, OUTPUT);
await writeFile(
  `${JS_OUTPUT}.tmp`,
  `window.__AVLT_SNAPSHOT__ = ${JSON.stringify(snapshot, null, 2)};\n`,
);
await rename(`${JS_OUTPUT}.tmp`, JS_OUTPUT);

console.log(`Updated ${path.relative(ROOT, OUTPUT)}`);
console.log(`Updated ${path.relative(ROOT, JS_OUTPUT)}`);
console.log(`AVLT market price: ${market.price}`);
console.log(`Recovered USD: ${recovery.totalIncomingUsd}`);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": userAgent(),
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "user-agent": userAgent(),
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return response.text();
}

function parseOkxMarket(html) {
  const titlePrice = matchNumber(html, /<title>\s*AVLT\s+\$([0-9.]+)/i);
  const metaPrice = matchNumber(html, /实时价格为\s*\$([0-9.]+)/i);
  const embeddedPrice = matchNumber(html, /"price":"([0-9.]+)"/);

  return {
    price: embeddedPrice || titlePrice || metaPrice || 0,
    marketCap: matchNumber(html, /"marketCap":"([0-9.]+)"/),
    liquidity: matchNumber(html, /"liquidity":"([0-9.]+)"/),
    priceChange5M: matchNumber(html, /"priceChange5M":"(-?[0-9.]+)"/),
    priceChange1H: matchNumber(html, /"priceChange1H":"(-?[0-9.]+)"/),
    priceChange4H: matchNumber(html, /"priceChange4H":"(-?[0-9.]+)"/),
    priceChange24H: matchNumber(html, /"priceChange24H":"(-?[0-9.]+)"/),
  };
}

function calculate({ nav, supply, incomingUsd, price, reserveUsd }) {
  const totalNav = supply * nav;
  const recoveredRatio = totalNav > 0 ? incomingUsd / totalNav : 0;
  const recoveryPrice = nav * recoveredRatio;
  const marketGap = price - recoveryPrice;
  const marketGapPctVsRecovery = recoveryPrice > 0 ? marketGap / recoveryPrice : 0;
  const marketGapPctVsMarket = price > 0 ? marketGap / price : 0;
  const navDiscountPct = nav > 0 ? price / nav - 1 : 0;
  const reservePerToken = supply > 0 ? reserveUsd / supply : 0;

  return {
    totalNav,
    recoveredRatio,
    recoveryPrice,
    marketGap,
    marketGapPctVsRecovery,
    marketGapPctVsMarket,
    navDiscountPct,
    reservePerToken,
  };
}

function matchNumber(value, pattern) {
  const match = value.match(pattern);
  if (!match) return 0;
  const number = Number(match[1]);
  return Number.isFinite(number) ? number : 0;
}

function userAgent() {
  return "Mozilla/5.0 AVLT-Recovery-Dashboard/1.0";
}
