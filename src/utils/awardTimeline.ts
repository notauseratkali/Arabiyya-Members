/**
 * Helper to calculate precise remaining time until Award Submission Deadline
 * Rule: 
 * - Explorer / President Scout Award: 1 day before 18th birthday
 * - Rover / Baden-Powell Award: 1 day before 26th birthday
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function parseDobDate(dobStr?: string): { year: number; month: number; day: number } | null {
  if (!dobStr || typeof dobStr !== 'string') return null;
  const cleanStr = dobStr.trim();
  if (!cleanStr) return null;

  // Check ISO format YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = cleanStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  // Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleanStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  // Fallback Date object
  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
      day: parsed.getDate()
    };
  }

  return null;
}

export function formatDeadlineDate(date: Date): string {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function getAwardDeadlineInfo(
  dob?: string,
  role?: string,
  ageYears?: number,
  ageMonths?: number,
  ageDays?: number,
  awardGoal?: string
): {
  isPursuing: boolean;
  targetAge: number;
  targetAward: string;
  deadlineDateStr: string | null;
  birthdayDateStr: string | null;
  timeRemainingStr: string;
  isExpired: boolean;
} {
  if (awardGoal === 'None' || (!awardGoal && role === 'Leader')) {
    return {
      isPursuing: false,
      targetAge: 26,
      targetAward: 'None',
      deadlineDateStr: null,
      birthdayDateStr: null,
      timeRemainingStr: 'Not Pursuing Award',
      isExpired: false
    };
  }

  const isExplorer = role === 'Explorer' || awardGoal === 'President Scout Award';
  const targetAge = isExplorer ? 18 : 26;
  const targetAward = isExplorer ? 'President Scout Award' : 'Baden-Powell Award';

  const parsedDob = parseDobDate(dob);

  if (parsedDob) {
    const today = new Date();
    // Marked birthday
    const birthdayDate = new Date(parsedDob.year + targetAge, parsedDob.month - 1, parsedDob.day);
    // Deadline is strictly 1 day before the marked birthday
    const deadlineDate = new Date(parsedDob.year + targetAge, parsedDob.month - 1, parsedDob.day - 1);
    const deadlineFormatted = formatDeadlineDate(deadlineDate);
    const birthdayFormatted = formatDeadlineDate(birthdayDate);

    if (deadlineDate <= today) {
      return {
        isPursuing: true,
        targetAge,
        targetAward,
        deadlineDateStr: deadlineFormatted,
        birthdayDateStr: birthdayFormatted,
        timeRemainingStr: `0 days remaining (${targetAge}th birthday deadline passed on ${deadlineFormatted})`,
        isExpired: true
      };
    }

    let years = deadlineDate.getFullYear() - today.getFullYear();
    let months = deadlineDate.getMonth() - today.getMonth();
    let days = deadlineDate.getDate() - today.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const timeParts: string[] = [];
    if (years > 0) timeParts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) timeParts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    if (days > 0) timeParts.push(`${days} ${days === 1 ? 'day' : 'days'}`);

    const timeStr = timeParts.length === 0
      ? 'less than 1 day'
      : timeParts.length === 1
      ? timeParts[0]
      : timeParts.length === 2
      ? `${timeParts[0]} and ${timeParts[1]}`
      : `${timeParts[0]}, ${timeParts[1]}, and ${timeParts[2]}`;

    return {
      isPursuing: true,
      targetAge,
      targetAward,
      deadlineDateStr: deadlineFormatted,
      birthdayDateStr: birthdayFormatted,
      timeRemainingStr: `${timeStr} remaining (Deadline: ${deadlineFormatted} • ${targetAge}th Birthday)`,
      isExpired: false
    };
  }

  // Fallback: Using approximate age years/months/days if available
  if (typeof ageYears === 'number' && ageYears > 0) {
    const today = new Date();
    const estDeadlineYear = today.getFullYear() + (targetAge - ageYears);
    let remYears = targetAge - 1 - ageYears;
    let remMonths = 11 - (ageMonths || 0);
    let remDays = 30 - (ageDays || 0);

    if (remDays < 0) {
      remMonths -= 1;
      remDays += 30;
    }
    if (remMonths < 0) {
      remYears -= 1;
      remMonths += 12;
    }

    if (remYears < 0) {
      return {
        isPursuing: true,
        targetAge,
        targetAward,
        deadlineDateStr: null,
        birthdayDateStr: null,
        timeRemainingStr: `0 days remaining (${targetAward} age limit reached)`,
        isExpired: true
      };
    }

    const timeParts: string[] = [];
    if (remYears > 0) timeParts.push(`${remYears} ${remYears === 1 ? 'yr' : 'yrs'}`);
    if (remMonths > 0) timeParts.push(`${remMonths} ${remMonths === 1 ? 'mo' : 'mos'}`);
    if (remDays > 0) timeParts.push(`${remDays} ${remDays === 1 ? 'day' : 'days'}`);

    const timeStr = timeParts.length === 0 ? 'less than 1 day' : timeParts.join(', ');
    return {
      isPursuing: true,
      targetAge,
      targetAward,
      deadlineDateStr: `~${estDeadlineYear}`,
      birthdayDateStr: null,
      timeRemainingStr: `${timeStr} remaining until ${targetAge}th birthday deadline (~${estDeadlineYear})`,
      isExpired: false
    };
  }

  return {
    isPursuing: true,
    targetAge,
    targetAward,
    deadlineDateStr: null,
    birthdayDateStr: null,
    timeRemainingStr: isExplorer ? '~15 months remaining until 18th birthday deadline' : '~3 years remaining until 26th birthday deadline',
    isExpired: false
  };
}

export function calculateTimeRemainingForAward(
  dob?: string,
  role?: string,
  ageYears?: number,
  ageMonths?: number,
  ageDays?: number,
  awardGoal?: string
): string {
  const info = getAwardDeadlineInfo(dob, role, ageYears, ageMonths, ageDays, awardGoal);
  return info.timeRemainingStr;
}

/**
 * Helper to get standard progression time requirement from a standing level
 */
export function getProgressionRequirement(level?: string, role?: string): string {
  if (!level || level === 'None') return 'N/A';
  if (role === 'Explorer') {
    switch (level) {
      case 'Square': return '~15 months required';
      case 'Scout Standard': return '~12 months required';
      case 'Advanced Scout Standard': return '~9 months required';
      case 'Bushman\'s Thong': return '~6 months required';
      case 'President Scout Award': return 'President Scout Award Holder';
      default: return '~15 months required';
    }
  } else {
    switch (level) {
      case 'Square': return '~3 years required';
      case 'Scout Standard': return '~2 years & 6 months required';
      case 'Advanced Scout Standard': return '~2 years required';
      case 'Bushman\'s Thong': return '~2 years required';
      case 'President Scout Award Holder': return '~2 years required';
      default: return '~3 years required';
    }
  }
}

