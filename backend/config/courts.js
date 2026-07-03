const nigerianCourts = [
  {
    code: 'SC',
    name: 'Supreme Court',
    fullName: 'Supreme Court of Nigeria',
    description: 'The highest court in Nigeria with final appellate jurisdiction',
    level: 1,
    jurisdiction: 'Federal',
    location: 'Abuja'
  },
  {
    code: 'CA',
    name: 'Court of Appeal',
    fullName: 'Court of Appeal',
    description: 'Intermediate appellate court with jurisdiction over appeals from lower courts',
    level: 2,
    jurisdiction: 'Federal',
    divisions: ['Lagos', 'Abuja', 'Enugu', 'Kaduna', 'Ibadan', 'Benin', 'Jos', 'Calabar', 'Ilorin', 'Port Harcourt', 'Sokoto', 'Yola', 'Makurdi']
  },
  {
    code: 'FHC',
    name: 'Federal High Court',
    fullName: 'Federal High Court',
    description: 'Court with jurisdiction over federal matters including taxation, banking, customs, immigration, and admiralty',
    level: 3,
    jurisdiction: 'Federal',
    divisions: 'All state capitals and FCT'
  },
  {
    code: 'SHC',
    name: 'State High Court',
    fullName: 'State High Court',
    description: 'Superior court of record with unlimited jurisdiction except matters reserved for Federal High Court',
    level: 3,
    jurisdiction: 'State',
    availability: 'All 36 states'
  },
  {
    code: 'SCA',
    name: 'Sharia Court of Appeal',
    fullName: 'Sharia Court of Appeal',
    description: 'Appellate court for Islamic law matters in states that have adopted Sharia',
    level: 3,
    jurisdiction: 'State',
    availability: 'Northern states and some others'
  },
  {
    code: 'CCA',
    name: 'Customary Court of Appeal',
    fullName: 'Customary Court of Appeal',
    description: 'Appellate court for customary law matters',
    level: 3,
    jurisdiction: 'State',
    availability: 'States with customary law systems'
  },
  {
    code: 'MC',
    name: 'Magistrate Court',
    fullName: 'Magistrate Court',
    description: 'Lower court handling minor civil and criminal matters',
    level: 4,
    jurisdiction: 'State',
    availability: 'All states and local government areas'
  },
  {
    code: 'DC',
    name: 'District Court',
    fullName: 'District Court',
    description: 'Lower court in some states handling local matters',
    level: 4,
    jurisdiction: 'State',
    availability: 'Selected states'
  }
];

const caseTypes = [
  'Civil',
  'Criminal',
  'Family',
  'Commercial',
  'Land',
  'Constitutional',
  'Labour',
  'Tax',
  'Maritime',
  'Election',
  'Other'
];

module.exports = {
  nigerianCourts,
  caseTypes
};
