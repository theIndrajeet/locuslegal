import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Download, Clock, Users, Layers, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

type Audience = "Students" | "Firms" | "Institutions";
type Filter = "All" | Audience;

interface GuideAttachment {
  label: string;
  href: string;
  comingSoon?: boolean;
}

interface GuideSection {
  heading: string;
  body: string;
}

interface Guide {
  id: string;
  caseNumber: string;
  title: string;
  audience: Audience;
  stage: string;
  readTime: string;
  slug: string;
  sections: string[];
  content?: GuideSection[];
  pdfHref?: string;
  attachments?: GuideAttachment[];
}

const guideContent: Record<string, GuideSection[]> = {
  "1": [
    {
      heading: "Why most cold emails fail",
      body: "The average law firm partner receives dozens of internship requests every week. Most get deleted within seconds — not because the sender isn't qualified, but because the email reads like a mass-produced template. Generic subject lines like \"Internship Application\" or \"Seeking Internship Opportunity\" signal zero effort.\n\nThe biggest mistakes are writing about yourself instead of the firm, attaching a CV without context, and sending the same email to 50 firms. Partners can tell. If your email doesn't show that you've researched the firm and understand what they do, it's going straight to trash.\n\nThe good news? Because most students get this wrong, even a slightly personalised email stands out dramatically. The bar is low — you just need to clear it."
    },
    {
      heading: "Finding the right contact",
      body: "Never send a cold email to \"info@firmname.com\" or a generic HR address. These go into a black hole. Instead, find the specific person who would supervise interns in the practice area you're interested in.\n\nStart with the firm's website — most list their team with designations and practice areas. Look for Senior Associates or Partners in your target practice area. LinkedIn is your next best tool: search for \"[Firm Name] Associate\" and filter by location. Alumni networks are gold — if someone from your college works at the firm, that's your strongest entry point.\n\nIf you can't find a direct email, most Indian law firms follow predictable patterns: firstname.lastname@firm.com or firstname@firm.com. Tools like Hunter.io can help verify these."
    },
    {
      heading: "Writing the subject line",
      body: "Your subject line is the gatekeeper. It determines whether your email gets opened or ignored. Keep it specific, professional, and under 8 words.\n\nGood examples: \"3rd Year NLIU Student — Corporate Internship Query\" or \"Internship Application: IP Practice, June 2025.\" Bad examples: \"Internship Application\" or \"Request for Internship Opportunity at Your Esteemed Firm.\"\n\nThe formula that works: [Year & College] + [Practice Area] + [Purpose]. This tells the reader exactly who you are and what you want before they even open the email."
    },
    {
      heading: "The email structure",
      body: "Keep your email under 150 words. Lawyers are busy — respect their time. Use this four-part structure:\n\nOpener (1 sentence): State who you are and why you're writing. \"I'm a 3rd year student at [College] interested in a [duration] internship with your [practice area] team.\"\n\nHook (2-3 sentences): Show you've done your research. Reference a specific case the firm handled, an article the partner wrote, or a recent deal they closed. This is what separates you from everyone else.\n\nCredentials (2 sentences): Briefly mention your most relevant qualification — a moot court win, a relevant research paper, or prior internship experience. Don't list everything; pick the one thing that makes you right for this firm.\n\nClose (1 sentence): A clear, low-pressure ask. \"Would you be open to a brief conversation about potential internship opportunities?\" Attach your CV but don't make the email about it."
    },
    {
      heading: "Following up",
      body: "If you don't hear back within 5-7 business days, send exactly one follow-up. Not two, not three — one. The follow-up should be even shorter than your original email.\n\nKeep the same email thread (don't start a new one). Say something like: \"I wanted to follow up on my earlier email. I remain very interested in the opportunity to intern with your team. I'd be happy to share any additional information that might be helpful.\"\n\nIf you still don't hear back, move on. Silence is a response. Don't take it personally — it almost never means your email was bad. Partners are genuinely busy, and sometimes the timing just isn't right. Apply to your next target and keep going."
    },
  ],
  "2": [
    {
      heading: "Reframing the disadvantage",
      body: "Let's be honest: NLU graduates have a structural advantage. Brand recognition, alumni networks, and on-campus recruitment give them a head start. But here's what most non-NLU students don't realise — firms care far more about what you can do than where you studied.\n\nThe partners making hiring decisions at Tier 1 firms didn't all go to NLUs themselves. Many came from state universities and regional law colleges. They know that college name doesn't equal competence. What they're really filtering for is: Can this person write? Can they research? Will they show up on time and do the work?\n\nYour disadvantage is real, but it's smaller than you think. The gap isn't ability — it's access and awareness. This guide is about closing that gap."
    },
    {
      heading: "What firms actually look for",
      body: "Talk to any senior associate at a top firm and they'll tell you the same thing: they'd rather have an intern who writes well and works hard than one with a fancy college name who can't draft a basic email.\n\nThe top qualities firms evaluate are: writing ability (can you draft a clear, concise legal opinion?), research skills (can you find relevant case law and statutes efficiently?), reliability (do you meet deadlines without being chased?), and initiative (do you ask intelligent questions and volunteer for work?).\n\nNone of these are taught exclusively at NLUs. You can develop every single one of them through deliberate practice — mooting, writing for law journals, taking online courses, and doing internships at smaller firms to build your foundation."
    },
    {
      heading: "Building your portfolio",
      body: "Before you apply to top firms, build evidence that you can do the work. Start with 2-3 internships at smaller firms or district courts — these are easier to get and teach you practical skills that classroom learning never will.\n\nWrite. Publish articles on SCC Online, LiveLaw, or even a personal blog. Having 3-4 published pieces on legal topics shows you can research and articulate arguments. Enter moot court competitions — even if you don't win, the experience of drafting memorials and arguing is invaluable.\n\nCreate a portfolio document: a one-page summary of your internships, publications, moots, and any relevant certifications. This becomes your proof that college name aside, you've put in the work."
    },
    {
      heading: "Direct application strategy",
      body: "Without campus placements, you need to create your own opportunities. Here's the systematic approach that works:\n\nMake a list of 30-40 target firms. Include Tier 1 firms (your stretch targets), Tier 2 firms (realistic targets), and boutique/specialised firms (where your specific interests give you an edge). Research each firm: know their practice areas, recent matters, and key people.\n\nSend personalised cold emails (see LX-001) to 5-7 firms per week. Track every application in a spreadsheet — firm name, contact person, date sent, follow-up date, response. Apply to firms that post on job portals like Superlawyer, LawCtopus, and LinkedIn simultaneously.\n\nThe numbers game matters. If your response rate is 10% (which is good for cold emails), you need to send at least 30-40 emails to land 3-4 interviews."
    },
    {
      heading: "Making it stick",
      body: "Once you get an internship at a good firm, your job is to make them forget which college you came from. Show up early, stay late when needed, and deliver work before the deadline.\n\nAsk for feedback proactively. At the end of each week, ask your supervising associate: \"Is there anything I could have done differently this week?\" This shows maturity and a genuine desire to improve — qualities that stand out regardless of your college.\n\nBuild relationships, not just line items on your CV. Stay in touch with the associates and partners you work with. A genuine connection at one firm can open doors to three others through referrals. The legal community in India is smaller than you think — your reputation travels."
    },
  ],
  "3": [
    {
      heading: "Day one — what actually happens",
      body: "Your first day will feel overwhelming, and that's completely normal. Most firms don't have a formal onboarding process for interns — you'll likely be shown to a desk, given Wi-Fi access, and told to \"settle in.\"\n\nIntroduce yourself to everyone on your team — associates, other interns, even the office staff. Learn names. Ask your supervising associate what time they typically arrive and leave, what communication tools the firm uses (email, WhatsApp groups, internal systems), and whether there are any ongoing matters you should read up on.\n\nDon't expect to do meaningful legal work on day one. Use the time to understand the firm's culture, read recent work product if available, and set up your workspace. First impressions matter — dress professionally, be punctual, and show genuine enthusiasm without being overbearing."
    },
    {
      heading: "Types of work you'll be given",
      body: "Internship work at Indian law firms generally falls into four categories: research memos (finding and summarising relevant case law or statutory provisions on a specific question), drafting (contracts, letters, notices, or sections of larger documents), due diligence (reviewing documents in M&A or real estate transactions), and administrative tasks (organising files, preparing bundles for court).\n\nDon't turn your nose up at any of these. Even document review teaches you how deals are structured. Filing teaches you how litigation matters progress. Every task is a learning opportunity if you approach it with curiosity.\n\nThe quality of work you receive often depends on the quality of work you deliver. Nail the small tasks and you'll earn the trust to handle bigger ones. Fumble the basics and you'll be stuck with photocopying for the rest of your internship."
    },
    {
      heading: "How to ask questions properly",
      body: "Knowing when and how to ask questions is one of the most important skills you'll develop. The rule is simple: try to find the answer yourself first, then ask with context.\n\nBad question: \"What is Section 138 of the NI Act?\" (Google it.) Good question: \"I've read Section 138 and the Supreme Court's decision in Dashrath Rupsingh Rathod. The firm's client seems to fall under the amended jurisdiction rules, but I'm unsure whether the 2015 amendment applies retrospectively. Could you point me in the right direction?\"\n\nThe second question shows you've done the work. It tells your supervisor exactly where you're stuck and saves them time. Always write down the answer — asking the same question twice is a red flag.\n\nTiming matters too. Don't interrupt someone mid-draft or right before a court hearing. Batch your questions and ask during a natural break, or send a short email if the matter isn't urgent."
    },
    {
      heading: "Tracking your work",
      body: "Maintain a daily log of every task you work on. This isn't optional — it's the single most useful habit you can build during your internship. Record the date, the task description, the supervising associate, the deadline, and what you learned.\n\nThis log serves three purposes: it helps you write a meaningful internship report (many colleges require one), it gives you concrete talking points for future interviews (\"During my internship at X firm, I researched cross-border merger regulations under FEMA...\"), and it helps you track your own progress.\n\nUse the Monthly Internship Log template attached to this guide. At the end of each week, review your entries and note any patterns — are you getting better at research? Are your drafts requiring fewer revisions? This self-awareness accelerates your growth."
    },
    {
      heading: "End-of-internship checklist",
      body: "Your last week is as important as your first. Here's what to do before you leave:\n\nComplete all pending work and hand over any ongoing tasks with clear notes. Don't leave loose ends — this is the fastest way to damage your reputation.\n\nAsk for a certificate of completion and, if appropriate, a letter of recommendation. The best time to ask for a recommendation letter is while your work is fresh in their minds, not three months later.\n\nThank everyone — your supervising partner, the associates you worked with, and the support staff. A short, genuine thank-you email to your supervisor goes a long way (see the Thank You Email Template in LX-005).\n\nConnect with your colleagues on LinkedIn with a personalised note. These relationships are your professional network — nurture them. Finally, update your CV immediately while the details are fresh."
    },
  ],
  "4": [
    {
      heading: "What a memo is and isn't",
      body: "A legal research memo is an internal document that answers a specific legal question. It's not an essay, not an opinion piece, and definitely not a law school assignment. It's a practical tool that helps lawyers make decisions.\n\nThe purpose of a memo is to present the law as it stands, analyse how it applies to the client's situation, and arrive at a conclusion. You're not arguing for a side — you're providing an objective analysis. If the law is unfavourable to the client, say so clearly. Hiding bad news helps no one.\n\nA good memo saves a senior lawyer hours of research. A bad memo creates more work than it saves. The difference usually comes down to structure, clarity, and knowing when to stop researching."
    },
    {
      heading: "Structure: IRAC explained",
      body: "IRAC (Issue, Rule, Application, Conclusion) isn't just an academic framework — it's the standard structure used by practising lawyers across India. Master it.\n\nIssue: State the specific legal question in one or two sentences. \"Whether a non-compete clause in an employment agreement is enforceable under Section 27 of the Indian Contract Act, 1872.\"\n\nRule: Set out the relevant legal provisions, leading judgments, and any regulatory guidelines. Cite the statute first, then landmark Supreme Court decisions, then relevant High Court rulings. Stick to authoritative sources.\n\nApplication: This is where your analysis lives. Apply the rules to your client's specific facts. \"In the present case, the non-compete period of 3 years extends beyond the term of employment, which the Supreme Court in Superintendence Company of India held to be unenforceable...\"\n\nConclusion: A clear, direct answer to the question posed. Don't hedge excessively — give your best assessment and note any caveats separately."
    },
    {
      heading: "Research methodology",
      body: "Efficient research is a skill that separates good interns from great ones. Start broad, then narrow down.\n\nStep 1: Read the bare statute first. Understand what the law actually says before diving into interpretations. Step 2: Find the landmark Supreme Court decisions on the provision. SCC Online, Manupatra, and Indian Kanoon are your primary databases. Step 3: Check for recent High Court decisions that might indicate evolving judicial thinking. Step 4: Look for relevant SEBI/RBI/MCA circulars, notifications, or rules if the area involves regulatory compliance.\n\nSet a time limit for your research. If you've been researching for more than 3 hours without finding a clear answer, the question might need to be reframed. Discuss with your supervisor rather than going down rabbit holes.\n\nAlways keep track of what you've searched and where. Note the databases used, search terms, and key cases found. This prevents duplicate effort and helps if someone else needs to continue your research."
    },
    {
      heading: "Writing style and tone",
      body: "Legal writing in India has a reputation for being unnecessarily complex. Don't perpetuate this. Write clearly, write concisely, and use plain English wherever possible.\n\nUse short sentences. Break complex arguments into digestible parts. Avoid Latin phrases unless they're genuinely necessary (\"prima facie\" is fine; \"inter alia\" is usually just showing off when \"among other things\" works perfectly).\n\nStructure your paragraphs logically: one idea per paragraph. Use headings and sub-headings liberally. Bold key conclusions so a busy partner can scan the memo in 2 minutes and get the gist.\n\nCite properly. Follow a consistent citation format — most firms use either SCC or AIR style citations. When in doubt, ask your supervisor which format they prefer. Always include the paragraph or page number, not just the case name."
    },
    {
      heading: "Common mistakes",
      body: "The most common mistake is writing too much. A 15-page memo that should have been 5 pages isn't thorough — it's unfocused. Partners don't have time to wade through padding. If your analysis is complete in 4 pages, stop at 4 pages.\n\nOther frequent errors: copying passages from judgments without analysis (the partner can read the judgment themselves — they need your analysis of how it applies), not distinguishing between binding and persuasive authority (a Supreme Court decision carries more weight than a single-judge High Court order), and burying the conclusion at the end of a long analysis.\n\nPut your conclusion at the top. Many firms prefer an \"Executive Summary\" format where the answer appears first, followed by the detailed analysis. This lets the partner get the answer immediately and read the reasoning only if they want to.\n\nFinally, always proofread. Typos and citation errors undermine your credibility. Read your memo once for content, once for grammar, and once for formatting before submitting."
    },
  ],
  "5": [
    {
      heading: "What firms look for in interns",
      body: "A PPO (Pre-Placement Offer) isn't given to the intern who knows the most law. It's given to the intern the firm can see working there full-time. The evaluation is as much about cultural fit and work ethic as it is about legal knowledge.\n\nFirms assess three things: reliability (did you meet every deadline without being chased?), quality of work (did your research and drafting improve over the internship?), and attitude (were you pleasant to work with, open to feedback, and genuinely interested in the firm's work?).\n\nMost firms make PPO decisions in the last week of your internship, but the evaluation starts from day one. Every interaction — how you handle criticism, whether you volunteer for tasks, how you treat support staff — is being observed. The associates you work with will be asked for their opinion. Make sure it's a good one."
    },
    {
      heading: "The visibility strategy",
      body: "Doing good work isn't enough if nobody notices. You need strategic visibility — not showing off, but making sure the right people see your contributions.\n\nVolunteer for tasks from multiple partners and associates, not just your assigned supervisor. This expands the number of people who can vouch for you. When you deliver work, include a brief summary of your approach and findings — don't just send a document with no context.\n\nAttend any team meetings, knowledge-sharing sessions, or social events you're invited to. These informal settings are where partners form opinions about whether you'd fit into the team long-term.\n\nIf the firm has a specific practice area you're passionate about, mention it early. Say: \"I'm particularly interested in the M&A practice. If there's any ongoing matter where I could assist, I'd love to contribute.\" This shows initiative and helps the firm place you mentally in a role."
    },
    {
      heading: "Asking for feedback",
      body: "Don't wait until the last day to find out how you're doing. Proactively seeking feedback demonstrates maturity and a growth mindset — both qualities firms value in potential hires.\n\nAt the midpoint of your internship (typically after 2-3 weeks), ask your supervising associate for a brief chat. Frame it positively: \"I'm really enjoying the experience so far. I'd love to know if there are areas where I can improve in the second half of my internship.\"\n\nListen without getting defensive. If they say your research memos need more structure, don't explain why you wrote it that way — say \"Thank you, I'll work on that\" and actually implement the feedback in your next assignment. Visible improvement after feedback is one of the strongest signals a firm can see.\n\nDon't ask for feedback too frequently (once at the midpoint is usually right) and never ask a partner directly unless they're your primary supervisor. Go through your assigned associate first."
    },
    {
      heading: "The follow-up timeline",
      body: "If the firm doesn't mention a PPO during your internship, don't panic. Many firms take 2-4 weeks after the internship ends to make decisions, especially larger firms with multiple interns.\n\nHere's the recommended timeline: On your last day, express your interest verbally. Something like: \"I've really valued this experience and would love to explore the possibility of joining the team after graduation.\" Keep it brief and professional.\n\nOne week after the internship ends, send a thank-you email (use the template attached to this guide). This email should express gratitude, mention a specific project or learning experience, and subtly reaffirm your interest.\n\nIf you haven't heard anything after 3-4 weeks, send one follow-up email to your supervising associate asking if there's been any update regarding potential positions. After that, the ball is in their court. Don't send multiple follow-ups — it looks desperate and can actually hurt your chances."
    },
    {
      heading: "Writing the PPO request",
      body: "If you feel a strong connection with the firm but the internship ended without a PPO discussion, you can write a formal PPO request. This should be a concise, professional email to the managing partner or HR head.\n\nStructure it as follows: Express gratitude for the internship opportunity. Mention 2-3 specific contributions you made (a research memo that was well-received, a matter you assisted on, a skill you developed). State your interest in joining the firm full-time and mention your availability (graduation date, bar enrollment timeline).\n\nKeep it under 200 words. Don't oversell yourself or make it emotional. The tone should be confident but not presumptuous — you're expressing interest, not demanding a position.\n\nNot every PPO request will succeed, and that's okay. Even if the firm doesn't have a position available, a well-written request leaves a positive impression. They might reach out when a position opens up, or refer you to another firm. The legal community remembers professionalism."
    },
  ],
};

