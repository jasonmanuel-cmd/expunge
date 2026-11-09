# Firm licenses

Expunge is sold only to businesses. Consumers never pay Expunge and can only
get an account through a firm's invite link.

## Offers

Prices and copy live in `lib/pricing.ts`. Change them there, then make a
matching plan variation in Square.

| Offer | How the firm pays | Database plan |
| --- | --- | --- |
| Firm Monthly | Card checkout, Square monthly subscription (`SQUARE_PLAN_PARTNER_ID`) | `partner` |
| Annual License | Card checkout, Square yearly subscription (`SQUARE_PLAN_FIRM_ANNUAL_ID`), or invoice | `partner` |
| White-label or buyout | Quote from the license request form (`/demo?interest=license`) | separate agreement |

All firm offers grant the same `partner` plan. Clients a firm invites get full
access while the firm's plan is active, and lose the ability to start new
reviews (but keep their past letters) when it lapses.

## Activating an invoiced annual license

When a firm pays an annual license invoice, give its account a year of access
in the Supabase SQL editor. Replace the email with the firm's sign-up email:

```sql
update public.subscriptions s
set plan = 'partner',
    status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '1 year',
    cancel_at_period_end = false
from public.profiles p
where p.id = s.user_id
  and p.email = 'owner@firm.example'
  and p.role = 'partner';
```

A license with no Square subscription stops working on its
`current_period_end` automatically. To renew, run the same statement again
after the next invoice is paid.

## Accounts from before the firms-only change

Rows still on `basic` or `pro` keep working until they end and can only be
canceled from the billing page. Nobody can buy those plans any more.
