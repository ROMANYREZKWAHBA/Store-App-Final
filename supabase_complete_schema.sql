-- ============================================================
-- StorePilot PRO Complete Cloud Schema & Migrations
-- Paste this entire SQL block into the Supabase SQL Editor and run it.
-- ============================================================

-- 1. ALTER existing branches table to add missing/legacy columns if needed
DO $$
BEGIN
  -- Add machine_id (required to bind devices to branches)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='machine_id') THEN
    ALTER TABLE branches ADD COLUMN machine_id TEXT UNIQUE;
  END IF;
  
  -- Add activated (licensing status)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='activated') THEN
    ALTER TABLE branches ADD COLUMN activated BOOLEAN DEFAULT false;
  END IF;
  
  -- Add trial_activated
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='trial_activated') THEN
    ALTER TABLE branches ADD COLUMN trial_activated BOOLEAN DEFAULT false;
  END IF;
  
  -- Add trial_start_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='trial_start_date') THEN
    ALTER TABLE branches ADD COLUMN trial_start_date BIGINT;
  END IF;
  
  -- Add trial_duration (default 14 days in ms)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='trial_duration') THEN
    ALTER TABLE branches ADD COLUMN trial_duration BIGINT DEFAULT 1209600000;
  END IF;

  -- Add last_seen_time
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='last_seen_time') THEN
    ALTER TABLE branches ADD COLUMN last_seen_time BIGINT;
  END IF;

  -- Add address if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='address') THEN
    ALTER TABLE branches ADD COLUMN address TEXT DEFAULT '';
  END IF;

  -- Add phone if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='phone') THEN
    ALTER TABLE branches ADD COLUMN phone TEXT DEFAULT '';
  END IF;

  -- Add is_active if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='is_active') THEN
    ALTER TABLE branches ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- 2. STORE SETTINGS (Renamed from settings to avoid collision with licensing table)
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'EGP',
  tax_rate NUMERIC DEFAULT 14,
  enable_service_fee BOOLEAN DEFAULT false,
  service_fee NUMERIC DEFAULT 0,
  store_name TEXT DEFAULT 'StorePilot',
  invoice_logo TEXT,
  invoice_header TEXT DEFAULT '',
  invoice_footer TEXT DEFAULT '',
  language TEXT DEFAULT 'ar',
  theme TEXT DEFAULT 'dark',
  drawer_balance NUMERIC DEFAULT 0,
  main_safe_balance NUMERIC DEFAULT 0,
  bank_balance NUMERIC DEFAULT 0,
  trial_start_date TIMESTAMPTZ DEFAULT now(),
  subscription_status TEXT DEFAULT 'trial',
  subscription_end_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='store_settings' AND column_name='trial_start_date') THEN
    ALTER TABLE store_settings ADD COLUMN trial_start_date TIMESTAMPTZ DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='store_settings' AND column_name='subscription_status') THEN
    ALTER TABLE store_settings ADD COLUMN subscription_status TEXT DEFAULT 'trial';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='store_settings' AND column_name='subscription_end_date') THEN
    ALTER TABLE store_settings ADD COLUMN subscription_end_date TIMESTAMPTZ;
  END IF;
END $$;

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- e.g. 'u_1', 'u_3'
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT,
  password TEXT,
  pin TEXT,
  role TEXT NOT NULL DEFAULT 'Cashier',
  is_active BOOLEAN DEFAULT true,
  recovery_code TEXT,
  assigned_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY, -- e.g. 'cat_1'
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  icon TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ITEMS (INVENTORY)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY, -- e.g. 'i_1', 'ITEM-xxxxx'
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  sku TEXT,
  category_id TEXT,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  base_price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  image TEXT,
  sizes JSONB DEFAULT '[]',
  modifiers JSONB DEFAULT '[]',
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  type TEXT DEFAULT 'PRODUCT', -- 'PRODUCT' or 'RAW'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  order_number TEXT,
  serial_number INTEGER,
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_id TEXT,
  customer_id TEXT,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  taxable NUMERIC DEFAULT 0,
  vat NUMERIC DEFAULT 0,
  service_fee NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  remaining NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  type TEXT DEFAULT 'Dine-in',
  status TEXT DEFAULT 'PAID',
  shift_id TEXT,
  items JSONB DEFAULT '[]', -- array of order line items
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT,
  amount NUMERIC DEFAULT 0,
  note TEXT,
  user_id TEXT,
  shift_id TEXT,
  source TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 9. SHIFTS
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  user_id TEXT,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  opening_balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Open',
  expected_cash NUMERIC DEFAULT 0,
  actual_cash NUMERIC DEFAULT 0,
  cash_variance NUMERIC DEFAULT 0,
  total_cash_sales NUMERIC DEFAULT 0,
  total_card_sales NUMERIC DEFAULT 0,
  total_credit_sales NUMERIC DEFAULT 0,
  total_collections NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  total_supplier_payments NUMERIC DEFAULT 0,
  total_refunds NUMERIC DEFAULT 0,
  total_advances NUMERIC DEFAULT 0,
  drawer_in NUMERIC DEFAULT 0,
  drawer_out NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. DRAWER LOGS
