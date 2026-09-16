import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDateDDMMMYYYY } from './dateUtils';
import { EventItem, MemberApplication, AttendanceRecord, MeetingMinute } from '../types';
import {
  getMemberCurrentCity,
  isMemberVoluntarilySuspended,
  evaluateEventRequirementForMember
} from './memberHelpers';

// Helper to sanitize filenames
const sanitizeFilename = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
};

/**
 * =========================================================================
 * 1. SINGLE EVENT ATTENDANCE EXPORTS
 * =========================================================================
 */

export interface EventExportData {
  event: EventItem;
  members: MemberApplication[];
  records: AttendanceRecord[];
  meetingMinute?: MeetingMinute;
  generatedBy?: string;
}

/**
 * Generates an editable CSV string for a single event attendance
 */
export const generateEventAttendanceCSV = (data: EventExportData): string => {
  const { event, members, records } = data;
  const rows: string[][] = [];

  // Header Metadata
  rows.push(['Arabiyya Scout Group - Event Attendance Report']);
  rows.push(['Event Name', `"${event.name.replace(/"/g, '""')}"`]);
  rows.push(['Event Type', `"${event.eventType}"`]);
  rows.push(['Location', `"${event.location.replace(/"/g, '""')}"`]);
  rows.push(['Schedule From', `"${event.fromDateTime.replace('T', ' ')}"`]);
  rows.push(['Schedule To', `"${event.toDateTime.replace('T', ' ')}"`]);
  rows.push(['Required Policy', `"${event.requiredCities?.length ? `Location-specific: ${event.requiredCities.join(', ')}` : (event.membersRequired === 'All' ? 'All Active Members' : 'Specific Members')}"`]);
  rows.push(['Report Generated At', `"${new Date().toLocaleString()}"`]);
  rows.push([]); // blank line

  // Column Headers
  rows.push([
    'Member Full Name',
    'Common Name',
    'Member Role',
    'Current City',
    'Voluntary Suspended',
    'Requirement Status',
    'Attendance Status',
    'Excuse Reason / Notes',
    'Excuse Review Status',
    'Last Updated'
  ]);

  // Member Rows
  members.forEach((mem) => {
    const rec = records.find(r => r.eventId === event.id && (r.memberId === mem.id || r.memberName === mem.fullName));
    const evalReq = evaluateEventRequirementForMember(event, mem);
    const city = getMemberCurrentCity(mem);
    const isSusp = isMemberVoluntarilySuspended(mem);

    let finalStatus: string = (rec?.status as string) || (evalReq.isSuspended ? 'Excused' : !evalReq.isRequired ? 'Not Required' : 'Pending');

    rows.push([
      `"${(mem.fullName || '').replace(/"/g, '""')}"`,
      `"${(mem.commonName || '').replace(/"/g, '""')}"`,
      `"${mem.role || ''}"`,
      `"${city.replace(/"/g, '""')}"`,
      isSusp ? 'Yes' : 'No',
      `"${evalReq.statusLabel.replace(/"/g, '""')}"`,
      `"${finalStatus}"`,
      `"${(rec?.excuseReason || '').replace(/"/g, '""')}"`,
      `"${rec?.excuseStatus || 'N/A'}"`,
      `"${rec?.updatedAt ? new Date(rec.updatedAt).toLocaleString() : ''}"`
    ]);
  });

  return rows.map(r => r.join(',')).join('\r\n');
};

/**
 * Downloads a CSV file for a single event
 */
