-- Life Manager — daily-reminders cron schedule
-- Runs the `daily-reminders` Edge Function at 7:00 AM IST every day.
-- 7:00 IST = 01:30 UTC.
--
-- Prereqs (one-time, in the Supabase SQL editor):
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
-- Replace the placeholders before running:
--   <PROJECT-REF>           — your project ref, e.g. abcdxyz
--   <SUPABASE_ANON_KEY>     — anon key from Project Settings → API
--   <SUPABASE_SERVICE_ROLE> — service role key (used as Authorization for
--                             function-to-function calls; keep secret).

-- Drop any previous schedule with the same name so this script is idempotent.
select cron.unschedule('life-manager-daily-reminders')
  where exists (
    select 1 from cron.job where jobname = 'life-manager-daily-reminders'
  );

-- Schedule it. The minute/hour are UTC; 01:30 UTC = 07:00 IST.
select cron.schedule(
  'life-manager-daily-reminders',
  '30 1 * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT-REF>.functions.supabase.co/daily-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To verify:
--   select * from cron.job where jobname = 'life-manager-daily-reminders';
--   select * from cron.job_run_details order by start_time desc limit 5;
