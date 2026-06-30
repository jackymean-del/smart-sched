// SmartSched Standards Knowledge Base
// Country × OrgType → regulatory standards with official reference links

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
  links: { label: string; url: string }[]
}

function hrs(pd: number, dur: number, lunch: number, brk: number, nb: number, days = 5): number {
  return Math.round((pd * dur + lunch + brk * (nb - 1)) * days / 60 * 10) / 10
}

const SCHOOL: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:36, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek:hrs(6,40,30,10,3),
    notes:"NCTE 2014: Max 36 periods/week · 6/day · 40 hrs/week · 30-min lunch mandatory · RTE Act 2009 compliance required",
    regulation:"NCTE Regulations 2014 + RTE Act 2009",
    links:[
      { label:"NCTE Regulations 2014 (Official PDF)", url:"https://ncte.gov.in/website/PDF/NCTE_Regulations_2014.pdf" },
      { label:"RTE Act 2009 — Ministry of Education", url:"https://dsel.education.gov.in/rte" },
      { label:"MHRD School Education Guidelines", url:"https://www.education.gov.in/school-education" },
    ]},
  US: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:50, lunchMinutes:30, breakMinutes:10, numBreaks:2, hoursPerWeek:hrs(5,50,30,10,2),
    notes:"FLSA + IDEA: Max 30 periods/week · 5/day · 40 hrs/week · 180 school days/year · Every Student Succeeds Act",
    regulation:"FLSA 1938 + IDEA 2004 + ESSA 2015",
    links:[
      { label:"ESSA — US Dept of Education (Official)", url:"https://www.ed.gov/essa" },
      { label:"FLSA Teacher Exemptions (DOL)", url:"https://www.dol.gov/agencies/whd/flsa" },
      { label:"IDEA — Special Education Law", url:"https://sites.ed.gov/idea/" },
    ]},
  GB: { maxPeriodsWeek:32, maxPeriodsDay:5, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:hrs(5,60,60,15,2),
    notes:"STPCD 2023: Max 32 periods/week · 1265 directed hours/year · 10% PPA time guaranteed · 195 working days",
    regulation:"School Teachers Pay and Conditions Document (STPCD) 2023",
    links:[
      { label:"STPCD 2023 — GOV.UK (Official PDF)", url:"https://www.gov.uk/government/publications/school-teachers-pay-and-conditions" },
      { label:"Working Time Regs — Teacher Guidance", url:"https://www.gov.uk/government/publications/teacher-workload-advisory-group-report-and-government-response" },
      { label:"DfE School Workforce Guidance", url:"https://www.gov.uk/government/collections/school-workforce" },
    ]},
  AU: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:60, lunchMinutes:40, breakMinutes:20, numBreaks:2, hoursPerWeek:hrs(5,60,40,20,2),
    notes:"Fair Work Act 2009: Max 30 periods/week · 38 hrs/week · 200 school days/year · State EAs vary",
    regulation:"Fair Work Act 2009 + Australian Education Act 2013",
    links:[
      { label:"Fair Work Act 2009 — Federal Register", url:"https://www.legislation.gov.au/Details/C2023C00014" },
      { label:"AITSL Teaching Standards", url:"https://www.aitsl.edu.au/teach/standards" },
      { label:"Australian Education Act 2013", url:"https://www.legislation.gov.au/Details/C2022C00172" },
    ]},
  AE: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:45, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:hrs(5,45,30,15,2),
    notes:"MoE UAE 2021: Max 30/week · 36 hrs/week · Friday off · Arabic instruction mandatory · Islamic studies required",
    regulation:"UAE MoE Cabinet Decision 2021",
    links:[
      { label:"UAE Ministry of Education (Official)", url:"https://www.moe.gov.ae" },
      { label:"KHDA School Inspection Framework", url:"https://www.khda.gov.ae/en/schools" },
      { label:"UAE Labour Law (MOHRE)", url:"https://www.mohre.gov.ae/en/laws-and-regulations/laws.aspx" },
    ]},
  SG: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:35, lunchMinutes:40, breakMinutes:10, numBreaks:2, hoursPerWeek:hrs(5,35,40,10,2),
    notes:"MOE Singapore 2023: Max 30/week · Recess 30 min mandatory · 200 school days · Character & Citizenship Education required",
    regulation:"MOE Singapore Teacher Workload Framework 2023",
    links:[
      { label:"MOE Singapore — Teacher Workload (Official)", url:"https://www.moe.gov.sg/careers/become-teachers/secondary-school-teachers/teacher-workload" },
      { label:"Singapore Employment Act (MOM)", url:"https://www.mom.gov.sg/employment-practices/employment-act" },
      { label:"MOE Curriculum Planning Guide", url:"https://www.moe.gov.sg/education-in-sg/our-programmes" },
    ]},
  NG: { maxPeriodsWeek:36, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek:hrs(6,40,30,10,3),
    notes:"FME Nigeria: Max 36/week · 40 hrs/week · WAEC curriculum · TRCN teacher registration mandatory",
    regulation:"Federal Ministry of Education Nigeria + Labour Act Cap 198",
    links:[
      { label:"Federal Ministry of Education Nigeria", url:"https://education.gov.ng" },
      { label:"TRCN Teacher Registration Council", url:"https://trcn.gov.ng" },
      { label:"Nigeria Labour Act (FIRS)", url:"https://www.ilo.org/dyn/natlex/natlex4.detail?p_lang=en&p_isn=21220" },
    ]},
  DE: { maxPeriodsWeek:28, maxPeriodsDay:5, periodDuration:45, lunchMinutes:45, breakMinutes:15, numBreaks:3, hoursPerWeek:hrs(5,45,45,15,3),
    notes:"EU WTD + KMK: Max 28 SWS/week · 41 hrs/week · 45-min Unterrichtsstunde · Pflichtstunden vary by state",
    regulation:"EU Working Time Directive 2003/88/EC + KMK Beschlüsse",
    links:[
      { label:"KMK — Kultusministerkonferenz (Official)", url:"https://www.kmk.org/themen/allgemeinbildende-schulen/unterricht/unterrichtszeiten.html" },
      { label:"EU Working Time Directive 2003/88/EC", url:"https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32003L0088" },
      { label:"Arbeitszeitgesetz (ArbZG) — Bundesrecht", url:"https://www.gesetze-im-internet.de/arbzg/" },
    ]},
  PK: { maxPeriodsWeek:36, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek:hrs(6,40,30,10,3),
    notes:"HEC Pakistan: Max 36/week · 6/day · Friday Juma break mandatory · ETEA/PPSC teacher recruitment",
    regulation:"Higher Education Commission Pakistan + Factories Act 1934",
    links:[
      { label:"HEC Pakistan — Official", url:"https://www.hec.gov.pk" },
      { label:"Ministry of Federal Education Pakistan", url:"https://mofept.gov.pk" },
      { label:"Pakistan Factories Act 1934 (ILO)", url:"https://www.ilo.org/dyn/natlex/natlex4.detail?p_lang=en&p_isn=781" },
    ]},
  BD: { maxPeriodsWeek:36, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek:hrs(6,40,30,10,3),
    notes:"NCTB Bangladesh: Max 36/week · 220 school days/year · National Curriculum 2022",
    regulation:"NCTB + Bangladesh Labour Act 2006",
    links:[
      { label:"NCTB — National Curriculum Bangladesh", url:"https://nctb.gov.bd" },
      { label:"Directorate of Secondary & Higher Education", url:"https://www.dshe.gov.bd" },
      { label:"Bangladesh Labour Act 2006", url:"https://www.ilo.org/dyn/natlex/natlex4.detail?p_isn=74481" },
    ]},
  CA: { maxPeriodsWeek:30, maxPeriodsDay:5, periodDuration:60, lunchMinutes:45, breakMinutes:15, numBreaks:2, hoursPerWeek:hrs(5,60,45,15,2),
    notes:"Provincial (Ontario): Max 30/week · 194 instructional days · 300 min instruction/day",
    regulation:"Ontario Education Act + Canada Labour Code",
    links:[
      { label:"Ontario Education Act (e-Laws)", url:"https://www.ontario.ca/laws/statute/90e02" },
      { label:"Canada Labour Code — Justice Canada", url:"https://laws-lois.justice.gc.ca/eng/acts/L-2/" },
      { label:"ETFO Teacher Working Conditions", url:"https://www.etfo.ca/bargaining-collective-agreements" },
    ]},
  JP: { maxPeriodsWeek:28, maxPeriodsDay:5, periodDuration:45, lunchMinutes:45, breakMinutes:10, numBreaks:2, hoursPerWeek:hrs(5,45,45,10,2),
    notes:"MEXT Japan: Max 28/week · 5/day · 35 instructional weeks/year · Tokkatsu (homeroom) mandatory",
    regulation:"Ministry of Education MEXT + Labour Standards Act",
    links:[
      { label:"MEXT Japan — School Education (Official)", url:"https://www.mext.go.jp/en/policy/education/elsec/title01/detail01/index.htm" },
      { label:"Japan Labour Standards Act (MHLW)", url:"https://www.mhlw.go.jp/english/org/policy/p04-01.html" },
      { label:"MEXT Teacher Working Hours Survey", url:"https://www.mext.go.jp/a_menu/shotou/kyoin/1388767.htm" },
    ]},
  FR: { maxPeriodsWeek:26, maxPeriodsDay:5, periodDuration:55, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:hrs(5,55,60,15,2),
    notes:"MEN France: 26 hrs/week · No school Wednesday PM · 36 school weeks/year · ORS (obligations réglementaires de service)",
    regulation:"Code de l'Éducation + Décret no 2014-940",
    links:[
      { label:"Décret ORS Enseignants 2014-940 (Légifrance)", url:"https://www.legifrance.gouv.fr/loda/id/JORFTEXT000029400603" },
      { label:"Code de l'Éducation — Légifrance", url:"https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006071191/" },
      { label:"Ministère de l'Éducation Nationale", url:"https://www.education.gouv.fr" },
    ]},
  ZA: { maxPeriodsWeek:35, maxPeriodsDay:7, periodDuration:30, lunchMinutes:40, breakMinutes:10, numBreaks:3, hoursPerWeek:hrs(7,30,40,10,3),
    notes:"SACE: Max 35/week · 7/day · 196 school days · CAPS curriculum · Post level determines workload",
    regulation:"SACE + BCEA 1997 + Employment of Educators Act",
    links:[
      { label:"SACE — South African Council for Educators", url:"https://www.sace.org.za" },
      { label:"Basic Conditions of Employment Act 1997", url:"https://www.labour.gov.za/DocumentCenter/Acts/Basic%20Conditions%20of%20Employment/BCEA_75_of_1997.pdf" },
      { label:"DBE South Africa — Curriculum", url:"https://www.education.gov.za" },
    ]},
  DEFAULT: { maxPeriodsWeek:30, maxPeriodsDay:6, periodDuration:40, lunchMinutes:30, breakMinutes:10, numBreaks:3, hoursPerWeek:hrs(6,40,30,10,3),
    notes:"General school standard — customize as per your national education authority",
    regulation:"Please set your local education authority standard",
    links:[
      { label:"ILO — Education Sector Labour Standards", url:"https://www.ilo.org/sector/Activities/sectors/education/lang--en/index.htm" },
      { label:"UNESCO — Teachers (Global)", url:"https://www.unesco.org/en/education/teachers" },
    ]},
}

