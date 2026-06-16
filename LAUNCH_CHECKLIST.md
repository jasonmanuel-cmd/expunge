# Expunge — Launch Checklist

## Status: Code 100% DONE ✅ | Infrastructure PENDING 🚧

Production URL: https://expunge-tau.vercel.app
Supabase Project: tohxaqcnowjtotmpdqky
Vercel Project: expunge

---

## BLOCKER #1: Supabase Project is PAUSED (YOU MUST DO)

1. Go to: https://supabase.com/dashboard/project/tohxaqcnowjtotmpdqky
2. Click "Unpause" (top banner)
3. Once unpaused, run migration #005:
   ```
   cd C:\Users\blunt\Desktop\apps\1_NEARLY_DONE_80+\expunge
   supabase migration up
   ```
   This adds address_line1, address_line2, city, state, zip_code, ssn_last4, date_of_birth columns to profiles table.

---

## BLOCKER #2: Square Production Subscription Plans (YOU MUST DO)

1. Log in to https://squareup.com/dashboard
2. Go to Subscriptions → Plans → Create Plan
3. Create 3 plans:

   **Basic Plan**
   - Name: Expunge Basic
   - Price: $49.00/month
   - Description: For individuals starting credit repair

   **Pro Plan**
   - Name: Expunge Pro
   - Price: $99.00/month
   - Description: Maximum firepower for serious credit repair

   **Partner Plan**
   - Name: Expunge Partner
   - Price: $299.00/month
   - Description: For credit repair agencies

4. For each plan, copy the **Plan Variation ID** (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
5. Update Vercel env vars:
   ```
   vercel env add SQUARE_PLAN_BASIC_ID production
   vercel env add SQUARE_PLAN_PRO_ID production
   vercel env add SQUARE_PLAN_PARTNER_ID production
   ```
6. Switch to production:
   - Update `NEXT_PUBLIC_SQUARE_ENVIRONMENT` from `sandbox` to `production`
   - Update `SQUARE_ACCESS_TOKEN` to production token
   - Update `SQUARE_LOCATION_ID` to production location
   - Update `NEXT_PUBLIC_SQUARE_APP_ID` to production app ID
   - Update `SQUARE_WEBHOOK_SIGNATURE_KEY` to production webhook key
7. Configure Square webhook URL: `https://expunge-tau.vercel.app/api/square/webhook`
8. Redeploy: `vercel --prod`

---

## BLOCKER #3: Resend Email (YOU MUST DO)

1. Create account at https://resend.com
2. Verify your domain (expunge.ai or your chosen domain)
3. Get API key (starts with `re_`)
4. Add to Vercel:
   ```
   vercel env add RESEND_API_KEY production
   ```
5. Update FROM address in `lib/email.ts` if needed (currently `notifications@expunge.ai`)
6. Redeploy: `vercel --prod`

---

## BLOCKER #4: Seed Knowledge Base (AFTER SUPABASE UNPAUSED)

Run this after Supabase is unpaused:

```powershell
Invoke-RestMethod -Uri "https://expunge-tau.vercel.app/api/admin/seed-knowledge" `
  -Method POST `
  -Headers @{ "x-admin-secret" = "86b4c0dd3c7573f59fe65424addee121" }
```

This seeds 585 lines of FCRA legal knowledge into the dispute_knowledge_base table.

---

## BLOCKER #5: Custom Domain (OPTIONAL BUT RECOMMENDED)

1. Buy domain (e.g., expunge.ai) if not already owned
2. In Vercel: Project Settings → Domains → Add
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to new domain
5. Update Square webhook URL to new domain
6. Redeploy

---

## POST-LAUNCH VERIFICATION

Once all blockers are resolved, test this flow:

1. **Sign up** at /register → fill in all personal data
2. **Verify email** (check inbox for Supabase auth email)
3. **Log in** at /login
4. **Upload credit report** at /upload → paste text from AnnualCreditReport.com
5. **Wait 1-2 minutes** for AI analysis
6. **Check dashboard** → should see dispute items and generated letters
7. **Download letter PDF** → verify address/name are real (not placeholders)
8. **Test upgrade** → go to /pricing → click upgrade → checkout page loads
9. **Test password reset** → /forgot-password → enter email → check inbox → reset link works
10. **Test cancel** → /billing → cancel subscription → confirm

---

## ENV VARS QUICK REFERENCE

| Variable | Local Value | Production Value |
|----------|------------|-----------------|
| NEXT_PUBLIC_SUPABASE_URL | https://tohxaqcnowjtotmpdqky.supabase.co | same |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbG...e-Tc | same |
| SUPABASE_SERVICE_ROLE_KEY | eyJhbG...3gVY | same |
| ANTHROPIC_API_KEY | *** | set in Vercel |
| NEXT_PUBLIC_SQUARE_APP_ID | sandbox-sq0idb-... | PRODUCTION value |
| SQUARE_ACCESS_TOKEN | EAAAl0... | PRODUCTION value |
| SQUARE_LOCATION_ID | LX0ECCYXXZYWS | PRODUCTION value |
| NEXT_PUBLIC_SQUARE_ENVIRONMENT | sandbox | **production** |
| SQUARE_PLAN_BASIC_ID | placeholder | **REAL PLAN ID** |
| SQUARE_PLAN_PRO_ID | placeholder | **REAL PLAN ID** |
| SQUARE_PLAN_PARTNER_ID | placeholder | **REAL PLAN ID** |
| SQUARE_WEBHOOK_SIGNATURE_KEY | placeholder | PRODUCTION value |
| NEXT_PUBLIC_APP_URL | http://localhost:3000 | **https://yourdomain.com** |
| CRON_SECRET | 5226ee... | set in Vercel |
| ADMIN_SECRET | 86b4c0... | set in Vercel |
| RESEND_API_KEY | re_placeholder | **REAL KEY** |

---

## FILES CREATED/MODIFIED THIS SESSION

New files:
- app/(auth)/forgot-password/page.tsx
- app/reset-password/page.tsx
- app/(consumer)/profile/step2/page.tsx
- app/(consumer)/upload/error.tsx
- app/(consumer)/upload/loading.tsx
- app/checkout/error.tsx
- app/checkout/loading.tsx
- app/billing/error.tsx
- app/billing/loading.tsx
- app/(consumer)/profile/step2/error.tsx
- app/(consumer)/profile/step2/loading.tsx
- middleware.ts
- supabase/migrations/005_consumer_personal_data.sql

Modified files:
- app/(auth)/login/page.tsx (added forgot password link)
- app/(consumer)/upload/page.tsx (redirect to /consumer/upload)
- app/consumer/upload/page.tsx (profile completion check + banner)
- app/(auth)/register/page.tsx (added personal data fields)
- app/api/orchestrator/route.ts (real profile data + rate limiting)
- app/api/upload-report/route.ts (fixed setStatusMsg bug)
- .env.local (added CRON_SECRET, ADMIN_SECRET)
