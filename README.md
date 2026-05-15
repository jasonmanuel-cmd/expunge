# Expunge — AI Credit Dispute Automation

Analyzes credit reports, applies 30 years of FCRA case law, drafts legally precise dispute letters, and dispatches them to all three bureaus — automatically.

## Tech Stack

- **Frontend/Backend:** Next.js 16 (App Router) + TypeScript
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **AI:** Claude API (Anthropic) — all agents use claude-sonnet-4-6 with prompt caching
- **Payments:** Square v44 SDK — subscriptions, webhooks, card on file
- **Deployed to:** Vercel

## Getting Started

```bash
cp .env.local.example .env.local
# Fill in your environment variables
npm run dev
```
