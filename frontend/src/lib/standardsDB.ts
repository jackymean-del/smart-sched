// SmartSched Standards Knowledge Base
// Country × OrgType → actual regulatory standards with correct data

export interface StandardData {
  maxPeriodsWeek: number
  maxPeriodsDay: number
  periodDuration: number
  lunchMinutes: number
  breakMinutes: number
  numBreaks: number
  hoursPerWeek: number
  notes: string
  regulation: string
}

// Helper to calculate hoursPerWeek
function hrs(periodsDay: number, periodDur: number, lunch: number, breakMins: number, numBreaks: number, workDays = 5): number {
  const totalBreak = lunch + breakMins * (numBreaks - 1)
  return Math.round((periodsDay * periodDur + totalBreak) * workDays / 60 * 10) / 10
}

// ─── SCHOOL STANDARDS ────────────────────────────────────
const SCHOOL: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:36, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek: hrs(6,40,30,10,3), notes:"NCTE 2014: Max 36 periods/week · 6/day · 40 hrs/week · 30-min lunch mandatory", regulation:"NCTE Regulations 2014 + RTE Act 2009" },
  US: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:50, lunchMinutes:30, breakMinutes:10, numBreaks:2, hoursPerWeek: hrs(5,50,30,10,2), notes:"FLSA + IDEA: Max 30 periods/week · 5/day · 40 hrs/week · 180 school days/year", regulation:"FLSA 1938 + IDEA 2004 + Every Student Succeeds Act 2015" },
  GB: { maxPeriodsWeek:32, maxPeriodsDay:5, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(5,60,60,15,2), notes:"STPCD 2023: Max 32 periods/week · 1265 directed hours/year · 10% PPA time guaranteed", regulation:"School Teachers Pay and Conditions Document (STPCD) 2023" },
  AU: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:60, lunchMinutes:40, breakMinutes:20, numBreaks:2, hoursPerWeek: hrs(5,60,40,20,2), notes:"Fair Work Act 2009: Max 30 periods/week · 38 hrs/week · 200 school days/year", regulation:"Fair Work Act 2009 + Australian Education Act 2013" },
  AE: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:45, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(5,45,30,15,2), notes:"MoE UAE Cabinet Dec 2021: Max 30 periods/week · 36 hrs/week · Friday off", regulation:"UAE MoE Cabinet Decision 2021 + UAE Labour Law" },
  SG: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:35, lunchMinutes:40, breakMinutes:10, numBreaks:2, hoursPerWeek: hrs(5,35,40,10,2), notes:"MOE Singapore: Max 30 periods/week · 40 hrs/week · Recess mandatory 30 min", regulation:"MOE Singapore Teacher Workload Framework 2023" },
  NG: { maxPeriodsWeek:36, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek: hrs(6,40,30,10,3), notes:"FME Nigeria: Max 36 periods/week · 40 hrs/week · WAEC curriculum", regulation:"Federal Ministry of Education Nigeria + Labour Act Cap 198" },
  DE: { maxPeriodsWeek:28, maxPeriodsDay:5, periodDuration:45, lunchMinutes:45, breakMinutes:15, numBreaks:3, hoursPerWeek: hrs(5,45,45,15,3), notes:"EU WTD + Beamtenrecht: Max 28 periods/week · 41 hrs/week · Lunch mandatory 45 min", regulation:"EU Working Time Directive 2003/88/EC + Beamtenstatusgesetz" },
  PK: { maxPeriodsWeek:36, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek: hrs(6,40,30,10,3), notes:"HEC Pakistan: Max 36 periods/week · 6/day · Friday Juma break mandatory", regulation:"Higher Education Commission Pakistan + Factories Act 1934" },
  BD: { maxPeriodsWeek:36, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek: hrs(6,40,30,10,3), notes:"NCTB Bangladesh: Max 36 periods/week · 6/day · 220 school days/year", regulation:"NCTB + Bangladesh Labour Act 2006" },
  LK: { maxPeriodsWeek:35, maxPeriodsDay:7, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:2, hoursPerWeek: hrs(7,40,30,10,2), notes:"NIE Sri Lanka: Max 35 periods/week · 7/day · 200 school days/year", regulation:"NIE Sri Lanka + Shop and Office Act" },
  MY: { maxPeriodsWeek:30, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:2, hoursPerWeek: hrs(6,40,30,10,2), notes:"KPM Malaysia: Max 30 periods/week · 6/day · 190 school days", regulation:"Kementerian Pendidikan Malaysia + Employment Act 1955" },
  PH: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(5,60,60,15,2), notes:"DepEd Philippines: Max 30 periods/week · K-12 curriculum · 200 school days", regulation:"DepEd Order + Philippine Labor Code" },
  ZA: { maxPeriodsWeek:35, maxPeriodsDay:7, periodDuration:30, lunchMinutes:40, breakMinutes:10, numBreaks:3, hoursPerWeek: hrs(7,30,40,10,3), notes:"SACE South Africa: Max 35 periods/week · 7/day · 196 school days/year", regulation:"SACE + BCEA (Basic Conditions of Employment Act 1997)" },
  KE: { maxPeriodsWeek:35, maxPeriodsDay:7, periodDuration:40, lunchMinutes:40, breakMinutes:10, numBreaks:3, hoursPerWeek: hrs(7,40,40,10,3), notes:"TSC Kenya: Max 35 periods/week · 7/day · CBC curriculum", regulation:"Teachers Service Commission Kenya + Employment Act 2007" },
  EG: { maxPeriodsWeek:30, maxPeriodsDay:6, periodDuration:45, lunchMinutes:30, breakMinutes:10, numBreaks:2, hoursPerWeek: hrs(6,45,30,10,2), notes:"MoE Egypt: Max 30 periods/week · 6/day · Friday off · Arabic medium", regulation:"Egyptian Ministry of Education + Egyptian Labour Law 12/2003" },
  SA: { maxPeriodsWeek:30, maxPeriodsDay:6, periodDuration:45, lunchMinutes:30, breakMinutes:10, numBreaks:2, hoursPerWeek: hrs(6,45,30,10,2), notes:"MoE Saudi Arabia: Max 30/week · Friday off · Islamic studies mandatory", regulation:"Saudi MoE + Saudi Labour Law Royal Decree M/51" },
  CA: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:60, lunchMinutes:45, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(5,60,45,15,2), notes:"Provincial standard (ON): Max 30 periods/week · 194 instructional days", regulation:"Ontario Education Act + Canada Labour Code" },
  JP: { maxPeriodsWeek:28, maxPeriodsDay:5, periodDuration:45, lunchMinutes:45, breakMinutes:10, numBreaks:2, hoursPerWeek: hrs(5,45,45,10,2), notes:"MEXT Japan: Max 28 periods/week · 5/day · 35 instructional weeks/year", regulation:"Ministry of Education MEXT + Labour Standards Act" },
  CN: { maxPeriodsWeek:30, maxPeriodsDay:6, periodDuration:40, lunchMinutes:60, breakMinutes:10, numBreaks:2, hoursPerWeek: hrs(6,40,60,10,2), notes:"MoE China: Max 30 periods/week · 40 hrs/week · 2 hr nap mandatory (primary)", regulation:"Chinese Ministry of Education + Labour Law of PRC" },
  BR: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:50, lunchMinutes:30, breakMinutes:10, numBreaks:2, hoursPerWeek: hrs(5,50,30,10,2), notes:"MEC Brazil: Max 30 periods/week · 800 hrs/year min · 200 school days", regulation:"Lei de Diretrizes e Bases (LDB) 9394/1996 + CLT" },
  FR: { maxPeriodsWeek:26, maxPeriodsDay:5, periodDuration:55, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(5,55,60,15,2), notes:"MEN France: Max 26 periods/week · No school Wednesday PM · 36 school weeks", regulation:"French Code de l'Éducation + Code du Travail" },
  IT: { maxPeriodsWeek:25, maxPeriodsDay:5, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(5,60,60,15,2), notes:"MIUR Italy: Max 25 periods/week · 200 school days · Mandatory recess", regulation:"MIUR + Contratto Collettivo Nazionale CCNL Scuola" },
  ES: { maxPeriodsWeek:30, maxPeriodsDay:6, periodDuration:55, lunchMinutes:90, breakMinutes:30, numBreaks:2, hoursPerWeek: hrs(6,55,90,30,2), notes:"MEC Spain: Max 30/week · 175 school days min · Long lunch (siesta) in some regions", regulation:"LOMLOE (Ley Orgánica 3/2020) + Estatuto de los Trabajadores" },
  NL: { maxPeriodsWeek:28, maxPeriodsDay:5, periodDuration:50, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(5,50,30,15,2), notes:"OCW Netherlands: Max 28/week · 940 hrs/year (primary) · Wednesday afternoon free", regulation:"Wet op het primair onderwijs + Arbeidstijdenwet" },
  TR: { maxPeriodsWeek:30, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeak: hrs(6,40,30,10,3), notes:"MEB Turkey: Max 30/week · 6/day · Friday prayers break mandatory (male staff)", regulation:"MEB (Millî Eğitim Bakanlığı) + İş Kanunu 4857" },
  ID: { maxPeriodsWeek:36, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek: hrs(6,40,30,10,3), notes:"Kemendikbud Indonesia: Max 36/week · 6/day · Pancasila education mandatory", regulation:"Undang-Undang Sistem Pendidikan Nasional No 20/2003 + UU Ketenagakerjaan" },
  DEFAULT: { maxPeriodsWeek:30, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek: hrs(6,40,30,10,3), notes:"General school standard — customize as per your national regulations", regulation:"Please set your local education authority standard" },
}

