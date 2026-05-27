-- ─── Migración: añadir email al perfil ──────────────────────────
-- Para mostrar el email del cliente en el panel admin.

-- 1) Añade la columna si no existe
alter table public.profiles
  add column if not exists email text;

-- 2) Rellena los emails existentes desde auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and (p.email is null or p.email = '');

-- 3) Trigger para mantener email sincronizado al actualizar auth.users
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.profiles
  set email = new.email
  where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_profile_email on auth.users;
create trigger trg_sync_profile_email
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- 4) Trigger para crear automáticamente el perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (user_id, email, nombre, apellidos, telefono, rol)
  values (new.id, new.email, '', '', '', 'cliente')
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();
