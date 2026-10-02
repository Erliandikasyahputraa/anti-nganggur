-- ============================================================================
-- ANTI-NGANGGUR MIGRATION 009
-- Align public.companies with the application's CompanyInsert shape
-- ============================================================================
--
-- ROOT CAUSE (found 2026-10-02):
-- The production `companies` table was missing the columns `location`,
-- `linkedin_url`, `github_url`, and `overview`, while the application sends
-- all of them on every insert (src/lib/api/companies.ts -> createCompany).
-- PostgREST rejects the insert with "Could not find the '<col>' column of
-- 'companies' in the schema cache", which surfaces to the user as
-- "Failed to create company" on every Company Save.
--
-- `IF NOT EXISTS` keeps this migration safe to run on databases where the
-- columns already exist (e.g. fresh setups built from migration 004).
-- Do NOT edit migration 004 retroactively; it is a historical record.
-- ============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS overview text;
