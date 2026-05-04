-- Vistas para segmentar prospectos vs clientes aceptados (misma tabla leads).
-- Criterio: cliente = fecha de aceptación O estado propuesta_aceptada / venta_cerrada.
-- En la app puedes seguir usando getLeads() y filtrar con leadLifecycle.ts, o consultar estas vistas.

-- PostgreSQL 15+: security_invoker hace que se aplique el RLS de `leads` al usuario que consulta.
create or replace view public.leads_potenciales
with (security_invoker = true)
as
select *
from public.leads
where deal_accepted_at is null
  and status not in (
    'propuesta_aceptada'::lead_status,
    'venta_cerrada'::lead_status
  );

create or replace view public.leads_clientes
with (security_invoker = true)
as
select *
from public.leads
where deal_accepted_at is not null
   or status in (
    'propuesta_aceptada'::lead_status,
    'venta_cerrada'::lead_status
  );

comment on view public.leads_potenciales is
  'Prospectos sin aceptación registrada (ni fecha ni estados ganados).';
comment on view public.leads_clientes is
  'Registros con propuesta aceptada o venta cerrada, o con deal_accepted_at.';

grant select on public.leads_potenciales to anon, authenticated;
grant select on public.leads_clientes to anon, authenticated;
