-- Run this in Supabase > SQL Editor
create table if not exists public.users (
    id            bigserial primary key,
    first_name    varchar(100) not null,
    middle_name   varchar(100),
    last_name     varchar(100) not null,
    username      varchar(50)  not null,
    email         varchar(255) not null,
    phone         varchar(20)  not null,
    dob           date         not null,
    civil_status  varchar(20)  not null default 'Single',
    street        varchar(255) not null,
    purok         varchar(100) not null,
    barangay      varchar(100) not null,
    city          varchar(100) not null,
    province      varchar(100) not null,
    postal_code   varchar(20)  not null,
    password_hash varchar(100) not null,
    role          varchar(20)  not null default 'RESIDENT',  -- RESIDENT | ADMIN
    active        boolean      not null default false,       -- false = pending verification
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now()
);

-- Safe migration for existing Increment 1 databases
alter table public.users add column if not exists updated_at timestamptz not null default now();

create unique index if not exists users_username_uq on public.users (lower(username));
create unique index if not exists users_email_uq    on public.users (lower(email));
create unique index if not exists users_phone_uq    on public.users (phone);

-- Block Supabase's public REST API from reading this table.
-- The Java backend connects as the postgres role, which bypasses RLS.
alter table public.users enable row level security;

-- Password reset tokens (Increment 2)
create table if not exists public.password_reset_tokens (
    id          bigserial    primary key,
    user_id     bigint       not null references public.users(id) on delete cascade,
    token_hash  varchar(64)  not null unique,
    expires_at  timestamptz  not null,
    used        boolean      not null default false,
    used_at     timestamptz,
    created_at  timestamptz  not null default now()
);

create index if not exists idx_prt_user_id    on public.password_reset_tokens (user_id);
create index if not exists idx_prt_expires_at on public.password_reset_tokens (expires_at);

alter table public.password_reset_tokens enable row level security;

-- After registering, activate an account / make an admin manually:
-- update public.users set active = true where username = 'juandelacruz';
-- update public.users set active = true, role = 'ADMIN' where username = 'youradmin';
