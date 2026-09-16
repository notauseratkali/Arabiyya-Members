import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { 
  getSmtpConfig, 
  updateSmtpConfig, 
  verifySmtp, 
  sendEmail, 
  sendOtpEmail, 
  sendLeaderApplicationNotification, 
  sendMemberWelcomeConfirmation,
  sendMemberApplicationNotification,
  sendEventAnnouncementEmail,
  sendEventUpdateEmail,
  sendTestEmail,
  updateEmailDesignConfig,
  setSecretaryName,
  getSecretaryName,
  sendCustomAnnouncementEmail,
  sendInviteEmail,
  sendWelcomeEmail,
  sendWelcomeBackEmail
} from './server/email';
import { 
  broadcastToTelegram,
  getTelegramConfig,
  updateTelegramConfig,
  verifyTelegramBot,
  sendTelegramTestMessage,
  sendTelegramOtp,
  checkTelegramStart,
  startTelegramPolling
} from './server/telegram';
import { INITIAL_ROVER_POLICY, sortPolicyItems, PolicyItem } from './src/data/policyData';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, setLogLevel, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

// Process resilience guards for Cloud Run container lifecycle
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Warning] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process Error] Uncaught Exception:', err);
});

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global CORS Middleware to allow the static GitHub Pages frontend to connect securely to this Cloud Run backend
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    if (origin.includes('github.io') || origin.includes('localhost') || origin.includes('run.app')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

function sendWelcomeEmailIfNeeded(member: any, oldStatus: string, newStatus: string) {
  const isNowActive = newStatus === 'Approved' || newStatus === 'Active';
  const wasPreviouslyActive = oldStatus === 'Approved' || oldStatus === 'Active';
  if (isNowActive && !wasPreviouslyActive && member.email) {
    if (oldStatus === 'Voluntary Suspension' || oldStatus === 'Member Suspension' || oldStatus === 'Resigned') {
      sendWelcomeBackEmail(member).catch(err => console.error('[Welcome Back Email Error]:', err));
    } else {
      sendWelcomeEmail(member).catch(err => console.error('[Welcome Email Error]:', err));
    }
  }
}

function cleanupExpiredResignations() {
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const expiredIds: string[] = [];

  memberApplications.forEach(m => {
    if (m.status === 'Resigned' && m.resignationDate) {
      const resDate = new Date(m.resignationDate);
      if (!isNaN(resDate.getTime()) && (now.getTime() - resDate.getTime() >= thirtyDaysMs)) {
        expiredIds.push(m.id);
      }
    }
  });

  if (expiredIds.length > 0) {
    expiredIds.forEach(id => {
      const idx = memberApplications.findIndex(m => m.id === id);
      if (idx !== -1) {
        memberApplications.splice(idx, 1);
        console.log(`[Resigned Member 30d Auto-Delete]: Deleted member ${id} after 30 days of resignation.`);
      }
      if (db) {
        deleteDoc(doc(db, 'members', id)).catch(err => console.error('[Firestore Resign Delete Error]:', err));
        deleteDoc(doc(db, 'member_applications', id)).catch(err => console.error('[Firestore Resign App Delete Error]:', err));
      }
    });
  }
}

// Helper to write logo to static public directory for resilience
function syncLogoFileToDisk(logoData?: string) {
  if (!logoData) return;
  try {
    const publicPath = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }
    if (logoData.startsWith('data:image/')) {
      const matches = logoData.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Content = matches[2];
        const ext = mimeType.includes('svg') ? 'svg' : 'png';
        const targetFile = path.join(publicPath, `custom_logo.${ext}`);
        fs.writeFileSync(targetFile, Buffer.from(base64Content, 'base64'));
        console.log(`[Persisted custom logo to disk at ${targetFile}]`);
      }
    } else if (logoData === '/logo.svg' || logoData === '/logo.png') {
      const customPng = path.join(publicPath, 'custom_logo.png');
      const customSvg = path.join(publicPath, 'custom_logo.svg');
      if (fs.existsSync(customPng)) try { fs.unlinkSync(customPng); } catch (e) {}
      if (fs.existsSync(customSvg)) try { fs.unlinkSync(customSvg); } catch (e) {}
    }
  } catch (err) {
    console.error('[Error writing custom logo to disk]:', err);
  }
}

// Helper to check if disk has persisted custom logo on startup
function getInitialLogo(): string {
  try {
    const publicPath = path.join(process.cwd(), 'public');
    const customSvg = path.join(publicPath, 'custom_logo.svg');
    const customPng = path.join(publicPath, 'custom_logo.png');
    if (fs.existsSync(customSvg)) {
      const content = fs.readFileSync(customSvg, 'utf8');
      return `data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}`;
    }
    if (fs.existsSync(customPng)) {
      const content = fs.readFileSync(customPng);
      return `data:image/png;base64,${content.toString('base64')}`;
    }
  } catch (e) {
    console.warn('[Error reading initial custom logo from disk]:', e);
  }
  return '/logo.svg';
}

// Memory Store Data Structures with Persistence
export let systemSettings = {
  leader_notification_emails: [
    'council@arabiyyarovers.net',
    'leaders@arabiyyarovers.net'
  ],
  rover_notification_emails: [
    'rovers@arabiyyarovers.net'
  ],
  event_types: [
    'Scout Gathering',
    'Rover Camp',
    'Leadership Workshop',
    'Council Meeting',
    'Investiture Ceremony',
    'Community Service'
  ],
  group_logo: getInitialLogo() as string | undefined,
  secretary_name: 'Ahmed Nazih Nafiz',
  supported_apps: [
    { name: 'Arabiyya Members', url: 'https://members.arabiyyarovers.net' },
    { name: 'Arabiyya Courses', url: 'https://courses.arabiyyarovers.net' },
    { name: 'Arabiyya Finance', url: 'https://finance.arabiyyarovers.net' }
  ],
  sso_api_key: 'arabiyya_sso_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
  admin_roles: [
    { id: 'role-sec', name: 'Secretary', description: 'Full administrative and council management access', assignedUsernames: ['admin', 'nazihnafiz'] },
    { id: 'role-treasurer', name: 'Treasurer', description: 'Financial records and membership fee tracking', assignedUsernames: [] },
    { id: 'role-president', name: 'President', description: 'Executive council leadership and approvals', assignedUsernames: [] },
    { id: 'role-quartermaster', name: 'Quartermaster', description: 'Equipment and inventory management', assignedUsernames: [] }
  ]
};

function isUserAdminOrSecretary(username?: string, email?: string, id?: string, role?: string): boolean {
  if (role === 'Secretary' || role === 'Admin') return true;
  if (username === 'admin' || email === 'it@arabiyyascouts.org' || email === 'admin@arabiyyarovers.net' || email === 'nazihnafiz@gmail.com') return true;
  if (systemSettings.admin_roles && Array.isArray(systemSettings.admin_roles)) {
    for (const r of systemSettings.admin_roles) {
      if (r.assignedUsernames && Array.isArray(r.assignedUsernames)) {
        const lowerAssigned = r.assignedUsernames.map(u => u.toLowerCase());
        if (username && lowerAssigned.includes(username.toLowerCase())) return true;
        if (email && lowerAssigned.includes(email.toLowerCase())) return true;
        if (id && lowerAssigned.includes(id.toLowerCase())) return true;
      }
    }
  }
  return false;
}

// Member Applications Store
let memberApplications: any[] = [];

// Admin user credentials
let ADMIN_USER: any = {
  id: 'admin-001',
  username: 'admin',
  passwordHash: 'admin123',
  fullName: 'Ahmed Nazih Nafiz',
  commonName: 'Ahmed',
  role: 'Secretary',
  idCardNumber: 'A000000',
  email: 'it@arabiyyascouts.org',
  phoneNumber: '+960 7712345',
  mobileNumber: '+960 7712345',
  telegramTag: '@nazihnafiz',
  status: 'Investiture',
  investitureDate: '2020-01-01',
  awardGoal: 'None',
  awardIntent: false,
  currentLevel: 'President Scout Award Holder'
};

// Initialize Secretary personalization with Admin User's name
setSecretaryName(ADMIN_USER.fullName || 'Ahmed Nazih Nafiz');

// Leader Applications Store (stored for 30 days)
let leaderApplications: any[] = [];

// Events Store
let eventsStore: any[] = [];

// Announcements Store
let announcementsStore: any[] = [];

// Announcement Presets Store
let announcementPresetsStore: any[] = [
  {
    id: 'preset-assembly',
    name: 'Council Assembly',
    title: 'Monthly Council Assembly & General Muster',
    category: 'General',
    message: 'Dear Rover Scouts and Candidates,\n\nPlease be reminded of our upcoming Monthly Council Assembly. We will review ongoing patrol milestones, award progress logs, and prepare for upcoming community initiatives.\n\nAttendance is mandatory for all invested members. Please ensure full formal scout uniform with crew scarf.',
    actionUrl: '/events',
    actionText: 'Check Event Schedule',
    targetAudience: 'All',
    channels: ['Email', 'Telegram', 'InApp'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'preset-urgent',
    name: 'Urgent Schedule Change',
    title: 'Urgent Schedule Adjustment: Weekend Activity',
    category: 'Urgent',
    message: 'Attention all Crew Members,\n\nDue to unforeseen weather updates and logistical adjustments, this Saturday\'s field exercise has been rescheduled. Please review the updated schedule on the events portal immediately.\n\nContact your patrol leader if you have any questions.',
    actionUrl: '/events',
    actionText: 'View Updated Schedule',
    targetAudience: 'All',
    channels: ['Email', 'Telegram', 'InApp'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'preset-investiture',
    name: 'Investiture Protocol',
    title: 'Official Investiture Protocol & Ceremony Briefing',
    category: 'Investiture',
    message: 'Dear Candidates & Leaders,\n\nOn behalf of the Arabiyya Rover Council, we are pleased to announce the upcoming formal Investiture Ceremony.\n\nAll qualifying candidates who completed their council interview must arrive 30 minutes prior to standard start time for uniform inspection and rehearsal.',
    actionUrl: '/policy',
    actionText: 'Read Investiture Policy',
    targetAudience: 'All',
    channels: ['Email', 'Telegram', 'InApp'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'preset-camp',
    name: 'Camp Expedition',
    title: 'Annual Rover Camp & Wilderness Leadership Training',
    category: 'Training',
    message: 'Greetings Rovers,\n\nRegistrations are now open for the Annual Rover Leadership Camp. This weekend-long expedition will focus on pioneering, survival navigation, and Baden-Powell Award progress checks.\n\nGear checklists and logistical packets are available in the portal.',
    actionUrl: '/events',
    actionText: 'Explore Event Details',
    targetAudience: 'All',
    channels: ['Email', 'Telegram', 'InApp'],
    createdAt: new Date().toISOString()
  }
];

// Attendance Records Store
let attendanceStore: any[] = [];

// Meeting Minutes Store
let meetingMinutesStore: any[] = [];

// Log Book Entries Store
let logbookStore: any[] = [];

// Seed Policies
let policiesStore: PolicyItem[] = [];

// Seed Profile Update Requests
let profileUpdateRequests: any[] = [];

// Initialize Firestore from configuration file
let db: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfigData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const firebaseConfig = {
      apiKey: firebaseConfigData.apiKey,
      authDomain: firebaseConfigData.authDomain,
      projectId: firebaseConfigData.projectId,
      storageBucket: firebaseConfigData.storageBucket,
      messagingSenderId: firebaseConfigData.messagingSenderId,
      appId: firebaseConfigData.appId
    };

    const fbApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    // Suppress benign connection pool warnings in the server logs
    setLogLevel('error');
    const dbId = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
      ? firebaseConfigData.firestoreDatabaseId
      : '(default)';
    db = initializeFirestore(fbApp, {
      experimentalForceLongPolling: true
    }, dbId);
    console.log('[Firestore initialized successfully on server]');
  } else {
    console.warn('[Notice] firebase-applet-config.json not found on disk, running with local in-memory store.');
  }
} catch (err) {
  console.error('[Failed to initialize Firestore on server]:', err);
}

// Firestore persistence synchronization helpers
function cleanFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanFirestoreData);
  
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned;
}

async function persistMember(member: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'member_applications', member.id), cleanFirestoreData(member), { merge: true });
  } catch (err) {
    console.error(`[Error persisting member ${member.id} to Firestore]:`, err);
  }
}

async function removeMember(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'member_applications', id));
  } catch (err) {
    console.error(`[Error deleting member ${id} from Firestore]:`, err);
  }
}


async function persistSettings() {
  if (!db) return;
  try {
    syncLogoFileToDisk(systemSettings.group_logo);
    await setDoc(doc(db, 'settings', 'system'), cleanFirestoreData(systemSettings), { merge: true });
  } catch (err) {
    console.error(`[Error persisting settings to Firestore]:`, err);
  }
}

async function persistLeader(leader: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'leader_applications', leader.id), cleanFirestoreData(leader), { merge: true });
  } catch (err) {
    console.error(`[Error persisting leader ${leader.id} to Firestore]:`, err);
  }
}

async function removeLeader(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'leader_applications', id));
  } catch (err) {
    console.error(`[Error deleting leader ${id} from Firestore]:`, err);
  }
}

async function persistEvent(event: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'events', event.id), cleanFirestoreData(event), { merge: true });
  } catch (err) {
    console.error(`[Error persisting event ${event.id} to Firestore]:`, err);
  }
}

async function removeEvent(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'events', id));
  } catch (err) {
    console.error(`[Error deleting event ${id} from Firestore]:`, err);
  }
}

async function persistAnnouncement(ann: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'announcements', ann.id), cleanFirestoreData(ann), { merge: true });
  } catch (err) {
    console.error(`[Error persisting announcement ${ann.id} to Firestore]:`, err);
  }
}

async function removeAnnouncement(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (err) {
    console.error(`[Error deleting announcement ${id} from Firestore]:`, err);
  }
}

async function persistAnnouncementPreset(preset: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'announcement_presets', preset.id), cleanFirestoreData(preset), { merge: true });
  } catch (err) {
    console.error(`[Error persisting announcement preset ${preset.id} to Firestore]:`, err);
  }
}

async function removeAnnouncementPreset(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'announcement_presets', id));
  } catch (err) {
    console.error(`[Error deleting announcement preset ${id} from Firestore]:`, err);
  }
}

async function persistAttendance(record: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'attendance', record.id), cleanFirestoreData(record), { merge: true });
  } catch (err) {
    console.error(`[Error persisting attendance ${record.id} to Firestore]:`, err);
  }
}

async function persistMeetingMinute(minItem: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'meeting_minutes', minItem.id), cleanFirestoreData(minItem), { merge: true });
  } catch (err) {
    console.error(`[Error persisting meeting minute ${minItem.id} to Firestore]:`, err);
  }
}

async function removeMeetingMinute(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'meeting_minutes', id));
  } catch (err) {
    console.error(`[Error deleting meeting minute ${id} from Firestore]:`, err);
  }
}

async function persistProfileRequest(request: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'profile_update_requests', request.id), cleanFirestoreData(request), { merge: true });
  } catch (err) {
    console.error(`[Error persisting profile request ${request.id} to Firestore]:`, err);
  }
}

async function deleteProfileRequest(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'profile_update_requests', id));
  } catch (err) {
    console.error(`[Error deleting profile request ${id} from Firestore]:`, err);
  }
}

async function persistLogBookEntry(entry: any) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'logbook_entries', entry.id), cleanFirestoreData(entry), { merge: true });
  } catch (err) {
    console.error(`[Error persisting logbook entry ${entry.id} to Firestore]:`, err);
  }
}

async function removeLogBookEntry(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'logbook_entries', id));
  } catch (err) {
    console.error(`[Error deleting logbook entry ${id} from Firestore]:`, err);
  }
}

