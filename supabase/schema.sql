-- =============================================================
--  LÍNEA GENTLEMEN — Esquema de base de datos (Supabase / Postgres)
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- =============================================================

-- ----------  TABLAS  ----------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  nombre text not null,
  apellidos text not null,
  telefono text not null,
  rol text not null default 'cliente' check (rol in ('cliente', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  foto_url text,
  activo boolean not null default true
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete cascade not null,
  barber_id uuid references public.barbers(id) not null,
  service text not null check (service in ('corte', 'corte_barba')),
  fecha date not null,
  hora_inicio time not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','completada','cancelada','no_presentado')),
  codigo_reserva uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references public.barbers(id) on delete cascade not null,
  fecha date not null,
  hora_inicio time not null,
  motivo text
);

-- Evita dos citas activas para el mismo peluquero, fecha y hora.
create unique index if not exists appointments_no_double_book
  on public.appointments (barber_id, fecha, hora_inicio)
  where estado <> 'cancelada';

create unique index if not exists blocked_slots_unique
  on public.blocked_slots (barber_id, fecha, hora_inicio);

create index if not exists appointments_fecha_idx on public.appointments (fecha);
create index if not exists appointments_user_idx on public.appointments (user_id);

-- ----------  FUNCIONES AUXILIARES  ----------

-- ¿El usuario actual es admin? (SECURITY DEFINER evita recursión de RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and rol = 'admin'
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- Slots ocupados (citas activas + bloqueos) de un día, sin datos personales.
-- Permite calcular disponibilidad sin exponer información de otros clientes.
create or replace function public.taken_slots(p_fecha date)
returns table (barber_id uuid, hora_inicio time)
language sql
stable
security definer
set search_path = public
as $$
  select a.barber_id, a.hora_inicio
  from public.appointments a
  where a.fecha = p_fecha and a.estado <> 'cancelada'
  union
  select b.barber_id, b.hora_inicio
  from public.blocked_slots b
  where b.fecha = p_fecha;
$$;
grant execute on function public.taken_slots(date) to authenticated;

-- ----------  ROW LEVEL SECURITY  ----------

alter table public.profiles enable row level security;
alter table public.barbers enable row level security;
alter table public.appointments enable row level security;
alter table public.blocked_slots enable row level security;

-- PROFILES
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (user_id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- BARBERS (lectura para cualquier usuario autenticado; gestión solo admin)
drop policy if exists barbers_select on public.barbers;
create policy barbers_select on public.barbers
  for select using (auth.role() = 'authenticated');

drop policy if exists barbers_admin on public.barbers;
create policy barbers_admin on public.barbers
  for all using (public.is_admin()) with check (public.is_admin());

-- APPOINTMENTS
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
  for insert with check (user_id = auth.uid());

drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists appointments_delete on public.appointments;
create policy appointments_delete on public.appointments
  for delete using (public.is_admin());

-- BLOCKED SLOTS (solo admin; los clientes ven disponibilidad vía taken_slots)
drop policy if exists blocked_admin on public.blocked_slots;
create policy blocked_admin on public.blocked_slots
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------  DATOS INICIALES  ----------

insert into public.barbers (nombre, activo)
select * from (values
  ('Alberto', true),
  ('Carlos', true),
  ('Miguel', true),
  ('Sergio', true)
) as v(nombre, activo)
where not exists (select 1 from public.barbers);

-- ----------  CÓMO CREAR UN ADMIN  ----------
-- 1) Regístrate en la app (nombre, apellidos, teléfono, email y contraseña).
-- 2) Ejecuta (sustituyendo el email):
--    update public.profiles set rol = 'admin'
--    where user_id = (select id from auth.users where email = 'tu-email@ejemplo.com');
