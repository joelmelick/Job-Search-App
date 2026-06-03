export type JobStatus =
  | "Research"
  | "LinkedIn Reach out"
  | "Referred"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Passed";

export type PostingStatus = "live" | "closed" | "unknown" | "down";

export type PaySource = "listed" | "estimated" | "glassdoor" | "levels";

export interface Job {
  id: string;
  company: string;
  role: string;
  job_url: string;
  ranking: number;
  status: JobStatus;
  pay_min: number | null;
  pay_max: number | null;
  pay_source: PaySource;
  posting_status: PostingStatus;
  last_checked: string | null;
  last_action: string | null;
  next_action: string | null;
  date_added: string;
  notes_path: string | null;
  resume_path: string | null;
  cover_path: string | null;
  created_at: string;
}

export interface CompanyInfo {
  public_or_private?: string;
  ticker?: string;
  last_funding?: string;
  notes?: string;
}

export interface Candidate {
  id: string;
  company: string;
  role: string;
  url: string;
  source: string;
  attributes: string[];
  pay_range: string | null;
  pay_min: number | null;
  pay_max: number | null;
  company_info: CompanyInfo;
  found_date: string;
  promoted: boolean;
  dismissed: boolean;
  dismiss_reason: string | null;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  careers_url: string;
  domain: string | null;
  attributes: string[];
  enabled: boolean;
  created_at: string;
}

export interface Dismissal {
  id: number;
  candidate_id: string | null;
  company: string | null;
  role: string | null;
  reason: string | null;
  dismissed_at: string;
}

export const JOB_STATUSES: JobStatus[] = [
  "Research",
  "LinkedIn Reach out",
  "Referred",
  "Applied",
  "Interview",
  "Offer",
  "Passed",
];

export const STATUS_COLORS: Record<JobStatus, string> = {
  Research: "bg-gray-100 text-gray-700",
  "LinkedIn Reach out": "bg-blue-100 text-blue-700",
  Referred: "bg-purple-100 text-purple-700",
  Applied: "bg-yellow-100 text-yellow-700",
  Interview: "bg-orange-100 text-orange-700",
  Offer: "bg-green-100 text-green-700",
  Passed: "bg-red-100 text-red-700",
};
