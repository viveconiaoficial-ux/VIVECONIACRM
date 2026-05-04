-- Extensión UUID
create extension if not exists "uuid-ossp";

-- Enum de status
create type lead_status as enum (
  'lead_frio',
  'propuesta_enviada',
  'seguimiento',
  'negociacion',
  'rechazado',
  'venta_cerrada'
);

create type social_quality as enum ('buena', 'regular', 'inexistente');
create type wa_response as enum ('si', 'no', 'sin_respuesta');

-- Tabla principal
create table leads (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),

  -- Datos básicos
  business_name       text not null,
  contact_name        text,
  email               text,
  whatsapp_phone      text,

  -- Clasificación
  has_website         boolean not null default false,
  sector              text,
  status              lead_status not null default 'lead_frio',

  -- Investigación
  social_photos_urls  text[],
  brand_style_notes   text,
  social_quality      social_quality,
  has_instagram       boolean,

  -- Vídeo
  video_url           text,
  video_created_at    timestamptz,

  -- WhatsApp
  wa_msg1_sent_at     timestamptz,
  wa_msg1_response    wa_response,
  wa_msg2_sent_at     timestamptz,

  -- Pipeline
  last_contact_date   timestamptz,
  notes               text,
  proposal_url        text,
  daily_batch_date    date
);

-- Índices útiles
create index leads_status_idx on leads(status);
create index leads_has_website_idx on leads(has_website);
create index leads_daily_batch_idx on leads(daily_batch_date);
create index leads_created_at_idx on leads(created_at desc);

-- RLS: solo el propietario puede leer/escribir (actívalo cuando añadas Auth)
alter table leads enable row level security;

-- Política temporal para desarrollo: acceso completo sin auth
-- ⚠️ Cambiar antes de producción
create policy "dev_all_access" on leads
  for all using (true) with check (true);

-- Vista útil: leads de hoy sin video
create view leads_pending_video as
  select * from leads
  where daily_batch_date = current_date
    and video_url is null
    and has_website = false
  order by created_at;

-- Vista: leads esperando respuesta WA
create view leads_awaiting_wa_response as
  select * from leads
  where wa_msg1_sent_at is not null
    and wa_msg1_response is null
  order by wa_msg1_sent_at;

-- Realtime: en Supabase, habilita la tabla para Realtime (UI: Database → Replication)
-- o ejecuta si tu proyecto lo permite:
-- alter publication supabase_realtime add table leads;