export const downloadEventAttendanceCSV = (data: EventExportData) => {
  const csvContent = '\uFEFF' + generateEventAttendanceCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `attendance_${sanitizeFilename(data.event.name)}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates an Excel workbook (.xlsx) with styled sheets for single event attendance
 */
export const downloadEventAttendanceXLSX = (data: EventExportData) => {
  const { event, members, records, meetingMinute } = data;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Attendance Roster
  const attendanceRows: any[] = [];
  members.forEach(mem => {
    const rec = records.find(r => r.eventId === event.id && (r.memberId === mem.id || r.memberName === mem.fullName));
    const evalReq = evaluateEventRequirementForMember(event, mem);
    const city = getMemberCurrentCity(mem);
    const isSusp = isMemberVoluntarilySuspended(mem);

    let finalStatus: string = (rec?.status as string) || (evalReq.isSuspended ? 'Excused' : !evalReq.isRequired ? 'Not Required' : 'Pending');

    attendanceRows.push({
      'Member ID': mem.id || '',
      'Full Name': mem.fullName || '',
      'Common Name': mem.commonName || '',
      'Section / Role': mem.role || '',
      'Current City': city || 'N/A',
      'Voluntary Suspended': isSusp ? 'Yes' : 'No',
      'Policy Requirement': evalReq.statusLabel,
      'Attendance Status': finalStatus,
      'Excuse Note': rec?.excuseReason || '',
      'Excuse Status': rec?.excuseStatus || '',
      'Last Modified': rec?.updatedAt ? new Date(rec.updatedAt).toLocaleString() : ''
    });
  });

  const wsAttendance = XLSX.utils.json_to_sheet(attendanceRows);
  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Event Attendance');

  // Sheet 2: Event Summary & Metadata
  const attendedCount = attendanceRows.filter(r => r['Attendance Status'] === 'Attended').length;
  const excusedCount = attendanceRows.filter(r => r['Attendance Status'] === 'Excused').length;
  const absentCount = attendanceRows.filter(r => r['Attendance Status'] === 'Unable To Attend' || r['Attendance Status'] === 'Absent').length;
  const notReqCount = attendanceRows.filter(r => r['Attendance Status'] === 'Not Required').length;
  const pendingCount = attendanceRows.filter(r => r['Attendance Status'] === 'Pending').length;

  const summaryData = [
    { Field: 'Event Name', Value: event.name },
    { Field: 'Event Type', Value: event.eventType },
    { Field: 'Location', Value: event.location },
    { Field: 'Schedule Start', Value: event.fromDateTime.replace('T', ' ') },
    { Field: 'Schedule End', Value: event.toDateTime.replace('T', ' ') },
    { Field: 'Required Attendees Scope', Value: event.requiredCities?.length ? `Required for cities: ${event.requiredCities.join(', ')}` : (event.membersRequired === 'All' ? 'All Active Members' : 'Specific Members') },
    { Field: 'Total Members in Roster', Value: members.length },
    { Field: 'Attended Count', Value: attendedCount },
    { Field: 'Excused Count', Value: excusedCount },
    { Field: 'Absent / Unable to Attend', Value: absentCount },
    { Field: 'Location / Rule Exempt', Value: notReqCount },
    { Field: 'Pending Check-in', Value: pendingCount },
    { Field: 'Meeting Minutes Linked', Value: meetingMinute ? `Yes (${meetingMinute.title})` : 'No' },
    { Field: 'Report Generated At', Value: new Date().toLocaleString() }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Event Overview');

  XLSX.writeFile(wb, `attendance_${sanitizeFilename(event.name)}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

/**
 * Generates a full PDF report for a single event with rich formatting, summary badges, and minute highlights
 */
export const downloadEventAttendancePDF = (data: EventExportData) => {
  const { event, members, records, meetingMinute, generatedBy } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Header banner
  doc.setFillColor(15, 23, 42); // Dark blue
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ARABIYYA SCOUT GROUP', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Official Event Attendance & Participation Report', 14, 18);

  doc.setFontSize(7.5);
  doc.text(`Generated: ${new Date().toLocaleString()} ${generatedBy ? `by ${generatedBy}` : ''}`, pageWidth - 14, 18, { align: 'right' });

  y = 32;

  // Event Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(event.name, 18, y + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const policyText = event.requiredCities && event.requiredCities.length > 0
    ? `Location-Specific: ${event.requiredCities.join(', ')} (Optional for other locations)`
    : event.membersRequired === 'All'
    ? 'All Active Members Required (Voluntary suspended auto-excused)'
    : 'Specific Members Assigned';

  doc.text(`Type: ${event.eventType}  |  Location: ${event.location}`, 18, y + 14);
  doc.text(`Schedule: ${event.fromDateTime.replace('T', ' ')} to ${event.toDateTime.replace('T', ' ')}`, 18, y + 20);
  doc.text(`Policy: ${policyText}`, 18, y + 26);

  y += 36;

  // Calculate Metrics
  let attended = 0;
  let excused = 0;
  let absent = 0;
  let notReq = 0;
  let pending = 0;

  const tableBody = members.map((mem, idx) => {
    const rec = records.find(r => r.eventId === event.id && (r.memberId === mem.id || r.memberName === mem.fullName));
    const evalReq = evaluateEventRequirementForMember(event, mem);
    const city = getMemberCurrentCity(mem);
    const isSusp = isMemberVoluntarilySuspended(mem);

    let status: string = (rec?.status as string) || (evalReq.isSuspended ? 'Excused' : !evalReq.isRequired ? 'Not Required' : 'Pending');

    if (status === 'Attended') attended++;
    else if (status === 'Excused') excused++;
    else if (status === 'Unable To Attend' || status === 'Absent') absent++;
    else if (status === 'Not Required') notReq++;
    else pending++;

    const note = rec?.excuseReason ? `"${rec.excuseReason}"` : (isSusp ? 'Voluntary Suspension' : !evalReq.isRequired ? 'Location Exempt' : '-');

    return [
      (idx + 1).toString(),
      mem.fullName + (mem.commonName ? ` (${mem.commonName})` : ''),
      mem.role || 'Member',
      city || '-',
      evalReq.statusLabel,
      status,
      note
    ];
  });

  // KPI Metric Cards
  const kpis = [
    { label: 'ATTENDED', val: attended, color: [16, 185, 129] },
    { label: 'EXCUSED', val: excused, color: [245, 158, 11] },
    { label: 'ABSENT', val: absent, color: [128, 0, 0] },
    { label: 'EXEMPT', val: notReq, color: [100, 116, 139] }
  ];

  const cardWidth = (pageWidth - 28 - 9) / 4;
  kpis.forEach((kpi, i) => {
    const cx = 14 + i * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardWidth, 14, 1.5, 1.5, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cx + 4, y + 5);

    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val.toString(), cx + 4, y + 11.5);
  });

  y += 20;

  // Render Table
  autoTable(doc, {
    startY: y,
    head: [['#', 'Member Name', 'Section', 'City', 'Requirement', 'Status', 'Notes & Excuses']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [128, 0, 0], // Maroon
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 18 },
      3: { cellWidth: 20 },
      4: { cellWidth: 32 },
      5: { cellWidth: 24, fontStyle: 'bold' },
      6: { cellWidth: 'auto' }
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 5) {
        const text = hookData.cell.raw as string;
        if (text === 'Attended') {
          hookData.cell.styles.textColor = [16, 185, 129];
        } else if (text === 'Excused') {
          hookData.cell.styles.textColor = [217, 119, 6];
        } else if (text === 'Unable To Attend' || text === 'Absent') {
          hookData.cell.styles.textColor = [185, 28, 28];
        } else if (text === 'Not Required') {
          hookData.cell.styles.textColor = [100, 116, 139];
        }
      }
    }
  });

  // If meeting minutes exists, add a section at the bottom or new page
  if (meetingMinute) {
    const finalY = (doc as any).lastAutoTable?.finalY || y;
    let minuteY = finalY + 10;

    if (minuteY + 40 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      minuteY = 20;
    }

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, minuteY, pageWidth - 28, 30, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Attached Meeting Minutes: ${meetingMinute.title}`, 18, minuteY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    const discussion = meetingMinute.discussionPoints
      ? (meetingMinute.discussionPoints.length > 200 ? meetingMinute.discussionPoints.slice(0, 200) + '...' : meetingMinute.discussionPoints)
      : 'No detailed discussion points.';
    doc.text(`Discussion Summary: ${discussion}`, 18, minuteY + 12, { maxWidth: pageWidth - 36 });
    doc.text(`Published By: ${meetingMinute.publishedBy || 'Secretary'} on ${meetingMinute.publishedAt ? formatDateDDMMMYYYY(meetingMinute.publishedAt) : 'N/A'}`, 18, minuteY + 26);
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Arabiyya Rover & Explorer Scout Group  •  Official Attendance Log  •  Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
  }

  doc.save(`attendance_report_${sanitizeFilename(event.name)}_${new Date().toISOString().slice(0,10)}.pdf`);
};

/**
 * =========================================================================
 * 2. MASTER SHEET ATTENDANCE EXPORTS (ACROSS ALL EVENTS)
 * =========================================================================
 */

export interface MasterSheetExportData {
  events: EventItem[];
  members: MemberApplication[];
  records: AttendanceRecord[];
  generatedBy?: string;
}

/**
 * Generates an editable CSV Master Grid across all events and members
 */
export const generateMasterSheetCSV = (data: MasterSheetExportData): string => {
  const { events, members, records } = data;
  const rows: string[][] = [];

  // Header metadata
  rows.push(['Arabiyya Scout Group - Attendance Master Sheet']);
  rows.push(['Total Events Tracked', events.length.toString()]);
  rows.push(['Total Members', members.length.toString()]);
  rows.push(['Generated At', `"${new Date().toLocaleString()}"`]);
  rows.push([]);

  // Column Headers: Member Info + each event name + summary metrics
  const headers = [
    'Member Full Name',
    'Common Name',
    'Role / Section',
    'Current City',
    'Voluntary Suspended',
    ...events.map(e => `"${e.name.replace(/"/g, '""')} (${e.eventType})"`),
    'Attended Count',
    'Excused Count',
    'Absent Count',
    'Exempt Count',
    'Total Events Required',
    'Attendance % (With Excused)',
    'Attendance % (Without Excused)'
  ];
  rows.push(headers);

  // Each member row
  members.forEach(mem => {
    let attended = 0;
    let excused = 0;
    let absent = 0;
    let exempt = 0;
    let requiredCount = 0;

    const eventStatuses = events.map(evt => {
      const rec = records.find(r => r.eventId === evt.id && (r.memberId === mem.id || r.memberName === mem.fullName));
      const evalReq = evaluateEventRequirementForMember(evt, mem);
      const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < Date.now() : false;

      let status: string = (rec?.status as string) || '';
      if (!status) {
        if (evalReq.isSuspended) status = 'Excused';
        else if (!evalReq.isRequired) status = 'Not Required';
        else if (isPast) status = 'Absent';
        else status = 'Upcoming';
      }

      if (status === 'Attended') {
        attended++;
        requiredCount++;
      } else if (status === 'Excused') {
        excused++;
        requiredCount++;
      } else if (status === 'Unable To Attend' || status === 'Absent') {
        absent++;
        requiredCount++;
      } else if (status === 'Not Required') {
        exempt++;
      }

      return `"${status}"`;
    });

    const totalConcluded = attended + excused + absent;
    const rateWithExcused = totalConcluded > 0 ? Math.round(((attended + excused) / totalConcluded) * 100) : 100;
    const rateWithoutExcused = (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 100;

    const city = getMemberCurrentCity(mem);
    const isSusp = isMemberVoluntarilySuspended(mem);

    rows.push([
      `"${(mem.fullName || '').replace(/"/g, '""')}"`,
      `"${(mem.commonName || '').replace(/"/g, '""')}"`,
      `"${mem.role || ''}"`,
      `"${city.replace(/"/g, '""')}"`,
      isSusp ? 'Yes' : 'No',
      ...eventStatuses,
      attended.toString(),
      excused.toString(),
      absent.toString(),
      exempt.toString(),
      requiredCount.toString(),
      `${rateWithExcused}%`,
      `${rateWithoutExcused}%`
    ]);
  });

  return rows.map(r => r.join(',')).join('\r\n');
};

