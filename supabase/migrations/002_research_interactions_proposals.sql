-- Vive CRM: investigación enriquecida, competidores, propuestas versionadas
-- e histórico de interacciones para analítica.
-- Ejecuta en el SQL Editor de Supabase DESPUÉS de 001_leads.sql

-- ── Prioridad del lead (tarjetas #1, prioridad alta, etc.)
do $$ begin
  create type lead_priority as enum ('alta', 'media', 'baja');
exception
  when duplicate_object then null;
end $$;

-- ── Extensión de `leads`: lo que el CRM / IA rellena al investigar
alter table leads add column if not exists updated_at timestamptz default now();

alter table leads add column if not exists priority lead_priority;
alter table leads add column if not exists score smallint
  check (score is null or (score >= 0 and score <= 100));

alter table leads add column if not exists neighborhood text;
alter table leads add column if not exists city text;
alter table leads add column if not exists province text;
alter table leads add column if not exists location_label text;

alter table leads add column if not exists maps_rating numeric(2, 1);
alter table leads add column if not exists review_count integer;
alter table leads add column if not exists google_maps_url text;
alter table leads add column if not exists instagram_handle text;

alter table leads add column if not exists web_presence_summary text;
alter table leads add column if not exists contact_names text;

alter table leads add column if not exists sector_tags text[];

-- Texto cualitativo de la investigación (tarjetas Oportunidad / Dolor / mensajes)
alter table leads add column if not exists investigation_opportunity text;
alter table leads add column if not exists investigation_pain text;
alter table leads add column if not exists message_sondeo_directo text;
alter table leads add column if not exists message_sondeo_consultivo text;
alter table leads add column if not exists strategy_notes text;
alter table leads add column if not exists video_hook_notes text;

-- Dump flexible: radiografía, mercado, servicios detectados, KPIs sueltos…
alter table leads add column if not exists research_payload jsonb;

create index if not exists leads_priority_idx on leads(priority);
create index if not exists leads_score_idx on leads(score desc nulls last);
create index if not exists leads_city_idx on leads(city);
create index if not exists leads_research_payload_gin on leads using gin (research_payload);

-- ── Competidores por lead (Seseña, Chamberí, etc.)
create table if not exists lead_competitors (
  id              uuid primary key default uuid_generate_v4(),
  lead_id         uuid not null references leads(id) on delete cascade,
  sort_order      int not null default 0,
  name            text not null,
  rating          numeric(2, 1),
  review_count    int,
  has_website     boolean,
  website_quality text,
  opening_hours   text,
  phone           text,
  notes           text,
  threat_level    text,
  created_at      timestamptz not null default now()
);

create index if not exists lead_competitors_lead_idx on lead_competitors(lead_id);

-- ── Propuestas / informes generados (versionados; contenido en JSON flexible)
create table if not exists lead_proposals (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid not null references leads(id) on delete cascade,
  kind        text not null default 'full',
  title       text,
  -- Ejemplo de shape sugerido en app:
  -- { local_seo_keywords: [], impact_estimates: {}, tech_stack_options: [],
  --   site_architecture_pages: [], conclusion: "", services_tags: [], ... }
  sections    jsonb not null default '{}'::jsonb,
  source      text default 'crm',
  created_at  timestamptz not null default now()
);

create index if not exists lead_proposals_lead_idx on lead_proposals(lead_id);
create index if not exists lead_proposals_created_idx on lead_proposals(created_at desc);
create index if not exists lead_proposals_sections_gin on lead_proposals using gin (sections);

-- ── Histórico de interacciones (analítica: qué pasó, cuándo, con qué payload)
create table if not exists lead_interactions (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid not null references leads(id) on delete cascade,
  -- Valores típicos (convención en app): wa_draft_created, wa_message_sent,
  -- wa_video_sent, web_analysis_opened, proposal_generated, proposal_viewed,
  -- status_changed, note_added, research_refreshed, email_sent, call_logged
  event_type  text not null,
  channel     text default 'crm',
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists lead_interactions_lead_time_idx
  on lead_interactions(lead_id, created_at desc);
create index if not exists lead_interactions_event_idx
  on lead_interactions(event_type, created_at desc);
create index if not exists lead_interactions_metadata_gin
  on lead_interactions using gin (metadata);

-- RLS (mismo criterio que leads en dev)
alter table lead_competitors enable row level security;
alter table lead_proposals enable row level security;
alter table lead_interactions enable row level security;

drop policy if exists "competitors_dev_all" on lead_competitors;
create policy "competitors_dev_all" on lead_competitors
  for all using (true) with check (true);

drop policy if exists "proposals_dev_all" on lead_proposals;
create policy "proposals_dev_all" on lead_proposals
  for all using (true) with check (true);

drop policy if exists "interactions_dev_all" on lead_interactions;
create policy "interactions_dev_all" on lead_interactions
  for all using (true) with check (true);

-- Realtime opcional:
-- alter publication supabase_realtime add table lead_interactions;
-- alter publication supabase_realtime add table lead_proposals;

comment on table lead_interactions is
  'Registro append-only de eventos para funnels, tasas de respuesta y analítica.';
comment on column leads.research_payload is
  'JSON libre para dumping de IA: radiografía, mercado local, servicios, KPIs, etc.';
