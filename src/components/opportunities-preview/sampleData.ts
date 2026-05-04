import { Briefcase, Building2, FileText, Gavel, Trophy, type LucideIcon } from "lucide-react";

export type OpportunityStream = "internship" | "job" | "cfp" | "moot" | "competition";

interface BaseOpp {
  id: string;
  stream: OpportunityStream;
  posted_at: string;
  source_credit: string;
  description?: string;
}

export interface VacancyLike extends BaseOpp {
  stream: "internship" | "job";
  firm_name: string;
  role: string;
  location?: string;
  stipend?: string;
  eligibility?: string;
  expires_at: string;
  application_email: string;
}

export interface CfpOpp extends BaseOpp {
  stream: "cfp";
  publication_name: string;
  publication_type: "journal" | "blog" | "book_chapter" | "magazine";
  theme?: string;
  deadline: string;
  word_limit_min?: number;
  word_limit_max?: number;
  co_authorship_allowed: boolean;
  submission_fee: string;
  submission_url?: string;
  submission_email?: string;
  peer_reviewed: boolean;
  eligibility?: string;
}

export interface MootOpp extends BaseOpp {
  stream: "moot";
  competition_name: string;
  organiser: string;
  edition?: string;
  area_of_law: string;
  mode: "online" | "offline" | "hybrid";
  venue?: string;
  event_start_date: string;
  event_end_date: string;
  deadline: string; // registration_deadline
  memorial_deadline?: string;
  team_size_min: number;
  team_size_max: number;
  registration_fee: string;
  prize_pool: string;
  registration_url?: string;
  contact_email?: string;
  eligibility?: string;
}

export interface CompetitionOpp extends BaseOpp {
  stream: "competition";
  title: string;
  category:
    | "essay"
    | "mun"
    | "adr"
    | "negotiation"
    | "fellowship"
    | "scholarship"
    | "grant"
    | "pro_bono"
    | "workshop"
    | "course"
    | "event"
    | "other";
  organiser: string;
  deadline: string;
  event_date?: string;
  mode: "online" | "offline" | "hybrid";
  prize_or_stipend: string;
  fee: string;
  application_url?: string;
  contact_email?: string;
  eligibility?: string;
}

export type AnyOpportunity = VacancyLike | CfpOpp | MootOpp | CompetitionOpp;

export const STREAM_META: Record<
  OpportunityStream,
  { pillLabel: string; pillBg: string; pillText: string; accentBg: string; icon: LucideIcon }
> = {
  internship: {
    pillLabel: "Internship",
    pillBg: "bg-accent",
    pillText: "text-accent-foreground",
    accentBg: "bg-accent",
    icon: Briefcase,
  },
  job: {
    pillLabel: "Full-time",
    pillBg: "bg-foreground",
    pillText: "text-background",
    accentBg: "bg-foreground",
    icon: Building2,
  },
  cfp: {
    pillLabel: "Call for Papers",
    pillBg: "bg-transparent border-2 border-accent",
    pillText: "text-accent",
    accentBg: "bg-accent/60",
    icon: FileText,
  },
  moot: {
    pillLabel: "Moot",
    pillBg: "bg-transparent border-2 border-foreground",
    pillText: "text-foreground",
    accentBg: "bg-foreground/70",
    icon: Gavel,
  },
  competition: {
    pillLabel: "Competition",
    pillBg: "bg-accent/20 border-2 border-accent",
    pillText: "text-accent",
    accentBg: "bg-gradient-to-b from-accent to-foreground",
    icon: Trophy,
  },
};

const dPlus = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
const dMinus = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

