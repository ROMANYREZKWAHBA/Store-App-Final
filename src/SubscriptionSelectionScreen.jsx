import React, { useState } from 'react';

export default function SubscriptionSelectionScreen({ onSelectPlan, onLogout, language }) {
  const isRtl = language === 'ar';
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentUnavailableModal, setShowPaymentUnavailableModal] = useState(false);

  /**
   * Trial plan → 2 s processing overlay → activate immediately.
   * Paid plans → 2 s processing overlay → show "payment gateway unavailable" modal.
   *             Status is NOT changed; user remains on this screen.
   */
  const handleSelectSubscriptionPlan = (planType) => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      if (planType === 'trial') {
        // Free trial: proceed with activation
        onSelectPlan(planType);
      } else {
        // Paid plan: gateway not configured — show information modal
        setShowPaymentUnavailableModal(true);
      }
    }, 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) {
      onLogout();
    }
    window.location.reload();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 p-6 transition-colors duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ─── Processing Overlay ────────────────────────────────────────────── */}
      {isProcessing && (
        <div className="fixed inset-0 bg-[#0a0a0c]/80 backdrop-blur-md flex items-center justify-center z-[99999] animate-[fadeIn_0.2s_ease-out]">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-[#D4AF37]/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-[#D4AF37] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full animate-pulse flex items-center justify-center">
                <span className="text-xl">💳</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#D4AF37] animate-pulse">
                {isRtl ? 'جاري معالجة الطلب...' : 'Processing Request...'}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {isRtl ? 'يرجى عدم إغلاق هذه الصفحة' : 'Please do not close this window'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Payment Unavailable Modal ──────────────────────────────────────── */}
      {showPaymentUnavailableModal && (
        <div className="fixed inset-0 bg-[#0a0a0c]/85 backdrop-blur-md flex items-center justify-center z-[99998] animate-[fadeIn_0.25s_ease-out] p-6">
          <div
            className="w-full max-w-md bg-[#111114] border border-[#D4AF37]/30 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl shadow-[#D4AF37]/5"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                <span className="text-3xl">⚙️</span>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black tracking-widest text-amber-400 uppercase">
                {isRtl ? 'الدفع الإلكتروني قيد التهيئة' : 'E-PAYMENT GATEWAY — SETUP IN PROGRESS'}
              </div>
              <h2 className="text-lg font-black text-white leading-snug">
                {isRtl
                  ? 'بوابة الدفع الإلكتروني قيد التهيئة حالياً'
                  : 'Payment Gateway Under Configuration'}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                {isRtl
                  ? 'بوابات الدفع الإلكتروني قيد التهيئة حالياً. يرجى التواصل مع الإدارة لتفعيل الاشتراك المدفوع.'
                  : 'Electronic payment gateways are currently being configured. Please contact the administration to activate your paid subscription.'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-800/60" />

            {/* Contact info */}
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {isRtl ? 'للتواصل مع الإدارة' : 'Contact Administration'}
              </p>
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#25D366]/20 transition-all"
              >
                <span>💬</span>
                {isRtl ? 'تواصل عبر الواتساب' : 'WhatsApp Support'}
              </a>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowPaymentUnavailableModal(false)}
              className="w-full py-3 bg-transparent border border-zinc-700 hover:border-[#D4AF37]/50 text-zinc-400 hover:text-[#D4AF37] font-black text-[10px] uppercase tracking-widest transition-all rounded-xl"
            >
              {isRtl ? '← العودة إلى اختيار الخطة' : '← Back to Plan Selection'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <div className="w-full max-w-5xl space-y-12 animate-[fadeIn_0.5s_ease-out]">

        {/* Style definitions */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .pricing-card {
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .pricing-card:hover {
            transform: translateY(-8px);
          }
        `}} />

        {/* Top Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-full text-xs font-black tracking-widest text-[#D4AF37] uppercase">
            ⚡ STOREPILOT ONBOARDING GATE
          </div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {isRtl ? 'اختر خطة الاشتراك لمتجرك' : 'Choose Your StorePilot Plan'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xl mx-auto font-medium">
            {isRtl
              ? 'يرجى اختيار إحدى الخطط أدناه لتفعيل صلاحية المتجر والولوج فوراً إلى لوحة التحكم ونقاط البيع.'
              : 'Select a plan below to activate your retail workstation and gain instant access to dashboard & POS operations.'}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1: 7-Day Trial (Highlighted Primary) */}
          <div className="pricing-card bg-white dark:bg-[#151518] border-2 border-[#D4AF37] p-8 rounded-2xl flex flex-col justify-between relative shadow-xl shadow-[#D4AF37]/5">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4AF37] text-black font-black text-[9px] uppercase tracking-widest rounded-full">
              {isRtl ? 'الفترة الموصى بها' : 'RECOMMENDED'}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {isRtl ? 'فترة تجريبية 7 أيام' : '7-Day Free Trial'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isRtl ? 'تجربة آمنة بكامل الصلاحيات، لا تطلب بطاقة ائتمان' : 'Full system access to verify compatibility. No card required.'}
                </p>
              </div>

              <div className="py-6 border-t border-b border-zinc-200/50 dark:border-zinc-800/60 text-center">
                <span className="text-5xl font-black text-slate-900 dark:text-white">0</span>
                <span className="text-sm font-bold text-slate-400 ml-1">{isRtl ? 'ج.م' : 'EGP'}</span>
              </div>

              <ul className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-[#D4AF37]">✓</span> {isRtl ? 'إدارة المبيعات والمخازن بالكامل' : 'Full Sales & Inventory Management'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#D4AF37]">✓</span> {isRtl ? 'مزامنة سحابية متكاملة للفرع' : 'Real-time Branch Synchronization'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#D4AF37]">✓</span> {isRtl ? 'تقارير الأرباح والورديات' : 'Shift Ledger & Profit Analytics'}
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectSubscriptionPlan('trial')}
              className="w-full mt-8 py-4 bg-[#D4AF37] hover:bg-[#e6c44a] text-black font-black text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg shadow-[#D4AF37]/20"
            >
              🚀 {isRtl ? 'بدء التجربة المجانية' : 'Start Free Trial'}
            </button>
          </div>

          {/* Card 2: Monthly Premium (499 EGP) */}
          <div className="pricing-card bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-2xl flex flex-col justify-between shadow-xl relative">
            {/* "Payment setup" badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-[8px] font-black uppercase tracking-widest">
              ⚙️ {isRtl ? 'قيد التهيئة' : 'Setup Soon'}
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {isRtl ? 'الاشتراك الشهري المميز' : 'Monthly Premium'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isRtl ? 'تجديد شهري مرن، مثالي للمتاجر النشطة' : 'Flexible monthly renewal for operational continuity.'}
                </p>
              </div>

              <div className="py-6 border-t border-b border-zinc-200/50 dark:border-zinc-800/60 text-center">
                <span className="text-5xl font-black text-slate-900 dark:text-white">499</span>
                <span className="text-sm font-bold text-slate-400 ml-1">{isRtl ? 'ج.م / شهرياً' : 'EGP / mo'}</span>
              </div>

              <ul className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-[#0066FF]">✓</span> {isRtl ? 'إدارة الفروع المتعددة' : 'Multi-Branch Support'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0066FF]">✓</span> {isRtl ? 'تخصيص كامل للشعارات والطباعة' : 'Custom Branding & Logo Printing'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0066FF]">✓</span> {isRtl ? 'دعم فني عبر الواتساب' : 'WhatsApp Support Access'}
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectSubscriptionPlan('monthly')}
              className="w-full mt-8 py-4 bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg shadow-[#0066FF]/20"
            >
              💳 {isRtl ? 'اشتراك شهري' : 'Select Monthly'}
            </button>
          </div>

          {/* Card 3: Yearly Plan (Best Value - 3999 EGP) */}
          <div className="pricing-card bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-2.5 right-2.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20">
              {isRtl ? 'توفير ٣٣٪' : 'SAVE 33%'}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {isRtl ? 'الاشتراك السنوي المميز' : 'Yearly Plan'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isRtl ? 'حزمة التوفير الكبرى، قيمة استثنائية' : 'Our most cost-effective package for serious retailers.'}
                </p>
              </div>

              <div className="py-6 border-t border-b border-zinc-200/50 dark:border-zinc-800/60 text-center">
                <span className="text-5xl font-black text-slate-900 dark:text-white">3,999</span>
                <span className="text-sm font-bold text-slate-400 ml-1">{isRtl ? 'ج.م / سنوياً' : 'EGP / yr'}</span>
              </div>

              <ul className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-[#0066FF]">✓</span> {isRtl ? 'جميع مميزات الباقة الشهرية' : 'All Monthly Premium Features'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0066FF]">✓</span> {isRtl ? 'دعم فني فورى مخصص ٢٤/٧' : 'Priority 24/7 VIP Support'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0066FF]">✓</span> {isRtl ? 'مستقبل ترقيات الأنظمة مجاناً' : 'Free Lifetime Feature Upgrades'}
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectSubscriptionPlan('yearly')}
              className="w-full mt-8 py-4 bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-widest transition-all rounded-xl"
            >
              ⭐ {isRtl ? 'اشتراك سنوي (أفضل قيمة)' : 'Select Yearly'}
            </button>
          </div>

        </div>

        {/* Bottom Actions */}
        <button
          onClick={handleLogout}
          className="text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors pt-4 block mx-auto"
        >
          {isRtl ? '✕ تسجيل الخروج والعودة' : '✕ Logout and Return'}
        </button>

      </div>
    </div>
  );
}
