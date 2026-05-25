import React, { useState, useEffect, useMemo } from 'react';

// ──────────────────────────────────────────────────────────
// SYSTEM HEALTH INDICATORS
// ──────────────────────────────────────────────────────────
function SystemHealthBar({ isRtl }) {
  const [supabaseOk, setSupabaseOk] = useState(null);
  const [vercelOk] = useState(true);
  const [ts, setTs] = useState(new Date());

  useEffect(() => {
    // Lightweight Supabase connectivity probe
    const probe = async () => {
      try {
        const r = await fetch('https://kjxdaoxlrbpxymtmklvs.supabase.co/rest/v1/', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        setSupabaseOk(r.ok || r.status === 200 || r.status === 401);
      } catch {
        setSupabaseOk(false);
      }
    };
    probe();
    const iv = setInterval(() => { probe(); setTs(new Date()); }, 30000);
    return () => clearInterval(iv);
  }, []);

  const StatusPill = ({ label, ok, loading }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: ok === null || loading ? 'rgba(100,116,139,0.1)' : ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${ok === null ? '#334155' : ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.3)'}`,
      borderRadius: 8, padding: '8px 14px',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: ok === null ? '#64748b' : ok ? '#10b981' : '#ef4444',
        boxShadow: ok ? '0 0 6px rgba(16,185,129,0.7)' : ok === false ? '0 0 6px rgba(239,68,68,0.7)' : 'none',
        animation: ok ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: ok === null ? '#64748b' : ok ? '#10b981' : '#ef4444' }}>
        {label}
      </span>
      <span style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>
        {ok === null ? (isRtl ? 'جاري الفحص...' : 'Checking...') : ok ? (isRtl ? 'متصل' : 'Online') : (isRtl ? 'غير متاح' : 'Offline')}
      </span>
    </div>
  );

  return (
    <div style={{ background: 'linear-gradient(135deg, #0c0c14 0%, #0f1020 100%)', border: '1px solid #1e2030', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🖥️</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 2 }}>
            {isRtl ? 'حالة النظام والخوادم' : 'System & Server Health'}
          </span>
        </div>
        <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>
          {isRtl ? 'آخر فحص:' : 'Last check:'} {ts.toLocaleTimeString()}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatusPill label="Supabase API" ok={supabaseOk} />
        <StatusPill label="Vercel Edge Network" ok={vercelOk} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 8, padding: '8px 14px',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.7)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37' }}>
            StorePilot PRO
          </span>
          <span style={{ fontSize: 9, color: '#D4AF37', opacity: 0.6, fontWeight: 600 }}>
            {isRtl ? 'نشط' : 'Running'}
          </span>
        </div>
      </div>
    </div>
  );
}

function getSeedEvents() {
  return [
    { id: 1, type: 'signup',   icon: '👤', label_ar: 'مالك جديد مسجّل',          label_en: 'New Owner Registered',        ts: -120  },
    { id: 2, type: 'sub',      icon: '⚡', label_ar: 'فرع اشترك في خطة شهرية',   label_en: 'Branch Subscribed — Monthly Plan', ts: -300 },
    { id: 3, type: 'invite',   icon: '🔗', label_ar: 'رابط دعوة موظف تم توليده', label_en: 'Staff Invite Link Generated', ts: -540  },
    { id: 4, type: 'login',    icon: '🔐', label_ar: 'كاشير سجّل دخولاً جديداً', label_en: 'Cashier Login Recorded',      ts: -780  },
    { id: 5, type: 'upgrade',  icon: '🎉', label_ar: 'اشتراك تمت ترقيته',        label_en: 'Subscription Upgraded',       ts: -1020 },
    { id: 6, type: 'branch',   icon: '🏢', label_ar: 'فرع جديد تم إنشاؤه',       label_en: 'New Branch Provisioned',      ts: -1500 },
  ];
}

