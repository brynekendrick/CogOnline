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
    created_at    timestamptz  not null default now()
);

create unique index if not exists users_username_uq on public.users (lower(username));
create unique index if not exists users_email_uq    on public.users (lower(email));
create unique index if not exists users_phone_uq    on public.users (phone);

-- Block Supabase's public REST API from reading this table.
-- The Java backend connects as the postgres role, which bypasses RLS.
alter table public.users enable row level security;

-- After registering, activate an account / make an admin manually:
-- update public.users set active = true where username = 'juandelacruz';
-- update public.users set active = true, role = 'ADMIN' where username = 'youradmin';
