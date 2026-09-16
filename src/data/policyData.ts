export interface PolicyItem {
  id: string;
  number: string; // e.g. "1", "1.1", "1.1.1", "2", "2.1"
  title: string;
  content: string;
  category?: string;
  updatedAt?: string;
}

export interface PolicySection {
  id: string;
  title: string;
  icon: string;
  content: string[];
}

export const INITIAL_ROVER_POLICY: PolicyItem[] = [
  // 1. Introduction
  {
    id: 'pol-1',
    number: '1',
    title: 'Introduction',
    content: 'General policy introduction and operational scope of the Arabiyya Rover Crew.'
  },
  {
    id: 'pol-1-1',
    number: '1.1',
    title: 'Effective Date & Approval',
    content: 'This policy is the general policy of the Arabiyya Rover Crew, effective from December 18, 2023, and approved on December 18, 2023.'
  },
  {
    id: 'pol-1-2',
    number: '1.2',
    title: 'Operational Scope & Applicability',
    content: 'This policy includes the general rules and regulations for the operations of the Arabiyya Rover Crew, and applies to all members of the crew.'
  },

  // 2. Definitions
  {
    id: 'pol-2',
    number: '2',
    title: 'Definitions',
    content: 'Key administrative and structural definitions governing crew interpretation.'
  },
  {
    id: 'pol-2-1',
    number: '2.1',
    title: 'Rover Crew Definition',
    content: '"Rover Crew" means the Rover Crew established under the Arabiyya School Scout Group, starting from December 18, 2023.'
  },
  {
    id: 'pol-2-2',
    number: '2.2',
    title: 'Group Definition',
    content: '"Group" refers to the Arabiyya School Scout Group under which the Rover Crew is organized and administered.'
  },

  // 3. Purpose
  {
    id: 'pol-3',
    number: '3',
    title: 'Purpose',
    content: 'Core mission and developmental objectives of the Arabiyya Rover Crew.'
  },
  {
    id: 'pol-3-1',
    number: '3.1',
    title: 'Crew Mission',
    content: 'The purpose of the Crew is to develop young adults into responsible, disciplined, and capable citizens through scouting principles.'
  },

  // 4. Uniform
  {
    id: 'pol-4',
    number: '4',
    title: 'Uniform',
    content: 'Official attire standards and uniform requirements for Arabiyya Rover members.'
  },
  {
    id: 'pol-4-1',
    number: '4.1',
    title: 'Rover Uniform',
    content: 'Rover uniform.'
  },
  {
    id: 'pol-4-2',
    number: '4.2',
    title: 'Rover Scarf',
    content: 'Rover scarf.'
  },
  {
    id: 'pol-4-3',
    number: '4.3',
    title: 'Rover Woggle',
    content: 'Rover woggle.'
  },
  {
    id: 'pol-4-4',
    number: '4.4',
    title: 'Official Rover Badge',
    content: 'Official Rover badge.'
  },
  {
    id: 'pol-4-5',
    number: '4.5',
    title: 'Rover Epaulettes',
    content: 'Rover epaulettes.'
  },
  {
    id: 'pol-4-6',
    number: '4.6',
    title: 'Official Belt',
    content: 'Official belt.'
  },
  {
    id: 'pol-4-7',
    number: '4.7',
    title: 'Footwear',
    content: 'Black shoes matching the uniform.'
  },
  {
    id: 'pol-4-8',
    number: '4.8',
    title: 'Socks',
    content: 'Black socks.'
  },
  {
    id: 'pol-4-9',
    number: '4.9',
    title: 'Headwear',
    content: 'Cap (when specified).'
  },
  {
    id: 'pol-4-10',
    number: '4.10',
    title: 'Uniform Presentation',
    content: 'The uniform must be neat, clean, and worn properly at all official events.'
  },

  // 5. Rank / Membership
  {
    id: 'pol-5',
    number: '5',
    title: 'Rank / Membership',
    content: 'Designation of crew members and tenure advancement criteria.'
  },
  {
    id: 'pol-5-1',
    number: '5.1',
    title: 'Designation',
    content: 'Rover members are known as "Rovers".'
  },
  {
    id: 'pol-5-2',
    number: '5.2',
    title: 'Senior Advancement',
    content: 'Upon completing 1 (one) year as a Rover, they may advance to senior ranks subject to evaluation.'
  },

  // 6. Management and Administration
  {
    id: 'pol-6',
    number: '6',
    title: 'Management and Administration',
    content: 'Governance structure, committee composition, and election terms.'
  },
  {
    id: 'pol-6-1',
    number: '6.1',
    title: 'Executive Committee Composition',
    content: 'The Executive Committee shall consist of 11 members (including the Rover Leader).'
  },
  {
    id: 'pol-6-2',
    number: '6.2',
    title: 'Committee Term & Elections',
    content: 'Upon completing 1 (one) year as an 11-member committee, the term ends, and a new "Arabiyya Rover Crew" committee shall be elected.'
  },

  // 7. Symbols and Identity
  {
    id: 'pol-7',
    number: '7',
    title: 'Symbols and Identity',
    content: 'Official visual assets, crest, and insignia representing the crew.'
  },
  {
    id: 'pol-7-1',
    number: '7.1',
    title: 'Official Logo',
    content: 'The official logo of the Rover Crew.'
  },
  {
    id: 'pol-7-2',
    number: '7.2',
    title: 'Official Crest',
    content: 'The official crest of the Rover Crew.'
  },

  // 8. Flags
  {
    id: 'pol-8',
    number: '8',
    title: 'Flags',
    content: 'Standard and variant ceremonial flags of the Arabiyya Rover Crew.'
  },
  {
    id: 'pol-8-1',
    number: '8.1',
    title: 'Primary Flag',
    content: 'The official flag of the Rover Crew.'
  },
  {
    id: 'pol-8-2',
    number: '8.2',
    title: 'Alternative Flag Variant',
    content: 'Alternative official flag variant.'
  },

  // 9. Membership and Registration
  {
    id: 'pol-9',
    number: '9',
    title: 'Membership and Registration',
    content: 'Eligibility criteria, admission protocols, fees, and member responsibilities.'
  },
  {
    id: 'pol-9-1',
    number: '9.1',
    title: 'Open Eligibility',
    content: 'Membership is open to young adults meeting the age criteria.'
  },
  {
    id: 'pol-9-2',
    number: '9.2',
    title: 'Official Registration',
    content: 'Members must register officially with the Arabiyya School Scout Group starting from December 18, 2023.'
  },
  {
    id: 'pol-9-3',
    number: '9.3',
    title: 'Minimum Age',
    content: 'Minimum age for entry is 18 years.'
  },
  {
    id: 'pol-9-4',
    number: '9.4',
    title: 'Maximum Age',
    content: 'Maximum age for active Rover membership is 26 years.'
  },
  {
    id: 'pol-9-5',
    number: '9.5',
    title: 'Basic Training Prerequisite',
    content: 'Members must complete required basic training to be eligible for full status.'
  },
  {
    id: 'pol-9-6',
    number: '9.6',
    title: 'Membership Dues',
    content: 'Membership fees shall be paid annually or as specified by the committee.'
  },
  {
    id: 'pol-9-7',
    number: '9.7',
    title: 'Active Participation',
    content: 'Members must actively participate in scheduled crew activities.'
  },
  {
    id: 'pol-9-8',
    number: '9.8',
    title: 'Scout Promise & Law',
    content: 'Members must uphold the scout law and promise at all times.'
  },

  // 10. Meetings
  {
    id: 'pol-10',
    number: '10',
    title: 'Meetings',
    content: 'Assembly frequencies and scheduling of regular crew sessions.'
  },
  {
    id: 'pol-10-1',
    number: '10.1',
    title: 'Meeting Schedule',
    content: 'Regular meetings shall be held weekly or bi-weekly as scheduled by the executive committee.'
  },

  // 11. Training
  {
    id: 'pol-11',
    number: '11',
    title: 'Training',
    content: 'Training curriculum, qualification steps, and certification standards.'
  },
  {
    id: 'pol-11-1',
    number: '11.1',
    title: 'Mandatory Training',
    content: 'Training is mandatory for all active members.'
  },
  {
    id: 'pol-11-2',
    number: '11.2',
    title: 'Foundational Training Requirement',
    content: '1 (one) year of foundational training is required before undertaking higher leadership roles.'
  },
  {
    id: 'pol-11-3',
    number: '11.3',
    title: 'Advanced Modules',
    content: 'Advanced training modules must be completed successfully to earn official certification.'
  },
  {
    id: 'pol-11-4',
    number: '11.4',
    title: 'Certification Issuance',
    content: 'Training certificates will be issued upon successful completion.'
  },

  // 12. Code of Conduct & Discipline
  {
    id: 'pol-12',
    number: '12',
    title: 'Code of Conduct & Discipline',
    content: 'Disciplinary standards, mutual respect, and consequence management.'
  },
  {
    id: 'pol-12-1',
    number: '12.1',
    title: 'Standards of Discipline',
    content: 'Members must maintain high standards of discipline, respecting leaders and fellow scouts.'
  },
  {
    id: 'pol-12-2',
    number: '12.2',
    title: 'Disciplinary Review',
    content: 'Any breach of the scout code or misconduct will result in disciplinary review.'
  },
  {
    id: 'pol-12-3',
    number: '12.3',
    title: 'Suspension & Expulsion',
    content: 'Severe violations may lead to suspension or expulsion from the crew.'
  },

  // 13. Activities and Events
  {
    id: 'pol-13',
    number: '13',
    title: 'Activities and Events',
    content: 'Planning, safety protocols, reporting, and event participation guidelines.'
  },
  {
    id: 'pol-13-1',
    number: '13.1',
    title: 'Crew Projects & Camps',
    content: 'The crew shall organize community service projects, camps, and leadership training programs.'
  },
  {
    id: 'pol-13-2',
    number: '13.2',
    title: 'National Scout Events',
    content: 'Participation in national scout events is strongly encouraged.'
  },
  {
    id: 'pol-13-3',
    number: '13.3',
    title: 'Outdoor Safety Protocols',
    content: 'Safety protocols must be strictly followed during outdoor expeditions.'
  },
  {
    id: 'pol-13-4',
    number: '13.4',
    title: 'Event Approvals',
    content: 'Approval from the Rover Leader is required prior to organizing any external event.'
  },
  {
    id: 'pol-13-5',
    number: '13.5',
    title: 'Financial Transparency',
    content: 'Financial transparency is mandatory for all events and fundraising activities.'
  },
  {
    id: 'pol-13-6',
    number: '13.6',
    title: 'Expedition Reports',
    content: 'Crew members must submit reports following any major event or expedition.'
  },
  {
    id: 'pol-13-7',
    number: '13.7',
    title: 'Compulsory Attendance',
    content: 'Attendance is compulsory for mandatory crew events unless prior written notice is given.'
  },
  {
    id: 'pol-13-8',
    number: '13.8',
    title: 'External Representation',
    content: 'Members representing the school or crew externally must project a professional image.'
  },
  {
    id: 'pol-13-9',
    number: '13.9',
    title: 'Environmental Conservation',
    content: 'Environmental conservation should be prioritized during outdoor camps.'
  },
  {
    id: 'pol-13-10',
    number: '13.10',
    title: 'Inter-Group Collaboration',
    content: 'Collaboration with other scout groups is welcomed to foster unity.'
  },
  {
    id: 'pol-13-11',
    number: '13.11',
    title: 'Emergency Protocols',
    content: 'Emergency contact protocols must be established for all field trips.'
  },

  // 14. Financial Management
  {
    id: 'pol-14',
    number: '14',
    title: 'Financial Management',
    content: 'Accounting, banking, approvals, audits, and statutory record retention.'
  },
  {
    id: 'pol-14-1',
    number: '14.1',
    title: 'Treasurer Supervision',
    content: 'The treasurer shall manage all crew accounts under the supervision of the Rover Leader.'
  },
  {
    id: 'pol-14-2',
    number: '14.2',
    title: 'Financial Reporting',
    content: 'Regular financial reports must be submitted to the executive committee.'
  },
  {
    id: 'pol-14-3',
    number: '14.3',
    title: 'Bank Deposits',
    content: 'Funds collected must be deposited directly into the official scout bank account.'
  },
  {
    id: 'pol-14-4',
    number: '14.4',
    title: 'Expenditure Proposals',
    content: 'Any major expenditure requires a formal proposal approved by the committee.'
  },
  {
    id: 'pol-14-5',
    number: '14.5',
    title: 'Annual Audits',
    content: 'Annual audits of the crew\'s funds shall be conducted.'
  },
  {
    id: 'pol-14-6',
    number: '14.6',
    title: 'Record Retention',
    content: 'Financial records must be retained for at least 6 (six) years for verification.'
  },

  // 15. Awards and Recognition
  {
    id: 'pol-15',
    number: '15',
    title: 'Awards and Recognition',
    content: 'Merit badges, milestone awards, long-service honors, and recognition criteria.'
  },
  {
    id: 'pol-15-1',
    number: '15.1',
    title: 'Service Awards',
    content: 'Outstanding service may be recognized through specialized awards and badges.'
  },
  {
    id: 'pol-15-2',
    number: '15.2',
    title: 'One-Year Merit Eligibility',
    content: '1 (one) year of dedicated service qualifies members for preliminary merit badges.'
  },
  {
    id: 'pol-15-3',
    number: '15.3',
    title: 'Special Leadership Honors',
    content: 'Special awards are granted for exceptional leadership and community contributions.'
  },
  {
    id: 'pol-15-4',
    number: '15.4',
    title: 'Handbook Criteria',
    content: 'Criteria for each award are detailed in the training handbook.'
  },
  {
    id: 'pol-15-5',
    number: '15.5',
    title: 'Annual Evaluations',
    content: 'Annual evaluations determine nominees for special recognition.'
  },
  {
    id: 'pol-15-6',
    number: '15.6',
    title: 'National Award Endorsements',
    content: 'Recommendations for national-level scout awards must be endorsed by the group leadership.'
  },
  {
    id: 'pol-15-7',
    number: '15.7',
    title: 'Presentation Ceremonies',
    content: 'Awards are presented during official annual ceremonies.'
  },
  {
    id: 'pol-15-8',
    number: '15.8',
    title: 'Milestone Merit Pins',
    content: 'Merit pins are awarded upon completion of specific milestone targets.'
  },
  {
    id: 'pol-15-9',
    number: '15.9',
    title: 'Motivation & Excellence',
    content: 'Recognition systems aim to motivate members to excel further.'
  },
  {
    id: 'pol-15-10',
    number: '15.10',
    title: 'Forfeiture for Misconduct',
    content: 'Misconduct can result in the forfeiture of previously awarded honors.'
  },
  {
    id: 'pol-15-11',
    number: '15.11',
    title: 'Long-Service Medals',
    content: 'Long-service medals are awarded at 3-year intervals of active participation.'
  },
  {
    id: 'pol-15-12',
    number: '15.12',
    title: 'Bravery Commendations',
    content: 'Exceptional bravery merits special commendation.'
  },
  {
    id: 'pol-15-13',
    number: '15.13',
    title: 'Appreciation Certificates',
    content: 'Certificates of appreciation are given to supporting partners and external contributors.'
  },
  {
    id: 'pol-15-14',
    number: '15.14',
    title: 'Registry Archiving',
    content: 'All award records must be maintained in the crew registry.'
  },
  {
    id: 'pol-15-15',
    number: '15.15',
    title: 'Inspiration of Newer Scouts',
    content: 'Crew members achieving milestones inspire newer generations of scouts.'
  },
  {
    id: 'pol-15-16',
    number: '15.16',
    title: 'Portfolio Review Process',
    content: 'Evaluation committees review candidate portfolios thoroughly before finalizing awards.'
  },

  // 16. Amendments and Policy Changes
  {
    id: 'pol-16',
    number: '16',
    title: 'Amendments and Policy Changes',
    content: 'Legislative procedures, notice requirements, and emergency amendment protocols.'
  },
  {
    id: 'pol-16-1',
    number: '16.1',
    title: 'Majority Amendment Vote',
    content: 'This policy may be amended by a majority vote of the executive committee.'
  },
  {
    id: 'pol-16-2',
    number: '16.2',
    title: 'Written Notice Period',
    content: 'Proposed amendments must be submitted in writing 3 (three) days prior to the committee meeting.'
  },
  {
    id: 'pol-16-3',
    number: '16.3',
    title: 'Emergency Amendments',
    content: 'Emergency amendments can be introduced under exceptional circumstances with the leader\'s consent.'
  },
  {
    id: 'pol-16-4',
    number: '16.4',
    title: 'Immediate Effect',
    content: 'Approved amendments take effect immediately upon formal publication.'
  },

  // 17. Duties of Committee Members
  {
    id: 'pol-17',
    number: '17',
    title: 'Duties of Committee Members',
    content: 'Roles and operational portfolios of Executive Committee officers.'
  },
  {
    id: 'pol-17-1',
    number: '17.1',
    title: 'Rover Leader Duties',
    content: 'Document 1 (one): Oversees overall crew operations.\nDocument 2: Coordinates training programs.\nDocument 3: Maintains member records.\nDocument 4: Manages financial accounts.'
  },
  {
    id: 'pol-17-2',
    number: '17.2',
    title: 'Assistant Rover Leader Duties',
    content: 'Document 1: Assists the leader in administration.\nDocument 2: Manages logistics for events.\nDocument 3: Oversees discipline.\nDocument 4: Acts as leader in their absence.'
  },
  {
    id: 'pol-17-3',
    number: '17.3',
    title: 'Secretary Duties',
    content: 'Document 1: Records minutes of meetings.\nDocument 2: Handles official correspondence.'
  },
  {
    id: 'pol-17-4',
    number: '17.4',
    title: 'Treasurer Duties',
    content: 'Document 1: Manages funds and bookkeeping.\nDocument 2: Prepares financial statements.'
  },
  {
    id: 'pol-17-5',
    number: '17.5',
    title: 'Quartermaster Duties',
    content: 'Document 1: Manages and maintains equipment.\nDocument 2: Oversees inventory during events.'
  },

  // 18. Operational Guidelines
  {
    id: 'pol-18',
    number: '18',
    title: 'Operational Guidelines',
    content: 'Standard operating procedures across daily and field operations.'
  },
  {
    id: 'pol-18-1',
    number: '18.1',
    title: 'General Operations',
    content: 'General Operations'
  },
  {
    id: 'pol-18-2',
    number: '18.2',
    title: 'Event Management',
    content: 'Event Management'
  },
  {
    id: 'pol-18-3',
    number: '18.3',
    title: 'Safety Protocols & Evacuation',
    content: 'Safety protocols, including first aid kits and emergency evacuation plans.'
  },
  {
    id: 'pol-18-4',
    number: '18.4',
    title: 'Property and Equipment',
    content: 'Property and Equipment'
  },
  {
    id: 'pol-18-5',
    number: '18.5',
    title: 'Communication and Public Relations',
    content: 'Communication and Public Relations'
  },
  {
    id: 'pol-18-6',
    number: '18.6',
    title: 'Dispute Resolution',
    content: 'Dispute resolution mechanisms'
  },

  // 19. Miscellaneous
  {
    id: 'pol-19',
    number: '19',
    title: 'Miscellaneous',
    content: 'Unforeseen scenarios, zero-tolerance policies, and identification cards.'
  },
  {
    id: 'pol-19-1',
    number: '19.1',
    title: 'Unforeseen Matters',
    content: 'Any unforeseen matters shall be resolved by the executive committee.'
  },
  {
    id: 'pol-19-2',
    number: '19.2',
    title: 'Substance Abuse Policy',
    content: 'The crew maintains a zero-tolerance policy for substance abuse.'
  },
  {
    id: 'pol-19-3',
    number: '19.3',
    title: 'Scout Identification Cards',
    content: 'All members must carry their scout identification cards.'
  },

  // 20. General Provisions
  {
    id: 'pol-20',
    number: '20',
    title: 'General Provisions',
    content: 'Precedence of policy, distribution, interpretation, and periodic reviews.'
  },
  {
    id: 'pol-20-1',
    number: '20.1',
    title: 'Precedence',
    content: 'This document overrides prior internal guidelines.'
  },
  {
    id: 'pol-20-2',
    number: '20.2',
    title: 'Distribution',
    content: 'Copies are distributed to all members.'
  },
  {
    id: 'pol-20-3',
    number: '20.3',
    title: 'Interpretation Authority',
    content: 'Interpretation of rules rests with the executive committee.'
  },
  {
    id: 'pol-20-4',
    number: '20.4',
    title: 'Periodic Review',
    content: 'Periodic reviews ensure alignment with national scouting regulations.'
  },

  // 21. Enforcement
  {
    id: 'pol-21',
    number: '21',
    title: 'Enforcement',
    content: 'Mandatory compliance and internal committee jurisdiction.'
  },
  {
    id: 'pol-21-1',
    number: '21.1',
    title: 'Mandatory Adherence',
    content: 'Strict adherence to this policy is mandatory for all members.'
  },
  {
    id: 'pol-21-2',
    number: '21.2',
    title: 'Handling Violations',
    content: 'Violations will be handled internally by the committee.'
  },

  // 22. Final Clauses
  {
    id: 'pol-22',
    number: '22',
    title: 'Final Clauses',
    content: 'Implementation date, signatories, and official authority.'
  },
  {
    id: 'pol-22-1',
    number: '22.1',
    title: 'Date of Implementation',
    content: 'Date of implementation: December 18, 2023.'
  },
  {
    id: 'pol-22-2',
    number: '22.2',
    title: 'Leadership Signatures',
    content: 'Signed by the Arabiyya School Scout Group leadership.'
  },
  {
    id: 'pol-22-3',
    number: '22.3',
    title: 'Crew Authority',
    content: 'Maintained under the authority of the Arabiyya Rover Crew.\n\nDate: 18 December 2023'
  }
];

// Helper to sort section numbers naturally (e.g., 1, 1.1, 1.2, 2, 2.1, 10, 10.1, 22.3)
export function sortPolicyItems(items: PolicyItem[]): PolicyItem[] {
  return [...items].sort((a, b) => {
    const partsA = (a.number || '').split('.').map(n => parseInt(n, 10) || 0);
    const partsB = (b.number || '').split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < maxLen; i++) {
      const valA = partsA[i] !== undefined ? partsA[i] : -1;
      const valB = partsB[i] !== undefined ? partsB[i] : -1;
      if (valA !== valB) return valA - valB;
    }
    return 0;
  });
}
