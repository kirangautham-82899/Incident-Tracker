-- Incident Tracker schema (PostgreSQL / Supabase).
-- Idempotent: the API runs this on startup, and you can also paste it into
-- the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists users (
    id                  uuid primary key default gen_random_uuid(),
    name                text not null check (char_length(name) between 1 and 50),
    email               text not null unique check (email = lower(email) and email ~ '^\S+@\S+\.\S+$'),
    password_hash       text not null,
    role                text not null default 'citizen' check (role in ('citizen', 'responder', 'admin')),
    phone               text check (char_length(phone) <= 20),
    reputation          integer not null default 0 check (reputation >= 0),
    incidents_reported  integer not null default 0,
    incidents_verified  integer not null default 0,
    is_active           boolean not null default true,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create table if not exists incidents (
    id                  uuid primary key default gen_random_uuid(),
    type                text not null check (type in ('accident', 'fire', 'medical', 'infrastructure', 'safety', 'other')),
    title               text not null check (char_length(title) between 3 and 100),
    description         text not null check (char_length(description) between 1 and 1000),
    longitude           double precision not null check (longitude between -180 and 180),
    latitude            double precision not null check (latitude between -90 and 90),
    address             text check (char_length(address) <= 200),
    severity            text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
    status              text not null default 'reported' check (status in ('reported', 'verified', 'in-progress', 'resolved', 'false')),
    reporter_id         uuid references users(id) on delete set null,
    reporter_name       text not null check (char_length(reporter_name) <= 50),
    reporter_contact    text check (char_length(reporter_contact) <= 100),
    media               jsonb not null default '[]'::jsonb,
    duplicate_of        uuid references incidents(id) on delete set null,
    assigned_to         uuid references users(id) on delete set null,
    verification_count  integer not null default 0,
    priority            numeric(6, 1) not null default 0,
    responded_at        timestamptz,
    resolved_at         timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index if not exists incidents_created_at_idx on incidents (created_at desc);
create index if not exists incidents_status_idx on incidents (status);
create index if not exists incidents_priority_idx on incidents (priority desc);
create index if not exists incidents_type_status_idx on incidents (type, status);
create index if not exists incidents_reporter_idx on incidents (reporter_id);
create index if not exists incidents_assigned_idx on incidents (assigned_to);
create index if not exists incidents_location_idx on incidents (latitude, longitude);

create table if not exists incident_verifications (
    incident_id uuid not null references incidents(id) on delete cascade,
    user_id     uuid not null references users(id) on delete cascade,
    created_at  timestamptz not null default now(),
    primary key (incident_id, user_id)
);

create table if not exists incident_notes (
    id          uuid primary key default gen_random_uuid(),
    incident_id uuid not null references incidents(id) on delete cascade,
    admin_id    uuid references users(id) on delete set null,
    admin_name  text,
    note        text not null check (char_length(note) between 1 and 500),
    created_at  timestamptz not null default now()
);
create index if not exists incident_notes_incident_idx on incident_notes (incident_id, created_at);

create table if not exists incident_status_history (
    id              uuid primary key default gen_random_uuid(),
    incident_id     uuid not null references incidents(id) on delete cascade,
    status          text not null,
    changed_by      uuid references users(id) on delete set null,
    changed_by_name text,
    created_at      timestamptz not null default now()
);
create index if not exists incident_status_history_incident_idx on incident_status_history (incident_id, created_at);

create table if not exists comments (
    id          uuid primary key default gen_random_uuid(),
    incident_id uuid not null references incidents(id) on delete cascade,
    user_id     uuid references users(id) on delete set null,
    user_name   text not null,
    user_role   text not null,
    content     text not null check (char_length(content) between 1 and 500),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create index if not exists comments_incident_idx on comments (incident_id, created_at desc);

-- Great-circle distance in metres (no PostGIS needed)
create or replace function distance_m(lat1 double precision, lng1 double precision,
                                      lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
    select 2 * 6371000 * asin(sqrt(
        power(sin(radians(lat2 - lat1) / 2), 2) +
        cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    ))
$$;

-- Supabase exposes the public schema through its REST API using the anon key.
-- All access goes through this backend (which connects as the database owner
-- and bypasses RLS), so enable RLS with no policies to block direct access.
alter table users enable row level security;
alter table incidents enable row level security;
alter table incident_verifications enable row level security;
alter table incident_notes enable row level security;
alter table incident_status_history enable row level security;
alter table comments enable row level security;
