-- ============================================================
-- AMTEC Calendar-Dispatch: Phase 2C.2 — Staff Calendar Events
-- Run this in Supabase SQL Editor AFTER 002_phase2c_schema.sql
-- ============================================================

-- Staff calendar events: day_off, meeting, wfh, scheduler, email, no_pasok
CREATE TABLE IF NOT EXISTS staff_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,  -- 'day_off', 'scheduler', 'wfh', 'meeting', 'email', 'no_pasok'
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one event per person per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_calendar_events_unique
  ON staff_calendar_events (profile_id, event_date);

-- Index for fast month queries
CREATE INDEX IF NOT EXISTS idx_staff_calendar_events_date
  ON staff_calendar_events (event_date);

-- ─── Done! ──────────────────────────────────────────────────────
-- event_type values: day_off, scheduler, wfh, meeting, email, no_pasok
