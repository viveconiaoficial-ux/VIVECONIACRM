alter table public.leads add column if not exists failure_ai_reflection text;

comment on column public.leads.failure_ai_reflection is
  'Hipótesis y mejoras sugeridas ante rechazo/no respuesta (texto editable en CRM).';
