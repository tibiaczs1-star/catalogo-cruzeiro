const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT_DIR, "docs", "commercial", "research", "czs-premium-corpus-2026-06-01.csv");

const TARGETS = {
  newspaper_landing: 500,
  technology_landing: 500,
  newspaper_media_kit_report: 1000,
  website_sales_report: 1000
};

const NEWSHOMEPAGES_SITES =
  "https://raw.githubusercontent.com/palewire/news-homepages/main/newshomepages/sources/sites.csv";

const TECH_SITEMAPS = [
  "https://www.lapa.ninja/sitemap-posts.xml",
  "https://landdding.com/l/sitemap.xml",
  "https://www.saasframe.io/sitemap.xml",
  "https://www.landingfolio.com/sitemap.xml"
];

const MEDIA_KIT_PATHS = [
  "advertise",
  "media-kit",
  "advertising",
  "advertise-with-us",
  "sponsorship",
  "sponsorships",
  "partner",
  "partners"
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      i += 1;
      continue;
    }
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function parseCsv(raw) {
  const lines = raw.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function normalizeUrl(url) {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.search = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  return parsed.toString().replace(/\/$/, "");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CZS commercial research collector/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.text();
}

function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

function addUnique(rows, seen, row) {
  const key = `${row.category}:${normalizeUrl(row.url)}`;
  if (seen.has(key)) return false;
  seen.add(key);
  rows.push(row);
  return true;
}

function sourceGroupForTech(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host === "lapa.ninja") return "lapa_ninja_sitemap";
  if (host === "landdding.com") return "landdding_sitemap";
  if (host === "saasframe.io") return "saasframe_sitemap";
  if (host === "landingfolio.com") return "landingfolio_sitemap";
  return host.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
}

async function collectNewspaperLanding(rows, seen) {
  const sites = parseCsv(await fetchText(NEWSHOMEPAGES_SITES));
  const selected = [];

  for (const site of sites.filter((item) => item.url && item.name)) {
    if (selected.length >= TARGETS.newspaper_landing) break;
    const id = `NL-${String(selected.length + 1).padStart(4, "0")}`;
    const added = addUnique(rows, seen, {
      id,
      category: "newspaper_landing",
      source_group: "newshomepages_sites_csv",
      url: site.url,
      title: site.name,
      type: "news_homepage",
      region: site.country || site.location || "global",
      notes: `NewsHomepages source: ${site.location || "location unknown"}; language ${site.language || "unknown"}`,
      visual_patterns: "editorial hierarchy; live news surface; source and timestamp discipline",
      sales_patterns: "audience trust; local authority; daily attention inventory",
      czs_relevance: site.country === "BR" || site.language === "pt" ? "alta" : "media",
      status: "collected"
    });
    if (added) selected.push(site);
  }
  return sites;
}

async function collectTechnologyLanding(rows, seen) {
  const urls = [];
  for (const sitemap of TECH_SITEMAPS) {
    const locs = sitemapLocs(await fetchText(sitemap));
    for (const loc of locs) {
      const normalized = normalizeUrl(loc);
      if (normalized.includes("/pricing") || normalized.includes("/privacy") || normalized.includes("/terms")) continue;
      urls.push(normalized);
    }
  }

  const selected = [...new Set(urls)].filter((url) => {
    const host = new URL(url).hostname;
    if (host.includes("lapa.ninja")) return url.includes("/post/");
    if (host.includes("landdding.com")) return url.includes("/l/");
    if (host.includes("saasframe.io")) return url.includes("/websites/") || url.includes("/saas/");
    if (host.includes("landingfolio.com")) return url.includes("/inspiration/");
    return true;
  }).slice(0, TARGETS.technology_landing);

  selected.forEach((url, index) => {
    addUnique(rows, seen, {
      id: `TL-${String(index + 1).padStart(4, "0")}`,
      category: "technology_landing",
      source_group: sourceGroupForTech(url),
      url,
      title: new URL(url).pathname.split("/").filter(Boolean).pop() || new URL(url).hostname,
      type: "landing_reference",
      region: "global",
      notes: "Collected from design/landing inspiration sitemap for visual benchmark",
      visual_patterns: "product proof; typography; motion; conversion hierarchy",
      sales_patterns: "CTA clarity; proof blocks; feature-to-value translation",
      czs_relevance: "media",
      status: "collected"
    });
  });
}

