-- Migration: Fix Supabase security advisor warnings
-- Date: 2026-02-21
--
-- Apply in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to run multiple times (uses IF EXISTS / OR REPLACE where needed).

-- ============================================================
-- 1. Fix SECURITY DEFINER view
--    Switch recent_unresolved_errors to SECURITY INVOKER so that
--    RLS policies of the *querying* user are enforced rather than
--    those of the view owner (postgres / supabase_admin).
--    Requires PostgreSQL 15+ — Supabase is on PG15+.
-- ============================================================
ALTER VIEW public.recent_unresolved_errors SET (security_invoker = true);


-- ============================================================
-- 2. error_log — enable RLS, no public access
--    The cron job writes via service_role which bypasses RLS.
--    No anon/authenticated role should read this internal table.
-- ============================================================
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. monitored_sites — enable RLS, public read-only
--    Lambda functions query this table with the anon key.
--    All writes come from service_role (bypasses RLS).
-- ============================================================
ALTER TABLE public.monitored_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on monitored_sites"
  ON public.monitored_sites
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- ============================================================
-- 4. website_emissions — enable RLS, public read-only
--    Lambda functions query this table with the anon key.
--    All writes come from the cron job via service_role (bypasses RLS).
-- ============================================================
ALTER TABLE public.website_emissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on website_emissions"
  ON public.website_emissions
  FOR SELECT
  TO anon, authenticated
  USING (true);
