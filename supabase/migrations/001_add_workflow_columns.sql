alter table jobs
  add column if not exists workflow_status text default 'pending',
  add column if not exists folder_path text,
  add column if not exists storage_resume_url text,
  add column if not exists storage_cover_url text,
  add column if not exists storage_notes_url text,
  add column if not exists linkedin_contacts jsonb default '[]';

alter table candidates
  add column if not exists workflow_status text default 'pending',
  add column if not exists folder_path text;
