alter table jobs add column if not exists application_type text default 'online';

-- Migrate old status names to new Kanban stage names
update jobs set status = 'Application Submitted' where status = 'Applied';
update jobs set status = 'Waiting on Referral'   where status = 'Referred';
update jobs set status = 'Recruiter Screen'       where status = 'Interview';
update jobs set status = 'Final / Offer'          where status = 'Offer';
update jobs set status = 'Docs Ready'             where status = 'LinkedIn Reach out';
