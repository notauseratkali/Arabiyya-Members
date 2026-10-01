import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { INITIAL_ROVER_POLICY } from '../data/policyData';

export async function handleClientApiFallback(url: string, options?: RequestInit): Promise<Response> {
  const method = (options?.method || 'GET').toUpperCase();

  // 1. Auth Login — passwords are checked only by the API server.
  if (url.includes('/api/auth/login') && method === 'POST') {
    return new Response(JSON.stringify({
      error: 'The membership server is unreachable, so sign-in cannot be completed from this browser.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Settings — do not read the settings collection. Rules deny it because it holds secrets.
  if (url.includes('/api/admin/settings') || url.includes('/api/settings')) {
    if (method === 'GET') {
      return new Response(JSON.stringify({
        siteTitle: 'Arabiyya Members',
        group_logo: '/logo.svg',
        event_types: [],
        supported_apps: [],
        admin_roles: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 3. Members list — passwords live in member_applications, which clients cannot read.
  if (url.includes('/api/members') && method === 'GET') {
    return new Response(JSON.stringify({
      error: 'The membership server is unreachable, so the member directory cannot be loaded.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Policies
  if (url.includes('/api/policies')) {
    if (method === 'GET') {
      try {
        const snap = await getDocs(collection(db, 'policies'));
        if (!snap.empty) {
          const list: any[] = [];
          snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
          return new Response(JSON.stringify({ success: true, policies: list }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      } catch {
        // ignore
      }
      return new Response(JSON.stringify({ success: true, policies: INITIAL_ROVER_POLICY }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 5. Signup availability check
  if (url.includes('/api/signup/check-availability')) {
    return new Response(JSON.stringify({
      error: 'The membership server is unreachable, so duplicate checks could not be completed.',
      available: {},
      errors: {}
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 6. Signup member or leader
  if (url.includes('/api/signup/member') || url.includes('/api/signup/leader')) {
    return new Response(JSON.stringify({
      error: 'The membership server is unreachable, so this application was not submitted.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (url.includes('/api/admin/server-status') || url.includes('/api/admin/server/ping-firebase')) {
    return new Response(JSON.stringify({
      status: 'offline',
      healthy: false,
      error: 'The membership server is unreachable.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    error: 'The membership server is unreachable.'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}
