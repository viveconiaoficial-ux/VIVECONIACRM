-- Fases de pipeline ampliadas + columnas del intercambio comercial.
-- Los nuevos valores del enum no pueden usarse en UPDATE hasta que esta migración haga commit;
-- el cambio de filas "seguimiento" está en 005_migrate_seguimiento_status.sql.

-- Nuevos valores del enum
alter type lead_status add value if not exists 'primer_acercamiento';
alter type lead_status add value if not exists 'esperando_respuesta';
alter type lead_status add value if not exists 'ignorada';
alter type lead_status add value if not exists 'contestada_seguimiento';
alter type lead_status add value if not exists 'propuesta_aceptada';
alter type lead_status add value if not exists 'descartada_interna';

alter table leads add column if not exists deal_proposal_summary text;
alter table leads add column if not exists deal_budget_amount numeric(14, 2);
alter table leads add column if not exists deal_budget_currency text default 'EUR';
alter table leads add column if not exists deal_scope_notes text;
alter table leads add column if not exists deal_commercial_terms text;
alter table leads add column if not exists deal_next_followup_at timestamptz;
alter table leads add column if not exists deal_accepted_at timestamptz;
alter table leads add column if not exists deal_closed_at timestamptz;
alter table leads add column if not exists deal_rejection_reason text;

comment on column leads.deal_proposal_summary is 'Resumen o texto de la propuesta / oferta final acordada.';
comment on column leads.deal_budget_amount is 'Importe presupuestado o cerrado.';
comment on column leads.deal_budget_currency is 'Moneda del importe (por defecto EUR).';
comment on column leads.deal_scope_notes is 'Alcance, entregables, horas o módulos incluidos.';
comment on column leads.deal_commercial_terms is 'Plazos, forma de pago, validez del presupuesto.';
comment on column leads.deal_next_followup_at is 'Próximo seguimiento acordado.';
comment on column leads.deal_accepted_at is 'Fecha en que el cliente acepta la propuesta.';
comment on column leads.deal_closed_at is 'Fecha de cierre del proyecto / cobro.';
comment on column leads.deal_rejection_reason is 'Motivo si la oportunidad se rechaza o descarta.';
