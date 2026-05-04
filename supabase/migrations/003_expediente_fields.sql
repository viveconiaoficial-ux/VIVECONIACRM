-- Expediente manual: análisis, activos visuales, estrategia y mensaje personalizado
alter table leads add column if not exists expediente_analysis text;
alter table leads add column if not exists expediente_visual_assets text;
alter table leads add column if not exists expediente_sales_strategy text;
alter table leads add column if not exists expediente_outreach_message text;

comment on column leads.expediente_analysis is
  'Análisis real (por qué la web actual no funciona / oportunidades).';
comment on column leads.expediente_visual_assets is
  'Activos para vídeo: Instagram, Maps, web actual, qué capturar.';
comment on column leads.expediente_sales_strategy is
  'Enfoque de venta (evolución vs demolición, propuesta de valor).';
comment on column leads.expediente_outreach_message is
  'Mensaje largo listo para WhatsApp / email (prioridad sobre plantilla WA1).';
