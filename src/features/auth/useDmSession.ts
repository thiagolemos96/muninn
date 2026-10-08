import type { Session } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { supabase } from '../../lib/supabase.ts';

// Only the DM ever signs in; players read the Grimório anonymously.
// Being signed in does not make you a DM: RLS checks campaign_members per campaign.
export type DmSession =
  { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; session: Session };

let current: DmSession = { status: 'loading' };
const listeners = new Set<() => void>();

// One auth listener for the whole app. Supabase fires INITIAL_SESSION right away
// (after exchanging the ?code= from Google, if present), then SIGNED_IN,
// SIGNED_OUT and TOKEN_REFRESHED as they happen.
supabase.auth.onAuthStateChange((_event, session) => {
  current = session ? { status: 'signed-in', session } : { status: 'signed-out' };
  listeners.forEach((notify) => notify());
});

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

function getSnapshot() {
  return current;
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    // Come back to the page where the DM clicked "Entrar"
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
}

export function signOut() {
  // 'local' ends only this device: leaving the table laptop keeps the phone signed in
  return supabase.auth.signOut({ scope: 'local' });
}

export function useDmSession() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
