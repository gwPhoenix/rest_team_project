-- analyses 테이블
create table if not exists analyses (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users not null,
  job        text        not null,
  company    text,
  experience text        not null,
  result     jsonb       not null,
  created_at timestamptz default now()
);

-- RLS
alter table analyses enable row level security;

create policy "own_analyses" on analyses
  for all using (auth.uid() = user_id);
