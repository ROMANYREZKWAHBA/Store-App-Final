import { useState, useEffect, useCallback } from 'react';
import { fetchAllBranches, createBranch, toggleBranchStatus, deleteBranch } from './branchService';

// ============================================================
// BRANCH MANAGEMENT — Owner-Only Provisioning Dashboard
// ============================================================

function AddBranchModal({ isOpen, onClose, onSubmit, isRtl }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setName(''); setAddress(''); setPhone(''); setError(''); };

  const handleSubmit = async () => {
    if (!name.trim()) { setError(isRtl ? 'اسم الفرع مطلوب' : 'Branch name is required'); return; }
    setLoading(true);
    setError('');
    const result = await onSubmit({ name, address, phone });
    setLoading(false);
    if (result?.error) {
      setError(result.error.message || (isRtl ? 'حدث خطأ' : 'An error occurred'));
    } else {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => { if (!loading) { reset(); onClose(); } }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 border border-zinc-200 dark:border-[#D4AF37]/20 bg-white dark:bg-[#161616] shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-[#D4AF37]/20 flex items-center justify-between bg-slate-100 dark:bg-black/20">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              {isRtl ? '➕ فرع جديد' : '➕ New Branch'}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">
              {isRtl ? 'تزويد الفرع تلقائياً مع الخزينة' : 'Auto-provisions safe & treasury'}
            </p>
          </div>
          <button onClick={() => { if (!loading) { reset(); onClose(); } }}
            className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:text-zinc-100 hover:bg-white/5 transition-colors text-xl">✕</button>
        </div>

        {/* Form */}
        <div className="p-8 space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 px-4 py-3 flex items-center gap-2">
              <span className="text-rose-400 text-sm">❌</span>
              <p className="text-rose-400 text-xs font-bold">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-[9px] font-black text-[#D4AF37] uppercase tracking-[3px] mb-2">
              {isRtl ? 'اسم الفرع *' : 'Branch Name *'}
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder={isRtl ? 'مثال: فرع المعادي' : 'e.g. Downtown Branch'}
              className="w-full bg-slate-50 dark:bg-black/40 border border-zinc-200 dark:border-[#D4AF37]/20 px-5 py-4 text-slate-900 dark:text-zinc-100 text-sm font-bold outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all placeholder:text-zinc-600" />
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[3px] mb-2">
              {isRtl ? 'العنوان' : 'Address'}
            </label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder={isRtl ? 'مثال: شارع 9، المعادي' : 'e.g. 123 Main St, Cairo'}
              className="w-full bg-slate-50 dark:bg-black/40 border border-zinc-200 dark:border-[#D4AF37]/20 px-5 py-4 text-slate-900 dark:text-zinc-100 text-sm font-bold outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all placeholder:text-zinc-600" />
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[3px] mb-2">
              {isRtl ? 'رقم الهاتف' : 'Phone Number'}
            </label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder={isRtl ? 'مثال: 01012345678' : 'e.g. +20-100-123-4567'}
              className="w-full bg-slate-50 dark:bg-black/40 border border-zinc-200 dark:border-[#D4AF37]/20 px-5 py-4 text-slate-900 dark:text-zinc-100 text-sm font-bold outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all placeholder:text-zinc-600" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-zinc-200 dark:border-[#D4AF37]/20 bg-slate-100 dark:bg-black/20 flex items-center justify-between gap-4">
          <button onClick={() => { reset(); onClose(); }} disabled={loading}
            className="px-6 py-3 text-slate-500 dark:text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:text-zinc-100 transition-colors">
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={handleSubmit} disabled={loading || !name.trim()}
            className="px-8 py-3.5 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest hover:bg-[#e6c44a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-3">
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black animate-spin" style={{ borderRadius: '50%' }} />
                {isRtl ? 'جاري الإنشاء...' : 'Creating...'}
              </>
            ) : (
              <>{isRtl ? 'إنشاء الفرع' : 'Provision Branch'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BranchManagement({ language }) {
  const isRtl = language === 'ar';
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchAllBranches();
    setBranches(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadBranches(); }, [loadBranches]);

  const handleCreate = async (branchData) => {
    const result = await createBranch(branchData);
    if (!result.error) {
      setBranches(prev => [result.data, ...prev]);
    }
    return result;
  };

  const handleToggle = async (branchId, currentStatus) => {
    setActionLoading(branchId);
    const { data, error } = await toggleBranchStatus(branchId, !currentStatus);
    if (!error && data) {
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, is_active: data.is_active } : b));
    }
    setActionLoading(null);
  };

  const handleDelete = async (branchId, branchName) => {
    const msg = isRtl
      ? `⚠️ هل أنت متأكد من حذف فرع "${branchName}" نهائياً؟\nسيتم حذف جميع بيانات الفرع والخزينة.`
      : `⚠️ Permanently delete branch "${branchName}"?\nAll branch data and treasury will be removed.`;
    if (!window.confirm(msg)) return;
    setActionLoading(branchId);
    const { error } = await deleteBranch(branchId);
    if (!error) {
      setBranches(prev => prev.filter(b => b.id !== branchId));
    }
    setActionLoading(null);
  };

  const activeCount = branches.filter(b => b.is_active).length;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-full bg-slate-50 dark:bg-[#0a0a0c]" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-[#D4AF37]" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {isRtl ? 'إدارة الفروع' : 'Branch Provisioning'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#666] font-bold uppercase tracking-widest">
            {isRtl ? 'لوحة تحكم المالك — تزويد وإدارة الفروع' : 'Owner Dashboard — Provision & Manage Branches'}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-8 py-4 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest hover:bg-[#e6c44a] transition-all flex items-center gap-3 self-start md:self-auto group">
          <span className="text-lg group-hover:scale-110 transition-transform">＋</span>
          {isRtl ? 'إضافة فرع جديد' : 'Add New Branch'}
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'إجمالي الفروع' : 'Total Branches', value: branches.length, color: 'text-blue-400', icon: '🏢' },
          { label: isRtl ? 'فروع نشطة' : 'Active', value: activeCount, color: 'text-emerald-400', icon: '✅' },
          { label: isRtl ? 'فروع معطلة' : 'Inactive', value: branches.length - activeCount, color: 'text-rose-400', icon: '⏸️' },
          { label: isRtl ? 'الخزائن المُزوّدة' : 'Safes Provisioned', value: branches.length, color: 'text-[#D4AF37]', icon: '🏦' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#161616] border border-zinc-200 dark:border-[#D4AF37]/20 p-5 flex items-center gap-4 hover:border-[#D4AF37]/40 transition-colors shadow-lg">
            <div className={`w-12 h-12 rounded-none flex items-center justify-center text-2xl bg-black/30 border border-white/5 ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">{loading ? '—' : stat.value}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Branches Table */}
      <div className="bg-white dark:bg-[#161616] border border-zinc-200 dark:border-[#D4AF37]/20 shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#D4AF37]/20 flex items-center justify-between bg-slate-100 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <span className="text-sm drop-shadow-md">🏢</span>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[3px]">
              {isRtl ? 'سجل الفروع' : 'Branch Registry'}
            </p>
          </div>
          <button onClick={loadBranches} disabled={loading}
            className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest hover:text-[#D4AF37] transition-colors flex items-center gap-2">
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            {isRtl ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-4">
            <div className="w-6 h-6 border-2 border-[#333] border-t-[#D4AF37] animate-spin" style={{ borderRadius: '50%' }} />
            <p className="text-slate-500 dark:text-zinc-400 text-xs font-black uppercase tracking-widest">
              {isRtl ? 'جاري تحميل الفروع...' : 'Loading branches...'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && branches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-5xl opacity-20 drop-shadow-md">🏗️</span>
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-black uppercase tracking-widest">
              {isRtl ? 'لا توجد فروع بعد' : 'No branches provisioned yet'}
            </p>
            <button onClick={() => setShowModal(true)}
              className="mt-2 px-6 py-3 border border-[#D4AF37] text-[#D4AF37] font-black text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all">
              {isRtl ? 'ابدأ بإضافة أول فرع' : 'Provision Your First Branch'}
            </button>
          </div>
        )}

        {/* Data Rows */}
        {!loading && branches.length > 0 && (
          <div className="divide-y divide-white/5">
            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-black/40 border-b border-[#D4AF37]/10">
              <div className="col-span-1 text-[8px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-widest">#</div>
              <div className="col-span-3 text-[8px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-widest">{isRtl ? 'الفرع' : 'Branch'}</div>
              <div className="col-span-3 text-[8px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-widest">{isRtl ? 'العنوان' : 'Address'}</div>
              <div className="col-span-2 text-[8px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-widest">{isRtl ? 'الهاتف' : 'Phone'}</div>
              <div className="col-span-1 text-[8px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-widest">{isRtl ? 'الحالة' : 'Status'}</div>
              <div className="col-span-2 text-[8px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-widest text-end">{isRtl ? 'إجراءات' : 'Actions'}</div>
            </div>

            {branches.map((branch, idx) => (
              <div key={branch.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-100 dark:bg-black/20 transition-colors group ${!branch.is_active ? 'opacity-40' : ''}`}>
                {/* Index */}
                <div className="col-span-1">
                  <span className="text-xs font-black text-zinc-600">{String(idx + 1).padStart(2, '0')}</span>
                </div>

                {/* Name */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center shrink-0 border border-white/5"
                    style={{ background: branch.is_active ? '#D4AF37' : '#222', color: branch.is_active ? '#000' : '#888', fontWeight: 900, fontSize: 14 }}>
                    {branch.name?.[0]?.toUpperCase() || 'B'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-zinc-100 truncate">{branch.name}</p>
                    <p className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold truncate">ID: {branch.id?.slice(0, 8)}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="col-span-3">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold truncate">{branch.address || '—'}</p>
                </div>

                {/* Phone */}
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">{branch.phone || '—'}</p>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[8px] font-black uppercase tracking-widest ${branch.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <span className={`w-1.5 h-1.5 ${branch.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} style={{ borderRadius: '50%' }} />
                    {branch.is_active ? (isRtl ? 'نشط' : 'Live') : (isRtl ? 'معطل' : 'Off')}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleToggle(branch.id, branch.is_active)}
                    disabled={actionLoading === branch.id}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${branch.is_active ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}
                    title={branch.is_active ? 'Deactivate' : 'Activate'}>
                    {actionLoading === branch.id ? '...' : (branch.is_active ? (isRtl ? 'تعطيل' : 'Disable') : (isRtl ? 'تفعيل' : 'Enable'))}
                  </button>
                  <button onClick={() => handleDelete(branch.id, branch.name)}
                    disabled={actionLoading === branch.id}
                    className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Delete">
                    {isRtl ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      <AddBranchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        isRtl={isRtl}
      />
    </div>
  );
}