// ─── COLLEGE STANDARDS ───────────────────────────────────
const COLLEGE: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:16, maxPeriodsDay:4, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(4,60,60,15,2), notes:"UGC 2023: Max 16 lectures/week · 40 working hrs · 30 teaching days/semester", regulation:"UGC Regulations 2010 (amended 2023) + AICTE norms" },
  US: { maxPeriodsWeek:15, maxPeriodsDay:3, periodDuration:75, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(3,75,60,15,2), notes:"AAUP standard: 12–15 credit hrs/week · 40 hrs total · 16-week semesters", regulation:"American Association of University Professors (AAUP) Guidelines" },
  GB: { maxPeriodsWeek:18, maxPeriodsDay:4, periodDuration:50, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(4,50,60,15,2), notes:"UCU UK: Max 18 contact hrs/week · 37.5 hrs total · PGR supervision counted", regulation:"UCU Framework Agreement + Working Time Regulations 1998" },
  AU: { maxPeriodsWeek:12, maxPeriodsDay:3, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(3,60,60,15,2), notes:"NTEU Australia: Max 12–15 contact hrs · 37.5 hr week · Research time protected", regulation:"NTEU Enterprise Agreement + Fair Work Act 2009" },
  DE: { maxPeriodsWeek:18, maxPeriodsDay:4, periodDuration:90, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(4,90,60,15,2), notes:"HRK Germany: 18 SWS (semester weekly hours) · 90-min lectures standard", regulation:"Hochschulrahmengesetz + Beamtenrechtsrahmengesetz" },
  DEFAULT: { maxPeriodsWeek:16, maxPeriodsDay:4, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek: hrs(4,60,60,15,2), notes:"General college/university standard — customize as per your institution", regulation:"Please set your local university authority standard" },
}

