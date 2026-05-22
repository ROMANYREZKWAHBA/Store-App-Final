import React, { useState } from 'react';

export default function SubscriptionSelectionScreen({ onSelectPlan, onLogout, language }) {
  const isRtl = language === 'ar';
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentUnavailableModal, setShowPaymentUnavailableModal] = useState(false);

  /**
   * Trial → 2s processing → activates.
   * Paid plans → 2s processing → "payment unavailable" modal (no status change).
   */
  const handleSelectSubscriptionPlan = (planType) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (planType === 'trial') {
        onSelectPlan(planType);
      } else {
        setShowPaymentUnavailableModal(true);
      }
    }, 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout();
    window.location.reload();
  };

  return (
    <div
      className="enterprise-ui min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #f0f7ff 0%, #f8fafc 60%, #f5f3ff 100%)',
        fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif",
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Processing Overlay ────────────────────────────────── */}
      {isProcessing && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[99999]"
          style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="flex flex-col items-center gap-6 p-10 rounded-2xl"
            style={{ background: '#fff', boxShadow: '0 24px 64px rgba(30,64,175,0.18)', minWidth: 280 }}
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full" style={{ border: '3px solid #e0e7ff' }} />
              <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '3px solid transparent', borderTopColor: '#1e40af' }} />
              <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: '#eff6ff' }}>
                <span className="text-lg">💳</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-black text-[#1e293b] text-sm tracking-wide">
                {isRtl ? 'جاري معالجة الطلب...' : 'Processing Request...'}
              </p>
              <p className="font-medium text-[#94a3b8] text-xs">
                {isRtl ? 'يرجى عدم إغلاق هذه الصفحة' : 'Please do not close this window'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Unavailable Modal ─────────────────────────── */}
      {showPaymentUnavailableModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[99998] p-6"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div
            className="w-full max-w-md rounded-2xl p-8 flex flex-col gap-5"
            style={{
              background: '#fff',
              boxShadow: '0 24px 64px rgba(30,64,175,0.15)',
              borderTop: '4px solid #eab308',
            }}
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: '#fef9c3' }}>
                ⚙️
              </div>
            </div>
            {/* Badge */}
            <div className="flex justify-center">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                style={{ background: '#fef9c3', color: '#b45309', border: '1px solid #fde68a' }}
              >
                {isRtl ? 'بوابة الدفع قيد التهيئة' : 'Payment Gateway — Setup in Progress'}
              </span>
            </div>
            {/* Text */}
            <div className="text-center space-y-2">
              <h3 className="font-black text-[#1e293b] text-lg">
                {isRtl ? 'بوابة الدفع الإلكتروني غير متاحة حالياً' : 'Electronic Payment Not Yet Available'}
              </h3>
              <p className="text-[#64748b] text-sm font-medium leading-relaxed">
                {isRtl
                  ? 'بوابات الدفع الإلكتروني قيد التهيئة حالياً. يرجى التواصل مع الإدارة لتفعيل الاشتراك المدفوع.'
                  : 'Electronic payment gateways are currently being configured. Please contact the administration to activate your paid subscription.'}
              </p>
            </div>
            <div className="border-t border-[#e2e8f0] pt-4 flex flex-col gap-3">
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                {isRtl ? 'للتواصل مع الإدارة' : 'Contact Administration'}
              </p>
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
                style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
              >
                <span>💬</span>
                {isRtl ? 'تواصل عبر الواتساب' : 'WhatsApp Support'}
              </a>
              <button
                onClick={() => setShowPaymentUnavailableModal(false)}
                className="py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
              >
                {isRtl ? '← العودة إلى اختيار الخطة' : '← Back to Plan Selection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="w-full max-w-5xl space-y-12">
        <style>{`
          @keyframes planFadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .plan-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
          .plan-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(30,64,175,0.12) !important; }
          .plan-card { animation: planFadeUp 0.5s ease-out both; }
        `}</style>

        {/* Header */}
        <div className="text-center space-y-4">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
          >
            ⚡ {isRtl ? 'بوابة تفعيل الاشتراك' : 'STOREPILOT ONBOARDING GATE'}
          </span>
          <h2 className="font-black text-[#1e293b]" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)' }}>
            {isRtl ? 'اختر خطة الاشتراك لمتجرك' : 'Choose Your StorePilot Plan'}
          </h2>
          <p className="text-[#64748b] font-medium max-w-xl mx-auto text-sm leading-relaxed">
            {isRtl
              ? 'اختر الخطة التي تناسب احتياجاتك للوصول الفوري إلى لوحة التحكم ونقطة البيع.'
              : 'Select a plan below to activate your retail workstation and gain instant access to dashboard & POS.'}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── Trial Card ── */}
          <div
            className="plan-card bg-white flex flex-col justify-between relative"
            style={{
              borderRadius: 16,
              border: '2px solid #1e40af',
              boxShadow: '0 4px 20px rgba(30,64,175,0.10)',
              padding: '2rem',
              animationDelay: '0s',
            }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 font-black text-[9px] uppercase tracking-widest rounded-full"
              style={{ background: '#1e40af', color: '#fff' }}
            >
              {isRtl ? 'الأكثر طلباً' : 'RECOMMENDED'}
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="font-black text-[#1e293b] text-lg uppercase tracking-wide">
                  {isRtl ? 'فترة تجريبية 7 أيام' : '7-Day Free Trial'}
                </h3>
                <p className="text-[#64748b] text-xs font-medium mt-1">
                  {isRtl ? 'تجربة آمنة بكامل الصلاحيات، لا تطلب بطاقة ائتمان' : 'Full access, no credit card required.'}
                </p>
              </div>
              <div className="py-5 border-t border-b border-[#e2e8f0] text-center">
                <span className="font-black text-[#1e293b]" style={{ fontSize: 48 }}>0</span>
                <span className="text-[#94a3b8] font-bold text-sm ml-1">{isRtl ? 'ج.م' : 'EGP'}</span>
              </div>
              <ul className="space-y-3 text-xs font-semibold text-[#475569]">
                {[
                  isRtl ? 'إدارة المبيعات والمخازن بالكامل' : 'Full Sales & Inventory Management',
                  isRtl ? 'مزامنة سحابية متكاملة' : 'Real-time Cloud Sync',
                  isRtl ? 'تقارير الأرباح والورديات' : 'Shift & Profit Analytics',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: '#eff6ff', color: '#1e40af' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleSelectSubscriptionPlan('trial')}
              className="w-full mt-6 py-4 font-black text-sm uppercase tracking-widest rounded-xl transition-all"
              style={{ background: '#1e40af', color: '#fff', boxShadow: '0 4px 16px rgba(30,64,175,0.25)' }}
            >
              🚀 {isRtl ? 'بدء التجربة المجانية' : 'Start Free Trial'}
            </button>
          </div>

          {/* ── Monthly Card ── */}
          <div
            className="plan-card bg-white flex flex-col justify-between relative"
            style={{
              borderRadius: 16,
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              padding: '2rem',
              animationDelay: '0.08s',
            }}
          >
            <div
              className="absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"
              style={{ background: '#fef9c3', color: '#b45309', border: '1px solid #fde68a' }}
            >
              ⚙️ {isRtl ? 'قريباً' : 'Setup Soon'}
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="font-black text-[#1e293b] text-lg uppercase tracking-wide">
                  {isRtl ? 'الاشتراك الشهري' : 'Monthly Premium'}
                </h3>
                <p className="text-[#64748b] text-xs font-medium mt-1">
                  {isRtl ? 'تجديد شهري مرن، مثالي للمتاجر النشطة' : 'Flexible monthly renewal for operational continuity.'}
                </p>
              </div>
              <div className="py-5 border-t border-b border-[#e2e8f0] text-center">
                <span className="font-black text-[#1e293b]" style={{ fontSize: 48 }}>499</span>
                <span className="text-[#94a3b8] font-bold text-sm ml-1">{isRtl ? 'ج.م / شهرياً' : 'EGP / mo'}</span>
              </div>
              <ul className="space-y-3 text-xs font-semibold text-[#475569]">
                {[
                  isRtl ? 'إدارة الفروع المتعددة' : 'Multi-Branch Support',
                  isRtl ? 'تخصيص الشعارات والطباعة' : 'Custom Branding & Printing',
                  isRtl ? 'دعم فني عبر الواتساب' : 'WhatsApp Technical Support',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: '#eff6ff', color: '#1e40af' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleSelectSubscriptionPlan('monthly')}
              className="w-full mt-6 py-4 font-black text-sm uppercase tracking-widest rounded-xl transition-all"
              style={{ background: '#1e40af', color: '#fff', boxShadow: '0 4px 16px rgba(30,64,175,0.2)' }}
            >
              💳 {isRtl ? 'اشتراك شهري' : 'Select Monthly'}
            </button>
          </div>

          {/* ── Yearly Card ── */}
          <div
            className="plan-card bg-white flex flex-col justify-between relative overflow-hidden"
            style={{
              borderRadius: 16,
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              padding: '2rem',
              animationDelay: '0.16s',
            }}
          >
            <div
              className="absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-black uppercase"
              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
            >
              SAVE 33%
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="font-black text-[#1e293b] text-lg uppercase tracking-wide">
                  {isRtl ? 'الاشتراك السنوي' : 'Yearly Plan'}
                </h3>
                <p className="text-[#64748b] text-xs font-medium mt-1">
                  {isRtl ? 'أفضل قيمة للمتاجر الجادة' : 'Best value for serious retailers.'}
                </p>
              </div>
              <div className="py-5 border-t border-b border-[#e2e8f0] text-center">
                <span className="font-black text-[#1e293b]" style={{ fontSize: 48 }}>3,999</span>
                <span className="text-[#94a3b8] font-bold text-sm ml-1">{isRtl ? 'ج.م / سنوياً' : 'EGP / yr'}</span>
              </div>
              <ul className="space-y-3 text-xs font-semibold text-[#475569]">
                {[
                  isRtl ? 'جميع مميزات الباقة الشهرية' : 'All Monthly Features',
                  isRtl ? 'دعم فني مخصص 24/7' : 'Priority 24/7 VIP Support',
                  isRtl ? 'ترقيات النظام مجاناً' : 'Free Lifetime Feature Upgrades',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: '#eff6ff', color: '#1e40af' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleSelectSubscriptionPlan('yearly')}
              className="w-full mt-6 py-4 font-black text-sm uppercase tracking-widest rounded-xl transition-all"
              style={{ background: '#0f172a', color: '#fff' }}
            >
              ⭐ {isRtl ? 'اشتراك سنوي' : 'Select Yearly'}
            </button>
          </div>

        </div>

        {/* Logout */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="text-xs font-bold uppercase tracking-widest transition-all"
            style={{ color: '#ef4444' }}
          >
            {isRtl ? '✕ تسجيل الخروج والعودة' : '✕ Logout and Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
