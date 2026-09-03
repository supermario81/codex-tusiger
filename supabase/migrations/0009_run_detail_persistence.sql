-- Laufdetails dauerhaft speichern, damit der Laufbericht aus der Liste heraus
-- jederzeit wieder geoeffnet werden kann - auch auf einem anderen Geraet und
-- nachdem der lokale Zwischenspeicher den Lauf verdraengt hat.
alter table public.runs
add column if not exists validation_checks jsonb not null default '[]'::jsonb;

alter table public.runs
add column if not exists tracking_summary jsonb;
