// Client-side helpers for opting into / out of the daily-reminders Edge Function.
//
// Flow:
//   1. enableReminders() asks the user for notification permission, then asks
//      the service worker to subscribe to push using our VAPID public key,
//      then writes the subscription to the `push_subscriptions` table.
//   2. disableReminders() unsubscribes and removes the row.
//
// Env:
//   VITE_VAPID_PUBLIC_KEY — base64url-encoded VAPID public key. Generate once
//   via `npx web-push generate-vapid-keys`. Store the *private* key only on
//   the Supabase Edge Function as a secret.

import { supabase, isSupabaseConfigured } from './supabase.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPermissionState() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Convert a base64url-encoded VAPID public key into the Uint8Array that
 * the PushManager.subscribe() applicationServerKey option requires.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Returns the existing PushSubscription if there is one, or null.
 */
export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/**
 * Ask permission, subscribe to push, persist the subscription server-side.
 * Throws with a human-readable message on failure.
 */
export async function enableReminders() {
  if (!isPushSupported()) {
    throw new Error('This browser does not support push notifications.');
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VITE_VAPID_PUBLIC_KEY is not configured — see .env.example.');
  }
  if (!isSupabaseConfigured) {
    throw new Error('Reminders need an account — sign in first.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You need to be signed in to enable reminders.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notifications are blocked. Enable them in your browser settings.'
        : 'Notification permission was dismissed.',
    );
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const row = {
    user_id: user.id,
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    user_agent: navigator.userAgent.slice(0, 250),
    last_seen_at: new Date().toISOString(),
  };

  // Upsert by endpoint so re-enabling on the same device doesn't create dupes.
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(row, { onConflict: 'endpoint' });
  if (error) throw new Error(`Could not save subscription: ${error.message}`);

  return sub;
}

/**
 * Unsubscribe locally and delete the row.
 */
export async function disableReminders() {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch { /* ignore */ }

  if (isSupabaseConfigured) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);
  }
}

/**
 * Are reminders currently active on this device?
 * (Permission granted AND a PushSubscription exists.)
 */
export async function getRemindersState() {
  const perm = getPermissionState();
  if (perm !== 'granted') return { active: false, permission: perm };
  const sub = await getExistingSubscription();
  return { active: !!sub, permission: perm };
}