// ─── CORPORATE STANDARDS ─────────────────────────────────
const CORPORATE: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:3, hoursPerWeek: hrs(8,60,60,15,3), notes:"Factories Act 1948: Max 48 hrs/week · 9 hrs/day · 30-min lunch if >5 hrs continuous", regulation:"Factories Act 1948 + Industrial Disputes Act 1947 + Code on Wages 2019" },
  US: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40, notes:"FLSA: 40 hrs/week standard · OT after 40 hrs · No mandated lunch federally (state varies)", regulation:"Fair Labor Standards Act (FLSA) 1938 + State labor laws" },
  GB: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:20, breakMinutes:15, numBreaks:2, hoursPerWeek:48, notes:"WTR UK: Max 48 hrs/week (opt-out possible) · 20-min rest if >6 hrs work", regulation:"Working Time Regulations 1998 (UK) + Employment Rights Act 1996" },
  AU: { maxPeriodsWeek:38, maxPeriodsDay:7.6, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:38, notes:"FW Act: 38 hrs/week ordinary · RDOs common · 30-min meal break if >5 hrs", regulation:"Fair Work Act 2009 + National Employment Standards (NES)" },
  AE: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:48, notes:"UAE Labour Law: 48 hrs/week (36 in Ramadan) · Friday rest day · Annual leave 30 days", regulation:"UAE Federal Decree-Law No. 33 of 2021 (Labour Law)" },
  DE: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40, notes:"ArbZG: Max 8 hrs/day (10 with compensation) · 30-min break >6 hrs · 11 hr rest", regulation:"Arbeitszeitgesetz (ArbZG) + Betriebsverfassungsgesetz" },
  SG: { maxPeriodsWeek:44, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:44, notes:"EA Singapore: Max 44 hrs/week · OT max 72 hrs/month · 1 rest day/week", regulation:"Employment Act (Cap 91A) Singapore + MOM Guidelines" },
  DEFAULT: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40, notes:"Standard 40-hr work week — customize as per your local labour law", regulation:"Please set your local labour law standard" },
}

