import type { Country, OrgType } from '@/types'
import { generateId } from './utils'

// ─── Country Data ─────────────────────────────────────────
export const COUNTRIES: Country[] = [
  {
    code: 'IN', flag: '🇮🇳', name: 'India', subtitle: 'NCTE · Labour Act 1948',
    standard: 'NCTE 2014: Max 36 periods/week · 6/day · 40 hrs/week · 30-min lunch mandatory',
    maxPeriodsWeek: 36, maxPeriodsDay: 6,
    firstNames: ['Priya','Anita','Sunita','Kavita','Rekha','Deepa','Meena','Sita','Asha','Usha','Nisha','Lata','Ram','Mohan','Rajesh','Suresh','Dinesh','Mahesh','Vijay','Ajay','Sanjay','Manoj','Anil','Ganesh','Ramesh'],
    lastNames: ['Sharma','Verma','Patel','Singh','Kumar','Das','Nair','Roy','Mishra','Joshi','Gupta','Reddy','Rao','Pillai','Menon','Iyer','Bose','Sen','Ghosh','Dey'],
    titles: ['Ms.','Mr.','Dr.','Mrs.','Prof.'],
    grades: ['Nursery','LKG','UKG','I','II','III','IV','V','VI','VII','VIII','IX','X'],
    sections: ['A','B','C','D','E'],
    subjects: ['Mathematics','English','Science','Social Studies','Hindi','Odia','EVS','Computer','Physical Education','Art & Craft','Music','Dance','CCA','G.K.'],
    breaks: ['Assembly','Short Break','Lunch Break','Snacks','Diary Writing','Dispersal'],
    roomPrefix: 'Room', roomStart: 101,
  },
  {
    code: 'US', flag: '🇺🇸', name: 'United States', subtitle: 'FLSA · IDEA · NCLB',
    standard: 'FLSA+IDEA: Max 30 periods/week · 5/day · 40 hrs/week',
    maxPeriodsWeek: 30, maxPeriodsDay: 5,
    firstNames: ['Emily','Sarah','Jessica','Ashley','Amanda','Jennifer','Megan','Lauren','Rachel','Nicole','Michael','Christopher','Matthew','Joshua','Andrew','David','James','Daniel','Ryan','Tyler'],
    lastNames: ['Smith','Johnson','Williams','Jones','Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris'],
    titles: ['Ms.','Mr.','Dr.','Mrs.'],
    grades: ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'],
    sections: ['Section A','Section B','Section C','Honors','AP'],
    subjects: ['Mathematics','English Language Arts','Science','Social Studies','Physical Education','Art','Music','Computer Science','Spanish','French'],
    breaks: ['Homeroom','Morning Break','Lunch Period','Advisory Period','Dismissal'],
    roomPrefix: 'Room', roomStart: 101,
  },
  {
    code: 'GB', flag: '🇬🇧', name: 'United Kingdom', subtitle: 'STPCD 2023',
    standard: 'STPCD 2023: Max 32 periods/week · 10% PPA time · 1265 directed hrs/year',
    maxPeriodsWeek: 32, maxPeriodsDay: 5,
    firstNames: ['Emma','Olivia','Charlotte','Amelia','Isla','Sophie','Grace','Lily','Alice','Oliver','George','Harry','Jack','Charlie','William','James','Thomas','Henry'],
    lastNames: ['Smith','Jones','Taylor','Brown','Williams','Wilson','Evans','Johnson','Davies','Robinson','Wright','Thompson','Walker','White'],
    titles: ['Ms.','Mr.','Dr.','Mrs.'],
    grades: ['Reception','Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Year 7','Year 8','Year 9','Year 10','Year 11','Year 12','Year 13'],
    sections: ['A','B','C','D','Set 1','Set 2'],
    subjects: ['Mathematics','English Language','English Literature','Science','History','Geography','Physical Education','Art & Design','Music','ICT','French','German'],
    breaks: ['Registration','Morning Break','Lunch','Form Period','Dismissal'],
    roomPrefix: 'Room', roomStart: 1,
  },
  {
    code: 'AU', flag: '🇦🇺', name: 'Australia', subtitle: 'Fair Work Act 2009',
    standard: 'Fair Work Act: Max 30 periods/week · 38 hrs/week',
    maxPeriodsWeek: 30, maxPeriodsDay: 5,
    firstNames: ['Olivia','Charlotte','Ava','Amelia','Sophia','Chloe','Zoe','Emily','Mia','Harper','William','Oliver','Jack','Noah','Lucas','Henry','Liam','Ethan'],
    lastNames: ['Smith','Jones','Williams','Brown','Wilson','Taylor','Anderson','Thomas','Jackson','Harris','Martin','Thompson'],
    titles: ['Ms.','Mr.','Dr.'],
    grades: ['Foundation','Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Year 7','Year 8','Year 9','Year 10','Year 11','Year 12'],
    sections: ['A','B','C','D'],
    subjects: ['Mathematics','English','Science','HASS','Creative Arts','Music','Physical Education','PDHPE','Languages','Design Technology'],
    breaks: ['Assembly','Morning Tea','Lunch','Afternoon Break','Dismissal'],
    roomPrefix: 'Room', roomStart: 101,
  },
  {
    code: 'AE', flag: '🇦🇪', name: 'UAE', subtitle: 'MoE Cabinet Dec 2021',
    standard: 'MoE UAE: Max 30 periods/week · 36 hrs/week · Friday off',
    maxPeriodsWeek: 30, maxPeriodsDay: 5,
    firstNames: ['Fatima','Aisha','Maryam','Hessa','Nour','Reem','Layla','Sara','Dana','Mohammed','Ahmed','Omar','Ali','Khalid','Sultan','Rashid'],
    lastNames: ['Al-Rashidi','Al-Mansoori','Al-Maktoum','Al-Nahyan','Al-Falasi','Al-Suwaidi','Al-Mazrouei','Al-Hamdan','Al-Qasimi'],
    titles: ['Ms.','Mr.','Dr.'],
    grades: ['KG 1','KG 2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10'],
    sections: ['A','B','C','D'],
    subjects: ['Mathematics','English','Arabic Language','Islamic Studies','Science','Social Studies','Physical Education','Art','Computer'],
    breaks: ['Morning Assembly','Short Break','Lunch Break','Closing Assembly','Dispersal'],
    roomPrefix: 'Room', roomStart: 101,
  },
  {
    code: 'SG', flag: '🇸🇬', name: 'Singapore', subtitle: 'MOE Singapore',
    standard: 'MOE Singapore: Max 30 periods/week · 40 hrs/week',
    maxPeriodsWeek: 30, maxPeriodsDay: 5,
    firstNames: ['Mei Lin','Hui Ying','Xin Yi','Yu Ting','Jia Hui','Wei Ming','Jian Hong','Jun Kai','Priya','Deepa','Rajan','Kumar'],
    lastNames: ['Tan','Lim','Lee','Ng','Wong','Chen','Goh','Chua','Ong','Koh','Ramakrishnan'],
    titles: ['Ms.','Mr.','Dr.'],
    grades: ['Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6','Secondary 1','Secondary 2','Secondary 3','Secondary 4'],
    sections: ['A','B','C','Express','Normal'],
    subjects: ['Mathematics','English Language','Mother Tongue','Science','Social Studies','Physical Education','Art','Music','CCE'],
    breaks: ['Flag Raising','Recess','Lunch','CCA Time','Dismissal'],
    roomPrefix: 'Room', roomStart: 101,
  },
  {
    code: 'NG', flag: '🇳🇬', name: 'Nigeria', subtitle: 'FME · Labour Act',
    standard: 'FME Nigeria: Max 36 periods/week · 40 hrs/week · WAEC curriculum',
    maxPeriodsWeek: 36, maxPeriodsDay: 6,
    firstNames: ['Chioma','Adaeze','Ngozi','Amaka','Ifeoma','Emeka','Chidi','Oluwaseun','Adebayo','Tunde','Blessing','Mercy','Grace','Faith'],
    lastNames: ['Okafor','Eze','Obi','Nwosu','Adeyemi','Okonkwo','Babatunde','Afolabi','Chukwu','Uche'],
    titles: ['Ms.','Mr.','Dr.'],
    grades: ['Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6','JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3'],
    sections: ['A','B','C','D'],
    subjects: ['Mathematics','English Language','Basic Science','Social Studies','Yoruba','Physical Education','Fine Art','Agricultural Science','Computer Studies'],
    breaks: ['Assembly','Short Break','Lunch','Afternoon Break','Closing'],
    roomPrefix: 'Block', roomStart: 1,
  },
  {
    code: 'DE', flag: '🇩🇪', name: 'Germany', subtitle: 'EU WTD · Beamtenrecht',
    standard: 'EU Working Time Directive: Max 28 periods/week · 41 hrs/week',
    maxPeriodsWeek: 28, maxPeriodsDay: 5,
    firstNames: ['Anna','Marie','Laura','Julia','Lisa','Sophia','Emma','Lena','Hannah','Lea','Maximilian','Paul','Jonas','Felix','Leon','Elias'],
    lastNames: ['Mueller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann'],
    titles: ['Frau','Herr','Dr.','Prof.'],
    grades: ['Klasse 1','Klasse 2','Klasse 3','Klasse 4','Klasse 5','Klasse 6','Klasse 7','Klasse 8','Klasse 9','Klasse 10','Klasse 11','Klasse 12'],
    sections: ['A','B','C','D'],
    subjects: ['Mathematik','Deutsch','Englisch','Physik','Chemie','Biologie','Geschichte','Geographie','Sport','Musik','Kunst','Informatik'],
    breaks: ['Morgenkreis','Pause','Mittagspause','Nachmittagspause','Schulschluss'],
    roomPrefix: 'Raum', roomStart: 101,
  },
]

