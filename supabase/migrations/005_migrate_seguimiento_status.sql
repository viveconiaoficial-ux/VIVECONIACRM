-- Ejecutar después de 004 (transacción separada).
-- Así PostgreSQL ya tiene committed los valores nuevos de lead_status.

update leads
set status = 'contestada_seguimiento'::lead_status
where status = 'seguimiento'::lead_status;
