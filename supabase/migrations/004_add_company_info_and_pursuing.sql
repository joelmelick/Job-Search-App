alter table jobs add column if not exists company_info jsonb default '{}';
alter table jobs add column if not exists pursuing boolean default true;

-- Update existing Drata seed row with company info
update jobs set company_info = '{"public_or_private":"private","last_funding":"Series C, $100M, Oct 2022; $2B valuation","notes":"Compliance automation platform, SOC 2 / ISO 27001"}' where id = 'drata';
