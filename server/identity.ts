/** Usernames that log in as the built-in secretary account. */
export const RESERVED_USERNAMES = ['admin', 'administrator'];

/** Emails that are login aliases for the built-in secretary, not a privilege anyone can copy. */
export const RESERVED_EMAILS = [
  'it@arabiyyascouts.org',
  'admin@arabiyyarovers.net',
  'nazihnafiz@gmail.com'
];

/** Statuses a non-secretary may see in the member directory. */
export const DIRECTORY_STATUSES = ['Active', 'Approved', 'Investiture', 'Voluntary Suspension'];

export function accountIsSecretary(input: {
  role?: string | null;
  id?: string | null;
  username?: string | null;
  privilegedUsernames?: string[];
}): boolean {
  if (input.role === 'Secretary' || input.role === 'Admin') return true;
  if (input.id === 'admin-001') return true;
  const username = String(input.username || '').trim().toLowerCase();
  if (!username || RESERVED_USERNAMES.includes(username)) return false;
  return (input.privilegedUsernames || []).some((name) => name.trim().toLowerCase() === username);
}

export function signupUsernameError(username: string, privilegedUsernames: string[] = []): string | null {
  const next = username.trim().toLowerCase();
  if (!next) return 'Username is required.';
  if (RESERVED_USERNAMES.includes(next)) return 'That username is reserved.';
  if (privilegedUsernames.some((name) => name.trim().toLowerCase() === next)) {
    return 'That username is reserved.';
  }
  return null;
}

export function identityChangeError(input: {
  actorIsSecretary: boolean;
  memberId: string;
  currentUsername?: string;
  currentEmail?: string;
  nextUsername?: string;
  nextEmail?: string;
  otherUsernames: string[];
  otherEmails: string[];
  privilegedUsernames: string[];
}): string | null {
  const currentUsername = String(input.currentUsername || '').trim().toLowerCase();
  const currentEmail = String(input.currentEmail || '').trim().toLowerCase();
  const nextUsername = input.nextUsername === undefined ? undefined : String(input.nextUsername).trim().toLowerCase();
  const nextEmail = input.nextEmail === undefined ? undefined : String(input.nextEmail).trim().toLowerCase();

  if (nextUsername && nextUsername !== currentUsername) {
    if (input.otherUsernames.some((name) => name.trim().toLowerCase() === nextUsername)) {
      return 'That username is already in use.';
    }
    if (RESERVED_USERNAMES.includes(nextUsername) && input.memberId !== 'admin-001') {
      return 'That username is reserved.';
    }
    const privileged = input.privilegedUsernames.some((name) => name.trim().toLowerCase() === nextUsername);
    if (!input.actorIsSecretary && privileged) return 'That username is reserved.';
  }

  if (nextEmail && nextEmail !== currentEmail) {
    if (input.otherEmails.some((email) => email.trim().toLowerCase() === nextEmail)) {
      return 'That email address is already in use.';
    }
    if (RESERVED_EMAILS.includes(nextEmail) && input.memberId !== 'admin-001') {
      return 'That email address is reserved.';
    }
  }

  return null;
}

export function visibleInMemberDirectory(status: unknown, isSecretary: boolean): boolean {
  if (isSecretary) return true;
  return typeof status === 'string' && DIRECTORY_STATUSES.includes(status);
}