const COLLEGE: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:16, maxPeriodsDay:4, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:hrs(4,60,60,15,2),
    notes:"UGC 2023: Max 16 lectures/week · 40 working hrs · 30 teaching days/semester · NET/SET mandatory",
    regulation:"UGC Regulations 2010 (amended 2023) + AICTE norms",
    links:[
      { label:"UGC Regulations 2010 (Official PDF)", url:"https://www.ugc.gov.in/pdfnews/6452625_UGC-Regulations-2010.pdf" },
      { label:"UGC — University Grants Commission", url:"https://www.ugc.gov.in" },
      { label:"AICTE Approval Process Handbook", url:"https://www.aicte-india.org/approval/documents" },
    ]},
  US: { maxPeriodsWeek:15, maxPeriodsDay:3, periodDuration:75, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:hrs(3,75,60,15,2),
    notes:"AAUP standard: 12–15 credit hrs/week · 40 hrs total · 16-week semesters · Research time protected",
    regulation:"AAUP Guidelines + HEA 1965",
    links:[
      { label:"AAUP — Faculty Workload Statement", url:"https://www.aaup.org/report/faculty-workload-statement" },
      { label:"US Dept of Education — Higher Ed", url:"https://www.ed.gov/higher" },
      { label:"FLSA Higher Education Exemptions", url:"https://www.dol.gov/agencies/whd/flsa/overtime/fs17e_professional" },
    ]},
  GB: { maxPeriodsWeek:18, maxPeriodsDay:4, periodDuration:50, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:hrs(4,50,60,15,2),
    notes:"UCU UK: Max 18 contact hrs/week · 37.5 hrs total · Research & scholarship time protected · REF compliance",
    regulation:"UCU Framework Agreement + Working Time Regulations 1998",
    links:[
      { label:"UCU — University & College Union", url:"https://www.ucu.org.uk/workload" },
      { label:"Working Time Regulations 1998 (legislation.gov.uk)", url:"https://www.legislation.gov.uk/uksi/1998/1833/contents/made" },
      { label:"OfS — Office for Students UK", url:"https://www.officeforstudents.org.uk" },
    ]},
  DEFAULT: { maxPeriodsWeek:16, maxPeriodsDay:4, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:hrs(4,60,60,15,2),
    notes:"General college/university standard — customize as per your institution and accreditation body",
    regulation:"Please set your local university authority standard",
    links:[
      { label:"IAU — International Association of Universities", url:"https://www.iau-aiu.net" },
      { label:"ILO — Higher Education Guidelines", url:"https://www.ilo.org/global/industries-and-sectors/education/lang--en/index.htm" },
    ]},
}