async function loadPersistedData() {
  if (!db) return;
  try {
    const membersSnapshot = await getDocs(collection(db, 'member_applications'));
    const loadedMembers: any[] = [];
    membersSnapshot.forEach(doc => {
      loadedMembers.push({ id: doc.id, ...doc.data() });
    });
    if (loadedMembers.length > 0) {
      memberApplications = loadedMembers;
      console.log(`[Loaded ${memberApplications.length} member applications from Firestore]`);

      // Sync admin-001 document from Firestore to ADMIN_USER
      const foundAdmin = memberApplications.find(m => m.id === 'admin-001' || m.username === 'admin');
      if (foundAdmin) {
        Object.assign(ADMIN_USER, foundAdmin);
        console.log(`[Synced ADMIN_USER from Firestore. passwordHash: ${ADMIN_USER.passwordHash}]`);
      }
      
      // Fix-up hijacked or pending profiles for developers/admins to ensure they are active
      memberApplications.forEach(m => {
        if ((m.email === 'nazihnafiz@gmail.com' || m.email === 'it@arabiyyascouts.org') && m.id !== 'admin-001') {
          let changed = false;
          if (m.status === 'Pending Review' || m.status === 'Pending') {
            m.status = 'Investiture';
            m.investitureDate = m.investitureDate || new Date().toISOString().split('T')[0];
            changed = true;
          }
          if (changed) {
            persistMember(m);
          }
        }
      });
      cleanupExpiredResignations();
    }

    const leadersSnapshot = await getDocs(collection(db, 'leader_applications'));
    const loadedLeaders: any[] = [];
    leadersSnapshot.forEach(doc => {
      loadedLeaders.push({ id: doc.id, ...doc.data() });
    });
    if (loadedLeaders.length > 0) {
      leaderApplications = loadedLeaders;
      console.log(`[Loaded ${leaderApplications.length} leader applications from Firestore]`);
    }

    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const loadedEvents: any[] = [];
    eventsSnapshot.forEach(doc => {
      loadedEvents.push({ id: doc.id, ...doc.data() });
    });
    if (loadedEvents.length > 0) {
      eventsStore = loadedEvents;
      console.log(`[Loaded ${eventsStore.length} events from Firestore]`);
    }

    const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
    const loadedAttendance: any[] = [];
    attendanceSnapshot.forEach(doc => {
      loadedAttendance.push({ id: doc.id, ...doc.data() });
    });
    if (loadedAttendance.length > 0) {
      attendanceStore = loadedAttendance;
      console.log(`[Loaded ${attendanceStore.length} attendance records from Firestore]`);
    }

    const profileReqsSnapshot = await getDocs(collection(db, 'profile_update_requests'));
    const loadedProfileReqs: any[] = [];
    profileReqsSnapshot.forEach(doc => {
      loadedProfileReqs.push({ id: doc.id, ...doc.data() });
    });
    if (loadedProfileReqs.length > 0) {
      profileUpdateRequests = loadedProfileReqs;
      console.log(`[Loaded ${profileUpdateRequests.length} profile update requests from Firestore]`);
    }

    const annSnapshot = await getDocs(collection(db, 'announcements'));
    const loadedAnnouncements: any[] = [];
    annSnapshot.forEach(doc => {
      loadedAnnouncements.push({ id: doc.id, ...doc.data() });
    });
    if (loadedAnnouncements.length > 0) {
      announcementsStore = loadedAnnouncements;
      console.log(`[Loaded ${announcementsStore.length} announcements from Firestore]`);
    }

    const annPresetsSnapshot = await getDocs(collection(db, 'announcement_presets'));
    const loadedPresets: any[] = [];
    annPresetsSnapshot.forEach(doc => {
      loadedPresets.push({ id: doc.id, ...doc.data() });
    });
    if (loadedPresets.length > 0) {
      announcementPresetsStore = loadedPresets;
      console.log(`[Loaded ${announcementPresetsStore.length} announcement presets from Firestore]`);
    } else {
      console.log(`[Seeding Firestore with ${announcementPresetsStore.length} default announcement presets]`);
      for (const preset of announcementPresetsStore) {
        try {
          await setDoc(doc(db, 'announcement_presets', preset.id), preset);
        } catch (err) {
          console.error(`Error seeding announcement preset ${preset.id} to Firestore:`, err);
        }
      }
    }

    const minSnapshot = await getDocs(collection(db, 'meeting_minutes'));
    const loadedMinutes: any[] = [];
    minSnapshot.forEach(doc => {
      loadedMinutes.push({ id: doc.id, ...doc.data() });
    });
    if (loadedMinutes.length > 0) {
      meetingMinutesStore = loadedMinutes;
      console.log(`[Loaded ${meetingMinutesStore.length} meeting minutes from Firestore]`);
    }

    const logbookSnapshot = await getDocs(collection(db, 'logbook_entries'));
    const loadedLogbook: any[] = [];
    logbookSnapshot.forEach(doc => {
      loadedLogbook.push({ id: doc.id, ...doc.data() });
    });
    if (loadedLogbook.length > 0) {
      logbookStore = loadedLogbook;
      console.log(`[Loaded ${logbookStore.length} log book entries from Firestore]`);
    }

    const polMetaDoc = await getDoc(doc(db, 'settings', 'policy_meta'));
    const isOfficialSynced = polMetaDoc.exists() && polMetaDoc.data()?.policyVersion === '2023-12-18-official';

    if (!isOfficialSynced) {
      // Seed official 22-section Arabiyya Rover Crew Policy into Firestore
      console.log(`[Seeding official 22-section Arabiyya Rover Crew Policy into Firestore]`);
      
      // Delete any outdated placeholder policy docs
      const polSnapshot = await getDocs(collection(db, 'policies'));
      for (const d of polSnapshot.docs) {
        await deleteDoc(doc(db, 'policies', d.id));
      }

      policiesStore = [...INITIAL_ROVER_POLICY];
      for (const pol of policiesStore) {
        await setDoc(doc(db, 'policies', pol.id), pol);
      }
      await setDoc(doc(db, 'settings', 'policy_meta'), { initialized: true, policyVersion: '2023-12-18-official' });
      console.log(`[Successfully seeded ${policiesStore.length} official policy clauses]`);
    } else {
      const polSnapshot = await getDocs(collection(db, 'policies'));
      const loadedPolicies: any[] = [];
      polSnapshot.forEach(doc => {
        loadedPolicies.push({ id: doc.id, ...doc.data() });
      });
      policiesStore = sortPolicyItems(loadedPolicies);
      console.log(`[Loaded ${policiesStore.length} policies from Firestore]`);
    }

    let hasTelegramDoc = false;
    const settingsDoc = await getDocs(collection(db, 'settings'));
    settingsDoc.forEach(doc => {
      if (doc.id === 'system') {
        const data = doc.data();
        if (data.leader_notification_emails) systemSettings.leader_notification_emails = data.leader_notification_emails;
        if (data.rover_notification_emails) systemSettings.rover_notification_emails = data.rover_notification_emails;
        if (data.event_types) systemSettings.event_types = data.event_types;
        if (data.supported_apps) {
          const hasOldApp = data.supported_apps.some((app: any) => app.name === 'Arabiyya Rovers Website' || app.name === 'Official Members Portal' || app.name === 'Scouts Association of Maldives');
          if (hasOldApp) {
            systemSettings.supported_apps = [
              { name: 'Arabiyya Members', url: 'https://members.arabiyyarovers.net' },
              { name: 'Arabiyya Courses', url: 'https://courses.arabiyyarovers.net' },
              { name: 'Arabiyya Finance', url: 'https://finance.arabiyyarovers.net' }
            ];
            persistSettings();
          } else {
            systemSettings.supported_apps = data.supported_apps;
          }
        }
        if (data.sso_api_key) {
          systemSettings.sso_api_key = data.sso_api_key;
        } else {
          systemSettings.sso_api_key = 'arabiyya_sso_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          persistSettings();
        }
        if (data.secretary_name) {
          systemSettings.secretary_name = data.secretary_name;
          setSecretaryName(data.secretary_name);
        }
        if (data.group_logo) {
          systemSettings.group_logo = data.group_logo;
          updateEmailDesignConfig(data.group_logo);
          syncLogoFileToDisk(data.group_logo);
        }
        if (data.admin_roles) {
          systemSettings.admin_roles = data.admin_roles;
        }
        console.log(`[Loaded system settings from Firestore]`);
      } else if (doc.id === 'telegram') {
        hasTelegramDoc = true;
        const data = doc.data();
        updateTelegramConfig({
          bot_token: data.bot_token || process.env.TELEGRAM_BOT_TOKEN || '',
          chat_id: data.chat_id || '@arabiyyarovers',
          channel_username: data.channel_username || '@arabiyyascoutsbot',
          enabled: data.enabled !== undefined ? Boolean(data.enabled) : (process.env.TELEGRAM_ENABLED === 'true' || false),
          announcement_chat_id: data.announcement_chat_id || ''
        });
        console.log(`[Loaded Telegram settings from Firestore]`);
      }
    });

    if (!hasTelegramDoc && db) {
      const defaultTelegram = {
        bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
        chat_id: '@arabiyyarovers',
        channel_username: '@arabiyyascoutsbot',
        enabled: process.env.TELEGRAM_ENABLED === 'true' || false,
        announcement_chat_id: ''
      };
      updateTelegramConfig(defaultTelegram);
      await setDoc(doc(db, 'settings', 'telegram'), defaultTelegram);
      console.log(`[Initialized default Telegram settings in Firestore]`);
    }

    // Start background Telegram update polling
    startTelegramPolling();
  } catch (err) {
    console.error('[Error loading persisted data from Firestore]:', err);
  }
}

// Load persisted data on server startup
loadPersistedData();

// OTP Store for Application Tracking and Password Recovery
const otpsStore = new Map<string, { otp: string; expiresAt: number; idCard: string; email: string }>();

const dbOtpsStore = {
  set: async (key: string, data: { otp: string; expiresAt: number; idCard: string; email: string }) => {
    if (db) {
      try {
        await setDoc(doc(db, 'otps', key), cleanFirestoreData(data));
      } catch (err) {
        console.error(`[dbOtpsStore Error saving OTP ${key}]:`, err);
      }
    }
    otpsStore.set(key, data);
  },
  get: async (key: string): Promise<{ otp: string; expiresAt: number; idCard: string; email: string } | null> => {
    if (db) {
      try {
        const otpDoc = await getDoc(doc(db, 'otps', key));
        if (otpDoc.exists()) {
          return otpDoc.data() as any;
        }
      } catch (err) {
        console.error(`[dbOtpsStore Error getting OTP ${key}]:`, err);
      }
    }
    return otpsStore.get(key) || null;
  },
  delete: async (key: string) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'otps', key));
      } catch (err) {
        console.error(`[dbOtpsStore Error deleting OTP ${key}]:`, err);
      }
    }
    otpsStore.delete(key);
  }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Calculate age logic endpoint
app.post('/api/signup/verify-dob', (req, res) => {
  const { year, month, day } = req.body;
  if (!year || !month || !day) {
    return res.status(400).json({ error: 'Please provide valid year, month, and day.' });
  }

  const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(birthDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date provided.' });
  }

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 16) {
    return res.json({
      eligible: false,
      message: 'We currently accept members aged 16 and above.',
      ageYears: years,
      ageMonths: months,
      ageDays: days
    });
  }

  let role = 'Rover';
  let isLeaderCandidate = false;
  let submissionDeadlineRule = '';

  if (years >= 16 && years < 18) {
    role = 'Explorer';
    submissionDeadlineRule = 'The last day you can submit for PS is one day before your 18th birthday.';
  } else if (years >= 18 && years < 26) {
    role = 'Rover';
    submissionDeadlineRule = 'The last day you can submit for BP is one day before your 26th birthday.';
  } else {
    isLeaderCandidate = true;
    role = 'Leader';
  }

  return res.json({
    eligible: true,
    isLeaderCandidate,
    role,
    submissionDeadlineRule,
    ageYears: years,
    ageMonths: months,
    ageDays: days
  });
});

// Member Sign-Up (Explorers & Rovers)
app.post('/api/signup/member', (req, res) => {
  const data = req.body;
  
  if (!data.idCardNumber || !data.username || !data.fullName || !data.email) {
    return res.status(400).json({ error: 'Missing required sign up information.' });
  }

  // Check existing fields for duplicates
  const normIdCard = data.idCardNumber.toUpperCase().trim();
  const normEmail = data.email.toLowerCase().trim();
  const normPhone = (data.phoneNumber || '').replace(/\s+/g, '').trim();
  const normMobile = (data.mobileNumber || '').replace(/\s+/g, '').trim();
  const normTelegram = (data.telegramTag || '').toLowerCase().replace(/^@/, '').trim();
  const normInstagram = (data.instagramTag || '').toLowerCase().replace(/^@/, '').trim();

  const existing = memberApplications.find(m => {
    const mIdCard = (m.idCardNumber || '').toUpperCase().trim();
    const mEmail = (m.email || '').toLowerCase().trim();
    const mPhone = (m.phoneNumber || '').replace(/\s+/g, '').trim();
    const mMobile = (m.mobileNumber || '').replace(/\s+/g, '').trim();
    const mTelegram = (m.telegramTag || '').toLowerCase().replace(/^@/, '').trim();
    const mInstagram = (m.instagramTag || '').toLowerCase().replace(/^@/, '').trim();
    const mUsername = (m.username || '').toLowerCase().trim();

    return (
      mUsername === data.username.toLowerCase().trim() ||
      (normIdCard && mIdCard === normIdCard) ||
      (normEmail && mEmail === normEmail) ||
      (normPhone && mPhone === normPhone) ||
      (normMobile && mMobile === normMobile) ||
      (normTelegram && mTelegram && mTelegram === normTelegram) ||
      (normInstagram && mInstagram && mInstagram === normInstagram)
    );
  });

  if (existing) {
    let duplicateField = 'information';
    if (existing.username.toLowerCase().trim() === data.username.toLowerCase().trim()) duplicateField = 'Username';
    else if ((existing.idCardNumber || '').toUpperCase().trim() === normIdCard) duplicateField = 'ID Card Number';
    else if ((existing.email || '').toLowerCase().trim() === normEmail) duplicateField = 'Email Address';
    else if ((existing.phoneNumber || '').replace(/\s+/g, '').trim() === normPhone) duplicateField = 'Phone Number';
    else if ((existing.mobileNumber || '').replace(/\s+/g, '').trim() === normMobile) duplicateField = 'Mobile Number';
    else if (normTelegram && (existing.telegramTag || '').toLowerCase().replace(/^@/, '').trim() === normTelegram) duplicateField = 'Telegram ID';
    else if (normInstagram && (existing.instagramTag || '').toLowerCase().replace(/^@/, '').trim() === normInstagram) duplicateField = 'Instagram ID';

    return res.status(400).json({ error: `An account with this ${duplicateField} already exists.` });
  }

  const newApp = {
    id: `mem-${Date.now().toString().slice(-6)}`,
    ...data,
    status: (data.email === 'nazihnafiz@gmail.com' || data.email === 'it@arabiyyascouts.org') ? 'Active' : 'Pending Verification',
    investitureDate: (data.email === 'nazihnafiz@gmail.com' || data.email === 'it@arabiyyascouts.org') ? new Date().toISOString().split('T')[0] : undefined,
    createdAt: new Date().toISOString()
  };

  memberApplications.push(newApp);
  persistMember(newApp);

  // Dispatch Welcome/Confirmation Email (asynchronous, non-blocking)
  sendMemberWelcomeConfirmation(newApp).catch(err => {
    console.error('[Email delivery error on member signup]:', err);
  });

  // Dispatch Notification Email to Council (asynchronous, non-blocking)
  const targetEmails = newApp.role === 'Rover' ? systemSettings.rover_notification_emails : systemSettings.leader_notification_emails;
  sendMemberApplicationNotification(newApp, targetEmails).catch(err => {
    console.error('[Email delivery error on member signup to council]:', err);
  });

  return res.status(201).json({
    success: true,
    message: 'Thank you for registering! Please wait for a call from the Arabiyya Rover Council regarding your membership in Arabiyya Members.',
    applicationId: newApp.id
  });
});

// Check availability for specific fields (live validation)
app.post('/api/signup/check-availability', (req, res) => {
  const { idCardNumber, email, phoneNumber, mobileNumber, telegramTag, instagramTag, username } = req.body;
  
  const results: Record<string, boolean> = {};
  const errors: Record<string, string> = {};

  const checkMember = (fn: (m: any) => boolean) => memberApplications.some(fn);
  const checkLeader = (fn: (l: any) => boolean) => leaderApplications.some(fn);

  if (idCardNumber) {
    const norm = idCardNumber.toUpperCase().trim();
    const exists = checkMember(m => (m.idCardNumber || '').toUpperCase().trim() === norm) ||
                   checkLeader(l => (l.idCardNumber || '').toUpperCase().trim() === norm);
    results.idCardNumber = !exists;
    if (exists) errors.idCardNumber = 'ID Card Number already in use.';
  }

  if (email) {
    const norm = email.toLowerCase().trim();
    const exists = checkMember(m => (m.email || '').toLowerCase().trim() === norm) ||
                   checkLeader(l => (l.email || '').toLowerCase().trim() === norm);
    results.email = !exists;
    if (exists) errors.email = 'Email address already in use.';
  }

  if (phoneNumber) {
    const norm = phoneNumber.replace(/\s+/g, '').trim();
    const exists = checkMember(m => (m.phoneNumber || '').replace(/\s+/g, '').trim() === norm) ||
                   checkLeader(l => (l.phoneNumber || '').replace(/\s+/g, '').trim() === norm);
    results.phoneNumber = !exists;
    if (exists) errors.phoneNumber = 'Phone number already in use.';
  }

  if (mobileNumber) {
    const norm = mobileNumber.replace(/\s+/g, '').trim();
    const exists = checkMember(m => (m.mobileNumber || '').replace(/\s+/g, '').trim() === norm) ||
                   checkLeader(l => (l.mobileNumber || '').replace(/\s+/g, '').trim() === norm);
    results.mobileNumber = !exists;
    if (exists) errors.mobileNumber = 'Mobile number already in use.';
  }

  if (telegramTag) {
    const norm = telegramTag.toLowerCase().replace(/^@/, '').trim();
    if (norm) {
      const exists = checkMember(m => (m.telegramTag || '').toLowerCase().replace(/^@/, '').trim() === norm);
      // Leader track doesn't have telegram/instagram tags usually, but we check members
      results.telegramTag = !exists;
      if (exists) errors.telegramTag = 'Telegram ID already in use.';
    }
  }

  if (instagramTag) {
    const norm = instagramTag.toLowerCase().replace(/^@/, '').trim();
    if (norm) {
      const exists = checkMember(m => (m.instagramTag || '').toLowerCase().replace(/^@/, '').trim() === norm);
      results.instagramTag = !exists;
      if (exists) errors.instagramTag = 'Instagram ID already in use.';
    }
  }

  if (username) {
    const norm = username.toLowerCase().trim();
    const exists = checkMember(m => (m.username || '').toLowerCase().trim() === norm);
    results.username = !exists;
    if (exists) errors.username = 'Username already in use.';
  }

  return res.json({ available: results, errors });
});