export function getCountry(code: string): Country {
  return COUNTRIES.find(c => c.code === code) ?? COUNTRIES[0]
}

// ─── Org Config ───────────────────────────────────────────
export interface OrgConfig {
  icon: string
  name: string
  subtitle: string
  staffLabel: string
  staffsLabel: string
  subjectLabel: string
  subjectsLabel: string
  sectionLabel: string
  sectionsLabel: string
  roomLabel: string
  classTTLabel: string
  teacherTTLabel: string
  loadUnit: string
}

export const ORG_CONFIGS: Record<OrgType, OrgConfig> = {
  school: {
    icon: 'GraduationCap', name: 'School', subtitle: 'K–12 · Primary · Secondary',
    staffLabel: 'Teacher', staffsLabel: 'Teachers',
    subjectLabel: 'Subject', subjectsLabel: 'Subjects',
    sectionLabel: 'Class/Section', sectionsLabel: 'Classes',
    roomLabel: 'Room No.', classTTLabel: 'Class Timetable',
    teacherTTLabel: "Teachers' Timetable", loadUnit: 'periods/week',
  },
  college: {
    icon: 'Building2', name: 'College/University', subtitle: 'UG · PG · Research',
    staffLabel: 'Lecturer', staffsLabel: 'Lecturers',
    subjectLabel: 'Course', subjectsLabel: 'Courses',
    sectionLabel: 'Batch', sectionsLabel: 'Batches',
    roomLabel: 'Hall No.', classTTLabel: 'Batch Timetable',
    teacherTTLabel: "Lecturers' Timetable", loadUnit: 'lectures/week',
  },
  corporate: {
    icon: 'Briefcase', name: 'Corporate', subtitle: 'Shifts · Teams · Meetings',
    staffLabel: 'Employee', staffsLabel: 'Employees',
    subjectLabel: 'Project/Meeting', subjectsLabel: 'Projects',
    sectionLabel: 'Team/Dept', sectionsLabel: 'Teams',
    roomLabel: 'Meeting Room', classTTLabel: 'Team Schedule',
    teacherTTLabel: 'Employee Schedule', loadUnit: 'hours/week',
  },
  hospital: {
    icon: 'Stethoscope', name: 'Healthcare', subtitle: 'Hospital · Clinic · OT',
    staffLabel: 'Doctor/Nurse', staffsLabel: 'Clinical Staff',
    subjectLabel: 'Duty/Procedure', subjectsLabel: 'Duties',
    sectionLabel: 'Ward/Dept', sectionsLabel: 'Wards',
    roomLabel: 'Bay No.', classTTLabel: 'Ward Schedule',
    teacherTTLabel: 'Duty Roster', loadUnit: 'duties/week',
  },
  ngo: {
    icon: 'HeartHandshake', name: 'NGO/Non-profit', subtitle: 'Projects · Volunteers',
    staffLabel: 'Volunteer', staffsLabel: 'Volunteers',
    subjectLabel: 'Activity', subjectsLabel: 'Activities',
    sectionLabel: 'Project/Team', sectionsLabel: 'Projects',
    roomLabel: 'Venue/Field', classTTLabel: 'Activity Schedule',
    teacherTTLabel: 'Volunteer Schedule', loadUnit: 'sessions/week',
  },
  factory: {
    icon: 'Factory', name: 'Factory/Labour', subtitle: 'Shifts · Assembly Lines',
    staffLabel: 'Supervisor/Worker', staffsLabel: 'Workers',
    subjectLabel: 'Task/Operation', subjectsLabel: 'Tasks',
    sectionLabel: 'Line/Shift', sectionsLabel: 'Lines',
    roomLabel: 'Bay/Station No.', classTTLabel: 'Line Schedule',
    teacherTTLabel: 'Worker Roster', loadUnit: 'slots/week',
  },
}

