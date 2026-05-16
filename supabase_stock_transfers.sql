-- ============================================================
-- StorePilot PRO — Step 3: Stock Transfer Approval Workflow
-- Run in Supabase SQL Editor AFTER branches + employee binding
-- ============================================================

-- 1. Stock Transfers Table
CREATE TABLE IF NOT EXISTS stock_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_branch_id  UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  to_branch_id    UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  item_id         TEXT NOT NULL,
  item_name_en    TEXT NOT NULL DEFAULT '',
  item_name_ar    TEXT NOT NULL DEFAULT '',
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes           TEXT DEFAULT '',
  created_by      TEXT,
  approved_by     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_different_branches CHECK (from_branch_id <> to_branch_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_status ON stock_transfers (status);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON stock_transfers (to_branch_id, status);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON stock_transfers (from_branch_id, status);

-- Enable RLS
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transfers: read for authenticated" ON stock_transfers;
CREATE POLICY "Transfers: read for authenticated"
  ON stock_transfers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Transfers: insert for authenticated" ON stock_transfers;
CREATE POLICY "Transfers: insert for authenticated"
  ON stock_transfers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Transfers: update for authenticated" ON stock_transfers;
CREATE POLICY "Transfers: update for authenticated"
  ON stock_transfers FOR UPDATE TO authenticated USING (true);


-- ============================================================
-- 2. APPROVE TRANSFER — Atomic Transaction RPC
-- ============================================================
CREATE OR REPLACE FUNCTION approve_stock_transfer(
  p_transfer_id UUID,
  p_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer RECORD;
  v_sender_stock INTEGER;
  v_receiver_exists BOOLEAN;
BEGIN
  -- Lock the transfer row to prevent race conditions
  SELECT * INTO v_transfer
  FROM stock_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer not found');
  END IF;

  IF v_transfer.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer is no longer pending (status: ' || v_transfer.status || ')');
  END IF;

  -- Check sender branch stock
  SELECT stock INTO v_sender_stock
  FROM items
  WHERE id = v_transfer.item_id AND branch_id = v_transfer.from_branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found in sender branch');
  END IF;

  IF v_sender_stock < v_transfer.quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock in sender branch (available: ' || v_sender_stock || ', requested: ' || v_transfer.quantity || ')');
  END IF;

  -- Deduct from sender
  UPDATE items
  SET stock = stock - v_transfer.quantity,
      updated_at = now()
  WHERE id = v_transfer.item_id AND branch_id = v_transfer.from_branch_id;

  -- Check if item exists in receiver branch
  SELECT EXISTS(
    SELECT 1 FROM items
    WHERE id = v_transfer.item_id AND branch_id = v_transfer.to_branch_id
  ) INTO v_receiver_exists;

  IF v_receiver_exists THEN
    -- Increment existing stock
    UPDATE items
    SET stock = stock + v_transfer.quantity,
        updated_at = now()
    WHERE id = v_transfer.item_id AND branch_id = v_transfer.to_branch_id;
  ELSE
    -- Clone item from sender to receiver branch with transferred quantity
    INSERT INTO items (id, branch_id, sku, category_id, name_en, name_ar,
                       base_price, cost_price, image, sizes, modifiers,
                       stock, is_active, type, updated_at)
    SELECT id, v_transfer.to_branch_id, sku, category_id, name_en, name_ar,
           base_price, cost_price, image, sizes, modifiers,
           v_transfer.quantity, is_active, type, now()
    FROM items
    WHERE id = v_transfer.item_id AND branch_id = v_transfer.from_branch_id;
  END IF;

  -- Mark transfer as approved
  UPDATE stock_transfers
  SET status = 'approved',
      approved_by = p_user_id,
      updated_at = now()
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ============================================================
-- 3. REJECT TRANSFER — Simple status update RPC
-- ============================================================
CREATE OR REPLACE FUNCTION reject_stock_transfer(
  p_transfer_id UUID,
  p_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM stock_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer not found');
  END IF;

  IF v_status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer is no longer pending');
  END IF;

  UPDATE stock_transfers
  SET status = 'rejected',
      approved_by = p_user_id,
      updated_at = now()
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
