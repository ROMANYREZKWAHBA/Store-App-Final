import { useState, useEffect, useCallback } from 'react';
import { fetchTransfers, createTransfer, approveTransfer, rejectTransfer } from './transferService';
import { fetchActiveBranches } from './branchService';

// ============================================================
// STOCK TRANSFERS — Two-Step Approval Workflow
// ============================================================

const STATUS = {
  pending:  { en: 'Pending',  ar: 'قيد الانتظار', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { en: 'Approved', ar: 'تم القبول',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { en: 'Rejected', ar: 'مرفوض',         color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

function NewTransferModal({ isOpen, onClose, onSubmit, items, currentBranchId, isRtl }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toBranchId, setToBranchId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchActiveBranches().then(({ data }) => setBranches(data.filter(b => b.id !== currentBranchId)));
      setToBranchId(''); setItemId(''); setQuantity(''); setNotes(''); setError('');
    }
  }, [isOpen, currentBranchId]);

  const selectedItem = items.find(i => i.id === itemId);

  const handleSubmit = async () => {
    if (!toBranchId) { setError(isRtl ? 'اختر الفرع المستلم' : 'Select destination branch'); return; }
    if (!itemId) { setError(isRtl ? 'اختر الصنف' : 'Select an item'); return; }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) { setError(isRtl ? 'أدخل كمية صحيحة' : 'Enter a valid quantity'); return; }
    if (selectedItem && qty > (selectedItem.stock || 0)) { setError(isRtl ? `الكمية المتاحة: ${selectedItem.stock}` : `Available stock: ${selectedItem.stock}`); return; }

    setLoading(true); setError('');
    const result = await onSubmit({ toBranchId, itemId, itemNameEn: selectedItem?.name?.en || '', itemNameAr: selectedItem?.name?.ar || '', quantity: qty, notes });
    setLoading(false);
    if (result?.error) { setError(result.error.message || (isRtl ? 'حدث خطأ' : 'Error occurred')); }
    else { onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => !loading && onClose()}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 border border-[#333] bg-[#0c0c0e] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-8 py-6 border-b border-[#222] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{isRtl ? '📦 طلب تحويل مخزون' : '📦 New Stock Transfer'}</h3>
            <p className="text-[10px] text-slate-500 dark:text-[#666] font-bold uppercase tracking-widest mt-1">{isRtl ? 'سيتم إرسال الطلب للفرع المستلم للموافقة' : 'Requires receiver branch approval'}</p>
          </div>
          <button onClick={() => !loading && onClose()} className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-[#666] hover:text-slate-900 dark:text-white hover:bg-[#1a1a1a] transition-colors text-xl">✕</button>
        </div>

        <div className="p-8 space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 px-4 py-3 flex items-center gap-2">
              <span className="text-rose-400 text-sm">❌</span>
              <p className="text-rose-400 text-xs font-bold">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-[9px] font-black text-[#D4AF37] uppercase tracking-[3px] mb-2">{isRtl ? 'الفرع المستلم *' : 'Destination Branch *'}</label>
            <select value={toBranchId} onChange={e => setToBranchId(e.target.value)}
              className="w-full bg-[#111] border border-[#333] px-5 py-4 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-[#D4AF37] transition-colors"
              style={{ borderColor: toBranchId ? '#D4AF37' : '#333' }}>
              <option value="">{isRtl ? '— اختر الفرع —' : '— Select Branch —'}</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-black text-[#888] uppercase tracking-[3px] mb-2">{isRtl ? 'الصنف *' : 'Item *'}</label>
            <select value={itemId} onChange={e => setItemId(e.target.value)}
              className="w-full bg-[#111] border border-[#333] px-5 py-4 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-[#D4AF37] transition-colors">
              <option value="">{isRtl ? '— اختر الصنف —' : '— Select Item —'}</option>
              {items.filter(i => (i.stock || 0) > 0).map(i => (
                <option key={i.id} value={i.id}>{i.name?.[isRtl ? 'ar' : 'en'] || i.name?.en} ({isRtl ? 'متوفر' : 'Stock'}: {i.stock})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-black text-[#888] uppercase tracking-[3px] mb-2">{isRtl ? 'الكمية *' : 'Quantity *'}</label>
            <input type="number" min="1" max={selectedItem?.stock || 9999} value={quantity} onChange={e => setQuantity(e.target.value)}
              placeholder="0" className="w-full bg-[#111] border border-[#333] px-5 py-4 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-[#D4AF37] transition-colors placeholder:text-[#444]" />
          </div>

          <div>
            <label className="block text-[9px] font-black text-[#888] uppercase tracking-[3px] mb-2">{isRtl ? 'ملاحظات' : 'Notes'}</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={isRtl ? 'اختياري...' : 'Optional...'} className="w-full bg-[#111] border border-[#333] px-5 py-4 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-[#D4AF37] transition-colors placeholder:text-[#444]" />
          </div>
        </div>

        <div className="px-8 py-6 border-t border-[#222] bg-[#080809] flex items-center justify-between gap-4">
          <button onClick={onClose} disabled={loading} className="px-6 py-3 text-slate-500 dark:text-[#666] font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:text-white transition-colors">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSubmit} disabled={loading || !toBranchId || !itemId || !quantity}
            className="px-8 py-3.5 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest hover:bg-[#e6c44a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-3">
            {loading ? (
              <><span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black animate-spin" style={{ borderRadius: '50%' }} />{isRtl ? 'جاري الإرسال...' : 'Sending...'}</>
            ) : (isRtl ? '📤 إرسال الطلب' : '📤 Send Request')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StockTransfersScreen({ currentUser, branchId, items, language, pushNotification }) {
  const isRtl = language === 'ar';
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'incoming' | 'outgoing'

  const loadTransfers = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    const { data } = await fetchTransfers(branchId);
    setTransfers(data);
    setLoading(false);
  }, [branchId]);

  useEffect(() => { loadTransfers(); }, [loadTransfers]);

  const handleCreate = async ({ toBranchId, itemId, itemNameEn, itemNameAr, quantity, notes }) => {
    const result = await createTransfer({
      fromBranchId: branchId, toBranchId, itemId, itemNameEn, itemNameAr, quantity, notes, createdBy: currentUser?.id,
    });
    if (!result.error) {
      setTransfers(prev => [result.data, ...prev]);
      pushNotification?.(isRtl ? 'تم إرسال طلب التحويل' : 'Transfer request sent', 'success');
    }
    return result;
  };

  const handleApprove = async (transferId) => {
    setActionLoading(transferId);
    const { success, error } = await approveTransfer(transferId, currentUser?.id);
    if (success) {
      setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'approved', approved_by: currentUser?.id } : t));
      pushNotification?.(isRtl ? '✅ تم تأكيد الاستلام وتحديث المخزون' : '✅ Transfer approved — inventory updated', 'success');
    } else {
      pushNotification?.(error || (isRtl ? 'فشل التأكيد' : 'Approval failed'), 'error');
    }
    setActionLoading(null);
  };

  const handleReject = async (transferId) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من رفض هذا التحويل؟' : 'Reject this transfer?')) return;
    setActionLoading(transferId);
    const { success, error } = await rejectTransfer(transferId, currentUser?.id);
    if (success) {
      setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'rejected', approved_by: currentUser?.id } : t));
      pushNotification?.(isRtl ? 'تم رفض التحويل' : 'Transfer rejected', 'info');
    } else {
      pushNotification?.(error || (isRtl ? 'فشل الرفض' : 'Rejection failed'), 'error');
    }
    setActionLoading(null);
  };

  const filtered = transfers.filter(t => {
    if (filter === 'incoming') return t.to_branch_id === branchId;
    if (filter === 'outgoing') return t.from_branch_id === branchId;
    return true;
  });

  const pendingIncoming = transfers.filter(t => t.to_branch_id === branchId && t.status === 'pending').length;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-full bg-slate-50 dark:bg-[#0a0a0c]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-[#D4AF37]" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">{isRtl ? 'تحويلات المخزون' : 'Stock Transfers'}</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#666] font-bold uppercase tracking-widest">{isRtl ? 'نظام التحويل ثنائي الخطوات — إرسال واعتماد' : 'Two-Step Verification — Send & Approve'}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-8 py-4 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest hover:bg-[#e6c44a] transition-all flex items-center gap-3 self-start md:self-auto group">
          <span className="text-lg group-hover:scale-110 transition-transform">📤</span>
          {isRtl ? 'طلب تحويل جديد' : 'New Transfer'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'إجمالي التحويلات' : 'Total', value: transfers.length, color: 'text-blue-400', icon: '📊' },
          { label: isRtl ? 'قيد الانتظار' : 'Pending', value: transfers.filter(t => t.status === 'pending').length, color: 'text-amber-400', icon: '⏳' },
          { label: isRtl ? 'واردة تنتظر موافقتك' : 'Awaiting Your Approval', value: pendingIncoming, color: 'text-emerald-400', icon: '📥' },
          { label: isRtl ? 'معتمدة' : 'Approved', value: transfers.filter(t => t.status === 'approved').length, color: 'text-[#D4AF37]', icon: '✅' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#161616] border border-zinc-200 dark:border-[#D4AF37]/20 p-5 flex items-center gap-4 hover:border-[#D4AF37]/40 transition-colors shadow-lg">
            <div className={`w-12 h-12 rounded-none flex items-center justify-center text-2xl bg-black/30 border border-white/5 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">{loading ? '—' : s.value}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3">
        {[
          ['all', isRtl ? 'الكل' : 'All', null],
          ['incoming', isRtl ? '📥 واردة' : '📥 Incoming', pendingIncoming],
          ['outgoing', isRtl ? '📤 صادرة' : '📤 Outgoing', null],
        ].map(([key, label, badge]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-6 py-3 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${filter === key ? 'bg-zinc-200 dark:bg-[#1a1a1a] text-slate-900 dark:text-white border border-[#D4AF37]' : 'bg-white dark:bg-[#0c0c0e] text-slate-500 dark:text-[#666] border border-zinc-300 dark:border-[#222] hover:border-zinc-400 dark:hover:border-[#444]'}`}>
            {label}
            {badge > 0 && <span className="bg-emerald-500 text-slate-900 dark:text-white text-[8px] font-black px-2 py-0.5" style={{ borderRadius: '50px' }}>{badge}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0c0c0e] border border-[#222] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between bg-[#111]">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[3px]">{isRtl ? 'سجل التحويلات' : 'Transfer Log'}</p>
          <button onClick={loadTransfers} disabled={loading} className="text-[10px] font-black text-slate-500 dark:text-[#666] uppercase tracking-widest hover:text-[#D4AF37] transition-colors flex items-center gap-2">
            <span className={loading ? 'animate-spin' : ''}>🔄</span> {isRtl ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-4">
            <div className="w-6 h-6 border-2 border-[#333] border-t-[#D4AF37] animate-spin" style={{ borderRadius: '50%' }} />
            <p className="text-slate-500 dark:text-[#666] text-xs font-black uppercase tracking-widest">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-5xl opacity-20">📦</span>
            <p className="text-slate-500 dark:text-[#666] text-sm font-black uppercase tracking-widest">{isRtl ? 'لا توجد تحويلات' : 'No transfers found'}</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="divide-y divide-[#1a1a1a]">
            {filtered.map((t) => {
              const isIncoming = t.to_branch_id === branchId;
              const isPending = t.status === 'pending';
              const st = STATUS[t.status] || STATUS.pending;
              const itemName = isRtl ? (t.item_name_ar || t.item_name_en) : t.item_name_en;

              return (
                <div key={t.id} className="px-6 py-5 hover:bg-[#111] transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Transfer info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-11 h-11 flex items-center justify-center shrink-0 text-lg ${isIncoming ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {isIncoming ? '📥' : '📤'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate">{itemName || t.item_id}</p>
                          <span className="text-[9px] font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5">×{t.quantity}</span>
                          <span className={`text-[8px] font-black px-2 py-0.5 border ${st.color}`}>
                            {isRtl ? st.ar : st.en}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#555] font-bold flex-wrap">
                          <span>{isRtl ? 'من:' : 'From:'} <span className="text-[#888]">{t.from_branch?.name || '—'}</span></span>
                          <span className="text-[#333]">→</span>
                          <span>{isRtl ? 'إلى:' : 'To:'} <span className="text-[#888]">{t.to_branch?.name || '—'}</span></span>
                        </div>
                        {t.notes && <p className="text-[10px] text-[#555] mt-1 italic">{t.notes}</p>}
                        <p className="text-[9px] text-[#444] mt-1">{new Date(t.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isIncoming && isPending && (
                        <>
                          <button
                            onClick={() => handleApprove(t.id)}
                            disabled={actionLoading === t.id}
                            className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                          >
                            {actionLoading === t.id ? (
                              <span className="inline-block w-3 h-3 border-2 border-emerald-300/30 border-t-emerald-300 animate-spin" style={{ borderRadius: '50%' }} />
                            ) : '✓'}
                            {isRtl ? 'تأكيد الاستلام' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
                            disabled={actionLoading === t.id}
                            className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            {isRtl ? 'رفض' : 'Reject'}
                          </button>
                        </>
                      )}
                      {!isIncoming && isPending && (
                        <span className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 text-amber-400 font-black text-[8px] uppercase tracking-widest">
                          {isRtl ? '⏳ بانتظار الموافقة' : '⏳ Awaiting Approval'}
                        </span>
                      )}
                      {t.status === 'approved' && (
                        <span className="px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 font-black text-[8px] uppercase tracking-widest">
                          {isRtl ? '✅ تم الاعتماد' : '✅ Completed'}
                        </span>
                      )}
                      {t.status === 'rejected' && (
                        <span className="px-3 py-2 bg-rose-500/5 border border-rose-500/20 text-rose-400 font-black text-[8px] uppercase tracking-widest">
                          {isRtl ? '❌ مرفوض' : '❌ Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NewTransferModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleCreate}
        items={items} currentBranchId={branchId} isRtl={isRtl} />
    </div>
  );
}