// ─── Dummy Data Generators ────────────────────────────────
function pickName(country: Country, idx: number): string {
  const fn = country.firstNames[idx % country.firstNames.length]
  const ln = country.lastNames[Math.floor(idx / country.firstNames.length) % country.lastNames.length]
  const title = country.titles[idx % country.titles.length]
  return `${title} ${fn} ${ln}`
}

function guessFreq(subject: string): number {
  const u = subject.toLowerCase()
  if (['math','english','mathematics','deutsch'].some(h => u.includes(h))) return 5
  if (['science','social','hindi','arabic','physics','chemistry','biology'].some(m => u.includes(m))) return 4
  return 2
}

export function generateSections(orgType: OrgType, countryCode: string, n: number) {
  const c = getCountry(countryCode)
  const result = []
  let i = 0
  if (orgType === 'school') {
    outer: for (const grade of c.grades) {
      for (const sec of c.sections) {
        if (i >= n) break outer
        result.push({ id: generateId(), name: `${grade}-${sec}`, room: `${c.roomPrefix} ${c.roomStart + i}`, grade, classTeacher: '' })
        i++
      }
    }
  } else {
    const names: Record<string, string[]> = {
      college: ['CS-A','CS-B','BBA-A','BBA-B','MCA-A','EEE-A','MECH-A','CIVIL-A','BCA-A','MBA-A'],
      corporate: ['Engineering','Product','Design','Marketing','Sales','Operations','Finance','HR','Legal','DevOps'],
      hospital: ['General Ward A','General Ward B','ICU','Emergency','OPD','Paediatrics','Gynaecology','Orthopaedics'],
      ngo: ['Community Outreach','Field Operations','Education Program','Health Program','Women Empowerment','Environment'],
      factory: ['Assembly Line A','Assembly Line B','Packaging Line 1','Quality Control','Maintenance Bay','Welding Station'],
    }
    const list = names[orgType] ?? []
    for (let k = 0; k < Math.min(n, list.length); k++) {
      result.push({ id: generateId(), name: list[k], room: `Bay ${k + 1}`, grade: list[k], classTeacher: '' })
    }
  }
  return result
}

