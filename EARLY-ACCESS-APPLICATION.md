# Shelby Early Access Application

## Project Name

ShelbyNet Explorer

## Live URL

https://shelby-explorer-livid.vercel.app

## GitHub

https://github.com/CryptoOrange-team/shelby-explorer

---

## What are you building?

A real-time network observability dashboard for ShelbyNet. It aggregates data from the ShelbyNet indexer and presents it as a browsable explorer — storage provider directory, blob browser, live event feed, and cost comparison tool.

Currently tracking ~32 million blobs, 3.2 PB of stored data, and all active storage provider nodes with health scoring.

## What problem does it solve?

ShelbyNet currently has no public dashboard for network visibility. Storage providers invest in hardware but have no way to be discovered. Users have no way to browse what's stored on the network or compare providers. Developers lack a quick way to check network health.

The official Shelby Explorer shows individual account data. This project fills the gap — it provides the network-level view that the ecosystem currently lacks.

## Why do you need Early Access?

The project already uses a community API key to query the ShelbyNet GraphQL indexer. Early Access would provide:

1. Official API access with reliable rate limits
2. The ability to display uptime/performance metrics per storage provider
3. Access to on-chain SP metadata (availability zones, IP addresses) currently unavailable through the public GraphQL endpoint
4. The credibility to be listed as an official ecosystem project

## Technical approach

- Next.js 16 with server-side rendering
- Data sourced from ShelbyNet Hasura GraphQL indexer
- No database — all data queried live, no caching
- Deployed on Vercel
- Open source

## What have you built so far?

A fully functional dashboard with six modules:

- Storage Provider directory with health scoring, search, and sorting
- Blob browser with recent uploads, largest files, and file type breakdown
- Live event feed from on-chain blob activities
- AWS S3 vs Shelby cost comparison
- REST API endpoint for programmatic access
- Network topology visualization

All modules are live and querying real ShelbyNet data.

## What's next?

- SP performance metrics (read latency, audit scores) when on-chain data becomes available
- Geographic distribution map when availability zone data is accessible
- Alerting for SP status changes
- Integration with the Shelby SDK for direct blob management from the dashboard
