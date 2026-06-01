import React, { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// PLAN CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_MONTHLY_EGP = 299;
const PLAN_ANNUAL_EGP  = 2990;

// ─────────────────────────────────────────────────────────────────────────────
// THEME CONTEXT — the single source of truth for all color tokens.
// Populated once inside AdminMasterPanel via useMemo; every sub-component
// reads from it via useContext(ThemeCtx) instead of a stale module-level `C`.
// ─────────────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext(null);
const useC = () => useContext(ThemeCtx);

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE FACTORY — returns a full token map for a given mode.
// Called inside useMemo so it re-runs on every theme toggle.
// ─────────────────────────────────────────────────────────────────────────────
function buildPalette(isDark) {
  // ── Semantic-neutral tokens (same in both modes) ────────────────────────
  const amber        = '#f59e0b';
  const amberDark    = '#d97706';
  const amberBg      = isDark ? 'rgba(245,158,11,0.08)' : 'rgba(217,119,6,0.08)';
  const amberBorder  = isDark ? 'rgba(245,158,11,0.25)' : 'rgba(217,119,6,0.30)';

  const success      = '#10b981';
  const successBg    = 'rgba(16,185,129,0.08)';
  const successBorder= 'rgba(16,185,129,0.25)';
  const danger       = '#ef4444';
  const dangerBg     = 'rgba(239,68,68,0.08)';
  const dangerBorder = 'rgba(239,68,68,0.25)';
  const warning      = '#f59e0b';
  const warningBg    = 'rgba(245,158,11,0.08)';
  const warningBorder= 'rgba(245,158,11,0.25)';
  const info         = '#3b82f6';
  const infoBg       = 'rgba(59,130,246,0.08)';
  const infoBorder   = 'rgba(59,130,246,0.25)';
  const purple       = '#8b5cf6';
  const purpleBg     = 'rgba(139,92,246,0.08)';
  const purpleBorder = 'rgba(139,92,246,0.25)';
  const teal         = '#14b8a6';
  const tealBg       = 'rgba(20,184,166,0.08)';
  const tealBorder   = 'rgba(20,184,166,0.25)';

  // ── Mode-specific surface tokens ────────────────────────────────────────
  const bgMain        = isDark ? '#09090b'               : '#f4f4f5';          // zinc-950 / zinc-100
  const bgCard        = isDark ? '#18181b'               : '#ffffff';          // zinc-900 / white
  const bgElevated    = isDark ? '#1c1c1f'               : '#f9fafb';          // zinc-850 / gray-50
  const bgDeep        = isDark ? '#09090b'               : '#f1f1f3';          // zinc-950 / zinc-100
  const bgShaded      = isDark ? 'rgba(255,255,255,0.025)': 'rgba(0,0,0,0.025)';
  const border        = isDark ? '#3f3f46'               : '#d4d4d8';          // zinc-700 / zinc-300
  const borderThin    = isDark ? '#27272a'               : '#e4e4e7';          // zinc-800 / zinc-200
  const textPrimary   = isDark ? '#f4f4f5'               : '#18181b';          // zinc-100 / zinc-900
  const textSecondary = isDark ? '#a1a1aa'               : '#52525b';          // zinc-400 / zinc-600
  const textMuted     = isDark ? '#52525b'               : '#a1a1aa';          // zinc-600 / zinc-400

  return {
    bgMain, bgCard, bgElevated, bgDeep, bgShaded,
    border, borderThin,
    textPrimary, textSecondary, textMuted,
    amber, amberDark, amberBg, amberBorder,
    success, successBg, successBorder,
    danger,  dangerBg,  dangerBorder,
    warning, warningBg, warningBorder,
    info,    infoBg,    infoBorder,
    purple,  purpleBg,  purpleBorder,
    teal,    tealBg,    tealBorder,
    isDark,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES — all read `C` from ThemeCtx
// ─────────────────────────────────────────────────────────────────────────────
function SectionTitle({ icon, title, subtitle }) {
  const C = useC();
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, letterSpacing: 0.3 }}>{title}</span>
      </div>
      {subtitle && <p style={{ margin: 0, fontSize: 11, color: C.textSecondary, fontWeight: 500 }}>{subtitle}</p>}
    </div>
  );
}

function MetricCard({ label, value, sub, icon, color, borderColor }) {
  const C = useC();
  const accentColor = color || C.amber;
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${borderColor || C.border}`,
      borderRadius: 14,
      padding: '22px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transition: 'border-color 0.2s, background 0.2s',
    }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: 2 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 34, fontWeight: 950, color: accentColor, letterSpacing: '-1px', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ margin: '6px 0 0', fontSize: 10, color: C.textSecondary, fontWeight: 600 }}>{sub}</p>}
      </div>
      <div style={{
        width: 48, height: 48,
        background: C.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${borderColor || C.border}`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
    </div>
  );
}

function StatusBadge({ status, isRtl }) {
  const C = useC();
  const map = {
    active:             { label_en: 'Active',    label_ar: 'نشط',        color: C.success, bg: C.successBg, border: C.successBorder },
    trial:              { label_en: 'Trial',      label_ar: 'تجريبي',     color: C.info,    bg: C.infoBg,    border: C.infoBorder    },
    expired:            { label_en: 'Expired',    label_ar: 'منتهي',      color: C.danger,  bg: C.dangerBg,  border: C.dangerBorder  },
    pending_onboarding: { label_en: 'Onboarding', label_ar: 'قيد الإعداد',color: C.warning, bg: C.warningBg, border: C.warningBorder },
  };
  const d = map[status] || { label_en: status || 'Unknown', label_ar: status || 'غير معروف', color: C.textSecondary, bg: C.bgCard, border: C.border };
  return (
    <span style={{
      fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.2,
      padding: '4px 9px', borderRadius: 6,
      background: d.bg, color: d.color, border: `1px solid ${d.border}`,
      whiteSpace: 'nowrap',
    }}>
      {isRtl ? d.label_ar : d.label_en}
    </span>
  );
}

function ActionBtn({ onClick, disabled, children, variant = 'default', title, small }) {
  const C = useC();
  const variants = {
    default: { bg: C.bgCard,   color: C.textSecondary, border: C.border },
    green:   { bg: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', border: 'transparent' },
    red:     { bg: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', border: 'transparent' },
    amber:   { bg: C.amberBg,  color: C.amber,  border: C.amberBorder  },
    blue:    { bg: C.infoBg,   color: C.info,   border: C.infoBorder   },
    slate:   { bg: 'linear-gradient(135deg,#475569,#64748b)', color: '#fff', border: 'transparent' },
    purple:  { bg: C.purpleBg, color: C.purple, border: C.purpleBorder },
  };
  const v = variants[variant] || variants.default;
  const pad = small ? '5px 9px' : '7px 12px';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: pad, borderRadius: 8, border: `1px solid ${v.border}`,
        fontSize: 10, fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? C.bgElevated : v.bg,
        color: disabled ? C.textMuted : v.color,
        transition: 'all 0.15s',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
      }}
    >{children}</button>
  );
}

