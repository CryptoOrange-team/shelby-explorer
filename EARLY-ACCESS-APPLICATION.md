# Shelby Early Access Application

---

## Project

**ShelbyNet Explorer** — A real-time network observability dashboard for the Shelby decentralized hot storage protocol.

**Live:** https://shelby-explorer-livid.vercel.app

**GitHub:** https://github.com/CryptoOrange-team/shelby-explorer

---

## 1. What are you building?

A network-level explorer and monitoring dashboard for ShelbyNet. Unlike the official Shelby Explorer (which shows per-account data), this project provides the ecosystem-level view: all storage providers, all blobs, all on-chain events, aggregated and searchable in one place.

### Current modules (all live, all querying real ShelbyNet data):

**Storage Provider Directory**
- Real-time SP list with health scoring algorithm (active slot ratio × 60% + recency × 40%)
- Sort by active slots or total capacity
- Search by address
- Individual SP detail pages showing full slot assignment history
- Zebra-stripe rows, green dot indicators for SPs active within 10 minutes
- Copy-to-clipboard for addresses
- CSV export

**Blob Browser**
- Recent uploads (30 most recent, by `created_at` descending)
- Largest blobs (top 50, by `size` descending)
- Blob status tracking: active / writing / expiring / deleted
- File type breakdown: video, image, document, archive, other — with size aggregation
- Individual blob detail pages with full metadata: owner, size, chunksets, created, expires, placement group, slice address
- Per-owner pages showing all blobs belonging to any address

**Live Event Feed**
- On-chain blob activities: `BlobRegistered`, `BlobWritten`, `BlobDeleted` events
- Timestamp, event type, blob name, and owner address for each event
- Clickable blob names and owner links

**Cost Comparison**
- Real-time AWS S3 vs Shelby cost estimate, computed from actual network data
- Formula: `(total_size_gb × $0.073/GB) vs (total_size_gb × $0.024/GB)`
- Growth tracking: 24-hour and 7-day blob volume with percentage breakdown

**Network Topology Map**
- SVG radial diagram with concentric rings representing network layers
- SP nodes positioned by active slot count, with size proportional to capacity
- Mesh lines showing inter-SP connections
- Interactive hover tooltips with SP details

**Developer Tools**
- REST API: `GET /api/network-stats` returns JSON with full SP list, health scores, growth data
- CSV export: single-click download of all SP data
- Quick links to official docs, GitHub, Discord, and SDK installation commands

### Data sources

All data comes from the **ShelbyNet Hasura GraphQL indexer** (`api.shelbynet.aptoslabs.com`). Queries include:

- `placement_group_slots` — SP slot assignments, status, timestamps
- `blobs` — full blob metadata with aggregation (count, size sum)
- `blob_activities` — on-chain event log
- `processor_status` — indexer health check
- Time-range aggregates for growth tracking (24h, 7d windows)

The dashboard queries live on every request (`cache: no-store`). No database, no caching layer, no data modification.

### Technical stack

- **Framework:** Next.js 16 (App Router, server components, dynamic rendering)
- **Styling:** Tailwind CSS with custom design tokens (light/dark theme via CSS variables)
- **Typography:** Atkinson Hyperlegible Next (body) + JetBrains Mono (data)
- **Data:** ShelbyNet Hasura GraphQL (POST with Bearer token auth)
- **Deployment:** Vercel (automatic CI/CD from GitHub)
- **License:** Open source (MIT)

---

## 2. What problem does this solve?

ShelbyNet currently has no public network-level dashboard. This creates concrete problems for three user groups:

**Storage Providers** invest significant capital in hardware (a medium SP configuration runs ~$800/month). They have no way to:
- Be discovered by potential users
- Compare their performance against other SPs
- Demonstrate reliability to the network
- Monitor their own slot health in context

**Users and developers** have no way to:
- Browse what's stored on the network
- Compare storage providers before choosing where to store data
- Quickly check if the network is healthy before building on it
- Understand network growth trends

**The Shelby ecosystem** lacks:
- A public health dashboard (every major protocol has one — Filecoin has Filfox, Storj has SNO dashboards)
- A tool to onboard new SPs (showing them the network exists and is active)
- A demonstration of network adoption (32M blobs, 3.2 PB stored — but nobody can see this)

The official `explorer.shelby.xyz/shelbynet` shows per-account data. This project fills the gap by providing the network-level observability layer.

---

## 3. Why do you need Early Access?

The project already operates using a community-discovered API key to query the ShelbyNet GraphQL indexer. This works but has limitations:

1. **No guaranteed rate limits** — the current setup could break if traffic increases or the key rotates
2. **Limited data** — the public GraphQL endpoint exposes `placement_group_slots` but not per-SP performance metrics (read latency, audit scores, uptime history)
3. **No geographic data** — SP `availability_zone` data exists on-chain but is not exposed through the current GraphQL schema
4. **No official recognition** — being listed as an ecosystem project gives credibility to both the dashboard and the network

With official Early Access, we would:

- Upgrade to a reliable API key with documented rate limits
- Expose per-SP performance metrics when the data becomes available
- Add geographic distribution using on-chain `availability_zone` data
- Build SP alerting (status changes, slot health degradation)
- Integrate with the Shelby SDK for in-dashboard blob management
- Serve as a community reference implementation for ShelbyNet data access

---

## 4. What have you already built?

The dashboard is fully functional and deployed. Current network snapshot from live data:

- **32,184,372 blobs** tracked
- **3.2 petabytes** total storage (3,623,155,297,746,718 bytes)
- **83,639,870** on-chain operations
- **Active storage providers** with real-time health monitoring
- **1.2 million blobs** added in the last 24 hours (~276 GB)

The codebase has gone through 20+ iterations of refinement — starting from a simple SP table, adding blob browsing, event feeds, topology maps, developer tools, and responsive design. Each iteration was driven by actually using the dashboard to explore ShelbyNet data.

---

## 5. What's the roadmap?

**Immediate (with Early Access):**
- SP performance metrics (when on-chain data becomes available)
- Geographic distribution map using availability zone data
- Dark/light theme persistence

**Short-term (1-2 months):**
- SP status change alerts (email/webhook)
- Blob search by name
- Owner activity timeline

**Medium-term (3-6 months):**
- Shelby SDK integration for direct blob upload/download from the dashboard
- SP comparison tool (side-by-side metrics)
- Historical trend charts (daily/weekly/monthly storage growth)

---

## 6. Why this matters for Shelby

Every successful decentralized storage network has a public dashboard. Filecoin has Filfox and Beryx. Storj has the SNO dashboard and Grafana templates. Walrus has the Staketab explorer.

ShelbyNet currently stores 3.2 PB across 32 million blobs — real adoption that nobody can see. This project makes that adoption visible. It gives SPs a reason to join (they can be discovered). It gives users confidence (they can see the network is alive). It gives developers a reference for how to query ShelbyNet data.

The dashboard is already live and working. Early Access support would make it official, reliable, and more capable.
