alter table candidates add column if not exists jd_storage_url text;
alter table candidates add column if not exists jd_complete boolean default false;
alter table jobs add column if not exists jd_storage_url text;
alter table jobs add column if not exists jd_complete boolean default false;
