import React, { useState } from 'react';

/**
 * StorePilot PRO — Enterprise Marketing Landing Page
 * Shown to all unauthenticated visitors.
 * "enterprise-ui" wrapper enables rounded-corner styles.
 */
export default function LandingPage({ onLogin, onGetStarted, language, setLanguage, theme = 'dark', setTheme }) {
  const isRtl = language === 'ar';
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      id: 'sales',
      icon: '🧾',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      titleEn: 'Smart Sales & POS',
      titleAr: 'نقطة بيع ذكية',
      descEn: 'Lightning-fast point-of-sale with invoice printing, shift management, and multi-payment support.',
      descAr: 'نقطة بيع سريعة مع طباعة الفواتير وإدارة الورديات ودعم طرق دفع متعددة.',
      profitAr: 'يقلل زمن الانتظار بنسبة 40%، مما يسمح بخدمة عملاء أكثر وزيادة المبيعات اليومية في أوقات الذروة. يمنع تسريب الكاش والتلاعب بالفواتير عبر نظام الورديات المحكم ومراقبة الصندوق اللحظية والتتبع المباشر لجميع العمليات.',
      profitEn: 'Reduces checkout queuing time by 40% to capture more sales during peak hours. Prevents cash drawer discrepancies and theft with automated shift limits and real-time cash drawer logs.',
      bulletsAr: [
        'منع تسريب الكاش والتلاعب بالفواتير نهائياً.',
        'تسريع عملية الدفع والبيع وزيادة رضا العملاء.',
        'دعم كامل للفواتير المبسطة وطرق الدفع الحديثة.'
      ],
      bulletsEn: [
        'Prevention of cash leakage and receipt voids.',
        'Lightning-fast checkouts during rush hours.',
        'Fully compliant simplified invoices & payment options.'
      ]
    },
    {
      id: 'inventory',
      icon: '📦',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      titleEn: 'Inventory Control',
      titleAr: 'إدارة المخزون',
      descEn: 'Real-time stock tracking, low-stock alerts, category management, and multi-branch transfers.',
      descAr: 'تتبع المخزون الفوري، تنبيهات المخزون المنخفض، وتحويلات الفروع المتعددة.',
      profitAr: 'يمنع تجميد رأس المال في سلع راكدة من خلال تحليلات معدل الدوران الذكية. يرسل تنبيهات فورية قبل نفاد السلع الأكثر مبيعاً لتفادي ضياع المبيعات وفرص البيع المباشر.',
      profitEn: 'Prevents locking capital in dead stock via inventory turnover analytics. Dispatches automated low-stock warnings for high-velocity items to avoid missed sales opportunities.',
      bulletsAr: [
        'تتبع لحظي دقيق ومراقبة حية للمخازن والكميات.',
        'تنبيهات ذكية قبل نفاد الكميات الهامة والسلع.',
        'تقليل الفاقد وتحديد المنتجات الأعلى ربحية لتوفير النفقات.'
      ],
      bulletsEn: [
        'Accurate real-time stock and batch tracking.',
        'Smart alerts before top-selling items run out.',
        'Minimize wastage and focus on high-margin items.'
      ]
    },
    {
      id: 'hr',
      icon: '👥',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      titleEn: 'HR & Staff Payroll',
      titleAr: 'الموارد البشرية والرواتب',
      descEn: 'Employee management, attendance tracking, automated payroll processing and salary disbursements.',
      descAr: 'إدارة الموظفين، تتبع الحضور، معالجة الرواتب تلقائياً وصرف المستحقات.',
      profitAr: 'يرفع إنتاجية الموظفين عبر نظام تتبع الأداء والعمولات التلقائية للمبيعات. يقلل من وقت معالجة الرواتب السنوية والشهرية والأخطاء الحسابية بنسبة 90%، مما يوفر ساعات العمل المحاسبي الثمينة.',
      profitEn: 'Boosts staff productivity through integrated performance metrics and automated sales commission tracking. Slashes payroll processing time and accounting errors by 90%, freeing valuable management hours.',
      bulletsAr: [
        'حساب تلقائي دقيق لعمولات المبيعات والمكافآت.',
        'مراقبة الحضور والانصراف والورديات بكل سهولة.',
        'تقارير إنتاجية الموظفين لتكريم المتميزين وزيادة الولاء.'
      ],
      bulletsEn: [
        'Automated sales commission & bonuses processing.',
        'Seamless clock-in/out and shift tracking.',
        'Actionable performance logs to reward high-performers.'
      ]
    },
    {
      id: 'reports',
      icon: '📊',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      titleEn: 'Advanced Analytics',
      titleAr: 'تقارير وتحليلات متقدمة',
      descEn: 'Profit & loss reports, shift summaries, treasury dashboards, and exportable financial statements.',
      descAr: 'تقارير الأرباح والخسائر، ملخصات الورديات، لوحة الخزينة والتقارير المالية.',
      profitAr: 'يوفر رؤية شاملة لحظية للأرباح والخسائر وهامش الربح الحقيقي لكل منتج. يساعدك على اتخاذ قرارات تسعير ذكية لزيادة متوسط قيمة الفاتورة بنسبة تصل إلى 25%.',
      profitEn: 'Delivers crystal-clear visibility into real-time profits, losses, and actual profit margins. Empowers smarter pricing decisions that elevate average basket value by up to 25%.',
      bulletsAr: [
        'تقارير لحظية للأرباح والخسائر وحركة الخزينة.',
        'تحليلات متقدمة لسلوك العملاء ومعدلات المبيعات.',
        'تصدير التقارير المالية والضريبية بضغطة زر واحدة.'
      ],
      bulletsEn: [
        'Real-time P&L logs and cash flow tracking.',
        'Behavior analysis of buyers and purchasing cycles.',
        'One-click export for tax and compliance documentation.'
      ]
    },
    {
      id: 'branches',
      icon: '🏢',
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      titleEn: 'Multi-Branch Network',
      titleAr: 'شبكة الفروع المتعددة',
      descEn: 'Centralize control across multiple retail branches with cloud synchronization and branch-level analytics.',
      descAr: 'تحكم مركزي عبر فروع متعددة مع مزامنة سحابية وتحليلات على مستوى كل فرع.',
      profitAr: 'يمنع تكدس البضائع في فرع ونفادها في آخر عبر نظام التحويل السريع المعتمد ثنائي الأطراف. يضمن سيادة موحدة للأسعار والبيانات والسياسات من لوحة تحكم واحدة.',
      profitEn: 'Prevents stockouts in one branch while another is overstocked via a secure two-step stock transfer. Standardizes pricing, inventory, and configurations globally from a single portal.',
      bulletsAr: [
        'تحويل ذكي وسريع للبضائع بين الفروع لمنع الهدر والركود.',
        'إدارة شاملة ومراقبة مبيعات كل الفروع لحظياً عن بُعد.',
        'حماية كاملة وصلاحيات معزولة للموظفين بكل فرع.'
      ],
      bulletsEn: [
        'Smart stock transfer workflow to optimize regional levels.',
        'Unified dashboard to monitor sales per location.',
        'Restricted, tenant-safe branch access for local staff.'
      ]
    },
    {
      id: 'cloud',
      icon: '☁️',
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
      titleEn: 'Cloud-First Architecture',
      titleAr: 'بنية سحابية أولاً',
      descEn: 'Offline-capable with full cloud sync. Your data is always safe, always accessible, always in sync.',
      descAr: 'يعمل بدون إنترنت مع مزامنة سحابية كاملة. بياناتك دائماً آمنة ومتاحة.',
      profitAr: 'يضمن استمرارية البيع حتى عند انقطاع الإنترنت بنسبة 100%، مما يحمي مبيعاتك اليومية من الضياع. يقوم بمزامنة تلقائية صامتة بمجرد عودة الاتصال دون تدخل بشري.',
      profitEn: 'Guarantees 100% checkout uptime even during network blackouts, protecting your daily revenue. Auto-synchronizes local transactions to the cloud once connectivity resumes.',
      bulletsAr: [
        'عمل مستقر أوفلاين دون الحاجة لاتصال مستمر بالشبكة.',
        'مزامنة سحابية آمنة ومشفرة للبيانات تلقائياً خلف الكواليس.',
        'حماية تامة ضد ضياع البيانات وفقدان الفواتير والأخطاء.'
      ],
      bulletsEn: [
        'Stable offline operation without constant web dependency.',
        'Secure, fully encrypted automated cloud updates.',
        'Bulletproof safety against local hardware damage or loss.'
      ]
    },
  ];

  return (
    <div
      className="enterprise-ui min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] overflow-x-hidden"
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
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
          box-shadow: 0 12px 32px rgba(30,64,175,0.15) !important;
        }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[var(--bg-card)] border-b border-[var(--border-color)]" style={{ boxShadow: theme === 'dark' ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 6px rgba(0,0,0,0.06)', transition: 'background-color 0.2s, border-color 0.2s' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1e40af] rounded-lg flex items-center justify-center text-white text-lg">🚀</div>
            <div>
              <span className="font-black text-[var(--text-primary)] text-base tracking-tight">StorePilot </span>
              <span className="font-black text-[#1e40af] text-base tracking-tight">PRO</span>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="px-3 py-2 text-[var(--text-secondary)] hover:text-[#1e40af] font-bold text-sm rounded-lg hover:bg-[var(--accent-blue-light)] transition-all bg-transparent"
              title={isRtl ? (theme === 'dark' ? 'الوضع المضيء' : 'الوضع المظلم') : (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-4 py-2 text-[var(--text-secondary)] hover:text-[#1e40af] font-bold text-sm rounded-lg hover:bg-[var(--accent-blue-light)] transition-all bg-transparent"
            >
              {isRtl ? 'EN' : 'عربي'}
            </button>

            {/* Login */}
            <button
              onClick={onLogin}
              className="px-5 py-2 border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#1e40af] hover:text-[#1e40af] font-bold text-sm rounded-lg transition-all bg-transparent"
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
      <section className="relative overflow-hidden py-24 px-6" style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #0B0F19 0%, #151d30 50%, #0B0F19 100%)' : 'linear-gradient(135deg, #f0f7ff 0%, #f8fafc 50%, #f5f3ff 100%)', transition: 'background 0.2s' }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #1e40af, transparent)', transform: 'translate(40%, -40%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #eab308, transparent)', transform: 'translate(-30%, 30%)' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-blue-light)] border border-[var(--border-color)] rounded-full text-[#3b82f6] dark:text-[#60a5fa] text-xs font-black uppercase tracking-widest mb-8 landing-fade" style={{ animation: 'badgePulse 3s ease-in-out infinite' }}>
            <span className="w-2 h-2 bg-[#3b82f6] rounded-full animate-pulse" />
            {isRtl ? 'نظام ERP متكامل للشركات والمحلات' : 'Enterprise ERP — Retail & Commerce'}
          </div>

          {/* Main Heading */}
          <h1 className="landing-fade landing-fade-d1 font-black text-[var(--text-primary)] leading-tight mb-6"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.15 }}>
            {isRtl ? (
              <>
                <span>StorePilot PRO</span>
                <br />
                <span className="text-[#1e40af] dark:text-[#3b82f6]">نظام ERP متكامل</span>
                <br />
                <span style={{ fontSize: '0.6em', fontWeight: 700, color: 'var(--text-secondary)' }}>لإدارة مبيعاتك، مخزونك، وفريقك في مكان واحد</span>
              </>
            ) : (
              <>
                <span>StorePilot </span>
                <span className="text-[#1e40af] dark:text-[#3b82f6]">PRO</span>
                <br />
                <span>The Complete </span>
                <span className="text-[#1e40af] dark:text-[#3b82f6]">Retail ERP</span>
                <br />
                <span style={{ fontSize: '0.55em', fontWeight: 600, color: 'var(--text-secondary)' }}>Sales · Inventory · HR · Multi-Branch · Cloud Sync</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="landing-fade landing-fade-d2 text-[var(--text-secondary)] font-medium mb-10 max-w-2xl mx-auto"
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
              🚀 {isRtl ? 'ابدأ التجربة المجانية 14 يوم' : 'Start 14-Day Free Trial'}
            </button>
            <button
              onClick={onLogin}
              className="px-8 py-4 rounded-xl border-2 border-[#1e40af] dark:border-[#3b82f6] text-[#1e40af] dark:text-[#3b82f6] font-black text-base hover:bg-[var(--accent-blue-light)] transition-all w-full sm:w-auto bg-transparent"
              style={{ minWidth: 180 }}
            >
              {isRtl ? 'لدي حساب — دخول' : 'I Have an Account'}
            </button>
          </div>

          {/* Social Proof strip */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 opacity-60">
            {['⭐ 4.9/5 Rating', '🏪 500+ Stores', '🔒 SSL Secured', '☁️ 99.9% Uptime'].map(badge => (
              <span key={badge} className="text-[var(--text-secondary)] font-bold text-sm">{badge}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[var(--bg-card)]" style={{ transition: 'background-color 0.2s' }}>
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-blue-light)] border border-[var(--border-color)] rounded-full text-[#1e40af] dark:text-[#60a5fa] text-xs font-black uppercase tracking-widest mb-4">
              {isRtl ? 'الميزات الرئيسية' : 'Core Features'}
            </div>
            <h2 className="font-black text-[var(--text-primary)] text-3xl mb-4">
              {isRtl ? 'كل ما تحتاجه لإدارة تجارتك' : 'Everything You Need to Run Your Business'}
            </h2>
            <p className="text-[var(--text-secondary)] font-medium max-w-xl mx-auto" style={{ lineHeight: 1.7 }}>
              {isRtl
                ? 'أدوات متكاملة مصممة للتجار المحترفين والمتاجر الحديثة. اضغط على أي ميزة لمعرفة كيف تزيد من أرباح متجرك.'
                : 'Integrated tools designed for professional retailers and modern commerce. Click any feature to explore how it boosts store profit.'}
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.id}
                className="feature-card e-card p-8 cursor-pointer select-none"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  borderTop: `3px solid ${f.color}`,
                  boxShadow: hoveredFeature === f.id
                    ? `0 12px 32px rgba(30,64,175,0.15)`
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s, border-color 0.2s'
                }}
                onMouseEnter={() => setHoveredFeature(f.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => setSelectedFeature(f)}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <h3 className="font-black text-[var(--text-primary)] text-lg mb-3">
                  {isRtl ? f.titleAr : f.titleEn}
                </h3>
                <p className="text-[var(--text-secondary)] font-medium text-sm leading-relaxed mb-4">
                  {isRtl ? f.descAr : f.descEn}
                </p>
                <div className="mt-auto flex items-center gap-2 font-bold text-sm" style={{ color: f.color }}>
                  {isRtl ? 'معرفة المزيد ←' : 'Learn more →'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[var(--bg-deep)]" style={{ transition: 'background-color 0.2s' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-black text-[var(--text-primary)] text-3xl mb-3">
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
                <div className="w-16 h-16 rounded-2xl bg-[var(--accent-blue-light)] border border-[var(--border-color)] flex items-center justify-center text-3xl mx-auto mb-4">{s.icon}</div>
                <div className="text-[#1e40af] dark:text-[#3b82f6] font-black text-xs tracking-widest uppercase mb-2">Step {s.step}</div>
                <p className="text-[var(--text-secondary)] font-medium text-sm leading-relaxed">{isRtl ? s.ar : s.en}</p>
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
              ? 'ابدأ فترة تجريبية مجانية لمدة 14 يوم. لا توجد رسوم مخفية، لا حاجة لبطاقة.'
              : 'Start your 14-day free trial today. No hidden fees, no credit card required.'}
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 rounded-xl font-black text-base text-[#1e40af] bg-white hover:bg-blue-50 transition-all border-none cursor-pointer"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
          >
            🚀 {isRtl ? 'ابدأ الآن مجاناً' : 'Start Free — No Card Needed'}
          </button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="bg-[var(--bg-card)] border-t border-[var(--border-color)] py-10 px-6" style={{ transition: 'background-color 0.2s, border-color 0.2s' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1e40af] rounded-lg flex items-center justify-center text-white text-sm">🚀</div>
              <div>
                <span className="font-black text-[var(--text-primary)]">StorePilot </span>
                <span className="font-black text-[#1e40af]">PRO</span>
                <span className="text-[var(--text-muted)] font-medium text-sm mx-2">·</span>
                <span className="text-[var(--text-secondary)] font-medium text-sm">www.storepilot.pro</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)] font-medium">
              <span>{isRtl ? 'الخصوصية' : 'Privacy'}</span>
              <span>{isRtl ? 'الشروط' : 'Terms'}</span>
              <span>{isRtl ? 'الدعم الفني' : 'Support'}</span>
            </div>

            {/* Copyright */}
            <p className="text-[var(--text-muted)] text-sm font-medium">
              © 2026 StorePilot PRO. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>

      {/* ── INTERACTIVE FEATURE EXPLAINER MODAL ────────────────── */}
      {selectedFeature && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedFeature(null)}
        >
          <div 
            className="relative w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-8 space-y-6 animate-[scaleUp_0.2s_ease-out]"
            style={{ borderRadius: 20, transition: 'background-color 0.2s, border-color 0.2s' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedFeature(null)} 
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-deep)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors cursor-pointer outline-none"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: selectedFeature.bg }}
              >
                {selectedFeature.icon}
              </div>
              <div>
                <span className="text-[9px] font-black tracking-widest text-[#1e40af] dark:text-[#3b82f6] uppercase">
                  {isRtl ? '✦ دراسة العائد على الاستثمار (ROI) ✦' : '✦ Strategic ROI Insight ✦'}
                </span>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mt-0.5">
                  {isRtl ? selectedFeature.titleAr : selectedFeature.titleEn}
                </h3>
              </div>
            </div>

            {/* Profit Explainer */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[2px]">
                {isRtl ? 'كيف يضاعف هذا النظام أرباحك الفورية؟' : 'How does this maximize profits and ROI?'}
              </h4>
              <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed bg-[var(--bg-deep)] p-5 border border-[var(--border-color)] rounded-xl" style={{ margin: 0 }}>
                {isRtl ? selectedFeature.profitAr : selectedFeature.profitEn}
              </p>
            </div>

            {/* Key Benefits Bullet Points */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[2px]">
                {isRtl ? 'المزايا الإستراتيجية للأرباح' : 'Strategic Profit Advantages'}
              </h4>
              <ul className="space-y-2.5 p-0" style={{ margin: 0, listStyle: 'none' }}>
                {(isRtl ? selectedFeature.bulletsAr : selectedFeature.bulletsEn).map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm font-semibold text-[var(--text-primary)]">
                    <span className="text-emerald-500 text-base flex-shrink-0">✓</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA action inside modal */}
            <div className="pt-2 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedFeature(null)} 
                className="px-5 py-3 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs rounded-xl transition-all bg-transparent cursor-pointer"
              >
                {isRtl ? 'إغلاق نافذة التفاصيل' : 'Close Details'}
              </button>
              <button 
                onClick={() => { setSelectedFeature(null); onGetStarted(); }} 
                className="e-btn-primary px-6 py-3 rounded-xl text-xs font-black"
              >
                {isRtl ? 'ابدأ الآن مجاناً' : 'Get Started Free'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