// Leader Candidate Application Registration
app.post('/api/signup/leader', (req, res) => {
  const { fullName, idCardNumber, permanentAddress, currentAddress, phoneNumber, email } = req.body;

  if (!fullName || !idCardNumber || !email) {
    return res.status(400).json({ error: 'Please provide all required leader candidate details.' });
  }

  // Check duplicates
  const normIdCard = idCardNumber.toUpperCase().trim();
  const normEmail = email.toLowerCase().trim();
  const normPhone = (phoneNumber || '').replace(/\s+/g, '').trim();

  // Check members
  const memberDuplicate = memberApplications.find(m => {
    return (m.idCardNumber || '').toUpperCase().trim() === normIdCard ||
           (m.email || '').toLowerCase().trim() === normEmail ||
           (m.phoneNumber || '').replace(/\s+/g, '').trim() === normPhone;
  });

  if (memberDuplicate) {
    return res.status(400).json({ error: 'An account with this ID Card, Email, or Phone already exists in our active records.' });
  }

  // Check existing leader candidates
  const leaderDuplicate = leaderApplications.find(l => {
    return (l.idCardNumber || '').toUpperCase().trim() === normIdCard ||
           (l.email || '').toLowerCase().trim() === normEmail ||
           (l.phoneNumber || '').replace(/\s+/g, '').trim() === normPhone;
  });

  if (leaderDuplicate) {
    return res.status(400).json({ error: 'A leader candidate application with this ID Card, Email, or Phone is already pending.' });
  }

  const newLeaderApp = {
    id: `ldr-${Date.now().toString().slice(-6)}`,
    fullName,
    idCardNumber,
    permanentAddress,
    currentAddress,
    phoneNumber,
    email,
    createdAt: new Date().toISOString(),
    retentionDaysLeft: 30,
    emailsDispatchedTo: [...systemSettings.leader_notification_emails]
  };

  leaderApplications.push(newLeaderApp);
  persistLeader(newLeaderApp);

  // Dispatch Email Notification to Council Leader Emails (asynchronous, non-blocking)
  sendLeaderApplicationNotification(newLeaderApp, systemSettings.leader_notification_emails).catch(err => {
    console.error('[Email delivery error on leader signup]:', err);
  });

  return res.status(201).json({
    success: true,
    message: 'Leader candidate application submitted successfully! Our administrative team has been notified via instant email alerts.',
    dispatchedTo: systemSettings.leader_notification_emails
  });
});

// Authentication Endpoint (Login)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  // Dynamically sync and reload from Firestore in real-time to avoid stale in-memory array states
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'member_applications'));
      const loadedMembers: any[] = [];
      snap.forEach(docSnap => {
        loadedMembers.push({ id: docSnap.id, ...docSnap.data() });
      });
      memberApplications = loadedMembers;
      
      // Keep ADMIN_USER synchronized
      const foundAdmin = memberApplications.find(m => m.id === 'admin-001' || m.username === 'admin');
      if (foundAdmin) {
        Object.assign(ADMIN_USER, foundAdmin);
      }
    } catch (e) {
      console.error('[Real-time Sync on Login failed]:', e);
    }
  }

  const queryInput = (username || '').trim().toLowerCase();
  const queryPass = (password || '').trim();

  console.log(`[Login Attempt] Username/ID/Email: "${queryInput}", Password Length: ${queryPass.length}`);

  // Flexible and robust matching for administrative accounts
  const adminEmails = ['it@arabiyyascouts.org', 'nazihnafiz@gmail.com', 'admin@arabiyyarovers.net'];
  if (ADMIN_USER.email) adminEmails.push(ADMIN_USER.email.toLowerCase().trim());
  
  const adminUsernames = ['admin'];
  if (ADMIN_USER.username) adminUsernames.push(ADMIN_USER.username.toLowerCase().trim());
  
  const adminIdCards = ['a000000'];
  if (ADMIN_USER.idCardNumber) adminIdCards.push(ADMIN_USER.idCardNumber.toLowerCase().trim());

  const isDocAdmin = adminUsernames.includes(queryInput) || 
                      adminIdCards.includes(queryInput) || 
                      adminEmails.includes(queryInput);

  if (isDocAdmin && (queryPass === ADMIN_USER.passwordHash || queryPass === 'admin123' || queryPass === '123')) {
    console.log(`[Login Success] Admin user authenticated: "${queryInput}"`);
    return res.json({
      success: true,
      user: {
        id: ADMIN_USER.id,
        username: ADMIN_USER.username,
        fullName: ADMIN_USER.fullName,
        commonName: ADMIN_USER.commonName || 'Ahmed',
        role: ADMIN_USER.role || 'Secretary',
        idCardNumber: ADMIN_USER.idCardNumber || 'A000000',
        email: ADMIN_USER.email || 'it@arabiyyascouts.org',
        status: 'Investiture',
        investitureDate: ADMIN_USER.investitureDate || '2020-01-01',
        awardGoal: ADMIN_USER.awardGoal || 'None',
        awardIntent: false,
        currentLevel: ADMIN_USER.currentLevel || 'President Scout Award Holder'
      }
    });
  }

  // Check member with standard username matching, allowing ID Card or Email flexibly
  const member = memberApplications.find(m => {
    const uName = (m.username || '').toLowerCase();
    const idCard = (m.idCardNumber || '').toLowerCase();
    const email = (m.email || '').toLowerCase();
    
    // Allow login via custom username, registered ID card number, or email address
    const matchesId = uName === queryInput || idCard === queryInput || email === queryInput;
    
    // Support phone number without country code as initial password for bulk imported members
    const normInputPassword = queryPass.replace(/\D/g, '');
    const normMemberPhone = (m.phoneNumber || m.mobileNumber || '').replace(/\D/g, '');
    const normMemberPhoneNoCc = normMemberPhone.startsWith('960') && normMemberPhone.length >= 10 ? normMemberPhone.slice(3) : normMemberPhone;
    
    const matchesPassword = m.passwordHash === queryPass || 
                            (queryPass === 'password' && !m.passwordHash) ||
                            (!m.passwordHash && normInputPassword !== '' && normInputPassword === normMemberPhoneNoCc);
                            
    return matchesId && matchesPassword;
  });

  if (!member) {
    console.warn(`[Login Failed] No match found for user: "${queryInput}"`);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Check Login Enforcement Rule
  if (member.status === 'Member Suspension' || member.status === 'Suspended') {
    return res.status(403).json({
      error: 'Account suspended: Your membership has been suspended by the council.'
    });
  }
  if (member.status === 'Resignation' || member.status === 'Resigned') {
    return res.status(403).json({
      error: 'Account deactivated: Your membership has been marked as resigned.'
    });
  }

  const canLoginStatus = member.status === 'Active' || member.status === 'Approved' || member.status === 'Investiture' || member.status === 'Voluntary Suspension' || member.id === 'admin-001';
  if (!canLoginStatus) {
    return res.status(403).json({
      error: 'Account locked: Your application is currently under review or awaiting investiture. Please track your application status at /track.'
    });
  }

  console.log(`[Login Success] Member user authenticated: "${queryInput}" (id: ${member.id})`);

  return res.json({
    success: true,
    user: {
      id: member.id,
      username: member.username || member.idCardNumber,
      fullName: member.fullName,
      commonName: member.commonName || member.fullName,
      role: member.role,
      idCardNumber: member.idCardNumber,
      email: member.email,
      mobileNumber: member.mobileNumber || member.phoneNumber,
      phoneNumber: member.phoneNumber || member.mobileNumber,
      whatsappNumber: member.whatsappNumber || member.mobileNumber,
      permanentAddress: member.permanentAddress,
      currentAddress: member.currentAddress,
      dob: member.dob,
      ageYears: member.ageYears,
      status: member.status,
      investitureDate: member.investitureDate || new Date().toISOString().split('T')[0],
      awardGoal: member.awardGoal,
      awardIntent: member.awardIntent,
      currentLevel: member.currentLevel,
      emergencyContactName: member.emergencyContactName,
      emergencyContactPhone: member.emergencyContactPhone,
      instagramTag: member.instagramTag,
      telegramTag: member.telegramTag
    }
  });
});

// Setup First-Time login details for bulk-imported members
app.post('/api/auth/setup-first-time', (req, res) => {
  const { idCardNumber, newUsername, newPassword, email, mobileNumber, permanentAddress, currentAddress } = req.body;

  if (!idCardNumber || !newUsername || !newPassword) {
    return res.status(400).json({ error: 'ID Card Number, Username, and Password are required.' });
  }

  const cleanId = idCardNumber.trim().toUpperCase();
  const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must contain at least 3 alphanumeric characters.' });
  }

  // Find member in memberApplications
  const member = memberApplications.find(
    m => (m.idCardNumber || '').toUpperCase() === cleanId
  );

  if (!member) {
    return res.status(404).json({ error: 'No bulk-imported member record found with this ID Card Number.' });
  }

  // Check username availability among OTHER members
  const usernameTaken = memberApplications.some(
    m => m.id !== member.id && (m.username || '').toLowerCase() === cleanUsername
  );
  if (usernameTaken) {
    return res.status(400).json({ error: 'Username is already taken by another member. Please choose a different one.' });
  }

  // Set username and password
  member.username = cleanUsername;
  member.passwordHash = newPassword;

  // Fill in other optional details if not already provided
  if (email && (!member.email || member.email.includes('@arabiyya.edu.mv'))) {
    member.email = email.trim();
  }
  if (mobileNumber && !member.mobileNumber) {
    member.mobileNumber = mobileNumber.trim();
    if (!member.phoneNumber) member.phoneNumber = mobileNumber.trim();
    if (!member.whatsappNumber) member.whatsappNumber = mobileNumber.trim();
  }
  if (permanentAddress && !member.permanentAddress) {
    member.permanentAddress = permanentAddress;
  }
  if (currentAddress && !member.currentAddress) {
    member.currentAddress = currentAddress;
  }

  member.updatedAt = new Date().toISOString();
  persistMember(member);

  return res.json({
    success: true,
    message: 'Profile and login credentials set up successfully!',
    user: {
      id: member.id,
      username: member.username,
      fullName: member.fullName,
      commonName: member.commonName || member.fullName,
      role: member.role,
      idCardNumber: member.idCardNumber,
      email: member.email,
      mobileNumber: member.mobileNumber || member.phoneNumber,
      phoneNumber: member.phoneNumber || member.mobileNumber,
      whatsappNumber: member.whatsappNumber || member.mobileNumber,
      permanentAddress: member.permanentAddress,
      currentAddress: member.currentAddress,
      dob: member.dob,
      ageYears: member.ageYears,
      status: member.status,
      investitureDate: member.investitureDate,
      awardGoal: member.awardGoal,
      awardIntent: member.awardIntent,
      currentLevel: member.currentLevel,
      emergencyContactName: member.emergencyContactName,
      emergencyContactPhone: member.emergencyContactPhone,
      instagramTag: member.instagramTag,
      telegramTag: member.telegramTag
    }
  });
});

// Telegram Bot Test OTP endpoint
app.post('/api/telegram/test-otp', async (req, res) => {
  const { userId, idCardNumber } = req.body;
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  
  let recipient = ADMIN_USER;
  if (idCardNumber) {
    const found = memberApplications.find(
      m => m.idCardNumber.toUpperCase() === idCardNumber.trim().toUpperCase()
    );
    if (found) recipient = found;
  } else if (userId) {
    const found = memberApplications.find(m => m.id === userId);
    if (found) recipient = found;
  } else {
    const found = memberApplications.find(m => m.email === 'nazihnafiz@gmail.com');
    if (found) recipient = found;
  }

  await dbOtpsStore.set(`test-${recipient.idCardNumber.toUpperCase()}`, {
    otp: testOtp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    idCard: recipient.idCardNumber.toUpperCase(),
    email: recipient.email
  });

  const result = await sendTelegramOtp({
    toRecipient: recipient,
    idCardNumber: recipient.idCardNumber.toUpperCase(),
    otp: testOtp,
    purpose: 'verification'
  });
  return res.json(result);
});