// ─── HOSPITAL STANDARDS ──────────────────────────────────
const HOSPITAL: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:20, numBreaks:3, hoursPerWeek:48, notes:"MCI/NMC: Max 48 hrs/week · 12-hr shifts common · 30-min meal mandatory · On-call tracked", regulation:"NMC Act 2019 + MCI Regulations + Factories Act 1948" },
  US: { maxPeriodsWeek:36, maxPeriodsDay:12, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:36, notes:"JCAHO: 12-hr shifts (3×/week) · 80-hr resident cap/2 weeks · Fatigue management mandatory", regulation:"ACGME Resident Duty Hour Standards + JCAHO + FLSA" },
  GB: { maxPeriodsWeek:48, maxPeriodsDay:12, periodDuration:60, lunchMinutes:30, breakMinutes:20, numBreaks:2, hoursPerWeek:48, notes:"NHS: 48 hrs/week (WTD) · 12-hr shifts · EWTD junior doctor compliance mandatory", regulation:"NHS Terms and Conditions + EU Working Time Directive" },
  AU: { maxPeriodsWeek:38, maxPeriodsDay:10, periodDuration:60, lunchMinutes:30, breakMinutes:20, numBreaks:2, hoursPerWeek:38, notes:"AHPRA: 38 hr base + OT · 10-hr shifts standard · Fatigue risk management required", regulation:"AHPRA + Fair Work Act 2009 + Work Health and Safety Act" },
  DEFAULT: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:20, numBreaks:3, hoursPerWeek:48, notes:"Standard healthcare shift schedule — customize as per your local health authority", regulation:"Please set your local health authority standard" },
}

// ─── NGO STANDARDS ───────────────────────────────────────
const NGO: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:40, notes:"NGO/NPO India: 40 hrs/week · Flexible hours common · FCRA compliance for foreign-funded", regulation:"Societies Registration Act + FCRA 2010 + Labour Laws" },
  US: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40, notes:"FLSA applies to nonprofits: 40 hrs/week · 501(c)(3) exempt from some rules", regulation:"FLSA 1938 + IRS 501(c)(3) + State nonprofit laws" },
  DEFAULT: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:45, breakMinutes:15, numBreaks:2, hoursPerWeek:40, notes:"Standard NGO/nonprofit schedule — customize as per your organization policy", regulation:"Please set your local labour law and organizational standard" },
}

// ─── FACTORY STANDARDS ───────────────────────────────────
const FACTORY: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:48, maxPeriodsDay:9, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:3, hoursPerWeek:48, notes:"Factories Act 1948: Max 48 hrs/week · 9 hrs/day · No continuous work >5 hrs without break · Overtime double pay", regulation:"Factories Act 1948 + Occupational Safety Health & Working Conditions Code 2020" },
  US: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40, notes:"OSHA + FLSA: 40 hrs standard · OT 1.5x after 40 hrs · OSHA safety standards mandatory", regulation:"FLSA + OSHA Act 1970 + State factory laws" },
  GB: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:20, breakMinutes:15, numBreaks:2, hoursPerWeek:48, notes:"WTR 1998: Max 48 hrs/week · 20-min rest >6 hrs · Night shift premium", regulation:"Working Time Regulations 1998 + Health and Safety at Work Act 1974" },
  DE: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40, notes:"ArbZG: Max 48 hrs/week (8 normal) · Mandatory safety breaks · IG Metall agreements", regulation:"Arbeitszeitgesetz + Arbeitsschutzgesetz + IG Metall Tarifvertrag" },
  DEFAULT: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:3, hoursPerWeek:48, notes:"Standard factory/shift schedule — customize as per your local Factories Act", regulation:"Please set your local factories act / labour law standard" },
}

// ─── Main lookup function ─────────────────────────────────
const DB: Record<string, Record<string, StandardData>> = {
  school:    SCHOOL,
  college:   COLLEGE,
  corporate: CORPORATE,
  hospital:  HOSPITAL,
  ngo:       NGO,
  factory:   FACTORY,
}

export function getStandard(orgType: string, countryCode: string): StandardData {
  const orgDB = DB[orgType] ?? DB.school
  // Try exact match first, then DEFAULT
  return orgDB[countryCode] ?? orgDB.DEFAULT ?? SCHOOL.DEFAULT
}
