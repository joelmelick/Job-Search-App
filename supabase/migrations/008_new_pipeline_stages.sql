-- 008: New pipeline stages.
-- Research > Cold Apply > Applied with LinkedIn Outreach > Referred >
-- Recruiter Screen > HM Screen > Final / Offer (plus hidden Rejected / Passed).
-- Whether a job came via referral stays tracked in application_type.

update jobs set status = 'Cold Apply' where status = 'Application Submitted';
update jobs set status = 'Referred'   where status = 'Waiting on Referral';
update jobs set status = 'Research'   where status = 'Docs Ready';