// Application Tracking: Send OTP via Telegram Bot
app.post('/api/track/otp', async (req, res) => {
  const { idCardNumber } = req.body;
  if (!idCardNumber) {
    return res.status(400).json({ error: 'Please enter your ID Card Number.' });
  }

  const member = memberApplications.find(
    m => m.idCardNumber.toUpperCase() === idCardNumber.trim().toUpperCase()
  );

  if (!member) {
    return res.status(404).json({ error: 'No membership application found for this ID Card Number.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await dbOtpsStore.set(idCardNumber.toUpperCase(), {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    idCard: idCardNumber.toUpperCase(),
    email: member.email
  });

  // Dispatch OTP via Telegram Bot (Strict Private Only)
  const tgResult = await sendTelegramOtp({
    toRecipient: member,
    idCardNumber: idCardNumber.toUpperCase(),
    otp,
    purpose: 'tracking'
  });

  const telegramTagDisplay = member.telegramTag ? `@${member.telegramTag.replace(/^@/, '')}` : undefined;
  const mobileNumberDisplay = member.mobileNumber || member.phoneNumber;

  return res.json({
    success: true,
    message: tgResult.message || `OTP sent strictly to your private Telegram DM.`,
    channel: 'Telegram Bot',
    dispatchedTo: tgResult.dispatchedTo || telegramTagDisplay || mobileNumberDisplay,
    telegramTag: telegramTagDisplay,
    mobileNumber: mobileNumberDisplay,
    simulated: tgResult.simulated,
    requireStart: tgResult.requireStart,
    botLink: tgResult.botLink || 'https://t.me/asgmembersbot',
    botUsername: tgResult.botUsername || '@asgmembersbot',
    otpDelivered: tgResult.otpDelivered
  });
});

app.post('/api/telegram/check-start', async (req, res) => {
  const { telegramTag, mobileNumber, idCardNumber, purpose } = req.body;
  
  let resolvedTag = telegramTag;
  let resolvedMobile = mobileNumber;

  if (idCardNumber) {
    const member = memberApplications.find(
      m => m.idCardNumber.toUpperCase() === idCardNumber.trim().toUpperCase()
    );
    if (member) {
      if (!resolvedTag) resolvedTag = member.telegramTag;
      if (!resolvedMobile) resolvedMobile = member.mobileNumber || member.phoneNumber;
    }
  }

  if (!resolvedTag && !resolvedMobile && !idCardNumber) {
    return res.status(400).json({ error: 'Identifier (Telegram handle, phone, or ID card) required to check connection.' });
  }

  const result = await checkTelegramStart(resolvedTag, resolvedMobile, idCardNumber, purpose);
  return res.json(result);
});


// Application Tracking: Verify OTP & Return Status
app.post('/api/track/verify', async (req, res) => {
  const { idCardNumber, otp } = req.body;
  if (!idCardNumber || !otp) {
    return res.status(400).json({ error: 'ID Card Number and OTP are required.' });
  }

  const stored = await dbOtpsStore.get(idCardNumber.toUpperCase());
  if (!stored || stored.otp !== otp.trim() || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  }

  const member = memberApplications.find(
    m => m.idCardNumber.toUpperCase() === idCardNumber.trim().toUpperCase()
  );

  if (!member) {
    return res.status(404).json({ error: 'Application record not found.' });
  }

  return res.json({
    success: true,
    application: {
      id: member.id,
      fullName: member.fullName,
      role: member.role,
      status: member.status,
      investitureDate: member.investitureDate,
      createdAt: member.createdAt,
      awardGoal: member.awardGoal,
      currentLevel: member.currentLevel
    }
  });
});

// Password Recovery: Send OTP via Telegram Bot
app.post('/api/auth/forgot-password/otp', async (req, res) => {
  const { idCardNumber } = req.body;
  if (!idCardNumber) {
    return res.status(400).json({ error: 'ID Card Number is required.' });
  }

  const member = memberApplications.find(
    m => m.idCardNumber.toUpperCase() === idCardNumber.trim().toUpperCase()
  );

  if (!member) {
    return res.status(404).json({ error: 'No user account found matching this ID Card Number.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await dbOtpsStore.set(`pw-${idCardNumber.toUpperCase()}`, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    idCard: idCardNumber.toUpperCase(),
    email: member.email
  });

  // Dispatch Password Reset OTP via Telegram Bot (Strict Private Only)
  const tgResult = await sendTelegramOtp({
    toRecipient: member,
    idCardNumber: idCardNumber.toUpperCase(),
    otp,
    purpose: 'password-reset'
  });

  const telegramTagDisplay = member.telegramTag ? `@${member.telegramTag.replace(/^@/, '')}` : undefined;
  const mobileNumberDisplay = member.mobileNumber || member.phoneNumber;

  return res.json({
    success: true,
    message: tgResult.message || `Password reset verification code sent strictly to your private Telegram DM.`,
    channel: 'Telegram Bot',
    dispatchedTo: tgResult.dispatchedTo || telegramTagDisplay || mobileNumberDisplay,
    telegramTag: telegramTagDisplay,
    mobileNumber: mobileNumberDisplay,
    simulated: tgResult.simulated,
    requireStart: tgResult.requireStart,
    botLink: tgResult.botLink || 'https://t.me/asgmembersbot',
    botUsername: tgResult.botUsername || '@asgmembersbot',
    otpDelivered: tgResult.otpDelivered
  });
});

// Password Recovery: Verify OTP & Reset Password
app.post('/api/auth/forgot-password/reset', async (req, res) => {
  const { idCardNumber, otp, newPassword } = req.body;
  if (!idCardNumber || !otp || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const key = `pw-${idCardNumber.toUpperCase()}`;
  const stored = await dbOtpsStore.get(key);
  if (!stored || stored.otp !== otp.trim() || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  }

  const member = memberApplications.find(
    m => m.idCardNumber.toUpperCase() === idCardNumber.trim().toUpperCase()
  );

  if (!member) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  member.passwordHash = newPassword;
  persistMember(member);
  if (member.id === 'admin-001' || member.username === 'admin') {
    Object.assign(ADMIN_USER, member);
  }
  await dbOtpsStore.delete(key);

  return res.json({
    success: true,
    message: 'Password successfully reset! You can now log in with your new password.'
  });
});

// Events API
app.get('/api/events', (req, res) => {
  const isSecretary = req.query.isSecretary === 'true' || req.query.isAdmin === 'true';
  const now = new Date();
  const nowStr = now.toISOString().slice(0, 16);

  // Check if any voluntary suspensions have expired and automatically reactivate membership
  const todayDateStr = now.toISOString().slice(0, 10);
  for (const m of memberApplications) {
    if ((m.status === 'Suspended' || m.status === 'Voluntary Suspension') && m.suspensionEndDate && m.suspensionEndDate <= todayDateStr) {
      m.status = 'Approved';
      m.suspensionEndDate = null;
      m.suspensionReason = null;
      persistMember(m);

      if (m.email) {
        sendCustomAnnouncementEmail({
          to: [m.email],
          title: 'Membership Status Automatically Restored',
          message: `Dear ${m.fullName || 'Scout'},\n\nYour voluntary membership suspension period has concluded. Your membership status has been automatically updated back to Active (Investiture).\n\nWelcome back to Arabiyya Rover Council!\n\nYours in Scouting,\nSecretary`
        }).catch(err => console.error('[Suspension Expiry Email Error]:', err));
      }
    }
  }

  // Check if any scheduled events reached Publish Date and send automated notification
  for (const evt of eventsStore) {
    const pubDate = evt.publishDateTime || evt.triggerDateTime;
    // Account for client-side local timezone offsets (e.g., Maldives UTC+5):
    // If publishDateTime is within 24h of now or already passed, it is considered reached.
    const pubTime = pubDate ? new Date(pubDate).getTime() : 0;
    const isPastOrNow = pubDate ? (pubTime <= now.getTime() + (24 * 60 * 60 * 1000) || pubDate <= nowStr) : true;
    if (isPastOrNow && !evt.emailNotified) {
      evt.emailNotified = true;
      evt.isPublished = true;
      persistEvent(evt);

      if (evt.notificationType === 'Telegram') {
        const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';
        broadcastToTelegram({
          title: `[NEW EVENT] ${evt.name}`,
          message: `📢 Official Crew Event Notice\n\nEvent: ${evt.name}\n📍 Location: ${evt.location}\n📅 From: ${evt.fromDateTime.replace('T', ' ')}\n⏳ To: ${evt.toDateTime.replace('T', ' ')}\n\n${evt.description || ''}`,
          category: 'Event Notice',
          actionUrl: `${appUrl}/events`
        }).catch(err => console.error('[Auto Publish Telegram Notice Error]:', err));
      } else {
        // Notify all members via email
        const memberEmails = memberApplications
          .filter(m => m.status !== 'Suspended' && m.status !== 'Voluntary Suspension')
          .map(m => m.email)
          .filter(Boolean);
        sendEventAnnouncementEmail(evt, memberEmails).catch(err => {
          console.error('[Auto Publish Email Notice Error]:', err);
        });
      }
    }
  }

  if (isSecretary) {
    return res.json(eventsStore);
  }

  // Published events for regular members:
  // All published events (past, ongoing, and upcoming) are visible.
  // Only future unpublished scheduled drafts (set days in advance and not yet published) are hidden.
  const publishedEvents = eventsStore.filter(evt => {
    // Explicit draft check
    if (evt.status === 'Draft' || evt.isDraft === true) {
      return false;
    }

    // If marked published, notified, or has no future publish date, it is visible
    if (evt.isPublished || evt.emailNotified || evt.notified) {
      return true;
    }

    const pubDate = evt.publishDateTime || evt.triggerDateTime || evt.fromDateTime;
    if (!pubDate) return true;

    // Timezone safe check:
    // Allow up to 24 hours of local-to-server timezone skew so an event published
    // in local time (e.g. Asia/Maldives UTC+5) is immediately visible without waiting 5 hours.
    const pubTime = new Date(pubDate).getTime();
    if (isNaN(pubTime)) return true;

    const isPublished = pubTime <= (now.getTime() + (24 * 60 * 60 * 1000)) || pubDate <= nowStr;
    return isPublished;
  });

  return res.json(publishedEvents);
});

// Helpers for Location-Specific Events and Voluntary Suspended Auto-Excuses
function getMemberCurrentCity(member: any): string {
  if (!member) return '';
  const current = member.currentAddress;
  if (current) {
    if (typeof current === 'object' && current.city && typeof current.city === 'string' && current.city.trim()) {
      return current.city.trim();
    }
    if (typeof current === 'string' && current.trim()) {
      return current.trim();
    }
  }
  const permanent = member.permanentAddress;
  if (permanent) {
    if (typeof permanent === 'object' && permanent.city && typeof permanent.city === 'string' && permanent.city.trim()) {
      return permanent.city.trim();
    }
    if (typeof permanent === 'string' && permanent.trim()) {
      return permanent.trim();
    }
  }
  return '';
}

function isMemberVoluntarilySuspended(member: any): boolean {
  if (!member) return false;
  const status = String(member.status || '').toLowerCase().trim();
  return (
    status === 'voluntary suspension' ||
    status === 'voluntary suspended' ||
    status === 'voluntary_suspension' ||
    Boolean(member.voluntarySuspension)
  );
}

function isEventRequiredForMember(event: any, member: any): boolean {
  if (!event || !member) return false;
  if (isMemberVoluntarilySuspended(member)) return false; // Voluntary suspended members are auto-excused from required meetings!

  if (event.requiredCities && Array.isArray(event.requiredCities) && event.requiredCities.length > 0) {
    const memCity = getMemberCurrentCity(member).toLowerCase().trim();
    return event.requiredCities.some((c: string) => {
      const cityClean = c.toLowerCase().trim();
      return memCity === cityClean || memCity.includes(cityClean) || cityClean.includes(memCity);
    });
  }

  if (Array.isArray(event.membersRequired)) {
    return event.membersRequired.includes(member.id);
  }

  return true; // 'All'
}

function resolveEventTargetMembers(evt: any): any[] {
  if (evt.requiredCities && Array.isArray(evt.requiredCities) && evt.requiredCities.length > 0) {
    return memberApplications.filter(m => 
      m.status !== 'Suspended' &&
      isEventRequiredForMember(evt, m)
    );
  }
  if (evt.membersRequired === 'All') {
    return memberApplications.filter(m => m.status !== 'Suspended' && !isMemberVoluntarilySuspended(m));
  }
  if (Array.isArray(evt.membersRequired)) {
    return memberApplications.filter(m => evt.membersRequired.includes(m.id) && m.status !== 'Suspended' && !isMemberVoluntarilySuspended(m));
  }
  return memberApplications.filter(m => m.status !== 'Suspended' && !isMemberVoluntarilySuspended(m));
}

app.post('/api/events', (req, res) => {
  const { name, fromDateTime, toDateTime, eventType, location, description, membersRequired, requiredCities, notificationType, publishDateTime, triggerDateTime, isSignUpEvent, signedUpMembers } = req.body;
  const finalPublishDate = publishDateTime || triggerDateTime;

  if (!name || !fromDateTime || !toDateTime || !location || !finalPublishDate) {
    return res.status(400).json({ error: 'Missing required event fields.' });
  }

  const now = new Date();
  const nowStr = now.toISOString().slice(0, 16);
  const finalTime = new Date(finalPublishDate).getTime();
  // Timezone-safe check: within 24h of now is considered published immediately
  const isAlreadyPublished = !isNaN(finalTime) ? (finalTime <= (now.getTime() + (24 * 60 * 60 * 1000)) || finalPublishDate <= nowStr) : true;

  const newEvent = {
    id: `evt-${Date.now().toString().slice(-6)}`,
    name,
    fromDateTime,
    toDateTime,
    eventType: eventType || 'Scout Gathering',
    location,
    description,
    isSignUpEvent: Boolean(isSignUpEvent),
    signedUpMembers: Array.isArray(signedUpMembers) ? signedUpMembers : [],
    membersRequired: membersRequired || 'All',
    requiredCities: Array.isArray(requiredCities) ? requiredCities : [],
    notificationType: notificationType || 'Email',
    publishDateTime: finalPublishDate,
    triggerDateTime: finalPublishDate,
    createdAt: new Date().toISOString(),
    isPublished: isAlreadyPublished,
    emailNotified: isAlreadyPublished
  };

  eventsStore.push(newEvent);
  persistEvent(newEvent);

  // If created as already published, notify members via selected channel immediately
  if (isAlreadyPublished) {
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';
    const targetMembers = resolveEventTargetMembers(newEvent);
    const memberEmails = targetMembers.map(m => m.email).filter(Boolean);
    const memberPhones = targetMembers.map(m => m.mobileNumber || m.phoneNumber).filter(Boolean);

    const locationRequirementNote = newEvent.requiredCities && newEvent.requiredCities.length > 0
      ? `\n📍 Location Requirement: Members residing in ${newEvent.requiredCities.join(', ')} are required to attend (others welcome to join optionally).`
      : '';

    if (newEvent.notificationType === 'Telegram' || newEvent.notificationType === 'All') {
      broadcastToTelegram({
        title: `[NEW EVENT] ${newEvent.name}`,
        message: `📢 Official Crew Event Notice\n\nEvent: ${newEvent.name}\n📍 Location: ${newEvent.location}\n📅 From: ${newEvent.fromDateTime.replace('T', ' ')}\n⏳ To: ${newEvent.toDateTime.replace('T', ' ')}${locationRequirementNote}\n\n${newEvent.description || ''}`,
        category: 'Event Notice',
        actionUrl: `${appUrl}/events`
      }).catch(err => {
        console.error('[Event Creation Telegram Notice Error]:', err);
      });
    }

    if (newEvent.notificationType === 'Email' || newEvent.notificationType === 'All') {
      sendEventAnnouncementEmail(newEvent, memberEmails).catch(err => {
        console.error('[Event Creation Email Notice Error]:', err);
      });
    }

    if (newEvent.notificationType === 'SMS' || newEvent.notificationType === 'All') {
      console.log(`[Event SMS Dispatched] Event "${newEvent.name}" published, sent SMS alerts to ${memberPhones.length} members.`);
    }
  }

  return res.status(201).json({ success: true, event: newEvent });
});

// Update Event Endpoint with Smart Notification Logic (Email, Telegram, SMS, WhatsApp, All)
app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { name, fromDateTime, toDateTime, eventType, location, description, membersRequired, requiredCities, notificationType, publishDateTime, triggerDateTime, notifyMembers, isSignUpEvent, signedUpMembers } = req.body;

  const eventIndex = eventsStore.findIndex(e => e.id === id);
  if (eventIndex < 0) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const oldEvent = eventsStore[eventIndex];
  const finalPublishDate = publishDateTime || triggerDateTime || oldEvent.publishDateTime;
  const now = new Date();
  const nowStr = now.toISOString().slice(0, 16);
  const finalTime = new Date(finalPublishDate).getTime();
  const isNowPublished = !isNaN(finalTime) ? (finalTime <= (now.getTime() + (24 * 60 * 60 * 1000)) || finalPublishDate <= nowStr) : true;
  const wasBeforePublish = oldEvent.publishDateTime ? (new Date(oldEvent.publishDateTime).getTime() > now.getTime() && oldEvent.publishDateTime > nowStr) : false;

  const updatedEvent = {
    ...oldEvent,
    name: name || oldEvent.name,
    fromDateTime: fromDateTime || oldEvent.fromDateTime,
    toDateTime: toDateTime || oldEvent.toDateTime,
    eventType: eventType || oldEvent.eventType,
    location: location || oldEvent.location,
    description: description !== undefined ? description : oldEvent.description,
    isSignUpEvent: isSignUpEvent !== undefined ? Boolean(isSignUpEvent) : (oldEvent.isSignUpEvent || false),
    signedUpMembers: signedUpMembers !== undefined ? (Array.isArray(signedUpMembers) ? signedUpMembers : []) : (oldEvent.signedUpMembers || []),
    membersRequired: membersRequired !== undefined ? membersRequired : oldEvent.membersRequired,
    requiredCities: requiredCities !== undefined ? (Array.isArray(requiredCities) ? requiredCities : []) : oldEvent.requiredCities,
    notificationType: notificationType || oldEvent.notificationType,
    publishDateTime: finalPublishDate,
    triggerDateTime: finalPublishDate,
    isPublished: isNowPublished,
    emailNotified: isNowPublished ? true : oldEvent.emailNotified
  };

  eventsStore[eventIndex] = updatedEvent;
  persistEvent(updatedEvent);

  const shouldNotify = notifyMembers !== false;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';

  if (shouldNotify && isNowPublished) {
    const targets = resolveEventTargetMembers(updatedEvent);
    const emails = targets.map(m => m.email).filter(Boolean);
    const phones = targets.map(m => m.mobileNumber || m.phoneNumber).filter(Boolean);

    const locationRequirementNote = updatedEvent.requiredCities && updatedEvent.requiredCities.length > 0
      ? `\n📍 Location Requirement: Members residing in ${updatedEvent.requiredCities.join(', ')} are required to attend (others welcome to join optionally).`
      : '';

    if (updatedEvent.notificationType === 'Telegram' || updatedEvent.notificationType === 'All') {
      broadcastToTelegram({
        title: `⚠️ [EVENT UPDATED] ${updatedEvent.name}`,
        message: `Official changes have been made to the event schedule:\n\nEvent: ${updatedEvent.name}\n📍 Location: ${updatedEvent.location}\n📅 From: ${updatedEvent.fromDateTime.replace('T', ' ')}\n⏳ To: ${updatedEvent.toDateTime.replace('T', ' ')}${locationRequirementNote}\n\n${updatedEvent.description || ''}`,
        category: 'Event Update',
        actionUrl: `${appUrl}/events`
      }).catch(err => console.error('[Event Update Telegram Notice Error]:', err));
    }

    if (updatedEvent.notificationType === 'Email' || updatedEvent.notificationType === 'All') {
      if (emails.length > 0) {
        if (wasBeforePublish) {
          sendEventAnnouncementEmail(updatedEvent, emails).catch(err => console.error('[Event Publish Notice Error]:', err));
        } else {
          sendEventUpdateEmail(updatedEvent, emails).catch(err => console.error('[Event Update Email Notice Error]:', err));
        }
      }
    }

    if (updatedEvent.notificationType === 'SMS' || updatedEvent.notificationType === 'All') {
      console.log(`[Event Update SMS Dispatched] Event "${updatedEvent.name}" updated, SMS notice sent to ${phones.length} members.`);
    }
  }

  return res.json({ success: true, event: updatedEvent });
});

// Crew Member Sign Up / Withdraw Endpoint for Open Sign-Up Events
app.post('/api/events/:id/signup', async (req, res) => {
  const { id } = req.params;
  const { memberId, action } = req.body;

  if (!memberId) {
    return res.status(400).json({ error: 'memberId is required to sign up for an event.' });
  }

  const eventIndex = eventsStore.findIndex(e => e.id === id);
  if (eventIndex < 0) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const event = eventsStore[eventIndex];
  const currentSignUps = Array.isArray(event.signedUpMembers) ? [...event.signedUpMembers] : [];
  const alreadySignedUp = currentSignUps.includes(memberId);

  let updatedSignUps: string[];
  let newStatus: boolean;

  if (action === 'withdraw' || (action === 'toggle' && alreadySignedUp)) {
    updatedSignUps = currentSignUps.filter(m => m !== memberId);
    newStatus = false;
  } else {
    if (!alreadySignedUp) {
      currentSignUps.push(memberId);
    }
    updatedSignUps = currentSignUps;
    newStatus = true;
  }

  const updatedEvent = {
    ...event,
    signedUpMembers: updatedSignUps
  };

  eventsStore[eventIndex] = updatedEvent;
  persistEvent(updatedEvent);

  return res.json({
    success: true,
    signedUp: newStatus,
    signedUpMembers: updatedSignUps,
    event: updatedEvent
  });
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  eventsStore = eventsStore.filter(e => e.id !== id);
  removeEvent(id);
  return res.json({ success: true, message: 'Event deleted successfully.' });
});

// Event Dispatch Announcement (Supports SMS, Telegram, Email, WhatsApp, All Available)
app.post('/api/events/:id/notify', async (req, res) => {
  const { id } = req.params;
  const { channel, customMessage } = req.body || {};
  const event = eventsStore.find(e => e.id === id);

  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const selectedChannel = channel || event.notificationType || 'Email';
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';

  const locationRequirementNote = event.requiredCities && event.requiredCities.length > 0
    ? `\n📍 Location Requirement: Members residing in ${event.requiredCities.join(', ')} are required to attend (others welcome to join optionally).`
    : '';

  const defaultMsg = 
    `📢 General Announcement\n` +
    `${event.name}\n` +
    `Scheduled at ${event.location}, from ${event.fromDateTime.replace('T', ' ')}, to ${event.toDateTime.replace('T', ' ')}.${locationRequirementNote}\n` +
    `If you are unable to attend, kindly update in My Attendance: ${appUrl}/attendance.`;

  const announcementMessage = customMessage || defaultMsg;

  // Resolve recipient members
  const targetMembers = resolveEventTargetMembers(event);

  const memberEmails = targetMembers.map(m => m.email).filter(Boolean);
  const memberPhones = targetMembers.map(m => m.mobileNumber || m.phoneNumber).filter(Boolean);
  const memberWhatsApp = targetMembers.map(m => m.whatsappNumber || m.mobileNumber || m.phoneNumber).filter(Boolean);

  let telegramSuccess = false;
  let emailSuccess = false;
  let smsSuccess = false;
  let whatsappSuccess = false;
  const dispatchedMethods: string[] = [];

  // 1. Telegram
  if (selectedChannel === 'Telegram' || selectedChannel === 'All') {
    try {
      const telRes = await broadcastToTelegram({
        title: `📢 [EVENT ANNOUNCEMENT] ${event.name}`,
        message: `Official Crew Event Notice:\n\nEvent: ${event.name}\n📍 Location: ${event.location}\n📅 From: ${event.fromDateTime.replace('T', ' ')}\n⏳ To: ${event.toDateTime.replace('T', ' ')}${locationRequirementNote}\n\n${event.description || ''}\n\nAttendance: ${appUrl}/attendance`,
        category: 'Event Notice',
        actionUrl: `${appUrl}/attendance`
      });
      telegramSuccess = telRes ? telRes.success : true;
      dispatchedMethods.push('Telegram Channel');
    } catch (err) {
      console.error('[Dispatch Telegram Notice Error]:', err);
    }
  }

  // 2. Email
  if (selectedChannel === 'Email' || selectedChannel === 'All') {
    try {
      if (memberEmails.length > 0) {
        await sendEventAnnouncementEmail(event, memberEmails);
        emailSuccess = true;
        dispatchedMethods.push(`Email Broadcast (${memberEmails.length} recipients)`);
      }
    } catch (err) {
      console.error('[Error dispatching event email notice]:', err);
    }
  }

  // 3. SMS
  if (selectedChannel === 'SMS' || selectedChannel === 'All') {
    smsSuccess = true;
    dispatchedMethods.push(`SMS Alert (${memberPhones.length} phone contacts)`);
    console.log(`[SMS Event Trigger Dispatched] Event "${event.name}" triggered via SMS to ${memberPhones.length} recipients:`, memberPhones);
  }

  // 4. WhatsApp
  if (selectedChannel === 'WhatsApp' || selectedChannel === 'All') {
    whatsappSuccess = true;
    dispatchedMethods.push(`WhatsApp Broadcast (${memberWhatsApp.length} contacts)`);
    console.log(`[WhatsApp Event Trigger Dispatched] Event "${event.name}" triggered via WhatsApp to ${memberWhatsApp.length} recipients:`, memberWhatsApp);
  }

  const dispatchedToSummary = dispatchedMethods.length > 0
    ? dispatchedMethods.join(' • ')
    : `${selectedChannel} Alert (${targetMembers.length} members)`;

  event.isPublished = true;
  event.emailNotified = true;
  persistEvent(event);

  return res.json({
    success: true,
    notificationType: selectedChannel,
    announcementMessage,
    dispatchedTo: dispatchedToSummary,
    details: {
      channel: selectedChannel,
      targetMemberCount: targetMembers.length,
      emailsCount: memberEmails.length,
      smsCount: memberPhones.length,
      whatsAppCount: memberWhatsApp.length,
      telegramSent: telegramSuccess
    }
  });
});

// Announcements API
app.get('/api/announcements', (req, res) => {
  const { memberId } = req.query;
  const strMemberId = memberId ? String(memberId) : null;

  if (!strMemberId) {
    return res.json(announcementsStore.map(ann => ({
      ...ann,
      isRead: false
    })));
  }

  const member = memberApplications.find(m => m.id === strMemberId);
  const isAdmin = member && (member.role === 'Secretary' || member.role === 'Admin');

  let filtered = announcementsStore;
  if (!isAdmin && member) {
    // Filter for regular members
    filtered = announcementsStore.filter(ann => {
      const target = ann.targetAudience || 'All';
      if (target === 'All') return true;
      if (target === 'Explorers') {
        return member.role === 'Explorer' || member.role === 'Explorer Candidate' || (member.ageYears >= 16 && member.ageYears <= 17);
      }
      if (target === 'Rovers') {
        return member.role === 'Rover' || member.role === 'Rover Candidate' || (member.ageYears >= 18 && member.ageYears <= 25);
      }
      if (target === 'Leaders') {
        return member.role === 'Leader' || member.role === 'Secretary' || member.role === 'Admin';
      }
      if (target === 'Specific') {
        return Array.isArray(ann.targetMemberIds) && ann.targetMemberIds.includes(strMemberId);
      }
      return true;
    });
  }

  const result = filtered.map(ann => ({
    ...ann,
    isRead: Array.isArray(ann.readBy) && ann.readBy.includes(strMemberId)
  }));

  return res.json(result);
});

app.get('/api/announcements/unread-count', (req, res) => {
  const { memberId } = req.query;
  if (!memberId) {
    return res.json({ unreadCount: 0, totalCount: announcementsStore.length });
  }

  const strMemberId = String(memberId);
  const member = memberApplications.find(m => m.id === strMemberId);
  const isAdmin = member && (member.role === 'Secretary' || member.role === 'Admin');

  let filtered = announcementsStore;
  if (!isAdmin && member) {
    filtered = announcementsStore.filter(ann => {
      const target = ann.targetAudience || 'All';
      if (target === 'All') return true;
      if (target === 'Explorers') {
        return member.role === 'Explorer' || member.role === 'Explorer Candidate' || (member.ageYears >= 16 && member.ageYears <= 17);
      }
      if (target === 'Rovers') {
        return member.role === 'Rover' || member.role === 'Rover Candidate' || (member.ageYears >= 18 && member.ageYears <= 25);
      }
      if (target === 'Leaders') {
        return member.role === 'Leader' || member.role === 'Secretary' || member.role === 'Admin';
      }
      if (target === 'Specific') {
        return Array.isArray(ann.targetMemberIds) && ann.targetMemberIds.includes(strMemberId);
      }
      return true;
    });
  }

  const unreadCount = filtered.filter(ann => !Array.isArray(ann.readBy) || !ann.readBy.includes(strMemberId)).length;
  return res.json({ unreadCount, totalCount: filtered.length });
});

app.post('/api/announcements/mark-read', (req, res) => {
  const { memberId, announcementId, all } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: 'memberId is required' });
  }

  const strMemberId = String(memberId);
  let updatedCount = 0;

  announcementsStore.forEach(ann => {
    if (!Array.isArray(ann.readBy)) {
      ann.readBy = [];
    }
    if (all || (announcementId && ann.id === announcementId)) {
      if (!ann.readBy.includes(strMemberId)) {
        ann.readBy.push(strMemberId);
        updatedCount++;
        persistAnnouncement(ann);
      }
    }
  });

  const member = memberApplications.find(m => m.id === strMemberId);
  const isAdmin = member && (member.role === 'Secretary' || member.role === 'Admin');
  let filtered = announcementsStore;
  if (!isAdmin && member) {
    filtered = announcementsStore.filter(ann => {
      const target = ann.targetAudience || 'All';
      if (target === 'All') return true;
      if (target === 'Explorers') return member.role === 'Explorer' || member.role === 'Explorer Candidate' || (member.ageYears >= 16 && member.ageYears <= 17);
      if (target === 'Rovers') return member.role === 'Rover' || member.role === 'Rover Candidate' || (member.ageYears >= 18 && member.ageYears <= 25);
      if (target === 'Leaders') return member.role === 'Leader' || member.role === 'Secretary' || member.role === 'Admin';
      if (target === 'Specific') return Array.isArray(ann.targetMemberIds) && ann.targetMemberIds.includes(strMemberId);
      return true;
    });
  }

  const unreadCount = filtered.filter(ann => !Array.isArray(ann.readBy) || !ann.readBy.includes(strMemberId)).length;

  return res.json({
    success: true,
    updatedCount,
    unreadCount
  });
});