const CORPORATE: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:3, hoursPerWeek:48,
    notes:"Factories Act 1948: Max 48 hrs/week · 9 hrs/day · 30-min lunch if >5 hrs continuous · Overtime at double rate",
    regulation:"Factories Act 1948 + Code on Wages 2019 + Industrial Disputes Act",
    links:[
      { label:"Factories Act 1948 — India Code (Official)", url:"https://www.indiacode.nic.in/handle/123456789/1530" },
      { label:"Code on Wages 2019 — Ministry of Labour", url:"https://labour.gov.in/whatsnew/code-wages-2019" },
      { label:"EPFO — Employees Provident Fund", url:"https://www.epfindia.gov.in" },
    ]},
  US: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40,
    notes:"FLSA: 40 hrs/week standard · OT 1.5x after 40 hrs · No federal mandated lunch break (state laws vary)",
    regulation:"Fair Labor Standards Act (FLSA) 1938 + State labor laws",
    links:[
      { label:"FLSA — Dept of Labor (Official)", url:"https://www.dol.gov/agencies/whd/flsa" },
      { label:"DOL Break Time Requirements by State", url:"https://www.dol.gov/agencies/whd/state/meal-breaks" },
      { label:"OSHA Workplace Safety Standards", url:"https://www.osha.gov/workers" },
    ]},
  GB: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:20, breakMinutes:15, numBreaks:2, hoursPerWeek:48,
    notes:"WTR 1998: Max 48 hrs/week (opt-out available) · 20-min rest if >6 hrs work · 11-hr daily rest required",
    regulation:"Working Time Regulations 1998 + Employment Rights Act 1996",
    links:[
      { label:"Working Time Regulations 1998 (legislation.gov.uk)", url:"https://www.legislation.gov.uk/uksi/1998/1833/contents/made" },
      { label:"ACAS Working Hours Guidance", url:"https://www.acas.org.uk/working-hours" },
      { label:"GOV.UK — Maximum Weekly Working Hours", url:"https://www.gov.uk/maximum-weekly-working-hours" },
    ]},
  AU: { maxPeriodsWeek:38, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:38,
    notes:"NES: 38 ordinary hrs/week · Reasonable additional hrs possible · 30-min meal break if >5 hrs continuous",
    regulation:"Fair Work Act 2009 + National Employment Standards (NES)",
    links:[
      { label:"Fair Work Act 2009 — Federal Register", url:"https://www.legislation.gov.au/Details/C2023C00014" },
      { label:"Fair Work Ombudsman — Hours of Work", url:"https://www.fairwork.gov.au/employee-entitlements/hours-of-work-breaks-and-rosters" },
      { label:"NES — National Employment Standards", url:"https://www.fairwork.gov.au/employment-conditions/national-employment-standards" },
    ]},
  AE: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:48,
    notes:"UAE Labour Law 2021: 48 hrs/week · 36 hrs in Ramadan · Friday rest day · Annual leave 30 days after 1 year",
    regulation:"UAE Federal Decree-Law No. 33 of 2021",
    links:[
      { label:"UAE Labour Law — MOHRE Official", url:"https://www.mohre.gov.ae/en/laws-and-regulations/laws.aspx" },
      { label:"Federal Decree-Law No. 33/2021 (Full Text)", url:"https://u.ae/en/information-and-services/jobs/labour-law" },
      { label:"MOHRE — Ministry of Human Resources UAE", url:"https://www.mohre.gov.ae" },
    ]},
  DE: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40,
    notes:"ArbZG: Max 8 hrs/day (10 with compensation) · 30-min break >6 hrs · 45-min >9 hrs · 11-hr rest required",
    regulation:"Arbeitszeitgesetz (ArbZG) + Betriebsverfassungsgesetz",
    links:[
      { label:"Arbeitszeitgesetz — Gesetze im Internet (Official)", url:"https://www.gesetze-im-internet.de/arbzg/" },
      { label:"BMAS — Federal Ministry of Labour Germany", url:"https://www.bmas.de/EN/Home/home.html" },
      { label:"DGB — German Trade Union Confederation", url:"https://www.dgb.de/themen/arbeitszeit" },
    ]},
  SG: { maxPeriodsWeek:44, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:44,
    notes:"EA Singapore: Max 44 hrs/week · OT max 72 hrs/month · 1 rest day/week · OT rate 1.5x",
    regulation:"Employment Act (Cap 91A) Singapore",
    links:[
      { label:"Employment Act — MOM Singapore (Official)", url:"https://www.mom.gov.sg/employment-practices/employment-act" },
      { label:"MOM — Hours of Work & Overtime", url:"https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days" },
      { label:"TAFEP Singapore Workplace Fairness", url:"https://www.tafep.sg" },
    ]},
  DEFAULT: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40,
    notes:"Standard 40-hr work week — customize as per your local labour law and collective agreement",
    regulation:"Please set your local labour law standard",
    links:[
      { label:"ILO — Hours of Work Convention C001", url:"https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:C001" },
      { label:"ILO — Working Time Database", url:"https://www.ilo.org/travail/areasofwork/working-time/lang--en/index.htm" },
    ]},
}

