-- Jobs (pipeline - approved/active applications)
create table if not exists jobs (
  id text primary key,
  company text not null,
  role text not null,
  job_url text not null,
  ranking int default 3 check (ranking between 1 and 5),
  status text default 'Research',
  pay_min int,
  pay_max int,
  pay_source text default 'listed',
  posting_status text default 'live',
  last_checked text,
  last_action text,
  next_action text,
  date_added date default current_date,
  notes_path text,
  resume_path text,
  cover_path text,
  created_at timestamptz default now()
);

-- Candidates (found by AI agent, pending review)
create table if not exists candidates (
  id text primary key,
  company text not null,
  role text not null,
  url text not null,
  source text default 'linkedin',
  attributes jsonb default '[]',
  pay_range text,
  pay_min int,
  pay_max int,
  company_info jsonb default '{}',
  found_date date default current_date,
  promoted boolean default false,
  dismissed boolean default false,
  dismiss_reason text,
  created_at timestamptz default now()
);

-- Companies (target companies for crawler)
create table if not exists companies (
  id serial primary key,
  name text not null,
  careers_url text not null,
  domain text,
  attributes jsonb default '[]',
  enabled boolean default true,
  created_at timestamptz default now()
);

-- Dismissal reasons log
create table if not exists dismissals (
  id serial primary key,
  candidate_id text,
  company text,
  role text,
  reason text,
  dismissed_at timestamptz default now()
);

-- Seed existing pipeline job
insert into jobs (id, company, role, job_url, ranking, status, pay_min, pay_max, pay_source, posting_status, last_checked, last_action, next_action, date_added, notes_path, resume_path, cover_path, created_at)
values (
  'drata', 'Drata', 'Principal PM, Agentic AI Platform',
  'https://drata.com/about/careers/cf5e1a06-8720-4e5c-93c6-5494c39c862c',
  5, 'Research', 207700, 256600, 'listed', 'live', '06/03/26',
  'Resume & cover letter created', 'Apply via job link',
  '2026-06-01', 'Drata/job-notes.md', 'Drata/Joel_Melick_Resume_Drata.docx', 'Drata/Joel_Melick_CoverLetter_Drata.docx',
  now()
) on conflict (id) do nothing;

-- Seed candidates
insert into candidates (id, company, role, url, source, attributes, pay_range, company_info, found_date)
values
('vanta-gpm-grc-20260603','Vanta','Group Product Manager, GRC Workflows','https://jobs.ashbyhq.com/vanta/9667cb46-ea5b-4cca-a61e-5f5f2f6648c5','linkedin','["remote_friendly","private","grc","security","ai_platform"]','$221K – $260K','{"public_or_private":"private","last_funding":"Series D, $150M, Jul 2025, led by Wellington Management; $4.15B valuation","notes":"GRC/compliance platform, 12K+ customers"}','2026-06-03'),
('okta-dir-ai-agents-20260603','Okta','Director, Product Management – Okta for AI Agents','https://www.okta.com/company/careers/product/director-product-management-okta-for-ai-agents-7754379/','company','["remote_friendly","publicly_traded","security","ai_platform","enterprise_saas"]','$230K – $355K','{"public_or_private":"public","ticker":"OKTA (NASDAQ)","notes":"Identity & access management leader"}','2026-06-03'),
('rapid7-dir-pm-siem-20260603','Rapid7','Director, Product Management (SIEM)','https://careers.rapid7.com/jobs/director-product-management-siem-united-states','linkedin','["remote_friendly","publicly_traded","security","siem"]','$205,700 – $278,300','{"public_or_private":"public","ticker":"RPD (NASDAQ)","notes":"Cybersecurity company; SIEM/SOAR platform with embedded AI"}','2026-06-03'),
('1password-staff-pm-iam-20260603','1Password','Staff Product Manager, Identity & Access Management','https://jobs.ashbyhq.com/1password/26af8030-5e7b-4bd3-9535-7ec7df3f3e87','linkedin','["remote_friendly","private","security","iam","platform"]','$172K – $249K USD','{"public_or_private":"private","last_funding":"Series C, $620M, Jan 2022; $6.8B valuation","notes":"Password manager / enterprise IAM"}','2026-06-03'),
('databricks-staff-pm-ai-platform-20260603','Databricks','Staff Product Manager, AI Platform','https://www.databricks.com/company/careers/product/staff-product-manager-ai-platform-8427940002','linkedin','["remote_friendly","private","ai_platform","ml_infrastructure","enterprise_saas"]','$172,600 – $237,325 (Zone 2)','{"public_or_private":"private","last_funding":"Series L, $4B+, Dec 2025; $134B valuation. IPO expected 2H 2026.","notes":"Data & AI platform"}','2026-06-03'),
('sandboxaq-dir-pm-ai-gen-engine-20260603','SandboxAQ','Director of Product Management, AI Generation Engine','https://jobs.ashbyhq.com/sandboxaq/3eabb716-eaef-432e-ad88-f3e16d01e54b','linkedin','["remote_friendly","private","agentic_ai","enterprise"]','Pay not listed','{"public_or_private":"private","last_funding":"Series E, $450M, Apr 2025; $5.75B valuation","notes":"Spun out of Alphabet in 2022"}','2026-06-03'),
('vanta-spm-access-mgmt-20260603','Vanta','Senior Product Manager, Access Management','https://jobs.ashbyhq.com/vanta/f0d6efc2-8b55-4655-a27e-c8359d3b925f','linkedin','["remote_friendly","private","security","iam"]','$207K – $244K','{"public_or_private":"private","last_funding":"Series D, $150M, Jul 2025","notes":"Access review automation with AI"}','2026-06-03')
on conflict (id) do nothing;

-- Seed companies
insert into companies (name, careers_url, domain, attributes)
values
('Vanta','https://www.vanta.com/careers','vanta.com','["remote_friendly","private","grc","security"]'),
('Okta','https://www.okta.com/company/careers/','okta.com','["remote_friendly","publicly_traded","security","enterprise_saas"]'),
('Anthropic','https://www.anthropic.com/careers','anthropic.com','["remote_friendly","private","ai_platform"]'),
('Palo Alto Networks','https://www.paloaltonetworks.com/company/careers','paloaltonetworks.com','["remote_friendly","publicly_traded","security"]')
on conflict do nothing;
