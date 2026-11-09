# Firm licenses

Expunge is sold only to businesses. Consumers never pay Expunge and can only
get an account through a firm's invite link.

## Offers

Prices and copy live in `lib/pricing.ts`. Change them there, then make a
matching plan variation in Square.

| Offer | How the firm pays | Database plan | Client seats |
| --- | --- | --- | --- |
| Firm Monthly | Card checkout, Square monthly subscription (`SQUARE_PLAN_PARTNER_ID`) | `partner` | 50 |
| Annual License | Card checkout, Square yearly subscription (`SQUARE_PLAN_FIRM_ANNUAL_ID`), or invoice | `partner` | 100 |
| White-label or buyout | Quote from the license request form (`/demo?interest=license`) | separate agreement | per agreement |

All firm offers grant the same `partner` plan. Clients a firm invites get full
access while the firm's plan is active and they hold a seat, and lose the
ability to start new reviews (but keep their past letters) when it lapses.

## Client seats

A seat is one client linked to the firm. Seat counts are placeholders in
`lib/pricing.ts` (`clientSeats` on each offer).

- Checkout saves the plan's seat count on the firm's row in
  `subscriptions.client_seats` (needs migration `010_client_seats.sql`). A row
  with no count uses the Firm Monthly default.
- When every seat is taken, the invite page and sign-up page tell new clients
  the firm is full, and the join API refuses them.
- If a firm has more linked clients than seats, the ones who joined last can
  sign in but can't start a new review until seats free up.
- A firm frees a seat by removing a client on its dashboard. The client keeps
  their account and past letters.
- Firms ask for more seats at `/demo?interest=seats`. To grant them, set the
  new count (replace the number and the email):

```sql
update public.subscriptions s
set client_seats = 150
from public.profiles p
where p.id = s.user_id
  and p.email = 'owner@firm.example'
  and p.role = 'partner';
```

A firm that later changes plan at checkout is reset to that plan's seat count,
so re-apply a custom count after a plan change.

## Activating an invoiced annual license

When a firm pays an annual license invoice, give its account a year of access
in the Supabase SQL editor. Replace the email with the firm's sign-up email:

```sql
update public.subscriptions s
set plan = 'partner',
    status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '1 year',
    cancel_at_period_end = false,
    client_seats = 100
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
