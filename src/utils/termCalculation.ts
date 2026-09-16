/**
 * Term calculation utility for Arabiyya Rovers and Explorers.
 * 
 * Rule:
 * Term stands for Investiture date till today.
 * Calculates elapsed years, months, and days from investiture date to current date.
 */

export function calculateTermFromInvestiture(investitureDate?: string): string {
  if (!investitureDate || typeof investitureDate !== 'string') return 'Not Invested';
  const cleanStr = investitureDate.trim();
  if (
    !cleanStr || 
    cleanStr.toLowerCase() === 'n/a' || 
    cleanStr.toLowerCase() === 'awaiting date' ||
    cleanStr.toLowerCase() === 'none'
  ) {
    return 'Not Invested';
  }

  // Parse YYYY-MM-DD or DD-MM-YYYY or Date string
  const isoMatch = cleanStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  let startYear: number, startMonth: number, startDay: number;

  if (isoMatch) {
    startYear = parseInt(isoMatch[1], 10);
    startMonth = parseInt(isoMatch[2], 10) - 1;
    startDay = parseInt(isoMatch[3], 10);
  } else {
    const dmyMatch = cleanStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      startDay = parseInt(dmyMatch[1], 10);
      startMonth = parseInt(dmyMatch[2], 10) - 1;
      startYear = parseInt(dmyMatch[3], 10);
    } else {
      const d = new Date(cleanStr);
      if (isNaN(d.getTime())) return 'Not Invested';
      startYear = d.getFullYear();
      startMonth = d.getMonth();
      startDay = d.getDate();
    }
  }

  const startDate = new Date(startYear, startMonth, startDay);
  const today = new Date();
  
  // If date is in the future
  if (startDate.getTime() > today.getTime()) {
    return 'Upcoming Investiture';
  }

  let years = today.getFullYear() - startDate.getFullYear();
  let months = today.getMonth() - startDate.getMonth();
  let days = today.getDate() - startDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);

  return parts.join(', ');
}