export function generateStaff(orgType: OrgType, countryCode: string, n: number) {
  const c = getCountry(countryCode)
  const cfg = ORG_CONFIGS[orgType]
  const maxPeriods: Record<OrgType, number> = { school: c.maxPeriodsWeek, college: 16, corporate: 40, hospital: 42, ngo: 30, factory: 48 }
  return Array.from({ length: n }, (_, i) => ({
    id: generateId(),
    name: `${cfg.staffLabel} ${i + 1}`,
    role: cfg.staffLabel,
    subjects: [] as string[],
    classes: [] as string[],
    isClassTeacher: '',
    maxPeriodsPerWeek: maxPeriods[orgType],
  }))
}

export function generateSubjects(orgType: OrgType, countryCode: string, n: number) {
  const c = getCountry(countryCode)
  const extras: Record<OrgType, string[]> = {
    school: [],
    college: ['Advanced Mathematics','Physics','Chemistry','Biology','English Communication','Computer Programming','Data Structures','Electronics','Economics','Management'],
    corporate: ['Sprint Planning','Daily Standup','Code Review','Design Review','Client Presentation','Team Sync','Training Session','Retrospective'],
    hospital: ['Ward Round','OT Assistance','Emergency Duty','OPD Consultation','ICU Monitoring','Patient Admission','Nursing Care','Night Duty'],
    ngo: ['Field Visit','Community Meeting','Training Session','Documentation','Awareness Campaign','Survey','Workshop','Beneficiary Assessment'],
    factory: ['Assembly Operation','Quality Inspection','Packaging','Machine Setup','Maintenance','Safety Check','Material Handling','Loading/Unloading'],
  }
  const subjectList = orgType === 'school' ? c.subjects : extras[orgType]
  return subjectList.slice(0, n).map(name => ({
    id: generateId(),
    name,
    periodsPerWeek: guessFreq(name),
    color: getSubjectColor(name),
    sections: [] as string[],
  }))
}

