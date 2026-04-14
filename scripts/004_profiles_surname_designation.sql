-- ============================================================
-- Phase 2D: Add surname + designation to profiles
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS surname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation TEXT;
