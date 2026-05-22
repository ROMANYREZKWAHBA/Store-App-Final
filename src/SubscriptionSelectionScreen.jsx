import React from 'react';

export default function SubscriptionSelectionScreen({ onSelectPlan, onLogout, language }) {
  const isRtl = language === 'ar';

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) {
      onLogout();
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 p-6 transition-colors duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-5xl space-y-12 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Style definitions for transitions and animations */}
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
              onClick={() => onSelectPlan('trial')}
              className="w-full mt-8 py-4 bg-[#D4AF37] hover:bg-[#e6c44a] text-black font-black text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg shadow-[#D4AF37]/20"
            >
              🚀 {isRtl ? 'بدء التجربة المجانية' : 'Start Free Trial'}
            </button>
          </div>

          {/* Card 2: Monthly Premium (499 EGP) */}
          <div className="pricing-card bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-2xl flex flex-col justify-between shadow-xl">
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
              onClick={() => onSelectPlan('monthly')}
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
                  <span className="text-[#0066FF]">✓</span> {isRtl ? 'دعم فني فوري مخصص ٢٤/٧' : 'Priority 24/7 VIP Support'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#0066FF]">✓</span> {isRtl ? 'مستقبل ترقيات الأنظمة مجاناً' : 'Free Lifetime Feature Upgrades'}
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('yearly')}
              className="w-full mt-8 py-4 bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-widest transition-all rounded-xl"
            >
              ⭐ {isRtl ? 'اشتراك سنوي (أفضل قيمة)' : 'Select Yearly'}
            </button>
          </div>

        </div>

        {/* Bottom Actions */}
        <button
          onClick={handleLogout}
          className="text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors pt-4 block mx-auto font-bold"
        >
          {isRtl ? '✕ تسجيل الخروج والعودة' : '✕ Logout and Return'}
        </button>

      </div>
    </div>
  );
}
