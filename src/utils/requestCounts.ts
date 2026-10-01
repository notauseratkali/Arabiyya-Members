const PENDING_JOIN_STATUSES = new Set([
  'Pending Review',
  'Interview',
  'Investiture',
  'Processing',
  'Interview & Investiture',
  'Pending'
]);

export function countPendingRequests(data: {
  memberApplications?: Array<{ status?: string } | null>;
  profileUpdateRequests?: Array<{ status?: string } | null>;
  attendanceExcuses?: Array<{ excuseStatus?: string } | null>;
} | null | undefined): number {
  const members = Array.isArray(data?.memberApplications) ? data.memberApplications : [];
  const profiles = Array.isArray(data?.profileUpdateRequests) ? data.profileUpdateRequests : [];
  const excuses = Array.isArray(data?.attendanceExcuses) ? data.attendanceExcuses : [];

  const joinCount = members.filter(item => item && PENDING_JOIN_STATUSES.has(item.status || '')).length;
  const profileCount = profiles.filter(item => item && item.status === 'Pending').length;
  const absenceCount = excuses.filter(item => item && item.excuseStatus === 'Pending Review').length;
  return joinCount + profileCount + absenceCount;
}