/**
 * Downloads Master Sheet CSV
 */
export const downloadMasterSheetCSV = (data: MasterSheetExportData) => {
  const csvContent = '\uFEFF' + generateMasterSheetCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `mastersheet_attendance_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads Master Sheet Excel (.xlsx) with multi-sheet analytics & complete matrix
 */
export const downloadMasterSheetXLSX = (data: MasterSheetExportData) => {
  const { events, members, records } = data;
  const wb = XLSX.utils.book_new();

  // 1. Matrix Sheet (Full Member x Event Matrix)
  const matrixRows: any[] = [];
  members.forEach(mem => {
    let attended = 0;
    let excused = 0;
    let absent = 0;
    let exempt = 0;

    const rowObj: any = {
      'Full Name': mem.fullName || '',
      'Common Name': mem.commonName || '',
      'Role / Section': mem.role || '',
      'Current City': getMemberCurrentCity(mem) || 'N/A',
      'Voluntary Suspended': isMemberVoluntarilySuspended(mem) ? 'Yes' : 'No'
    };

    events.forEach(evt => {
      const rec = records.find(r => r.eventId === evt.id && (r.memberId === mem.id || r.memberName === mem.fullName));
      const evalReq = evaluateEventRequirementForMember(evt, mem);
      const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < Date.now() : false;

      let status: string = (rec?.status as string) || '';
      if (!status) {
        if (evalReq.isSuspended) status = 'Excused';
        else if (!evalReq.isRequired) status = 'Not Required';
        else if (isPast) status = 'Absent';
        else status = 'Upcoming';
      }

      if (status === 'Attended') attended++;
      else if (status === 'Excused') excused++;
      else if (status === 'Unable To Attend' || status === 'Absent') absent++;
      else if (status === 'Not Required') exempt++;

      rowObj[evt.name] = status;
    });

    const totalConcluded = attended + excused + absent;
    rowObj['Attended'] = attended;
    rowObj['Excused'] = excused;
    rowObj['Absent'] = absent;
    rowObj['Location Exempt'] = exempt;
    rowObj['Rate (With Excused %)'] = totalConcluded > 0 ? Math.round(((attended + excused) / totalConcluded) * 100) : 100;
    rowObj['Rate (Without Excused %)'] = (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 100;

    matrixRows.push(rowObj);
  });

  const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Attendance Matrix');

  // 2. Event Summary Sheet
  const eventSummaries: any[] = [];
  events.forEach(evt => {
    let att = 0;
    let exc = 0;
    let abs = 0;
    let exempt = 0;

    members.forEach(mem => {
      const rec = records.find(r => r.eventId === evt.id && (r.memberId === mem.id || r.memberName === mem.fullName));
      const evalReq = evaluateEventRequirementForMember(evt, mem);
      let status: string = (rec?.status as string) || (evalReq.isSuspended ? 'Excused' : !evalReq.isRequired ? 'Not Required' : 'Pending');

      if (status === 'Attended') att++;
      else if (status === 'Excused') exc++;
      else if (status === 'Unable To Attend' || status === 'Absent') abs++;
      else if (status === 'Not Required') exempt++;
    });

    eventSummaries.push({
      'Event Name': evt.name,
      'Event Type': evt.eventType,
      'Location': evt.location,
      'Start Time': evt.fromDateTime.replace('T', ' '),
      'End Time': evt.toDateTime.replace('T', ' '),
      'Policy': evt.requiredCities?.length ? `Required for: ${evt.requiredCities.join(', ')}` : (evt.membersRequired === 'All' ? 'All Active Members' : 'Specific Members'),
      'Attended': att,
      'Excused': exc,
      'Absent': abs,
      'Exempt': exempt,
      'Attendance Rate %': (att + exc + abs) > 0 ? Math.round(((att + exc) / (att + exc + abs)) * 100) : 100
    });
  });

  const wsEvents = XLSX.utils.json_to_sheet(eventSummaries);
  XLSX.utils.book_append_sheet(wb, wsEvents, 'Events Breakdown');

  XLSX.writeFile(wb, `attendance_mastersheet_${new Date().toISOString().slice(0,10)}.xlsx`);
};

/**
 * Downloads Master Sheet PDF report with comprehensive statistics, per-member aggregated rates, and event logs
 */
export const downloadMasterSheetPDF = (data: MasterSheetExportData) => {
  const { events, members, records, generatedBy } = data;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark blue
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ARABIYYA SCOUT GROUP — ATTENDANCE MASTERSHEET', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Comprehensive attendance ledger covering ${events.length} group events and ${members.length} active rover/explorer members`, 14, 18);

  doc.setFontSize(7.5);
  doc.text(`Generated: ${new Date().toLocaleString()} ${generatedBy ? `by ${generatedBy}` : ''}`, pageWidth - 14, 18, { align: 'right' });

  y = 30;

  // Overall Group Statistics
  let totalAttended = 0;
  let totalExcused = 0;
  let totalAbsent = 0;
  let totalExempt = 0;

  members.forEach(mem => {
    events.forEach(evt => {
      const rec = records.find(r => r.eventId === evt.id && (r.memberId === mem.id || r.memberName === mem.fullName));
      const evalReq = evaluateEventRequirementForMember(evt, mem);
      let status: string = (rec?.status as string) || (evalReq.isSuspended ? 'Excused' : !evalReq.isRequired ? 'Not Required' : 'Pending');

      if (status === 'Attended') totalAttended++;
      else if (status === 'Excused') totalExcused++;
      else if (status === 'Unable To Attend' || status === 'Absent') totalAbsent++;
      else if (status === 'Not Required') totalExempt++;
    });
  });

  const totalMandatoryEntries = totalAttended + totalExcused + totalAbsent;
  const overallRate = totalMandatoryEntries > 0 ? Math.round(((totalAttended + totalExcused) / totalMandatoryEntries) * 100) : 100;

  // Summary Metrics Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 16, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Executive Summary:  Total Events: ${events.length}   |   Active Members: ${members.length}   |   Overall Attendance Compliance: ${overallRate}%`, 18, y + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Check-ins: ${totalAttended}   •   Total Excuses Approved: ${totalExcused}   •   Unexcused Absences: ${totalAbsent}   •   Location Exempt: ${totalExempt}`, 18, y + 11.5);

  y += 22;

  // Member Performance Table
  const tableData = members.map((mem, idx) => {
    let attended = 0;
    let excused = 0;
    let absent = 0;
    let exempt = 0;

    events.forEach(evt => {
      const rec = records.find(r => r.eventId === evt.id && (r.memberId === mem.id || r.memberName === mem.fullName));
      const evalReq = evaluateEventRequirementForMember(evt, mem);
      const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < Date.now() : false;

      let status: string = (rec?.status as string) || '';
      if (!status) {
        if (evalReq.isSuspended) status = 'Excused';
        else if (!evalReq.isRequired) status = 'Not Required';
        else if (isPast) status = 'Absent';
        else status = 'Upcoming';
      }

      if (status === 'Attended') attended++;
      else if (status === 'Excused') excused++;
      else if (status === 'Unable To Attend' || status === 'Absent') absent++;
      else if (status === 'Not Required') exempt++;
    });

    const totalConcluded = attended + excused + absent;
    const rateWithExcused = totalConcluded > 0 ? Math.round(((attended + excused) / totalConcluded) * 100) : 100;
    const rateWithoutExcused = (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 100;

    const city = getMemberCurrentCity(mem);
    const isSusp = isMemberVoluntarilySuspended(mem);

    return [
      (idx + 1).toString(),
      mem.fullName + (mem.commonName ? ` (${mem.commonName})` : ''),
      mem.role || 'Member',
      city || '-',
      isSusp ? 'Suspended' : 'Active',
      attended.toString(),
      excused.toString(),
      absent.toString(),
      exempt.toString(),
      `${rateWithExcused}%`,
      `${rateWithoutExcused}%`
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Member Name', 'Section', 'City', 'Status', 'Attended', 'Excused', 'Absent', 'Exempt', 'Rate (w/ Excused)', 'Rate (w/o Excused)']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [128, 0, 0], // Maroon
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 24 },
      4: { cellWidth: 20 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      10: { cellWidth: 28, halign: 'center' }
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        if (hookData.column.index === 9) {
          const val = parseInt(hookData.cell.raw as string, 10);
          if (val >= 80) hookData.cell.styles.textColor = [16, 185, 129];
          else if (val >= 60) hookData.cell.styles.textColor = [217, 119, 6];
          else hookData.cell.styles.textColor = [185, 28, 28];
        }
      }
    }
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Arabiyya Rover & Explorer Scout Group  •  Attendance Mastersheet Ledger  •  Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
  }

  doc.save(`attendance_mastersheet_${new Date().toISOString().slice(0,10)}.pdf`);
};

