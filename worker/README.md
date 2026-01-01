# Leaderboard API Setup

## Prerequisites
- Node.js 18+
- Cloudflare account (free tier works)

## Quick Start

```bash
cd worker

# Install wrangler CLI
npm install -g wrangler

# Login to Cloudflare
npx wrangler login

# Create KV namespace
npx wrangler kv:namespace create LEADERBOARD
# Copy the ID from output and paste into wrangler.toml

# Deploy
npx wrangler deploy
```

## API Endpoints

### GET /leaderboard
Returns top 50 scores.

```json
[
  { "name": "Player1", "score": 16, "date": 1704067200000 },
  { "name": "Player2", "score": 14, "date": 1704067300000 }
]
```

### POST /leaderboard
Submit a new score.

**Request:**
```json
{ "name": "Player1", "score": 16 }
```

**Response:**
```json
{ "success": true, "rank": 3, "entry": { "name": "Player1", "score": 16, "date": 1704067200000 } }
```

## Local Development

```bash
npx wrangler dev
```

This runs the worker locally at `http://localhost:8787`.
