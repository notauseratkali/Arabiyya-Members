export type RoleSection = 'Explorer' | 'Rover' | 'Leader' | 'Admin';
export type RoleBracket = RoleSection; // Alias for backward compatibility

export type ApplicationPipelineStatus = 'Pending Review' | 'Interview & Investiture' | 'Approved' | 'Rejected' | 'Processing' | 'Interview' | 'Investiture';

export type AwardGoal = 'President Scout Award' | 'Baden-Powell Award' | 'None';

export type ProgressionLevel = 
  | 'Square' 
  | 'Scout Standard' 
  | 'Advanced Scout Standard' 
  | 'Bushman\'s Thong' 
  | 'President Scout Award' 
  | 'President Scout Award Holder' 
  | 'None';

export interface Address {
  country: string;
  state: string;
  city: string;
  district: string;
  addressLine: string;
}

export interface MemberApplication {
  id: string;
  dob: string; // YYYY-MM-DD
  ageYears: number;
  ageMonths: number;
  ageDays: number;
  age?: string | number;
  role: RoleSection;
  awardIntent: boolean;
  awardGoal: AwardGoal;
  currentLevel: ProgressionLevel;
  estimatedTimeline?: string;
  isNewToScouting: boolean;
  lastScoutGroup?: string;
  fullName: string;
  commonName: string;
  idCardNumber: string;
  gender: string;
  permanentAddress: Address | string;
  currentAddress: Address | string;
  phoneNumber: string;
  mobileNumber?: string;
  telegramTag: string;
  telegramNumber?: string;
  whatsappNumber?: string;
  instagramTag: string;
  email: string;
  emergencyName: string;
  emergencyRelationship?: string;
  emergencyNumber: string;
  username: string;
  password?: string;
  status: ApplicationPipelineStatus | 'Active' | 'Resigned' | 'Suspended' | string;
  investitureDate?: string; // YYYY-MM-DD
  resignationDate?: string; // YYYY-MM-DD
  term?: string;
  overallAttendanceWithoutExcused?: string | number;
  overallAttendanceWithExcused?: string | number;
  createdAt: string;
  policyAgreed: boolean;
}

export type Member = MemberApplication;

export interface LeaderApplication {
  id: string;
  fullName: string;
  idCardNumber: string;
  permanentAddress: Address;
  currentAddress: Address;
  phoneNumber: string;
  email: string;
  createdAt: string;
  retentionDaysLeft: number;
  emailsDispatchedTo: string[];
}

export interface EventItem {
  id: string;
  name: string;
  fromDateTime: string; // YYYY-MM-DDTHH:mm
  toDateTime: string;   // YYYY-MM-DDTHH:mm
  eventType: string;
  location: string;
  description?: string;
  isSignUpEvent?: boolean; // True if Secretary created as a Sign Up event
  signedUpMembers?: string[]; // Array of member IDs who signed up
  membersRequired: string[] | 'All' | 'LocationBased'; // Array of member IDs or 'All' or 'LocationBased'
  requiredCities?: string[]; // Array of selected member current address city names (e.g. ['Male', 'Hulhumale'])
  notificationType: 'Email' | 'Telegram' | 'SMS' | 'WhatsApp' | 'All';
  publishDateTime?: string; // YYYY-MM-DDTHH:mm Publish Date
  triggerDateTime?: string; // YYYY-MM-DDTHH:mm Gatekeeper alias
  createdAt: string;
  emailNotified?: boolean;
  minutesPublished?: boolean;
  minutesId?: string;
}

export interface MeetingMinute {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  title: string;
  agenda?: string;
  discussionPoints: string;
  resolutions?: string;
  actionItems?: string;
  nextMeetingDate?: string;
  publishedBy: string;
  publishedAt: string;
  isPublished: boolean;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  memberCommonName: string;
  status: 'Attended' | 'Excused' | 'Unable To Attend' | 'Pending' | 'Not Required';
  excuseReason?: string;
  excuseStatus?: 'Pending Review' | 'Approved' | 'Rejected';
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  id: string;
  memberId: string;
  memberName: string;
  idCardNumber: string;
  requestedChanges: {
    fullName?: string;
    commonName?: string;
    awardIntent?: boolean;
    currentLevel?: ProgressionLevel;
    phoneNumber?: string;
    telegramTag?: string;
    instagramTag?: string;
    email?: string;
    emergencyName?: string;
    emergencyRelationship?: string;
    emergencyNumber?: string;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  channel_username?: string;
  enabled: boolean;
  announcement_chat_id?: string;
}

export interface AnnouncementPresetTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  category: 'General' | 'Important' | 'Urgent' | 'Event' | 'Investiture' | 'Training';
  actionUrl?: string;
  actionText?: string;
  targetAudience?: 'All' | 'Explorers' | 'Rovers' | 'Leaders' | 'Candidates' | 'Specific';
  channels?: ('Email' | 'Telegram' | 'InApp')[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  category: 'General' | 'Important' | 'Urgent' | 'Event' | 'Investiture' | 'Training';
  targetAudience: 'All' | 'Explorers' | 'Rovers' | 'Leaders' | 'Candidates';
  channels: ('Email' | 'Telegram' | 'InApp')[];
  actionUrl?: string;
  actionText?: string;
  dispatchedAt: string;
  dispatchedBy: string;
  emailCount?: number;
  telegramDelivered?: boolean;
  telegramError?: string;
  inAppActive?: boolean;
}

export interface SystemSettings {
  leader_notification_emails: string[];
  event_types: string[];
  group_logo?: string;
  secretary_name?: string;
  telegram?: TelegramConfig;
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  commonName: string;
  role: RoleSection | string;
  idCardNumber: string;
  email: string;
  isAdmin?: boolean;
  phoneNumber?: string;
  mobileNumber?: string;
  telegramNumber?: string;
  whatsappNumber?: string;
  term?: string;
  resignationDate?: string;
  overallAttendanceWithoutExcused?: string | number;
  overallAttendanceWithExcused?: string | number;
  status: ApplicationPipelineStatus | 'Active' | 'Resigned' | 'Suspended' | string;
  investitureDate?: string;
  awardGoal: AwardGoal;
  awardIntent: boolean;
  currentLevel: ProgressionLevel;
  dob?: string;
  ageYears?: number;
  ageMonths?: number;
  ageDays?: number;
  gender?: string;
  permanentAddress?: Address | string;
  currentAddress?: Address | string;
  telegramTag?: string;
  instagramTag?: string;
}
