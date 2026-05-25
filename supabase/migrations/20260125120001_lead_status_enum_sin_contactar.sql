-- Postgres: cada valor nuevo de enum en su propia migración (commit antes de usar).

alter type lead_status add value if not exists 'sin_contactar';
