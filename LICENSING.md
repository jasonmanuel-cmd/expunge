# Licensing and white-label deploy kit

Expunge is single-tenant: each licensee runs their own copy with their own
accounts and keys. Customer data never mixes between licensees.

## What a licensee needs

| Service | What for |
| --- | --- |
| Vercel project | Hosts the app and runs the daily cron |
| Supabase project | Database, auth, row-level security |
| Square account | Subscription plans and card payments |
| OpenAI API key | Report analysis and letter drafting |
| Resend account + verified domain | Transactional email |

## Setup

1. Fork or copy this repo and create a Vercel project from it.
2. Create a Supabase project and run every file in `supabase/migrations/` in order (001 to 009).
3. In Square, create the firm plan variations (Firm Monthly, and optionally a yearly Annual License; amounts in `lib/pricing.ts`) and a webhook pointing to `https://<your-domain>/api/square/webhook` with these events: `subscription.created`, `subscription.updated`, `invoice.payment_made`, `invoice.scheduled_charge_failed`.
4. Verify your sending domain in Resend.
5. Set the environment variables below in Vercel and deploy.

## Environment variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (must match the Square webhook URL's domain)
- `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `NEXT_PUBLIC_SQUARE_ENVIRONMENT` (`production` or sandbox)
- `SQUARE_PLAN_PARTNER_ID` (Firm Monthly)
- `SQUARE_PLAN_FIRM_ANNUAL_ID` (optional, Annual License; without it the annual license is sold by invoice, see `docs/FIRM_LICENSES.md`)
- `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET` (the daily cron refuses to run without it)
- `ADMIN_SECRET` (protects admin routes)

Brand (all optional, defaults are Expunge's):

- `NEXT_PUBLIC_BRAND_NAME`
- `NEXT_PUBLIC_BRAND_DOMAIN`
- `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_LEGAL_EMAIL`, `NEXT_PUBLIC_PRIVACY_EMAIL`
- `EMAIL_FROM` (for example `Acme Credit <notifications@acme.com>`)

## Still hard-coded

Emails, legal contact addresses and support addresses read from `lib/brand.ts`.
Page copy and the logo (`components/ExpungeLogo.tsx`) still say "Expunge" and
must be edited by hand for a full rebrand.

## Business-to-business only

Expunge is sold only to firms. There are no consumer plans, consumers can't
create an account without a firm's invite link, and the subscription API only
accepts firm accounts. Prices live in `lib/pricing.ts`.

A licensed attorney must still review credit services rules before the
software is sold, and each firm should check its own state's rules before it
offers the software to clients. Topics to bring them: the federal Credit Repair
Organizations Act (fees before services, written contract, cancellation
right, required disclosures), state credit services registration or bonding,
and whether the licensee or this software counts as a credit repair
organization. This file is not legal advice.