/**
 * =========================================================================
 * 3. INDIVIDUAL MEMBER ATTENDANCE EXPORTS (PDF, XLSX, CSV)
 * =========================================================================
 */

export interface MemberExportData {
  member: MemberApplication;
  events: EventItem[];
  records: AttendanceRecord[];
  generatedBy?: string;
}

/**
 * Generates an editable CSV for an individual member across all events
 */
export const generateMemberAttendanceCSV = (data: MemberExportData): string => {
  const { member, events, records } = data;
  const rows: string[][] = [];

  const city = getMemberCurrentCity(member);
  const isSusp = isMemberVoluntarilySuspended(member);

  // Header metadata
  rows.push(['Arabiyya Scout Group - Member Attendance Record']);
  rows.push(['Member Full Name', `"${(member.fullName || '').replace(/"/g, '""')}"`]);
  rows.push(['Common Name', `"${(member.commonName || '').replace(/"/g, '""')}"`]);
  rows.push(['Section / Role', `"${member.role || 'Member'}"`]);
  rows.push(['Current City / Region', `"${city.replace(/"/g, '""')}"`]);
  rows.push(['Voluntary Suspended', isSusp ? 'Yes' : 'No']);
  rows.push(['Total Events Recorded', events.length.toString()]);
  rows.push(['Generated At', `"${new Date().toLocaleString()}"`]);
  rows.push([]);

  // Table Columns
  rows.push([
    '#',
    'Event Name',
    'Event Type',
    'Location',
    'Schedule Start',
    'Schedule End',
    'Policy Requirement',
    'Attendance Status',
    'Excuse Reason / Notes',
    'Excuse Review Status',
    'Last Updated'
  ]);

  let attended = 0;
  let excused = 0;
  let absent = 0;
  let exempt = 0;

  events.forEach((evt, idx) => {
    const rec = records.find(r => r.eventId === evt.id && (r.memberId === member.id || r.memberName === member.fullName));
    const evalReq = evaluateEventRequirementForMember(evt, member);
    const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < Date.now() : false;

    let status: string = (rec?.status as string) || '';
    if (!status) {
      if (evalReq.isSuspended) status = 'Excused';
      else if (!evalReq.isRequired) status = 'Not Required';
      else if (isPast) status = 'Absent';
      else status = 'Upcoming';
    }

    if (status === 'Attended') attended++;
    else if (status === 'Excused') excused++;
    else if (status === 'Unable To Attend' || status === 'Absent') absent++;
    else if (status === 'Not Required') exempt++;

    rows.push([
      (idx + 1).toString(),
      `"${evt.name.replace(/"/g, '""')}"`,
      `"${evt.eventType}"`,
      `"${evt.location.replace(/"/g, '""')}"`,
      `"${evt.fromDateTime.replace('T', ' ')}"`,
      `"${evt.toDateTime.replace('T', ' ')}"`,
      `"${evalReq.statusLabel.replace(/"/g, '""')}"`,
      `"${status}"`,
      `"${(rec?.excuseReason || (isSusp ? 'Voluntary Suspension' : !evalReq.isRequired ? 'Location Exempt' : '')).replace(/"/g, '""')}"`,
      `"${rec?.excuseStatus || (rec?.excuseReason ? 'Pending' : 'N/A')}"`,
      `"${rec?.updatedAt ? new Date(rec.updatedAt).toLocaleString() : ''}"`
    ]);
  });

  const totalConcluded = attended + excused + absent;
  const rateWithExcused = totalConcluded > 0 ? Math.round(((attended + excused) / totalConcluded) * 100) : 100;
  const rateWithoutExcused = (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 100;

  rows.push([]);
  rows.push(['Attendance Statistics Summary']);
  rows.push(['Attended Events', attended.toString()]);
  rows.push(['Excused Absences', excused.toString()]);
  rows.push(['Unexcused Absences', absent.toString()]);
  rows.push(['Location / Rule Exempt', exempt.toString()]);
  rows.push(['Attendance Rate (With Excused)', `${rateWithExcused}%`]);
  rows.push(['Attendance Rate (Without Excused)', `${rateWithoutExcused}%`]);

  return rows.map(r => r.join(',')).join('\r\n');
};

/**
 * Downloads Member Attendance CSV
 */
export const downloadMemberAttendanceCSV = (data: MemberExportData) => {
  const csvContent = '\uFEFF' + generateMemberAttendanceCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `attendance_member_${sanitizeFilename(data.member.fullName || 'member')}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads Member Attendance Excel (.xlsx) with dedicated Event History and Summary tabs
 */
export const downloadMemberAttendanceXLSX = (data: MemberExportData) => {
  const { member, events, records } = data;
  const wb = XLSX.utils.book_new();

  const city = getMemberCurrentCity(member);
  const isSusp = isMemberVoluntarilySuspended(member);

  let attended = 0;
  let excused = 0;
  let absent = 0;
  let exempt = 0;

  // Sheet 1: Event Log
  const eventRows: any[] = [];
  events.forEach(evt => {
    const rec = records.find(r => r.eventId === evt.id && (r.memberId === member.id || r.memberName === member.fullName));
    const evalReq = evaluateEventRequirementForMember(evt, member);
    const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < Date.now() : false;

    let status: string = (rec?.status as string) || '';
    if (!status) {
      if (evalReq.isSuspended) status = 'Excused';
      else if (!evalReq.isRequired) status = 'Not Required';
      else if (isPast) status = 'Absent';
      else status = 'Upcoming';
    }

    if (status === 'Attended') attended++;
    else if (status === 'Excused') excused++;
    else if (status === 'Unable To Attend' || status === 'Absent') absent++;
    else if (status === 'Not Required') exempt++;

    eventRows.push({
      'Event Name': evt.name,
      'Event Type': evt.eventType,
      'Location': evt.location,
      'Start Date & Time': evt.fromDateTime.replace('T', ' '),
      'End Date & Time': evt.toDateTime.replace('T', ' '),
      'Policy Requirement': evalReq.statusLabel,
      'Attendance Status': status,
      'Excuse Note / Reason': rec?.excuseReason || (isSusp ? 'Voluntary Suspension' : !evalReq.isRequired ? 'Location Exempt' : ''),
      'Excuse Status': rec?.excuseStatus || (rec?.excuseReason ? 'Pending' : 'N/A'),
      'Last Modified': rec?.updatedAt ? new Date(rec.updatedAt).toLocaleString() : ''
    });
  });

  const wsEvents = XLSX.utils.json_to_sheet(eventRows);
  XLSX.utils.book_append_sheet(wb, wsEvents, 'Events Log');

  // Sheet 2: Member Overview & Compliance Summary
  const totalConcluded = attended + excused + absent;
  const rateWithExcused = totalConcluded > 0 ? Math.round(((attended + excused) / totalConcluded) * 100) : 100;
  const rateWithoutExcused = (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 100;

  const summaryData = [
    { Field: 'Member Full Name', Value: member.fullName || '' },
    { Field: 'Common Name', Value: member.commonName || '' },
    { Field: 'Section / Role', Value: member.role || 'Member' },
    { Field: 'Current City', Value: city || 'N/A' },
    { Field: 'Voluntary Suspension Active', Value: isSusp ? 'Yes' : 'No' },
    { Field: 'Total Events In System', Value: events.length },
    { Field: 'Attended Events', Value: attended },
    { Field: 'Excused Absences', Value: excused },
    { Field: 'Unexcused Absences', Value: absent },
    { Field: 'Location Exempt Events', Value: exempt },
    { Field: 'Attendance Rate (With Excused)', Value: `${rateWithExcused}%` },
    { Field: 'Attendance Rate (Without Excused)', Value: `${rateWithoutExcused}%` },
    { Field: 'Report Generated At', Value: new Date().toLocaleString() }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Member Summary');

  XLSX.writeFile(wb, `attendance_member_${sanitizeFilename(member.fullName || 'member')}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

/**
 * Downloads Member Attendance PDF Report with KPI cards, compliance badges, and full event history
 */
export const downloadMemberAttendancePDF = (data: MemberExportData) => {
  const { member, events, records, generatedBy } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark blue
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ARABIYYA SCOUT GROUP', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Individual Member Attendance & Participation Record', 14, 18);

  doc.setFontSize(7.5);
  doc.text(`Generated: ${new Date().toLocaleString()} ${generatedBy ? `by ${generatedBy}` : ''}`, pageWidth - 14, 18, { align: 'right' });

  y = 32;

  const city = getMemberCurrentCity(member);
  const isSusp = isMemberVoluntarilySuspended(member);

  // Member Profile Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(member.fullName + (member.commonName ? ` (${member.commonName})` : ''), 18, y + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Role / Section: ${member.role || 'Member'}   |   Current City: ${city || 'N/A'}`, 18, y + 14);
  doc.text(`Status: ${isSusp ? 'Voluntarily Suspended' : 'Active Duty'}   |   Total Events Tracked: ${events.length}`, 18, y + 20);

  y += 32;

  // Calculate Member Totals
  let attended = 0;
  let excused = 0;
  let absent = 0;
  let exempt = 0;

  const tableBody = events.map((evt, idx) => {
    const rec = records.find(r => r.eventId === evt.id && (r.memberId === member.id || r.memberName === member.fullName));
    const evalReq = evaluateEventRequirementForMember(evt, member);
    const isPast = evt.toDateTime ? new Date(evt.toDateTime).getTime() < Date.now() : false;

    let status: string = (rec?.status as string) || '';
    if (!status) {
      if (evalReq.isSuspended) status = 'Excused';
      else if (!evalReq.isRequired) status = 'Not Required';
      else if (isPast) status = 'Absent';
      else status = 'Upcoming';
    }

    if (status === 'Attended') attended++;
    else if (status === 'Excused') excused++;
    else if (status === 'Unable To Attend' || status === 'Absent') absent++;
    else if (status === 'Not Required') exempt++;

    const note = rec?.excuseReason
      ? `"${rec.excuseReason}"`
      : (isSusp ? 'Voluntary Suspension' : !evalReq.isRequired ? 'Location Exempt' : '-');

    return [
      (idx + 1).toString(),
      evt.name,
      evt.eventType,
      evt.fromDateTime.replace('T', ' ').slice(0, 16),
      evalReq.statusLabel,
      status,
      note
    ];
  });

  const totalConcluded = attended + excused + absent;
  const rateWithExcused = totalConcluded > 0 ? Math.round(((attended + excused) / totalConcluded) * 100) : 100;
  const rateWithoutExcused = (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 100;

  // Metric Cards
  const kpis = [
    { label: 'ATTENDED', val: attended, color: [16, 185, 129] },
    { label: 'EXCUSED', val: excused, color: [245, 158, 11] },
    { label: 'ABSENT', val: absent, color: [128, 0, 0] },
    { label: 'RATE (w/ EXCUSED)', val: `${rateWithExcused}%`, color: rateWithExcused >= 80 ? [16, 185, 129] : [185, 28, 28] }
  ];

  const cardWidth = (pageWidth - 28 - 9) / 4;
  kpis.forEach((kpi, i) => {
    const cx = 14 + i * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardWidth, 14, 1.5, 1.5, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cx + 4, y + 5);

    doc.setFontSize(10.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val.toString(), cx + 4, y + 11.5);
  });

  y += 20;

  // Render Event Table
  autoTable(doc, {
    startY: y,
    head: [['#', 'Event Name', 'Type', 'Schedule', 'Requirement', 'Status', 'Notes & Excuses']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [128, 0, 0], // Maroon
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 44, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 26 },
      4: { cellWidth: 30 },
      5: { cellWidth: 22, fontStyle: 'bold' },
      6: { cellWidth: 'auto' }
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 5) {
        const text = hookData.cell.raw as string;
        if (text === 'Attended') {
          hookData.cell.styles.textColor = [16, 185, 129];
        } else if (text === 'Excused') {
          hookData.cell.styles.textColor = [217, 119, 6];
        } else if (text === 'Unable To Attend' || text === 'Absent') {
          hookData.cell.styles.textColor = [185, 28, 28];
        } else if (text === 'Not Required') {
          hookData.cell.styles.textColor = [100, 116, 139];
        }
      }
    }
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Arabiyya Rover & Explorer Scout Group  •  Member Attendance Record (${member.fullName})  •  Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
  }

  doc.save(`attendance_member_${sanitizeFilename(member.fullName || 'member')}_${new Date().toISOString().slice(0,10)}.pdf`);
};
