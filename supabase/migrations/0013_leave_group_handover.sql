-- Verlässt der Besitzer die Gruppe, übernimmt das älteste Mitglied; nur eine leere Gruppe wird gelöscht.
create or replace function public.leave_tusiger_group(p_group_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  heir uuid;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  perform 1 from groups where id = p_group_id for update;
  delete from group_members where group_id = p_group_id and user_id = me;
  if exists (select 1 from groups where id = p_group_id and owner_user_id = me) then
    select user_id into heir from group_members where group_id = p_group_id order by created_at limit 1;
    if heir is null then
      delete from groups where id = p_group_id;
    else
      update groups set owner_user_id = heir where id = p_group_id;
      update group_members set role = 'owner' where group_id = p_group_id and user_id = heir;
    end if;
  end if;
end;
$$;
