import React, { useState } from 'react';

export default function SubscriptionUpgrade({ onSubscribe, onLogout, language, currentUser }) {
  const isRtl = language === 'ar';
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState('');

  const handleSubscribeClick = async () => {
    setError('');
    const code = activationCode.trim();
    if (!code) {
      setError(isRtl ? 'يرجى إدخال كود التفعيل' : 'Please enter activation code');
      return;
    }
    
    const success = await onSubscribe(code);
    if (!success) {
      setError(isRtl ? 'كود التفعيل غير صالح (صيغة ACT-XXXXXX)' : 'Invalid Activation Code (format: ACT-XXXXXX)');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 p-6 transition-colors duration-200">
      <div className="w-full max-w-md border border-zinc-200 dark:border-[#D4AF37]/20 bg-slate-50 dark:bg-[#151518] p-8 shadow-2xl space-y-8 text-center animate-[fadeIn_0.3s_ease]">
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30">
            <span className="text-4xl text-[#D4AF37]">💳</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {isRtl ? 'تفعيل اشتراك المتجر' : 'Activate Store Subscription'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {isRtl 
              ? 'انتهت صلاحية الفترة التجريبية أو الاشتراك الخاص بمتجرك. يرجى تزويد النظام بكود التفعيل للمتابعة.' 
              : 'Your store\'s trial period or subscription has expired. Please enter your activation code to continue.'}
          </p>
        </div>

        <div className="border-t border-b border-zinc-200 dark:border-[#D4AF37]/10 py-6 my-2 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
            {isRtl ? 'الاشتراك الشهري المميز' : 'Monthly Premium Plan'}
          </p>
          <div className="flex justify-center items-baseline gap-1">
            <span className="text-4xl font-black text-slate-900 dark:text-white">499</span>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{isRtl ? 'ج.م / شهرياً' : 'EGP / mo'}</span>
          </div>
        </div>

        <div className="space-y-4 text-start">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 block mb-2">
              {isRtl ? 'كود التفعيل / التحقق' : 'Activation / Verification Code'}
            </label>
            <input
              type="text"
              value={activationCode}
              onChange={e => setActivationCode(e.target.value.toUpperCase())}
              placeholder="ACT-XXXXXX"
              className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus:border-[#D4AF37] dark:focus:border-[#D4AF37] px-4 py-3 font-mono font-bold text-center text-sm outline-none tracking-widest transition-all uppercase text-slate-900 dark:text-white"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-500 font-bold text-center bg-rose-500/10 py-2.5 border border-rose-500/20">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleSubscribeClick}
            className="w-full py-4 bg-[#D4AF37] hover:bg-[#e6c44a] text-black font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2"
          >
            🚀 {isRtl ? 'تفعيل الاشتراك الآن' : 'Activate Subscription'}
          </button>
          
          <a
            href="https://wa.me/201000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-transparent border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-center"
          >
            💬 {isRtl ? 'طلب كود تفعيل (الدعم الفني)' : 'Get Activation Code (Support)'}
          </a>
        </div>

        {currentUser && (
          <button
            onClick={onLogout}
            className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors pt-2 block mx-auto font-bold"
          >
            {isRtl ? '✕ تسجيل الخروج' : '✕ Logout'}
          </button>
        )}
      </div>
    </div>
  );
}
