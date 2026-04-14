-- ============================================================
-- Phase 2E: Add created_by_role to dispatches
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS created_by_role TEXT;