export const SAMPLE_DATA: AnyOpportunity[] = [
  // ---------- Vacancies ----------
  {
    id: "v1",
    stream: "internship",
    posted_at: dMinus(1),
    source_credit: "Firm direct",
    firm_name: "Trilegal",
    role: "Disputes Intern (Mumbai)",
    location: "Mumbai",
    stipend: "₹25,000/mo",
    eligibility: "4th–5th year LL.B.",
    expires_at: dPlus(8),
    application_email: "internships@trilegal.com",
    description:
      "Six-week internship across the disputes team. Exposure to high-stakes commercial arbitration and white-collar work.",
  },
  {
    id: "v2",
    stream: "job",
    posted_at: dMinus(2),
    source_credit: "Referral",
    firm_name: "AZB & Partners",
    role: "Associate — Banking & Finance",
    location: "Bengaluru",
    stipend: "Market",
    eligibility: "0–2 PQE",
    expires_at: dPlus(20),
    application_email: "careers@azbpartners.com",
    description: "Associate role with the BFSI practice. Strong drafting and transactional exposure.",
  },
  {
    id: "v3",
    stream: "internship",
    posted_at: dMinus(3),
    source_credit: "Locus curated",
    firm_name: "Veritas Legal",
    role: "Corporate M&A Intern",
    location: "Mumbai",
    stipend: "₹20,000/mo",
    eligibility: "4th year+",
    expires_at: dPlus(3),
    application_email: "hr@veritaslegal.in",
  },

  // ---------- CFPs ----------
  {
    id: "c1",
    stream: "cfp",
    posted_at: dMinus(1),
    source_credit: "Editor outreach",
    publication_name: "NLSIR Vol. 38",
    publication_type: "journal",
    theme: "Constitutionalism in the Age of AI",
    deadline: dPlus(45),
    word_limit_min: 6000,
    word_limit_max: 10000,
    co_authorship_allowed: true,
    submission_fee: "Free",
    submission_url: "https://nlsir.com/submissions",
    peer_reviewed: true,
    eligibility: "Open to academics, practitioners and students",
    description:
      "The flagship issue of the NLS Indian Review invites submissions exploring the intersection of constitutional law and emerging AI governance.",
  },
  {
    id: "c2",
    stream: "cfp",
    posted_at: dMinus(2),
    source_credit: "Locus curated",
    publication_name: "SCC OnLine Blog",
    publication_type: "blog",
    deadline: dPlus(180),
    word_limit_min: 1200,
    word_limit_max: 2500,
    co_authorship_allowed: false,
    submission_fee: "Free",
    submission_email: "blog@scconline.com",
    peer_reviewed: false,
    description: "Rolling submissions on contemporary case comments and short-form analysis.",
  },
  {
    id: "c3",
    stream: "cfp",
    posted_at: dMinus(4),
    source_credit: "Editor outreach",
    publication_name: "Indian Journal of Constitutional Law",
    publication_type: "journal",
    theme: "Federalism: Fault Lines & Futures",
    deadline: dPlus(6),
    word_limit_min: 5000,
    word_limit_max: 8000,
    co_authorship_allowed: true,
    submission_fee: "Free",
    submission_url: "https://ijcl.nalsar.ac.in/submit",
    peer_reviewed: true,
  },

  // ---------- Moots ----------
  {
    id: "m1",
    stream: "moot",
    posted_at: dMinus(2),
    source_credit: "Organiser",
    competition_name: "Vis Vienna Pre-Moot, Bengaluru",
    organiser: "NLSIU Bengaluru",
    edition: "12th edition",
    area_of_law: "International Commercial Arbitration",
    mode: "offline",
    venue: "NLSIU Campus, Bengaluru",
    event_start_date: "2026-02-14",
    event_end_date: "2026-02-16",
    deadline: dPlus(25),
    memorial_deadline: dPlus(40),
    team_size_min: 3,
    team_size_max: 5,
    registration_fee: "₹6,000 / team",
    prize_pool: "₹1,50,000 + Vienna travel grant",
    registration_url: "https://visvienna.nls.ac.in",
    description:
      "Premier pre-moot for the Willem C. Vis International Commercial Arbitration Moot. Open to all law schools in India.",
    eligibility: "3-year and 5-year LL.B. teams",
  },
  {
    id: "m2",
    stream: "moot",
    posted_at: dMinus(5),
    source_credit: "Locus curated",
    competition_name: "Manfred Lachs Space Law Moot — Asia-Pacific Round",
    organiser: "IISL & NALSAR",
    edition: "20th",
    area_of_law: "Public International Law",
    mode: "hybrid",
    venue: "NALSAR Hyderabad + online",
    event_start_date: "2026-04-08",
    event_end_date: "2026-04-11",
    deadline: dPlus(60),
    team_size_min: 3,
    team_size_max: 4,
    registration_fee: "$50",
    prize_pool: "Travel to World Finals at IAC",
  },
  {
    id: "m3",
    stream: "moot",
    posted_at: dMinus(7),
    source_credit: "Organiser",
    competition_name: "GNLU Online IP Moot",
    organiser: "Gujarat National Law University",
    area_of_law: "Intellectual Property",
    mode: "online",
    event_start_date: "2026-03-01",
    event_end_date: "2026-03-03",
    deadline: dPlus(2),
    team_size_min: 2,
    team_size_max: 3,
    registration_fee: "₹2,500",
    prize_pool: "₹50,000",
    registration_url: "https://gnlu.ac.in/ipmoot",
  },

  // ---------- Competitions / Fellowships ----------
  {
    id: "x1",
    stream: "competition",
    posted_at: dMinus(1),
    source_credit: "Vidhi outreach",
    title: "Vidhi Fellowship — Public Law",
    category: "fellowship",
    organiser: "Vidhi Centre for Legal Policy",
    deadline: dPlus(35),
    mode: "offline",
    prize_or_stipend: "₹70,000/mo + benefits",
    fee: "Free to apply",
    application_url: "https://vidhilegalpolicy.in/careers",
    eligibility: "0–3 years PQE, strong writing portfolio",
    description:
      "12-month fellowship working on public law research, court interventions and policy memos with Vidhi's litigation team.",
  },
  {
    id: "x2",
    stream: "competition",
    posted_at: dMinus(3),
    source_credit: "Locus curated",
    title: "Bar Council Essay Prize 2026",
    category: "essay",
    organiser: "Bar Council of India",
    deadline: dPlus(14),
    mode: "online",
    prize_or_stipend: "₹1,00,000 + publication",
    fee: "Free",
    application_url: "https://barcouncilofindia.org/essay",
    eligibility: "All enrolled advocates and law students",
  },
  {
    id: "x3",
    stream: "competition",
    posted_at: dMinus(6),
    source_credit: "Organiser",
    title: "South Asia Negotiation Tournament",
    category: "negotiation",
    organiser: "JGLS Sonipat",
    deadline: dPlus(5),
    event_date: "2026-03-22",
    mode: "hybrid",
    prize_or_stipend: "₹40,000 + Singapore round entry",
    fee: "₹3,000 / team",
    contact_email: "negotiations@jgu.edu.in",
  },
];
