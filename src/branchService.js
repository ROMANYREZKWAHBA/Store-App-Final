import { supabase } from './supabaseClient';

// ============================================================
// BRANCH PROVISIONING SERVICE — Owner-Only Operations
// ============================================================

/**
 * Fetch all branches from Supabase, ordered by creation date (newest first).
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function fetchAllBranches() {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ fetchAllBranches:', error);
    return { data: [], error };
  }
  return { data: data || [], error: null };
}

/**
 * Fetch only active branches (for dropdowns).
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function fetchActiveBranches() {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ fetchActiveBranches:', error);
    return { data: [], error };
  }
  return { data: data || [], error: null };
}

/**
 * Insert a new branch. The database trigger will auto-create a safe entry.
 * @param {{ name: string, address?: string, phone?: string }} branch
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createBranch({ name, address = '', phone = '' }) {
  const { data, error } = await supabase
    .from('branches')
    .insert({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('❌ createBranch:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

/**
 * Toggle branch active status (soft activate/deactivate).
 * @param {string} branchId - UUID of the branch
 * @param {boolean} isActive - New status
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function toggleBranchStatus(branchId, isActive) {
  const { data, error } = await supabase
    .from('branches')
    .update({ is_active: isActive })
    .eq('id', branchId)
    .select()
    .single();

  if (error) {
    console.error('❌ toggleBranchStatus:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

/**
 * Update branch details (name, address, phone).
 * @param {string} branchId
 * @param {{ name?: string, address?: string, phone?: string }} updates
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateBranch(branchId, updates) {
  const cleanUpdates = {};
  if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
  if (updates.address !== undefined) cleanUpdates.address = updates.address.trim();
  if (updates.phone !== undefined) cleanUpdates.phone = updates.phone.trim();

  const { data, error } = await supabase
    .from('branches')
    .update(cleanUpdates)
    .eq('id', branchId)
    .select()
    .single();

  if (error) {
    console.error('❌ updateBranch:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

/**
 * Delete a branch permanently.
 * @param {string} branchId
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteBranch(branchId) {
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', branchId);

  if (error) {
    console.error('❌ deleteBranch:', error);
    return { error };
  }
  return { error: null };
}
