-- ============================================================
-- AMTEC Calendar-Dispatch: Phase 2C Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── 1. Split contact_info → contact_person + contact_number ──
ALTER TABLE dispatches
  ADD COLUMN IF NOT EXISTS contact_person TEXT;

ALTER TABLE dispatches
  ADD COLUMN IF NOT EXISTS contact_number TEXT;

-- Backfill from contact_info: try splitting on " - "
UPDATE dispatches
SET contact_person = SPLIT_PART(contact_info, ' - ', 1),
    contact_number = CASE
      WHEN contact_info LIKE '%-%' THEN TRIM(SPLIT_PART(contact_info, ' - ', 2))
      ELSE NULL
    END
WHERE contact_info IS NOT NULL AND contact_person IS NULL;

-- ─── 2. Convert engineer → lead_engineer ────────────────────────
-- All existing engineer assignments become lead_engineer
UPDATE dispatch_assignments
SET assignment_type = 'lead_engineer'
WHERE assignment_type = 'engineer';

-- ─── Done! ──────────────────────────────────────────────────────
-- assignment_type values are now: lead_engineer, assistant_engineer, technician
-- contact_info column is kept as backup
