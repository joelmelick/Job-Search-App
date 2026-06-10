export type JobStatus =
  | "Research"
  | "Docs Ready"
  | "Waiting on Referral"
  | "Application Submitted"
  | "Recruiter Screen"
  | "HM Screen"
  | "Final / Offer"
  | "Passed";

export type ApplicationType = "online" | "referral";

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
  company_info: CompanyInfo;
  pursuing: boolean;
  application_type: ApplicationType;
  workflow_status: string;
  folder_path: string | null;
  storage_resume_url: string | null;
  storage_cover_url: string | null;
  storage_notes_url: string | null;
  storage_outreach_url: string | null;
  linkedin_contacts: object[];
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
  workflow_status: string;
  folder_path: string | null;
  storage_outreach_url: string | null;
  added_by: string;
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
  "Docs Ready",
  "Waiting on Referral",
  "Application Submitted",
  "Recruiter Screen",
  "HM Screen",
  "Final / Offer",
  "Passed",
];

export const STATUS_COLORS: Record<JobStatus, string> = {
  Research: "bg-gray-100 text-gray-700",
  "Docs Ready": "bg-blue-100 text-blue-700",
  "Waiting on Referral": "bg-purple-100 text-purple-700",
  "Application Submitted": "bg-amber-100 text-amber-700",
  "Recruiter Screen": "bg-orange-100 text-orange-700",
  "HM Screen": "bg-rose-100 text-rose-700",
  "Final / Offer": "bg-green-100 text-green-700",
  Passed: "bg-red-100 text-red-700",
};
