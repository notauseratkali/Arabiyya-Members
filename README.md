# Arabiyya Members

Membership portal for Arabiyya Rover Crew. The React app and the Express API are one project.

## Local development

```bash
npm install
npm run dev
```

That serves the UI and the API together at http://localhost:3000. You do not need `VITE_API_URL` for this. Data stays in memory unless Firebase Admin credentials are configured (below).

Default secretary login, only until you change it:

- username: `admin`
- password: value of `ADMIN_PASSWORD`, or `admin123` if that variable is unset

Set `ADMIN_PASSWORD` and `SESSION_SECRET` before any shared deployment. Copy `.env.example` to `.env`.

```bash
npm test
npm run lint
npm run build
npm start
```

`npm start` serves the production build from `dist/` and the API from `server-dist/server.cjs`.

## API base URL (`VITE_API_URL`)

The browser calls `/api/...` on the same origin when this server is hosting the page. That includes `npm run dev` and `npm start` on whatever `PORT` is set (the default is 3000), a `*.run.app` host, and any other host that serves this Node process. Do not set `VITE_API_URL` for those.

GitHub Pages only hosts the static build. Set the API origin at **build** time:

```bash
VITE_API_URL=https://your-api-host.example npm run build
```

No trailing slash. If a Pages build omits `VITE_API_URL`, API calls return a clear error telling you to set it. They do not call a baked-in host.

For GitHub Actions, add a repository variable named `VITE_API_URL` (Settings → Secrets and variables → Actions → Variables). The Pages workflow passes it into `npm run build`. Leave it empty until the API host exists.

## Passwords

New and changed passwords are stored as `scrypt$<salt>$<hash>` (`server/passwords.ts`).

Existing plaintext `passwordHash` values still sign in. On that successful login the server verifies the plaintext, replaces it with a scrypt hash, and saves the member. A member with no `passwordHash` can still sign in once with the mobile number stored on the record (country code `960` optional); that typed value is then hashed.

Bulk import hashes the row password, or `scout123` when the row has none. The secretary Add Member form sends a `password` field; the server stores that as `passwordHash` and does not keep a separate plaintext password. Scheduled events are published when their publish time is due, with a 6-hour clock skew. They are not sent a full day early, and an event's start time is not treated as its publish time.

Secretary access comes from the account role, the built-in `admin-001` record, or a username listed under Settings → Admin Roles. Changing a profile email to a council address, or choosing the username `admin` or `nazihnafiz` on the join form, does not grant it. New applications stay `Pending Verification` until a secretary approves them. Unauthenticated OTP responses show a masked phone or Telegram handle, not the full value.

## Firestore

The API uses the Firebase Admin SDK and bypasses security rules. If no service account is configured, reads and writes stay in memory and local dev still runs.

Set one of:

- `FIREBASE_SERVICE_ACCOUNT` — the service account JSON, or the same JSON base64-encoded, or a path to the JSON file
- `GOOGLE_APPLICATION_CREDENTIALS` — path to the JSON file

A key file named `serviceAccountKey.json`, `service-account.json`, or `firebase-service-account.json` in the project root is also picked up. Do not commit that file.

`firestore.rules` denies browser access to `otps`, `member_applications`, `settings`, invitations, and the other server collections. `policies` is public read. `users/{uid}` can be read and updated only by that signed-in Firebase user, and the write cannot set `password`, `passwordHash`, `isAdmin`, or a new Admin/Secretary role.

Deploy the rules only after the API process is actually using the Admin SDK. Deploying them first will lock the old client-SDK server out of its own data.

## Owner steps that cannot be done from this repository

1. **Secrets on the API host** (Cloud Run, a VM, or wherever `node server-dist/server.cjs` runs):
   - `ADMIN_PASSWORD` — secretary password. Change it from `admin123`.
   - `SESSION_SECRET` — long random string. Signs browser login tokens.
   - `APP_URL` — public origin of this app, no trailing slash. Used in emails and invite links.
   - `FIREBASE_SERVICE_ACCOUNT` or `GOOGLE_APPLICATION_CREDENTIALS` — Admin SDK key, as above.
   - SMTP and Telegram variables in `.env.example` if you want live mail or bot messages.

2. **Enable Cloud Firestore** on the Firebase/GCP project the service account belongs to.
   - The applet config in this repo points at project `arabiyyaidentity`.
   - A direct check of that project returned: Cloud Firestore API has not been used or is disabled. Enable the API on the project you actually intend to use (Google Cloud Console → APIs & Services → enable **Cloud Firestore API**), or point the service account at the project that already has Firestore.
   - Confirm with a secretary login, then Settings → server status. It should say `Connected (Admin SDK)`, not `In-Memory Fallback`.

3. **Deploy rules after step 2 works:**
   ```bash
   firebase deploy --only firestore:rules
   ```
   Do this only after a restart with the service account shows the Admin SDK as connected. The Admin SDK ignores these rules; a server still using the client SDK would lose access.

4. **GitHub Pages source (one manual Settings change):**
   - Open the repository on GitHub → **Settings** → **Pages** → **Build and deployment**.
   - Set **Source** to **GitHub Actions**.
   - Today the Pages API reports source `legacy` (Deploy from a branch, branch `main`, path `/`) and both the Actions workflow and GitHub’s branch publisher succeed. That race is why the live site can be overwritten. Switching Source to GitHub Actions stops the branch publisher. This cannot be set from a file in the repo.

5. **Pages API variable:**
   - Settings → Secrets and variables → Actions → Variables → New repository variable.
   - Name: `VITE_API_URL`
   - Value: the public API origin, no trailing slash, for example `https://members-api.example.org`
   - Push to `main` (or re-run the “Deploy to GitHub Pages” workflow) so the static site is rebuilt with that value.
   - Until this is set, the Pages site will show the `VITE_API_URL` error instead of calling a dead host.

6. **Existing browsers:** anyone signed in before session tokens were required is signed out once. They sign in again with their current password (plaintext passwords are upgraded on that login).
