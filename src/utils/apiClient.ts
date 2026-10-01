import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { INITIAL_ROVER_POLICY } from '../data/policyData';

function withoutSecrets(member: Record<string, any>) {
  const { password, passwordHash, ...safe } = member;
  return safe;
}

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

  // 2. Settings
  if (url.includes('/api/admin/settings') || url.includes('/api/settings')) {
    if (method === 'GET') {
      try {
        const snap = await getDoc(doc(db, 'settings', 'config'));
        if (snap.exists()) {
          const data = { ...(snap.data() as Record<string, unknown>) };
          delete data.sso_api_key;
          delete data.smtp;
          delete data.telegram_bot;
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch {
        // ignore
      }
      return new Response(JSON.stringify({
        siteTitle: 'Arabiyya Members',
        admin_roles: [],
        telegram_bot: {},
        smtp: {}
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 3. Members list
  if (url.includes('/api/members') && method === 'GET') {
    try {
      const snap = await getDocs(collection(db, 'member_applications'));
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push(withoutSecrets({ id: docSnap.id, ...docSnap.data() }));
      });
      return new Response(JSON.stringify(list), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
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
