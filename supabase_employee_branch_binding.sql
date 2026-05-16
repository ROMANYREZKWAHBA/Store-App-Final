-- ============================================================
-- StorePilot PRO — Step 2: Employee-Branch Binding Migration
-- Run this in Supabase SQL Editor AFTER the branches schema
-- ============================================================

-- 1. Add branch_id FK column to users table (nullable for Owners)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'assigned_branch_id'
  ) THEN
    ALTER TABLE users ADD COLUMN assigned_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for quick employee-by-branch lookups
CREATE INDEX IF NOT EXISTS idx_users_assigned_branch ON users (assigned_branch_id) WHERE assigned_branch_id IS NOT NULL;

-- ============================================================
-- DONE — The column is nullable, so existing users won't break.
-- Owner accounts keep assigned_branch_id = NULL (global access).
-- Admin/Cashier accounts MUST have a value set from the UI.
-- ============================================================