function collectMediaKitCandidates(rows, seen) {
  const newspaperRows = rows.filter((row) => row.category === "newspaper_landing");
  let count = 0;

  for (const site of newspaperRows) {
    const base = new URL(site.url);
    for (const mediaPath of MEDIA_KIT_PATHS) {
      if (count >= TARGETS.newspaper_media_kit_report) return;
      const url = new URL(`/${mediaPath}/`, base.origin).toString();
      const added = addUnique(rows, seen, {
        id: `MK-${String(count + 1).padStart(4, "0")}`,
        category: "newspaper_media_kit_report",
        source_group: "newshomepages_media_kit_candidate",
        url,
        title: `${site.title} ${mediaPath}`,
        type: "candidate_advertising_page",
        region: site.region,
        notes: `Generated from verified NewsHomepages publisher homepage ${site.url}; requires live review before design citation`,
        visual_patterns: "media kit; rate card; audience data; ad formats",
        sales_patterns: "advertiser CTA; sponsorship packages; local reach proof",
        czs_relevance: "alta",
        status: "candidate_unverified"
      });
      if (added) count += 1;
    }
  }
}

async function collectWebsiteSalesReports(rows, seen) {
  let count = 0;
  let page = 1;

  while (count < TARGETS.website_sales_report && page <= 20) {
    const endpoint =
      `https://api.empireflippers.com/api/v1/listings/list?page=${page}&limit=100&listing_status=Sold&sort=sold_at&order=DESC`;
    const payload = JSON.parse(await fetchText(endpoint));
    const listings = payload.data && Array.isArray(payload.data.listings) ? payload.data.listings : [];
    if (!listings.length) break;

    for (const listing of listings) {
      if (count >= TARGETS.website_sales_report) break;
      const url = `https://empireflippers.com/listing/${listing.listing_number}/`;
      addUnique(rows, seen, {
        id: `WS-${String(count + 1).padStart(4, "0")}`,
        category: "website_sales_report",
        source_group: "empire_flippers_sold_api",
        url,
        title: listing.public_title || `Empire Flippers listing ${listing.listing_number}`,
        type: "sold_business_listing",
        region: (listing.countries || []).join("|") || listing.country || "global",
        notes:
          `price=${listing.listing_price}; net_profit=${listing.average_monthly_net_profit}; ` +
          `gross_revenue=${listing.average_monthly_gross_revenue}; multiple=${listing.listing_multiple}`,
        visual_patterns: "valuation table; metrics; risks; opportunities; proof of sale",
        sales_patterns: "profit multiple; margin; growth trend; risk disclosure",
        czs_relevance: "alta",
        status: "collected"
      });
      count += 1;
    }
    page += 1;
  }
}

async function main() {
  const rows = [];
  const seen = new Set();

  const sites = await collectNewspaperLanding(rows, seen);
  await collectTechnologyLanding(rows, seen);
  collectMediaKitCandidates(rows, seen, sites);
  await collectWebsiteSalesReports(rows, seen);

  const headers = [
    "id",
    "category",
    "source_group",
    "url",
    "title",
    "type",
    "region",
    "notes",
    "visual_patterns",
    "sales_patterns",
    "czs_relevance",
    "status"
  ];

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const output = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
  fs.writeFileSync(OUT_PATH, `${output}\n`, "utf8");

  const byCategory = rows.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({ output: OUT_PATH, totalRows: rows.length, byCategory }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