const HOSPITAL: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:20, numBreaks:3, hoursPerWeek:48,
    notes:"NMC 2019: Max 48 hrs/week · 12-hr shifts · On-call tracked separately · Resident duty 80 hrs/2 weeks max",
    regulation:"NMC Act 2019 + MCI Regulations + Factories Act 1948",
    links:[
      { label:"NMC — National Medical Commission (Official)", url:"https://www.nmc.org.in" },
      { label:"MCI Postgraduate Regulations", url:"https://www.nmc.org.in/rules-regulations/regulations" },
      { label:"Ministry of Health & Family Welfare India", url:"https://main.mohfw.gov.in" },
    ]},
  US: { maxPeriodsWeek:36, maxPeriodsDay:12, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:36,
    notes:"ACGME: 12-hr shifts (3×/week) · Resident duty max 80 hrs/2 weeks · 10-hr rest between shifts",
    regulation:"ACGME Resident Duty Hour Standards + JCAHO + FLSA",
    links:[
      { label:"ACGME Duty Hour Requirements (Official)", url:"https://www.acgme.org/what-we-do/accreditation/duty-hours/" },
      { label:"Joint Commission (JCAHO) Standards", url:"https://www.jointcommission.org/standards/" },
      { label:"CMS Conditions of Participation", url:"https://www.cms.gov/Regulations-and-Guidance/Legislation/CFCsAndCoPs" },
    ]},
  GB: { maxPeriodsWeek:48, maxPeriodsDay:12, periodDuration:60, lunchMinutes:30, breakMinutes:20, numBreaks:2, hoursPerWeek:48,
    notes:"NHS: 48 hrs/week (WTD) · 12-hr shifts · Junior doctor EWTD compliance mandatory · Rest 11 hrs between shifts",
    regulation:"NHS Terms and Conditions + EU Working Time Directive",
    links:[
      { label:"NHS Terms & Conditions of Service (Official)", url:"https://www.nhsemployers.org/articles/agenda-change-pay-rates" },
      { label:"BMA Junior Doctor Contract", url:"https://www.bma.org.uk/pay-and-contracts/contracts/junior-doctor-contract" },
      { label:"CQC — Care Quality Commission Standards", url:"https://www.cqc.org.uk/guidance-providers/regulations-enforcement" },
    ]},
  AU: { maxPeriodsWeek:38, maxPeriodsDay:10, periodDuration:60, lunchMinutes:30, breakMinutes:20, numBreaks:2, hoursPerWeek:38,
    notes:"AHPRA: 38 hr base + reasonable OT · 10-hr shifts common · Fatigue risk management mandatory",
    regulation:"AHPRA + Fair Work Act 2009 + Work Health & Safety Act",
    links:[
      { label:"AHPRA — Australian Health Practitioner Agency", url:"https://www.ahpra.gov.au" },
      { label:"AMA Working Hours Policy", url:"https://www.ama.com.au/articles/ama-position-statement-hours-work-2016" },
      { label:"Safe Work Australia — Healthcare", url:"https://www.safeworkaustralia.gov.au/industries-and-occupations/healthcare" },
    ]},
  DEFAULT: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:20, numBreaks:3, hoursPerWeek:48,
    notes:"Standard healthcare schedule — customize as per your local health authority and accreditation body",
    regulation:"Please set your local health authority standard",
    links:[
      { label:"WHO — Health Workforce Guidelines", url:"https://www.who.int/health-topics/health-workforce" },
      { label:"ILO — Healthcare Sector Standards", url:"https://www.ilo.org/global/industries-and-sectors/health-services/lang--en/index.htm" },
    ]},
}