const guides: Guide[] = [
  {
    id: "1", caseNumber: "LX-001", title: "How to Cold Email a Law Firm (And Actually Get a Reply)",
    audience: "Students", stage: "Before You Apply", readTime: "6 min", slug: "cold-email-law-firm",
    sections: ["Why most cold emails fail", "Finding the right contact", "Writing the subject line", "The email structure", "Following up"],
    content: guideContent["1"],
    pdfHref: "/documents/LX-001-ColdEmail.pdf",
    attachments: [
      { label: "Cold Email Template", href: "/documents/CoverLetterTemplate.docx" },
      { label: "Follow-up Email Template", href: "/documents/FollowupEmailTemplate.docx" },
    ],
  },
  {
    id: "2", caseNumber: "LX-002", title: "The Non-NLU Student's Guide to Getting Top Firm Internships",
    audience: "Students", stage: "Before You Apply", readTime: "8 min", slug: "non-nlu-student-guide",
    sections: ["Reframing the disadvantage", "What firms actually look for", "Building your portfolio", "Direct application strategy", "Making it stick"],
    content: guideContent["2"],
    pdfHref: "/documents/LX-002-NonNLU.pdf",
    attachments: [
      { label: "Internship Application Tracker", href: "/documents/InternshipApplicationTracker.xlsx" },
      { label: "LinkedIn Profile Checklist", href: "/documents/LinkedInProfileChecklist.docx" },
    ],
  },
  {
    id: "3", caseNumber: "LX-003", title: "What to Expect in Your First Legal Internship",
    audience: "Students", stage: "Once You're In", readTime: "5 min", slug: "first-legal-internship",
    sections: ["Day one — what actually happens", "Types of work you'll be given", "How to ask questions properly", "Tracking your work", "End-of-internship checklist"],
    content: guideContent["3"],
    pdfHref: "/documents/LX-003-FirstInternship.pdf",
    attachments: [
      { label: "Monthly Internship Log", href: "/documents/MonthlyInternshipLog.docx" },
      { label: "First Day Checklist", href: "/documents/FirstDayChecklist.docx" },
    ],
  },
  {
    id: "4", caseNumber: "LX-004", title: "How to Write a Legal Research Memo",
    audience: "Students", stage: "Once You're In", readTime: "7 min", slug: "legal-research-memo",
    sections: ["What a memo is and isn't", "Structure: IRAC explained", "Research methodology", "Writing style and tone", "Common mistakes"],
    content: guideContent["4"],
    pdfHref: "/documents/LX-004-ResearchMemo.pdf",
    attachments: [
      { label: "Legal Research Memo Template", href: "#", comingSoon: true },
      { label: "Sample IRAC Memo", href: "#", comingSoon: true },
    ],
  },
  {
    id: "5", caseNumber: "LX-005", title: "How to Convert an Internship into a PPO",
    audience: "Students", stage: "After It Ends", readTime: "5 min", slug: "convert-internship-ppo",
    sections: ["What firms look for in interns", "The visibility strategy", "Asking for feedback", "The follow-up timeline", "Writing the PPO request"],
    content: guideContent["5"],
    pdfHref: "/documents/LX-005-ConvertPPO.pdf",
    attachments: [
      { label: "Thank You Email Template", href: "/documents/ThankYouEmailTemplate.docx" },
      { label: "NOC Request Letter Template", href: "/documents/NOCRequestLetterTemplate.docx" },
    ],
  },
  {
    id: "6", caseNumber: "LX-006", title: "How to Network as a Law Student in India",
    audience: "Students", stage: "Before You Apply", readTime: "4 min", slug: "network-law-student",
    sections: ["Why most law students network wrong", "LinkedIn vs in-person", "Reaching out to seniors", "Conference strategy", "Maintaining relationships"],
  },
  {
    id: "7", caseNumber: "LX-007", title: "Practice Area Guide: What Each Area Actually Looks Like Day-to-Day",
    audience: "Students", stage: "Before You Apply", readTime: "6 min", slug: "practice-area-guide",
    sections: ["Corporate", "Litigation", "IP", "Tax", "Employment", "How to choose"],
  },
  {
    id: "8", caseNumber: "LX-008", title: "Bar Council Registration Guide for Final Year Students",
    audience: "Students", stage: "After It Ends", readTime: "5 min", slug: "bar-council-registration",
    sections: ["Eligibility requirements", "Documents checklist", "State Bar Council vs BCI", "Timeline", "Common errors"],
  },
  {
    id: "9", caseNumber: "LX-009", title: "How to Evaluate a Law Intern",
    audience: "Firms", stage: "Firm Resources", readTime: "4 min", slug: "evaluate-law-intern",
    sections: ["Setting clear expectations", "The evaluation rubric", "Mid-internship check-in", "Final assessment criteria", "Giving useful feedback"],
    attachments: [
      { label: "Intern Evaluation Rubric", href: "/documents/InternEvaluationRubric.docx" },
      { label: "Intern Daily Task Sheet", href: "/documents/InternDailyTaskSheet.docx" },
      { label: "Intern Feedback Form", href: "/documents/InternFeedbackForm.docx" },
    ],
  },
  {
    id: "10", caseNumber: "LX-010", title: "Building Your Firm's Internship Program from Scratch",
    audience: "Firms", stage: "Firm Resources", readTime: "6 min", slug: "build-internship-program",
    sections: ["Why a structured program matters", "Setting intake criteria", "Onboarding checklist", "Assigning work effectively", "Retention and conversion"],
    attachments: [
      { label: "Internship Offer Letter Template", href: "/documents/InternshipOfferLetterTemplate.docx" },
      { label: "Intern NDA Template", href: "/documents/InternNDATemplate.docx" },
      { label: "Internship Certificate Template", href: "/documents/InternshipCertificateTemplate.docx" },
    ],
  },
  {
    id: "11", caseNumber: "LX-011", title: "What to Look for in a Law Intern's CV",
    audience: "Firms", stage: "Firm Resources", readTime: "4 min", slug: "law-intern-cv",
    sections: ["Red flags vs green flags", "Academic record weight", "Extracurriculars that matter", "Writing samples", "What to ignore"],
    attachments: [
      { label: "CV Screening Checklist", href: "#", comingSoon: true },
    ],
  },
  {
    id: "12", caseNumber: "LX-012", title: "How to Post Your Firm on Locus",
    audience: "Firms", stage: "Firm Resources", readTime: "3 min", slug: "post-firm-locus",
    sections: ["Creating your firm profile", "Adding internship listings", "Setting intake criteria", "Managing applications", "Getting verified"],
  },
  {
    id: "13", caseNumber: "LX-013", title: "How to Set Up a Placement Cell",
    audience: "Institutions", stage: "Institution Resources", readTime: "7 min", slug: "setup-placement-cell",
    sections: ["What a placement cell actually does", "Core team structure", "Building a firm database", "Student preparation pipeline", "Tracking placements"],
    attachments: [
      { label: "Placement Cell Structure Template", href: "#", comingSoon: true },
      { label: "Firm Database Format", href: "#", comingSoon: true },
    ],
  },
  {
    id: "14", caseNumber: "LX-014", title: "How to Register Your Institution on Locus",
    audience: "Institutions", stage: "Institution Resources", readTime: "5 min", slug: "register-institution-locus",
    sections: ["Eligibility", "Documents needed", "Verification process", "What you get access to", "Managing your student roster"],
    attachments: [
      { label: "Institution Registration Guide", href: "#", comingSoon: true },
    ],
  },
];

