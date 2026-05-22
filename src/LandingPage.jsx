import React, { useState } from 'react';

/**
 * StorePilot PRO — Enterprise Marketing Landing Page
 * Shown to all unauthenticated visitors.
 * "enterprise-ui" wrapper enables rounded-corner styles.
 */
export default function LandingPage({ onLogin, onGetStarted, language, setLanguage }) {
  const isRtl = language === 'ar';
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      id: 'sales',
      icon: '🧾',
      color: '#1e40af',
      bg: '#eff6ff',
      titleEn: 'Smart Sales & POS',
      titleAr: 'نقطة بيع ذكية',
      descEn: 'Lightning-fast point-of-sale with invoice printing, shift management, and multi-payment support.',
      descAr: 'نقطة بيع سريعة مع طباعة الفواتير وإدارة الورديات ودعم طرق دفع متعددة.',
    },
    {
      id: 'inventory',
      icon: '📦',
      color: '#0f766e',
      bg: '#f0fdfa',
      titleEn: 'Inventory Control',
      titleAr: 'إدارة المخزون',
      descEn: 'Real-time stock tracking, low-stock alerts, category management, and multi-branch transfers.',
      descAr: 'تتبع المخزون الفوري، تنبيهات المخزون المنخفض، وتحويلات الفروع المتعددة.',
    },
    {
      id: 'hr',
      icon: '👥',
      color: '#7c3aed',
      bg: '#f5f3ff',
      titleEn: 'HR & Staff Payroll',
      titleAr: 'الموارد البشرية والرواتب',
      descEn: 'Employee management, attendance tracking, automated payroll processing and salary disbursements.',
      descAr: 'إدارة الموظفين، تتبع الحضور، معالجة الرواتب تلقائياً وصرف المستحقات.',
    },
    {
      id: 'reports',
      icon: '📊',
      color: '#b45309',
      bg: '#fffbeb',
      titleEn: 'Advanced Analytics',
      titleAr: 'تقارير وتحليلات متقدمة',
      descEn: 'Profit & loss reports, shift summaries, treasury dashboards, and exportable financial statements.',
      descAr: 'تقارير الأرباح والخسائر، ملخصات الورديات، لوحة الخزينة والتقارير المالية.',
    },
    {
      id: 'branches',
      icon: '🏢',
      color: '#0e7490',
      bg: '#ecfeff',
      titleEn: 'Multi-Branch Network',
      titleAr: 'شبكة الفروع المتعددة',
      descEn: 'Centralize control across multiple retail branches with cloud synchronization and branch-level analytics.',
      descAr: 'تحكم مركزي عبر فروع متعددة مع مزامنة سحابية وتحليلات على مستوى كل فرع.',
    },
    {
      id: 'cloud',
      icon: '☁️',
      color: '#1d4ed8',
      bg: '#eff6ff',
      titleEn: 'Cloud-First Architecture',
      titleAr: 'بنية سحابية أولاً',
      descEn: 'Offline-capable with full cloud sync. Your data is always safe, always accessible, always in sync.',
      descAr: 'يعمل بدون إنترنت مع مزامنة سحابية كاملة. بياناتك دائماً آمنة ومتاحة.',
    },
  ];

  return (
    <div
      className="enterprise-ui min-h-screen bg-[#f8fafc] text-[#1e293b] overflow-x-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}
    >
      <style>{`
        @keyframes landingFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(30,64,175,0.25); }
          50%       { box-shadow: 0 0 0 8px rgba(30,64,175,0); }
        }
        .landing-fade { animation: landingFadeUp 0.6s ease-out both; }
        .landing-fade-d1 { animation-delay: 0.1s; }
        .landing-fade-d2 { animation-delay: 0.2s; }
        .landing-fade-d3 { animation-delay: 0.3s; }
        .feature-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(30,64,175,0.10) !important;
        }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#e2e8f0]" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1e40af] rounded-lg flex items-center justify-center text-white text-lg">🚀</div>
            <div>
              <span className="font-black text-[#1e293b] text-base tracking-tight">StorePilot </span>
              <span className="font-black text-[#1e40af] text-base tracking-tight">PRO</span>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-4 py-2 text-[#64748b] hover:text-[#1e40af] font-bold text-sm rounded-lg hover:bg-[#eff6ff] transition-all"
            >
              {isRtl ? 'EN' : 'عربي'}
            </button>

            {/* Login */}
            <button
              onClick={onLogin}
              className="px-5 py-2 border border-[#e2e8f0] text-[#1e293b] hover:border-[#1e40af] hover:text-[#1e40af] font-bold text-sm rounded-lg transition-all"
            >
              {isRtl ? 'تسجيل الدخول' : 'Login'}
            </button>

            {/* Get Started */}
            <button
              onClick={onGetStarted}
              className="e-btn-primary px-5 py-2 rounded-lg text-sm font-bold"
              style={{ boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}
            >
              {isRtl ? 'ابدأ مجاناً' : 'Start Free Trial'}
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-6" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #f8fafc 50%, #f5f3ff 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #1e40af, transparent)', transform: 'translate(40%, -40%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #eab308, transparent)', transform: 'translate(-30%, 30%)' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-full text-[#1e40af] text-xs font-black uppercase tracking-widest mb-8 landing-fade" style={{ animation: 'badgePulse 3s ease-in-out infinite' }}>
            <span className="w-2 h-2 bg-[#1e40af] rounded-full animate-pulse" />
            {isRtl ? 'نظام ERP متكامل للشركات والمحلات' : 'Enterprise ERP — Retail & Commerce'}
          </div>

          {/* Main Heading */}
          <h1 className="landing-fade landing-fade-d1 font-black text-[#1e293b] leading-tight mb-6"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.15 }}>
            {isRtl ? (
              <>
                <span>StorePilot PRO</span>
                <br />
                <span className="text-[#1e40af]">نظام ERP متكامل</span>
                <br />
                <span style={{ fontSize: '0.6em', fontWeight: 700, color: '#64748b' }}>لإدارة مبيعاتك، مخزونك، وفريقك في مكان واحد</span>
              </>
            ) : (
              <>
                <span>StorePilot </span>
                <span className="text-[#1e40af]">PRO</span>
                <br />
                <span>The Complete </span>
                <span className="text-[#1e40af]">Retail ERP</span>
                <br />
                <span style={{ fontSize: '0.55em', fontWeight: 600, color: '#64748b' }}>Sales · Inventory · HR · Multi-Branch · Cloud Sync</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="landing-fade landing-fade-d2 text-[#64748b] font-medium mb-10 max-w-2xl mx-auto"
            style={{ fontSize: 'clamp(0.95rem, 2vw, 1.125rem)', lineHeight: 1.7 }}>
            {isRtl
              ? 'منصة SaaS متكاملة تجمع نقطة البيع، إدارة المخزون، الرواتب، والتقارير المالية في واجهة واحدة احترافية.'
              : 'A unified SaaS platform combining point-of-sale, inventory management, staff payroll, and financial analytics — built for modern retailers.'}
          </p>

          {/* CTAs */}
          <div className="landing-fade landing-fade-d3 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="e-btn-primary px-8 py-4 rounded-xl font-black text-base w-full sm:w-auto"
              style={{ minWidth: 220, boxShadow: '0 4px 20px rgba(30,64,175,0.3)' }}
            >
              🚀 {isRtl ? 'ابدأ التجربة المجانية 7 أيام' : 'Start 7-Day Free Trial'}
            </button>
            <button
              onClick={onLogin}
              className="px-8 py-4 rounded-xl border-2 border-[#1e40af] text-[#1e40af] font-black text-base hover:bg-[#eff6ff] transition-all w-full sm:w-auto"
              style={{ minWidth: 180 }}
            >
              {isRtl ? 'لدي حساب — دخول' : 'I Have an Account'}
            </button>
          </div>

          {/* Social Proof strip */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 opacity-60">
            {['⭐ 4.9/5 Rating', '🏪 500+ Stores', '🔒 SSL Secured', '☁️ 99.9% Uptime'].map(badge => (
              <span key={badge} className="text-[#64748b] font-bold text-sm">{badge}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-full text-[#1e40af] text-xs font-black uppercase tracking-widest mb-4">
              {isRtl ? 'الميزات الرئيسية' : 'Core Features'}
            </div>
            <h2 className="font-black text-[#1e293b] text-3xl mb-4">
              {isRtl ? 'كل ما تحتاجه لإدارة تجارتك' : 'Everything You Need to Run Your Business'}
            </h2>
            <p className="text-[#64748b] font-medium max-w-xl mx-auto" style={{ lineHeight: 1.7 }}>
              {isRtl
                ? 'أدوات متكاملة مصممة للتجار المحترفين والمتاجر الحديثة'
                : 'Integrated tools designed for professional retailers and modern commerce operations.'}
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.id}
                className="feature-card e-card p-8"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  borderTop: `3px solid ${f.color}`,
                  boxShadow: hoveredFeature === f.id
                    ? `0 12px 32px rgba(30,64,175,0.12)`
                    : '0 1px 4px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={() => setHoveredFeature(f.id)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <h3 className="font-black text-[#1e293b] text-lg mb-3">
                  {isRtl ? f.titleAr : f.titleEn}
                </h3>
                <p className="text-[#64748b] font-medium text-sm leading-relaxed">
                  {isRtl ? f.descAr : f.descEn}
                </p>
                <div className="mt-6 flex items-center gap-2 font-bold text-sm" style={{ color: f.color }}>
                  {isRtl ? 'اكتشف المزيد ←' : 'Learn more →'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#f8fafc' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-black text-[#1e293b] text-3xl mb-3">
              {isRtl ? 'ابدأ في 3 خطوات بسيطة' : 'Get Started in 3 Simple Steps'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '✍️', en: 'Create your account in under 2 minutes. No credit card required.', ar: 'أنشئ حسابك في دقيقتين. لا تطلب بطاقة ائتمان.' },
              { step: '02', icon: '⚙️', en: 'Set up your store — add products, staff, and branches.', ar: 'هيّئ متجرك — أضف المنتجات والموظفين والفروع.' },
              { step: '03', icon: '🚀', en: 'Go live and start selling. Your data syncs to the cloud instantly.', ar: 'ابدأ البيع فوراً. تتزامن بياناتك سحابياً في الحال.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-3xl mx-auto mb-4">{s.icon}</div>
                <div className="text-[#1e40af] font-black text-xs tracking-widest uppercase mb-2">Step {s.step}</div>
                <p className="text-[#64748b] font-medium text-sm leading-relaxed">{isRtl ? s.ar : s.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ──────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-black text-white text-3xl mb-4">
            {isRtl ? 'جاهز لتحديث تجارتك؟' : 'Ready to Transform Your Business?'}
          </h2>
          <p className="text-blue-200 font-medium mb-8" style={{ lineHeight: 1.7 }}>
            {isRtl
              ? 'ابدأ فترة تجريبية مجانية لمدة 7 أيام. لا توجد رسوم مخفية، لا حاجة لبطاقة.'
              : 'Start your 7-day free trial today. No hidden fees, no credit card required.'}
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 rounded-xl font-black text-base text-[#1e40af] bg-white hover:bg-blue-50 transition-all"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
          >
            🚀 {isRtl ? 'ابدأ الآن مجاناً' : 'Start Free — No Card Needed'}
          </button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#e2e8f0] py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1e40af] rounded-lg flex items-center justify-center text-white text-sm">🚀</div>
              <div>
                <span className="font-black text-[#1e293b]">StorePilot </span>
                <span className="font-black text-[#1e40af]">PRO</span>
                <span className="text-[#94a3b8] font-medium text-sm mx-2">·</span>
                <span className="text-[#94a3b8] font-medium text-sm">www.storepilot.pro</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-[#64748b] font-medium">
              <span>{isRtl ? 'الخصوصية' : 'Privacy'}</span>
              <span>{isRtl ? 'الشروط' : 'Terms'}</span>
              <span>{isRtl ? 'الدعم الفني' : 'Support'}</span>
            </div>

            {/* Copyright */}
            <p className="text-[#94a3b8] text-sm font-medium">
              © 2026 StorePilot PRO. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