CREATE TABLE IF NOT EXISTS drawer_logs (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  type TEXT, -- 'IN' or 'OUT'
  amount NUMERIC DEFAULT 0,
  note TEXT,
  shift_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 11. CUSTOMER PAYMENTS
CREATE TABLE IF NOT EXISTS customer_payments (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  customer_id TEXT,
  order_id TEXT,
  amount NUMERIC DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 12. PURCHASES
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}', -- full purchase object
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 13. VOUCHERS
CREATE TABLE IF NOT EXISTS vouchers (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 14. CASH LOG
CREATE TABLE IF NOT EXISTS cash_log (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 15. STAFF EMPLOYEES
CREATE TABLE IF NOT EXISTS staff_employees (
  id TEXT PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. STAFF PAYMENTS
CREATE TABLE IF NOT EXISTS staff_payments (
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  payments JSONB DEFAULT '[]',
  PRIMARY KEY (branch_id, user_id)
);

-- 17. USER PERMISSIONS
CREATE TABLE IF NOT EXISTS user_permissions (
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  permissions JSONB DEFAULT '[]',
  PRIMARY KEY (branch_id, user_id)
);

-- 18. SAFES
CREATE TABLE IF NOT EXISTS safes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  balance     NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_items_branch ON items(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_shift ON orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_shifts_branch ON shifts(branch_id);
CREATE INDEX IF NOT EXISTS idx_drawer_logs_branch ON drawer_logs(branch_id);

-- ============================================================
-- ENABLE REALTIME on inventory and orders
-- ============================================================
-- Check if tables are already in the publication first before adding them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ============================================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE safes ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure no duplicate key errors
DROP POLICY IF EXISTS "Allow all for anon" ON branches;
DROP POLICY IF EXISTS "Allow all for anon" ON store_settings;
DROP POLICY IF EXISTS "Allow all for anon" ON users;
DROP POLICY IF EXISTS "Allow all for anon" ON categories;
DROP POLICY IF EXISTS "Allow all for anon" ON items;
DROP POLICY IF EXISTS "Allow all for anon" ON orders;
DROP POLICY IF EXISTS "Allow all for anon" ON customers;
DROP POLICY IF EXISTS "Allow all for anon" ON expenses;
DROP POLICY IF EXISTS "Allow all for anon" ON shifts;
DROP POLICY IF EXISTS "Allow all for anon" ON drawer_logs;
DROP POLICY IF EXISTS "Allow all for anon" ON customer_payments;
DROP POLICY IF EXISTS "Allow all for anon" ON purchases;
DROP POLICY IF EXISTS "Allow all for anon" ON vouchers;
DROP POLICY IF EXISTS "Allow all for anon" ON cash_log;
DROP POLICY IF EXISTS "Allow all for anon" ON staff_employees;
DROP POLICY IF EXISTS "Allow all for anon" ON staff_payments;
DROP POLICY IF EXISTS "Allow all for anon" ON user_permissions;
DROP POLICY IF EXISTS "Allow all for anon" ON safes;

-- Enable public anonymous access (required for client-side operations using anon key)
CREATE POLICY "Allow all for anon" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON store_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON drawer_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customer_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vouchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON cash_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON staff_employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON staff_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON user_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON safes FOR ALL USING (true) WITH CHECK (true);