const NGO: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:60, breakMinutes:15, numBreaks:2, hoursPerWeek:40,
    notes:"NGO India: 40 hrs/week · FCRA compliance for foreign funds · CSR reporting mandatory if CSR-funded",
    regulation:"Societies Registration Act + FCRA 2010 + Labour Laws",
    links:[
      { label:"FCRA 2010 — MHA India (Official)", url:"https://fcraonline.nic.in" },
      { label:"Societies Registration Act — India Code", url:"https://www.indiacode.nic.in/handle/123456789/1499" },
      { label:"NITI Aayog NGO Darpan Portal", url:"https://ngodarpan.gov.in" },
    ]},
  US: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40,
    notes:"FLSA applies to 501(c)(3): 40 hrs/week · OT exemptions possible for certain roles · IRS Form 990 required",
    regulation:"FLSA 1938 + IRS 501(c)(3) + State nonprofit laws",
    links:[
      { label:"IRS — Tax-Exempt Organizations 501(c)(3)", url:"https://www.irs.gov/charities-non-profits/charitable-organizations" },
      { label:"DOL FLSA Nonprofits Guide", url:"https://www.dol.gov/agencies/whd/non-profit" },
      { label:"National Council of Nonprofits", url:"https://www.councilofnonprofits.org/running-nonprofit/employment-hr/employment-law" },
    ]},
  DEFAULT: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:45, breakMinutes:15, numBreaks:2, hoursPerWeek:40,
    notes:"Standard NGO schedule — customize per organizational policy and local labour law",
    regulation:"Please set your local labour law and organizational standard",
    links:[
      { label:"ILO — NGO & Civil Society Labour Standards", url:"https://www.ilo.org/global/topics/civil-society/lang--en/index.htm" },
      { label:"UN Volunteer Standards", url:"https://www.unv.org" },
    ]},
}