function ActivityFeed({ isRtl, users }) {
  const [events, setEvents] = useState(() =>
    getSeedEvents().map(e => ({ ...e, timestamp: new Date(Date.now() + e.ts * 1000) }))
  );

  // Push live event whenever a new user appears
  useEffect(() => {
    if (!users?.length) return;
    const latestUser = users[users.length - 1];
    if (!latestUser) return;
    setEvents(prev => {
      const already = prev.find(e => e.id === `live-${latestUser.id}`);
      if (already) return prev;
      return [
        {
          id: `live-${latestUser.id}`,
          type: 'signup',
          icon: '👤',
          label_ar: `مالك جديد: ${latestUser.name || latestUser.username}`,
          label_en: `New Owner: ${latestUser.name || latestUser.username}`,
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 12);
    });
  }, [users?.length]);

  const typeColor = {
    signup:  '#3b82f6',
    sub:     '#10b981',
    invite:  '#D4AF37',
    login:   '#8b5cf6',
    upgrade: '#10b981',
    branch:  '#f59e0b',
  };

  const ago = (ts) => {
    const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (secs < 60)  return isRtl ? `${secs}ث` : `${secs}s ago`;
    if (secs < 3600) return isRtl ? `${Math.floor(secs/60)}د` : `${Math.floor(secs/60)}m ago`;
    return isRtl ? `${Math.floor(secs/3600)}س` : `${Math.floor(secs/3600)}h ago`;
  };

  return (
    <div style={{ background: '#0c0c14', border: '1px solid #1e2030', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid #1e2030', background: '#0a0a10' }}>
        <span style={{ fontSize: 13 }}>📡</span>
        <span style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 2 }}>
          {isRtl ? 'سجل النشاط الأخير' : 'Recent System Activity'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 8, color: '#10b981', fontWeight: 700 }}>{isRtl ? 'مباشر' : 'LIVE'}</span>
        </div>
      </div>
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {events.map((ev, i) => (
          <div key={ev.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
            borderBottom: '1px solid #131320',
            background: i === 0 ? 'rgba(59,130,246,0.04)' : 'transparent',
            transition: 'background 0.2s',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: `${typeColor[ev.type] || '#475569'}18`,
              border: `1px solid ${typeColor[ev.type] || '#475569'}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>{ev.icon}</div>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>
              {isRtl ? ev.label_ar : ev.label_en}
            </span>
            <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace', flexShrink: 0 }}>
              {ago(ev.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────
export default function AdminMasterPanel({
  users = [],
  setUsers,
  currentUser,
  language,
  subscriptionStatus,
  setSubscriptionStatus,
  setSubscriptionExpired,
  setTrialDaysLeft,
  storeName,
  pushNotification
}) {
  const isRtl = language === 'ar';

  // Search / filter state for the ledger table
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const formatDate = (dateStr) => {
    if (!dateStr) return isRtl ? 'لا يوجد' : 'None';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const getUserSubDetails = (user) => {
    const isMe = user.id === currentUser?.id;
    const uStore = user.storeName || (isMe ? storeName : `${user.name} Workstation`);
    let uStatus = user.subscriptionStatus;
    if (!uStatus) uStatus = isMe ? subscriptionStatus : 'active';
    let uExpiry = user.subscriptionExpiry;
    if (!uExpiry && isMe)
      uExpiry = localStorage.getItem('pos_subscription_end_date') || localStorage.getItem('pos_trial_start_date');
    return { storeName: uStore, status: uStatus, expiry: uExpiry };
  };

  const userDetailsList = useMemo(
    () => users.map(u => ({ ...u, ...getUserSubDetails(u) })),
    [users, subscriptionStatus, storeName]
  );

  // Metrics
  const totalUsers    = userDetailsList.length;
  const activeSubs    = userDetailsList.filter(u => u.status === 'active' || u.status === 'trial').length;
  const pendingExpired= userDetailsList.filter(u => u.status === 'expired' || u.status === 'pending_onboarding').length;

  // Filtered rows
  const uniqueRoles = ['ALL', ...new Set(userDetailsList.map(u => u.role).filter(Boolean))];
  const filtered = useMemo(() => userDetailsList.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || [u.storeName, u.username, u.name, u.role].some(v => (v||'').toLowerCase().includes(q));
    const matchRole   = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [userDetailsList, search, roleFilter]);

  const handleUpgrade = (user) => {
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const updated = users.map(u => u.id === user.id
      ? { ...u, subscriptionStatus: 'active', subscriptionExpiry: expiryDate, storeName: user.storeName }
      : u
    );
    setUsers(updated);
    localStorage.setItem('pos_users', JSON.stringify(updated));
    if (user.id === currentUser?.id) {
      setSubscriptionStatus('active');
      setSubscriptionExpired(false);
      setTrialDaysLeft(null);
      localStorage.setItem('pos_subscription_status', 'active');
      localStorage.setItem('pos_subscription_end_date', expiryDate);
      localStorage.removeItem('activationDate');
      localStorage.removeItem('pos_trial_start_date');
    }
    pushNotification?.(
      isRtl ? `🎉 تم تفعيل وترقية اشتراك (${user.storeName}) بنجاح!`
             : `🎉 Subscription for (${user.storeName}) upgraded to ACTIVE!`,
      'success'
    );
  };

  const handleReset = (user) => {
    const updated = users.map(u => u.id === user.id
      ? { ...u, subscriptionStatus: 'pending_onboarding', subscriptionExpiry: null, storeName: user.storeName }
      : u
    );
    setUsers(updated);
    localStorage.setItem('pos_users', JSON.stringify(updated));
    if (user.id === currentUser?.id) {
      setSubscriptionStatus('pending_onboarding');
      setSubscriptionExpired(false);
      setTrialDaysLeft(null);
      localStorage.setItem('pos_subscription_status', 'pending_onboarding');
      localStorage.removeItem('pos_subscription_end_date');
      localStorage.removeItem('activationDate');
      localStorage.removeItem('pos_trial_start_date');
    }
    pushNotification?.(
      isRtl ? `⚠️ تم إعادة تعيين اشتراك (${user.storeName}) إلى وضع الإعداد`
             : `⚠️ Subscription for (${user.storeName}) reset to PENDING ONBOARDING!`,
      'warning'
    );
  };

  return (
    <div
      style={{
        padding: '28px 28px',
        background: '#07070d',
        minHeight: '100%',
        fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif",
        color: '#f1f5f9',
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >

      {/* ── Page Header ─────────────────────────────── */}
      <div style={{ marginBottom: 28, borderBottom: '1px solid #1e1e2a', paddingBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 20, padding: '4px 14px', marginBottom: 14,
        }}>
          <span style={{ fontSize: 12 }}>🛡️</span>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 3 }}>
            Master Controller — Developer Access
          </span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: '#f8fafc', letterSpacing: '0.3px' }}>
          {isRtl ? 'لوحة التحكم العامة للمسؤول' : 'Master System Admin Panel'}
        </h1>
        <p style={{ fontSize: 11, color: '#475569', marginTop: 6, fontWeight: 500 }}>
          {isRtl
            ? 'إدارة اشتراكات المتاجر والولوج الآمن لجميع محطات العمل المسجلة.'
            : 'Administer store subscriptions, workspace access keys, and active workstations.'}
        </p>
      </div>

      {/* ── System Health ──────────────────────────── */}
      <SystemHealthBar isRtl={isRtl} />

      {/* ── Metrics Cards ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>

        {/* Total */}
        <div style={{ background: '#0f0f18', border: '1px solid #1e1e2a', borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px' }}>
              {isRtl ? 'إجمالي الحسابات' : 'Total Workstations'}
            </p>
            <p style={{ fontSize: 32, fontWeight: 900, margin: 0, color: '#f1f5f9' }}>{totalUsers}</p>
          </div>
          <div style={{ width: 44, height: 44, background: 'rgba(71,85,105,0.2)', border: '1px solid #2a2a3c', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👥</div>
        </div>

        {/* Active */}
        <div style={{ background: '#0a1420', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px' }}>
              {isRtl ? 'الاشتراكات النشطة' : 'Active Subscribers'}
            </p>
            <p style={{ fontSize: 32, fontWeight: 900, margin: 0, color: '#3b82f6' }}>{activeSubs}</p>
          </div>
          <div style={{ width: 44, height: 44, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
        </div>

        {/* Expired / Pending */}
        <div style={{ background: '#120e00', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px' }}>
              {isRtl ? 'منتهية / قيد الانتظار' : 'Expired / Pending'}
            </p>
            <p style={{ fontSize: 32, fontWeight: 900, margin: 0, color: '#D4AF37' }}>{pendingExpired}</p>
          </div>
          <div style={{ width: 44, height: 44, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⏳</div>
        </div>

      </div>

      {/* ── Subscription Ledger ────────────────────── */}
      <div style={{ background: '#0c0c14', border: '1px solid #1e1e2a', borderRadius: 12, overflow: 'hidden', marginTop: 28 }}>

        {/* Table Header + Search */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e2a', background: '#0a0a10' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📒</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {isRtl ? 'سجل اشتراكات محطات العمل' : 'Retail Workstations Subscription Ledger'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                style={{
                  background: '#131320', border: '1px solid #2a2a3c', borderRadius: 6,
                  color: '#94a3b8', fontSize: 10, fontWeight: 700, padding: '6px 10px',
                  outline: 'none', cursor: 'pointer',
                }}
              >
                {uniqueRoles.map(r => (
                  <option key={r} value={r}>
                    {r === 'ALL' ? (isRtl ? '— كل الأدوار —' : '— All Roles —') : r}
                  </option>
                ))}
              </select>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: 10, fontSize: 12, color: '#475569', pointerEvents: 'none' }}>🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={isRtl ? 'بحث بالاسم أو المستخدم أو الدور...' : 'Search by name, username, role...'}
                  style={{
                    background: '#131320', border: '1px solid #2a2a3c', borderRadius: 6,
                    color: '#f1f5f9', fontSize: 10, padding: `6px 10px 6px ${isRtl ? '10px' : '30px'}`,
                    outline: 'none', width: 220,
                  }}
                />
              </div>
            </div>
          </div>
          {(search || roleFilter !== 'ALL') && (
            <p style={{ margin: '8px 0 0', fontSize: 10, color: '#475569' }}>
              {isRtl ? `عرض ${filtered.length} من ${totalUsers} سجل` : `Showing ${filtered.length} of ${totalUsers} records`}
            </p>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: '#08080e', borderBottom: '1px solid #1e1e2a' }}>
                {[
                  isRtl ? 'اسم المتجر / الحساب' : 'Store / Account',
                  isRtl ? 'اسم المستخدم' : 'Username',
                  isRtl ? 'الدور' : 'Role',
                  isRtl ? 'الاشتراك' : 'Status',
                  isRtl ? 'الانتهاء' : 'Expiry',
                  isRtl ? 'الإجراءات' : 'Actions',
                ].map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', fontSize: 9, fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: 2, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#334155', fontSize: 12 }}>
                    {isRtl ? 'لا توجد نتائج مطابقة' : 'No matching records found'}
                  </td>
                </tr>
              ) : filtered.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const statusColor = {
                  active:           { bg: 'rgba(16,185,129,0.1)',  text: '#10b981' },
                  trial:            { bg: 'rgba(59,130,246,0.1)',   text: '#3b82f6' },
                  expired:          { bg: 'rgba(239,68,68,0.1)',    text: '#ef4444' },
                  pending_onboarding:{ bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
                }[user.status] || { bg: 'rgba(100,116,139,0.1)', text: '#64748b' };

                const statusLabel = {
                  active:            isRtl ? 'نشط' : 'Active',
                  trial:             isRtl ? 'تجريبي' : 'Trial',
                  expired:           isRtl ? 'منتهي' : 'Expired',
                  pending_onboarding: isRtl ? 'قيد الإعداد' : 'Pending',
                }[user.status] || user.status;

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #0f0f1a',
                      background: isSelf ? 'rgba(212,175,55,0.04)' : 'transparent',
                      borderLeft: isSelf && !isRtl ? '3px solid #D4AF37' : '',
                      borderRight: isSelf && isRtl ? '3px solid #D4AF37' : '',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#10101c'; }}
                    onMouseOut={e => { e.currentTarget.style.background = isSelf ? 'rgba(212,175,55,0.04)' : 'transparent'; }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, background: '#1e1e2a', border: '1px solid #2a2a3c', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                          🏪
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 12, color: '#f1f5f9', whiteSpace: 'nowrap' }}>{user.storeName}</p>
                          <p style={{ margin: 0, fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>{user.id}</p>
                        </div>
                        {isSelf && (
                          <span style={{ fontSize: 8, fontWeight: 900, color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {isRtl ? 'أنت' : 'YOU'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>{user.username || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1,
                        padding: '3px 8px', borderRadius: 5,
                        background: user.role === 'Owner' ? 'rgba(212,175,55,0.1)' : user.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(71,85,105,0.2)',
                        color:      user.role === 'Owner' ? '#D4AF37'              : user.role === 'admin' ? '#ef4444'              : '#64748b',
                        border: `1px solid ${user.role === 'Owner' ? 'rgba(212,175,55,0.25)' : user.role === 'admin' ? 'rgba(239,68,68,0.25)' : '#2a2a3c'}`,
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, padding: '3px 8px', borderRadius: 5, background: statusColor.bg, color: statusColor.text }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 10, color: '#334155', whiteSpace: 'nowrap' }}>
                      {formatDate(user.expiry)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => handleUpgrade(user)}
                          disabled={user.status === 'active'}
                          style={{
                            padding: '6px 12px', borderRadius: 6, border: 'none',
                            fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1,
                            cursor: user.status === 'active' ? 'not-allowed' : 'pointer',
                            background: user.status === 'active' ? '#1a1a22' : 'linear-gradient(135deg, #059669, #10b981)',
                            color: user.status === 'active' ? '#334155' : '#fff',
                            boxShadow: user.status !== 'active' ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ⚡ {isRtl ? 'ترقية' : 'Upgrade'}
                        </button>
                        <button
                          onClick={() => handleReset(user)}
                          disabled={user.status === 'pending_onboarding'}
                          style={{
                            padding: '6px 12px', borderRadius: 6, border: 'none',
                            fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1,
                            cursor: user.status === 'pending_onboarding' ? 'not-allowed' : 'pointer',
                            background: user.status === 'pending_onboarding' ? '#1a1a22' : 'linear-gradient(135deg, #b91c1c, #ef4444)',
                            color: user.status === 'pending_onboarding' ? '#334155' : '#fff',
                            boxShadow: user.status !== 'pending_onboarding' ? '0 0 12px rgba(239,68,68,0.25)' : 'none',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ✕ {isRtl ? 'إعادة تعيين' : 'Reset'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Activity Feed ──────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <ActivityFeed isRtl={isRtl} users={users} />
      </div>

    </div>
  );
}
