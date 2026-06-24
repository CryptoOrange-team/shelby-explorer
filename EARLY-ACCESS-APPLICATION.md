# Shelby Early Access Application

---

## Project

**Shelby Storage Provider Monitor** — A real-time storage provider monitoring and discovery platform for ShelbyNet.

**Live:** https://shelby-explorer-livid.vercel.app

**GitHub:** https://github.com/CryptoOrange-team/shelby-explorer

---

## 1. What are you building?

A monitoring dashboard for Shelby storage providers (SPs). The official Shelby Explorer shows per-account blob data. This project focuses exclusively on the SP layer — the nodes that run the network.

Storage providers are the backbone of Shelby. They invest in hardware, maintain uptime, and earn revenue from writes and reads. Without them, the network has no storage. But today there is no tool for SPs to be discovered, compared, or monitored.

### What the dashboard does:

**SP Discovery & Comparison**
- Real-time directory of all storage providers on ShelbyNet
- Health scoring algorithm: active slot ratio (60%) + recency (40%)
- Sort by active slots or total capacity
- Search by SP address
- Side-by-side comparison of SP metrics

**SP Detail Pages**
- Full slot assignment history for each SP
- Active / joining / vacated slot breakdown
- Blob inventory per SP (all files stored by that provider)
- Links to on-chain data on Shelby Explorer

**Network-Wide SP Health Overview**
- Total SP count vs active SP count
- Total slots vs active slots
- Health score distribution across all SPs
- Green dot indicator for SPs active within 10 minutes

**SP Discovery Tools**
- Copy SP address to clipboard
- CSV export of all SP data
- Live 30-second auto-refresh

### Why SP monitoring matters

Every mature decentralized storage network has an SP monitoring tool:

- **Filecoin** has Filfox and Beryx — SP rankings, reputation scores, deal tracking
- **Storj** has the SNO Dashboard — per-node earnings, audit scores, uptime monitoring
- **Sia** has Sia Sentinel — host reliability scoring and leaderboards

Shelby has none of this. An SP operator who invests $800/month in hardware has no way to check their node's health relative to the network, no way to be discovered by users, and no public proof of reliability.

### Additional modules

While the dashboard's core focus is SP monitoring, it also includes supporting modules to provide context:

- **Blob Browser** — what's actually being stored on the network (recent, largest, by type)
- **Live Events** — on-chain activity feed showing blob registrations and writes
- **Cost Comparison** — AWS S3 vs Shelby pricing based on actual network data
- **Developer Tools** — REST API, CSV export, SDK quick links

### Data source

All SP data comes from the ShelbyNet Hasura GraphQL indexer. The primary query joins `placement_group_slots` to aggregate per-SP metrics. Growth tracking uses time-range `blobs_aggregate` queries. No database, no caching — every request queries live data.

### Technical stack

Next.js 16 · Tailwind CSS · TypeScript · ShelbyNet GraphQL · Vercel · Open source

---

## 2. Why do you need Early Access?

The dashboard currently operates with a community API key. Official Early Access would provide:

1. **Reliable API access** — documented rate limits, stability guarantees
2. **Richer SP data** — per-SP performance metrics (read latency, uptime history, audit scores) that the current public GraphQL may limit
3. **On-chain SP metadata** — `availability_zone`, IP address, stake amount from `storage_provider_registry` view functions
4. **Geographic distribution** — once zone data is accessible, a real world map of SP locations
5. **Official ecosystem listing** — credibility for SP operators who use the dashboard

---

## 3. What's already built

The dashboard is live and tracking real ShelbyNet data:

- **SP directory** with health scoring, search, sort, detail pages
- **Blob browser** with recent uploads, largest files, file type stats
- **Live events** from on-chain activity
- **Cost comparison** computed from live network data
- **REST API** and CSV export
- **Network topology** visualization

20+ iterations of refinement. Open source.

---

## 4. Roadmap

**Now (with Early Access):**
- Geographic SP distribution map
- Per-SP performance metrics (when on-chain data available)
- SP ranking leaderboard

**Next (1-2 months):**
- SP status change alerts
- Historical SP performance trends
- SP comparison tool

**Later (3-6 months):**
- SDK integration for SP onboarding
- SP earnings estimator
- Multi-network support (testnet + mainnet)
