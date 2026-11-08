-- Remove fake "sent" data created before letters had a real mailing status.
--
-- Earlier versions marked every generated letter as mailed ('sent') with a
-- made-up tracking number starting with "EX-", even though Expunge never mails
-- anything. This resets those records to 'queued' (not mailed yet) so the
-- consumer can mark them as mailed themselves. Safe to run more than once.

update public.dispute_items di
set status = 'letter_drafted'
where di.status = 'dispatched'
  and exists (
    select 1
    from public.letters l
    join public.dispatch_records dr on dr.letter_id = l.id
    where l.dispute_item_id = di.id
      and dr.tracking_number like 'EX-%'
  );

update public.dispatch_records
set status = 'queued',
    tracking_number = null,
    sent_at = null,
    response_due_at = null
where tracking_number like 'EX-%'
  and status in ('sent', 'no_response');