const filters: Filter[] = ["All", "Students", "Firms", "Institutions"];

const audienceTagStyles: Record<Audience, string> = {
  Students: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Firms: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Institutions: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export default function Playbook() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "The Locus Playbook — Guides & Resources | Locus by LexRoot";
  }, []);

  const filtered = guides.filter(
    (g) => activeFilter === "All" || g.audience === activeFilter
  );

  const selected = guides.find((g) => g.id === selectedId) || null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileDetailOpen(true);
  };

  // Mobile detail view
  if (isMobile && mobileDetailOpen && selected) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4 pb-8">
        <button
          onClick={() => setMobileDetailOpen(false)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to guides
        </button>
        <GuideDetail guide={selected} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Left Panel */}
        <div
          className={`${
            isMobile ? "w-full" : "w-[300px] min-w-[300px]"
          } border-r border-border/50 flex flex-col`}
        >
          <div className="p-5 pb-3">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-4">
              The Locus Playbook
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setActiveFilter(f);
                    setSelectedId(null);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeFilter === f
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelect(g.id)}
                className={`w-full text-left px-5 py-3.5 border-l-2 transition-all hover:bg-muted/30 ${
                  selectedId === g.id
                    ? "border-l-accent bg-muted/20"
                    : "border-l-transparent"
                }`}
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {g.caseNumber}
                </span>
                <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
                  {g.title}
                </p>
                <span
                  className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${audienceTagStyles[g.audience]}`}
                >
                  {g.audience}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel (desktop only) */}
        {!isMobile && (
          <div className="flex-1 overflow-y-auto">
            {selected ? (
              <div className="p-8 max-w-3xl">
                <GuideDetail guide={selected} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full relative overflow-hidden">
                {/* Gold radial gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(45_100%_51%/0.1)_0%,_transparent_60%)]" />

                <div className="relative z-10 flex flex-col items-start px-12 max-w-2xl">
                  {/* Case file label */}
                  <span className="font-mono text-xs tracking-[0.3em] uppercase text-[#D4A017]/60 animate-fade-in" style={{ animationFillMode: 'both' }}>
                    CASE FILE SYSTEM // LX-000
                  </span>

                  {/* Massive heading */}
                  <h2 className="text-5xl md:text-6xl font-bold mt-4 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                    The Locus <span className="text-[#D4A017]">Playbook</span>
                  </h2>

                  {/* Animated gold bar */}
                  <div className="h-1.5 w-32 bg-[#D4A017] rounded-full mt-6 mb-6 animate-fade-in origin-left" style={{ animationDelay: '300ms', animationFillMode: 'both' }} />

                  {/* Tagline */}
                  <p className="text-lg text-muted-foreground/90 mb-12 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                    Your case file system for navigating legal internships in India.
                  </p>

                  {/* Feature cards — left-aligned with gold border */}
                  <div className="flex flex-col gap-4 w-full mb-14">
                    {[
                      { icon: BookOpen, label: "14 Guides", desc: "Covering every stage from application to PPO conversion" },
                      { icon: Users, label: "3 Audiences", desc: "Tailored for students, firms, and institutions" },
                      { icon: Layers, label: "Actionable", desc: "Step-by-step sections you can use right away" },
                    ].map((item, i) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-4 rounded-lg border border-border bg-card/50 p-6 border-l-2 border-l-[#D4A017] animate-fade-in"
                        style={{ animationDelay: `${500 + i * 150}ms`, animationFillMode: 'both' }}
                      >
                        <item.icon className="w-8 h-8 text-[#D4A017] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-base font-semibold text-foreground block">{item.label}</span>
                          <span className="text-sm text-muted-foreground leading-relaxed">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Prompt with pulsing dot */}
                  <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '950ms', animationFillMode: 'both' }}>
                    <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
                    <p className="text-base font-semibold text-[#D4A017]">
                      Select a guide from the left panel to get started
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GuideDetail({ guide }: { guide: Guide }) {
  const [readerMode, setReaderMode] = useState(false);
  const hasContent = !!guide.content && guide.content.length > 0;

  if (readerMode && hasContent) {
    return (
      <div>
        <button
          onClick={() => setReaderMode(false)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ChevronLeft size={16} /> Back to overview
        </button>

        <p className="font-mono text-xs text-muted-foreground mb-1">
          {guide.caseNumber} · {guide.stage}
        </p>
        <h1 className="text-2xl font-bold text-foreground leading-tight mb-8">
          {guide.title}
        </h1>

        <div className="space-y-10">
          {guide.content!.map((section, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-sm text-accent font-bold shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-lg font-semibold text-foreground">
                  {section.heading}
                </h2>
              </div>
              <div className="pl-9 space-y-4">
                {section.body.split("\n\n").map((para, j) => (
                  <p key={j} className="text-sm text-muted-foreground leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-xs text-muted-foreground mb-1">
            {guide.caseNumber} · {guide.stage}
          </p>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {guide.title}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          {hasContent ? (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => setReaderMode(true)}
              >
                <BookOpen size={14} /> Read Guide
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={guide.pdfHref} download>
                  <Download size={14} /> Download PDF
                </a>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 opacity-50 cursor-not-allowed"
                disabled
              >
                <BookOpen size={14} /> Read Guide — Coming Soon
              </Button>
              <Button variant="outline" size="sm" className="opacity-50 cursor-not-allowed" disabled>
                <Download size={14} /> Download PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex gap-8 mb-6">
        {[
          { label: "Audience", value: guide.audience, icon: Users },
          { label: "Read Time", value: guide.readTime, icon: Clock },
          { label: "Stage", value: guide.stage, icon: Layers },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <m.icon size={10} /> {m.label}
            </p>
            <p className="text-sm font-medium text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-border/50 mb-6" />

      {/* Sections */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
          What's inside
        </h2>
        <div className="space-y-2">
          {guide.sections.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-card/50"
            >
              <span className="font-mono text-sm text-accent font-bold w-6 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments */}
      {guide.attachments && guide.attachments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
            Attachments
          </h2>
          <div className="space-y-2">
            {guide.attachments.map((att, i) =>
              att.comingSoon ? (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/30 opacity-60"
                >
                  <Download size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">{att.label}</span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </div>
              ) : (
                <a
                  key={i}
                  href={att.href}
                  download
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:border-accent/40 hover:bg-accent/5 transition-all group"
                >
                  <Download size={16} className="text-accent shrink-0" />
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">{att.label}</span>
                </a>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
