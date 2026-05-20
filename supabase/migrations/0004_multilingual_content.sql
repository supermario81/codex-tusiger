alter table public.legal_pages drop constraint if exists legal_pages_slug_key;
alter table public.history_content drop constraint if exists history_content_slug_key;

create unique index if not exists legal_pages_slug_language_key on public.legal_pages (slug, language);
create unique index if not exists history_content_slug_language_key on public.history_content (slug, language);

insert into public.legal_pages (slug, language, title, body, version, active)
values
  ('datenschutz', 'en', 'Privacy Policy', 'Draft, legal review required. Operator: Mario Martic / seven-art.com, Riedtalstrasse 14a, 4800 Zofingen, Switzerland, mario@seven-art.com. The app processes email for sign-in, public profile data, GPS points during active runs, group memberships and first-party analytics events. Email addresses are never shown publicly.', 'draft-legal-review-required', true),
  ('nutzungsbedingungen', 'en', 'Terms of Use', 'Draft, legal review required. Tusiger is a private heart project. Use is voluntary. Sporting activity is at your own responsibility.', 'draft-legal-review-required', true),
  ('impressum', 'en', 'Imprint', 'Mario Martic / seven-art.com, Riedtalstrasse 14a, 4800 Zofingen, Switzerland. Email: mario@seven-art.com. Phone: 076 572 20 81.', 'draft-legal-review-required', true),
  ('standort-sensoren', 'en', 'Location and Sensor Consent', 'Draft, legal review required. Location data is only used after user action during the pre-run check and while a run is active. Safari may provide inaccurate altitude values or none at all.', 'draft-legal-review-required', true)
on conflict (slug, language) do update
set title = excluded.title,
    body = excluded.body,
    version = excluded.version,
    active = excluded.active,
    updated_at = now();

insert into public.history_content (slug, language, sort_order, year_label, title, body, active)
values
  ('1904', 'en', 1, '1904', 'Commissioning', 'Commissioning of the pressure pipe and the Born stairs.', true),
  ('1960', 'en', 2, '1960', 'Dismantling', 'Dismantling of the pressure pipe and the beginning decay of the stairs.', true),
  ('1986', 'en', 3, '1986', 'Reconstruction', 'Reconstruction by Aarburg initiator Herbert Scheidegger, known as Born-Hörbi.', true),
  ('1987', 'en', 4, '1987', 'Opening', 'Opening of the stairs, today with 1150 steps.', true),
  ('1987-unterhalt', 'en', 5, '1987', 'Volunteer maintenance', 'Start of ongoing maintenance by volunteers.', true)
on conflict (slug, language) do update
set sort_order = excluded.sort_order,
    year_label = excluded.year_label,
    title = excluded.title,
    body = excluded.body,
    active = excluded.active,
    updated_at = now();