const FACTORY: Record<string, StandardData> = {
  IN: { maxPeriodsWeek:48, maxPeriodsDay:9, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:3, hoursPerWeek:48,
    notes:"Factories Act 1948: Max 48 hrs/week · 9 hrs/day · No continuous work >5 hrs · OT at double rate · Women: no night shift without consent",
    regulation:"Factories Act 1948 + OSH Code 2020 + Code on Wages 2019",
    links:[
      { label:"Factories Act 1948 — India Code (Official)", url:"https://www.indiacode.nic.in/handle/123456789/1530" },
      { label:"OSH Code 2020 — Ministry of Labour", url:"https://labour.gov.in/whatsnew/occupational-safety-health-and-working-conditions-code-2020" },
      { label:"Labour Bureau India — Factory Statistics", url:"https://labourbureau.gov.in" },
    ]},
  US: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40,
    notes:"OSHA + FLSA: 40 hrs standard · OT 1.5x after 40 hrs · OSHA safety standards mandatory · Hazard pay varies",
    regulation:"FLSA + OSHA Act 1970 + State factory laws",
    links:[
      { label:"OSHA — Occupational Safety (Official)", url:"https://www.osha.gov" },
      { label:"FLSA Overtime Rules — DOL", url:"https://www.dol.gov/agencies/whd/overtime" },
      { label:"NIOSH — National Institute Safety", url:"https://www.cdc.gov/niosh" },
    ]},
  GB: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:20, breakMinutes:15, numBreaks:2, hoursPerWeek:48,
    notes:"WTR 1998: Max 48 hrs/week · 20-min rest >6 hrs · Night shift premium · HSE safety compliance mandatory",
    regulation:"Working Time Regulations 1998 + HASAWA 1974",
    links:[
      { label:"HSE — Health & Safety Executive UK (Official)", url:"https://www.hse.gov.uk/working-time-directive" },
      { label:"Health & Safety at Work Act 1974", url:"https://www.legislation.gov.uk/ukpga/1974/37/contents" },
      { label:"ACAS Factory & Manufacturing Hours", url:"https://www.acas.org.uk" },
    ]},
  DE: { maxPeriodsWeek:40, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:2, hoursPerWeek:40,
    notes:"ArbZG: Max 48 hrs/week (8 normal) · Mandatory safety breaks · IG Metall Tarifvertrag applies",
    regulation:"Arbeitszeitgesetz + Arbeitsschutzgesetz + IG Metall",
    links:[
      { label:"Arbeitszeitgesetz — Official Text", url:"https://www.gesetze-im-internet.de/arbzg/" },
      { label:"BAuA — Federal Institute Occupational Safety", url:"https://www.baua.de/EN/Home/Home_node.html" },
      { label:"IG Metall — Metal Workers Union", url:"https://www.igmetall.de/tarifvertraege" },
    ]},
  DEFAULT: { maxPeriodsWeek:48, maxPeriodsDay:8, periodDuration:60, lunchMinutes:30, breakMinutes:15, numBreaks:3, hoursPerWeek:48,
    notes:"Standard factory/shift schedule — customize as per your local Factories Act and safety regulations",
    regulation:"Please set your local factories act / labour law",
    links:[
      { label:"ILO — Factories & Industry Conventions", url:"https://www.ilo.org/global/standards/subjects-covered-by-international-labour-standards/working-time/lang--en/index.htm" },
      { label:"ILO — Hours of Work Industry Convention C030", url:"https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:C030" },
    ]},
}

const DB: Record<string, Record<string, StandardData>> = {
  school: SCHOOL, college: COLLEGE, corporate: CORPORATE,
  hospital: HOSPITAL, ngo: NGO, factory: FACTORY,
}

export function getStandard(orgType: string, countryCode: string): StandardData {
  const orgDB = DB[orgType] ?? DB.school
  return orgDB[countryCode] ?? orgDB.DEFAULT ?? SCHOOL.DEFAULT
}
