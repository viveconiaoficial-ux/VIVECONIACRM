-- Embudo simplificado: nuevos valores y migración de filas (+ vistas potenciales/clientes).

alter type lead_status add value if not exists 'sin_contactar';
alter type lead_status add value if not exists 'contestada_negociacion';
alter type lead_status add value if not exists 'contestada_rechazada';
alter type lead_status add value if not exists 'ignorada_rechazada';

update public.leads
set status = 'contestada_negociacion'::lead_status
where status = 'seguimiento'::lead_status;

update public.leads
set status = 'sin_contactar'::lead_status
where status in ('lead_frio'::lead_status, 'primer_acercamiento'::lead_status);

update public.leads
set status = 'propuesta_enviada'::lead_status
where status = 'esperando_respuesta'::lead_status;

update public.leads
set status = 'contestada_negociacion'::lead_status
where status in ('contestada_seguimiento'::lead_status, 'negociacion'::lead_status);

update public.leads
set status = 'contestada_rechazada'::lead_status
where status in ('rechazado'::lead_status);

update public.leads
set status = 'ignorada_rechazada'::lead_status
where status in ('ignorada'::lead_status, 'descartada_interna'::lead_status);

update public.leads
set status = 'propuesta_aceptada'::lead_status
where status = 'venta_cerrada'::lead_status;

alter table public.leads
  alter column status set default 'sin_contactar'::lead_status;

create or replace view public.leads_potenciales
with (security_invoker = true)
as
select *
from public.leads
where deal_accepted_at is null
  and status not in (
    'propuesta_aceptada'::lead_status,
    'contestada_rechazada'::lead_status,
    'ignorada_rechazada'::lead_status
  );

create or replace view public.leads_clientes
with (security_invoker = true)
as
select *
from public.leads
where deal_accepted_at is not null
   or status = 'propuesta_aceptada'::lead_status;

comment on view public.leads_potenciales is
  'Prospectos activos sin aceptación y sin rechazo en histórico.';

grant select on public.leads_potenciales to anon, authenticated;
grant select on public.leads_clientes to anon, authenticated;
