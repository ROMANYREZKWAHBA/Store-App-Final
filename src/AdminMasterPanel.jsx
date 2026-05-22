import React from 'react';

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

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return isRtl ? 'لا يوجد' : 'None';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Get user subscription properties (fallback to system states for admin or mock defaults for others)
  const getUserSubDetails = (user) => {
    const isCurrentUserAdmin = user.id === currentUser?.id;
    
    const uStore = user.storeName || (isCurrentUserAdmin ? storeName : `${user.name} Workstation`);
    
    let uStatus = user.subscriptionStatus;
    if (!uStatus) {
      uStatus = isCurrentUserAdmin ? subscriptionStatus : (user.role === 'admin' ? 'active' : 'active');
    }

    let uExpiry = user.subscriptionExpiry;
    if (!uExpiry && isCurrentUserAdmin) {
      uExpiry = localStorage.getItem('pos_subscription_end_date') || localStorage.getItem('pos_trial_start_date');
    }

    return { storeName: uStore, status: uStatus, expiry: uExpiry };
  };

  // Compute metrics
  const userDetailsList = users.map(u => ({ ...u, ...getUserSubDetails(u) }));
  
  const totalUsers = userDetailsList.length;
  const activeSubs = userDetailsList.filter(u => u.status === 'active' || u.status === 'trial').length;
  const pendingExpired = userDetailsList.filter(u => u.status === 'expired' || u.status === 'pending_onboarding').length;

  const handleUpgrade = (user) => {
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Update users array
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          subscriptionStatus: 'active',
          subscriptionExpiry: expiryDate,
          storeName: user.storeName // preserve computed or set store name
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem('pos_users', JSON.stringify(updatedUsers));

    // If upgrading the current admin session, sync global state
    if (user.id === currentUser?.id) {
      setSubscriptionStatus('active');
      setSubscriptionExpired(false);
      setTrialDaysLeft(null);
      localStorage.setItem('pos_subscription_status', 'active');
      localStorage.setItem('pos_subscription_end_date', expiryDate);
      localStorage.removeItem('activationDate');
      localStorage.removeItem('pos_trial_start_date');
    }

    if (pushNotification) {
      pushNotification(
        isRtl 
          ? `🎉 تم تفعيل وترقية اشتراك (${user.storeName}) بنجاح!` 
          : `🎉 Subscription for (${user.storeName}) upgraded to ACTIVE successfully!`, 
        'success'
      );
    }
  };

  const handleReset = (user) => {
    // Update users array
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          subscriptionStatus: 'pending_onboarding',
          subscriptionExpiry: null,
          storeName: user.storeName
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem('pos_users', JSON.stringify(updatedUsers));

    // If resetting the current admin session, sync global state
    if (user.id === currentUser?.id) {
      setSubscriptionStatus('pending_onboarding');
      setSubscriptionExpired(false);
      setTrialDaysLeft(null);
      localStorage.setItem('pos_subscription_status', 'pending_onboarding');
      localStorage.removeItem('pos_subscription_end_date');
      localStorage.removeItem('activationDate');
      localStorage.removeItem('pos_trial_start_date');
    }

    if (pushNotification) {
      pushNotification(
        isRtl 
          ? `⚠️ تم إعادة تعيين اشتراك (${user.storeName}) إلى وضع الإعداد` 
          : `⚠️ Subscription for (${user.storeName}) reset to PENDING ONBOARDING!`, 
        'warning'
      );
    }
  };

  return (
    <div className="p-6 space-y-8 bg-slate-50 dark:bg-[#0a0a0c] min-h-full text-slate-900 dark:text-zinc-100 transition-colors duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-full text-[10px] font-black tracking-widest text-[#D4AF37] uppercase mb-2">
            🛡️ Master Controller
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider">
            {isRtl ? 'لوحة التحكم العامة للمسؤول' : 'Master System Admin Panel'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {isRtl 
              ? 'إدارة اشتراكات المتاجر والولوج الآمن لجميع محطات العمل المسجلة.' 
              : 'Administer store subscriptions, workspace keys, and active workstations.'}
          </p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Total Users */}
        <div className="bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
              {isRtl ? 'إجمالي الحسابات' : 'Total Workstations'}
            </span>
            <span className="text-3xl font-black">{totalUsers}</span>
          </div>
          <div className="text-2xl p-3 bg-zinc-100 dark:bg-white/5 rounded-lg">👥</div>
        </div>

        {/* Metric 2: Active Subscribers */}
        <div className="bg-white dark:bg-[#151518] border border-[#0066FF]/30 dark:border-[#0066FF]/20 p-6 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest block">
              {isRtl ? 'الاشتراكات النشطة' : 'Active Subscribers'}
            </span>
            <span className="text-3xl font-black text-[#0066FF]">{activeSubs}</span>
          </div>
          <div className="text-2xl p-3 bg-[#0066FF]/10 rounded-lg">⚡</div>
        </div>

        {/* Metric 3: Expired/Pending */}
        <div className="bg-white dark:bg-[#151518] border border-[#D4AF37]/30 dark:border-[#D4AF37]/20 p-6 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block">
              {isRtl ? 'منتهية الصلاحية / قيد الانتظار' : 'Expired / Pending Onboarding'}
            </span>
            <span className="text-3xl font-black text-[#D4AF37]">{pendingExpired}</span>
          </div>
          <div className="text-2xl p-3 bg-[#D4AF37]/10 rounded-lg">⏳</div>
        </div>

      </div>

      {/* Workspace Data Table Section */}
      <div className="bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/80">
          <h3 className="text-sm font-black uppercase tracking-wider">
            {isRtl ? 'سجل اشتراكات محطات العمل والمتاجر' : 'Retail Workstations Subscription Ledger'}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr className="bg-zinc-50 dark:bg-black/20 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <th className="p-4">{isRtl ? 'اسم المتجر / الحساب' : 'Store / Account Name'}</th>
                <th className="p-4">{isRtl ? 'اسم المستخدم' : 'Username'}</th>
                <th className="p-4">{isRtl ? 'الدور الوظيفي' : 'System Role'}</th>
                <th className="p-4">{isRtl ? 'حالة الاشتراك' : 'Subscription Status'}</th>
                <th className="p-4">{isRtl ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}</th>
                <th className="p-4 text-center">{isRtl ? 'الإجراءات الإدارية' : 'Administrative Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300">
              {userDetailsList.map((user) => {
                const isSelf = user.id === currentUser?.id;
                
                return (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${
                      isSelf ? 'bg-amber-500/5 dark:bg-amber-500/5 border-l-4 border-l-[#D4AF37]' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-slate-900 dark:text-white">{user.storeName}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[8px] font-black rounded uppercase tracking-wider">
                            {isRtl ? 'حسابك الحالي' : 'YOU'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-zinc-500 dark:text-zinc-400">{user.username || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        user.role === 'admin' 
                          ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                        user.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                          : user.status === 'trial'
                            ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                            : user.status === 'expired'
                              ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                              : 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
                      }`}>
                        {user.status === 'active' && (isRtl ? 'نشط' : 'active')}
                        {user.status === 'trial' && (isRtl ? 'فترة تجريبية' : 'trial')}
                        {user.status === 'expired' && (isRtl ? 'منتهي' : 'expired')}
                        {user.status === 'pending_onboarding' && (isRtl ? 'قيد الإعداد' : 'pending onboarding')}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-zinc-500 dark:text-zinc-400">{formatDate(user.expiry)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        
                        {/* Upgrade Button */}
                        <button
                          onClick={() => handleUpgrade(user)}
                          disabled={user.status === 'active'}
                          className={`px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            user.status === 'active'
                              ? 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                          }`}
                        >
                          ⚡ {isRtl ? 'تفعيل / ترقية' : 'Upgrade'}
                        </button>
                        
                        {/* Reset Button */}
                        <button
                          onClick={() => handleReset(user)}
                          disabled={user.status === 'pending_onboarding'}
                          className={`px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            user.status === 'pending_onboarding'
                              ? 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 cursor-not-allowed'
                              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10'
                          }`}
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

    </div>
  );
}
