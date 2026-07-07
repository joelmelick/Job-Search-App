-- 007: Auto-dismiss candidates whose posting has been down 4+ consecutive days.
-- The posting checker (external scheduled task) only writes posting_status +
-- last_checked; the trigger below owns the down clock and the dismissal.

alter table candidates add column if not exists dismissed_at timestamptz;
alter table candidates add column if not exists down_since date;
alter table jobs add column if not exists down_since date;

-- Backfill dismissed_at for already-dismissed candidates from the dismissals log
update candidates c
set dismissed_at = d.dismissed_at
from (
  select candidate_id, max(dismissed_at) as dismissed_at
  from dismissals
  where candidate_id is not null
  group by candidate_id
) d
where c.id = d.candidate_id and c.dismissed and c.dismissed_at is null;

update candidates set dismissed_at = created_at where dismissed and dismissed_at is null;

-- Start the down clock for candidates already marked down
update candidates
set down_since = case
  when last_checked ~ '^\d{4}-\d{2}-\d{2}' then substring(last_checked, 1, 10)::date
  else current_date
end
where posting_status = 'down' and not dismissed and down_since is null;

create or replace function handle_candidate_posting_status()
returns trigger
language plpgsql
as $$
begin
  if new.posting_status = 'down' and not new.dismissed then
    new.down_since := coalesce(new.down_since, current_date);
    if current_date - new.down_since >= 3 then
      new.dismissed := true;
      new.dismiss_reason := 'Posting removed (down 4+ days)';
      new.dismissed_at := now();
      insert into dismissals (candidate_id, company, role, reason)
      values (new.id, new.company, new.role, new.dismiss_reason);
    end if;
  elsif new.posting_status = 'live' then
    new.down_since := null;
  end if;
  return new;
end
$$;

drop trigger if exists candidate_posting_status_trigger on candidates;
create trigger candidate_posting_status_trigger
before update of posting_status, last_checked on candidates
for each row execute function handle_candidate_posting_status();