export function generateBreaks(orgType: OrgType, n: number) {
  const presets: Record<OrgType, Array<{id:string;name:string;duration:number;type:'fixed-start'|'break'|'lunch'|'fixed-end';shiftable:boolean}>> = {
    school: [
      {id:'asm',name:'Assembly',duration:15,type:'fixed-start',shiftable:false},
      {id:'sbrk',name:'Short Break',duration:10,type:'break',shiftable:true},
      {id:'lnch',name:'Lunch Break',duration:30,type:'lunch',shiftable:true},
      {id:'snk',name:'Snacks',duration:10,type:'fixed-end',shiftable:true},
      {id:'diay',name:'Diary',duration:15,type:'fixed-end',shiftable:true},
      {id:'disp',name:'Dispersal',duration:5,type:'fixed-end',shiftable:false},
    ],
    college: [
      {id:'reg',name:'Registration',duration:10,type:'fixed-start',shiftable:false},
      {id:'brk1',name:'Morning Break',duration:15,type:'break',shiftable:true},
      {id:'lnch',name:'Lunch',duration:45,type:'lunch',shiftable:true},
      {id:'brk2',name:'Tea Break',duration:10,type:'break',shiftable:true},
      {id:'disp',name:'Dismissal',duration:5,type:'fixed-end',shiftable:false},
    ],
    corporate: [
      {id:'std',name:'Standup',duration:15,type:'fixed-start',shiftable:false},
      {id:'cof',name:'Coffee Break',duration:15,type:'break',shiftable:true},
      {id:'lnch',name:'Lunch',duration:60,type:'lunch',shiftable:true},
      {id:'tea',name:'Tea Break',duration:15,type:'break',shiftable:true},
      {id:'sof',name:'Sign-off',duration:15,type:'fixed-end',shiftable:false},
    ],
    hospital: [
      {id:'wbr',name:'Ward Briefing',duration:15,type:'fixed-start',shiftable:false},
      {id:'rst1',name:'Rest Break',duration:20,type:'break',shiftable:true},
      {id:'mel',name:'Meal Break',duration:30,type:'lunch',shiftable:true},
      {id:'rst2',name:'Rest Break 2',duration:20,type:'break',shiftable:true},
      {id:'hov',name:'Handover',duration:15,type:'fixed-end',shiftable:false},
    ],
    ngo: [
      {id:'mbr',name:'Morning Briefing',duration:15,type:'fixed-start',shiftable:false},
      {id:'brk',name:'Break',duration:15,type:'break',shiftable:true},
      {id:'lnch',name:'Lunch',duration:45,type:'lunch',shiftable:true},
      {id:'deb',name:'Debrief',duration:15,type:'fixed-end',shiftable:false},
    ],
    factory: [
      {id:'sst',name:'Shift Start',duration:10,type:'fixed-start',shiftable:false},
      {id:'brk1',name:'Break 1',duration:15,type:'break',shiftable:true},
      {id:'mel',name:'Meal Break',duration:30,type:'lunch',shiftable:true},
      {id:'brk2',name:'Break 2',duration:15,type:'break',shiftable:true},
      {id:'sen',name:'Shift End',duration:10,type:'fixed-end',shiftable:false},
    ],
  }
  const list = presets[orgType] ?? presets.school
  return list.slice(0, Math.max(2, Math.min(n, list.length)))
}