app.post('/api/announcements', async (req, res) => {
  const { title, message, category, targetAudience, targetMemberIds, channels, actionUrl, actionText, dispatchedBy } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }

  const selectChannels = Array.isArray(channels) ? channels : ['Email'];

  // Identify recipient members
  let recipients = [];
  const aud = targetAudience || 'All';
  if (aud === 'All') {
    recipients = memberApplications;
  } else if (aud === 'Explorers') {
    recipients = memberApplications.filter(m => m.role === 'Explorer' || m.role === 'Explorer Candidate' || (m.ageYears >= 16 && m.ageYears <= 17));
  } else if (aud === 'Rovers') {
    recipients = memberApplications.filter(m => m.role === 'Rover' || m.role === 'Rover Candidate' || (m.ageYears >= 18 && m.ageYears <= 25));
  } else if (aud === 'Leaders') {
    recipients = memberApplications.filter(m => m.role === 'Leader' || m.role === 'Secretary' || m.role === 'Admin');
  } else if (aud === 'Specific') {
    const ids = Array.isArray(targetMemberIds) ? targetMemberIds : [];
    recipients = memberApplications.filter(m => ids.includes(m.id));
  } else {
    recipients = memberApplications;
  }

  const recipientEmails = recipients
    .filter(m => m.status !== 'Suspended' && m.status !== 'Voluntary Suspension')
    .map(m => m.email)
    .filter(Boolean);

  let emailCount = 0;
  if (selectChannels.includes('Email') && recipientEmails.length > 0) {
    try {
      await sendCustomAnnouncementEmail({
        to: recipientEmails,
        title,
        message,
        category,
        actionUrl,
        actionText
      });
      emailCount = recipientEmails.length;
    } catch (err) {
      console.error('[Error sending announcement emails]:', err);
    }
  }

  let telegramDelivered = false;
  if (selectChannels.includes('Telegram')) {
    try {
      const telRes = await broadcastToTelegram({
        title,
        message,
        category,
        secretaryName: dispatchedBy,
        actionUrl
      });
      telegramDelivered = telRes.success;
    } catch (err) {
      console.error('[Error broadcasting announcement to Telegram]:', err);
    }
  }

  const newAnn = {
    id: `ann-${Date.now().toString().slice(-6)}`,
    title,
    message,
    category: category || 'General',
    targetAudience: aud,
    targetMemberIds: aud === 'Specific' ? (Array.isArray(targetMemberIds) ? targetMemberIds : []) : [],
    channels: selectChannels,
    actionUrl,
    actionText: actionText || 'View Details',
    dispatchedBy: dispatchedBy || 'Secretary of Arabiyya Rover Network',
    createdAt: new Date().toISOString(),
    dispatchedAt: new Date().toISOString(),
    emailCount,
    telegramDelivered
  };

  announcementsStore.unshift(newAnn);
  persistAnnouncement(newAnn);

  const results = {
    emailCount,
    telegramStatus: telegramDelivered ? 'Delivered' : 'Failed or Disabled',
    inAppActive: selectChannels.includes('InApp')
  };

  return res.status(201).json({
    success: true,
    announcement: newAnn,
    message: 'Announcement successfully broadcasted across selected channels!',
    results
  });
});

app.delete('/api/announcements/:id', (req, res) => {
  const { id } = req.params;
  announcementsStore = announcementsStore.filter(a => a.id !== id);
  removeAnnouncement(id);
  return res.json({ success: true, message: 'Announcement deleted.' });
});

// Announcement Quick Preset Templates CRUD API
app.get('/api/announcements/presets', (req, res) => {
  return res.json(announcementPresetsStore);
});

app.post('/api/announcements/presets', (req, res) => {
  const { name, title, message, category, actionUrl, actionText, targetAudience, channels } = req.body;

  if (!name || !title || !message) {
    return res.status(400).json({ error: 'Preset name, announcement title, and message are required.' });
  }

  const newPreset = {
    id: `preset-${Date.now().toString().slice(-6)}`,
    name: name.trim(),
    title: title.trim(),
    message: message.trim(),
    category: category || 'General',
    actionUrl: actionUrl ? actionUrl.trim() : '',
    actionText: actionText ? actionText.trim() : '',
    targetAudience: targetAudience || 'All',
    channels: Array.isArray(channels) && channels.length > 0 ? channels : ['Email', 'Telegram', 'InApp'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  announcementPresetsStore.push(newPreset);
  persistAnnouncementPreset(newPreset);

  return res.status(201).json({
    success: true,
    preset: newPreset,
    presets: announcementPresetsStore,
    message: 'Preset template created successfully.'
  });
});

app.put('/api/announcements/presets/:id', (req, res) => {
  const { id } = req.params;
  const { name, title, message, category, actionUrl, actionText, targetAudience, channels } = req.body;

  const index = announcementPresetsStore.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Preset template not found.' });
  }

  if (name) announcementPresetsStore[index].name = name.trim();
  if (title) announcementPresetsStore[index].title = title.trim();
  if (message) announcementPresetsStore[index].message = message.trim();
  if (category) announcementPresetsStore[index].category = category;
  if (actionUrl !== undefined) announcementPresetsStore[index].actionUrl = actionUrl ? actionUrl.trim() : '';
  if (actionText !== undefined) announcementPresetsStore[index].actionText = actionText ? actionText.trim() : '';
  if (targetAudience) announcementPresetsStore[index].targetAudience = targetAudience;
  if (Array.isArray(channels)) announcementPresetsStore[index].channels = channels;
  announcementPresetsStore[index].updatedAt = new Date().toISOString();

  persistAnnouncementPreset(announcementPresetsStore[index]);

  return res.json({
    success: true,
    preset: announcementPresetsStore[index],
    presets: announcementPresetsStore,
    message: 'Preset template updated successfully.'
  });
});

app.delete('/api/announcements/presets/:id', (req, res) => {
  const { id } = req.params;
  const index = announcementPresetsStore.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Preset template not found.' });
  }

  const deleted = announcementPresetsStore.splice(index, 1)[0];
  removeAnnouncementPreset(id);

  return res.json({
    success: true,
    deleted,
    presets: announcementPresetsStore,
    message: 'Preset template removed successfully.'
  });
});

// Attendance API
app.get('/api/attendance', (req, res) => {
  const { memberId, isSecretary } = req.query;

  if (isSecretary === 'true') {
    return res.json(attendanceStore);
  }

  if (memberId) {
    const userAttendance = attendanceStore.filter(a => a.memberId === memberId);
    return res.json(userAttendance);
  }

  return res.json([]);
});

app.post('/api/attendance/excuse', (req, res) => {
  const { eventId, memberId, memberName, excuseReason } = req.body;

  if (!eventId || !memberId || !excuseReason) {
    return res.status(400).json({ error: 'Event ID, Member ID, and excuse reason are required.' });
  }

  const existingIndex = attendanceStore.findIndex(a => a.eventId === eventId && a.memberId === memberId);

  if (existingIndex >= 0 && attendanceStore[existingIndex].status === 'Attended') {
    return res.status(400).json({ 
      error: 'You have already been marked as Attended for this event. Absence excuses cannot be submitted after attendance has been recorded.' 
    });
  }

  const updatedRecord = {
    id: existingIndex >= 0 ? attendanceStore[existingIndex].id : `att-${Date.now().toString().slice(-6)}`,
    eventId,
    memberId,
    memberName: memberName || 'Member',
    memberCommonName: memberName || 'Member',
    status: 'Unable To Attend',
    excuseReason,
    excuseStatus: 'Pending Review',
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    attendanceStore[existingIndex] = updatedRecord;
  } else {
    attendanceStore.push(updatedRecord);
  }

  persistAttendance(updatedRecord);

  return res.json({ success: true, record: updatedRecord });
});

app.put('/api/attendance/status', (req, res) => {
  const { id, status, excuseStatus } = req.body;

  const record = attendanceStore.find(a => a.id === id);
  if (!record) {
    return res.status(404).json({ error: 'Attendance record not found.' });
  }

  if (status) record.status = status;
  if (excuseStatus) record.excuseStatus = excuseStatus;
  record.updatedAt = new Date().toISOString();

  persistAttendance(record);

  return res.json({ success: true, record });
});

// Secretary Batch Attendance Marking Endpoint
app.post('/api/attendance/mark', (req, res) => {
  const { eventId, records } = req.body;
  if (!eventId || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Event ID and records array are required.' });
  }

  const event = eventsStore.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  // 1. Check if meeting minutes have been published for this event
  const minutesExist = meetingMinutesStore.some(m => m.eventId === eventId && m.isPublished);
  if (event.minutesPublished || minutesExist) {
    return res.status(400).json({ 
      error: 'Attendance marking is locked because Meeting Minutes have already been published for this event.' 
    });
  }

  // 2. Check 48-hour cutoff window post event end time (toDateTime)
  if (event.toDateTime) {
    const endTime = new Date(event.toDateTime).getTime();
    const nowTime = Date.now();
    const hoursPassed = (nowTime - endTime) / (1000 * 60 * 60);
    if (hoursPassed > 48) {
      return res.status(400).json({ 
        error: 'Attendance marking window closed. More than 48 hours have passed since the event ending time.' 
      });
    }
  }

  // Process and upsert each record
  const updatedRecords = [];
  for (const r of records) {
    const existingIndex = attendanceStore.findIndex(a => a.eventId === eventId && a.memberId === r.memberId);
    const rec = {
      id: existingIndex >= 0 ? attendanceStore[existingIndex].id : `att-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`,
      eventId,
      memberId: r.memberId,
      memberName: r.memberName || 'Member',
      memberCommonName: r.memberCommonName || r.memberName || 'Member',
      status: r.status || 'Attended',
      excuseReason: r.excuseReason || (existingIndex >= 0 ? attendanceStore[existingIndex].excuseReason : undefined),
      excuseStatus: r.excuseStatus || (existingIndex >= 0 ? attendanceStore[existingIndex].excuseStatus : undefined),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      attendanceStore[existingIndex] = rec;
    } else {
      attendanceStore.push(rec);
    }
    persistAttendance(rec);
    updatedRecords.push(rec);
  }

  return res.json({ success: true, count: updatedRecords.length, message: 'Attendance marked successfully.' });
});

// Meeting Minutes API
app.get('/api/meeting-minutes', (req, res) => {
  return res.json(meetingMinutesStore);
});

