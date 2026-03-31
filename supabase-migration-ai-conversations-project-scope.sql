-- Dayanna Pro v3
-- Scope AI conversations by project in DB (no localStorage conversation mapping)

alter table if exists public.ai_conversations
  add column if not exists project_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_conversations_project_id_fkey'
      and conrelid = 'public.ai_conversations'::regclass
  ) then
    alter table public.ai_conversations
      add constraint ai_conversations_project_id_fkey
      foreign key (project_id) references public.projects(id) on delete cascade;
  end if;
end$$;

create index if not exists ai_conversations_user_project_updated_idx
  on public.ai_conversations (user_id, project_id, updated_at desc);

-- Optional (recommended once backfill is complete):
-- alter table public.ai_conversations
--   alter column project_id set not null;
