import { supabase } from './supabaseClient';

// ============================================================
// BRANCH MANAGEMENT
// ============================================================
export async function getOrCreateBranch(machineId, branchName = 'Main Branch') {
  // Try to find existing branch
  const { data: existing } = await supabase
    .from('branches')
    .select('*')
    .eq('machine_id', machineId)
    .single();

  if (existing) return existing;

  // Create new branch
  const { data: created, error } = await supabase
    .from('branches')
    .insert({ machine_id: machineId, name: branchName, created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function checkTrialStatus(branchId) {
  const { data } = await supabase.from('branches').select('*').eq('id', branchId).single();
  if (!data) return { expired: true };
  if (data.activated) return { expired: false, activated: true };
  if (data.trial_activated && data.trial_start_date) {
    const duration = data.trial_duration || 14 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - data.trial_start_date;
    return { expired: elapsed > duration, activated: false };
  }
  return { expired: false, activated: false };
}

// ============================================================
// GENERIC CRUD HELPERS
// ============================================================
async function fetchAll(table, branchId) {
  const { data, error } = await supabase.from(table).select('*').eq('branch_id', branchId);
  if (error) { console.error(`Fetch ${table}:`, error); return []; }
  return data || [];
}

async function upsertRow(table, row) {
  const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
  if (error) console.error(`Upsert ${table}:`, error);
}

async function insertRow(table, row) {
  const { error } = await supabase.from(table).insert(row);
  if (error) console.error(`Insert ${table}:`, error);
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) console.error(`Delete ${table}:`, error);
}

async function updateRow(table, id, updates) {
  const { error } = await supabase.from(table).update(updates).eq('id', id);
  if (error) console.error(`Update ${table}:`, error);
}

// ============================================================
// SETTINGS
// ============================================================
export async function fetchSettings(branchId) {
  const { data } = await supabase.from('settings').select('*').eq('branch_id', branchId).single();
  return data;
}

export async function saveSettings(branchId, settings) {
  await supabase.from('settings').upsert({
    branch_id: branchId,
    ...settings,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'branch_id' });
}

// ============================================================
// USERS
// ============================================================
export async function fetchUsers(branchId) {
  // Left-join branches to get assigned branch name
  const { data, error } = await supabase
    .from('users')
    .select('*, assigned_branch:branches!assigned_branch_id(id, name)')
    .eq('branch_id', branchId);
  if (error) { console.error('Fetch users:', error); return []; }
  return (data || []).map(u => ({
    id: u.id, name: u.name, username: u.username, password: u.password,
    pin: u.pin, role: u.role, isActive: u.is_active, recoveryCode: u.recovery_code,
    assignedBranchId: u.assigned_branch_id || null,
    assignedBranchName: u.assigned_branch?.name || null,
  }));
}

export async function saveUser(branchId, user) {
  await upsertRow('users', {
    id: user.id, branch_id: branchId, name: user.name, username: user.username,
    password: user.password, pin: user.pin, role: user.role,
    is_active: user.isActive, recovery_code: user.recoveryCode,
    assigned_branch_id: user.assignedBranchId || null,
  });
}

// ============================================================
// CATEGORIES
// ============================================================
export async function fetchCategories(branchId) {
  const data = await fetchAll('categories', branchId);
  return data.map(c => ({ id: c.id, name: { en: c.name_en, ar: c.name_ar }, icon: c.icon }));
}

export async function saveCategory(branchId, cat) {
  await upsertRow('categories', {
    id: cat.id, branch_id: branchId, name_en: cat.name.en, name_ar: cat.name.ar, icon: cat.icon,
  });
}

// ============================================================
// ITEMS (INVENTORY)
// ============================================================
export async function fetchItems(branchId) {
  const data = await fetchAll('items', branchId);
  return data.map(i => ({
    id: i.id, sku: i.sku, categoryId: i.category_id,
    name: { en: i.name_en, ar: i.name_ar }, basePrice: Number(i.base_price),
    costPrice: Number(i.cost_price), image: i.image, sizes: i.sizes || [],
    modifiers: i.modifiers || [], stock: i.stock, isActive: i.is_active, type: i.type,
  }));
}

export async function saveItem(branchId, item) {
  await upsertRow('items', {
    id: item.id, branch_id: branchId, sku: item.sku, category_id: item.categoryId,
    name_en: item.name.en, name_ar: item.name.ar, base_price: item.basePrice,
    cost_price: item.costPrice, image: item.image, sizes: item.sizes,
    modifiers: item.modifiers, stock: item.stock, is_active: item.isActive, type: item.type,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteItem(id) { await deleteRow('items', id); }

// ============================================================
// ORDERS
// ============================================================
export async function fetchOrders(branchId) {
  const data = await fetchAll('orders', branchId);
  return data.map(o => ({
    id: o.id, orderNumber: o.order_number, serialNumber: o.serial_number,
    timestamp: o.timestamp, userId: o.user_id, customerId: o.customer_id,
    subtotal: Number(o.subtotal), discount: Number(o.discount),
    taxable: Number(o.taxable), vat: Number(o.vat),
    serviceFee: Number(o.service_fee), total: Number(o.total),
    amountPaid: Number(o.amount_paid), balanceDue: Number(o.balance_due),
    remaining: Number(o.remaining), paymentMethod: o.payment_method,
    type: o.type, status: o.status, shiftId: o.shift_id, items: o.items || [],
  }));
}

export async function saveOrder(branchId, order) {
  await upsertRow('orders', {
    id: order.id, branch_id: branchId, order_number: order.orderNumber,
    serial_number: order.serialNumber, timestamp: order.timestamp,
    user_id: order.userId, customer_id: order.customerId,
    subtotal: order.subtotal, discount: order.discount, taxable: order.taxable,
    vat: order.vat, service_fee: order.serviceFee, total: order.total,
    amount_paid: order.amountPaid, balance_due: order.balanceDue,
    remaining: order.remaining, payment_method: order.paymentMethod,
    type: order.type, status: order.status, shift_id: order.shiftId,
    items: order.items,
  });
}

// ============================================================
// CUSTOMERS
// ============================================================
export async function fetchCustomers(branchId) {
  const data = await fetchAll('customers', branchId);
  return data.map(c => ({ id: c.id, name: c.name, phone: c.phone, createdAt: c.created_at }));
}

export async function saveCustomer(branchId, cust) {
  await upsertRow('customers', {
    id: cust.id, branch_id: branchId, name: cust.name, phone: cust.phone,
  });
}

// ============================================================
// EXPENSES
// ============================================================
export async function fetchExpenses(branchId) {
  const data = await fetchAll('expenses', branchId);
  return data.map(e => ({
    id: e.id, name: e.name, amount: Number(e.amount), note: e.note,
    userId: e.user_id, shiftId: e.shift_id, source: e.source, timestamp: e.timestamp,
  }));
}

export async function saveExpense(branchId, exp) {
  await upsertRow('expenses', {
    id: exp.id || 'EXP-' + Date.now(), branch_id: branchId, name: exp.name,
    amount: exp.amount, note: exp.note, user_id: exp.userId,
    shift_id: exp.shiftId, source: exp.source, timestamp: exp.timestamp,
  });
}

// ============================================================
// SHIFTS
// ============================================================
export async function fetchShifts(branchId) {
  const data = await fetchAll('shifts', branchId);
  return data.map(s => ({
    id: s.id, userId: s.user_id, openedAt: s.opened_at, closedAt: s.closed_at,
    openingBalance: Number(s.opening_balance), status: s.status,
    expectedCash: Number(s.expected_cash), actualCash: Number(s.actual_cash),
    cashVariance: Number(s.cash_variance), totalCashSales: Number(s.total_cash_sales),
    totalCardSales: Number(s.total_card_sales), totalCreditSales: Number(s.total_credit_sales),
    totalCollections: Number(s.total_collections), totalExpenses: Number(s.total_expenses),
    totalSupplierPayments: Number(s.total_supplier_payments), totalRefunds: Number(s.total_refunds),
    totalAdvances: Number(s.total_advances), drawerIn: Number(s.drawer_in), drawerOut: Number(s.drawer_out),
  }));
}

export async function saveShift(branchId, shift) {
  await upsertRow('shifts', {
    id: shift.id, branch_id: branchId, user_id: shift.userId,
    opened_at: shift.openedAt, closed_at: shift.closedAt,
    opening_balance: shift.openingBalance, status: shift.status,
    expected_cash: shift.expectedCash, actual_cash: shift.actualCash,
    cash_variance: shift.cashVariance, total_cash_sales: shift.totalCashSales,
    total_card_sales: shift.totalCardSales, total_credit_sales: shift.totalCreditSales,
    total_collections: shift.totalCollections, total_expenses: shift.totalExpenses,
    total_supplier_payments: shift.totalSupplierPayments, total_refunds: shift.totalRefunds,
    total_advances: shift.totalAdvances, drawer_in: shift.drawerIn, drawer_out: shift.drawerOut,
  });
}

// ============================================================
// DRAWER LOGS
// ============================================================
export async function fetchDrawerLogs(branchId) {
  const data = await fetchAll('drawer_logs', branchId);
  return data.map(l => ({
    id: l.id, type: l.type, amount: Number(l.amount), note: l.note,
    shiftId: l.shift_id, timestamp: l.timestamp,
  }));
}

export async function saveDrawerLog(branchId, log) {
  await upsertRow('drawer_logs', {
    id: log.id, branch_id: branchId, type: log.type, amount: log.amount,
    note: log.note, shift_id: log.shiftId, timestamp: log.timestamp,
  });
}

// ============================================================
// CUSTOMER PAYMENTS
// ============================================================
export async function fetchCustomerPayments(branchId) {
  const data = await fetchAll('customer_payments', branchId);
  return data.map(p => ({
    id: p.id, customerId: p.customer_id, orderId: p.order_id,
    amount: Number(p.amount), timestamp: p.timestamp,
  }));
}

export async function saveCustomerPayment(branchId, pmt) {
  await upsertRow('customer_payments', {
    id: pmt.id || 'CPMT-' + Date.now(), branch_id: branchId,
    customer_id: pmt.customerId, order_id: pmt.orderId, amount: pmt.amount,
  });
}

// ============================================================
// JSONB-WRAPPED TABLES (purchases, vouchers, cashLog, staffEmployees)
// ============================================================
export async function fetchJsonTable(table, branchId) {
  const data = await fetchAll(table, branchId);
  return data.map(r => ({ ...r.data, _dbId: r.id }));
}

export async function saveJsonRow(table, branchId, row) {
  const id = row.id || row._dbId || `${table.toUpperCase()}-${Date.now()}`;
  await upsertRow(table, { id, branch_id: branchId, data: row });
}

// ============================================================
// STAFF PAYMENTS (map: userId -> payments[])
// ============================================================
export async function fetchStaffPayments(branchId) {
  const { data } = await supabase.from('staff_payments').select('*').eq('branch_id', branchId);
  const map = {};
  (data || []).forEach(r => { map[r.user_id] = r.payments || []; });
  return map;
}

export async function saveStaffPayments(branchId, userId, payments) {
  await supabase.from('staff_payments').upsert({
    branch_id: branchId, user_id: userId, payments,
  }, { onConflict: 'branch_id,user_id' });
}

// ============================================================
// USER PERMISSIONS
// ============================================================
export async function fetchUserPermissions(branchId) {
  const { data } = await supabase.from('user_permissions').select('*').eq('branch_id', branchId);
  const map = {};
  (data || []).forEach(r => { map[r.user_id] = r.permissions || []; });
  return map;
}

export async function saveUserPermissions(branchId, userId, perms) {
  await supabase.from('user_permissions').upsert({
    branch_id: branchId, user_id: userId, permissions: perms,
  }, { onConflict: 'branch_id,user_id' });
}

// ============================================================
// BALANCE FIELDS (stored in settings)
// ============================================================
export async function fetchBalances(branchId) {
  const { data } = await supabase.from('settings').select('*').eq('branch_id', branchId).single();
  if (!data) return { drawerBalance: 0, mainSafeBalance: 0, bankBalance: 0 };
  return {
    drawerBalance: Number(data.drawer_balance) || 0,
    mainSafeBalance: Number(data.main_safe_balance) || 0,
    bankBalance: Number(data.bank_balance) || 0,
  };
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================
export function subscribeToItems(branchId, onUpdate) {
  return supabase
    .channel('items-realtime')
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'items',
      filter: `branch_id=eq.${branchId}`,
    }, (payload) => { onUpdate(payload); })
    .subscribe();
}

export function subscribeToOrders(branchId, onUpdate) {
  return supabase
    .channel('orders-realtime')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'orders',
      filter: `branch_id=eq.${branchId}`,
    }, (payload) => { onUpdate(payload); })
    .subscribe();
}