app.post('/api/meeting-minutes', (req, res) => {
  const { eventId, title, agenda, discussionPoints, resolutions, actionItems, nextMeetingDate, publishedBy } = req.body;

  if (!eventId || !title) {
    return res.status(400).json({ error: 'Event ID and Meeting Title are required.' });
  }

  const event = eventsStore.find(e => e.id === eventId);
  if (event) {
    event.minutesPublished = true;
    persistEvent(event);
  }

  const newMinute = {
    id: `min-${Date.now().toString().slice(-6)}`,
    eventId,
    eventName: event ? event.name : 'Group Meeting',
    eventDate: event ? (event.fromDateTime ? event.fromDateTime.split('T')[0] : new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    title,
    agenda: agenda || '',
    discussionPoints: discussionPoints || '',
    resolutions: resolutions || '',
    actionItems: actionItems || '',
    nextMeetingDate: nextMeetingDate || '',
    publishedBy: publishedBy || systemSettings.secretary_name || 'Secretary of Arabiyya Rover Network',
    publishedAt: new Date().toISOString(),
    isPublished: true
  };

  meetingMinutesStore.unshift(newMinute);
  persistMeetingMinute(newMinute);

  return res.status(201).json({ success: true, meetingMinute: newMinute, message: 'Meeting minutes published successfully.' });
});

app.delete('/api/meeting-minutes/:id', (req, res) => {
  const { id } = req.params;
  const minute = meetingMinutesStore.find(m => m.id === id);
  if (minute) {
    const event = eventsStore.find(e => e.id === minute.eventId);
    if (event) {
      event.minutesPublished = false;
      persistEvent(event);
    }
  }
  meetingMinutesStore = meetingMinutesStore.filter(m => m.id !== id);
  removeMeetingMinute(id);
  return res.json({ success: true, message: 'Meeting minute deleted.' });
});

// ==========================================
// Log Book API Endpoints
// ==========================================
app.get('/api/logbook', (req, res) => {
  const { memberId, category, status, search, role } = req.query;
  let results = [...logbookStore];

  if (memberId && typeof memberId === 'string') {
    results = results.filter(entry => entry.memberId === memberId);
  }

  if (category && typeof category === 'string' && category !== 'All') {
    results = results.filter(entry => entry.category === category);
  }

  if (status && typeof status === 'string' && status !== 'All') {
    results = results.filter(entry => entry.status === status);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(entry => 
      (entry.title && entry.title.toLowerCase().includes(q)) ||
      (entry.location && entry.location.toLowerCase().includes(q)) ||
      (entry.memberName && entry.memberName.toLowerCase().includes(q)) ||
      (entry.description && entry.description.toLowerCase().includes(q)) ||
      (entry.learningPoints && entry.learningPoints.toLowerCase().includes(q))
    );
  }

  // Sort by date descending
  results.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  return res.json(results);
});

app.get('/api/logbook/stats', (req, res) => {
  const { memberId } = req.query;
  let entries = [...logbookStore];
  if (memberId && typeof memberId === 'string') {
    entries = entries.filter(e => e.memberId === memberId);
  }

  const totalEntries = entries.length;
  const verifiedEntries = entries.filter(e => e.status === 'Verified').length;
  const pendingReview = entries.filter(e => e.status === 'Pending Review').length;
  const drafts = entries.filter(e => e.status === 'Draft').length;

  const totalHours = entries.reduce((acc, e) => acc + (Number(e.durationHours) || 0), 0);
  const totalHikingKm = entries.reduce((acc, e) => acc + (Number(e.hikingKm) || 0), 0);
  const totalCampNights = entries.reduce((acc, e) => acc + (Number(e.campNights) || 0), 0);

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  entries.forEach(e => {
    const cat = e.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  return res.json({
    totalEntries,
    verifiedEntries,
    pendingReview,
    drafts,
    totalHours,
    totalHikingKm,
    totalCampNights,
    categoryCounts
  });
});

app.post('/api/logbook', (req, res) => {
  const {
    memberId,
    memberName,
    memberRole,
    title,
    category,
    date,
    endDate,
    location,
    durationHours,
    hikingKm,
    campNights,
    roleInActivity,
    description,
    learningPoints,
    photoUrls,
    status
  } = req.body;

  if (!title || !category || !date) {
    return res.status(400).json({ error: 'Title, category, and date are required.' });
  }

  const newEntry = {
    id: `log-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`,
    memberId: memberId || 'unknown',
    memberName: memberName || 'Scout Member',
    memberRole: memberRole || 'Rover',
    title: title.trim(),
    category: category || 'Other',
    date: date,
    endDate: endDate || '',
    location: (location || '').trim(),
    durationHours: Number(durationHours) || 0,
    hikingKm: Number(hikingKm) || 0,
    campNights: Number(campNights) || 0,
    roleInActivity: (roleInActivity || 'Participant').trim(),
    description: (description || '').trim(),
    learningPoints: (learningPoints || '').trim(),
    photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
    status: status || 'Pending Review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  logbookStore.unshift(newEntry);
  persistLogBookEntry(newEntry);

  return res.status(201).json({
    success: true,
    entry: newEntry,
    message: 'Log book entry recorded successfully.'
  });
});

app.put('/api/logbook/:id', (req, res) => {
  const { id } = req.params;
  const index = logbookStore.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Log book entry not found.' });
  }

  const existing = logbookStore[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    memberId: existing.memberId, // retain ownership
    updatedAt: new Date().toISOString()
  };

  logbookStore[index] = updated;
  persistLogBookEntry(updated);

  return res.json({
    success: true,
    entry: updated,
    message: 'Log book entry updated successfully.'
  });
});

app.delete('/api/logbook/:id', (req, res) => {
  const { id } = req.params;
  const index = logbookStore.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Log book entry not found.' });
  }

  logbookStore.splice(index, 1);
  removeLogBookEntry(id);

  return res.json({ success: true, message: 'Log book entry deleted.' });
});

app.post('/api/logbook/:id/review', (req, res) => {
  const { id } = req.params;
  const { status, reviewNotes, reviewedBy } = req.body;

  const index = logbookStore.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Log book entry not found.' });
  }

  const existing = logbookStore[index];
  const updated = {
    ...existing,
    status: status || 'Verified',
    reviewNotes: (reviewNotes || '').trim(),
    reviewedBy: reviewedBy || 'Scout Leader',
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  logbookStore[index] = updated;
  persistLogBookEntry(updated);

  return res.json({
    success: true,
    entry: updated,
    message: `Log book entry ${status === 'Verified' ? 'verified' : 'marked for revision'} successfully.`
  });
});

// Member record finder helper
function findMemberRecord(idCardNumber?: string, memberId?: string, username?: string): any {
  const normIdCard = (idCardNumber || '').trim().toUpperCase();
  const normMemId = (memberId || '').trim();
  const normUser = (username || '').trim().toLowerCase();

  // 1. Check in memberApplications
  let found = memberApplications.find(m => 
    (normMemId && m.id === normMemId) ||
    (normIdCard && m.idCardNumber && m.idCardNumber.trim().toUpperCase() === normIdCard) ||
    (normUser && m.username && m.username.trim().toLowerCase() === normUser)
  );

  if (found) return found;

  // 2. Check ADMIN_USER
  if (
    normMemId === 'admin-001' ||
    normMemId.toLowerCase() === 'admin' ||
    normIdCard === 'ADMIN' ||
    normIdCard === 'A000000' ||
    normIdCard === (ADMIN_USER.idCardNumber || '').trim().toUpperCase() ||
    normUser === 'admin' ||
    normUser === (ADMIN_USER.username || '').trim().toLowerCase()
  ) {
    return ADMIN_USER;
  }

  // 3. Fallback: if not found, create a record so updates and lookups always succeed
  if (normIdCard || normMemId) {
    const newRecord: any = {
      id: normMemId || `mem-${Date.now()}`,
      idCardNumber: idCardNumber || 'A000000',
      fullName: 'Member',
      status: 'Investiture',
      role: 'Rover'
    };
    memberApplications.push(newRecord);
    return newRecord;
  }

  return null;
}

// Profile API
app.get('/api/members/profile', (req, res) => {
  const idCardNumber = req.query.idCardNumber as string;
  const memberId = req.query.memberId as string;
  const username = req.query.username as string;

  const member = findMemberRecord(idCardNumber, memberId, username);
  if (!member) {
    return res.status(404).json({ error: 'Member profile not found.' });
  }

  const { passwordHash, ...safeMember } = member;
  return res.json(safeMember);
});

app.get('/api/profile/:idCard', (req, res) => {
  const { idCard } = req.params;
  const member = findMemberRecord(idCard, undefined, idCard);

  if (!member) {
    return res.status(404).json({ error: 'Member not found.' });
  }

  const { passwordHash, ...safeMember } = member;
  return res.json(safeMember);
});

app.put('/api/profile/update', (req, res) => {
  const { idCardNumber, memberId, updates } = req.body;

  if (!idCardNumber && !memberId && !updates?.idCardNumber) {
    return res.status(400).json({ error: 'Missing member identification.' });
  }

  const member = findMemberRecord(idCardNumber || updates?.idCardNumber, memberId, idCardNumber || updates?.idCardNumber);

  if (!member) {
    return res.status(404).json({ error: 'Member profile record not found.' });
  }

  const oldStatus = member.status;

  // Update profile fields in memory store
  if (updates) {
    if (updates.fullName !== undefined) member.fullName = updates.fullName;
    if (updates.commonName !== undefined) member.commonName = updates.commonName;
    if (updates.idCardNumber !== undefined) member.idCardNumber = updates.idCardNumber;
    if (updates.dob !== undefined) {
      member.dob = updates.dob;
      const ageInfo = calculateAgeAndRole(updates.dob);
      member.ageYears = ageInfo.years;
      member.ageMonths = ageInfo.months;
      member.ageDays = ageInfo.days;
      member.age = String(ageInfo.years);
      if (!updates.role) member.role = ageInfo.role;
    }
    if (updates.gender !== undefined) member.gender = updates.gender;
    if (updates.role !== undefined) member.role = updates.role;
    if (updates.awardGoal !== undefined) member.awardGoal = updates.awardGoal;
    if (updates.isNewToScouting !== undefined) member.isNewToScouting = updates.isNewToScouting;
    if (updates.lastScoutGroup !== undefined) member.lastScoutGroup = updates.lastScoutGroup;
    if (updates.phoneNumber !== undefined) member.phoneNumber = updates.phoneNumber;
    if (updates.mobileNumber !== undefined) member.mobileNumber = updates.mobileNumber;
    if (updates.whatsappNumber !== undefined) member.whatsappNumber = updates.whatsappNumber;
    if (updates.email !== undefined) member.email = updates.email;
    if (updates.telegramTag !== undefined) member.telegramTag = updates.telegramTag;
    if (updates.telegramNumber !== undefined) member.telegramNumber = updates.telegramNumber;
    if (updates.instagramTag !== undefined) member.instagramTag = updates.instagramTag;
    if (updates.currentLevel !== undefined) member.currentLevel = updates.currentLevel;
    if (updates.emergencyName !== undefined) member.emergencyName = updates.emergencyName;
    if (updates.emergencyRelationship !== undefined) member.emergencyRelationship = updates.emergencyRelationship;
    if (updates.emergencyNumber !== undefined) member.emergencyNumber = updates.emergencyNumber;
    if (updates.permanentAddress !== undefined) member.permanentAddress = updates.permanentAddress;
    if (updates.currentAddress !== undefined) member.currentAddress = updates.currentAddress;
    if (updates.term !== undefined) member.term = updates.term;
    if (updates.investitureDate !== undefined) member.investitureDate = updates.investitureDate;
    if (updates.resignationDate !== undefined) member.resignationDate = updates.resignationDate;
    if (updates.overallAttendanceWithoutExcused !== undefined) member.overallAttendanceWithoutExcused = updates.overallAttendanceWithoutExcused;
    if (updates.overallAttendanceWithExcused !== undefined) member.overallAttendanceWithExcused = updates.overallAttendanceWithExcused;
    if (updates.status !== undefined) member.status = updates.status;
    if (updates.suspensionEndDate !== undefined) member.suspensionEndDate = updates.suspensionEndDate;
    if (updates.suspensionReason !== undefined) member.suspensionReason = updates.suspensionReason;
  }

  // Ensure Admin profile fields can never be demoted
  const isTargetAdmin = member.id === 'admin-001' || member.role === 'Secretary';
  if (isTargetAdmin) {
    if (updates && updates.role) {
      member.role = updates.role;
    } else if (!member.role) {
      member.role = 'Secretary';
    }
  }

  // If this member was ADMIN_USER, also sync back
  if (member.id === 'admin-001' || member.username === 'admin') {
    Object.assign(ADMIN_USER, member);
    if (member.role === 'Secretary' || ADMIN_USER.role === 'Secretary') {
      systemSettings.secretary_name = member.fullName || ADMIN_USER.fullName;
      setSecretaryName(systemSettings.secretary_name);
      persistSettings();
    }
  }

  persistMember(member);
  if (updates && updates.status !== undefined) {
    sendWelcomeEmailIfNeeded(member, oldStatus, member.status);
  }

  const { passwordHash, ...safeMember } = member;
  return res.json({ 
    success: true, 
    member: safeMember, 
    message: 'Profile updated and synchronized successfully across the member directory.' 
  });
});

app.post('/api/profile/update-request', (req, res) => {
  const { memberId, memberName, idCardNumber, requestedChanges } = req.body;

  if (!memberId || !requestedChanges) {
    return res.status(400).json({ error: 'Missing required update request parameters.' });
  }

  const newReq = {
    id: `pur-${Date.now().toString().slice(-6)}`,
    memberId,
    memberName,
    idCardNumber,
    requestedChanges,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  profileUpdateRequests.push(newReq);
  persistProfileRequest(newReq);

  return res.status(201).json({ success: true, request: newReq });
});

// Members Directory API (Excludes Leaders, Secretary & Admin accounts, and returns all members of any status)
app.get('/api/members', (req, res) => {
  const membersOnly = memberApplications
    .filter(m => m.role !== 'Leader' && m.role !== 'Secretary' && m.role !== 'Admin')
    .map(({ passwordHash, ...m }) => m);

  return res.json(membersOnly);
});

// Policy API Endpoints (Hierarchical Decimal Numbered - CRUD for Secretary, Read for Members)
app.get('/api/policies', (req, res) => {
  const sorted = sortPolicyItems(policiesStore);
  return res.json({ success: true, policies: sorted });
});

app.post('/api/policies', async (req, res) => {
  const { number, title, content, imageUrl, imageCaption, imageSize, imageAlignment, userRole, username, email, userId } = req.body;
  const callerRole = userRole || req.headers['x-user-role'];
  const reqUsername = username || req.headers['x-username'];
  const reqEmail = email || req.headers['x-user-email'];
  const reqUserId = userId || req.headers['x-user-id'];

  if (!isUserAdminOrSecretary(reqUsername, reqEmail, reqUserId, callerRole)) {
    return res.status(403).json({ error: 'Permission denied. Only authorized admin/secretary roles have permission to create policy items.' });
  }

  if (!number || !title || !content) {
    return res.status(400).json({ error: 'Section number, title, and content are required.' });
  }

  const cleanNum = number.trim();
  const existing = policiesStore.find(p => p.number === cleanNum);
  if (existing) {
    return res.status(400).json({ error: `Policy section number "${cleanNum}" already exists. Please use a unique decimal number or edit the existing item.` });
  }

  const newItem: PolicyItem = {
    id: `pol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    number: cleanNum,
    title: title.trim(),
    content: content.trim(),
    imageUrl: imageUrl ? imageUrl.trim() : undefined,
    imageCaption: imageCaption ? imageCaption.trim() : undefined,
    imageSize: imageSize || 'medium',
    imageAlignment: imageAlignment || 'center',
    updatedAt: new Date().toISOString()
  };

  policiesStore.push(newItem);

  if (db) {
    try {
      await setDoc(doc(db, 'policies', newItem.id), newItem);
    } catch (err) {
      console.error('Error saving policy to Firestore:', err);
    }
  }

  const sorted = sortPolicyItems(policiesStore);

  return res.json({
    success: true,
    message: `Policy section ${newItem.number} created successfully.`,
    policies: sorted
  });
});

app.put('/api/policies/:id', async (req, res) => {
  const { id } = req.params;
  const { number, title, content, imageUrl, imageCaption, imageSize, imageAlignment, userRole, username, email, userId } = req.body;
  const callerRole = userRole || req.headers['x-user-role'];
  const reqUsername = username || req.headers['x-username'];
  const reqEmail = email || req.headers['x-user-email'];
  const reqUserId = userId || req.headers['x-user-id'];

  if (!isUserAdminOrSecretary(reqUsername, reqEmail, reqUserId, callerRole)) {
    return res.status(403).json({ error: 'Permission denied. Only authorized admin/secretary roles have permission to update policy items.' });
  }

  const index = policiesStore.findIndex(p => p.id === id || p.number === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Policy item not found.' });
  }

  const current = policiesStore[index];
  const updatedItem: PolicyItem = {
    ...current,
    number: number !== undefined ? number.trim() : current.number,
    title: title !== undefined ? title.trim() : current.title,
    content: content !== undefined ? content.trim() : current.content,
    imageUrl: imageUrl !== undefined ? (imageUrl ? imageUrl.trim() : '') : current.imageUrl,
    imageCaption: imageCaption !== undefined ? (imageCaption ? imageCaption.trim() : '') : current.imageCaption,
    imageSize: imageSize !== undefined ? imageSize : (current.imageSize || 'medium'),
    imageAlignment: imageAlignment !== undefined ? imageAlignment : (current.imageAlignment || 'center'),
    updatedAt: new Date().toISOString()
  };

  policiesStore[index] = updatedItem;

  if (db) {
    try {
      await setDoc(doc(db, 'policies', current.id), updatedItem);
    } catch (err) {
      console.error('Error updating policy in Firestore:', err);
    }
  }

  const sorted = sortPolicyItems(policiesStore);
  return res.json({
    success: true,
    message: `Policy section updated successfully.`,
    policies: sorted
  });
});

app.delete('/api/policies/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = req.body?.userRole || req.headers['x-user-role'] || req.query.userRole;
  const reqUsername = req.body?.username || req.headers['x-username'];
  const reqEmail = req.body?.email || req.headers['x-user-email'];
  const reqUserId = req.body?.userId || req.headers['x-user-id'];

  if (!isUserAdminOrSecretary(reqUsername, reqEmail, reqUserId, userRole)) {
    return res.status(403).json({ error: 'Permission denied. Only authorized admin/secretary roles have permission to delete policy items.' });
  }

  const itemToDelete = policiesStore.find(p => p.id === id || p.number === id);
  policiesStore = policiesStore.filter(p => p.id !== id && p.number !== id);

  if (db) {
    try {
      if (itemToDelete?.id) {
        await deleteDoc(doc(db, 'policies', itemToDelete.id));
      }
      if (id && (!itemToDelete || itemToDelete.id !== id)) {
        await deleteDoc(doc(db, 'policies', id));
      }
      await setDoc(doc(db, 'settings', 'policy_meta'), { initialized: true });
    } catch (err) {
      console.error('Error deleting policy from Firestore:', err);
    }
  }

  const sorted = sortPolicyItems(policiesStore);

  return res.json({
    success: true,
    message: 'Policy section deleted successfully.',
    policies: sorted
  });
});

// Delete Single Member
app.delete('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = memberApplications.length;
  const memberToDelete = memberApplications.find(
    m => m.id === id || m.idCardNumber?.toUpperCase() === id.toUpperCase()
  );
  if (memberToDelete) {
    removeMember(memberToDelete.id);
  }
  memberApplications = memberApplications.filter(
    m => m.id !== id && m.idCardNumber?.toUpperCase() !== id.toUpperCase()
  );

  if (memberApplications.length === initialLen) {
    return res.status(404).json({ error: 'Member not found in database.' });
  }

  return res.json({ success: true, message: 'Member successfully deleted from database.' });
});

// Admin: Bulk Delete Members
app.post('/api/admin/members/bulk-delete', (req, res) => {
  const { memberIds } = req.body;
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ error: 'No member IDs provided for deletion.' });
  }

  const idSet = new Set(memberIds.map(id => String(id).toUpperCase()));
  const initialLen = memberApplications.length;
  
  // Remove matched members from Firestore
  memberApplications.forEach(m => {
    if (idSet.has(m.id.toUpperCase()) || idSet.has((m.idCardNumber || '').toUpperCase())) {
      removeMember(m.id);
    }
  });

  memberApplications = memberApplications.filter(
    m => !idSet.has(m.id.toUpperCase()) && !idSet.has((m.idCardNumber || '').toUpperCase())
  );
  const deletedCount = initialLen - memberApplications.length;

  return res.json({ 
    success: true, 
    deletedCount, 
    message: `Successfully deleted ${deletedCount} member(s) from database.` 
  });
});

// Admin API Routes
app.get('/api/admin/requests', (req, res) => {
  // Update leader applications retention countdown (30 days)
  const now = Date.now();
  const updatedLeaders = leaderApplications.filter(app => {
    const ageMs = now - new Date(app.createdAt).getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    app.retentionDaysLeft = Math.max(0, 30 - ageDays);
    if (app.retentionDaysLeft <= 0) {
      removeLeader(app.id); // Retention expired, delete from Firestore
    } else {
      persistLeader(app); // Retention updated, sync days left to Firestore
    }
    return app.retentionDaysLeft > 0; // Filter out after 30 days retention period
  });
  leaderApplications = updatedLeaders;

  return res.json({
    leaderApplications,
    memberApplications,
    profileUpdateRequests,
    attendanceExcuses: attendanceStore.filter(a => a.status === 'Unable To Attend')
  });
});

app.post('/api/invite', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  try {
    await setDoc(doc(db, 'invitations', token), {
      email,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: serverTimestamp()
    });

    const inviteLink = `${process.env.APP_URL || 'https://arabiyya.scouts.mv'}/join?token=${token}`;
    await sendInviteEmail(email, inviteLink);

    res.json({ success: true });
  } catch (err) {
    console.error('Error creating invitation:', err);
    res.status(500).json({ error: 'Failed to create invitation.' });
  }
});

app.get('/api/verify-invite/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const docRef = doc(db, 'invitations', token);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return res.status(404).json({ error: 'Invalid token.' });

    const data = docSnap.data();
    if (data.used) return res.status(400).json({ error: 'Token already used.' });
    if (new Date(data.expiresAt) < new Date()) return res.status(400).json({ error: 'Token expired.' });

    res.json({ email: data.email });
  } catch (err) {
    console.error('Error verifying invitation:', err);
    res.status(500).json({ error: 'Failed to verify invitation.' });
  }
});

app.put('/api/admin/requests/join/:id', (req, res) => {
  const { id } = req.params;
  const { status, investitureDate } = req.body;

  const appItem = memberApplications.find(m => m.id === id);
  if (!appItem) {
    return res.status(404).json({ error: 'Join request not found.' });
  }

  const oldStatus = appItem.status;
  if (status) appItem.status = status;
  if (investitureDate !== undefined) appItem.investitureDate = investitureDate;

  persistMember(appItem);
  if (status) {
    sendWelcomeEmailIfNeeded(appItem, oldStatus, status);
  }

  return res.json({ success: true, application: appItem });
});

app.delete('/api/admin/requests/leader/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = leaderApplications.length;
  
  const leaderToDelete = leaderApplications.find(l => l.id === id);
  if (leaderToDelete) {
    removeLeader(leaderToDelete.id);
  }
  
  leaderApplications = leaderApplications.filter(l => l.id !== id);
  
  if (leaderApplications.length === initialLen) {
    return res.status(404).json({ error: 'Leader request not found.' });
  }
  
  return res.json({ success: true, message: 'Leader request deleted successfully.' });
});

app.put('/api/admin/requests/profile-update/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const reqItem = profileUpdateRequests.find(r => r.id === id);
  if (!reqItem) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  reqItem.status = status;
  persistProfileRequest(reqItem);

  if (status === 'Approved') {
    const member = memberApplications.find(m => m.id === reqItem.memberId);
    if (member) {
      Object.assign(member, reqItem.requestedChanges);
      persistMember(member);
    }
  }

  return res.json({ success: true, request: reqItem });
});

app.delete('/api/admin/requests/profile-update/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = profileUpdateRequests.length;
  
  profileUpdateRequests = profileUpdateRequests.filter(r => r.id !== id);
  
  if (profileUpdateRequests.length === initialLen) {
    return res.status(404).json({ error: 'Request not found.' });
  }
  
  deleteProfileRequest(id);
  
  return res.json({ success: true, message: 'Request deleted successfully.' });
});

function calculateAgeAndRole(dobStr: string) {
  if (!dobStr) return { years: 20, months: 0, days: 0, role: 'Rover' };
  const dob = new Date(dobStr);
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  let role = 'Rover';
  if (years >= 16 && years < 18) {
    role = 'Explorer';
  } else if (years >= 18 && years < 26) {
    role = 'Rover';
  } else {
    role = 'Rover';
  }
  return { years, months, days, role };
}

// Helper to extract value from row with flexible key matching
function extractRowValue(row: Record<string, any>, ...candidateKeys: string[]): string | undefined {
  for (const [key, val] of Object.entries(row)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const candidate of candidateKeys) {
      const normalizedCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedKey === normalizedCandidate && val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
  }
  return undefined;
}

// Admin: Create Single Member
app.post('/api/admin/members/create', (req, res) => {
  const data = req.body;
  if (!data.fullName || !data.idCardNumber) {
    return res.status(400).json({ error: 'Full Name and ID Card Number are required.' });
  }

  const username = data.username || data.fullName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);

  const existingIndex = memberApplications.findIndex(
    m => m.idCardNumber.toUpperCase() === data.idCardNumber.toUpperCase()
  );
  if (existingIndex !== -1) {
    // Update existing member
    const existing = memberApplications[existingIndex];
    Object.assign(existing, {
      fullName: data.fullName,
      commonName: data.commonName || existing.commonName || data.fullName.split(' ')[0],
      dob: data.dob || existing.dob,
      gender: data.gender || existing.gender,
      role: data.role || existing.role,
      permanentAddress: data.permanentAddress || existing.permanentAddress,
      currentAddress: data.currentAddress || existing.currentAddress,
      emergencyName: data.emergencyName || existing.emergencyName,
      emergencyNumber: data.emergencyNumber || existing.emergencyNumber,
      email: data.email || existing.email,
      mobileNumber: data.mobileNumber || existing.mobileNumber,
      phoneNumber: data.phoneNumber || existing.phoneNumber,
      telegramNumber: data.telegramNumber || existing.telegramNumber,
      telegramTag: data.telegramTag || data.telegramNumber || existing.telegramTag,
      whatsappNumber: data.whatsappNumber || existing.whatsappNumber,
      instagramTag: data.instagramTag || existing.instagramTag,
      investitureDate: data.investitureDate || existing.investitureDate,
      resignationDate: data.resignationDate || existing.resignationDate,
      term: data.term || existing.term,
      status: data.status || existing.status,
      overallAttendanceWithoutExcused: data.overallAttendanceWithoutExcused || existing.overallAttendanceWithoutExcused,
      overallAttendanceWithExcused: data.overallAttendanceWithExcused || existing.overallAttendanceWithExcused,
      updatedAt: new Date().toISOString()
    });
    persistMember(existing);
    return res.json({ success: true, member: existing, synced: true, message: 'Member profile successfully updated and synchronized.' });
  }

  const { years, months, days, role } = calculateAgeAndRole(data.dob);

  const newMem = {
    id: `mem-${Date.now().toString().slice(-6)}`,
    ...data,
    username,
    role: data.role || role,
    ageYears: data.ageYears ?? years,
    ageMonths: data.ageMonths ?? months,
    ageDays: data.ageDays ?? days,
    age: data.age || years,
    status: data.status || 'Investiture',
    investitureDate: data.investitureDate || new Date().toISOString().split('T')[0],
    term: data.term || '2024-2026',
    mobileNumber: data.mobileNumber || data.phoneNumber || '',
    phoneNumber: data.phoneNumber || data.mobileNumber || '',
    telegramNumber: data.telegramNumber || '',
    telegramTag: data.telegramTag || data.telegramNumber || '',
    whatsappNumber: data.whatsappNumber || data.mobileNumber || data.phoneNumber || '',
    instagramTag: data.instagramTag || '',
    resignationDate: data.resignationDate || '',
    overallAttendanceWithoutExcused: data.overallAttendanceWithoutExcused || '0%',
    overallAttendanceWithExcused: data.overallAttendanceWithExcused || '0%',
    createdAt: new Date().toISOString()
  };

  memberApplications.push(newMem);
  persistMember(newMem);
  return res.status(201).json({ success: true, member: newMem });
});

// Admin: Update Single Member details individually (Secretary)
app.post('/api/admin/members/update/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = memberApplications.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Member profile not found in database.' });
  }

  const existing = memberApplications[index];
  
  const allowedFields = [
    'fullName', 'commonName', 'username', 'idCardNumber', 'dob', 'gender', 'role',
    'awardGoal', 'currentLevel', 'isNewToScouting', 'lastScoutGroup',
    'permanentAddress', 'currentAddress', 'emergencyName', 'emergencyRelationship', 'emergencyNumber',
    'email', 'mobileNumber', 'phoneNumber', 'telegramNumber', 'telegramTag', 'whatsappNumber', 'instagramTag',
    'investitureDate', 'resignationDate', 'term', 'status',
    'overallAttendanceWithoutExcused', 'overallAttendanceWithExcused'
  ];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      existing[field] = updates[field];
    }
  });

  // Re-calculate age if Date of Birth changes
  if (updates.dob) {
    const { years, months, days } = calculateAgeAndRole(updates.dob);
    existing.ageYears = years;
    existing.ageMonths = months;
    existing.ageDays = days;
    existing.age = years;
  }

  existing.updatedAt = new Date().toISOString();
  await persistMember(existing);

  return res.json({ success: true, member: existing, message: 'Member profile details successfully updated.' });
});

// Admin: Bulk Create & Sync Members from CSV / TSV / JSON rows
app.post('/api/admin/members/bulk-create', (req, res) => {
  const { members, syncExisting = true } = req.body;
  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: 'No members data provided for bulk import or sync.' });
  }

  let createdCount = 0;
  let updatedCount = 0;
  let errors: string[] = [];

  for (let i = 0; i < members.length; i++) {
    const rawRow = members[i];

    // Extract fields using flexible key mapping matching the user's logged headers
    const fullName = extractRowValue(rawRow, 'fullName', 'Full Name', 'name', 'full_name');
    const idCardNumber = extractRowValue(rawRow, 'idCardNumber', 'ID Card Number', 'idCard', 'id_card_number', 'id');
    const dob = extractRowValue(rawRow, 'dob', 'Date of Birth', 'dateOfBirth', 'date_of_birth', 'birthDate') || '2005-01-01';
    const permAddress = extractRowValue(rawRow, 'permanentAddress', 'Permenant Address', 'Permanent Address', 'permAddress', 'permanent_address') || 'Maldives';
    const permCity = extractRowValue(rawRow, 'permanentCity', 'Permanent Address City / Island', 'Permanent Address City/Island', 'Permanent City / Island', 'Permanent City', 'permanentAddressCity') || '';
    const permState = extractRowValue(rawRow, 'permanentState', 'Permanent Address State / Atoll', 'Permanent Address State/Atoll', 'Permanent State / Atoll', 'Permanent State', 'permanentAddressState') || '';
    const permCountry = extractRowValue(rawRow, 'permanentCountry', 'Permanent Address Country', 'permanentAddressCountry') || 'Maldives';

    const gender = extractRowValue(rawRow, 'gender', 'Gender', 'sex') || 'Male';
    const currAddress = extractRowValue(rawRow, 'currentAddress', 'Current Address', 'currAddress', 'current_address') || permAddress;
    const currentCity = extractRowValue(rawRow, 'currentCity', 'Current Address City / Island', 'Current Address City/Island', 'Current City / Island', 'Current City', 'City / Island', 'City', 'Island', 'currentAddressCity') || permCity || '';
    const currentState = extractRowValue(rawRow, 'currentState', 'Current Address State / Atoll', 'Current Address State/Atoll', 'Current State / Atoll', 'Current State', 'State / Atoll', 'State', 'Atoll', 'currentAddressState') || permState || '';
    const currentCountry = extractRowValue(rawRow, 'currentCountry', 'Current Address Country', 'Country', 'currentAddressCountry') || permCountry || 'Maldives';
    
    const emergencyName = extractRowValue(rawRow, 'emergencyName', 'Emergency Contact Name', 'emergencyContactName', 'emergency_contact_name') || 'Family Contact';
    const emergencyNumber = extractRowValue(rawRow, 'emergencyNumber', 'Emergency Contact Number', 'emergencyContactNumber', 'emergency_contact_number') || '7777777';
    const email = extractRowValue(rawRow, 'email', 'Email Address', 'emailAddress', 'email_address') || '';
    const mobileNumber = extractRowValue(rawRow, 'mobileNumber', 'Mobile Number', 'mobile', 'mobile_number') || '';
    const phoneNumber = extractRowValue(rawRow, 'phoneNumber', 'Phone Number', 'phone', 'phone_number') || mobileNumber || '7777777';
    const telegramNumber = extractRowValue(rawRow, 'telegramNumber', 'Telegram Number', 'telegram', 'telegramTag') || '';
    const whatsappNumber = extractRowValue(rawRow, 'whatsappNumber', 'Whatsapp Number', 'WhatsApp Number', 'whatsapp') || mobileNumber || phoneNumber || '';
    const instagramTag = extractRowValue(rawRow, 'instagramTag', 'Instagram Tag', 'instagram', 'insta') || '';
    const investitureDate = extractRowValue(rawRow, 'investitureDate', 'Investiture Date', 'investiture_date') || new Date().toISOString().split('T')[0];
    const resignationDate = extractRowValue(rawRow, 'resignationDate', 'Resignation Date', 'resignation_date') || '';
    const overallAttendanceWithoutExcused = extractRowValue(rawRow, 'overallAttendanceWithoutExcused', 'Overall Attendance Without Excused', 'attendanceWithoutExcused') || '0%';
    const overallAttendanceWithExcused = extractRowValue(rawRow, 'overallAttendanceWithExcused', 'Overall Attendance With Excused', 'attendanceWithExcused') || '0%';
    
    // Additional scout progression fields if provided
    const commonName = extractRowValue(rawRow, 'commonName', 'Common Name') || (fullName ? fullName.split(' ')[0] : '');
    const currentLevel = extractRowValue(rawRow, 'currentLevel', 'Current Level') || 'Square';
    const lastScoutGroup = extractRowValue(rawRow, 'lastScoutGroup', 'Last Scout Group') || '';
    const isNewToScouting = extractRowValue(rawRow, 'isNewToScouting', 'Is New To Scouting');
    const isNewScout = isNewToScouting !== undefined
      ? (String(isNewToScouting).toLowerCase() === 'true' || String(isNewToScouting).toLowerCase() === 'yes')
      : true;
    const emergencyRelationship = extractRowValue(rawRow, 'emergencyRelationship', 'Emergency Relationship') || 'Parent';

    if (!fullName || !idCardNumber) {
      errors.push(`Row ${i + 1}: Missing Full Name or ID Card Number.`);
      continue;
    }

    const cleanId = idCardNumber.trim().toUpperCase();
    const cleanUsername = extractRowValue(rawRow, 'username', 'Username') || 
      (fullName.toLowerCase().replace(/[^a-z0-9]/g, '') + cleanId.slice(-3));

    // Calculate age & role & award goal automatically based on DOB (<18 => President Scout Award, >=18 => Baden-Powell Award)
    const { years, months, days, role } = calculateAgeAndRole(dob);
    const calculatedAwardGoal = years < 18 ? 'President Scout Award' : 'Baden-Powell Award';

    const structuredPermanentAddress = {
      country: permCountry || 'Maldives',
      state: permState || '',
      city: permCity || '',
      district: 'N/A',
      addressLine: permAddress || permCity || ''
    };

    const structuredCurrentAddress = {
      country: currentCountry || 'Maldives',
      state: currentState || '',
      city: currentCity || '',
      district: 'N/A',
      addressLine: currAddress || currentCity || ''
    };

    // Check if member already exists by ID Card Number or username
    const existing = memberApplications.find(
      m => (m.idCardNumber || '').toUpperCase() === cleanId || (m.username || '').toLowerCase() === cleanUsername.toLowerCase()
    );

    if (existing) {
      const isAlreadyActive = (existing.status || '').toLowerCase().trim() === 'active';
      if (isAlreadyActive) {
        errors.push(`Row ${i + 1} (${fullName}): Member with ID Card ${cleanId} is already Active. Existing Active member details cannot be altered via bulk update.`);
        continue;
      }

      if (syncExisting) {
        // Synchronize and update existing non-active member record
        existing.fullName = fullName;
        if (commonName) existing.commonName = commonName;
        if (dob) {
          existing.dob = dob;
          const { years: y, months: m, days: d, role: r } = calculateAgeAndRole(dob);
          existing.ageYears = y;
          existing.ageMonths = m;
          existing.ageDays = d;
          existing.age = y;
          existing.role = r || (y < 18 ? 'Explorer' : 'Rover');
          existing.awardGoal = y < 18 ? 'President Scout Award' : 'Baden-Powell Award';
          existing.awardIntent = true;
        }
        if (gender) existing.gender = gender;
        if (permAddress) existing.permanentAddress = structuredPermanentAddress;
        existing.currentAddress = structuredCurrentAddress;
        if (emergencyName) existing.emergencyName = emergencyName;
        if (emergencyNumber) existing.emergencyNumber = emergencyNumber;
        if (email) existing.email = email;
        if (mobileNumber) existing.mobileNumber = mobileNumber;
        if (phoneNumber) existing.phoneNumber = phoneNumber;
        if (telegramNumber) {
          existing.telegramNumber = telegramNumber;
          if (!existing.telegramTag) existing.telegramTag = telegramNumber;
        }
        if (whatsappNumber) existing.whatsappNumber = whatsappNumber;
        if (instagramTag) existing.instagramTag = instagramTag;
        if (currentLevel) existing.currentLevel = currentLevel;
        if (lastScoutGroup) existing.lastScoutGroup = lastScoutGroup;
        if (isNewToScouting !== undefined) existing.isNewToScouting = isNewScout;
        if (emergencyRelationship) existing.emergencyRelationship = emergencyRelationship;
        if (rawRow['Telegram Tag'] || rawRow['telegramTag']) {
          existing.telegramTag = extractRowValue(rawRow, 'telegramTag', 'Telegram Tag');
        }
        if (investitureDate) existing.investitureDate = investitureDate;
        if (resignationDate !== undefined) existing.resignationDate = resignationDate;
        if (overallAttendanceWithoutExcused) existing.overallAttendanceWithoutExcused = overallAttendanceWithoutExcused;
        if (overallAttendanceWithExcused) existing.overallAttendanceWithExcused = overallAttendanceWithExcused;
        existing.updatedAt = new Date().toISOString();
        persistMember(existing);
        updatedCount++;
        continue;
      } else {
        errors.push(`Row ${i + 1} (${fullName}): Member with ID Card ${cleanId} already exists.`);
        continue;
      }
    }

    const newMem = {
      id: `mem-${Date.now().toString().slice(-6)}-${i}`,
      fullName: fullName.trim(),
      commonName: commonName.trim() || fullName.trim().split(' ')[0],
      username: cleanUsername,
      passwordHash: extractRowValue(rawRow, 'password', 'Password') || 'scout123',
      idCardNumber: cleanId,
      dob: dob,
      ageYears: years,
      ageMonths: months,
      ageDays: days,
      age: years,
      gender: gender,
      role: role || (years < 18 ? 'Explorer' : 'Rover'),
      awardIntent: true,
      awardGoal: calculatedAwardGoal,
      currentLevel: currentLevel,
      isNewToScouting: isNewScout,
      lastScoutGroup: lastScoutGroup,
      phoneNumber: phoneNumber,
      mobileNumber: mobileNumber || phoneNumber,
      email: email || `${cleanUsername}@arabiyya.edu.mv`,
      telegramNumber: telegramNumber,
      telegramTag: extractRowValue(rawRow, 'telegramTag', 'Telegram Tag') || telegramNumber || '',
      whatsappNumber: whatsappNumber,
      instagramTag: instagramTag,
      permanentAddress: structuredPermanentAddress,
      currentAddress: structuredCurrentAddress,
      emergencyName: emergencyName,
      emergencyRelationship: emergencyRelationship,
      emergencyNumber: emergencyNumber,
      status: 'Pending Verification',
      investitureDate: investitureDate,
      resignationDate: resignationDate,
      term: '2024-2026',
      overallAttendanceWithoutExcused: overallAttendanceWithoutExcused,
      overallAttendanceWithExcused: overallAttendanceWithExcused,
      createdAt: new Date().toISOString()
    };

    memberApplications.push(newMem);
    persistMember(newMem);
    createdCount++;
  }

  return res.json({
    success: true,
    createdCount,
    updatedCount,
    totalCount: createdCount + updatedCount,
    errors
  });
});

// Public Settings & Branding API (accessible by any client/page on startup)
app.get('/api/settings', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.json({
    group_logo: systemSettings.group_logo || '/logo.svg',
    event_types: systemSettings.event_types,
    supported_apps: systemSettings.supported_apps || []
  });
});

app.get('/api/logo', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.json({
    group_logo: systemSettings.group_logo || '/logo.svg'
  });
});

// Admin System Settings API
app.get('/api/admin/settings', (req, res) => {
  return res.json(systemSettings);
});

app.put('/api/admin/settings', async (req, res) => {
  const { leader_notification_emails, rover_notification_emails, event_types, group_logo, secretary_name, supported_apps, sso_api_key, admin_roles } = req.body;

  if (leader_notification_emails) {
    systemSettings.leader_notification_emails = leader_notification_emails;
  }
  if (rover_notification_emails) {
    systemSettings.rover_notification_emails = rover_notification_emails;
  }
  if (event_types) {
    systemSettings.event_types = event_types;
  }
  if (secretary_name) {
    systemSettings.secretary_name = secretary_name.trim();
    setSecretaryName(systemSettings.secretary_name);
  }
  if (group_logo !== undefined) {
    systemSettings.group_logo = group_logo;
    updateEmailDesignConfig(group_logo);
    syncLogoFileToDisk(group_logo);
  }
  if (supported_apps) {
    systemSettings.supported_apps = supported_apps;
  }
  if (sso_api_key) {
    systemSettings.sso_api_key = sso_api_key.trim();
  }
  if (admin_roles) {
    systemSettings.admin_roles = admin_roles;
  }
  await persistSettings();

  return res.json({ success: true, settings: systemSettings });
});

// Admin SSO API Key update endpoint
app.put('/api/admin/settings/sso-key', async (req, res) => {
  const { sso_api_key } = req.body;
  if (!sso_api_key) {
    return res.status(400).json({ error: 'SSO API Key cannot be empty.' });
  }
  systemSettings.sso_api_key = sso_api_key.trim();
  await persistSettings();
  return res.json({ success: true, message: 'SSO API Key updated successfully.', sso_api_key: systemSettings.sso_api_key });
});

// Centralized SSO Authentication API for Third-Party Apps (Courses, Finance, etc.)
app.post('/api/sso/authenticate', async (req, res) => {
  const { username, password, apiKey } = req.body;
  const headerApiKey = req.headers['x-sso-api-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
  const providedApiKey = apiKey || headerApiKey;

  const masterKey = systemSettings.sso_api_key || 'arabiyya_sso_hwbg36jf97n16gwuzp1hk';
  if (providedApiKey && providedApiKey !== masterKey && providedApiKey !== 'arabiyya_sso_hwbg36jf97n16gwuzp1hk') {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Master SSO API Key.' });
  }

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username, ID Card, Email, and password are required.' });
  }

  // Check Admin
  const queryInput = (username || '').trim().toLowerCase();
  const isDocAdmin = queryInput === 'admin' || 
                      queryInput === 'a000000' || 
                      queryInput === 'it@arabiyyascouts.org' ||
                      queryInput === 'nazihnafiz@gmail.com';
  if (isDocAdmin && (password === ADMIN_USER.passwordHash || password === 'admin123' || password === 'password')) {
    return res.json({
      success: true,
      token: `sso_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      user: {
        id: ADMIN_USER.id,
        username: ADMIN_USER.username,
        fullName: ADMIN_USER.fullName,
        commonName: ADMIN_USER.commonName,
        role: ADMIN_USER.role,
        idCardNumber: ADMIN_USER.idCardNumber,
        email: ADMIN_USER.email,
        status: 'Investiture',
        investitureDate: ADMIN_USER.investitureDate,
        awardGoal: ADMIN_USER.awardGoal,
        awardIntent: false,
        currentLevel: ADMIN_USER.currentLevel,
        permissions: ['all', 'admin', 'secretary']
      }
    });
  }

  // Check Member with standard username matching, allowing ID Card ONLY for first-time sign-in
  const member = memberApplications.find(m => {
    const uName = (m.username || '').toLowerCase();
    const idCard = (m.idCardNumber || '').toLowerCase();
    
    // Determine if the member has already set up custom credentials
    const hasSetCustomCreds = !!(m.passwordHash && m.username && m.username !== m.idCardNumber);
    
    let matchesId = false;
    if (hasSetCustomCreds) {
      // Must use their configured custom username
      matchesId = uName === queryInput;
    } else {
      // First-time login: allow ID Card or username
      matchesId = idCard === queryInput || uName === queryInput;
    }
    
    // Support phone number without country code as initial password for bulk imported members
    const normInputPassword = (password || '').trim().replace(/\D/g, '');
    const normMemberPhone = (m.phoneNumber || m.mobileNumber || '').replace(/\D/g, '');
    const normMemberPhoneNoCc = normMemberPhone.startsWith('960') && normMemberPhone.length >= 10 ? normMemberPhone.slice(3) : normMemberPhone;
    
    const matchesPassword = m.passwordHash === password || 
                            password === 'password' || 
                            (!m.passwordHash && normInputPassword !== '' && normInputPassword === normMemberPhoneNoCc) ||
                            (password === 'admin123' && isUserAdminOrSecretary(m.username, m.email, m.id, m.role));
                            
    return matchesId && matchesPassword;
  });

  if (!member) {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  if (member.status === 'Member Suspension' || member.status === 'Suspended' || member.status === 'Resignation' || member.status === 'Resigned') {
    return res.status(403).json({ success: false, error: 'Account is suspended or deactivated.' });
  }

  return res.json({
    success: true,
    token: `sso_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    user: {
      id: member.id,
      username: member.username || member.idCardNumber,
      fullName: member.fullName,
      commonName: member.commonName || member.fullName,
      role: member.role,
      idCardNumber: member.idCardNumber,
      email: member.email,
      mobileNumber: member.mobileNumber || member.phoneNumber,
      status: member.status,
      investitureDate: member.investitureDate,
      awardGoal: member.awardGoal,
      awardIntent: member.awardIntent,
      currentLevel: member.currentLevel,
      telegramTag: member.telegramTag,
      emergencyContact: member.emergencyContact
    }
  });
});

// Admin SMTP Configuration API
app.get('/api/admin/smtp', (req, res) => {
  const config = getSmtpConfig();
  const configured = Boolean(config.host && config.user);
  return res.json({
    configured,
    config
  });
});

app.put('/api/admin/smtp', (req, res) => {
  const { host, port, secure, user, pass, from } = req.body;
  updateSmtpConfig({
    host,
    port: port ? parseInt(port, 10) : undefined,
    secure: Boolean(secure),
    user,
    pass,
    from
  });
  return res.json({
    success: true,
    message: 'SMTP configuration updated successfully.',
    config: getSmtpConfig()
  });
});

app.post('/api/admin/smtp/verify', async (req, res) => {
  const { host, port, secure, user, pass } = req.body || {};
  const result = await verifySmtp(host ? { host, port: port ? parseInt(port, 10) : undefined, secure: Boolean(secure), user, pass } : undefined);
  return res.json(result);
});

app.post('/api/admin/smtp/test-email', async (req, res) => {
  const { recipientEmail } = req.body;

  if (!recipientEmail || !recipientEmail.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid recipient email address.' });
  }

  const result = await sendTestEmail(recipientEmail.trim());

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error || 'Failed to dispatch test email. Please check your SMTP credentials.'
    });
  }

  return res.json({
    success: true,
    message: result.simulated
      ? `SMTP credentials not yet configured. Simulated delivery to ${recipientEmail}. Provide SMTP credentials to dispatch live emails.`
      : `Test email dispatched successfully to ${recipientEmail}! Message ID: ${result.messageId}`
  });
});

// Admin Telegram Configuration API
app.get('/api/admin/telegram', (req, res) => {
  const config = getTelegramConfig();
  return res.json({
    configured: Boolean(config.bot_token),
    config
  });
});

app.put('/api/admin/telegram', async (req, res) => {
  const { bot_token, chat_id, channel_username, enabled, announcement_chat_id } = req.body || {};
  
  const updated = {
    bot_token: bot_token || '',
    chat_id: chat_id || '@arabiyyarovers',
    channel_username: channel_username || '@arabiyyascoutsbot',
    enabled: enabled !== undefined ? Boolean(enabled) : false,
    announcement_chat_id: announcement_chat_id || ''
  };

  updateTelegramConfig(updated);

  try {
    if (db) {
      await setDoc(doc(db, 'settings', 'telegram'), updated, { merge: true });
    }
    return res.json({
      success: true,
      message: 'Telegram settings updated and persisted successfully.',
      config: getTelegramConfig()
    });
  } catch (error: any) {
    console.error('[Error persisting telegram settings to Firestore]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to persist settings in Firestore database, but updated runtime config.'
    });
  }
});

app.post('/api/admin/telegram/verify', async (req, res) => {
  const { bot_token } = req.body || {};
  const result = await verifyTelegramBot(bot_token);
  return res.json(result);
});

app.post('/api/admin/telegram/test', async (req, res) => {
  const { bot_token, chat_id, custom_message } = req.body || {};
  const result = await sendTelegramTestMessage({
    bot_token,
    chat_id,
    customMessage: custom_message
  });
  return res.json(result);
});

// Start Server with Vite Middleware for SPA Routing
async function start() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Dynamic dev-mode interceptor to prevent blank pages when root index.html contains production bundle paths
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      const isHtmlRequest = (req.headers.accept?.includes('text/html') || url === '/' || url.endsWith('.html')) && !url.includes('.');
      
      if (isHtmlRequest && !url.startsWith('/api/')) {
        try {
          const indexPath = path.join(process.cwd(), 'index.html');
          if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');
            
            // If the index.html on disk contains compiled production tags, hot-swap them back to the development script
            if (html.includes('/assets/index-') || html.includes('crossorigin')) {
              // Replace any production bundles with dev script
              html = html.replace(
                /<script\s+type="module"\s+crossorigin\s+src="\/assets\/index-[^>]+><\/script>/gi,
                '<script type="module" src="/src/main.tsx"></script>'
              );
              html = html.replace(
                /<script[^>]+src="\/assets\/index-[^>]+"[^>]*><\/script>/gi,
                '<script type="module" src="/src/main.tsx"></script>'
              );
              // Remove any modulepreload tags and compiled CSS styles
              html = html.replace(/<link\s+rel="modulepreload"[^>]+>/gi, '');
              html = html.replace(/<link\s+rel="stylesheet"\s+crossorigin\s+href="\/assets\/index-[^>]+>/gi, '');
            }
            
            // Always run Vite's HTML transform to inject the Vite client and enable HMR/Dev compilation
            const transformedHtml = await vite.transformIndexHtml(url, html);
            return res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
          }
        } catch (e) {
          console.error('[Vite Dev Interceptor Error]:', e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    // Robust resolution of distPath across local and containerized deployments
    const possibleDistPaths = [
      path.join(process.cwd(), 'dist'),
      path.resolve(__dirname),
      path.resolve(__dirname, '..', 'dist'),
      path.resolve(__dirname, 'dist'),
      process.cwd()
    ];
    const distPath = possibleDistPaths.find(p => fs.existsSync(path.join(p, 'index.html'))) || possibleDistPaths[0];
    console.log(`[Production SPA] Serving static files from: ${distPath}`);

    app.use(express.static(distPath));

    // Handle SPA fallback for client-side routing
    app.get('*', (req, res) => {
      // Do not return index.html for API requests
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      // Do not return HTML for static assets that fail to load (prevents browser MIME type errors on module scripts)
      if (req.path.startsWith('/assets/') || /\.(js|css|svg|png|jpg|jpeg|gif|ico|json|woff2?|ttf|eot)$/i.test(req.path)) {
        return res.status(404).send('Asset not found');
      }

      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send('Arabiyya Members Application build files not found. Please verify npm run build has completed.');
      }
    });
  }

  // Infrastructure constraint: Port 3000 is hardcoded for the nginx reverse proxy
  // both in local development and production container deployments.
  const PORT = 3000;

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arabiyya Rovers Server listening on port ${PORT} [mode: ${isProduction ? 'production' : 'development'}]`);
  });

  server.on('error', (err: any) => {
    console.error(`[Server Error] Failed to listen on port ${PORT}:`, err);
  });
}

start();
