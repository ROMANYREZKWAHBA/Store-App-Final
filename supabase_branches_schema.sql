-- ============================================================
-- StorePilot PRO — Branch Provisioning SQL Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- 1. BRANCHES TABLE (ensure it exists with required fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Legacy fields (kept for backward compat with existing branch system)
  machine_id  TEXT UNIQUE,
  activated   BOOLEAN DEFAULT false,
  trial_activated BOOLEAN DEFAULT false,
  trial_start_date BIGINT,
  trial_duration BIGINT
);

-- Add new columns if branches table already exists but lacks them
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='address') THEN
    ALTER TABLE branches ADD COLUMN address TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='phone') THEN
    ALTER TABLE branches ADD COLUMN phone TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='is_active') THEN
    ALTER TABLE branches ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Index for quick active-branch lookups
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches (is_active) WHERE is_active = true;


-- ============================================================
-- 2. SAFES (TREASURY) TABLE + AUTO-PROVISIONING TRIGGER
-- ============================================================
CREATE TABLE IF NOT EXISTS safes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  balance     NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id)
);

-- Trigger Function: auto-create a safe row when a new branch is inserted
CREATE OR REPLACE FUNCTION fn_provision_branch_safe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO safes (branch_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (branch_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, then create
DROP TRIGGER IF EXISTS trg_provision_branch_safe ON branches;

CREATE TRIGGER trg_provision_branch_safe
  AFTER INSERT ON branches
  FOR EACH ROW
  EXECUTE FUNCTION fn_provision_branch_safe();


-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS) — Owner-Only Write Access
-- ============================================================
-- Enable RLS on branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Allow ALL authenticated users to READ branches (needed for branch selection)
DROP POLICY IF EXISTS "Branches: read access for authenticated" ON branches;
CREATE POLICY "Branches: read access for authenticated"
  ON branches
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow ONLY Owner role to INSERT new branches
-- This checks the 'users' table for the current auth user's role
DROP POLICY IF EXISTS "Branches: owner insert only" ON branches;
CREATE POLICY "Branches: owner insert only"
  ON branches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.role = 'Owner'
      LIMIT 1
    )
  );

-- Allow ONLY Owner role to UPDATE branches
DROP POLICY IF EXISTS "Branches: owner update only" ON branches;
CREATE POLICY "Branches: owner update only"
  ON branches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.role = 'Owner'
      LIMIT 1
    )
  );

-- Allow ONLY Owner role to DELETE branches
DROP POLICY IF EXISTS "Branches: owner delete only" ON branches;
CREATE POLICY "Branches: owner delete only"
  ON branches
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.role = 'Owner'
      LIMIT 1
    )
  );

-- Enable RLS on safes table too
ALTER TABLE safes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Safes: read access for authenticated" ON safes;
CREATE POLICY "Safes: read access for authenticated"
  ON safes
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Safes: owner write only" ON safes;
CREATE POLICY "Safes: owner write only"
  ON safes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.role = 'Owner'
      LIMIT 1
    )
  );

-- ============================================================
-- DONE — Execute this entire script in Supabase SQL Editor
-- ============================================================
