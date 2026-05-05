-- Segundo mensaje (sin respuesta al primer contacto)
alter table leads add column if not exists expediente_followup_no_response text;

comment on column leads.expediente_followup_no_response is
  'Texto preparado para el segundo WhatsApp cuando no hubo respuesta al primer acercamiento.';
