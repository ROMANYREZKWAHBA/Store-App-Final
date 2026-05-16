import { supabase } from './supabaseClient';

// ============================================================
// STOCK TRANSFER SERVICE — Two-Step Approval Workflow
// ============================================================

/** Fetch transfers relevant to a branch (sent or received). */
export async function fetchTransfers(branchId) {
  const { data, error } = await supabase
    .from('stock_transfers')
    .select('*, from_branch:branches!from_branch_id(id, name), to_branch:branches!to_branch_id(id, name)')
    .or(`from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`)
    .order('created_at', { ascending: false });

  if (error) { console.error('❌ fetchTransfers:', error); return { data: [], error }; }
  return { data: data || [], error: null };
}

/** Create a new pending transfer request. */
export async function createTransfer({ fromBranchId, toBranchId, itemId, itemNameEn, itemNameAr, quantity, notes, createdBy }) {
  const { data, error } = await supabase
    .from('stock_transfers')
    .insert({
      from_branch_id: fromBranchId,
      to_branch_id: toBranchId,
      item_id: itemId,
      item_name_en: itemNameEn,
      item_name_ar: itemNameAr,
      quantity,
      notes: notes || '',
      created_by: createdBy,
      status: 'pending',
    })
    .select('*, from_branch:branches!from_branch_id(id, name), to_branch:branches!to_branch_id(id, name)')
    .single();

  if (error) { console.error('❌ createTransfer:', error); return { data: null, error }; }
  return { data, error: null };
}

/** Approve a pending transfer via the atomic RPC. */
export async function approveTransfer(transferId, userId) {
  const { data, error } = await supabase.rpc('approve_stock_transfer', {
    p_transfer_id: transferId,
    p_user_id: userId,
  });

  if (error) { console.error('❌ approveTransfer RPC:', error); return { success: false, error: error.message }; }
  if (data && !data.success) return { success: false, error: data.error };
  return { success: true, error: null };
}

/** Reject a pending transfer via the atomic RPC. */
export async function rejectTransfer(transferId, userId) {
  const { data, error } = await supabase.rpc('reject_stock_transfer', {
    p_transfer_id: transferId,
    p_user_id: userId,
  });

  if (error) { console.error('❌ rejectTransfer RPC:', error); return { success: false, error: error.message }; }
  if (data && !data.success) return { success: false, error: data.error };
  return { success: true, error: null };
}
