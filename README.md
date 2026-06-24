# ShelbyNet Explorer

Real-time network dashboard for the [Shelby](https://shelby.xyz) decentralized hot storage protocol. Monitors ShelbyNet — the public testnet co-developed by Aptos Labs and Jump Crypto.

**Live:** [shelby-explorer-livid.vercel.app](https://shelby-explorer-livid.vercel.app)

## What it shows

- **Storage Providers** — directory with health scores, slot counts, search, sort, detail pages
- **Blob Browser** — recent uploads, largest blobs, file type breakdown, blob detail pages
- **Live Events** — on-chain feed (registrations, writes, deletions)
- **Cost Comparison** — AWS S3 vs Shelby estimate from live network data
- **Network Topology** — SVG radial map of SP nodes
- **REST API** — `GET /api/network-stats`, `GET /api/export-sp`

## Current network stats

~32M blobs · 3.2 PB stored · 83M operations · active SP nodes with real-time health monitoring

## Stack

Next.js 16 · Tailwind CSS · TypeScript · ShelbyNet Hasura GraphQL · Vercel

## Data

All data queried live from the public ShelbyNet GraphQL indexer. No caching, no proxying, no modification.

## About

Independent community project. Not affiliated with Aptos Labs or Jump Crypto.
