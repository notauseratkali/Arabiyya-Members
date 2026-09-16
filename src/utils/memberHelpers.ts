import { MemberApplication, EventItem } from '../types';

/**
 * Safely extracts the current address city from a member profile.
 * Falls back to permanent address city if current address city is unavailable.
 */
export const getMemberCurrentCity = (member: any): string => {
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
};

/**
 * Checks if a member has voluntary suspension status.
 */
export const isMemberVoluntarilySuspended = (member: any): boolean => {
  if (!member) return false;
  const status = String(member.status || '').toLowerCase().trim();
  return (
    status === 'voluntary suspension' ||
    status === 'voluntary suspended' ||
    status === 'voluntary_suspension' ||
    Boolean(member.voluntarySuspension)
  );
};

/**
 * Extracts a deduplicated, sorted list of all unique member current address cities with member counts.
 */
export const getUniqueMemberCitiesWithCounts = (members: any[]): { city: string; count: number; members: any[] }[] => {
  const cityMap = new Map<string, any[]>();

  (members || []).forEach(m => {
    const city = getMemberCurrentCity(m);
    if (city) {
      const existing = cityMap.get(city) || [];
      existing.push(m);
      cityMap.set(city, existing);
    }
  });

  const result: { city: string; count: number; members: any[] }[] = [];
  cityMap.forEach((mems, city) => {
    result.push({
      city,
      count: mems.length,
      members: mems
    });
  });

  // Sort by count descending, then alphabetically
  return result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.city.localeCompare(b.city);
  });
};

/**
 * Determines whether an event is mandatory/required for a specific member,
 * and the specific policy reason.
 * 
 * Rules:
 * 1. Voluntary Suspended members are auto-excused from all required meetings.
 * 2. Location-Specific events: required for members in selected cities; optional for others.
 * 3. Specific member list: required if listed; optional for others.
 * 4. All members required: required for all active members.
 */
export const evaluateEventRequirementForMember = (
  event: EventItem,
  member: any
): {
  isRequired: boolean;
  isAutoExcused: boolean;
  isOptional: boolean;
  isSuspended: boolean;
  statusLabel: string;
  badgeStyle: string;
  reason: string;
} => {
  if (!event || !member) {
    return {
      isRequired: false,
      isAutoExcused: false,
      isOptional: true,
      isSuspended: false,
      statusLabel: 'Optional Attendance',
      badgeStyle: 'bg-gray-100 text-gray-700 border-gray-200',
      reason: 'No event or member context'
    };
  }

  const isVoluntarySuspended = isMemberVoluntarilySuspended(member);
  const memCity = getMemberCurrentCity(member);

  // If the member is in voluntary suspension:
  if (isVoluntarySuspended) {
    return {
      isRequired: false,
      isAutoExcused: true,
      isOptional: true,
      isSuspended: true,
      statusLabel: 'Auto Excused (Voluntary Suspension)',
      badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      reason: 'Voluntary suspended members are auto excused from required meetings (open to attend optionally).'
    };
  }

  // Sign-Up Event check: Attendance to be taken of members signed up
  if (event.isSignUpEvent) {
    const isSignedUp = Array.isArray(event.signedUpMembers) && event.signedUpMembers.includes(member.id);
    if (isSignedUp) {
      return {
        isRequired: true,
        isAutoExcused: false,
        isOptional: false,
        isSuspended: false,
        statusLabel: 'Signed Up (Attendance Required)',
        badgeStyle: 'bg-pink-50 text-pink-700 border-pink-300 font-bold',
        reason: 'Sign Up Event: Attendance to be taken of members signed up.'
      };
    } else {
      return {
        isRequired: false,
        isAutoExcused: false,
        isOptional: true,
        isSuspended: false,
        statusLabel: 'Not Signed Up (Not Required)',
        badgeStyle: 'bg-gray-100 text-gray-600 border-gray-200',
        reason: 'Sign Up Event: Attendance is only taken for members who signed up.'
      };
    }
  }

  // Location-Specific Requirement check
  if (event.requiredCities && Array.isArray(event.requiredCities) && event.requiredCities.length > 0) {
    const memCityLower = memCity.toLowerCase().trim();
    const isCityMatched = event.requiredCities.some(c => {
      const reqCityLower = c.toLowerCase().trim();
      return (
        memCityLower === reqCityLower ||
        memCityLower.includes(reqCityLower) ||
        reqCityLower.includes(memCityLower)
      );
    });

    if (isCityMatched) {
      return {
        isRequired: true,
        isAutoExcused: false,
        isOptional: false,
        isSuspended: false,
        statusLabel: `Required (Location: ${memCity || 'Matched City'})`,
        badgeStyle: 'bg-red-50 text-maroon border-red-200 font-bold',
        reason: `Your current address city (${memCity}) is in the required location list for this event.`
      };
    } else {
      return {
        isRequired: false,
        isAutoExcused: false,
        isOptional: true,
        isSuspended: false,
        statusLabel: `Optional (Location: ${memCity || 'Other'})`,
        badgeStyle: 'bg-sky-50 text-sky-800 border-sky-200',
        reason: `This event is location-specific for ${event.requiredCities.join(', ')}. Since your current address is ${memCity || 'elsewhere'}, your attendance is optional and absence is not penalized.`
      };
    }
  }

  // Specific Member list check
  if (Array.isArray(event.membersRequired)) {
    if (event.membersRequired.includes(member.id)) {
      return {
        isRequired: true,
        isAutoExcused: false,
        isOptional: false,
        isSuspended: false,
        statusLabel: 'Required (Assigned Attendee)',
        badgeStyle: 'bg-red-50 text-maroon border-red-200 font-bold',
        reason: 'You are specifically listed as a required attendee for this event.'
      };
    } else {
      return {
        isRequired: false,
        isAutoExcused: false,
        isOptional: true,
        isSuspended: false,
        statusLabel: 'Optional (Open for All)',
        badgeStyle: 'bg-gray-100 text-gray-700 border-gray-200',
        reason: 'You are welcome to join, but attendance is not mandatory for this event.'
      };
    }
  }

  // Default: All Members Required
  return {
    isRequired: true,
    isAutoExcused: false,
    isOptional: false,
    isSuspended: false,
    statusLabel: 'Required (All Crew)',
    badgeStyle: 'bg-red-50 text-maroon border-red-200 font-bold',
    reason: 'This is a mandatory event for all active Arabiyya Rover & Explorer members.'
  };
};