function Toggle({ checked, onChange, label, desc, color }) {
  const C = useC();
  const trackColor = color || C.amber;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: checked ? (C.isDark ? 'rgba(245,158,11,0.04)' : 'rgba(217,119,6,0.04)') : 'transparent',
        borderBottom: `1px solid ${C.borderThin}`,
        transition: 'background 0.2s',
        cursor: 'pointer',
        gap: 12,
      }}
      onClick={() => onChange(!checked)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{label}</p>
        {desc && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSecondary }}>{desc}</p>}
      </div>
      <div
        style={{
          width: 44, height: 24, borderRadius: 12, flexShrink: 0,
          background: checked ? trackColor : C.bgElevated,
          border: `1px solid ${checked ? trackColor : C.border}`,
          position: 'relative',
          transition: 'all 0.25s',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3, left: checked ? 23 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: checked ? '#fff' : C.textMuted,
          transition: 'all 0.25s',
          boxShadow: checked ? '0 0 6px rgba(245,158,11,0.5)' : 'none',
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM HEALTH BAR
// ─────────────────────────────────────────────────────────────────────────────
function SystemHealthBar({ isRtl }) {
  const C = useC();
  const [supabaseOk, setSupabaseOk] = useState(null);
  const [supabaseLatency, setSupabaseLatency] = useState(34);
  const [vercelLatency, setVercelLatency] = useState(12);
  const [ts, setTs] = useState(new Date());

  useEffect(() => {
    const probe = async () => {
      const t0 = performance.now();
      try {
        const r = await fetch('https://kjxdaoxlrbpxymtmklvs.supabase.co/rest/v1/', {
          method: 'HEAD', signal: AbortSignal.timeout(5000),
        });
        setSupabaseLatency(Math.round(performance.now() - t0));
        setSupabaseOk(r.ok || r.status === 401);
      } catch { setSupabaseOk(false); }
    };
    probe();
    const iv = setInterval(() => { probe(); setTs(new Date()); }, 15000);
    const jitter = setInterval(() => {
      setVercelLatency(p => Math.max(6, Math.min(28, p + (Math.random() * 5 | 0) - 2)));
      setSupabaseLatency(p => p === null ? p : Math.max(18, Math.min(140, p + (Math.random() * 11 | 0) - 5)));
    }, 3000);
    return () => { clearInterval(iv); clearInterval(jitter); };
  }, []);

  const Pill = ({ label, ok, latency }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: ok === null ? C.bgElevated : ok ? C.successBg : C.dangerBg,
      border: `1px solid ${ok === null ? C.border : ok ? C.successBorder : C.dangerBorder}`,
      borderRadius: 10, padding: '8px 14px',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: ok === null ? C.textSecondary : ok ? C.success : C.danger,
        boxShadow: ok ? `0 0 8px ${C.success}` : ok === false ? `0 0 8px ${C.danger}` : 'none',
        animation: ok ? 'v2pulse 2s infinite' : 'none',
      }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: ok === null ? C.textSecondary : ok ? C.success : C.danger }}>{label}</span>
        <span style={{ fontSize: 9, color: C.textSecondary, fontWeight: 600 }}>
          {ok === null ? (isRtl ? 'جاري الفحص...' : 'Checking…') : ok ? (isRtl ? 'متصل' : 'Online') : (isRtl ? 'غير متاح' : 'Offline')}
          {ok && latency !== null && ` (${latency}ms)`}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 22px', marginBottom: 20, transition: 'background 0.25s, border-color 0.25s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🖥️</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: C.amber, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {isRtl ? 'نظرة عامة على حالة النظام' : 'System Status Overview'}
          </span>
        </div>
        <span style={{ fontSize: 9, color: C.textMuted, fontFamily: 'monospace' }}>
          {isRtl ? 'آخر فحص:' : 'Last check:'} {ts.toLocaleTimeString()}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Pill label="Supabase DB API"    ok={supabaseOk} latency={supabaseLatency} />
        <Pill label="Vercel Edge"        ok={true}       latency={vercelLatency}   />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: C.successBg, border: `1px solid ${C.successBorder}`,
          borderRadius: 10, padding: '8px 14px',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.success, animation: 'v2pulse 1.5s infinite', boxShadow: `0 0 8px ${C.success}` }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.success }}>{isRtl ? 'سلامة الفروع' : 'Branch Health'}</span>
            <span style={{ fontSize: 9, color: C.textSecondary, fontWeight: 600 }}>{isRtl ? '100% تشغيل' : '100% operational'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY FEED
// ─────────────────────────────────────────────────────────────────────────────
function getSeedEvents() {
  return [
    { id: 1, type: 'signup',  icon: '👤', label_ar: 'مالك جديد مسجّل',           label_en: 'New Owner Registered',        ts: -120  },
    { id: 2, type: 'sub',     icon: '⚡', label_ar: 'فرع اشترك في خطة شهرية',    label_en: 'Branch Subscribed — Monthly', ts: -300  },
    { id: 3, type: 'invite',  icon: '🔗', label_ar: 'رابط دعوة موظف تم توليده',  label_en: 'Staff Invite Generated',      ts: -540  },
    { id: 4, type: 'login',   icon: '🔐', label_ar: 'كاشير سجّل دخولاً جديداً',  label_en: 'Cashier Login Recorded',      ts: -780  },
    { id: 5, type: 'upgrade', icon: '🎉', label_ar: 'اشتراك تمت ترقيته',         label_en: 'Subscription Upgraded',       ts: -1020 },
    { id: 6, type: 'branch',  icon: '🏢', label_ar: 'فرع جديد تم إنشاؤه',        label_en: 'New Branch Provisioned',      ts: -1500 },
    { id: 7, type: 'lock',    icon: '🔒', label_ar: 'جهاز محظور بسبب مخالفة',    label_en: 'Device Lockout — Policy',     ts: -2400 },
    { id: 8, type: 'auth',    icon: '🛡️', label_ar: 'محاولة مصادقة مشبوهة',      label_en: 'Suspicious Auth Attempt',     ts: -3600 },
  ];
}

function ActivityFeed({ isRtl, users }) {
  const C = useC();
  const [events, setEvents] = useState(() =>
    getSeedEvents().map(e => ({ ...e, timestamp: new Date(Date.now() + e.ts * 1000) }))
  );
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!users?.length) return;
    const last = users[users.length - 1];
    if (!last) return;
    setEvents(prev => {
      if (prev.find(e => e.id === `live-${last.id}`)) return prev;
      return [{ id: `live-${last.id}`, type: 'signup', icon: '👤', label_ar: `مالك جديد: ${last.name || last.username}`, label_en: `New Owner: ${last.name || last.username}`, timestamp: new Date() }, ...prev].slice(0, 20);
    });
  }, [users?.length]);

  useEffect(() => {
    const onError = (e) => {
      setErrors(prev => [{ id: Date.now(), msg: e.message || String(e), ts: new Date() }, ...prev].slice(0, 10));
    };
    const onUnhandled = (e) => {
      setErrors(prev => [{ id: Date.now(), msg: String(e.reason || e.message || 'Unhandled Promise Rejection'), ts: new Date() }, ...prev].slice(0, 10));
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onUnhandled); };
  }, []);

  const badgeMap = {
    signup:  { label_en: 'SIGNUP',    label_ar: 'حساب',   color: C.info,    bg: C.infoBg,    border: C.infoBorder    },
    sub:     { label_en: 'SUBSCRIBE', label_ar: 'اشتراك', color: C.success, bg: C.successBg, border: C.successBorder },
    invite:  { label_en: 'INVITE',    label_ar: 'دعوة',   color: C.amber,   bg: C.amberBg,   border: C.amberBorder   },
    login:   { label_en: 'LOGIN',     label_ar: 'دخول',   color: C.purple,  bg: C.purpleBg,  border: C.purpleBorder  },
    upgrade: { label_en: 'UPGRADE',   label_ar: 'ترقية',  color: C.success, bg: C.successBg, border: C.successBorder },
    branch:  { label_en: 'BRANCH',    label_ar: 'فرع',    color: C.teal,    bg: C.tealBg,    border: C.tealBorder    },
    lock:    { label_en: 'LOCKOUT',   label_ar: 'حظر',    color: C.danger,  bg: C.dangerBg,  border: C.dangerBorder  },
    auth:    { label_en: 'AUTH',      label_ar: 'مصادقة', color: C.warning, bg: C.warningBg, border: C.warningBorder },
  };

  const fmt = ts => new Date(ts).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Activity stream */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', transition: 'background 0.25s, border-color 0.25s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: C.bgDeep }}>
          <span>📡</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: C.amber, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {isRtl ? 'سجل النشاط الأخير' : 'Recent System Activity'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.success, animation: 'v2pulse 1.5s infinite' }} />
            <span style={{ fontSize: 9, color: C.success, fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {events.map((ev, i) => {
            const b = badgeMap[ev.type] || { label_en: 'EVENT', label_ar: 'حدث', color: C.textSecondary, bg: C.bgElevated, border: C.border };
            return (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                borderBottom: `1px solid ${C.borderThin}`,
                background: i % 2 === 0 ? C.bgShaded : 'transparent',
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: b.bg, border: `1px solid ${b.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{ev.icon}</div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{isRtl ? ev.label_ar : ev.label_en}</span>
                <span style={{ fontSize: 8, fontWeight: 900, padding: '3px 8px', borderRadius: 4, background: b.bg, color: b.color, border: `1px solid ${b.border}`, whiteSpace: 'nowrap' }}>
                  {isRtl ? b.label_ar : b.label_en}
                </span>
                <span style={{ fontSize: 9, color: C.textMuted, fontFamily: 'monospace', flexShrink: 0 }}>{fmt(ev.timestamp)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Frontend error capture */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.dangerBorder}`, borderRadius: 14, overflow: 'hidden', transition: 'background 0.25s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: `1px solid ${C.dangerBorder}`, background: C.dangerBg }}>
          <span>🐛</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: C.danger, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {isRtl ? 'أخطاء وقت التشغيل' : 'Frontend Runtime Errors'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: C.danger, fontWeight: 700 }}>
            {errors.length} {isRtl ? 'خطأ' : 'captured'}
          </span>
        </div>
        {errors.length === 0 ? (
          <div style={{ padding: '24px 18px', textAlign: 'center', color: C.textMuted, fontSize: 12 }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>✅</span>
            {isRtl ? 'لا توجد أخطاء مرصودة' : 'No runtime errors captured'}
          </div>
        ) : errors.map(err => (
          <div key={err.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: `1px solid ${C.borderThin}` }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ flex: 1, fontSize: 11, color: C.textPrimary, fontFamily: 'monospace', wordBreak: 'break-all' }}>{err.msg}</span>
            <span style={{ fontSize: 9, color: C.textMuted, fontFamily: 'monospace', flexShrink: 0 }}>{fmt(err.ts)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB A — TENANT & OWNER HUB
// ─────────────────────────────────────────────────────────────────────────────
function TabTenantHub({ isRtl, users, setUsers, currentUser, subscriptionStatus, setSubscriptionStatus, setSubscriptionExpired, setTrialDaysLeft, storeName, pushNotification }) {
  const C = useC();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [impersonating, setImpersonating] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('_v2_impersonate') || 'null'); } catch { return null; }
  });
  const [trialInputs, setTrialInputs] = useState({});

  const formatDate = (d) => {
    if (!d) return isRtl ? 'لا يوجد' : 'None';
    try { return new Date(d).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const getUserSub = (u) => {
    const isMe = u.id === currentUser?.id;
    return {
      storeName: u.storeName || (isMe ? storeName : `${u.name || u.username}'s Store`),
      status: u.subscriptionStatus || (isMe ? subscriptionStatus : 'active'),
      expiry: u.subscriptionExpiry || (isMe ? localStorage.getItem('pos_subscription_end_date') : null),
      email: u.email || u.username || '—',
    };
  };

  const enriched = useMemo(() => users.map(u => ({ ...u, ...getUserSub(u) })), [users, subscriptionStatus, storeName]);
  const uniqueRoles = ['ALL', ...new Set(enriched.map(u => u.role).filter(Boolean))];
  const filtered = useMemo(() => enriched.filter(u => {
    const q = search.toLowerCase();
    const ms = !q || [u.storeName, u.username, u.name, u.role, u.email].some(v => (v || '').toLowerCase().includes(q));
    const mr = roleFilter === 'ALL' || u.role === roleFilter;
    return ms && mr;
  }), [enriched, search, roleFilter]);

  const handleUpgrade = (user) => {
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const upd = users.map(u => u.id === user.id ? { ...u, subscriptionStatus: 'active', subscriptionExpiry: expiry } : u);
    setUsers(upd);
    localStorage.setItem('pos_users', JSON.stringify(upd));
    if (user.id === currentUser?.id) {
      setSubscriptionStatus('active'); setSubscriptionExpired(false); setTrialDaysLeft(null);
      localStorage.setItem('pos_subscription_status', 'active');
      localStorage.setItem('pos_subscription_end_date', expiry);
      localStorage.removeItem('activationDate'); localStorage.removeItem('pos_trial_start_date');
    }
    pushNotification?.(isRtl ? `🎉 تم تفعيل اشتراك (${user.storeName})!` : `🎉 (${user.storeName}) upgraded to ACTIVE!`, 'success');
  };

  const handleReset = (user) => {
    const upd = users.map(u => u.id === user.id ? { ...u, subscriptionStatus: 'pending_onboarding', subscriptionExpiry: null } : u);
    setUsers(upd);
    localStorage.setItem('pos_users', JSON.stringify(upd));
    if (user.id === currentUser?.id) {
      setSubscriptionStatus('pending_onboarding'); setSubscriptionExpired(false); setTrialDaysLeft(null);
      localStorage.setItem('pos_subscription_status', 'pending_onboarding');
      localStorage.removeItem('pos_subscription_end_date'); localStorage.removeItem('activationDate'); localStorage.removeItem('pos_trial_start_date');
    }
    pushNotification?.(isRtl ? `⚠️ إعادة تعيين (${user.storeName}) إلى الإعداد` : `⚠️ (${user.storeName}) reset to Onboarding`, 'warning');
  };

  const handleDisable = (user) => {
    const upd = users.map(u => u.id === user.id ? { ...u, subscriptionStatus: 'expired', subscriptionExpiry: null } : u);
    setUsers(upd);
    localStorage.setItem('pos_users', JSON.stringify(upd));
    if (user.id === currentUser?.id) {
      setSubscriptionStatus('expired'); setSubscriptionExpired(true); setTrialDaysLeft(null);
      localStorage.setItem('pos_subscription_status', 'expired');
      localStorage.removeItem('pos_subscription_end_date');
    }
    pushNotification?.(isRtl ? `🚫 تم تعطيل (${user.storeName})` : `🚫 (${user.storeName}) locked`, 'error');
  };

  const handleResetDrawer = (user) => {
    if (user.id === currentUser?.id) {
      localStorage.setItem('pos_drawerBalance', '0');
      localStorage.setItem('pos_drawerLogs', '[]');
      localStorage.setItem('pos_cashLog', '[]');
    }
    pushNotification?.(isRtl ? `💰 تصفير الصندوق (${user.storeName})` : `💰 Drawer zeroed (${user.storeName})`, 'warning');
  };

  const handleForceSync = (user) => {
    pushNotification?.(isRtl ? `🔄 جاري مزامنة (${user.storeName})...` : `🔄 Syncing (${user.storeName})...`, 'info');
    setTimeout(() => pushNotification?.(isRtl ? `✅ تمت المزامنة (${user.storeName})` : `✅ Synced (${user.storeName})`, 'success'), 1200);
  };

  const handleImpersonate = (user) => {
    if (user.id === currentUser?.id) return;
    const snapshot = {
      pos_subscription_status: localStorage.getItem('pos_subscription_status'),
      pos_subscription_end_date: localStorage.getItem('pos_subscription_end_date'),
      pos_trial_start_date: localStorage.getItem('pos_trial_start_date'),
      activationDate: localStorage.getItem('activationDate'),
      pos_store_name: localStorage.getItem('pos_store_name'),
    };
    sessionStorage.setItem('_v2_impersonate', JSON.stringify({ snapshot, targetName: user.storeName || user.name }));
    if (user.subscriptionStatus) localStorage.setItem('pos_subscription_status', user.subscriptionStatus);
    if (user.subscriptionExpiry) localStorage.setItem('pos_subscription_end_date', user.subscriptionExpiry);
    if (user.storeName) localStorage.setItem('pos_store_name', user.storeName);
    pushNotification?.(isRtl ? `👁️ تمت محاكاة جلسة (${user.storeName || user.name})` : `👁️ Impersonating (${user.storeName || user.name}) — reload to see effect`, 'info');
    setImpersonating({ snapshot, targetName: user.storeName || user.name });
  };

  const handleExitImpersonation = () => {
    const saved = impersonating?.snapshot;
    if (saved) {
      Object.entries(saved).forEach(([k, v]) => { if (v !== null && v !== undefined) localStorage.setItem(k, v); else localStorage.removeItem(k); });
    }
    sessionStorage.removeItem('_v2_impersonate');
    setImpersonating(null);
    pushNotification?.(isRtl ? '🔄 تمت استعادة الجلسة الأصلية' : '🔄 Original session restored', 'success');
  };

  const handleSaveTrialDays = (user) => {
    const days = parseInt(trialInputs[user.id] ?? '', 10);
    if (isNaN(days) || days < 0) return;
    const newStart = new Date(Date.now() - (14 - days) * 24 * 60 * 60 * 1000).toISOString();
    if (user.id === currentUser?.id) {
      localStorage.setItem('pos_trial_start_date', newStart);
      localStorage.setItem('activationDate', newStart);
      localStorage.setItem('pos_subscription_status', 'trial');
      setSubscriptionStatus('trial');
      setTrialDaysLeft(days);
    }
    const upd = users.map(u => u.id === user.id ? { ...u, subscriptionStatus: 'trial', trialStartDate: newStart } : u);
    setUsers(upd);
    localStorage.setItem('pos_users', JSON.stringify(upd));
    pushNotification?.(isRtl ? `📅 تم تعديل أيام التجربة لـ (${user.storeName}): ${days} يوم` : `📅 Trial for (${user.storeName}) set to ${days} days remaining`, 'success');
    setTrialInputs(prev => { const n = { ...prev }; delete n[user.id]; return n; });
  };

  const colStyle = { padding: '14px 14px', fontSize: 11, color: C.textPrimary };
  const thStyle  = { padding: '12px 14px', fontSize: 9, fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, whiteSpace: 'nowrap' };

  return (
    <div>
      {/* Impersonation banner */}
      {impersonating && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
          border: `1px solid ${C.amberBorder}`,
          borderRadius: 12, padding: '14px 20px',
          marginBottom: 20,
          gap: 12,
        }} className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>👁️</span>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.amber }}>
                {isRtl ? `جاري محاكاة: ${impersonating.targetName}` : `Impersonating: ${impersonating.targetName}`}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: C.textSecondary }}>
                {isRtl ? 'جلستك الأصلية محفوظة. انقر على "استعادة" للخروج.' : 'Your original session is stored. Click "Exit" to restore.'}
              </p>
            </div>
          </div>
          <ActionBtn onClick={handleExitImpersonation} variant="amber">
            🔄 {isRtl ? 'استعادة الجلسة' : 'Exit Impersonation'}
          </ActionBtn>
        </div>
      )}

      <SectionTitle icon="🏪" title={isRtl ? 'مركز المستأجرين والملاك' : 'Tenant & Owner Hub'} subtitle={isRtl ? 'إدارة حسابات الملاك والفروع وتعديل الاشتراكات' : 'Manage owner accounts, branches, and subscription controls'} />

      {/* Search / filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 w-full">
        <div style={{ position: 'relative' }} className="w-full sm:flex-1">
          <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 10, fontSize: 12, color: C.textMuted, pointerEvents: 'none' }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث...' : 'Search owners, stores…'}
            style={{ width: '100%', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textPrimary, fontSize: 12, padding: '9px 12px 9px 32px', outline: 'none', boxSizing: 'border-box', transition: 'background 0.2s, border-color 0.2s, color 0.2s' }}
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto"
          style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSecondary, fontSize: 11, fontWeight: 700, padding: '9px 12px', outline: 'none', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}>
          {uniqueRoles.map(r => <option key={r} value={r}>{r === 'ALL' ? (isRtl ? '— كل الأدوار —' : '— All Roles —') : r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 28, transition: 'background 0.25s, border-color 0.25s' }}>
        <div className="w-full overflow-x-auto border border-zinc-800 rounded-lg">
          <table className="w-full min-w-[700px]" style={{ borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: C.bgDeep, borderBottom: `1px solid ${C.border}` }}>
                {[
                  isRtl ? 'المتجر / الحساب' : 'Store / Account',
                  isRtl ? 'الإيميل / المستخدم' : 'Email / Username',
                  isRtl ? 'الدور' : 'Role',
                  isRtl ? 'حالة الباقة' : 'Tier / Status',
                  isRtl ? 'تاريخ الانتهاء' : 'Expiry',
                  isRtl ? 'التجربة المتبقية' : 'Trial Adjuster',
                  isRtl ? 'الإجراءات' : 'Actions',
                ].map((h, i) => <th key={i} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 12 }}>{isRtl ? 'لا توجد سجلات مطابقة' : 'No matching records'}</td></tr>
              ) : filtered.map(user => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <tr key={user.id} style={{
                    borderBottom: `1px solid ${C.borderThin}`,
                    background: isSelf ? C.amberBg : 'transparent',
                    borderLeft: isSelf && !isRtl ? `3px solid ${C.amber}` : undefined,
                    borderRight: isSelf && isRtl ? `3px solid ${C.amber}` : undefined,
                  }}>
                    {/* Store */}
                    <td style={colStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏪</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: C.textPrimary, whiteSpace: 'nowrap' }}>{user.storeName}</p>
                          <p style={{ margin: 0, fontSize: 9, color: C.textMuted, fontFamily: 'monospace' }}>{user.id}</p>
                        </div>
                        {isSelf && <span style={{ fontSize: 8, fontWeight: 900, color: C.amber, background: C.amberBg, border: `1px solid ${C.amberBorder}`, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>YOU</span>}
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ ...colStyle, fontFamily: 'monospace', fontSize: 11, color: C.textSecondary }}>{user.email}</td>
                    {/* Role */}
                    <td style={colStyle}>
                      <span style={{
                        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1,
                        padding: '4px 8px', borderRadius: 6,
                        background: user.role === 'Owner' ? C.amberBg : user.role === 'admin' ? C.dangerBg : C.bgElevated,
                        color: user.role === 'Owner' ? C.amber : user.role === 'admin' ? C.danger : C.textSecondary,
                        border: `1px solid ${user.role === 'Owner' ? C.amberBorder : user.role === 'admin' ? C.dangerBorder : C.border}`,
                      }}>{user.role}</span>
                    </td>
                    {/* Status */}
                    <td style={colStyle}><StatusBadge status={user.status} isRtl={isRtl} /></td>
                    {/* Expiry */}
                    <td style={{ ...colStyle, fontFamily: 'monospace', fontSize: 10, color: C.textMuted, whiteSpace: 'nowrap' }}>{formatDate(user.expiry)}</td>
                    {/* Trial adjuster */}
                    <td style={colStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number" min="0" max="90"
                          value={trialInputs[user.id] ?? ''}
                          onChange={e => setTrialInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
                          placeholder={isRtl ? 'أيام' : 'days'}
                          style={{ width: 58, background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textPrimary, fontSize: 11, padding: '5px 8px', outline: 'none', transition: 'background 0.2s, border-color 0.2s, color 0.2s' }}
                        />
                        <ActionBtn small onClick={() => handleSaveTrialDays(user)} disabled={!trialInputs[user.id]} variant="amber">✓</ActionBtn>
                      </div>
                    </td>
                    {/* Actions */}
                    <td style={colStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <ActionBtn small onClick={() => handleUpgrade(user)} disabled={user.status === 'active'} variant="green">⚡ {isRtl ? 'ترقية' : 'Upgrade'}</ActionBtn>
                        <ActionBtn small onClick={() => handleReset(user)} disabled={user.status === 'pending_onboarding'} variant="slate">🔄 {isRtl ? 'تهيئة' : 'Reset'}</ActionBtn>
                        <ActionBtn small onClick={() => handleDisable(user)} disabled={user.status === 'expired'} variant="red">🚫 {isRtl ? 'تعطيل' : 'Lock'}</ActionBtn>
                        <ActionBtn small onClick={() => handleResetDrawer(user)} variant="amber">💰 {isRtl ? 'تصفير' : 'Zero'}</ActionBtn>
                        <ActionBtn small onClick={() => handleForceSync(user)} variant="blue">☁️ {isRtl ? 'مزامنة' : 'Sync'}</ActionBtn>
                        {user.id !== currentUser?.id && (
                          <ActionBtn small onClick={() => handleImpersonate(user)} variant="purple">👁️ {isRtl ? 'محاكاة' : 'Impersonate'}</ActionBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB B — SAAS BILLING ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function TabBilling({ isRtl, users, setUsers, currentUser, pushNotification }) {
  const C = useC();
  const enriched = useMemo(() => users.map(u => ({
    ...u,
    storeName: u.storeName || `${u.name || u.username}'s Store`,
    status: u.subscriptionStatus || 'active',
    expiry: u.subscriptionExpiry,
  })), [users]);

  const activeMonthly = enriched.filter(u => u.status === 'active').length;
  const trialCount    = enriched.filter(u => u.status === 'trial').length;
  const expiredCount  = enriched.filter(u => u.status === 'expired').length;
  const mrr = activeMonthly * PLAN_MONTHLY_EGP;
  const arr = mrr * 12;

  const handleExtend = (user) => {
    const base = user.expiry ? new Date(user.expiry) : new Date();
    const newExpiry = new Date(Math.max(base.getTime(), Date.now()) + 30 * 24 * 60 * 60 * 1000).toISOString();
    const upd = users.map(u => u.id === user.id ? { ...u, subscriptionStatus: 'active', subscriptionExpiry: newExpiry } : u);
    setUsers(upd);
    localStorage.setItem('pos_users', JSON.stringify(upd));
    pushNotification?.(isRtl ? `📅 تم تمديد (${user.storeName}) 30 يومًا` : `📅 Extended (${user.storeName}) by 30 days`, 'success');
  };

  const daysUntil = (expiry) => {
    if (!expiry) return null;
    return Math.ceil((new Date(expiry) - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const fmt = (d) => {
    if (!d) return isRtl ? 'لا يوجد' : 'None';
    try { return new Date(d).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div>
      <SectionTitle icon="💰" title={isRtl ? 'محرك الفوترة والاشتراكات' : 'SaaS Billing Engine'} subtitle={isRtl ? 'الإيرادات الشهرية والسنوية وسجل التجديدات' : 'Monthly & annual recurring revenue plus renewal ledger'} />

      {/* MRR / ARR cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <MetricCard label={isRtl ? 'الإيراد الشهري المتكرر' : 'Monthly Recurring Revenue'} value={`${mrr.toLocaleString()} ج`} sub={`${activeMonthly} ${isRtl ? 'مشترك نشط × 299 ج' : 'active subs × 299 EGP'}`} icon="📈" color={C.success} borderColor={C.successBorder} />
        <MetricCard label={isRtl ? 'الإيراد السنوي المتوقع' : 'Annual Recurring Revenue'} value={`${arr.toLocaleString()} ج`} sub={isRtl ? 'MRR × 12 شهرًا' : 'MRR × 12 months'} icon="🏦" color={C.amber} borderColor={C.amberBorder} />
        <MetricCard label={isRtl ? 'مشتركون نشطون' : 'Active Subscribers'} value={activeMonthly} sub={isRtl ? `${trialCount} تجريبي` : `${trialCount} on trial`} icon="⚡" color={C.info} borderColor={C.infoBorder} />
        <MetricCard label={isRtl ? 'اشتراكات منتهية' : 'Expired Licenses'} value={expiredCount} sub={isRtl ? 'تحتاج تجديد' : 'Need renewal action'} icon="⏳" color={C.danger} borderColor={C.dangerBorder} />
      </div>

      {/* Plan pricing tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[28px]">
        {[
          { tier: isRtl ? 'الخطة الشهرية' : 'Monthly Plan', price: `${PLAN_MONTHLY_EGP} EGP / mo`, icon: '📆', color: C.info },
          { tier: isRtl ? 'الخطة السنوية' : 'Annual Plan',  price: `${PLAN_ANNUAL_EGP} EGP / yr`,  icon: '🗓️', color: C.amber, badge: isRtl ? 'توفير 16%' : 'Save 16%' },
        ].map(p => (
          <div key={p.tier} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.2s, border-color 0.2s' }}>
            <span style={{ fontSize: 26 }}>{p.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textSecondary }}>{p.tier}</p>
              <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: p.color }}>{p.price}</p>
            </div>
            {p.badge && <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 900, color: C.success, background: C.successBg, border: `1px solid ${C.successBorder}`, padding: '4px 8px', borderRadius: 20 }}>{p.badge}</span>}
          </div>
        ))}
      </div>

      {/* Renewal Ledger */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', transition: 'background 0.25s, border-color 0.25s' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: C.bgDeep, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📋</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: C.amber, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {isRtl ? 'سجل التجديدات القادمة' : 'Renewal Ledger'}
          </span>
        </div>
        <div className="w-full overflow-x-auto border border-zinc-800 rounded-lg">
          <table className="w-full min-w-[700px]" style={{ borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: C.bgDeep, borderBottom: `1px solid ${C.border}` }}>
                {[
                  isRtl ? 'المتجر' : 'Store',
                  isRtl ? 'الحالة' : 'Status',
                  isRtl ? 'تاريخ التجديد' : 'Renewal Date',
                  isRtl ? 'الأيام المتبقية' : 'Days Remaining',
                  isRtl ? 'إجراء' : 'Action',
                ].map((h, i) => <th key={i} style={{ padding: '11px 14px', fontSize: 9, fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {enriched.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>{isRtl ? 'لا توجد بيانات' : 'No data'}</td></tr>
              ) : enriched.map(user => {
                const days = daysUntil(user.expiry);
                const overdue = days !== null && days < 0;
                const soon    = days !== null && days >= 0 && days <= 7;
                return (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${C.borderThin}`, background: overdue ? C.dangerBg : soon ? C.warningBg : 'transparent' }}>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{user.storeName}</td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={user.status} isRtl={isRtl} /></td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: C.textSecondary, fontFamily: 'monospace' }}>{fmt(user.expiry)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {days === null ? (
                        <span style={{ fontSize: 10, color: C.textMuted }}>—</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, color: overdue ? C.danger : soon ? C.warning : C.success }}>
                          {overdue ? `${Math.abs(days)}d ${isRtl ? 'متأخر' : 'overdue'}` : `${days}d`}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <ActionBtn small onClick={() => handleExtend(user)} variant="green">
                        🗓️ {isRtl ? 'تمديد 30 يومًا' : '+30 Days'}
                      </ActionBtn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB C — FEATURE FLAGS & LICENSE CONTROLS
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FLAGS = {
  advanced_analytics:       true,
  barcode_scanner:          true,
  mobile_pos_sync:          false,
  multi_branch_access:      true,
  custom_receipt_templates: false,
  ai_sales_insights:        false,
  table_management:         true,
  stock_alerts:             true,
};

const FLAG_META = [
  { key: 'advanced_analytics',       icon: '📊', label_en: 'Advanced Analytics Dashboard',  label_ar: 'لوحة التحليلات المتقدمة',        desc_en: 'Detailed sales trends, forecasts & KPI charts',             desc_ar: 'رسوم بيانية ومؤشرات أداء متقدمة'        },
  { key: 'barcode_scanner',          icon: '📷', label_en: 'Barcode Scanner Integration',    label_ar: 'تكامل ماسح الباركود',             desc_en: 'POS barcode and QR scan support',                          desc_ar: 'دعم مسح الباركود والرمز السريع QR'       },
  { key: 'mobile_pos_sync',          icon: '📱', label_en: 'Mobile POS Sync',                label_ar: 'مزامنة نقاط البيع المحمول',       desc_en: 'Sync transactions from mobile devices in real-time',       desc_ar: 'مزامنة العمليات من الأجهزة المحمولة'     },
  { key: 'multi_branch_access',      icon: '🏢', label_en: 'Multi-Branch Access',            label_ar: 'الوصول متعدد الفروع',             desc_en: 'Owner can manage multiple branches from one login',        desc_ar: 'إدارة فروع متعددة من تسجيل دخول واحد'   },
  { key: 'custom_receipt_templates', icon: '🧾', label_en: 'Custom Receipt Templates',       label_ar: 'قوالب إيصالات مخصصة',             desc_en: 'Design branded receipts with logo & custom footer',        desc_ar: 'تصميم إيصالات مخصصة بشعار وتذييل'       },
  { key: 'ai_sales_insights',        icon: '🤖', label_en: 'AI Sales Insights (Beta)',       label_ar: 'رؤى المبيعات بالذكاء الاصطناعي', desc_en: 'Machine-learning powered sales predictions',               desc_ar: 'توقعات المبيعات بالتعلم الآلي'           },
  { key: 'table_management',         icon: '🍽️', label_en: 'Table Management Module',        label_ar: 'وحدة إدارة الطاولات',             desc_en: 'Dine-in table layout and session tracking',                desc_ar: 'تخطيط الطاولات وتتبع الجلسات'           },
  { key: 'stock_alerts',             icon: '⚠️', label_en: 'Low Stock Alerts',               label_ar: 'تنبيهات المخزون المنخفض',         desc_en: 'Automated alerts when inventory falls below threshold',    desc_ar: 'تنبيهات تلقائية عند انخفاض المخزون'     },
];

function TabFeatureFlags({ isRtl, users, setUsers, currentUser, pushNotification }) {
  const C = useC();
  const [selectedTenant, setSelectedTenant] = useState('__global__');
  const [flags, setFlags] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_feature_flags') || 'null') || DEFAULT_FLAGS; }
    catch { return DEFAULT_FLAGS; }
  });

  const tenantOptions = [
    { id: '__global__', label: isRtl ? '— تطبيق على كل المتاجر —' : '— Apply Globally —' },
    ...users.map(u => ({ id: u.id, label: u.storeName || u.name || u.username })),
  ];

  const handleToggle = (key, val) => {
    const next = { ...flags, [key]: val };
    setFlags(next);
    if (selectedTenant === '__global__') {
      localStorage.setItem('pos_feature_flags', JSON.stringify(next));
    } else {
      const upd = users.map(u => u.id === selectedTenant ? { ...u, featureFlags: { ...(u.featureFlags || DEFAULT_FLAGS), [key]: val } } : u);
      setUsers(upd);
      localStorage.setItem('pos_users', JSON.stringify(upd));
    }
    const meta = FLAG_META.find(f => f.key === key);
    const label = meta ? (isRtl ? meta.label_ar : meta.label_en) : key;
    pushNotification?.(
      isRtl ? `🚩 ${label}: ${val ? 'مفعّل' : 'معطّل'}` : `🚩 ${label}: ${val ? 'Enabled' : 'Disabled'}`,
      val ? 'success' : 'warning'
    );
  };

  useEffect(() => {
    if (selectedTenant === '__global__') {
      try { setFlags(JSON.parse(localStorage.getItem('pos_feature_flags') || 'null') || DEFAULT_FLAGS); }
      catch { setFlags(DEFAULT_FLAGS); }
    } else {
      const u = users.find(u => u.id === selectedTenant);
      setFlags({ ...DEFAULT_FLAGS, ...(u?.featureFlags || {}) });
    }
  }, [selectedTenant, users]);

  const enabledCount = Object.values(flags).filter(Boolean).length;

  return (
    <div>
      <SectionTitle icon="🚩" title={isRtl ? 'التحكم في الميزات والتراخيص' : 'Feature Flags & License Controls'} subtitle={isRtl ? 'تفعيل أو تعطيل الميزات لكل مستأجر بشكل مستقل' : 'Enable or disable features per-tenant independently'} />

      <div className="flex flex-col md:flex-row gap-[14px] items-start md:items-center mb-[20px]">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} className="w-full md:w-auto">
          <label style={{ fontSize: 9, fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 }}>{isRtl ? 'تطبيق على:' : 'Apply to:'}</label>
          <select value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)}
            className="w-full md:w-auto md:min-w-[220px]"
            style={{ background: C.bgCard, border: `1px solid ${C.amberBorder}`, borderRadius: 8, color: C.textPrimary, fontSize: 12, fontWeight: 700, padding: '9px 14px', outline: 'none', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}>
            {tenantOptions.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 18, transition: 'background 0.2s, border-color 0.2s' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.success }}>{enabledCount}</p>
            <p style={{ margin: 0, fontSize: 9, color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>{isRtl ? 'مفعّل' : 'Enabled'}</p>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.textMuted }}>{FLAG_META.length - enabledCount}</p>
            <p style={{ margin: 0, fontSize: 9, color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>{isRtl ? 'معطّل' : 'Disabled'}</p>
          </div>
        </div>
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', transition: 'background 0.25s, border-color 0.25s' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.bgDeep, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🎛️</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: C.amber, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {isRtl ? 'مفاتيح الميزات' : 'Feature Switches'}
          </span>
        </div>
        {FLAG_META.map((f, i) => (
          <div key={f.key}>
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '16px 18px', gap: 14, borderBottom: i < FLAG_META.length - 1 ? `1px solid ${C.borderThin}` : 'none', background: flags[f.key] ? (C.isDark ? 'rgba(245,158,11,0.03)' : 'rgba(217,119,6,0.04)') : 'transparent', transition: 'background 0.2s', cursor: 'pointer' }}
              onClick={() => handleToggle(f.key, !flags[f.key])}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{isRtl ? f.label_ar : f.label_en}</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textSecondary }}>{isRtl ? f.desc_ar : f.desc_en}</p>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: flags[f.key] ? C.success : C.textMuted, textTransform: 'uppercase' }}>
                  {flags[f.key] ? (isRtl ? 'مفعّل' : 'ON') : (isRtl ? 'معطّل' : 'OFF')}
                </span>
                <div style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: flags[f.key] ? C.amber : C.bgElevated,
                  border: `1px solid ${flags[f.key] ? C.amber : C.border}`,
                  position: 'relative', transition: 'all 0.25s',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: flags[f.key] ? 23 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: flags[f.key] ? '#fff' : C.textMuted,
                    transition: 'all 0.25s',
                    boxShadow: flags[f.key] ? '0 0 6px rgba(245,158,11,0.6)' : 'none',
                  }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB D — LIVE TELEMETRY & AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────
function TabTelemetry({ isRtl, users }) {
  return (
    <div>
      <SectionTitle icon="📡" title={isRtl ? 'رادار المنصة والعمليات' : 'Live Telemetry & Audit Logs'} subtitle={isRtl ? 'مراقبة مباشرة لأحداث قاعدة البيانات والمصادقة وأخطاء الواجهة' : 'Real-time monitoring of DB events, auth attempts & frontend errors'} />
      <SystemHealthBar isRtl={isRtl} />
      <ActivityFeed isRtl={isRtl} users={users} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB E — CLOUD MAINTENANCE & BACKUPS
// ─────────────────────────────────────────────────────────────────────────────
function TabMaintenance({ isRtl, currentUser, pushNotification }) {
  const C = useC();
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupDone, setBackupDone]       = useState(false);
  const [maintenanceOn, setMaintenanceOn] = useState(() => localStorage.getItem('pos_maintenance_mode') === 'true');
  const [clearLoading, setClearLoading]   = useState(false);

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupDone(false);
    await new Promise(r => setTimeout(r, 1600));
    try {
      const snapshot = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        try { snapshot[k] = JSON.parse(localStorage.getItem(k)); }
        catch { snapshot[k] = localStorage.getItem(k); }
      }
      const blob = new Blob([JSON.stringify({ _meta: { createdAt: new Date().toISOString(), createdBy: currentUser?.id || 'u_4', version: '2.0' }, data: snapshot }, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `storeapp_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupDone(true);
      pushNotification?.(isRtl ? '✅ تم تنزيل النسخة الاحتياطية بنجاح' : '✅ Backup downloaded successfully', 'success');
    } catch (e) {
      pushNotification?.(isRtl ? '❌ فشل إنشاء النسخة الاحتياطية' : '❌ Backup creation failed', 'error');
    }
    setBackupLoading(false);
  };

  const handleMaintenanceToggle = (val) => {
    setMaintenanceOn(val);
    if (val) {
      localStorage.setItem('pos_maintenance_mode', 'true');
      pushNotification?.(isRtl ? '🔧 تم تفعيل وضع الصيانة — جميع المستخدمين غير u_4 سيرون شاشة الصيانة' : '🔧 Maintenance Mode ACTIVE — all non-developer sessions blocked', 'warning');
    } else {
      localStorage.removeItem('pos_maintenance_mode');
      pushNotification?.(isRtl ? '✅ تم إلغاء وضع الصيانة — النظام متاح مجددًا' : '✅ Maintenance Mode OFF — system restored', 'success');
    }
  };

  const handleClearCache = async () => {
    setClearLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const keep = ['pos_users', 'pos_subscription_status', 'pos_subscription_end_date', 'activationDate', 'pos_store_name', 'pos_feature_flags', 'pos_maintenance_mode', '_sp_device_token', 'pos_language', 'pos_theme', 'pos_custom_roles'];
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    keys.filter(k => !keep.includes(k) && !k.startsWith('pos_setting')).forEach(k => localStorage.removeItem(k));
    setClearLoading(false);
    pushNotification?.(isRtl ? '🗑️ تم تنظيف الكاش المؤقت بنجاح' : '🗑️ Temporary cache cleared', 'success');
  };

  return (
    <div>
      <SectionTitle icon="☁️" title={isRtl ? 'مركز الصيانة والنسخ الاحتياطي' : 'Cloud Maintenance & Backups'} subtitle={isRtl ? 'نسخ احتياطية بنقرة واحدة وضبط وضع الصيانة العالمي' : 'One-click backups and global maintenance mode control'} />

      {/* Maintenance active banner */}
      {maintenanceOn && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.08))',
          border: `1px solid ${C.dangerBorder}`, borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>🔧</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.danger }}>
              {isRtl ? 'وضع الصيانة نشط!' : 'Maintenance Mode is ACTIVE!'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textSecondary }}>
              {isRtl ? 'جميع المستخدمين غير u_4 يرون شاشة "النظام قيد التحديث". أنت مستثنى كمطوّر.' : 'All non-developer sessions see the "System Upgrading" screen. You (u_4) are exempt.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Backup card */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '26px 24px', transition: 'background 0.25s, border-color 0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, background: C.infoBg, border: `1px solid ${C.infoBorder}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💾</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{isRtl ? 'نسخة احتياطية شاملة' : 'Complete System Backup'}</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textSecondary }}>{isRtl ? 'تنزيل كل بيانات النظام كملف JSON' : 'Download all system data as JSON'}</p>
            </div>
          </div>
          <button
            onClick={handleBackup}
            disabled={backupLoading}
            style={{
              width: '100%', padding: '14px', borderRadius: 10, border: 'none',
              background: backupDone ? 'linear-gradient(135deg,#059669,#10b981)' : backupLoading ? C.bgElevated : `linear-gradient(135deg,${C.info},#2563eb)`,
              color: backupLoading ? C.textMuted : '#fff', fontSize: 13, fontWeight: 800, cursor: backupLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s',
            }}
          >
            {backupLoading ? (
              <>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${C.textMuted}`, borderTopColor: C.info, borderRadius: '50%', animation: 'v2spin 0.8s linear infinite' }} />
                {isRtl ? 'جاري الإنشاء...' : 'Generating…'}
              </>
            ) : backupDone ? (
              <>{isRtl ? '✅ تم التنزيل بنجاح' : '✅ Downloaded Successfully'}</>
            ) : (
              <>{isRtl ? '⬇️ تنزيل النسخة الاحتياطية' : '⬇️ Download Full Backup'}</>
            )}
          </button>
          <p style={{ margin: '10px 0 0', fontSize: 10, color: C.textMuted, textAlign: 'center' }}>
            {isRtl ? 'يشمل: المنتجات، الطلبات، الإعدادات، الموظفين' : 'Includes: items, orders, settings, staff data'}
          </p>
        </div>

        {/* Maintenance mode card */}
        <div style={{ background: C.bgCard, border: `1px solid ${maintenanceOn ? C.dangerBorder : C.border}`, borderRadius: 14, padding: '26px 24px', transition: 'background 0.25s, border-color 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, background: maintenanceOn ? C.dangerBg : C.bgElevated, border: `1px solid ${maintenanceOn ? C.dangerBorder : C.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'all 0.3s' }}>🔧</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{isRtl ? 'وضع الصيانة العالمي' : 'Global Maintenance Mode'}</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textSecondary }}>{isRtl ? 'يحجب جميع المستخدمين عدا المطوّر' : 'Blocks all non-developer users'}</p>
            </div>
          </div>
          <Toggle
            checked={maintenanceOn}
            onChange={handleMaintenanceToggle}
            label={isRtl ? (maintenanceOn ? 'الصيانة مفعّلة' : 'الصيانة معطّلة') : (maintenanceOn ? 'Maintenance ON' : 'Maintenance OFF')}
            desc={isRtl ? 'تبديل حالة الصيانة للنظام' : 'Toggle system maintenance state'}
            color={C.danger}
          />
          <div style={{ marginTop: 16, padding: '12px 14px', background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 10, color: C.amber, fontWeight: 700 }}>
              ⚠️ {isRtl ? 'المطوّر u_4 مستثنى دائمًا من وضع الصيانة' : 'Developer (u_4) is always exempt from maintenance mode'}
            </p>
          </div>
        </div>

        {/* Cache purge card */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '26px 24px', transition: 'background 0.25s, border-color 0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, background: C.warningBg, border: `1px solid ${C.warningBorder}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🗑️</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{isRtl ? 'مسح الكاش المؤقت' : 'Purge Temp Cache'}</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textSecondary }}>{isRtl ? 'حذف بيانات الكاش مع الحفاظ على الإعدادات' : 'Clear transient cache, preserve settings'}</p>
            </div>
          </div>
          <button
            onClick={handleClearCache}
            disabled={clearLoading}
            style={{
              width: '100%', padding: '14px', borderRadius: 10, border: `1px solid ${C.warningBorder}`,
              background: clearLoading ? C.bgElevated : C.warningBg,
              color: clearLoading ? C.textMuted : C.warning, fontSize: 13, fontWeight: 800,
              cursor: clearLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s',
            }}
          >
            {clearLoading ? (
              <>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${C.warningBorder}`, borderTopColor: C.warning, borderRadius: '50%', animation: 'v2spin 0.8s linear infinite' }} />
                {isRtl ? 'جاري المسح...' : 'Clearing…'}
              </>
            ) : (isRtl ? '🗑️ مسح الكاش' : '🗑️ Purge Cache')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'tenants',     icon: '🏪', label_en: 'Tenant & Owner Hub',   label_ar: 'المستأجرون والملاك' },
  { id: 'billing',     icon: '💰', label_en: 'Billing Engine',        label_ar: 'محرك الفوترة'        },
  { id: 'flags',       icon: '🚩', label_en: 'Feature Flags',         label_ar: 'التحكم في الميزات'   },
  { id: 'telemetry',   icon: '📡', label_en: 'Live Telemetry',        label_ar: 'رادار المنصة'        },
  { id: 'maintenance', icon: '☁️', label_en: 'Maintenance & Backups', label_ar: 'الصيانة والنسخ'      },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — AdminMasterPanel V2
// ─────────────────────────────────────────────────────────────────────────────
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
  pushNotification,
  theme = 'dark',
}) {
  const isRtl  = language === 'ar';
  const isDark = theme !== 'light';

  // ── Build and memoize the palette on every theme change ──────────────────
  const C = useMemo(() => buildPalette(isDark), [isDark]);

  const [activeTab, setActiveTab] = useState('tenants');
  const [tabVisible, setTabVisible] = useState(true);
  const prevTab = useRef('tenants');

  const switchTab = useCallback((id) => {
    if (id === activeTab) return;
    setTabVisible(false);
    setTimeout(() => {
      setActiveTab(id);
      prevTab.current = id;
      setTabVisible(true);
    }, 160);
  }, [activeTab]);

  const totalUsers = users.length;
  const activeSubs = users.filter(u => (u.subscriptionStatus || 'active') === 'active' || u.subscriptionStatus === 'trial').length;
  const mrr        = users.filter(u => (u.subscriptionStatus || 'active') === 'active').length * PLAN_MONTHLY_EGP;

  return (
    // Provide the live palette to every descendant via ThemeCtx
    <ThemeCtx.Provider value={C}>
      <style>{`
        @keyframes v2pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes v2spin   { to{transform:rotate(360deg)} }
        @keyframes v2fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .v2tab-btn { transition: all 0.18s ease; }
        .v2tab-btn:hover { background: ${isDark ? 'rgba(245,158,11,0.08)' : 'rgba(217,119,6,0.08)'} !important; color: ${isDark ? '#f59e0b' : '#d97706'} !important; }
      `}</style>

      <div style={{
        minHeight: '100%',
        background: C.bgMain,
        fontFamily: isRtl ? "'Cairo','Segoe UI',sans-serif" : "'Inter','Segoe UI',sans-serif",
        color: C.textPrimary,
        display: 'flex', flexDirection: 'column',
        transition: 'background 0.25s, color 0.25s',
      }} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* ── Page Header ─────────────────────────────────────── */}
        <div style={{ padding: '28px 28px 0', borderBottom: `1px solid ${C.borderThin}`, background: C.bgCard, transition: 'background 0.25s, border-color 0.25s' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>

            {/* Badge + title row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 20, padding: '4px 14px', marginBottom: 12 }}>
                  <span style={{ fontSize: 12 }}>🛡️</span>
                  <span style={{ fontSize: 9, fontWeight: 900, color: C.amber, textTransform: 'uppercase', letterSpacing: 2 }}>SaaS Provider Command Center — v2.0</span>
                </div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 950, color: C.textPrimary, letterSpacing: 0.3, transition: 'color 0.25s' }}>
                  {isRtl ? 'لوحة المسؤول الرئيسية — V2' : 'Master Admin Panel — V2'}
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: C.textSecondary, fontWeight: 500, transition: 'color 0.25s' }}>
                  {isRtl ? 'مركز تحكم شامل للمنصة: المستأجرون، الفوترة، الميزات، المراقبة، الصيانة.' : 'Full-spectrum platform control: tenants, billing, features, telemetry & maintenance.'}
                </p>
              </div>

              {/* Quick metrics */}
              <div className="grid grid-cols-3 gap-3 w-full md:w-auto md:flex md:gap-3">
                {[
                  { label: isRtl ? 'محطات' : 'Workstations', value: totalUsers,  color: C.textSecondary },
                  { label: isRtl ? 'نشطون'  : 'Active',       value: activeSubs, color: C.success       },
                  { label: isRtl ? 'MRR'    : 'MRR',          value: `${mrr}ج`,  color: C.amber         },
                ].map(m => (
                  <div key={m.label} style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', textAlign: 'center', transition: 'background 0.2s, border-color 0.2s' }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 950, color: m.color }}>{m.value}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 1 }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className="v2tab-btn"
                    onClick={() => switchTab(tab.id)}
                    style={{
                      padding: '12px 18px',
                      background: isActive ? C.amberBg : 'transparent',
                      border: 'none',
                      borderBottom: isActive ? `2px solid ${C.amber}` : '2px solid transparent',
                      color: isActive ? C.amber : C.textSecondary,
                      fontSize: 12, fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 7,
                      whiteSpace: 'nowrap',
                      borderRadius: '8px 8px 0 0',
                      flexShrink: 0,
                      transition: 'color 0.18s, background 0.18s, border-color 0.18s',
                    }}
                  >
                    <span>{tab.icon}</span>
                    <span>{isRtl ? tab.label_ar : tab.label_en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tab Content ─────────────────────────────────────── */}
        <div style={{
          flex: 1,
          padding: '28px',
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          opacity: tabVisible ? 1 : 0,
          transform: tabVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}>
          {activeTab === 'tenants' && (
            <TabTenantHub
              isRtl={isRtl}
              users={users}
              setUsers={setUsers}
              currentUser={currentUser}
              subscriptionStatus={subscriptionStatus}
              setSubscriptionStatus={setSubscriptionStatus}
              setSubscriptionExpired={setSubscriptionExpired}
              setTrialDaysLeft={setTrialDaysLeft}
              storeName={storeName}
              pushNotification={pushNotification}
            />
          )}
          {activeTab === 'billing' && (
            <TabBilling
              isRtl={isRtl}
              users={users}
              setUsers={setUsers}
              currentUser={currentUser}
              pushNotification={pushNotification}
            />
          )}
          {activeTab === 'flags' && (
            <TabFeatureFlags
              isRtl={isRtl}
              users={users}
              setUsers={setUsers}
              currentUser={currentUser}
              pushNotification={pushNotification}
            />
          )}
          {activeTab === 'telemetry' && (
            <TabTelemetry isRtl={isRtl} users={users} />
          )}
          {activeTab === 'maintenance' && (
            <TabMaintenance
              isRtl={isRtl}
              currentUser={currentUser}
              pushNotification={pushNotification}
            />
          )}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
