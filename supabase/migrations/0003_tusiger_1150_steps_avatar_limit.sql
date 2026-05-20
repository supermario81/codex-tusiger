update public.challenge_config
set total_steps = 1150,
    updated_at = now()
where name = 'Tusiger'
  and active = true;

update storage.buckets
set file_size_limit = 1048576,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';
