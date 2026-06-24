# ShelbyNet Analytics — Design Spec

## Context

The official Shelby Explorer (explorer.shelby.xyz) already covers SP listing, blob browsing, and event feeds. ShelbyNet Explorer pivots to an analytics layer — no raw data browsing, only aggregation, trends, and insights.

## Users

- SP operators: check node health ranking, slot performance
- Investors/researchers: network growth, storage trends, cost analysis
- Developers: API access, SDK quickstart, cost estimation

## Architecture

Three tabs, each a server-rendered page section with no client-side routing:

### Tab 1: SP Operators

**Summary row**: `{activeSPs}/{totalSPs} SPs · {slots} slots · avg health {N}/100`

**SP ranking table**:
- Rank, address (green dot if <10min active), health score (0-100, color-coded), active/join/vacated slots, active rate bar, last seen
- Sort: health / active slots / total slots
- Search by address
- CSV export

**SP detail page** (`/providers/[addr]`):
- Address, health score
- Slot stats (active/join/vacated counts)
- Slot history list

### Tab 2: Network Analytics

**Summary**: `{blobCount} blobs · {totalSize} · {ops} ops`
**Growth**: 24h +{dayBlobs} · 7d +{weekBlobs}
**Growth bar**: early / 7d / 24h three-segment progress bar
**File types**: breakdown by category (video/image/doc/archive/other)
**Cost comparison**: AWS vs Shelby 3-column with live network data

### Tab 3: Developers

**REST API**: endpoint codes, JSON example
**SDK install**: npm commands for 4 packages
**Links**: docs, github, discord, developers portal
**Network info**: ShelbyNet description

## Data

All from ShelbyNet GraphQL indexer. `cache: no-store`. Dynamic rendering.

## Tech

Next.js 16 + Tailwind + TypeScript. Official Shelby Explorer design language (system fonts, blue links, clean borders).
