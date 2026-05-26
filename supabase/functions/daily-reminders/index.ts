// Supabase Edge Function — daily-reminders
//
// Runs once a day (via pg_cron — see supabase/cron.sql) and, for every push
// subscription in the `push_subscriptions` table, sends a single digest
// notification covering:
//   • Key Dates whose `date` column equals today (YYYY-MM-DD)
//   • Events whose `date` column equals today
//   • People whose `dob` matches today's month + day (birthday recurrence)
//
// Env (set via `supabase secrets set ...`):
//   VAPID_PUBLIC_KEY   — the same key the client uses
//   VAPID_PRIVATE_KEY  — private half, NEVER exposed to the client
//   VAPID_SUBJECT      — mailto:you@example.com (required by web-push)
//
// Auto-injected by Supabase:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  (admin — bypasses RLS so we can read every user)

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — this file runs in Deno; types come from npm imports.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';
// IANA timezone used to compute "today" — 7am IST cron runs at 01:30 UTC,
// so we want to pick today's IST date, not UTC.
const TZ = Deno.env.get('REMINDERS_TZ') ?? 'Asia/Kolkata';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) throw new Error('Missing VAPID_*_KEY env vars');

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** YYYY-MM-DD for today in the configured TZ. */
function todayInTZ(): { iso: string; month: number; day: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === 'year')!.value);
  const m = Number(parts.find((p) => p.type === 'month')!.value);
  const d = Number(parts.find((p) => p.type === 'day')!.value);
  return { iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, month: m, day: d };
}

/** Pull today's items for a single user_id. */
async function loadDigestFor(userId: string, today: { iso: string; month: number; day: number }) {
  const [keyDates, events, people] = await Promise.all([
    admin.from('key_dates').select('title, date').eq('user_id', userId).eq('date', today.iso),
    admin.from('events').select('title, date').eq('user_id', userId).eq('date', today.iso),
    admin.from('people').select('name, dob').eq('user_id', userId),
  ]);

  const birthdays = (people.data ?? []).filter((p: any) => {
    if (!p.dob) return false;
    // dob is YYYY-MM-DD; match month + day, any year.
    const [, mm, dd] = String(p.dob).split('-');
    return Number(mm) === today.month && Number(dd) === today.day;
  });

  const items: string[] = [];
  for (const k of (keyDates.data ?? [])) items.push(k.title);
  for (const e of (events.data ?? [])) items.push(e.title);
  for (const b of birthdays) items.push(`${b.name}'s birthday`);
  return items;
}

/** Build a single notification payload from the digest list. */
function buildPayload(items: string[]) {
  if (items.length === 0) return null;
  const title = items.length === 1
    ? `Today: ${items[0]}`
    : `${items.length} things today`;
  const body = items.length === 1
    ? "Open Life Manager to take a look."
    : items.slice(0, 5).join(' · ') + (items.length > 5 ? ` +${items.length - 5} more` : '');
  return JSON.stringify({ title, body, url: '/', tag: 'daily-digest' });
}

/** Deno.serve handler — accepts any method, ignores the body. */
Deno.serve(async () => {
  const today = todayInTZ();

  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth');
  if (error) {
    console.error('Could not list subscriptions:', error);
    return new Response('error', { status: 500 });
  }

  // Group by user so we only query each user's data once even if they have
  // multiple devices subscribed.
  const byUser = new Map<string, typeof subs>();
  for (const s of subs ?? []) {
    if (!byUser.has(s.user_id)) byUser.set(s.user_id, [] as any);
    byUser.get(s.user_id)!.push(s);
  }

  let sent = 0;
  let skipped = 0;
  let purged = 0;

  for (const [userId, userSubs] of byUser) {
    const items = await loadDigestFor(userId, today);
    const payload = buildPayload(items);
    if (!payload) { skipped += userSubs.length; continue; }

    for (const sub of userSubs) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(pushSub, payload);
        sent += 1;
      } catch (e: any) {
        const status = e?.statusCode;
        if (status === 404 || status === 410) {
          // Subscription is gone — clean it up.
          await admin.from('push_subscriptions').delete().eq('id', sub.id);
          purged += 1;
        } else {
          console.error('push error', status, e?.body || e?.message);
        }
      }
    }
  }

  const summary = { today: today.iso, totalUsers: byUser.size, sent, skipped, purged };
  console.log('daily-reminders done', summary);
  return new Response(JSON.stringify(summary), {
    headers: { 'content-type': 'application/json' },
  });
});
