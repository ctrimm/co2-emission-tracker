-- Supabase schema reference
-- Exported: 2026-02-21
-- Apply migrations in supabase/migrations/ to keep the live DB in sync.

-- ============================================================
-- Custom types
-- ============================================================

CREATE TYPE public.error_severity AS ENUM ('warning', 'error', 'critical');

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.monitored_sites (
  id                   bigint               NOT NULL,
  domain               text                 NOT NULL,
  name                 text,
  industry             text,
  domain_type          text,
  agency               text,
  organization         text,
  monitoring_frequency text                 NOT NULL,  -- 'daily' | 'weekly'
  is_active            boolean              DEFAULT true,
  check_day            integer,                        -- optional override for weekly day
  created_at           timestamptz          NOT NULL DEFAULT timezone('utc', now()),
  updated_at           timestamptz          NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.website_emissions (
  id                   bigint               NOT NULL,
  date                 date                 NOT NULL,
  domain               text                 NOT NULL,
  name                 text,
  industry             text,
  domain_type          text,
  agency               text,
  organization         text,
  is_green             boolean              NOT NULL,
  estimated_co2_grams  numeric              NOT NULL,
  total_bytes          bigint               NOT NULL,
  created_at           timestamptz          NOT NULL DEFAULT timezone('utc', now()),
  updated_at           timestamptz          NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (date, domain)                               -- upsert conflict target
);

CREATE TABLE public.error_log (
  id                   bigint               NOT NULL,
  url                  text                 NOT NULL,
  error_type           text                 NOT NULL,
  error_message        text                 NOT NULL,
  error_severity       public.error_severity DEFAULT 'error',
  error_details        jsonb,
  resolved             boolean              DEFAULT false,
  resolution_notes     text,
  resolved_at          timestamptz,
  created_at           timestamptz          NOT NULL DEFAULT timezone('utc', now()),
  updated_at           timestamptz          NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================
-- Views
-- ============================================================

CREATE OR REPLACE VIEW public.recent_unresolved_errors
  WITH (security_invoker = true)   -- fixed: was SECURITY DEFINER
AS
  SELECT
    id, url, error_type, error_message, error_severity,
    error_details, resolved, resolution_notes, resolved_at,
    created_at, updated_at
  FROM public.error_log
  WHERE resolved = false
    AND created_at > (now() - INTERVAL '7 days')
  ORDER BY created_at DESC;

-- ============================================================
-- RLS (see migrations/20260221000000_fix_security_issues.sql)
-- ============================================================

-- monitored_sites:  RLS enabled, SELECT open to anon + authenticated
-- website_emissions: RLS enabled, SELECT open to anon + authenticated
-- error_log:         RLS enabled, no public policies (service_role only)