// ─── Subject Colors ───────────────────────────────────────
const COLOR_MAP: [string[], string][] = [
  [['MATH','MATHS','MATHEMATICS','CALCULUS','MATHEMATIK'], 'bg-blue-100 text-blue-800'],
  [['ENGLISH','ENG','LANGUAGE ARTS','DEUTSCH','COMMUNICATION'], 'bg-pink-100 text-pink-800'],
  [['BIOLOGY','BIO','BIOLOGIE'], 'bg-green-100 text-green-800'],
  [['CHEMISTRY','CHEM','CHEMIE'], 'bg-orange-100 text-orange-800'],
  [['PHYSICS','PHY','PHYSIK'], 'bg-indigo-100 text-indigo-800'],
  [['SCIENCE','SCI'], 'bg-emerald-100 text-emerald-800'],
  [['SOCIAL','SST','HISTORY','GEOGRAPHY','ECONOMICS','GEOGRAPHIE'], 'bg-yellow-100 text-yellow-800'],
  [['HINDI','URDU','ARABIC','ODIA','REGIONAL','MOTHER TONGUE'], 'bg-red-100 text-red-800'],
  [['EVS','ENVIRONMENTAL'], 'bg-teal-100 text-teal-800'],
  [['PE','PHYSICAL EDUCATION','SPORT','PDHPE'], 'bg-lime-100 text-lime-800'],
  [['ART','CRAFT','KUNST','CREATIVE','FINE ART'], 'bg-purple-100 text-purple-800'],
  [['MUSIC','MUSIK'], 'bg-violet-100 text-violet-800'],
  [['COMPUTER','COMP','IT','ICT','PROGRAMMING','CODING'], 'bg-sky-100 text-sky-800'],
  [['MEETING','STANDUP','SPRINT','PLANNING','SYNC'], 'bg-cyan-100 text-cyan-800'],
  [['DUTY','WARD ROUND','NURSING','ON-CALL'], 'bg-green-100 text-green-800'],
  [['ASSEMBLY','REGISTRATION','MORGENKREIS'], 'bg-blue-200 text-blue-900 font-bold'],
  [['DISPERSAL','DISMISSAL','SIGN-OFF','HANDOVER','SHIFT END'], 'bg-green-200 text-green-900 font-bold'],
  [['LUNCH','MEAL'], 'bg-amber-100 text-amber-800'],
  [['BREAK','RECESS','PAUSE','MORNING TEA','COFFEE'], 'bg-yellow-100 text-yellow-700'],
  [['DIARY'], 'bg-slate-100 text-slate-600'],
  [['SNACK'], 'bg-yellow-50 text-yellow-700'],
]

export function getSubjectColor(subject: string): string {
  if (!subject?.trim()) return 'bg-gray-100 text-gray-500'
  const u = subject.toUpperCase()
  for (const [keys, cls] of COLOR_MAP) {
    if (keys.some(k => u.includes(k))) return cls
  }
  return 'bg-gray-100 text-gray-700'
}
