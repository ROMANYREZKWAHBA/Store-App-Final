import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useOnlineStatus } from './useOnlineStatus';
import * as SB from './supabaseService';
import { supabase } from './supabaseClient';
import BranchManagement from './BranchManagement';
import { fetchActiveBranches } from './branchService';
import StockTransfersScreen from './StockTransfers';
import SubscriptionUpgrade from './SubscriptionUpgrade';
import SubscriptionSelectionScreen from './SubscriptionSelectionScreen';
import AdminMasterPanel from './AdminMasterPanel';
import LandingPage from './LandingPage';

// Inject Google Fonts
const styleEl = document.createElement('link');
styleEl.rel = 'stylesheet';
styleEl.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;500;600;700;800;900&display=swap';
document.head.appendChild(styleEl);
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  :root {
    --accent-blue: #0066FF;
    --accent-gold: #D4AF37;
    --bg-main: #f8fafc;
    --bg-card: #ffffff;
    --bg-deep: #f1f5f9;
    --bg-sidebar: #0f172a;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #475569;
    --border-color: #cbd5e1;
  }

  [data-theme='dark'] {
    --bg-main: #0a0a0c;
    --bg-card: #151518;
    --bg-deep: #0f0f12;
    --bg-sidebar: #050505;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #64748b;
    --border-color: #222226;
  }

  /* Global Typography Fixes */
  * { font-family: 'Inter', 'Cairo', sans-serif !important; }
  [dir="rtl"], [dir="rtl"] * { 
    font-family: 'Cairo', 'Inter', sans-serif !important; 
    letter-spacing: normal !important; 
    text-transform: none !important;
  }
  
  /* Custom Visible Scrollbars */
  ::-webkit-scrollbar { 
    display: block !important; 
    width: 6px; 
    height: 6px; 
  }
  ::-webkit-scrollbar-track { background: var(--bg-deep); }
  ::-webkit-scrollbar-thumb { 
    background: #444; 
    border-radius: 10px; 
  }
  ::-webkit-scrollbar-thumb:hover { background: var(--accent-blue); }
  
  /* Firefox */
  * { scrollbar-width: thin; scrollbar-color: #444 var(--bg-deep); }
  html, body, #root { background: var(--bg-main); color: var(--text-primary); line-height: 1.5; }
  [dir="rtl"] body, [dir="rtl"] #root { line-height: 1.7; }

  /* ⚡ BOOT PAINT SUPPRESSION — prevents white-flash before spinner mounts.
     Class is added by bootFromCloud() and removed once boot resolves. */
  body.sp-booting { visibility: hidden; }
  body.sp-booting-ready { visibility: visible; }
  input[type=number]::-webkit-inner-spin-button { display: none; }
  button:focus { outline: none; }
  
  /* Alignment Helpers */
  .text-start { text-align: start !important; }
  .text-end { text-align: end !important; }

  /* Fix Dark Mode Input Visibility */
  input, select, textarea { 
    color: var(--text-primary) !important;
    background-color: var(--bg-deep) !important;
    text-align: inherit;
  }
  [dir="rtl"] input, [dir="rtl"] select, [dir="rtl"] textarea { text-align: right !important; }
  [dir="ltr"] input, [dir="ltr"] select, [dir="ltr"] textarea { text-align: left !important; }
  input[type="number"] { color: var(--text-primary) !important; }
  input::placeholder { color: var(--text-muted); opacity: 0.5; }

  @media print {
    @page { margin: 0; size: 80mm auto; }
    html, body { width: 80mm; margin: 0; padding: 0; background: white !important; }
    body * { visibility: hidden; }
    #printable-receipt, #printable-receipt * { visibility: visible !important; color: black !important; }
    #printable-receipt {
      position: absolute; left: 0; top: 0; right: 0;
      width: 76mm !important;
      max-width: 76mm !important;
      margin: 0 auto !important;
      padding: 3mm !important;
      box-sizing: border-box !important;
      font-size: 11px !important;
    }
  }
`;
document.head.appendChild(globalStyle);

function InvoiceTemplate({ order, currency, language, storeName, logo, header, footer, activeShift, users }) {
  if (!order) return null;
  const isRtl = language === 'ar';
  
  // Determine shift type
  const shiftHour = activeShift ? new Date(activeShift.openedAt).getHours() : new Date().getHours();
  const shiftType = shiftHour < 16 ? (isRtl ? 'صباحية' : 'Morning') : (isRtl ? 'مسائية' : 'Evening');
  const cashierObj = users?.find(u => u.id === order.userId);
  const cashierName = cashierObj?.name || order.userId?.slice(0, 10) || (isRtl ? 'كاشير' : 'Cashier');

  return (
    <div id="printable-receipt" className="hidden print:block w-[80mm] mx-auto text-black bg-white p-2 text-xs" dir={isRtl ? "rtl" : "ltr"}>
      <div className="text-center mb-4 border-b border-black border-dashed pb-3">
        {logo && <img src={logo} alt="Logo" className="max-h-16 mx-auto mb-2" />}
        <h2 className="text-lg font-bold uppercase mb-1">{storeName || (isRtl ? 'إسم المتجر' : 'Store Name')}</h2>
        {header && <p className="text-[10px] mt-1 whitespace-pre-wrap">{header}</p>}
        <div className="text-[8px] mt-2 space-y-0.5 border-t border-black border-dotted pt-2 opacity-80 font-bold">
          <p>{isRtl ? 'الفاتورة #' : 'Invoice #'} {order.serialNumber || order.id?.slice(0, 8)}</p>
          <p>{new Date(order.timestamp).toLocaleString()}</p>
          <p>{isRtl ? 'الكاشير: ' : 'Cashier: '} {cashierName} | {isRtl ? 'الوردية: ' : 'Shift: '} {shiftType}</p>
        </div>
      </div>
      <div className="space-y-2 border-b border-black border-dashed pb-3 mb-3">
        <div className="flex font-bold justify-between border-b border-black border-dashed pb-1 mb-1">
          <span>{isRtl ? 'الصنف' : 'Item'}</span><span>{isRtl ? 'المجموع' : 'Total'}</span>
        </div>
        {order.items.map((item, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex justify-between items-start gap-2">
              <span className="flex-1">{item.quantity}x {item.name[language] || item.name.en}</span>
              <span className="text-right whitespace-nowrap">{(item.quantity * item.priceAtOrder).toFixed(2)}</span>
            </div>
            {item.note && <span className="text-[10px] pl-4 italic">- {item.note}</span>}
          </div>
        ))}
      </div>
      <div className="space-y-1 mt-3">
        <div className="flex justify-between"><span>{isRtl ? 'المجموع' : 'Subtotal'}</span><span>{parseFloat(order.subtotal).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{isRtl ? 'الضريبة' : 'Tax'}</span><span>{parseFloat(order.vat).toFixed(2)}</span></div>
        {order.serviceFee > 0 && <div className="flex justify-between"><span>{isRtl ? 'الخدمة' : 'Service Fee'}</span><span>{parseFloat(order.serviceFee).toFixed(2)}</span></div>}
        {order.discount > 0 && <div className="flex justify-between"><span>{isRtl ? 'خصم' : 'Discount'}</span><span>-{parseFloat(order.discount).toFixed(2)}</span></div>}
        <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-black border-dashed">
          <span>{isRtl ? 'الإجمالي' : 'Total'}</span><span>{parseFloat(order.total).toFixed(2)} {currency}</span>
        </div>
      </div>
      <div className="text-center mt-6 pt-2 border-t-2 border-black border-dotted">
        {footer ? (
          <p className="font-bold whitespace-pre-wrap">{footer}</p>
        ) : (
          <p className="font-bold">{isRtl ? 'شكراً لزيارتكم' : 'Thank You!'}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SHIFT REPORT TEMPLATE (Z-REPORT)
// ============================================================
function ShiftReportTemplate({ shift, storeName, currency, isRtl, cashierName }) {
  if (!shift) return null;
  return (
    <div id="printable-receipt" className="hidden print:block w-[80mm] mx-auto text-black bg-white p-2 text-xs" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-center mb-4 border-b border-black border-dashed pb-3">
        <h2 className="text-lg font-bold uppercase mb-2">{storeName || (isRtl ? 'إسم المتجر' : 'Store Name')}</h2>
        <div className="bg-black text-white font-bold text-sm py-1 max-w-[150px] mx-auto mb-2 uppercase tracking-widest">
           {isRtl ? 'تقرير إغلاق وردية' : 'Z-Report'}
        </div>
        <p className="font-bold">Shift #{shift.id}</p>
        <p className="opacity-80">{isRtl ? 'الكاشير:' : 'Cashier:'} {cashierName || shift.userId?.slice(0, 5)}</p>
      </div>
      
      <div className="space-y-1 mt-3 pb-3 mb-3 border-b border-black border-dashed">
        <div className="flex justify-between"><span>{isRtl ? 'الفتح:' : 'Opened:'}</span><span>{new Date(shift.openedAt).toLocaleString()}</span></div>
        <div className="flex justify-between"><span>{isRtl ? 'الإغلاق:' : 'Closed:'}</span><span>{shift.closedAt ? new Date(shift.closedAt).toLocaleString() : '—'}</span></div>
      </div>

      <div className="space-y-1 mt-3 pb-3 mb-3 border-b border-black border-dashed">
        <div className="flex justify-between"><span>{isRtl ? 'العهدة' : 'Opening Balance'}</span><span>{Number(shift.openingBalance || 0).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{isRtl ? 'مبيعات نقدي' : 'Cash Sales'}</span><span>{Number(shift.totalCashSales || 0).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{isRtl ? 'إيداع فكة' : 'Add Change'}</span><span>{Number(shift.drawerIn || 0).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{isRtl ? 'ترحيل للخزينة' : 'Transfer to Safe'}</span><span>-{Number(shift.drawerOut || 0).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{isRtl ? 'مصروفات وسلف' : 'Exps & Advances'}</span><span>-{Number((shift.totalExpenses || 0) + (shift.totalAdvances || 0)).toFixed(2)}</span></div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between font-bold"><span>{isRtl ? 'الرصيد المتوقع' : 'Expected Cash'}</span><span>{Number(shift.expectedCash || 0).toFixed(2)}</span></div>
        <div className="flex justify-between font-bold"><span>{isRtl ? 'الرصيد الفعلي المستلم' : 'Actual Cash'}</span><span>{Number(shift.actualCash || 0).toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-black border-dashed">
          <span>{isRtl ? 'العجز / الزيادة' : 'Variance'}</span><span>{Number(shift.cashVariance || 0).toFixed(2)} {currency}</span>
        </div>
      </div>

      <div className="text-center mt-6 pt-2 border-t-2 border-black border-dotted">
        <p>{isRtl ? 'وقت الطباعة:' : 'Printed At:'}</p>
        <p>{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

// ============================================================
// CONSTANTS & DATA
// ============================================================
const CATEGORIES = [
  { id: 'cat_1', name: { en: 'Coffee', ar: 'قهوة' }, icon: '☕' },
  { id: 'cat_2', name: { en: 'Tea', ar: 'شاي' }, icon: '🫖' },
  { id: 'cat_3', name: { en: 'Pastries', ar: 'مخبوزات' }, icon: '🥐' },
  { id: 'cat_4', name: { en: 'Cold Drinks', ar: 'مشروبات باردة' }, icon: '🥤' },
  { id: 'cat_5', name: { en: 'Desserts', ar: 'حلويات' }, icon: '🍰' },
  { id: 'cat_6', name: { en: 'Raw Materials', ar: 'مواد خام' }, icon: '🥛' },
];

const MODIFIERS = [
  { id: 'm_1', name: { en: 'Regular Milk', ar: 'حليب عادي' }, priceDelta: 0, group: 'Milk' },
  { id: 'm_2', name: { en: 'Lactose-Free', ar: 'خالي لاكتوز' }, priceDelta: 0.5, group: 'Milk' },
  { id: 'm_3', name: { en: 'Almond Milk', ar: 'حليب لوز' }, priceDelta: 0.75, group: 'Milk' },
  { id: 'm_4', name: { en: 'Oat Milk', ar: 'حليب شوفان' }, priceDelta: 0.75, group: 'Milk' },
  { id: 'm_5', name: { en: 'No Sugar', ar: 'بدون سكر' }, priceDelta: 0, group: 'Sugar' },
  { id: 'm_6', name: { en: '1 Sugar', ar: '١ سكر' }, priceDelta: 0, group: 'Sugar' },
  { id: 'm_7', name: { en: '2 Sugar', ar: '٢ سكر' }, priceDelta: 0, group: 'Sugar' },
  { id: 'm_8', name: { en: '3 Sugar', ar: '٣ سكر' }, priceDelta: 0, group: 'Sugar' },
  { id: 'm_12', name: { en: 'Vanilla Syrup', ar: 'سيروب فانيلا' }, priceDelta: 0.5, group: 'Flavor' },
  { id: 'm_13', name: { en: 'Caramel Syrup', ar: 'سيروب كاراميل' }, priceDelta: 0.5, group: 'Flavor' },
];

const INITIAL_ITEMS = [
  { id: 'i_1', sku: '1001', categoryId: 'cat_1', name: { en: 'Espresso', ar: 'اسبريسو' }, basePrice: 2.5, costPrice: 0.8, image: 'https://images.unsplash.com/photo-1510707513151-471d1091ebb1?w=300', sizes: [{ id: 's1', name: 'S', priceDelta: 0 }, { id: 's2', name: 'M', priceDelta: 0.5 }], modifiers: ['m_5', 'm_6', 'm_7', 'm_8'], stock: 50, isActive: true, type: 'PRODUCT' },
  { id: 'i_2', sku: '1002', categoryId: 'cat_1', name: { en: 'Latte', ar: 'لاتيه' }, basePrice: 3.5, costPrice: 1.2, image: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=300', sizes: [{ id: 's3', name: 'S', priceDelta: 0 }, { id: 's4', name: 'M', priceDelta: 0.75 }, { id: 's5', name: 'L', priceDelta: 1.25 }], modifiers: ['m_1', 'm_2', 'm_3', 'm_4', 'm_5', 'm_6', 'm_7', 'm_8', 'm_12', 'm_13'], stock: 40, isActive: true, type: 'PRODUCT' },
  { id: 'i_3', sku: '1003', categoryId: 'cat_3', name: { en: 'Butter Croissant', ar: 'كرواسون زبدة' }, basePrice: 2.75, costPrice: 0.9, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300', sizes: [{ id: 's6', name: 'M', priceDelta: 0 }], modifiers: [], stock: 25, isActive: true, type: 'PRODUCT' },
  { id: 'i_4', sku: '1004', categoryId: 'cat_4', name: { en: 'Iced Americano', ar: 'أمريكانو بارد' }, basePrice: 3.0, costPrice: 0.7, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300', sizes: [{ id: 's7', name: 'M', priceDelta: 0 }, { id: 's8', name: 'L', priceDelta: 0.5 }], modifiers: ['m_5', 'm_6', 'm_7', 'm_8'], stock: 30, isActive: true, type: 'PRODUCT' },
  { id: 'i_5', sku: '1005', categoryId: 'cat_2', name: { en: 'Green Tea', ar: 'شاي أخضر' }, basePrice: 2.25, costPrice: 0.5, image: 'https://images.unsplash.com/photo-1523906630133-f1cb050a1145?w=300', sizes: [{ id: 's9', name: 'S', priceDelta: 0 }, { id: 's10', name: 'M', priceDelta: 0.5 }], modifiers: ['m_5', 'm_6', 'm_7', 'm_8'], stock: 60, isActive: true, type: 'PRODUCT' },
  { id: 'i_6', sku: '1006', categoryId: 'cat_5', name: { en: 'Cheesecake', ar: 'تشيز كيك' }, basePrice: 4.5, costPrice: 1.8, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300', sizes: [{ id: 's11', name: 'Slice', priceDelta: 0 }], modifiers: [], stock: 12, isActive: true, type: 'PRODUCT' },
  { id: 'i_7', sku: '1007', categoryId: 'cat_5', name: { en: 'Chocolate Muffin', ar: 'مافن شوكولاتة' }, basePrice: 3.25, costPrice: 1.1, image: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=300', sizes: [{ id: 's12', name: 'M', priceDelta: 0 }], modifiers: [], stock: 15, isActive: true, type: 'PRODUCT' },
  { id: 'i_8', sku: '1008', categoryId: 'cat_1', name: { en: 'Cappuccino', ar: 'كابتشينو' }, basePrice: 3.75, costPrice: 1.3, image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=300', sizes: [{ id: 's13', name: 'S', priceDelta: 0 }, { id: 's14', name: 'M', priceDelta: 0.75 }], modifiers: ['m_1', 'm_2', 'm_5', 'm_6', 'm_12', 'm_13'], stock: 35, isActive: true, type: 'PRODUCT' },
  { id: 'raw_1', sku: 'R001', categoryId: 'cat_6', name: { en: 'White Sugar', ar: 'سكر أبيض' }, basePrice: 0, costPrice: 0.5, image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300', sizes: [], modifiers: [], stock: 100, isActive: true, type: 'RAW' },
  { id: 'raw_2', sku: 'R002', categoryId: 'cat_6', name: { en: 'Fresh Milk', ar: 'حليب طازج' }, basePrice: 0, costPrice: 1.1, image: 'https://images.unsplash.com/photo-1550583724-125581ae278c?w=300', sizes: [], modifiers: [], stock: 50, isActive: true, type: 'RAW' },
];

const DEFAULT_USERS = [
  { id: 'u_1', name: 'Cashier Account', pin: '1234', role: 'Cashier', isActive: true },
  { id: 'u_3', name: 'Admin Manager', username: 'admin', password: 'admin', pin: '0000', role: 'Admin', isActive: true },
  { id: 'u_4', name: 'System Owner', username: 'owner', password: 'owner', pin: '9999', role: 'admin', isActive: true, recoveryCode: 'BREW-MASTER-9999-RECOVERY' },
];

const T = {
  en: {
    dashboard: "Live Dashboard", pos: "POS", shifts: "Shifts", sales: "Sales", inventory: "Inventory",
    purchases: "Purchases", expenses: "Expenses", treasury: "Treasury", staff: "Staff",
    reports: "Reports", customers: "Customers", logs: "Audit Logs", settings: "Settings", branches: "Branches", transfers: "Transfers",
    statements: "Statements", logout: "Logout", search: "Search...",
    currentOrder: "Current Order", dineIn: "Dine-in", delivery: "Delivery",
    subtotal: "Subtotal", vat: "VAT", total: "Total", cash: "Cash", card: "Card",
    selectSize: "Select Size", itemNote: "Item Note", notePlaceholder: "Special instructions...",
    addBasket: "Add to Basket", PAID: "Paid", PARTIALLY_PAID: "Partly Paid",
    UNPAID: "Unpaid", VOIDED: "Voided",
  },
  ar: {
    dashboard: "لوحة البيانات", pos: "نقطة البيع", shifts: "الورديات", sales: "المبيعات", inventory: "المخزون",
    purchases: "المشتريات", expenses: "المصروفات", treasury: "الخزينة", staff: "الموظفين",
    reports: "التقارير", customers: "العملاء", logs: "سجل العمليات", settings: "الإعدادات", branches: "الفروع", transfers: "التحويلات",
    statements: "الكشوفات", logout: "تسجيل الخروج", search: "بحث...",
    currentOrder: "الطلب الحالي", dineIn: "داخل المحل", delivery: "توصيل",
    subtotal: "المجموع الجزئي", vat: "ضريبة القيمة المضافة", total: "الإجمالي", cash: "نقدي", card: "بطاقة",
    selectSize: "اختر الحجم", itemNote: "ملاحظة الطلب", notePlaceholder: "أضف تعليمات خاصة...",
    addBasket: "إضافة للسلة", PAID: "مدفوع", PARTIALLY_PAID: "مدفوع جزئياً",
    UNPAID: "غير مدفوع", VOIDED: "ملغي",
  }
};

const ROLE_PERMISSIONS = {
  Owner: ['all'],
  admin: ['all'],
  Admin: ['dashboard', 'pos', 'shifts', 'sales', 'inventory', 'purchases', 'expenses', 'customers', 'staff', 'reports', 'logs', 'transfers'],
  Manager: ['dashboard', 'pos', 'shifts', 'sales', 'inventory', 'purchases', 'expenses', 'customers', 'reports', 'transfers'],
  Cashier: ['pos', 'shifts', 'sales'],
  Accountant: ['dashboard', 'sales', 'expenses', 'treasury', 'reports', 'customers'],
  Storekeeper: ['inventory', 'purchases', 'reports', 'transfers'],
};

const canAccess = (user, tab, customPerms) => {
  if (!user) return false;
  // Admin Master Panel is exclusively restricted to the System Developer (u_4)
  if (tab === 'admin_panel') {
    return user.id === 'u_4';
  }
  if (user.role === 'Owner' || user.role === 'admin') return true;
  // If owner set custom permissions for this user, use those
  if (customPerms && customPerms[user.id]) {
    return customPerms[user.id].includes(tab);
  }
  const perms = ROLE_PERMISSIONS[user.role] || [];
  return perms.includes(tab);
};

let appCurrency = 'EGP';
const formatMoney = (amount) => {
  const num = Number(amount) || 0;
  return `${num.toFixed(2)} ${appCurrency}`;
};

// ============================================================
// MODIFIER MODAL
// ============================================================
function ModifierModal({ item, onClose, language, onAdd }) {
  const [selectedSize, setSelectedSize] = useState(item.sizes[0]);
  const [selectedMods, setSelectedMods] = useState([]);
  const [note, setNote] = useState('');
  const t = T[language];
  const isRtl = language === 'ar';

  const groups = ['Milk', 'Sugar', 'Flavor'];
  const toggleMod = (mod) => {
    setSelectedMods(prev => {
      const exists = prev.find(m => m.id === mod.id);
      if (exists) return prev.filter(m => m.id !== mod.id);
      if (['Milk', 'Sugar'].includes(mod.group)) return [...prev.filter(m => m.group !== mod.group), mod];
      return [...prev, mod];
    });
  };

  const totalPrice = (item.basePrice || 0) + (selectedSize.priceDelta || 0) + selectedMods.reduce((a, m) => a + (m.priceDelta || 0), 0);

  return (
    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-none w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col shadow-none" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">{item.name[language]}</h2>
            <p className="text-[var(--text-muted)] text-sm">{isRtl ? 'تخصيص الطلب' : 'Customize your order'}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-none hover:bg-[var(--bg-deep)] flex items-center justify-center text-xl transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">{t.selectSize}</h3>
            <div className="flex gap-3">
              {item.sizes.map(size => (
                <button key={size.id} onClick={() => setSelectedSize(size)}
                  className={`flex-1 py-4 rounded-none border-2 transition-all flex flex-col items-center ${selectedSize.id === size.id ? 'border-[#0066FF] bg-[#1a1a1a] text-[#0066FF]' : 'border-[var(--border-color)] hover:border-slate-300'}`}>
                  <span className="text-xl font-black">{size.name}</span>
                  <span className="text-xs font-medium opacity-70">{(size.priceDelta || 0) > 0 ? `+${formatMoney(size.priceDelta)}` : 'Base'}</span>
                </button>
              ))}
            </div>
          </div>

          {groups.map(group => {
            const groupMods = MODIFIERS.filter(m => m.group === group && item.modifiers.includes(m.id));
            if (!groupMods.length) return null;
            return (
              <div key={group}>
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">{group}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {groupMods.map(mod => (
                    <button key={mod.id} onClick={() => toggleMod(mod)}
                      className={`px-4 py-3 rounded-none border text-sm font-medium transition-all ${selectedMods.find(m => m.id === mod.id) ? 'bg-slate-800 border-slate-800 text-[var(--text-primary)]' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-slate-400 text-slate-600'}`}>
                      {mod.name[language]}
                      {(mod.priceDelta || 0) > 0 && <span className="block text-[10px] opacity-70">+{formatMoney(mod.priceDelta)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div>
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">{t.itemNote}</h3>
            <textarea placeholder={t.notePlaceholder} value={note} onChange={e => setNote(e.target.value)}
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none p-4 outline-none focus:ring-2 focus:ring-teal-500/20 resize-none text-sm" rows={2} />
          </div>
        </div>

        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-deep)] flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] font-medium">{t.subtotal}</p>
            <p className="text-2xl font-black text-[#0066FF]">{formatMoney(totalPrice)}</p>
          </div>
          <button onClick={() => onAdd(item, selectedSize, selectedMods, note)}
            className="flex-1 bg-[#0066FF] hover:bg-[#0066FF] text-white font-bold py-4 rounded-none shadow-none transition-all active:scale-95">
            {t.addBasket}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CART PANEL
// ============================================================
function CartPanel({ cart, setCart, customers, items, orderType, currentUser, onCompleteOrder, language, isLocked, activeShift, onAddCustomer, isCheckoutRequested, setIsCheckoutRequested, taxRate, enableServiceFee, serviceFee, setDrawerBalance }) {
  const [discount, setDiscount] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const t = T[language];
  const isRtl = language === 'ar';

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.priceAtOrder * i.quantity, 0), [cart]);
  const taxable = Math.max(0, subtotal - discount);
  const vat = subtotal * (Number(taxRate) / 100);
  const appliedServiceFee = enableServiceFee ? (subtotal * (Number(serviceFee) / 100)) : 0;
  const total = subtotal + vat + appliedServiceFee - discount;

  useEffect(() => {
    if (isCheckoutRequested) {
      if (paymentMethod === 'Credit') setAmountInput('0');
      else if (!amountInput || amountInput === '0') setAmountInput(total.toFixed(2));
    }
  }, [isCheckoutRequested, total, paymentMethod]);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.cartId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const finalizeOrder = (custId) => {
    const paid = parseFloat(amountInput) || 0;
    const order = {
      id: Math.random().toString(36).substring(7),
      orderNumber: Math.floor(Math.random() * 9000 + 1000).toString(),
      serialNumber: Math.floor(Math.random() * 100000),
      timestamp: new Date(),
      userId: currentUser.id,
      customerId: custId,
      items: [...cart],
      subtotal, discount, taxable, vat, serviceFee: appliedServiceFee, total,
      amountPaid: paid,
      balanceDue: Math.max(0, total - paid),
      remaining: Math.max(0, total - paid),
      paymentMethod,
      type: orderType,
      status: paid >= (total - 0.001) ? 'PAID' : (paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'),
      shiftId: activeShift?.id || 'manual'
    };
    onCompleteOrder(order);
    if (paymentMethod === 'Cash' || !paymentMethod) { setDrawerBalance(prev => prev + total); }
    setCart([]);
    setIsCheckoutRequested(false);
    setAmountInput('');
    setSelectedCustomerId(null);
    setPaymentMethod('Cash');
    setIsAddingNew(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  const handleFinalize = () => {
    if (cart.length === 0) return;
    for (const item of cart) {
      const product = items.find(i => i.id === item.itemId);
      if (product && item.quantity > (product.stock || 0)) {
        alert(isRtl ? `كمية (${item.name.ar}) تتجاوز المخزون` : `Insufficient stock for ${item.name.en}`);
        return;
      }
    }
    if (paymentMethod === 'Credit' && !selectedCustomerId && !isAddingNew) { setIsAddingNew(true); return; }
    if (isAddingNew) {
      if (!newCustName.trim()) { alert(isRtl ? 'أدخل اسم العميل' : 'Enter customer name'); return; }
      const newCust = { id: 'CUST-' + Date.now(), name: newCustName.trim(), phone: newCustPhone.trim(), createdAt: new Date() };
      onAddCustomer(newCust);
      finalizeOrder(newCust.id);
    } else {
      finalizeOrder(selectedCustomerId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] relative overflow-hidden">
      <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)] uppercase">{t.currentOrder}</h2>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Terminal #{activeShift?.id?.slice(0, 4) || 'OFF'}</p>
        </div>
        <button onClick={() => setCart([])} className="w-9 h-9 bg-rose-50 text-rose-500 rounded-none flex items-center justify-center hover:bg-rose-500 hover:text-[var(--text-primary)] transition-all">🗑️</button>
      </div>

      <div className="px-6 py-3 border-b border-slate-50 shrink-0 flex gap-2">
        <select value={selectedCustomerId || ''} onChange={e => { setSelectedCustomerId(e.target.value || null); setIsAddingNew(false); }}
          className={`flex-1 border-none rounded-none px-4 py-3 text-xs font-bold outline-none ${selectedCustomerId ? 'bg-[#1a1a1a] text-[#0066FF]' : 'bg-[var(--bg-deep)] text-slate-600'}`}>
          <option value="">👤 {isRtl ? 'عميل نقدي' : 'Walk-in'}</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => { setIsAddingNew(!isAddingNew); setSelectedCustomerId(null); }}
          className={`w-10 h-10 rounded-none flex items-center justify-center font-black transition-all ${isAddingNew ? 'bg-[#0066FF] text-[var(--text-primary)]' : 'bg-[var(--bg-deep)] text-[var(--text-muted)]'}`}>
          {isAddingNew ? '✕' : '+'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{}}>
        {cart.map(item => (
          <div key={item.cartId} className="p-4 bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] shadow-none flex justify-between items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-black text-[var(--text-primary)] text-sm uppercase truncate">{item.name[language]}</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-1">{item.size.name} • {formatMoney(item.priceAtOrder)}</p>
            </div>
            <div className="flex items-center gap-2 bg-[var(--bg-deep)] px-3 py-2 rounded-none">
              <button onClick={() => updateQty(item.cartId, -1)} className="w-6 h-6 flex items-center justify-center bg-[var(--bg-card)] rounded-none text-[var(--text-muted)] shadow-none text-xs font-black">－</button>
              <span className="font-black text-[var(--text-primary)] text-sm w-4 text-center">{item.quantity}</span>
              <button onClick={() => updateQty(item.cartId, 1)} className="w-6 h-6 flex items-center justify-center bg-[var(--bg-card)] rounded-none text-[var(--text-muted)] shadow-none text-xs font-black">＋</button>
            </div>
            <button onClick={() => setCart(prev => prev.filter(i => i.cartId !== item.cartId))} className="text-slate-200 hover:text-rose-400 font-bold">✕</button>
          </div>
        ))}
        {cart.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center text-slate-200 space-y-2">
            <span className="text-5xl">🛒</span>
            <p className="text-xs font-black uppercase tracking-widest">{isRtl ? 'السلة فارغة' : 'Empty Cart'}</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900 text-[var(--text-primary)] rounded-t-[40px] space-y-4 shrink-0">
        <div className="space-y-2">
          <div className="flex justify-between text-[var(--text-muted)] text-xs"><span className="font-black uppercase">{t.subtotal}</span><span className="font-bold">{formatMoney(subtotal)}</span></div>
          <div className="flex justify-between text-[var(--text-muted)] text-xs"><span className="font-black uppercase">{isRtl ? 'ضريبة القيمة المضافة' : 'VAT'} ({taxRate}%)</span><span className="font-bold">{formatMoney(vat)}</span></div>
          {enableServiceFee && (
            <div className="flex justify-between text-[var(--text-muted)] text-xs"><span className="font-black uppercase">{isRtl ? 'رسوم الخدمة' : 'Service Fee'} ({serviceFee}%)</span><span className="font-bold">{formatMoney(appliedServiceFee)}</span></div>
          )}
          <div className="pt-3 border-t border-white/10 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-teal-400 uppercase mb-1">{t.total}</p>
              <h3 className="text-4xl font-black tracking-tighter">{formatMoney(total)}</h3>
            </div>
          </div>
        </div>
        <button onClick={() => setIsCheckoutRequested(true)} disabled={cart.length === 0 || isLocked}
          className="w-full py-5 rounded-none bg-[#0066FF] hover:bg-[#0066FF] text-white font-black text-xs uppercase tracking-widest disabled:opacity-20 transition-all">
          {isRtl ? 'إتمام الطلب ←' : 'Checkout Order →'}
        </button>
      </div>

      {isCheckoutRequested && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-50 p-6 flex flex-col items-center justify-center">
          <div className="w-full flex flex-col max-h-full overflow-y-auto space-y-5 text-center" style={{}}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-400">{t.total} PAYABLE</p>
              <h3 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">{formatMoney(total)}</h3>
              <p className="text-[var(--text-muted)] text-[10px] mt-1">Base: {formatMoney(subtotal)} | VAT: {formatMoney(vat)}</p>
            </div>

            {paymentMethod === 'Credit' && (
              <div className="bg-[var(--bg-card)]/5 p-5 rounded-none border border-white/10 space-y-3">
                {isAddingNew ? (
                  <div className="space-y-3 text-left">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{isRtl ? 'تسجيل عميل جديد' : 'New Credit Customer'}</p>
                    <input type="text" placeholder={isRtl ? 'الاسم' : 'Full Name'} value={newCustName} onChange={e => setNewCustName(e.target.value)}
                      className="w-full bg-[var(--bg-card)]/10 rounded-none px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none border-none" />
                    <input type="text" placeholder={isRtl ? 'الهاتف' : 'Phone'} value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)}
                      className="w-full bg-[var(--bg-card)]/10 rounded-none px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none border-none" />
                    <button onClick={() => setIsAddingNew(false)} className="text-[var(--text-muted)] text-[10px] font-black uppercase">← {isRtl ? 'رجوع' : 'Back'}</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">{isRtl ? 'اختر عميل للآجل' : 'Select Credit Customer'}</p>
                    <div className="flex gap-2">
                      <select value={selectedCustomerId || ''} onChange={e => setSelectedCustomerId(e.target.value || null)}
                        className="flex-1 bg-[var(--bg-card)]/10 rounded-none px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none border-none">
                        <option value="" className="text-[var(--text-primary)]">-- {isRtl ? 'اختر' : 'Select'} --</option>
                        {customers.map(c => <option key={c.id} value={c.id} className="text-[var(--text-primary)]">{c.name}</option>)}
                      </select>
                      <button onClick={() => setIsAddingNew(true)} className="bg-[#0066FF] text-[var(--text-primary)] w-11 h-11 rounded-none font-black">+</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-2">{isRtl ? 'المبلغ المستلم' : 'Amount Received'}</label>
              <input type="number" value={amountInput} onChange={e => setAmountInput(e.target.value)} disabled={paymentMethod === 'Credit'}
                className="w-full bg-[var(--bg-card)]/5 border-2 border-white/10 rounded-none py-6 text-4xl font-black text-center text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
                placeholder="0.00" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'Card', 'Credit'].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`py-4 rounded-none font-black text-[9px] uppercase tracking-widest border-2 transition-all ${paymentMethod === m ? (m === 'Credit' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-[#0066FF] border-[#0066FF] text-white') : 'border-white/10 text-[var(--text-muted)]'}`}>
                  {m === 'Cash' ? '💵' : m === 'Card' ? '💳' : '📜'} {m === 'Credit' ? (isRtl ? 'آجل' : 'Credit') : m}
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <button onClick={handleFinalize} className="w-full bg-[#0066FF] text-white font-black py-6 rounded-none text-lg uppercase tracking-widest hover:bg-[#0066FF] active:scale-95 transition-all">
                {isAddingNew ? (isRtl ? 'تسجيل وحفظ ✓' : 'Register & Save ✓') : (isRtl ? 'تأكيد وإتمام ✓' : 'Confirm Order ✓')}
              </button>
              <button onClick={() => { setIsCheckoutRequested(false); setPaymentMethod('Cash'); setIsAddingNew(false); }}
                className="w-full text-[var(--text-muted)] font-black uppercase text-[10px] tracking-widest hover:text-[var(--text-primary)] transition-colors py-2">
                {isRtl ? '← رجوع' : '← Return to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// POS SCREEN
// ============================================================
function POSScreen({ currentUser, items, customers, categories, onCompleteOrder, language, activeShift, onAddCustomer, onGoToShifts, taxRate, enableServiceFee, serviceFee, currency, storeName, setDrawerBalance, invoiceLogo, invoiceHeader, invoiceFooter, users }) {
  const [selectedCat, setSelectedCat] = useState('');
  const [cart, setCart] = useState([]);
  const [modifyingItem, setModifyingItem] = useState(null);
  const [orderType, setOrderType] = useState('Dine-in');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const [lastInvoice, setLastInvoice] = useState(null);
  const [isCheckoutRequested, setIsCheckoutRequested] = useState(false);
  const t = T[language];
  const isRtl = language === 'ar';

  // ============================================================
  // GLOBAL BARCODE SCANNER LISTENER
  // ============================================================
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    console.log('📡 Global Barcode Hook Active');

    const handleBarcodeMatch = (barcode) => {
      if (!barcode) return;
      console.log('🎯 Barcode Match Attempted For:', barcode);

      // Match barcode or sku against active sellable products
      const item = items.find(i => 
        (i.barcode === barcode || i.sku === barcode) && 
        i.isActive !== false && 
        (i.type || 'PRODUCT') === 'PRODUCT'
      );

      if (item) {
        if (!activeShift) { 
          alert(isRtl ? 'افتح وردية أولاً' : 'Please open a shift first'); 
        } else if ((item.stock || 0) <= 0) { 
          alert(isRtl ? 'الصنف نافذ' : 'Out of stock'); 
        } else {
          // Extract default size and calculate price
          const size = item.sizes?.[0] || { id: 'regular', name: { en: 'Regular', ar: 'عادي' }, priceDelta: 0 };
          const mods = [];
          const note = '';
          const price = (item.basePrice || 0) + (size.priceDelta || 0);
          
          // Push item straight to cart
          setCart(prev => {
            const existIdx = prev.findIndex(ci => ci.itemId === item.id && ci.size.id === size.id && JSON.stringify(ci.modifiers) === JSON.stringify(mods) && ci.note === note);
            if (existIdx > -1) { const n = [...prev]; n[existIdx].quantity += 1; return n; }
            return [...prev, { cartId: Math.random().toString(36).substring(7), itemId: item.id, name: item.name, size, modifiers: mods, note, quantity: 1, priceAtOrder: price }];
          });
        }
      }
    };

    const handleScanner = (e) => {
      // Ignore keystrokes inside text inputs or textareas so we don't interfere with manual searches
      const tagName = e.target.tagName.toUpperCase();
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      console.log('[Barcode Key]:', e.key);

      const now = Date.now();
      
      // If time since last key is > 40ms, it's likely a human typing, so clear the buffer
      if (now - lastKeyTime.current > 40 && e.key !== 'Enter') {
        barcodeBuffer.current = '';
      }

      if (e.key === 'Enter') {
        const barcode = barcodeBuffer.current;
        handleBarcodeMatch(barcode);
        // Clear buffer after processing
        barcodeBuffer.current = '';
      } else if (e.key.length === 1) {
        // Accumulate keystrokes
        barcodeBuffer.current += e.key;
        lastKeyTime.current = now;
      }
    };

    const handlePaste = (e) => {
      const tagName = e.target.tagName.toUpperCase();
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      if (pastedText) {
        const cleanText = pastedText.trim();
        // Check if it's a numeric or SKU string (alphanumeric with hyphens/underscores)
        if (/^[a-zA-Z0-9-_]+$/.test(cleanText)) {
          handleBarcodeMatch(cleanText);
        }
      }
    };

    window.addEventListener('keydown', handleScanner);
    window.addEventListener('paste', handlePaste);
    
    return () => {
      window.removeEventListener('keydown', handleScanner);
      window.removeEventListener('paste', handlePaste);
    };
  }, [items, activeShift, isRtl]);

  const filteredItems = useMemo(() => items.filter(item => {
    const active = item.isActive !== false;
    const sellable = (item.type || 'PRODUCT') === 'PRODUCT';
    const matchCat = selectedCat === '' || item.categoryId === selectedCat;
    const matchSearch = !debouncedSearch || item.name.en.toLowerCase().includes(debouncedSearch.toLowerCase()) || item.name.ar.includes(debouncedSearch);
    return active && sellable && matchCat && matchSearch;
  }), [selectedCat, debouncedSearch, items]);

  const handleItemClick = (item) => {
    if (!activeShift) { alert(isRtl ? 'افتح وردية أولاً' : 'Please open a shift first'); return; }
    if ((item.stock || 0) <= 0) { alert(isRtl ? 'الصنف نافذ' : 'Out of stock'); return; }
    setModifyingItem(item);
  };

  const handleComplete = (order) => {
    onCompleteOrder(order);
    setLastInvoice(order);
    setCart([]);
    setIsCheckoutRequested(false);
    setTimeout(() => setLastInvoice(null), 3000);
  };

  const getStockBadge = (stock) => {
    if (stock <= 0) return { label: isRtl ? 'نفذ' : 'OUT', color: 'bg-rose-500' };
    if (stock <= 5) return { label: `${isRtl ? 'منخفض' : 'LOW'} (${stock})`, color: 'bg-amber-500' };
    return { label: `${isRtl ? 'متوفر' : 'STOCK'}: ${stock}`, color: 'bg-[#0066FF]' };
  };

  return (
    <div className="flex h-full w-full bg-[var(--bg-deep)] overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Menu Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-[var(--bg-card)] px-6 py-4 border-b border-[var(--border-color)] flex flex-col gap-4 shrink-0 shadow-none">
          {!activeShift && (
            <div className="bg-amber-600 text-[var(--text-primary)] px-5 py-3 rounded-none flex items-center justify-between shadow-none">
              <div className="flex items-center gap-3">
                <span className="text-xl">⏳</span>
                <p className="font-black uppercase text-xs">{isRtl ? 'يتطلب وردية مفتوحة' : 'Shift Required'}</p>
              </div>
              <button onClick={onGoToShifts} className="bg-[var(--bg-card)]/20 hover:bg-[var(--bg-card)]/30 px-4 py-2 rounded-none font-bold uppercase text-[10px] transition-all">
                {isRtl ? 'فتح وردية' : 'Open Shift'}
              </button>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input type="text" placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className={`w-full bg-[var(--bg-deep)] rounded-none ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 outline-none`} />
              <span className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[var(--text-muted)]`}>🔍</span>
            </div>
            <button onClick={() => setOrderType('Dine-in')} className={`px-4 py-3 rounded-none font-black text-[10px] uppercase transition-all ${orderType === 'Dine-in' ? 'bg-[#0066FF] text-[var(--text-primary)]' : 'bg-[var(--bg-deep)] text-[var(--text-muted)]'}`}>🍽️ {t.dineIn}</button>
            <button onClick={() => setOrderType('Delivery')} className={`px-4 py-3 rounded-none font-black text-[10px] uppercase transition-all ${orderType === 'Delivery' ? 'bg-[#0066FF] text-[var(--text-primary)]' : 'bg-[var(--bg-deep)] text-[var(--text-muted)]'}`}>🛵 {t.delivery}</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{}}>
            <button onClick={() => setSelectedCat('')} className={`px-6 py-2 rounded-none font-black text-[10px] uppercase shrink-0 border-2 ${selectedCat === '' ? 'border-[#0066FF] bg-[#1a1a1a] text-[#0066FF]' : 'border-transparent bg-[var(--bg-deep)] text-[var(--text-muted)]'}`}>
              ✨ {isRtl ? 'الكل' : 'All'}
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={`px-6 py-2 rounded-none font-black text-[10px] uppercase shrink-0 border-2 ${selectedCat === cat.id ? 'border-[#0066FF] bg-[#1a1a1a] text-[#0066FF]' : 'border-transparent bg-[var(--bg-deep)] text-[var(--text-muted)]'}`}>
                {cat.icon} {cat.name[language]}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6" style={{}}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const badge = getStockBadge(item.stock || 0);
              const inCart = cart.find(ci => ci.itemId === item.id);
              return (
                <button key={item.id} onClick={() => handleItemClick(item)}
                  disabled={!activeShift || item.stock <= 0}
                  className={`group relative bg-[var(--bg-card)] rounded-none p-4 shadow-none hover:shadow-none transition-all duration-300 border border-[var(--border-color)] flex flex-col text-start active:scale-[0.97] ${(!activeShift || item.stock <= 0) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                  <div className="aspect-square rounded-none bg-[var(--bg-deep)] mb-3 overflow-hidden relative shadow-none">
                    <img src={item.image} onError={e => e.target.src = 'https://via.placeholder.com/300x300?text=☕'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name[language]} />
                    <div className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} px-2 py-0.5 rounded-none ${badge.color} text-[var(--text-primary)] text-[8px] font-black`}>{badge.label}</div>
                    {inCart && (
                      <div className="absolute inset-0 bg-[#0066FF]/10 flex items-center justify-center">
                        <div className="bg-[#0066FF] text-[var(--text-primary)] w-9 h-9 rounded-none flex items-center justify-center shadow-none font-black">{inCart.quantity}</div>
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-[var(--text-primary)] text-xs mb-1 uppercase line-clamp-1">{item.name[language]}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <p className="text-lg font-black text-[#0066FF]">{formatMoney(item.basePrice)}</p>
                    <div className="w-7 h-7 bg-[var(--bg-deep)] rounded-none flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[#0066FF] group-hover:text-[var(--text-primary)] transition-colors">
                      <span className="font-black text-xs">+</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {filteredItems.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300">
              <span className="text-6xl mb-3">🍽️</span>
              <p className="font-black uppercase tracking-widest text-sm">{isRtl ? 'لا أصناف مطابقة' : 'No items found'}</p>
            </div>
          )}
        </main>
      </div>

      {/* Cart */}
      <aside className="w-80 bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-none flex flex-col shrink-0 overflow-hidden" style={{ borderRight: isRtl ? '1px solid #e2e8f0' : 'none', borderLeft: isRtl ? 'none' : '1px solid #e2e8f0' }}>
        <CartPanel cart={cart} setCart={setCart} customers={customers} items={items} orderType={orderType}
          currentUser={currentUser} onCompleteOrder={handleComplete} language={language}
          isLocked={!activeShift} activeShift={activeShift} onAddCustomer={onAddCustomer}
          isCheckoutRequested={isCheckoutRequested} setIsCheckoutRequested={setIsCheckoutRequested} 
          taxRate={taxRate} enableServiceFee={enableServiceFee} serviceFee={serviceFee} setDrawerBalance={setDrawerBalance} />
      </aside>

      {modifyingItem && (
        <ModifierModal item={modifyingItem} onClose={() => setModifyingItem(null)} language={language}
          onAdd={(item, size, mods, note) => {
            const price = (item.basePrice || 0) + (size.priceDelta || 0) + mods.reduce((a, b) => a + (b.priceDelta || 0), 0);
            setCart(prev => {
              const existIdx = prev.findIndex(ci => ci.itemId === item.id && ci.size.id === size.id && JSON.stringify(ci.modifiers) === JSON.stringify(mods) && ci.note === note);
              if (existIdx > -1) { const n = [...prev]; n[existIdx].quantity += 1; return n; }
              return [...prev, { cartId: Math.random().toString(36).substring(7), itemId: item.id, name: item.name, size, modifiers: mods, note, quantity: 1, priceAtOrder: price }];
            });
            setModifyingItem(null);
          }} />
      )}

      {lastInvoice && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-[#0066FF] text-[var(--text-primary)] px-8 py-4 rounded-none shadow-none flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--bg-card)]/20 rounded-none flex items-center justify-center">✅</div>
            <div>
              <p className="text-[10px] font-black uppercase">{isRtl ? 'تم البيع' : 'Order Complete'}</p>
              <p className="font-black">Invoice #{lastInvoice.serialNumber}</p>
            </div>
          </div>
          <InvoiceTemplate order={lastInvoice} currency={currency} language={language} storeName={storeName} logo={invoiceLogo} header={invoiceHeader} footer={invoiceFooter} activeShift={activeShift} users={users} />
          <button onClick={() => window.print()} className="bg-[var(--bg-card)] text-[#0066FF] px-4 py-2 font-black text-xs hover:scale-105 transition-transform uppercase">
            🖨️ {isRtl ? 'طباعة الإيصال' : 'Print Receipt'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function DashboardTab({ items, orders, customers, expenses, purchases, customerPayments, cashboxLog, activeShift, users, language }) {
  const t = T[language];
  const isRtl = language === 'ar';

  const getLocalDateKey = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };
  const todayKey = getLocalDateKey(new Date());

  const [dateFilter, setDateFilter] = useState('today');

  const isDateInRange = useCallback((timestamp) => {
    const d = new Date(timestamp);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return getLocalDateKey(d) === getLocalDateKey(now);
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return getLocalDateKey(d) === getLocalDateKey(yesterday);
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return d >= sevenDaysAgo;
    }
    return true;
  }, [dateFilter]);

  const stats = useMemo(() => {
    const filteredOrders = orders.filter(o => o.status !== 'VOIDED' && o.status !== 'REFUNDED' && isDateInRange(o.timestamp || new Date()));
    const gross = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
    const cashSales = filteredOrders.filter(o => o.paymentMethod === 'Cash').reduce((s, o) => s + (o.total || 0), 0);
    const cardSales = filteredOrders.filter(o => o.paymentMethod === 'Card').reduce((s, o) => s + (o.total || 0), 0);
    const filteredExp = expenses.filter(e => isDateInRange(e.timestamp || new Date())).reduce((s, e) => s + (e.amount || 0), 0);
    const receivables = customers.reduce((sum, c) => {
      const cOrders = orders.filter(o => o.customerId === c.id && o.status !== 'VOIDED' && o.status !== 'REFUNDED');
      const cTotal = cOrders.reduce((s, o) => s + (o.total || 0), 0);
      const cPaid = cOrders.reduce((s, o) => s + (o.amountPaid || 0), 0);
      const cPayments = customerPayments.filter(p => p.customerId === c.id).reduce((s, p) => s + (p.amount || 0), 0);
      return sum + Math.max(0, cTotal - cPaid - cPayments);
    }, 0);
    return { gross, cashSales, cardSales, count: filteredOrders.length, expenses: filteredExp, receivables };
  }, [orders, expenses, customerPayments, customers, isDateInRange]);

  const recentActivity = useMemo(() => {
    return orders
      .filter(o => isDateInRange(o.timestamp || new Date()))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  }, [orders, isDateInRange]);

  const topProducts = useMemo(() => {
    const filteredOrders = orders.filter(o => o.status !== 'VOIDED' && o.status !== 'REFUNDED' && isDateInRange(o.timestamp || new Date()));
    const counts = {};
    filteredOrders.forEach(o => {
      o.items.forEach(i => {
        const name = i.name?.en || i.name?.ar || i.name || 'Unknown';
        counts[name] = (counts[name] || 0) + i.quantity;
      });
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  }, [orders, isDateInRange]);

  const hourlySales = useMemo(() => {
    const filteredOrders = orders.filter(o => o.status !== 'VOIDED' && o.status !== 'REFUNDED' && isDateInRange(o.timestamp || new Date()));
    const hours = Array(24).fill(0);
    filteredOrders.forEach(o => {
      const hr = new Date(o.timestamp || new Date()).getHours();
      hours[hr] += o.total || 0;
    });
    const max = Math.max(...hours, 1);
    return hours.map(h => (h / max) * 100);
  }, [orders, isDateInRange]);

  const activeBranchNameLocal = localStorage.getItem('active_branch_name') || 'Main Branch';
  
  // Luxury UI Data Mocks for cross-branch (as full cloud aggregation runs on Edge)
  const branchAnalytics = [
    { name: activeBranchNameLocal, sales: stats.gross, target: stats.gross > 0 ? stats.gross * 1.5 : 1000 },
    { name: 'Maadi Hub', sales: stats.gross > 0 ? stats.gross * 0.4 : 0, target: 8000 },
    { name: 'Zayed Strip', sales: stats.gross > 0 ? stats.gross * 0.25 : 0, target: 5000 }
  ].sort((a, b) => b.sales - a.sales);
  const totalCorpSales = branchAnalytics.reduce((sum, b) => sum + b.sales, 0) || 1;

  // Live Safe Cash Monitor Mocks
  const currentBranchCash = (stats.cashSales || 0) + (Number(activeShift?.openingBalance) || 0) - (stats.expenses || 0);
  const safeBoxes = [
    { name: activeBranchNameLocal || (isRtl ? 'الفرع الرئيسي' : 'Main Branch'), netCash: currentBranchCash },
    { name: isRtl ? 'فرع المعادي' : 'Maadi Branch', netCash: currentBranchCash > 0 ? currentBranchCash * 0.8 : 4500 },
    { name: isRtl ? 'فرع زايد' : 'Zayed Branch', netCash: currentBranchCash > 0 ? currentBranchCash * 0.6 : 3200 }
  ];

  // Multi-Branch Low Stock Alerts
  const lowStockAlerts = useMemo(() => {
    const localLow = items.filter(i => (i.type || 'PRODUCT') === 'PRODUCT' && (i.stock || 0) > 0 && (i.stock || 0) < 5).map(i => ({ ...i, branchName: activeBranchNameLocal }));
    const mockLow = [
      { id: 'm1', name: { ar: 'قهوة اسبريسو', en: 'Espresso Beans' }, stock: 2, branchName: isRtl ? 'فرع المعادي' : 'Maadi Branch' },
      { id: 'm2', name: { ar: 'أكواب ورقية', en: 'Paper Cups' }, stock: 1, branchName: isRtl ? 'فرع زايد' : 'Zayed Branch' },
    ];
    return [...localLow, ...mockLow].sort((a,b) => a.stock - b.stock).slice(0, 3);
  }, [items, activeBranchNameLocal, isRtl]);

  const cashierName = users.find(u => u.id === activeShift?.userId)?.name || 'System';

  const StatCard = ({ label, value, color = 'text-slate-900 dark:text-zinc-100', bg = 'bg-white dark:bg-[#151518]', border = 'border-zinc-200 dark:border-[#D4AF37]/20' }) => (
    <div className={`${bg} ${border} border p-5 flex flex-col justify-between h-full transition-colors duration-200`}>
      <p className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-200 dark:border-[#D4AF37]/20 pb-1">{label}</p>
      <h2 className={`text-2xl font-black ${color}`}>{value}</h2>
    </div>
  );

  return (
    <div className="p-6 h-full overflow-auto space-y-8 bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 border-zinc-200 dark:border-[#D4AF37]/20 transition-colors duration-200" dir={isRtl ? 'rtl' : 'ltr'}>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{isRtl ? 'لوحة القيادة' : 'Command Center'}</h2>
        
        {/* Quick Time-Context Date Filters */}
        <div className="flex bg-[#111] border border-[#333] p-1 shadow-lg">
          {['today', 'yesterday', '7days'].map(tf => (
            <button key={tf} onClick={() => setDateFilter(tf)}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === tf ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_#D4AF37]' : 'text-slate-400 hover:text-white'}`}>
              {tf === 'today' ? (isRtl ? 'اليوم' : 'Today') : tf === 'yesterday' ? (isRtl ? 'أمس' : 'Yesterday') : (isRtl ? 'آخر ٧ أيام' : 'Last 7 Days')}
            </button>
          ))}
        </div>
      </div>

      {/* ── DAILY PULSE (Hero Section) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden bg-[var(--bg-sidebar)] p-6 border border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066FF] blur-[80px] opacity-20 -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-4">{isRtl ? 'إجمالي المبيعات' : 'Gross Revenue'}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-white tracking-tighter">{formatMoney(stats.gross)}</h2>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              {dateFilter === 'today' ? '↑ Today' : dateFilter === 'yesterday' ? 'Yesterday' : '7 Days'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/5 overflow-hidden">
              <div className="h-full bg-[#0066FF] transition-all duration-1000" style={{ width: '70%' }}></div>
            </div>
            <span className="text-[9px] font-black text-slate-400">{stats.count} OPS</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 border border-[var(--border-color)] relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] mb-4">{isRtl ? 'التحصيل النقدي' : 'Cash Liquidity'}</p>
              <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{formatMoney(stats.cashSales)}</h2>
            </div>
            <div className="w-10 h-10 bg-amber-500/10 flex items-center justify-center text-amber-500 text-xl font-bold">💵</div>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] mt-5 font-bold uppercase tracking-widest">{isRtl ? 'صافي الكاش المتوفر' : 'Net Cash in Hand'}</p>
        </div>

        <div className="bg-[var(--bg-card)] p-6 border border-[var(--border-color)] relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] mb-4">{isRtl ? 'مبيعات الكروت' : 'Digital Volume'}</p>
              <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{formatMoney(stats.cardSales)}</h2>
            </div>
            <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center text-blue-500 text-xl font-bold">💳</div>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] mt-5 font-bold uppercase tracking-widest">{isRtl ? 'تحصيل الشبكة' : 'Card & Bank Entries'}</p>
        </div>

        <div className="bg-[var(--bg-card)] p-6 border border-[var(--border-color)] border-b-4 border-rose-500/40">
          <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-[2px] mb-4">{isRtl ? 'إجمالي المصاريف' : 'Expense Burn'}</p>
          <h2 className="text-3xl font-black text-rose-500 tracking-tighter">{formatMoney(stats.expenses)}</h2>
          <div className="mt-5 flex justify-between items-center">
            <span className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">{isRtl ? 'خروج نقدي' : 'Outflow'}</span>
            <div className="flex -space-x-1">
              {[1, 2, 3].map(i => <div key={i} className="w-4 h-4 rounded-full bg-rose-500 opacity-20 border border-rose-500/50"></div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* ── CENTRAL COMMAND (Transactions & Analytics) ── */}
        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Real-time Feed */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[650px]">
            <div className="px-6 py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-deep)] shrink-0">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">{isRtl ? 'سجل العمليات الأخير' : 'Real-time Feed'}</h3>
                <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase">{isRtl ? 'آخر ٢٠ عملية تمت اليوم' : 'Latest 20 entries'}</p>
              </div>
              {!activeShift && (
                <div className="px-3 py-1 bg-amber-500/20 text-amber-600 text-[8px] font-black uppercase tracking-widest animate-pulse border border-amber-500/30">
                  {isRtl ? 'لا توجد وردية نشطة' : 'Shift Offline'}
                </div>
              )}
            </div>
            <div className="divide-y divide-[var(--border-color)] overflow-y-auto flex-1">
              {recentActivity.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 min-h-[200px]">
                  <span className="text-6xl mb-4">📡</span>
                  <p className="font-black text-xs uppercase tracking-[3px]">{isRtl ? 'بانتظار العمليات...' : 'Awaiting Signals...'}</p>
                </div>
              ) : recentActivity.map((order, idx) => (
                <div key={order.id} className="group flex items-center justify-between p-5 hover:bg-[var(--bg-deep)] transition-all cursor-default">
                  <div className="flex items-center gap-5">
                    <div className="text-[10px] font-black text-[var(--text-muted)] opacity-30 w-4">{recentActivity.length - idx}</div>
                    <div className={`w-11 h-11 flex items-center justify-center font-black ${order.status === 'VOIDED' ? 'bg-slate-100 text-slate-400' : 'bg-[#0066FF]/5 text-[#0066FF] border border-[#0066FF]/10'}`}>
                      {order.status === 'VOIDED' ? '✕' : order.paymentMethod === 'Cash' ? '💵' : '💳'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-[var(--text-primary)] text-sm">#{order.serialNumber}</p>
                        <span className="text-[8px] font-black bg-white/10 px-1.5 py-0.5 border border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-tighter">{order.paymentMethod}</span>
                      </div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 opacity-70">
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.items.length} {isRtl ? 'صنف' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className={`text-lg font-black ${order.status === 'VOIDED' ? 'text-slate-300 line-through decoration-rose-500' : 'text-[#0066FF]'}`}>{formatMoney(order.total)}</p>
                    <div className="flex justify-end gap-1.5 mt-1">
                      {order.status === 'PAID' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      {order.status === 'VOIDED' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                      <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t[order.status] || order.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Dynamic Analytics Widgets */}
          <div className="flex flex-col gap-6 max-h-[650px] overflow-y-auto pr-1">
            
            {/* Widget 1: Cross-Branch Performance */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shrink-0">
               <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-5 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_8px_#D4AF37]"></span> 
                 {isRtl ? 'أداء الفروع المباشر' : 'Live Branch Performance'}
               </h3>
               <div className="space-y-4">
                 {branchAnalytics.map(b => {
                   const pct = Math.min(100, Math.round((b.sales / totalCorpSales) * 100)) || 0;
                   return (
                     <div key={b.name} className="group">
                       <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                         <span className="text-[var(--text-primary)] tracking-widest group-hover:text-[#D4AF37] transition-colors">{b.name}</span>
                         <span className="text-white">{formatMoney(b.sales)} <span className="text-[var(--text-muted)]">({pct}%)</span></span>
                       </div>
                       <div className="h-1 bg-[var(--bg-deep)] overflow-hidden border border-[#222]">
                         <div className="h-full bg-gradient-to-r from-[#0066FF] to-[#D4AF37] transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            {/* Widget 2: Top Products */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 flex-1 min-h-[220px] flex flex-col">
               <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-4 shrink-0">{isRtl ? 'الأصناف الأكثر مبيعاً اليوم' : 'Top 5 Trending Products'}</h3>
               {topProducts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30 min-h-[120px]">
                    <span className="text-3xl mb-2 block">🛍️</span>
                    <p className="text-[9px] font-black uppercase tracking-[2px]">{isRtl ? 'لا توجد مبيعات بعد' : 'No sales yet'}</p>
                  </div>
               ) : (
                 <div className="space-y-4 overflow-y-auto pr-1">
                   {topProducts.map(([name, qty], idx) => {
                     const maxQty = topProducts[0][1] || 1;
                     const width = Math.round((qty / maxQty) * 100);
                     return (
                       <div key={name} className="flex items-center gap-3 group">
                         <div className="w-6 h-6 bg-[#111] border border-[#333] group-hover:border-[#D4AF37] text-[#D4AF37] text-[10px] font-black flex items-center justify-center shrink-0 transition-colors">{idx + 1}</div>
                         <div className="flex-1 min-w-0">
                           <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                             <span className="text-[var(--text-primary)] truncate max-w-[140px] tracking-wide">{name}</span>
                             <span className="text-[var(--text-muted)] shrink-0">{qty} {isRtl ? 'وحدة' : 'units'}</span>
                           </div>
                           <div className="h-0.5 bg-[var(--bg-deep)] overflow-hidden">
                             <div className="h-full bg-[#D4AF37] transition-all duration-1000 opacity-80 group-hover:opacity-100" style={{ width: `${width}%` }}></div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>

            {/* Widget 3: Hourly Sparkline */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shrink-0">
               <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">{isRtl ? 'مؤشر كثافة المبيعات بالساعة' : 'Hourly Sales Velocity'}</h3>
               <div className="flex items-end gap-[2px] h-14 pt-2 border-b border-[#222]">
                 {hourlySales.map((pct, i) => (
                   <div key={i} className="flex-1 flex flex-col justify-end group relative h-full cursor-default">
                     <div className="w-full bg-[#0066FF]/20 group-hover:bg-[#D4AF37] transition-all border-t border-[#0066FF]/40 group-hover:border-[#D4AF37]" style={{ height: `${Math.max(2, pct)}%` }}></div>
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#111] border border-[#333] text-[9px] text-[#D4AF37] font-black px-1.5 py-0.5 hidden group-hover:block z-10 whitespace-nowrap shadow-xl">
                       {String(i).padStart(2, '0')}:00
                     </div>
                   </div>
                 ))}
               </div>
            </div>

          </div>
        </div>

        {/* ── SIDEWINDER (Debt & Inventory) ── */}
        <div className="space-y-8">

          {/* Shift Monitor Card */}
          <div className={`p-6 border-t-4 ${activeShift ? 'bg-[var(--bg-card)] border-[#0066FF]' : 'bg-[var(--bg-sidebar)] border-slate-700'} shadow-xl`}>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'مراقبة الوردية' : 'Line Status'}</p>
              <div className={`flex items-center gap-2 px-2 py-1 ${activeShift ? 'bg-blue-500/10 text-[#0066FF]' : 'bg-slate-800 text-slate-500'} text-[8px] font-black uppercase tracking-widest`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeShift ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></span>
                {activeShift ? 'Live' : 'Offline'}
              </div>
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)] leading-tight">
              {activeShift ? cashierName : (isRtl ? 'المحطة مغلقة حالياً' : 'Terminal is currently inactive')}
            </h2>
            <p className="text-[10px] text-[var(--text-muted)] font-bold mt-2 uppercase tracking-widest">
              {activeShift ? `Started ${new Date(activeShift.openedAt).toLocaleTimeString()}` : 'Please start a shift to begin sales'}
            </p>
          </div>

          {/* Live Safe Cash Monitor (Multi-Branch) */}
          <div className="bg-[#111] border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.05)] overflow-hidden">
            <div className="p-4 border-b border-[#D4AF37]/20 flex justify-between items-center bg-gradient-to-r from-[#111] to-[#1a1a1a]">
              <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">{isRtl ? 'خزنة الفروع لايف' : 'Live Safe Monitor'}</h3>
              <span className="text-[10px] font-black text-[#0066FF] animate-pulse">● LIVE</span>
            </div>
            <div className="p-0 divide-y divide-[#222]">
              {safeBoxes.map((box, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center hover:bg-[#1a1a1a] transition-colors">
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest">{box.name}</span>
                  <span className="text-sm font-black text-emerald-400">{formatMoney(box.netCash)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Branch Low Stock Radar */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-deep)] flex justify-between items-center">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">⚠️ {isRtl ? 'تنبيهات نواقص الفروع' : 'Global Inventory Radar'}</h3>
              <span className="text-[8px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full tracking-tighter">CRITICAL</span>
            </div>
            <div className="p-2 divide-y divide-[var(--border-color)]">
              {lowStockAlerts.map(item => (
                <div key={item.id} className="p-3 flex items-center justify-between group hover:bg-[var(--bg-deep)] transition-colors">
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-black text-[var(--text-primary)] truncate max-w-[140px] tracking-wide">{item.name[language] || item.name.en || item.name}</p>
                    <p className="text-[9px] text-[#0066FF] font-black uppercase tracking-widest flex items-center gap-1">
                      <span>🏢</span> {item.branchName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-600">{item.stock}</p>
                    <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{isRtl ? 'باقي' : 'Left'}</p>
                  </div>
                </div>
              ))}
              {lowStockAlerts.length === 0 && (
                <div className="p-8 text-center opacity-30 flex flex-col items-center">
                  <span className="text-2xl mb-2 block">✅</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">{isRtl ? 'لا توجد نواقص' : 'All locations fully stocked'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Debt Center */}
          <div className="bg-[var(--bg-card)] border border-rose-500/20 overflow-hidden shadow-lg shadow-rose-500/5">
            <div className="p-5 border-b border-rose-500/10 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{isRtl ? 'مركز مديونيات العملاء' : 'Risk Management'}</h3>
              <div className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase">Credit</div>
            </div>
            <div className="p-0 divide-y divide-rose-500/5">
              {customers.map(c => {
                const cOrders = orders.filter(o => o.customerId === c.id && o.status !== 'VOIDED' && o.status !== 'REFUNDED');
                const spent = cOrders.reduce((s, o) => s + (o.total || 0), 0);
                const paid = cOrders.reduce((s, o) => s + (o.amountPaid || 0), 0) + customerPayments.filter(p => p.customerId === c.id).reduce((s, p) => s + (p.amount || 0), 0);
                const debt = Math.max(0, spent - paid);
                if (debt < 0.1) return null;
                return (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-rose-500/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-black text-rose-600 text-xs uppercase">{(c.name || '?')[0]}</div>
                      <div>
                        <p className="font-black text-[var(--text-primary)] text-xs truncate max-w-[100px]">{c.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-bold tracking-tighter">{c.phone}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="font-black text-rose-600 text-sm tracking-tight">{formatMoney(debt)}</p>
                      <div className="flex items-center justify-end gap-1">
                        <span className="w-1 h-1 rounded-full bg-rose-500"></span>
                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest text">Owed</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {stats.receivables <= 0.1 && (
                <div className="p-12 text-center">
                  <span className="text-3xl grayscale opacity-30">🤝</span>
                  <p className="text-[9px] font-black text-slate-300 mt-3 uppercase tracking-widest">{isRtl ? 'لا سجلات خطورة' : 'Zero Credit Risk'}</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-rose-500/10 flex justify-between items-center">
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">{isRtl ? 'المجموع' : 'Exposure'}</span>
              <span className="font-black text-rose-600">{formatMoney(stats.receivables)}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHIFTS SCREEN
// ============================================================
function ShiftScreen({ activeShift, shifts, onOpenShift, onCloseShift, currentUser, language, users, orders, expenses, onLogout, storeName, currency, drawerLogs }) {
  const [openingBal, setOpeningBal] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [shiftToPrint, setShiftToPrint] = useState(null);
  const isRtl = language === 'ar';

  const selectedShift = useMemo(() => shifts.find(s => s.id === selectedShiftId), [shifts, selectedShiftId]);
  const selectedInvoices = useMemo(() => selectedShift ? orders.filter(o => o.shiftId === selectedShift.id && o.status !== 'VOIDED' && o.status !== 'REFUNDED') : [], [selectedShift, orders]);
  const selectedExpenses = useMemo(() => selectedShift ? expenses.filter(e => e.shiftId === selectedShift.id) : [], [selectedShift, expenses]);

  // Fallback calculations for historical shifts that might not have the new data fields
  const displayStats = useMemo(() => {
    if (!selectedShift) return null;
    const cashSales = selectedInvoices.filter(o => o.paymentMethod === 'Cash' || !o.paymentMethod).reduce((s, o) => s + (o.total || 0), 0);
    const cardSales = selectedInvoices.filter(o => o.paymentMethod === 'Card').reduce((s, o) => s + (o.total || 0), 0);
    const creditSales = selectedInvoices.filter(o => o.paymentMethod === 'Credit').reduce((s, o) => s + (o.total || 0), 0);
    const totalExp = selectedExpenses.reduce((s, e) => s + (e.amount || 0), 0);

    return {
      cash: selectedShift.totalCashSales !== undefined ? selectedShift.totalCashSales : cashSales,
      card: selectedShift.totalCardSales !== undefined ? selectedShift.totalCardSales : cardSales,
      credit: selectedShift.totalCreditSales !== undefined ? selectedShift.totalCreditSales : creditSales,
      expenses: selectedShift.totalExpenses !== undefined ? selectedShift.totalExpenses : totalExp,
    };
  }, [selectedShift, selectedInvoices, selectedExpenses]);

  // STRICT MATH FROM LOGS
  const shiftAnalysis = useMemo(() => {
    const shift = selectedShift || activeShift;
    if (!shift) return null;
    const sLogs = drawerLogs.filter(l => l.shiftId === shift.id);
    const totalIn = sLogs.filter(l => l.type === 'IN').reduce((s, l) => s + Number(l.amount), 0);
    const totalOut = sLogs.filter(l => l.type === 'OUT').reduce((s, l) => s + Number(l.amount), 0);
    const net = totalIn - totalOut;
    const expected = Number(shift.openingBalance) + net;
    const actual = selectedShift ? (selectedShift.actualCash || 0) : (Number(actualCash) || 0);
    const v = actual - expected;
    return { net, expected, variance: v, totalIn, totalOut };
  }, [selectedShift, activeShift, drawerLogs, actualCash]);

  const handleOpen = () => {
    const bal = parseFloat(openingBal);
    if (isNaN(bal) || bal < 0) {
      alert(isRtl ? 'يرجى إدخال مبلغ الافتتاح أولاً' : 'Please enter opening balance first');
      return;
    }
    const shift = {
      id: 'SHF-' + Date.now().toString(36).toUpperCase(),
      userId: currentUser.id,
      openedAt: new Date(),
      openingBalance: bal,
      status: 'Open',
      expectedCash: bal,
      totalCashSales: 0, totalCardSales: 0, totalCreditSales: 0,
      totalCollections: 0, totalExpenses: 0, totalSupplierPayments: 0, totalRefunds: 0
    };
    onOpenShift(shift);
    setOpeningBal('');
  };

  const handleClose = () => {
    const actual = parseFloat(actualCash) || 0;
    onCloseShift(activeShift, actual);
    setActualCash('');
  };

  const shiftOrders = activeShift ? orders.filter(o => o.shiftId === activeShift.id && o.status !== 'VOIDED' && o.status !== 'REFUNDED') : [];
  const shiftTotal = shiftOrders.reduce((s, o) => s + (o.total || 0), 0);
  const shiftExp = expenses.filter(e => e.shiftId === activeShift?.id).reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Shift Status */}
        <div className={`p-8 rounded-none shadow-none flex flex-col gap-6 ${activeShift ? 'bg-[#0066FF] text-[var(--text-primary)]' : 'bg-slate-900 text-[var(--text-primary)]'}`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{isRtl ? 'حالة الوردية' : 'Shift Status'}</p>
            <h2 className="text-4xl font-black tracking-tighter mt-1">{activeShift ? (isRtl ? '✅ مفتوحة' : '✅ Open') : (isRtl ? '🔴 مغلقة' : '🔴 Closed')}</h2>
            {activeShift && (
              <div className="mt-4 space-y-2">
                <p className="text-sm opacity-80">ID: {activeShift.id}</p>
                <p className="text-sm opacity-80">{isRtl ? 'فتح في:' : 'Opened:'} {new Date(activeShift.openedAt).toLocaleString()}</p>
              </div>
            )}
          </div>

          {activeShift ? (
            <div className="space-y-4">
              {currentUser.role !== 'Cashier' && shiftAnalysis && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bg-card)]/10 p-4 rounded-none">
                    <p className="text-[9px] font-black uppercase opacity-70">{isRtl ? 'صافي الوردية (النشاط)' : 'Shift Activity Net'}</p>
                    <p className={`text-xl font-black ${shiftAnalysis.net >= 0 ? 'text-white' : 'text-rose-200'}`}>{formatMoney(shiftAnalysis.net)}</p>
                  </div>
                  <div className="bg-[var(--bg-card)]/10 p-4 rounded-none">
                    <p className="text-[9px] font-black uppercase opacity-70">{isRtl ? 'الرصيد المتوقع بالدرج' : 'Expected Drawer Cash'}</p>
                    <p className="text-xl font-black">{formatMoney(shiftAnalysis.expected)}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-2">{isRtl ? 'النقد الفعلي في الخزينة' : 'Actual Cash in Drawer'}</label>
                <input type="number" value={actualCash} onChange={e => setActualCash(e.target.value)} placeholder="0.00"
                  className="w-full bg-[var(--bg-card)]/10 border-2 border-white/20 rounded-none px-4 py-3 text-[var(--text-primary)] font-bold text-xl text-center outline-none focus:border-white/50 transition-all" />
              </div>
              <button onClick={handleClose} className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-[var(--text-primary)] font-black uppercase tracking-widest rounded-none transition-all">
                🔒 {isRtl ? 'إغلاق الوردية' : 'Close Shift'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-2">{isRtl ? '1. ادخل رصيد الافتتاح (نقدي)' : '1. Enter Opening Cash Balance'}</label>
                <input type="number" value={openingBal} onChange={e => setOpeningBal(e.target.value)} placeholder="0.00"
                  className="w-full bg-[var(--bg-card)]/10 border-2 border-[#0066FF] rounded-none px-4 py-3 text-[var(--text-primary)] font-bold text-3xl text-center outline-none focus:border-white/50 transition-all placeholder:opacity-30" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">{isRtl ? '2. اضغط على الزر لفتح الوردية' : '2. Click below to open shift'}</p>
              <button onClick={handleOpen} className="w-full py-4 bg-[#0066FF] hover:bg-[#0066FF] text-[var(--text-primary)] font-black uppercase tracking-widest rounded-none transition-all">
                🟢 {isRtl ? 'فتح وردية جديدة' : 'Open New Shift'}
              </button>
            </div>
          )}
        </div>

        {/* Shift History */}
        <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border-color)]">
            <h3 className="text-lg font-black text-[var(--text-primary)] uppercase">{isRtl ? 'سجل الورديات' : 'Shift History'}</h3>
          </div>
          <div className="overflow-y-auto max-h-80" style={{}}>
            {shifts.filter(s => s.status === 'Closed').length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-200">
                <span className="text-5xl">📋</span>
                <p className="font-black uppercase text-xs mt-2">{isRtl ? 'لا ورديات مغلقة' : 'No closed shifts'}</p>
              </div>
            ) : shifts.filter(s => s.status === 'Closed').slice(0, 20).map(shift => (
              <div key={shift.id} onClick={() => setSelectedShiftId(shift.id)}
                className="p-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-deep)] transition-all space-y-3 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-[#0066FF] text-sm group-hover:text-[#D4AF37] transition-colors">#{shift.id} <span className="ml-2 text-xs opacity-50">👁️</span></p>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{new Date(shift.openedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setShiftToPrint(shift); setTimeout(() => window.print(), 100); }} 
                      className="text-[9px] bg-[#0066FF] hover:bg-blue-700 text-white px-2 py-1 font-black uppercase flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-none">
                      🖨️ {isRtl ? 'طباعة' : 'Print'}
                    </button>
                    <span className="text-[8px] bg-slate-800 text-[var(--text-muted)] px-2 py-1 font-black uppercase tracking-widest">CLOSED</span>
                  </div>
                </div>

                {currentUser.role !== 'Cashier' && (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-[var(--bg-deep)]/40 p-2">
                      <p className="text-[8px] text-[var(--text-muted)] font-black uppercase">{isRtl ? 'مبيعات نقدية' : 'Cash Sales'}</p>
                      <p className="text-xs font-black text-[var(--text-primary)]">{formatMoney(shift.totalCashSales)}</p>
                    </div>
                    <div className="bg-[var(--bg-deep)]/40 p-2">
                      <p className="text-[8px] text-[var(--text-muted)] font-black uppercase">{isRtl ? 'مبيعات كروت' : 'Card Sales'}</p>
                      <p className="text-xs font-black text-blue-500">{formatMoney(shift.totalCardSales)}</p>
                    </div>
                    <div className="bg-[var(--bg-deep)]/40 p-2">
                      <p className="text-[8px] text-[var(--text-muted)] font-black uppercase">{isRtl ? 'المصروفات' : 'Expenses'}</p>
                      <p className="text-xs font-black text-rose-500">{formatMoney(shift.totalExpenses)}</p>
                    </div>
                    <div className="bg-[var(--bg-deep)]/40 p-2 border-l border-[#0066FF]">
                      <p className="text-[8px] text-[var(--text-muted)] font-black uppercase">{isRtl ? 'الرصيد النهائي' : 'Final Cash'}</p>
                      <p className="text-xs font-black text-[#D4AF37]">{formatMoney(shift.actualCash || 0)}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-[9px] font-bold text-[var(--text-muted)]">
                  <p>{isRtl ? 'بواسطة:' : 'By:'} {users?.find(u => u.id === shift.userId)?.name || 'System'}</p>
                  <p>{isRtl ? 'بدأ بـ:' : 'Started:'} {formatMoney(shift.openingBalance)}</p>
                  <p>{isRtl ? 'انتهى في:' : 'Ended:'} {new Date(shift.closedAt).toLocaleString() || '—'}</p>
                </div>
                {currentUser.role !== 'Cashier' && shift.cashVariance !== undefined && (
                  <div className={`p-2 text-center text-[10px] font-black uppercase tracking-widest ${Math.abs(shift.cashVariance) < 0.1 ? 'bg-emerald-500/10 text-[#0066FF]' : 'bg-rose-500/10 text-rose-500'}`}>
                    {isRtl ? 'الفرق في العجز/الزيادة:' : 'Cash Variance:'} {formatMoney(shift.cashVariance)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shift Details Modal */}
      {selectedShift && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setSelectedShiftId(null)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'تفاصيل الوردية' : 'Shift Analysis'}</h2>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{selectedShift.id} • {selectedShift.status}</p>
              </div>
              <button onClick={() => setSelectedShiftId(null)} className="w-10 h-10 bg-[var(--bg-deep)] flex items-center justify-center font-bold hover:bg-slate-800 transition-colors">✕</button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Timeline & Stats */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{isRtl ? 'وقت الفتح' : 'Opening Time'}</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{new Date(selectedShift.openedAt).toLocaleString()}</p>
                  </div>
                  {selectedShift.closedAt && (
                    <div>
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{isRtl ? 'وقت الإغلاق' : 'Closing Time'}</p>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{new Date(selectedShift.closedAt).toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{isRtl ? 'الموظف' : 'Staff Member'}</p>
                    <p className="text-sm font-bold text-[#0066FF]">{users?.find(u => u.id === selectedShift.userId)?.name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="bg-[var(--bg-deep)] p-5 border border-[var(--border-color)] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase">{isRtl ? 'رصيد الافتتاح' : 'Opening balance'}</span>
                    <span className="font-bold">{formatMoney(selectedShift.openingBalance)}</span>
                  </div>
                  {shiftAnalysis && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase">{isRtl ? 'صافي الوردية (نشاط)' : 'Shift Activity Net'}</span>
                        <span className={`font-black ${shiftAnalysis.net >= 0 ? 'text-[#0066FF]' : 'text-rose-500'}`}>
                          {formatMoney(shiftAnalysis.net)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-[var(--border-color)]">
                        <span className="text-[10px] font-black text-[var(--text-primary)] uppercase">{isRtl ? 'الرصيد المتوقع بالدرج' : 'Expected Drawer Cash'}</span>
                        <span className="font-black text-[#0066FF]">{formatMoney(shiftAnalysis.expected)}</span>
                      </div>
                      {selectedShift.actualCash !== undefined && (
                        <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center">
                          <span className="text-[10px] font-black text-emerald-400 uppercase">{isRtl ? 'النقدي الفعلي' : 'Actual Cash'}</span>
                          <span className="font-black text-emerald-400">{formatMoney(selectedShift.actualCash)}</span>
                        </div>
                      )}
                       <div className="pt-3 border-t-2 border-rose-500/50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-rose-500 uppercase">{isRtl ? 'العجز أو الزيادة' : 'Variance'}</span>
                        <span className={`font-black ${shiftAnalysis.variance >= 0 ? 'text-blue-500' : 'text-rose-600'}`}>
                          {formatMoney(shiftAnalysis.variance)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sales Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest border-b border-[var(--border-color)] pb-2">{isRtl ? 'تحليل المبيعات' : 'Sales Breakdown'}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    [isRtl ? 'نقدي' : 'Cash', displayStats.cash, 'bg-emerald-500/10 text-[#0066FF]'],
                    [isRtl ? 'بطاقة' : 'Card', displayStats.card, 'bg-blue-500/10 text-blue-500'],
                    [isRtl ? 'آجل' : 'Credit', displayStats.credit, 'bg-amber-500/10 text-amber-500'],
                  ].map(([label, val, color]) => (
                    <div key={label} className={`p-4 ${color}`}>
                      <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p>
                      <p className="text-lg font-black">{formatMoney(val)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-slate-900 p-4 border border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{isRtl ? 'إجمالي المبيعات' : 'Total Revenue'}</p>
                    <p className="text-xl font-black text-[var(--text-primary)]">{formatMoney(displayStats.cash + displayStats.card + displayStats.credit)}</p>
                  </div>
                  <div className="flex-1 bg-rose-500/10 p-4 border border-rose-500/10">
                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">{isRtl ? 'المصروفات' : 'Expenses'}</p>
                    <p className="text-xl font-black text-rose-500">{formatMoney(displayStats.expenses)}</p>
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest border-b border-[var(--border-color)] pb-2">{isRtl ? 'الفواتير' : 'Shift Invoices'}</h3>
                <div className="space-y-2">
                  {selectedInvoices.length === 0 ? (
                    <p className="text-center text-[var(--text-muted)] text-xs py-4">{isRtl ? 'لا توجد فواتير' : 'No invoices in this shift'}</p>
                  ) : selectedInvoices.map(order => (
                    <div key={order.id} className="flex justify-between items-center p-3 bg-[var(--bg-deep)] border border-[var(--border-color)]">
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">#{order.serialNumber}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase">{new Date(order.timestamp).toLocaleTimeString()} • {order.paymentMethod}</p>
                      </div>
                      <p className="font-black text-[var(--text-primary)]">{formatMoney(order.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[var(--border-color)] flex gap-4 bg-[var(--bg-deep)]">
              <button onClick={() => setSelectedShiftId(null)} className="flex-1 py-4 bg-[var(--bg-card)] text-[var(--text-muted)] font-black uppercase text-xs tracking-widest border border-[var(--border-color)]">
                {isRtl ? 'إغلاق' : 'Close Details'}
              </button>
              <button onClick={() => { if (window.confirm(isRtl ? 'هل تريد تسجيل الخروج؟' : 'Logout from program?')) onLogout(); }}
                className="px-8 py-4 bg-rose-600 text-[var(--text-primary)] font-black uppercase text-xs tracking-widest hover:bg-rose-700 transition-colors">
                🚪 {isRtl ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render invisible template specifically for @media print isolation */}
      <ShiftReportTemplate 
        shift={shiftToPrint} 
        storeName={storeName} 
        currency={currency} 
        isRtl={isRtl} 
        cashierName={users?.find(u => u.id === shiftToPrint?.userId)?.name} 
      />
    </div>
  );
}

// ============================================================
// SALES SCREEN
// ============================================================
function SalesScreen({ orders, users, customers, language, onVoidOrder, currency, storeName, invoiceLogo, invoiceHeader, invoiceFooter, activeShift }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const isRtl = language === 'ar';

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => {
      if (!search) return true;
      const s = search.trim().toLowerCase();
      const sn = o.serialNumber?.toString().toLowerCase() || '';
      const oid = o.id?.toString().toLowerCase() || '';
      const cName = customers.find(c => c.id === o.customerId)?.name.toLowerCase() || '';
      return sn === s || sn.includes(s) || oid.includes(s) || cName.includes(s);
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const statusColors = { PAID: 'bg-emerald-100 text-[#0066FF]', PARTIALLY_PAID: 'bg-amber-100 text-amber-700', UNPAID: 'bg-red-100 text-red-700', VOIDED: 'bg-[var(--bg-deep)] text-[var(--text-muted)]', REFUNDED: 'bg-slate-200 text-slate-500' };
  const t = T[language];

  return (
    <div className="p-6 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 relative min-w-48">
          <input type="text" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none px-10 py-3 text-sm font-bold outline-none" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</span>
        </div>
        {['all', 'PAID', 'PARTIALLY_PAID', 'UNPAID', 'VOIDED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-3 rounded-none font-black text-[10px] uppercase transition-all ${filter === s ? 'bg-slate-900 text-white' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-deep)]'}`}>
            {s === 'all' ? (isRtl ? 'الكل' : 'All') : (t[s] || s)}
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-[var(--border-color)] bg-[var(--bg-deep)]">
              {[isRtl ? 'رقم' : '#', isRtl ? 'التاريخ' : 'Date', isRtl ? 'العميل' : 'Customer', isRtl ? 'الإجمالي' : 'Total', isRtl ? 'طريقة الدفع' : 'Method', isRtl ? 'الحالة' : 'Status', ''].map(h => (
                <th key={h} className="px-6 py-4 text-start text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">{h}</th>
              ))}</tr></thead>
            <tbody>
              {filtered.slice(0, 50).map(order => (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-[var(--bg-deep)] transition-all">
                  <td className="px-6 py-4 font-black text-slate-700 text-sm">#{order.serialNumber}</td>
                  <td className="px-6 py-4 text-xs text-[var(--text-muted)] font-bold">{new Date(order.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-bold">{customers.find(c => c.id === order.customerId)?.name || (isRtl ? 'عميل نقدي' : 'Walk-in')}</td>
                  <td className="px-6 py-4 font-black text-[var(--text-primary)]">{formatMoney(order.total)}</td>
                  <td className="px-6 py-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-tighter">{order.paymentMethod}</td>
                  <td className="px-6 py-4"><span className={`text-[9px] font-black px-3 py-1 rounded-none ${statusColors[order.status] || 'bg-[var(--bg-deep)] text-[var(--text-muted)]'}`}>{t[order.status] || order.status}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4 justify-end">
                      <button onClick={() => setSelectedOrderId(order.id)} className="text-[#0066FF] hover:text-[#D4AF37] text-[10px] font-black uppercase tracking-widest transition-colors">{isRtl ? 'تفاصيل' : 'Details'}</button>
                      {order.status !== 'VOIDED' && order.status !== 'REFUNDED' && (
                        <button onClick={() => { if (window.confirm(isRtl ? 'تأكيد الارتجاع؟' : 'Refund invoice?')) onVoidOrder(order.id, 'Refund'); }}
                          className="text-rose-400 hover:text-rose-600 text-[10px] font-black uppercase transition-colors">
                          {isRtl ? 'مرتجع' : 'Refund'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center text-slate-200">
              <span className="text-5xl">🧾</span>
              <p className="font-black uppercase text-xs mt-2">{isRtl ? 'لا فواتير' : 'No invoices found'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Invoice Details */}
      {selectedOrderId && (() => {
        const order = orders.find(o => o.id === selectedOrderId);
        if (!order) return null;
        const customer = customers.find(c => c.id === order.customerId);
        return (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setSelectedOrderId(null)}>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg shadow-none overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-deep)] shrink-0">
                <div>
                  <h3 className="font-black text-lg text-[var(--text-primary)] uppercase">{isRtl ? 'تفاصيل الفاتورة' : 'Invoice Details'}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-black">#{order.serialNumber} • {new Date(order.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => window.print()} className="bg-[#0066FF] text-[var(--text-primary)] px-3 py-2 text-[10px] font-black uppercase flex items-center gap-2 hover:opacity-80 transition-opacity">
                    🖨️ {isRtl ? 'طباعة' : 'Print'}
                  </button>
                  <button onClick={() => setSelectedOrderId(null)} className="w-8 h-8 flex items-center justify-center font-bold bg-[var(--bg-card)] rounded-none text-[var(--text-muted)] border border-[var(--border-color)]">✕</button>
                </div>
              </div>
              <InvoiceTemplate order={order} currency={currency} language={language} storeName={storeName} logo={invoiceLogo} header={invoiceHeader} footer={invoiceFooter} activeShift={activeShift} users={users} />

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-color)] pb-1">{isRtl ? 'الأصناف' : 'Items'}</p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 text-sm">
                      <div>
                        <p className="font-bold text-slate-700">{item.name[language] || item.name.en}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold">{item.quantity} x {formatMoney(item.priceAtOrder)}</p>
                      </div>
                      <p className="font-black text-slate-800">{formatMoney(item.quantity * item.priceAtOrder)}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[var(--bg-deep)] p-4 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[var(--text-muted)]"><span>{isRtl ? 'المجموع الجزئي' : 'Subtotal'}</span><span>{formatMoney(order.subtotal)}</span></div>
                  <div className="flex justify-between text-xs font-bold text-[var(--text-muted)]"><span>{isRtl ? 'الضريبة' : 'VAT (14%)'}</span><span>{formatMoney(order.vat)}</span></div>
                  <div className="flex justify-between text-lg font-black text-[#0066FF] pt-2 border-t border-[var(--border-color)]"><span>{isRtl ? 'الإجمالي' : 'Total'}</span><span>{formatMoney(order.total)}</span></div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--text-muted)]">
                  <span className="bg-slate-200 px-2 py-0.5">{order.paymentMethod}</span>
                  <span className={`${order.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} px-2 py-0.5`}>{t[order.status]}</span>
                  <span className="ml-auto">{isRtl ? 'العميل:' : 'Customer:'} {customer?.name || (isRtl ? 'نقدي' : 'Walk-in')}</span>
                </div>

                {/* Items Table for Partial Refund - Now inside scrollable body */}
                <div className="space-y-2 pt-4">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest border-b border-rose-100 pb-1">{isRtl ? 'إدارة المرتجعات' : 'Returns Management'}</p>
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--bg-deep)] text-[var(--text-muted)] font-black uppercase text-[9px]">
                      <tr>
                        <th className="px-2 py-2 text-start">{isRtl ? 'الصنف' : 'Item'}</th>
                        <th className="px-2 py-2 text-center">{isRtl ? 'الكمية' : 'Qty'}</th>
                        <th className="px-2 py-2 text-end">{isRtl ? 'الإجمالي' : 'Total'}</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="px-2 py-3 font-bold">{item.name[language]}</td>
                          <td className="px-2 py-3 text-center">{item.quantity}</td>
                          <td className="px-2 py-3 text-end font-black">{formatMoney(item.quantity * item.priceAtOrder)}</td>
                          <td className="px-2 py-3 text-end">
                            {order.status !== 'VOIDED' && order.status !== 'REFUNDED' && (
                              <button onClick={() => { if (window.confirm(isRtl ? 'ارتجاع هذا الصنف؟' : 'Refund this item?')) onVoidOrder(order.id, 'Partial', item); }} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors">🔙</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 border-t border-[var(--border-color)] flex gap-3 shrink-0">
                <button onClick={() => setSelectedOrderId(null)} className="flex-1 py-4 bg-[var(--bg-deep)] text-[var(--text-muted)] font-bold uppercase text-xs">
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
                {order.status !== 'VOIDED' && order.status !== 'REFUNDED' && (
                  <button onClick={() => { if (window.confirm(isRtl ? 'تأكيد المرتجع؟' : 'Confirm refund?')) { onVoidOrder(order.id, 'Refund'); setSelectedOrderId(null); } }}
                    className="flex-1 py-4 bg-red-600 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20">
                    🔙 {isRtl ? 'مرتجع الفاتورة بالكامل' : 'Full Invoice Return'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ============================================================
// INVENTORY SCREEN
// ============================================================
function InventoryScreen({ items, categories, modifiers, onAddCategory, onAddItem, onUpdateItem, onDeleteItem, language }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name_en: '', name_ar: '', basePrice: '', costPrice: '',
    categoryId: 'cat_1', stock: '', barcode: '', image: '', type: 'PRODUCT',
    itemModifiers: []
  });
  const [showCatForm, setShowCatForm] = useState(false);
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catIcon, setCatIcon] = useState('📦');

  const isRtl = language === 'ar';

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleAddCat = () => {
    if (!catNameEn.trim()) return;
    onAddCategory({ id: 'cat_' + Date.now(), name: { en: catNameEn, ar: catNameAr || catNameEn }, icon: catIcon });
    setShowCatForm(false);
    setCatNameEn(''); setCatNameAr('');
  };

  const handleSave = () => {
    if (!form.name_en.trim()) return;
    const item = {
      id: editItem?.id || 'ITEM-' + Date.now(),
      name: { en: form.name_en, ar: form.name_ar || form.name_en },
      basePrice: parseFloat(form.basePrice) || 0,
      costPrice: parseFloat(form.costPrice) || 0,
      categoryId: form.categoryId,
      stock: parseInt(form.stock) || 0,
      image: form.image || 'https://via.placeholder.com/300x300?text=☕',
      sizes: editItem?.sizes || [{ id: 'sz1', name: 'M', priceDelta: 0 }],
      modifiers: form.itemModifiers,
      isActive: true,
      type: form.type,
      barcode: form.barcode || '',
      sku: editItem?.sku || (Math.floor(1000 + Math.random() * 9000)).toString()
    };
    if (editItem) onUpdateItem(item);
    else onAddItem(item);
    setShowForm(false);
    setEditItem(null);
    setForm({ name_en: '', name_ar: '', basePrice: '', costPrice: '', categoryId: 'cat_1', stock: '', barcode: '', image: '', type: 'PRODUCT', itemModifiers: [] });
  };

  const toggleModifier = (modId) => {
    setForm(prev => ({
      ...prev,
      itemModifiers: prev.itemModifiers.includes(modId)
        ? prev.itemModifiers.filter(id => id !== modId)
        : [...prev.itemModifiers, modId]
    }));
  };

  return (
    <div className="p-6 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'إدارة المخزون' : 'Inventory Management'}</h2>
        <button onClick={() => {
          setEditItem(null);
          setForm({ name_en: '', name_ar: '', basePrice: '', costPrice: '', categoryId: 'cat_1', stock: '', barcode: '', image: '', type: 'PRODUCT', itemModifiers: [] });
          setShowForm(true);
        }}
          className="bg-[#0066FF] text-white px-6 py-3 rounded-none font-black text-xs uppercase tracking-widest">
          + {isRtl ? 'صنف جديد' : 'New Item'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
            <h3 className="font-black text-[var(--text-primary)] uppercase">{editItem ? (isRtl ? 'تعديل صنف' : 'Edit Item') : (isRtl ? 'إضافة صنف جديد' : 'Add New Item')}</h3>
            <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)]">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-[var(--bg-deep)] p-4 border border-[var(--border-color)]">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-3">{isRtl ? 'تصنيف الصنف' : 'Item Classification'}</label>
                <div className="flex gap-2">
                  {[['PRODUCT', isRtl ? '🛍️ منتج للبيع' : '🛍️ Saleable'], ['RAW', isRtl ? '🥛 مادة خام' : '🥛 Raw Material']].map(([v, l]) => (
                    <button key={v} onClick={() => setForm({ ...form, type: v, categoryId: v === 'RAW' ? 'cat_6' : form.categoryId })}
                      className={`flex-1 py-3 px-2 font-black text-[10px] uppercase border-2 transition-all ${form.type === v ? 'bg-[#0066FF] border-[#0066FF] text-white' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'الاسم (EN)' : 'Name (EN)'}</label>
                  <input type="text" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 text-sm font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'الاسم (AR)' : 'Name (AR)'}</label>
                  <input type="text" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 text-sm font-bold outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'سعر البيع' : 'Sale Price'}</label>
                  <input type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })}
                    disabled={form.type === 'RAW'}
                    className={`w-full bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 text-sm font-bold outline-none ${form.type === 'RAW' ? 'opacity-50' : ''}`} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'التكلفة' : 'Cost Price'}</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 text-sm font-bold outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'الفئة' : 'Category'}</label>
                  <div className="flex gap-2">
                    <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                      className="flex-1 bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 text-sm font-bold outline-none">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name[language]}</option>)}
                    </select>
                    <button onClick={(e) => { e.preventDefault(); setShowCatForm(true); }} className="px-4 bg-slate-100 text-[var(--text-muted)] font-black text-xl hover:bg-[#0066FF] hover:text-white transition-colors">+</button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'المخزون الأولي' : 'Initial Stock'}</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 text-sm font-bold outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#D4AF37] uppercase block mb-1 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_5px_#D4AF37]"></span>
                  {isRtl ? 'الباركود / SKU' : 'Barcode / SKU'}
                </label>
                <input type="text" value={form.barcode || ''} onChange={e => setForm({ ...form, barcode: e.target.value })}
                  placeholder={isRtl ? 'امسح الباركود هنا...' : 'Scan barcode here...'}
                  className="w-full bg-[#111] border border-[#333] p-3 text-sm font-bold outline-none text-[#D4AF37] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'صورة المنتج' : 'Product Image'}</label>
                <div className="aspect-[16/9] border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-deep)] flex flex-col items-center justify-center relative group overflow-hidden">
                  {form.image ? (
                    <img src={form.image} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-4xl text-slate-300">📸</span>
                      <p className="text-[10px] font-black text-[var(--text-muted)] mt-2 uppercase tracking-widest">{isRtl ? 'رفع صورة' : 'Upload Image'}</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  {form.image && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <button onClick={(e) => { e.stopPropagation(); setForm({ ...form, image: '' }); }} className="bg-rose-600 text-white px-4 py-2 text-[10px] font-black uppercase">{isRtl ? 'إزالة' : 'Remove'}</button>
                    </div>
                  )}
                </div>
              </div>

              {form.type === 'PRODUCT' && (
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-2">{isRtl ? 'الإضافات المتاحة' : 'Available Modifiers (Extras)'}</label>
                  <div className="bg-[var(--bg-deep)] border border-[var(--border-color)] p-4 max-h-48 overflow-y-auto grid grid-cols-2 gap-2" style={{}}>
                    {modifiers.map(m => (
                      <button key={m.id} onClick={() => toggleModifier(m.id)}
                        className={`flex items-center gap-2 p-2 text-[10px] font-bold border ${form.itemModifiers.includes(m.id) ? 'bg-[#0066FF] border-[#0066FF] text-white' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'}`}>
                        <span className="w-4 h-4 border flex items-center justify-center bg-white/10">{form.itemModifiers.includes(m.id) ? '✓' : ''}</span>
                        {m.name[language]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
            <button onClick={handleSave} className="flex-1 bg-[#0066FF] text-white py-4 rounded-none font-black text-xs uppercase tracking-widest hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
              <span>💾</span> {isRtl ? 'حفظ الصنف' : 'Save Product'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-8 bg-[var(--bg-deep)] text-slate-600 py-4 rounded-none font-black text-xs uppercase">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </div>
      )}

      {showCatForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 max-w-sm w-full space-y-6 shadow-none">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'فئة جديدة' : 'New Category'}</h3>
              <button onClick={() => setShowCatForm(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">Name (EN)</label>
                <input type="text" value={catNameEn} onChange={e => setCatNameEn(e.target.value)} className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 font-bold text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">Name (AR)</label>
                <input type="text" value={catNameAr} onChange={e => setCatNameAr(e.target.value)} className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 font-bold text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">Icon (Emoji)</label>
                <input type="text" value={catIcon} onChange={e => setCatIcon(e.target.value)} className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 font-bold text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={handleAddCat} className="flex-1 py-4 bg-[#0066FF] text-white font-black text-xs uppercase tracking-widest">{isRtl ? 'تأكيد الإضافة' : 'Confirm Add'}</button>
              <button onClick={() => setShowCatForm(false)} className="flex-1 py-4 bg-[var(--bg-deep)] text-slate-600 font-black text-xs uppercase">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-[var(--border-color)] bg-[var(--bg-deep)]">
            {[isRtl ? 'الصنف' : 'Item', isRtl ? 'الفئة' : 'Category', isRtl ? 'سعر البيع' : 'Price', isRtl ? 'التكلفة' : 'Cost', isRtl ? 'المخزون' : 'Stock', ''].map(h => (
              <th key={h} className={`px-6 py-4 text-start text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest`}>{h}</th>
            ))}</tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-[var(--bg-deep)] transition-all">
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-4 ${isRtl ? 'flex-row' : 'flex-row'}`}>
                    <img src={item.image} onError={e => e.target.style.display = 'none'} className="w-12 h-12 rounded-none object-cover border border-[var(--border-color)]" alt="" />
                    <div className="space-y-0.5">
                      <p className="font-black text-[var(--text-primary)] text-sm leading-tight">{item.name[language]}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold tracking-tighter">SKU: {item.sku || item.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-[var(--text-muted)] font-extrabold uppercase">{categories.find(c => c.id === item.categoryId)?.name[language]}</td>
                <td className="px-6 py-4 font-black text-[var(--text-primary)] text-sm">{formatMoney(item.basePrice)}</td>
                <td className="px-6 py-4 text-[var(--text-muted)] font-bold text-xs">{formatMoney(item.costPrice || 0)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black px-4 py-1.5 ${item.stock <= 0 ? 'bg-rose-500/20 text-rose-500' : item.stock <= 5 ? 'bg-amber-500/20 text-amber-500' : 'bg-[#0066FF]/10 text-[#0066FF]'}`}>
                    {item.stock}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4 justify-end">
                    <button onClick={() => {
                      setEditItem(item);
                      setForm({
                        name_en: item.name.en, name_ar: item.name.ar,
                        basePrice: item.basePrice, costPrice: item.costPrice || '',
                        categoryId: item.categoryId, stock: item.stock, barcode: item.barcode || '',
                        image: item.image, type: item.type || 'PRODUCT',
                        itemModifiers: item.modifiers || []
                      });
                      setShowForm(true);
                    }}
                      className="text-[#D4AF37] hover:text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest">{isRtl ? 'تعديل' : 'Edit'}</button>
                    <button onClick={() => { if (window.confirm(isRtl ? 'حذف الصنف؟' : 'Delete item?')) onDeleteItem(item.id); }}
                      className="text-rose-500/50 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest">{isRtl ? 'حذف' : 'Del'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ============================================================
// PURCHASES SCREEN
// ============================================================
// SIMPLE PLACEHOLDER SCREENS
// ============================================================
function PlaceholderScreen({ title, icon, language }) {
  const isRtl = language === 'ar';
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-300" dir={isRtl ? 'rtl' : 'ltr'}>
      <span className="text-8xl">{icon}</span>
      <h2 className="text-2xl font-black uppercase tracking-widest text-[var(--text-muted)]">{title}</h2>
      <p className="text-sm font-bold text-slate-300">{isRtl ? 'هذا القسم متاح في النسخة الكاملة' : 'Full functionality available in production'}</p>
    </div>
  );
}

// ============================================================
// CUSTOMERS SCREEN
// ============================================================
function CustomersScreen({ customers, orders, customerPayments, onAddCustomer, onAddCustomerPayment, language }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const isRtl = language === 'ar';

  const handleCollect = () => {
    const amt = parseFloat(payAmount);
    if (!payModal || isNaN(amt) || amt <= 0) return;
    onAddCustomerPayment({
      id: 'CPM-' + Date.now(),
      customerId: payModal.id,
      amount: amt,
      timestamp: new Date(),
      note: 'Payment Collection'
    });
    setPayModal(null);
    setPayAmount('');
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddCustomer({ id: 'CUST-' + Date.now(), name: name.trim(), phone: phone.trim(), email: email.trim(), createdAt: new Date() });
    setName(''); setPhone(''); setEmail(''); setShowForm(false);
  };

  return (
    <div className="p-6 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'إدارة العملاء' : 'Customers'}</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#0066FF] text-white px-6 py-3 rounded-none font-black text-xs uppercase">+ {isRtl ? 'عميل جديد' : 'New Customer'}</button>
      </div>

      {showForm && (
        <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[[name, setName, isRtl ? 'الاسم' : 'Name'], [phone, setPhone, isRtl ? 'الهاتف' : 'Phone'], [email, setEmail, isRtl ? 'البريد' : 'Email']].map(([val, setter, label]) => (
              <div key={label}>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{label}</label>
                <input type="text" value={val} onChange={e => setter(e.target.value)}
                  className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} className="bg-[#0066FF] text-[var(--text-primary)] px-6 py-3 rounded-none font-black text-xs uppercase">{isRtl ? 'إضافة' : 'Add'}</button>
            <button onClick={() => setShowForm(false)} className="bg-[var(--bg-deep)] text-slate-600 px-6 py-3 rounded-none font-black text-xs uppercase">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(c => {
          const cOrders = orders.filter(o => o.customerId === c.id && o.status !== 'VOIDED' && o.status !== 'REFUNDED');
          const totalSpent = cOrders.reduce((s, o) => s + (o.total || 0), 0);
          const totalPaid = cOrders.reduce((s, o) => s + (o.amountPaid || 0), 0) + customerPayments.filter(p => p.customerId === c.id).reduce((s, p) => s + (p.amount || 0), 0);
          const debt = Math.max(0, totalSpent - totalPaid);
          return (
            <div key={c.id} className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] p-6 shadow-none hover:border-[#0066FF]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#0066FF] text-[var(--text-primary)] rounded-none flex items-center justify-center font-black text-xl">{(c.name || '?')[0]}</div>
                    <div>
                      <p className="font-black text-[var(--text-primary)] text-base">{c.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{c.phone || 'NO PHONE'}</p>
                    </div>
                  </div>
                  {debt > 0 && <span className="text-[8px] bg-rose-500 text-white px-2 py-0.5 font-black uppercase tracking-widest animate-pulse">DEBT</span>}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-[var(--bg-deep)] rounded-none p-4 border border-[var(--border-color)]">
                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'إجمالي المشتريات' : 'Purchases'}</p>
                    <p className="font-black text-slate-700 text-sm leading-none">{formatMoney(totalSpent)}</p>
                  </div>
                  <div className={`rounded-none p-4 border ${debt > 0 ? 'bg-rose-50 border-rose-100' : 'bg-[#0066FF]/5 border-[#0066FF]/10'}`}>
                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'الرصيد المتبقي' : 'Outstanding'}</p>
                    <p className={`font-black text-sm leading-none ${debt > 0 ? 'text-rose-600' : 'text-[#0066FF]'}`}>{debt > 0 ? formatMoney(debt) : '✓ PAID'}</p>
                  </div>
                </div>
              </div>
              <button disabled={debt <= 0} onClick={() => { setPayModal(c); setPayAmount(debt.toFixed(2)); }}
                className="w-full py-4 bg-[#0066FF] text-white font-black text-xs uppercase tracking-widest disabled:opacity-20 hover:scale-[1.02] transition-all">
                💰 {isRtl ? 'تحصيل مبلغ' : 'Collect Payment'}
              </button>
            </div>
          );
        })}
        {customers.length === 0 && (
          <div className="col-span-3 h-40 flex flex-col items-center justify-center text-slate-200">
            <span className="text-5xl">👤</span>
            <p className="font-black uppercase text-xs mt-2">{isRtl ? 'لا عملاء مسجلين' : 'No customers yet'}</p>
          </div>
        )}
      </div>
      {/* Payment Receipt Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 max-w-sm w-full space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'سند قبض' : 'Recording Payment'}</h3>
                <p className="text-xs text-[var(--text-muted)] font-bold uppercase">{payModal.name}</p>
              </div>
              <button onClick={() => setPayModal(null)} className="text-slate-400">✕</button>
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'المبلغ المحصل' : 'Collected Amount'}</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="w-full bg-[var(--bg-deep)] border-2 border-[#0066FF] rounded-none px-4 py-4 text-2xl font-black outline-none" autoFocus />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={handleCollect} className="flex-1 py-4 bg-[#0066FF] text-white font-black text-xs uppercase tracking-widest">{isRtl ? 'تأكيد القبض' : 'Confirm Reciept'}</button>
              <button onClick={() => setPayModal(null)} className="flex-1 py-4 bg-[var(--bg-deep)] text-slate-600 font-black text-xs uppercase">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// EXPENSES SCREEN
// ============================================================
function ExpensesScreen({ expenses, onAddExpense, currentUser, activeShift, language, setDrawerBalance, setDrawerLogs, setMainSafeBalance, setCashLog }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('General');
  const [paymentSource, setPaymentSource] = useState('drawer');
  const isRtl = language === 'ar';
  
  const expenseTypes = {
    en: ["General", "Utilities", "Maintenance", "Staff Advance"],
    ar: ["عام", "فواتير وخدمات", "صيانة", "سلفة موظف"]
  };

  const handleAdd = () => {
    if (!name.trim() || !amount) return;
    
    const amt = Number(amount);
    
    if (paymentSource === 'drawer') {
      if (setDrawerBalance) setDrawerBalance(prev => prev - amt);
      if (setDrawerLogs) setDrawerLogs(prev => [{ id: 'DL-EXP-' + Date.now(), type: 'OUT', amount: amt, note: `مصروف: ${name.trim()}`, timestamp: new Date(), shiftId: activeShift?.id || 'manual' }, ...prev]);
    } else if (paymentSource === 'safe') {
      const expId = 'EXP-' + Date.now();
      if (setMainSafeBalance) setMainSafeBalance(prev => prev - amt);
      if (setCashLog) setCashLog(prev => [{ id: 'SAFE-' + expId, type: 'EXPENSE_CASH', direction: 'OUT', amount: amt, note: `مصروف: ${name.trim()}`, createdAt: Date.now(), affectsDrawer: true, userId: currentUser?.id, refId: expId }, ...prev]);
    }

  onAddExpense({ 
    id: 'EXP-' + Date.now(), 
    name: name.trim(), 
    description: desc.trim(), 
    amount: amt, 
    timestamp: new Date(), 
    userId: currentUser.id, 
    shiftId: paymentSource === 'drawer' ? (activeShift?.id || 'manual') : null,
    source: paymentSource,
    category: expenseCategory
  });
    setName(''); setAmount(''); setDesc(''); setExpenseCategory('General'); setPaymentSource('drawer');
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] p-6 space-y-4">
          <h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'إضافة مصروف' : 'Add Expense'}</h3>
          {!activeShift && <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold p-3 rounded-none">{isRtl ? 'تنبيه: لا توجد وردية مفتوحة' : 'Warning: No active shift'}</div>}
          
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'نوع المصروف' : 'Expense Category'}</label>
            <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)}
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none">
              {expenseTypes[isRtl ? 'ar' : 'en'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'مصدر الدفع' : 'Payment Source'}</label>
            <select value={paymentSource} onChange={e => setPaymentSource(e.target.value)}
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none border-t-2 border-[#0066FF]">
              <option value="drawer">{isRtl ? 'درج الكاشير' : 'Drawer'}</option>
              <option value="safe">{isRtl ? 'الخزينة الرئيسية' : 'Main Safe'}</option>
            </select>
          </div>

          {[
            [name, setName, isRtl ? 'اسم المصروف' : 'Expense Name', 'text'],
            [amount, setAmount, isRtl ? 'المبلغ' : 'Amount', 'number'],
            [desc, setDesc, isRtl ? 'الوصف' : 'Description', 'text'],
          ].map(([val, setter, label, type]) => (
            <div key={label}>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{label}</label>
              <input type={type} value={val} onChange={e => setter(e.target.value)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" />
            </div>
          ))}
          <button onClick={handleAdd} disabled={!name.trim() || !amount}
            className="w-full bg-rose-600 text-white font-black py-3 hover:bg-rose-700 hover:text-white disabled:bg-slate-300 disabled:text-slate-500 transition-colors">
            {isRtl ? 'تسجيل المصروف' : 'Record Expense'}
          </button>
        </div>

        <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
            <h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'سجل المصروفات' : 'Expense History'}</h3>
            <span className="bg-rose-50 text-rose-600 font-black text-sm px-4 py-2 rounded-none">{formatMoney(total)}</span>
          </div>
          <div className="overflow-y-auto max-h-96" style={{}}>
            {expenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-[var(--bg-deep)]">
                <div>
                  <p className="font-black text-[var(--text-primary)] text-sm">{exp.name} <span className="text-xs text-slate-400 font-normal">{exp.category ? `(${exp.category})` : ''}</span></p>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold">{exp.description || '—'} • {new Date(exp.timestamp).toLocaleString()}</p>
                </div>
                <p className="font-black text-rose-600">{formatMoney(exp.amount)}</p>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center text-slate-200">
                <span className="text-5xl">💸</span>
                <p className="font-black uppercase text-xs mt-2">{isRtl ? 'لا مصروفات' : 'No expenses'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DRAWER SCREEN
// ============================================================
function DrawerScreen({ activeShift, drawerBalance, setDrawerBalance, setMainSafeBalance, drawerLogs, setDrawerLogs, currency, isRtl, setCashLog, currentUser }) {
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddChange, setShowAddChange] = useState(false);
  const [amount, setAmount] = useState('');

  if (!activeShift) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-10 max-w-sm w-full rounded-none">
          <span className="text-6xl mb-6 block">🔒</span>
          <p className="font-black text-[var(--text-primary)] uppercase tracking-widest leading-relaxed text-sm">
            {isRtl ? 'برجاء فتح وردية أولاً للتحكم في الدرج' : 'Please open a shift first to manage the cash drawer'}
          </p>
        </div>
      </div>
    );
  }

  const shiftLogs = drawerLogs.filter(log => log.shiftId === activeShift.id);
  const totalIn = shiftLogs.filter(log => log.type === 'IN').reduce((sum, log) => sum + (Number(log.amount) || 0), 0);
  const totalOut = shiftLogs.filter(log => log.type === 'OUT').reduce((sum, log) => sum + (Number(log.amount) || 0), 0);

  const handleTransfer = () => {
    const val = Number(amount);
    if (!val || val <= 0) return;
    if (val > drawerBalance) return alert(isRtl ? 'الرصيد لا يكفي' : 'Insufficient drawer balance');
    
    setDrawerBalance(prev => prev - val);
    setMainSafeBalance(prev => prev + val);
    const newLog = { id: 'DL-' + Date.now(), type: 'OUT', amount: val, note: isRtl ? 'ترحيل للخزينة' : 'Transfer to Safe', timestamp: new Date(), shiftId: activeShift.id };
    setDrawerLogs(prev => [newLog, ...prev]);

    // Push into the safe's ledger naturally
    if (setCashLog) {
      setCashLog(prev => [{
        id: 'SAFE-' + Date.now(),
        type: 'IN', // 'IN' means income into the safe!
        direction: 'IN',
        amount: val,
        note: isRtl ? 'ترحيل نقدية من الدرج' : 'Cash transfer from drawer',
        timestamp: new Date(),
        createdAt: Date.now(),
        userId: currentUser?.id,
        refId: activeShift.id,
        affectsDrawer: true
      }, ...prev]);
    }

    setShowTransfer(false);
    setAmount('');
  };

  const handleAddChange = () => {
    const val = Number(amount);
    if (!val || val <= 0) return;
    
    setDrawerBalance(prev => prev + val);
    const newLog = { id: 'DL-' + Date.now(), type: 'IN', amount: val, note: isRtl ? 'إيداع فكة' : 'Add Change', timestamp: new Date(), shiftId: activeShift.id };
    setDrawerLogs(prev => [newLog, ...prev]);
    setShowAddChange(false);
    setAmount('');
  };

  const HeaderCard = ({ title, value, icon, color }) => (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 flex items-center justify-between shadow-none relative overflow-hidden group">
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-[var(--text-muted)]">{title}</p>
        <p className={`text-2xl font-black ${color}`}>{value} <span className="text-[10px] uppercase text-[var(--text-muted)]">{currency}</span></p>
      </div>
      <div className="text-4xl opacity-10 absolute -right-2 -bottom-4 group-hover:scale-110 transition-transform">{icon}</div>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col gap-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <HeaderCard title={isRtl ? 'العهدة' : 'Opening Balance'} value={Number(activeShift.openingBalance || 0).toFixed(2)} icon="💵" color="text-slate-500" />
        <HeaderCard title={isRtl ? 'الداخل (إيداع)' : 'Cash In'} value={totalIn.toFixed(2)} icon="📥" color="text-emerald-500" />
        <HeaderCard title={isRtl ? 'الخارج (ترحيل)' : 'Cash Out'} value={totalOut.toFixed(2)} icon="📤" color="text-rose-500" />
        <HeaderCard title={isRtl ? 'الرصيد الفعلي' : 'Current Balance'} value={Number(drawerBalance).toFixed(2)} icon="💰" color="text-[#0066FF]" />
      </div>

      <div className="flex gap-4 shrink-0">
        <button onClick={() => setShowTransfer(true)} className="flex-1 bg-[var(--bg-card)] hover:bg-[var(--bg-deep)] text-[var(--text-primary)] border border-rose-500 font-black uppercase text-xs py-4 flex items-center justify-center gap-2 transition-colors rounded-none">
           📤 {isRtl ? 'ترحيل للخزينة' : 'Transfer to Safe'}
        </button>
        <button onClick={() => setShowAddChange(true)} className="flex-1 bg-[var(--bg-card)] hover:bg-[var(--bg-deep)] text-[var(--text-primary)] border border-emerald-500 font-black uppercase text-xs py-4 flex items-center justify-center gap-2 transition-colors rounded-none">
           📥 {isRtl ? 'إيداع فكة' : 'Add Change'}
        </button>
      </div>

      <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden flex flex-col min-h-0">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-deep)]">
            <h3 className="font-black text-[var(--text-primary)] text-sm uppercase">{isRtl ? 'سجل الحركات' : 'Drawer Logs'}</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {shiftLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50">
              <span className="text-5xl mb-3">📋</span>
              <p className="font-black uppercase text-xs tracking-widest">{isRtl ? 'لا يوجد حركات' : 'No transactions recorded'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--bg-deep)] border-b border-[var(--border-color)] z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-4 text-start text-[10px] font-black uppercase text-[var(--text-muted)]">{isRtl ? 'الوقت' : 'Time'}</th>
                        <th className="px-6 py-4 text-start text-[10px] font-black uppercase text-[var(--text-muted)]">{isRtl ? 'البيان' : 'Note'}</th>
                        <th className="px-6 py-4 text-end text-[10px] font-black uppercase text-[var(--text-muted)]">{isRtl ? 'المبلغ' : 'Amount'}</th>
                    </tr>
                </thead>
                <tbody>
                    {shiftLogs.sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp)).map(log => (
                        <tr key={log.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-deep)] transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-[var(--text-muted)]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{log.note}</td>
                            <td className={`px-6 py-4 text-end font-black ${log.type === 'IN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {log.type === 'IN' ? '+' : '-'}{Number(log.amount).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          )}
        </div>
      </div>

      {(showTransfer || showAddChange) && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => { setShowTransfer(false); setShowAddChange(false); setAmount(''); }}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-sm rounded-none p-8 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-xl mb-4 text-[var(--text-primary)] uppercase">
               {showTransfer ? (isRtl ? 'تسليم نقدية للخزينة' : 'Transfer Cash to Safe') : (isRtl ? 'إيداع فكة للدرج' : 'Add Change to Drawer')}
            </h3>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">{isRtl ? 'المبلغ' : 'Amount'}</label>
            <input type="number" autoFocus value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="w-full bg-[var(--bg-deep)] border-2 border-[#0066FF] rounded-none px-4 py-4 text-3xl font-black outline-none text-center mb-8" />
            
            <div className="flex gap-4">
              <button onClick={() => { setShowTransfer(false); setShowAddChange(false); setAmount(''); }} className="flex-1 bg-[var(--bg-deep)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-black py-4 uppercase tracking-widest text-xs transition-colors rounded-none">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={showTransfer ? handleTransfer : handleAddChange} className={`flex-[2] text-white font-black py-4 uppercase tracking-widest text-xs transition-colors rounded-none ${showTransfer ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0066FF] hover:bg-blue-700'}`}>
                {isRtl ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SETTINGS SCREEN
// ============================================================
function SettingsScreen({ currentUser, users, language, setLanguage, theme, setTheme, onUpdateUser, userPermissions, setUserPermissions, storeName, setStoreName, currency, setCurrency, taxRate, setTaxRate, enableServiceFee, setEnableServiceFee, serviceFee, setServiceFee, pushNotification, invoiceLogo, setInvoiceLogo, invoiceHeader, setInvoiceHeader, invoiceFooter, setInvoiceFooter }) {
  const isRtl = language === 'ar';
  const isOwner = currentUser.role === 'Owner' || currentUser.role === 'admin';
  const [section, setSection] = useState('profile');

  const handleExportBackup = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Backup app data and settings
        if (key.startsWith('pos_') || ['currency', 'taxRate', 'enableServiceFee', 'serviceFee', 'storeName'].includes(key)) {
            try {
                data[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                data[key] = localStorage.getItem(key);
            }
        }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StoreApp_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Strict validation against live session status from Supabase
    if (!isOnline || !cloudReady) {
      alert(isRtl 
        ? "⚠️ يجب أن تكون متصلاً بالإنترنت للتحقق من حالة اشتراكك قبل استيراد البيانات." 
        : "⚠️ You must be online to verify your subscription status before importing data.");
      event.target.value = '';
      return;
    }

    try {
      const settings = await SB.fetchSettings(branchId);
      const liveStatus = settings?.subscription_status || 'trial';
      const liveTrialStart = settings?.trial_start_date;
      const liveSubEnd = settings?.subscription_end_date;
      
      const saas = checkSubscriptionStatus(liveStatus, liveTrialStart, liveSubEnd);
      
      if (saas.status !== 'active' || saas.expired) {
        alert(isRtl 
          ? "⚠️ عذراً، ميزة استيراد البيانات متاحة فقط للمشتركين في الباقات المدفوعة النشطة. يرجى ترقية اشتراكك لتتمكن من استيراد البيانات." 
          : "⚠️ Sorry, data import is only available for active paid subscriptions. Please upgrade your subscription to import data.");
        event.target.value = '';
        return;
      }
    } catch (dbErr) {
      console.error('Failed to verify live subscription status:', dbErr);
      alert(isRtl 
        ? "❌ فشل التحقق من حالة الاشتراك مع السيرفر. يرجى المحاولة مرة أخرى." 
        : "❌ Failed to verify subscription status with the server. Please try again.");
      event.target.value = '';
      return;
    }

    if (!window.confirm(isRtl ? "تحذير: هذه العملية ستمسح البيانات الحالية وتستبدلها بالنسخة الاحتياطية. هل أنت متأكد؟" : "Warning: This will overwrite all current data. Are you sure?")) {
        event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            Object.keys(data).forEach(k => {
                localStorage.setItem(k, typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k]));
            });
            alert(isRtl ? "تم استعادة البيانات بنجاح" : "Data restored successfully");
            window.location.reload();
        } catch (err) {
            alert(isRtl ? "خطأ في قراءة ملف النسخة الاحتياطية" : "Error reading backup file");
        }
    };
    reader.readAsText(file);
  };


  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username || '');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSaved, setPassSaved] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState(null);

  const [localStoreName, setLocalStoreName] = useState(storeName);
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localTaxRate, setLocalTaxRate] = useState(taxRate);
  const [localEnableServiceFee, setLocalEnableServiceFee] = useState(enableServiceFee);
  const [localServiceFee, setLocalServiceFee] = useState(serviceFee);
  
  const [localInvoiceHeader, setLocalInvoiceHeader] = useState(invoiceHeader || '');
  const [localInvoiceFooter, setLocalInvoiceFooter] = useState(invoiceFooter || '');
  const [localLogo, setLocalLogo] = useState(invoiceLogo || null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLocalLogo(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInvoiceSettings = () => {
    setInvoiceLogo(localLogo);
    setInvoiceHeader(localInvoiceHeader);
    setInvoiceFooter(localInvoiceFooter);
    if (pushNotification) pushNotification(isRtl ? 'تم حفظ إعدادات الفاتورة' : 'Invoice settings saved', 'success');
  };

  const handleSavePOSSettings = () => {
    setStoreName(localStoreName);
    setCurrency(localCurrency);
    setTaxRate(localTaxRate);
    setEnableServiceFee(localEnableServiceFee);
    setServiceFee(localServiceFee);
    localStorage.setItem('storeName', localStoreName);
    localStorage.setItem('currency', localCurrency);
    localStorage.setItem('taxRate', localTaxRate);
    localStorage.setItem('enableServiceFee', localEnableServiceFee);
    localStorage.setItem('serviceFee', localServiceFee);
    if (pushNotification) pushNotification(isRtl ? 'تم حفظ إعدادات النظام بنجاح' : 'Settings saved successfully', 'success');
  };

  const ALL_TABS = [
    { id: 'dashboard', label: isRtl ? 'لوحة البيانات' : 'Dashboard', icon: '📊' },
    { id: 'pos', label: isRtl ? 'نقطة البيع' : 'POS', icon: '🛒' },
    { id: 'shifts', label: isRtl ? 'الورديات' : 'Shifts', icon: '⏱️' },
    { id: 'sales', label: isRtl ? 'المبيعات' : 'Sales', icon: '🧾' },
    { id: 'customers', label: isRtl ? 'العملاء' : 'Customers', icon: '👤' },
    { id: 'expenses', label: isRtl ? 'المصروفات' : 'Expenses', icon: '💸' },
    { id: 'inventory', label: isRtl ? 'المخزون' : 'Inventory', icon: '📦' },
    { id: 'purchases', label: isRtl ? 'المشتريات' : 'Purchases', icon: '🛍️' },
    { id: 'treasury', label: isRtl ? 'الخزينة' : 'Treasury', icon: '🏦' },
    { id: 'staff', label: isRtl ? 'الموظفين' : 'Staff', icon: '👥' },
    { id: 'drawer', label: isRtl ? 'درج الكاشير' : 'Cash Drawer', icon: '💵' },
    { id: 'reports', label: isRtl ? 'التقارير' : 'Reports', icon: '📈' },
    { id: 'settings', label: isRtl ? 'الإعدادات' : 'Settings', icon: '⚙️' },
    { id: 'admin_panel', label: isRtl ? 'لوحة المسؤول' : 'Admin Panel', icon: '🛡️' },
  ];

  const visibleTabs = ALL_TABS.filter(tab => tab.id !== 'admin_panel' || currentUser?.id === 'u_4');

  const editableUsers = users.filter(u => u.id !== currentUser.id && u.role !== 'Owner');

  const getUserPerms = (userId) => {
    const u = users.find(x => x.id === userId);
    if (!u) return [];
    if (userPermissions[userId]) return userPermissions[userId];
    return ROLE_PERMISSIONS[u.role] || [];
  };

  const togglePerm = (userId, tabId) => {
    const current = getUserPerms(userId);
    const next = current.includes(tabId) ? current.filter(t => t !== tabId) : [...current, tabId];
    setUserPermissions(prev => ({ ...prev, [userId]: next }));
  };

  const resetPerms = (userId) => {
    const u = users.find(x => x.id === userId);
    const defaultPerms = ROLE_PERMISSIONS[u?.role] || [];
    setUserPermissions(prev => ({ ...prev, [userId]: [...defaultPerms] }));
  };

  const grantAll = (userId) => {
    setUserPermissions(prev => ({ ...prev, [userId]: visibleTabs.map(t => t.id) }));
  };

  const handleSaveProfile = () => {
    setPassError('');
    if (newPass) {
      if (newPass.length < 4) { setPassError(isRtl ? 'كلمة السر أقل من 4 أحرف' : 'Min 4 characters'); return; }
      if (newPass !== confirmPass) { setPassError(isRtl ? 'كلمة السر غير متطابقة' : 'Passwords do not match'); return; }
      // Owners can bypass old pass check
      if (!isOwner && oldPass !== currentUser.password && oldPass !== currentUser.pin) {
        setPassError(isRtl ? 'كلمة السر الحالية غير صحيحة' : 'Current password is incorrect');
        return;
      }
      onUpdateUser({ ...currentUser, name, username, password: newPass, pin: newPass });
    } else {
      onUpdateUser({ ...currentUser, name, username });
    }
    setOldPass(''); setNewPass(''); setConfirmPass('');
    setPassSaved(true);
    setTimeout(() => setPassSaved(false), 3000);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedPerms = selectedUserId ? getUserPerms(selectedUserId) : [];

  const S = {
    card: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', overflow: 'hidden' },
    label: { fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', display: 'block', marginBottom: 6 },
    input: { width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', padding: '12px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' },
    btn: (active) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 12, transition: 'all 0.15s', background: active ? 'var(--accent-blue)' : 'var(--bg-card)', color: active ? '#fff' : 'var(--text-secondary)', borderLeft: active ? '4px solid var(--accent-gold)' : 'none' }),
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Section Nav */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          ['profile', isRtl ? '👤 الملف الشخصي' : '👤 My Profile'],
          ...(isOwner ? [['permissions', isRtl ? '🔐 إدارة الصلاحيات' : '🔐 Permissions']] : []),
          ['appearance', isRtl ? '🌓 المظهر' : '🌓 Appearance'],
          ['language', isRtl ? '🌐 اللغة' : '🌐 Language'],
          ['system', isRtl ? 'ℹ️ النظام' : 'ℹ️ System'],
          ['pos_settings', isRtl ? '🏪 إعدادات المبيعات' : '🏪 POS Settings'],
          ['invoice_formatting', isRtl ? '📄 تنسيق الفاتورة' : '📄 Invoice Formatting'],
          ...(isOwner ? [['backup', isRtl ? '🛡️ النسخ والبدائل' : '🛡️ Backup & Security']] : []),
        ].map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={S.btn(section === id)}>{label}</button>
        ))}
      </div>

      {/* ── APPEARANCE SECTION ── */}
      {section === 'appearance' && (
        <div style={S.card}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>{isRtl ? 'إعدادات المظهر' : 'Appearance Settings'}</p>
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={S.label}>{isRtl ? 'الوضع' : 'Theme Mode'}</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setTheme('light')}
                  style={{ ...S.btn(theme === 'light'), flex: 1, justifyContent: 'center', padding: '16px' }}>
                  ☀️ {isRtl ? 'الوضع الفاتح' : 'Light Mode'}
                </button>
                <button onClick={() => setTheme('dark')}
                  style={{ ...S.btn(theme === 'dark'), flex: 1, justifyContent: 'center', padding: '16px' }}>
                  🌑 {isRtl ? 'الوضع الليلي' : 'Dark Mode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE SECTION ── */}
      {section === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          <div style={S.card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>{isRtl ? 'تعديل البيانات الشخصية' : 'Edit Profile'}</p>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#0d9488,#5eead4)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, color: '#fff', flexShrink: 0 }}>{currentUser.name[0]}</div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{currentUser.name}</p>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#0d9488', background: '#ccfbf1', padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{currentUser.role}</span>
                </div>
              </div>

              <div>
                <label style={S.label}>{isRtl ? 'الاسم الظاهر' : 'Display Name'}</label>
                <input style={S.input} value={name} onChange={e => setName(e.target.value)} />
              </div>

              {isOwner && (
                <div>
                  <label style={S.label}>{isRtl ? 'اسم المستخدم للدخول' : 'Access Username'}</label>
                  <input style={S.input} value={username} onChange={e => setUsername(e.target.value)} />
                </div>
              )}

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                <p style={{ fontWeight: 800, fontSize: 12, color: '#334155', marginBottom: 14 }}>🔑 {isRtl ? 'تغيير كلمة السر' : 'Change Password'}</p>
                {[
                  [isRtl ? 'كلمة السر الحالية' : 'Current Password', oldPass, setOldPass],
                  [isRtl ? 'كلمة السر الجديدة' : 'New Password', newPass, setNewPass],
                  [isRtl ? 'تأكيد كلمة السر' : 'Confirm Password', confirmPass, setConfirmPass],
                ].map(([label, val, setter]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <label style={S.label}>{label}</label>
                    <input type="password" style={S.input} value={val} onChange={e => setter(e.target.value)} placeholder="••••••" />
                  </div>
                ))}
                {passError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
                    <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>⚠️ {passError}</p>
                  </div>
                )}
                {passSaved && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
                    <p style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>✅ {isRtl ? 'تم الحفظ بنجاح' : 'Saved successfully!'}</p>
                  </div>
                )}
              </div>

              <button onClick={handleSaveProfile}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff', fontWeight: 800, fontSize: 13, boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
                💾 {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMISSIONS SECTION (Owner only) ── */}
      {section === 'permissions' && isOwner && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* User List */}
          <div style={{ ...S.card, width: 240, flexShrink: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ fontWeight: 900, fontSize: 14, color: '#0f172a' }}>{isRtl ? 'اختر المستخدم' : 'Select User'}</p>
              <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{isRtl ? 'اضبط صلاحيات كل حساب' : 'Customize access per account'}</p>
            </div>
            <div style={{ padding: 10 }}>
              {editableUsers.length === 0 && (
                <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: 12, fontWeight: 700, padding: 20 }}>{isRtl ? 'لا مستخدمين' : 'No users yet'}</p>
              )}
              {editableUsers.map(u => {
                const perms = getUserPerms(u.id);
                const hasCustom = !!userPermissions[u.id];
                const isSelected = selectedUserId === u.id;
                return (
                  <button key={u.id} onClick={() => setSelectedUserId(u.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, border: isSelected ? '2px solid #0d9488' : '2px solid transparent', background: isSelected ? '#f0fdfa' : 'transparent', cursor: 'pointer', marginBottom: 4, textAlign: isRtl ? 'right' : 'left' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: isSelected ? '#0d9488' : '#e2e8f0', color: isSelected ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>{u.name[0]}</div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 12, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#0d9488', background: '#ccfbf1', padding: '1px 7px', borderRadius: 20 }}>{u.role}</span>
                        {hasCustom && <span style={{ fontSize: 9, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: 20 }}>CUSTOM</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, flexShrink: 0 }}>{perms.length}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions Grid */}
          {selectedUser ? (
            <div style={{ flex: 1, minWidth: 300, ...S.card }}>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>{selectedUser.name}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{isRtl ? 'حدد الشاشات المسموح بها' : 'Toggle accessible screens'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => grantAll(selectedUser.id)}
                    style={{ padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: '#dcfce7', color: '#16a34a', fontWeight: 800, fontSize: 11 }}>
                    ✓ {isRtl ? 'الكل' : 'All'}
                  </button>
                  <button onClick={() => setUserPermissions(prev => ({ ...prev, [selectedUser.id]: [] }))}
                    style={{ padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: '#fef2f2', color: '#ef4444', fontWeight: 800, fontSize: 11 }}>
                    ✕ {isRtl ? 'لا شيء' : 'None'}
                  </button>
                  <button onClick={() => resetPerms(selectedUser.id)}
                    style={{ padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: '#f1f5f9', color: '#64748b', fontWeight: 800, fontSize: 11 }}>
                    ↺ {isRtl ? 'إعادة تعيين' : 'Reset'}
                  </button>
                </div>
              </div>

              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {visibleTabs.map(tab => {
                  const allowed = selectedPerms.includes(tab.id);
                  return (
                    <button key={tab.id} onClick={() => togglePerm(selectedUser.id, tab.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16,
                        border: allowed ? '2px solid #0d9488' : '2px solid #e2e8f0',
                        background: allowed ? 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' : '#f8fafc',
                        cursor: 'pointer', transition: 'all 0.15s',
                        boxShadow: allowed ? '0 2px 8px rgba(124,58,237,0.15)' : 'none',
                      }}>
                      <span style={{ fontSize: 20 }}>{tab.icon}</span>
                      <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                        <p style={{ fontWeight: 700, fontSize: 12, color: allowed ? '#0d9488' : '#475569', lineHeight: 1.2 }}>{tab.label}</p>
                        <p style={{ fontSize: 9, fontWeight: 800, color: allowed ? '#5eead4' : '#cbd5e1', textTransform: 'uppercase', marginTop: 2 }}>{allowed ? (isRtl ? 'مسموح' : 'ALLOWED') : (isRtl ? 'مغلق' : 'BLOCKED')}</p>
                      </div>
                      <div style={{ marginLeft: 'auto', marginRight: isRtl ? 'auto' : 0, width: 20, height: 20, borderRadius: 6, background: allowed ? '#0d9488' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {allowed && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{selectedPerms.length} / {visibleTabs.length} {isRtl ? 'شاشة مسموح بها' : 'screens allowed'}</p>
                <div style={{ height: 6, flex: 1, maxWidth: 120, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', margin: '0 12px' }}>
                  <div style={{ height: '100%', width: `${(selectedPerms.length / visibleTabs.length) * 100}%`, background: 'linear-gradient(90deg,#0d9488,#5eead4)', borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
                <p style={{ fontSize: 10, color: '#0d9488', fontWeight: 800 }}>{Math.round((selectedPerms.length / visibleTabs.length) * 100)}%</p>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 280 }}>
              <span style={{ fontSize: 48 }}>🔐</span>
              <p style={{ fontWeight: 800, color: '#cbd5e1', fontSize: 14, marginTop: 12, textTransform: 'uppercase' }}>{isRtl ? 'اختر مستخدماً من القائمة' : 'Select a user to manage permissions'}</p>
            </div>
          )}
        </div>
      )}

      {/* ── LANGUAGE SECTION ── */}
      {section === 'language' && (
        <div style={{ maxWidth: 400 }}>
          <div style={S.card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>🌐 {isRtl ? 'اللغة' : 'Language'}</p>
            </div>
            <div style={{ padding: 24, display: 'flex', gap: 12 }}>
              {[['en', '🇺🇸 English'], ['ar', '🇸🇦 العربية']].map(([code, label]) => (
                <button key={code} onClick={() => setLanguage(code)}
                  style={{ flex: 1, padding: '16px', borderRadius: 16, border: language === code ? '2px solid #0d9488' : '2px solid #e2e8f0', background: language === code ? '#f0fdfa' : '#f8fafc', color: language === code ? '#0d9488' : '#64748b', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: language === code ? '0 2px 12px rgba(124,58,237,0.15)' : 'none' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SYSTEM SECTION ── */}
      {section === 'system' && (
        <div style={{ maxWidth: 500 }}>
          <div style={S.card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>ℹ️ {isRtl ? 'معلومات النظام' : 'System Info'}</p>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Version', 'StorePilot v2.5.0'],
                ['Build', '2025-03'],
                ['Terminal', 'ST-01'],
                ['Role', currentUser.role],
                ['User ID', currentUser.id?.slice(0, 12) + '...'],
                ['Username', currentUser.username || currentUser.pin ? '****' : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── POS SETTINGS SECTION ── */}
      {section === 'pos_settings' && (
        <div style={{ maxWidth: 500 }}>
          <div style={S.card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>{isRtl ? 'إعدادات نقطة البيع' : 'POS Settings'}</p>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={S.label}>{isRtl ? 'اسم المتجر' : 'Store Name'}</label>
                <input style={S.input} value={localStoreName} onChange={e => setLocalStoreName(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>{isRtl ? 'العملة' : 'Currency'}</label>
                <input style={S.input} value={localCurrency} onChange={e => setLocalCurrency(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>{isRtl ? 'نسبة الضريبة %' : 'Tax Rate %'}</label>
                <input type="number" style={S.input} value={localTaxRate} onChange={e => setLocalTaxRate(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                <input type="checkbox" id="enableServiceFee" checked={localEnableServiceFee} onChange={e => setLocalEnableServiceFee(e.target.checked)} style={{ width: 18, height: 18 }} />
                <label htmlFor="enableServiceFee" style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', cursor: 'pointer' }}>{isRtl ? 'تفعيل رسوم الخدمة' : 'Enable Service Fee'}</label>
              </div>
              {localEnableServiceFee && (
                <div>
                  <label style={S.label}>{isRtl ? 'نسبة رسوم الخدمة %' : 'Service Fee %'}</label>
                  <input type="number" style={S.input} value={localServiceFee} onChange={e => setLocalServiceFee(Number(e.target.value))} />
                </div>
              )}
              <button 
                onClick={handleSavePOSSettings} 
                style={{ ...S.button, width: '100%', padding: '15px 0', fontSize: 13, marginTop: 10 }}>
                {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INVOICE FORMATTING SECTION ── */}
      {section === 'invoice_formatting' && (
        <div style={{ maxWidth: 600 }}>
          <div style={S.card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>{isRtl ? 'تخصيص شكل الفاتورة' : 'Invoice Formatting'}</p>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={S.label}>{isRtl ? 'لوجو المتجر' : 'Store Logo'}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, background: 'var(--bg-deep)', padding: 15, border: '1px solid var(--border-color)' }}>
                  {localLogo ? (
                    <img src={localLogo} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', background: '#fff' }} />
                  ) : (
                    <div style={{ width: 60, height: 60, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999' }}>NO LOGO</div>
                  )}
                  <input type="file" onChange={handleLogoUpload} accept="image/*" style={{ fontSize: 10 }} />
                  {localLogo && <button onClick={() => setLocalLogo(null)} style={{ background: '#fecaca', color: '#ef4444', border: 'none', padding: '5px 10px', fontSize: 10, fontWeight: 800 }}>RESET</button>}
                </div>
              </div>
              <div>
                <label style={S.label}>{isRtl ? 'ترويسة الفاتورة (Header)' : 'Invoice Header Text'}</label>
                <textarea 
                  style={{ ...S.input, minHeight: 80, resize: 'vertical' }} 
                  value={localInvoiceHeader} 
                  onChange={e => setLocalInvoiceHeader(e.target.value)} 
                  placeholder={isRtl ? 'مثال: العنوان أو رقم الضريبة...' : 'e.g. Address, VAT number...'}
                />
                <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{isRtl ? 'سيظهر هذا النص في أعلى الفاتورة تحت اللوجو' : 'This text appears at the top of the invoice below the logo'}</p>
              </div>
              <div>
                <label style={S.label}>{isRtl ? 'تذييل الفاتورة (Footer)' : 'Invoice Footer Text'}</label>
                <textarea 
                  style={{ ...S.input, minHeight: 80, resize: 'vertical' }} 
                  value={localInvoiceFooter} 
                  onChange={e => setLocalInvoiceFooter(e.target.value)} 
                  placeholder={isRtl ? 'مثال: سياسة الاسترجاع...' : 'e.g. Return Policy, Thank you...'}
                />
                <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{isRtl ? 'سيظهر هذا النص في أسفل الفاتورة' : 'This text appears at the bottom of the invoice'}</p>
              </div>
              <button 
                onClick={handleSaveInvoiceSettings} 
                style={{ width: '100%', padding: '16px', background: '#0066FF', color: 'white', border: 'none', borderRadius: 8, fontWeight: 900, cursor: 'pointer', transition: 'opacity 0.2s' }}>
                💾 {isRtl ? 'حفظ إعدادات الفاتورة' : 'Save Invoice Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
      {section === 'backup' && isOwner && (
        <div style={{ maxWidth: 600 }}>
          <div style={S.card}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>🛡️ {isRtl ? 'النسخ الاحتياطي والأمان' : 'Backup & Security'}</p>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              

              <div style={{ padding: 16, background: 'var(--bg-deep)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{isRtl ? 'تصدير نسخة احتياطية' : 'Export Data Backup'}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>{isRtl ? 'قم بتحميل جميع بيانات المحل (الأصناف، المبيعات، العملاء) في ملف واحد لتأمينها.' : 'Download all store data (products, sales, customers) in a single secure file.'}</p>
                <button onClick={handleExportBackup} 
                  style={{ width: '100%', padding: '14px', background: '#0066FF', color: 'white', border: 'none', borderRadius: 12, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', fontSize: 12 }}>
                  💾 {isRtl ? 'تصدير الآن (Export)' : 'Export Backup Now'}
                </button>
              </div>

              <div style={{ padding: 16, background: '#fff1f2', borderRadius: 16, border: '1px solid #fecaca' }}>
                <p style={{ fontWeight: 800, fontSize: 13, color: '#9f1239', marginBottom: 4 }}>{isRtl ? 'استيراد نسخة احتياطية' : 'Restore Data Backup'}</p>
                <p style={{ fontSize: 11, color: '#e11d48', marginBottom: 16 }}>{isRtl ? 'تحذير: سيقوم هذا باستبدال جميع البيانات الحالية ببيانات الملف المرفوع.' : 'Warning: This will overwrite and replace all current app data with the uploaded file.'}</p>
                <input type="file" id="import-backup" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
                <button onClick={() => document.getElementById('import-backup').click()} 
                  style={{ width: '100%', padding: '14px', background: '#e11d48', color: 'white', border: 'none', borderRadius: 12, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', fontSize: 12 }}>
                  📤 {isRtl ? 'استيراد بيانات (Import)' : 'Import & Restore Data'}
                </button>
              </div>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>StorePilot Backup Engine v1.0</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMBINED AUTH SCREEN (SIGN IN / SIGN UP)
// ============================================================
function CombinedAuthScreen({ onLogin, onSignUp, language, setLanguage, users, onUpdateUser, inviteContext, theme, setTheme }) {
  // Default to 'signup' when coming from an invitation link
  const [authMode, setAuthMode] = useState(() => inviteContext ? 'signup' : 'login');
  const [selectedRole, setSelectedRole] = useState('Cashier');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Desktop/Electron recovery state
  const [recoveryStep, setRecoveryStep] = useState('hwid'); // 'hwid' | 'reset'
  const [hwid, setHwid] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [selectedUserToReset, setSelectedUserToReset] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isFetchingHwid, setIsFetchingHwid] = useState(false);
  const [hwidError, setHwidError] = useState(false);

  // Web/Supabase recovery state
  // webResetStep: 'email' → user enters email
  //               'email_sent' → link dispatched, awaiting user click
  //               'update_password' → user sets new password
  //               'done' → password updated successfully
  const [webResetStep, setWebResetStep] = useState('email');
  const [webResetEmail, setWebResetEmail] = useState('');
  const [webNewPassword, setWebNewPassword] = useState('');
  const [webConfirmPassword, setWebConfirmPassword] = useState('');
  const [webResetMsg, setWebResetMsg] = useState(null); // { type: 'error'|'success', text: '' }
  const [webResetLoading, setWebResetLoading] = useState(false);

  const isRtl = language === 'ar';
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // ⚡ Detect runtime environment once — never changes within a session
  const isWeb = !window.electronAPI?.getMachineId;

  // Sign up fields
  const [signUpStoreName, setSignUpStoreName] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const handleCredentials = async () => {
    setIsLoggingIn(true);
    setError(null);
    const err = await onLogin(username, password);
    if (err) setError(err);
    setIsLoggingIn(false);
  };

  const handleSignUpSubmit = async () => {
    // If coming via invite, Store Name is not required
    if (!inviteContext && !signUpStoreName.trim()) {
      setError(isRtl ? 'جميع الحقول مطلوبة' : 'All fields are required');
      return;
    }
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      setError(isRtl ? 'جميع الحقول مطلوبة' : 'All fields are required');
      return;
    }

    // Strict email/Gmail registration syntax validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpEmail.trim())) {
      setError(isRtl ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }

    setIsRegistering(true);
    setError(null);

    // Browser Fingerprinting & Strict Anti-Trial-Hopping Check
    if (isWeb && !inviteContext) {
      const deviceToken = localStorage.getItem('_sp_device_token') || getCookie('_sp_device_token');
      if (deviceToken) {
        try {
          const { data: existingBranches, error: checkErr } = await supabase
            .from('branches')
            .select('id, name')
            .or(`machine_id.eq.${deviceToken},machine_id.like.*:${deviceToken}`);

          if (checkErr) throw checkErr;

          if (existingBranches && existingBranches.length > 0) {
            let isBlocked = false;
            for (const branch of existingBranches) {
              const { data: settings } = await supabase
                .from('store_settings')
                .select('*')
                .eq('branch_id', branch.id)
                .maybeSingle();

              if (settings) {
                const status = settings.subscription_status || 'trial';
                const trialStart = settings.trial_start_date;

                if (status === 'expired') {
                  isBlocked = true;
                  break;
                }
                if (status === 'trial') {
                  const start = new Date(trialStart);
                  if (!isNaN(start.getTime())) {
                    const now = new Date();
                    const days = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                    if (days > 14) {
                      isBlocked = true;
                      break;
                    }
                  } else {
                    isBlocked = true;
                    break;
                  }
                }
              }
            }

            if (isBlocked) {
              setError(isRtl 
                ? "عذراً، لقد استفدت بالفعل من الفترة التجريبية المجانية على هذا الجهاز. يرجى ترقية حسابك الحالي."
                : "Sorry, you have already used the free trial on this device. Please upgrade your current account.");
              setIsRegistering(false);
              return;
            }
          }
        } catch (e) {
          console.error('Failed to verify device token trial history:', e);
        }
      }
    }

    // Pass inviteContext as 5th arg so handleSignUp can branch appropriately
    const err = await onSignUp(signUpName.trim(), signUpEmail.trim(), signUpPassword.trim(), signUpStoreName.trim(), inviteContext || null);
    if (err) setError(err);
    setIsRegistering(false);
  };

  // -----------------------------------------------------------------------
  // DESKTOP-ONLY: Hardware ID fetch with retry
  // -----------------------------------------------------------------------
  const fetchHwidWithRetry = async () => {
    setIsFetchingHwid(true);
    setHwidError(false);
    setHwid('');
    
    let attempts = 0;
    let id = null;
    
    while (attempts < 3) {
      try {
        if (window.electronAPI && typeof window.electronAPI.getMachineId === 'function') {
          id = await window.electronAPI.getMachineId();
          if (id) {
            setHwid(id);
            setIsFetchingHwid(false);
            return;
          }
        }
      } catch (e) {
        console.error(`HWID load attempt ${attempts + 1} failed:`, e);
      }
      attempts++;
      if (attempts < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setHwidError(true);
    setIsFetchingHwid(false);
  };

  // -----------------------------------------------------------------------
  // RECOVERY ENTRY POINT — branches on environment
  // -----------------------------------------------------------------------
  const handleRecovery = async () => {
    // Reset all recovery state cleanly
    setWebResetStep('email');
    setWebResetEmail('');
    setWebNewPassword('');
    setWebConfirmPassword('');
    setWebResetMsg(null);
    setRecoveryStep('hwid');
    setRecoveryKey('');
    setSelectedUserToReset(null);
    setNewUsername('');
    setNewPassword('');
    setShowRecoveryModal(true);

    // Desktop: immediately start HWID fetch
    if (!isWeb) {
      await fetchHwidWithRetry();
    }
  };

  // -----------------------------------------------------------------------
  // DESKTOP RECOVERY: Verify recovery key → allow reset
  // -----------------------------------------------------------------------
  const verifyRecoveryKey = () => {
    const expectedKey = btoa(hwid + '-StorePilot-Recovery-2026');
    if (recoveryKey.trim() === expectedKey) {
      setRecoveryStep('reset');
    } else {
      alert(isRtl ? 'كود الاستعادة غير صحيح' : 'Invalid Recovery Key');
    }
  };

  const handleResetPassword = () => {
    if (!selectedUserToReset || !newUsername.trim() || !newPassword.trim()) {
        alert(isRtl ? 'جميع الحقول مطلوبة' : 'All fields required');
        return;
    }
    const user = users.find(u => u.id === selectedUserToReset);
    if (user) {
      onUpdateUser({ ...user, username: newUsername, password: newPassword, pin: newPassword });
      alert(isRtl ? 'تم تحديث بيانات الدخول. يمكنك الدخول الآن' : 'Credentials reset successfully. Proceed to login.');
      setShowRecoveryModal(false);
      setRecoveryStep('hwid');
      setSelectedUserToReset(null);
      setNewUsername('');
      setNewPassword('');
    }
  };

  // -----------------------------------------------------------------------
  // WEB RECOVERY: Supabase Auth — Send reset email
  // -----------------------------------------------------------------------
  const handleWebSendResetEmail = async () => {
    if (!webResetEmail.trim() || !webResetEmail.includes('@')) {
      setWebResetMsg({ type: 'error', text: isRtl ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address' });
      return;
    }
    setWebResetLoading(true);
    setWebResetMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(webResetEmail.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setWebResetStep('email_sent');
      setWebResetMsg({
        type: 'success',
        text: isRtl
          ? '✅ تم إرسال رابط إعادة التعيين. تحقق من بريدك الإلكتروني وانقر على الرابط، ثم ارجع هنا لتحديث كلمة المرور.'
          : '✅ Reset link sent! Check your inbox and click the link, then return here to set your new password.',
      });
    } catch (err) {
      setWebResetMsg({
        type: 'error',
        text: isRtl
          ? `❌ خطأ: ${err.message || 'فشل إرسال البريد الإلكتروني. تأكد من صحة العنوان.'}`
          : `❌ Error: ${err.message || 'Failed to send reset email. Check the address and try again.'}`,
      });
    } finally {
      setWebResetLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // WEB RECOVERY: Supabase Auth — Update password after email link clicked
  // -----------------------------------------------------------------------
  const handleWebUpdatePassword = async () => {
    if (!webNewPassword.trim() || webNewPassword.length < 6) {
      setWebResetMsg({ type: 'error', text: isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters' });
      return;
    }
    if (webNewPassword !== webConfirmPassword) {
      setWebResetMsg({ type: 'error', text: isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match' });
      return;
    }
    setWebResetLoading(true);
    setWebResetMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: webNewPassword });
      if (error) throw error;
      setWebResetStep('done');
      setWebResetMsg({
        type: 'success',
        text: isRtl
          ? '✅ تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
          : '✅ Password updated successfully! You can now sign in with your new password.',
      });
    } catch (err) {
      setWebResetMsg({
        type: 'error',
        text: isRtl
          ? `❌ ${err.message?.includes('Auth session missing') ? 'انتهت صلاحية الجلسة. يرجى إعادة إرسال الرابط والمحاولة مجدداً.' : err.message || 'فشل تحديث كلمة المرور'}`
          : `❌ ${err.message?.includes('Auth session missing') ? 'Session expired. Please resend the link and try again.' : err.message || 'Failed to update password'}`,
      });
    } finally {
      setWebResetLoading(false);
    }
  };

  // Detect if we've returned from a Supabase password reset link (hash contains access_token)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      setShowRecoveryModal(true);
      setWebResetStep('update_password');
      setWebResetMsg({
        type: 'success',
        text: isRtl
          ? '✅ تم التحقق من الرابط. أدخل كلمة مرور جديدة أدناه.'
          : '✅ Link verified! Enter your new password below.',
      });
      // Clean the hash from the URL so it doesn't re-trigger
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    setError(null);
    setUsername('');
    setPassword('');
    setSignUpStoreName('');
    setSignUpName('');
    setSignUpEmail('');
    setSignUpPassword('');
  }, [selectedRole, authMode]);

  // --------------------------------------------------------------------------
  // RECOVERY MODAL CONTENT — environment-branched
  // --------------------------------------------------------------------------
  const renderRecoveryModal = () => (
    <div className="absolute inset-0 flex items-center justify-center z-[400] p-4" style={{ background: 'rgba(15,23,42,0.80)', backdropFilter: 'blur(10px)' }}>
      <div className="p-8 max-w-sm w-full relative" style={{ background: '#fff', borderRadius: 18, borderTop: '4px solid ' + (isWeb ? '#1e40af' : '#ef4444'), boxShadow: '0 24px 64px rgba(0,0,0,0.20)' }}>

        {/* Modal header */}
        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{isWeb ? '🔐' : '🛡️'}</span>
            <h3 className="text-base font-black" style={{ color: isWeb ? '#1e40af' : '#dc2626' }}>
              {isWeb
                ? (isRtl ? 'استعادة الحساب عبر البريد' : 'Cloud Account Recovery')
                : (isRtl ? 'استعادة الحساب' : 'Security Recovery')}
            </h3>
          </div>
          <button
            onClick={() => setShowRecoveryModal(false)}
            style={{ width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#64748b' }}
          >✕</button>
        </div>

        {/* ----------------------------------------------------------------
             WEB PATH: Supabase Auth reset
             ---------------------------------------------------------------- */}
        {isWeb && (
          <div className="space-y-5">

            {/* Feedback banner (error or success) */}
            {webResetMsg && (
              <div
                className="p-4 rounded-xl text-xs font-bold leading-relaxed"
                style={{
                  background: webResetMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  border: '1px solid ' + (webResetMsg.type === 'error' ? '#fecaca' : '#bbf7d0'),
                  color: webResetMsg.type === 'error' ? '#dc2626' : '#16a34a',
                }}
              >
                {webResetMsg.text}
              </div>
            )}

            {/* STEP 1: Enter email */}
            {webResetStep === 'email' && (
              <div className="space-y-4">
                <p className="text-xs text-[#64748b] font-medium leading-relaxed">
                  {isRtl
                    ? 'أدخل البريد الإلكتروني المسجل بحسابك في StorePilot. سنرسل لك رابط إعادة التعيين فوراً.'
                    : 'Enter your registered StorePilot email. We\'ll send you an instant reset link.'}
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#1e40af] uppercase tracking-widest block">
                    {isRtl ? 'البريد الإلكتروني المسجل' : 'Registered Email'}
                  </label>
                  <input
                    type="email"
                    value={webResetEmail}
                    onChange={e => setWebResetEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleWebSendResetEmail()}
                    placeholder={isRtl ? 'example@gmail.com' : 'example@gmail.com'}
                    className="e-input w-full"
                    autoFocus
                    dir="ltr"
                  />
                </div>
                <button
                  onClick={handleWebSendResetEmail}
                  disabled={webResetLoading || !webResetEmail.trim()}
                  className="w-full py-3 rounded-xl font-black text-sm text-white transition-all"
                  style={{ background: webResetLoading ? '#93c5fd' : '#1e40af', border: 'none', cursor: webResetLoading ? 'not-allowed' : 'pointer' }}
                >
                  {webResetLoading
                    ? (isRtl ? '⏳ جاري الإرسال...' : '⏳ Sending...')
                    : (isRtl ? '📧 إرسال رابط التعيين' : '📧 Send Reset Link')}
                </button>
              </div>
            )}

            {/* STEP 2: Email sent — prompt user to click the link then come back */}
            {webResetStep === 'email_sent' && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <span className="text-5xl">📬</span>
                  <p className="mt-3 text-sm font-bold text-[#1e293b]">
                    {isRtl ? 'تحقق من بريدك الإلكتروني' : 'Check your inbox'}
                  </p>
                  <p className="text-xs text-[#64748b] mt-1">
                    {isRtl
                      ? 'انقر على الرابط في البريد، ثم ارجع إلى هذه الصفحة وانقر على الزر أدناه.'
                      : 'Click the link in the email, then return to this page and press the button below.'}
                  </p>
                </div>
                <button
                  onClick={() => { setWebResetStep('update_password'); setWebResetMsg(null); }}
                  className="w-full py-3 rounded-xl font-black text-sm text-white transition-all"
                  style={{ background: '#1e40af', border: 'none', cursor: 'pointer' }}
                >
                  {isRtl ? '✅ نقرت على الرابط — أحدّث كلمة المرور' : '✅ I clicked the link — Set New Password'}
                </button>
                <button
                  onClick={() => { setWebResetStep('email'); setWebResetMsg(null); }}
                  className="w-full py-2 text-xs font-bold text-[#64748b] hover:text-[#1e40af] transition-all bg-transparent border-0 cursor-pointer"
                >
                  {isRtl ? '← إعادة إرسال رابط مختلف' : '← Resend to a different email'}
                </button>
              </div>
            )}

            {/* STEP 3: Set new password (after clicking email link — Supabase puts token in session) */}
            {webResetStep === 'update_password' && (
              <div className="space-y-4">
                <p className="text-xs text-[#64748b] font-medium">
                  {isRtl ? 'أدخل كلمة المرور الجديدة لحسابك:' : 'Enter your new account password:'}
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#1e40af] uppercase tracking-widest block">
                    {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    value={webNewPassword}
                    onChange={e => setWebNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="e-input w-full"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#1e40af] uppercase tracking-widest block">
                    {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    value={webConfirmPassword}
                    onChange={e => setWebConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleWebUpdatePassword()}
                    placeholder="••••••••"
                    className="e-input w-full"
                  />
                </div>
                <button
                  onClick={handleWebUpdatePassword}
                  disabled={webResetLoading || !webNewPassword.trim() || !webConfirmPassword.trim()}
                  className="w-full py-3 rounded-xl font-black text-sm text-white transition-all"
                  style={{ background: webResetLoading ? '#93c5fd' : '#1e40af', border: 'none', cursor: webResetLoading ? 'not-allowed' : 'pointer' }}
                >
                  {webResetLoading
                    ? (isRtl ? '⏳ جاري التحديث...' : '⏳ Updating...')
                    : (isRtl ? '🔒 تحديث كلمة المرور' : '🔒 Update Password')}
                </button>
              </div>
            )}

            {/* STEP 4: Done */}
            {webResetStep === 'done' && (
              <div className="text-center space-y-4 py-2">
                <span className="text-5xl">🎉</span>
                <p className="text-sm font-bold text-[#16a34a] mt-2">
                  {isRtl ? 'تم تحديث كلمة المرور!' : 'Password Updated!'}
                </p>
                <p className="text-xs text-[#64748b]">
                  {isRtl ? 'سجّل دخولك الآن بكلمة المرور الجديدة.' : 'You can now sign in with your new password.'}
                </p>
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  className="w-full py-3 rounded-xl font-black text-sm text-white"
                  style={{ background: '#16a34a', border: 'none', cursor: 'pointer' }}
                >
                  {isRtl ? '← العودة لتسجيل الدخول' : '← Back to Sign In'}
                </button>
              </div>
            )}

          </div>
        )}

        {/* ----------------------------------------------------------------
             DESKTOP / ELECTRON PATH: HWID + Recovery Key (unchanged)
             ---------------------------------------------------------------- */}
        {!isWeb && (
          <div>
            {recoveryStep === 'hwid' && (
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-[#64748b] mb-4">
                  {isRtl ? 'يرجى إرسال المعرف أدناه للمسؤول للحصول على كود إعادة التعيين.' : 'Provide the Hardware ID below to your administrator for a reset code.'}
                </p>

                {isFetchingHwid ? (
                  <div className="bg-slate-50 p-4 mb-1 font-mono text-[10px] text-amber-600 text-center border border-amber-200 animate-pulse font-black uppercase tracking-wider rounded-xl">
                    {isRtl ? 'جاري تحميل معرف الجهاز...' : 'Loading Machine ID...'}
                  </div>
                ) : hwidError ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={fetchHwidWithRetry}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest transition-all rounded-xl"
                    >
                      {isRtl ? 'إعادة المحاولة يدوياً' : 'Manual Retry'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3 mb-1 font-mono text-[10px] text-teal-600 break-all select-all border border-slate-200 rounded-xl" style={{ userSelect: 'all', cursor: 'copy' }}>
                    {hwid || 'LOADING...'}
                  </div>
                )}

                <p className="text-[9px] text-red-400 opacity-70 mb-4">{isRtl ? 'استخدم أداة المسؤول لتوليد الكود' : 'Use Admin Tool to generate current code'}</p>

                <label className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">{isRtl ? 'كود الاستعادة' : 'Recovery Key'}</label>
                <input
                  type="text"
                  value={recoveryKey}
                  onChange={e => setRecoveryKey(e.target.value)}
                  placeholder={isRtl ? 'أدخل الكود هنا...' : 'Enter Recovery Key...'}
                  className="w-full border border-red-200 px-4 py-3 font-bold text-[#1e293b] outline-none mb-4 rounded-xl bg-white text-sm"
                />

                <div className="flex gap-2">
                  <button onClick={() => setShowRecoveryModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-xl border-0 cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                  <button
                    onClick={verifyRecoveryKey}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest transition-all rounded-xl border-0 cursor-pointer"
                  >
                    {isRtl ? 'تحقق ومتابعة' : 'Verify & Proceed'}
                  </button>
                </div>
              </div>
            )}

            {recoveryStep === 'reset' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">
                  {isRtl ? 'اختر حساباً لإعادة تعيينه' : 'Select User Account'}
                </label>
                <select
                  value={selectedUserToReset}
                  onChange={e => setSelectedUserToReset(e.target.value)}
                  className="w-full border border-slate-200 p-3 text-[#1e293b] font-bold outline-none mb-2 rounded-xl text-sm bg-white"
                >
                  <option value="">{isRtl ? 'اختر مستخدماً...' : 'Choose user...'}</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">{isRtl ? 'اسم المستخدم الجديد' : 'New Username'}</label>
                    <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full border border-slate-200 px-4 py-3 font-bold text-[#1e293b] outline-none rounded-xl bg-white text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">{isRtl ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-slate-200 px-4 py-3 font-bold text-[#1e293b] outline-none rounded-xl bg-white text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setRecoveryStep('hwid')} className="flex-1 py-3 bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-xl border-0 cursor-pointer">{isRtl ? 'رجوع' : 'Back'}</button>
                  <button onClick={handleResetPassword} disabled={!selectedUserToReset || !newUsername || !newPassword} className="flex-[2] py-3 bg-[#1e40af] text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-200 rounded-xl border-0 cursor-pointer">
                    💾 {isRtl ? 'حفظ ودخول' : 'Save & Login'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="enterprise-ui min-h-screen w-full flex flex-col md:grid md:grid-cols-2 overflow-x-hidden relative"
      style={{ background: 'var(--bg-deep)', fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      {/* Styles */}
      <style>{`
        @keyframes authFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .auth-fade { animation: authFadeIn 0.5s ease-out both; }
        .slide-fade { animation: slideUpFade 0.25s ease-out both; }
      `}</style>

      {/* Left Panel — Enterprise illustration */}
      <div
        className="hidden md:flex flex-col items-center justify-center p-12 relative overflow-hidden select-none"
        style={{ background: 'linear-gradient(145deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)' }}
      >
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 80%, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)', transform: 'translate(30%, -30%)' }} />

        {/* Logo */}
        <div className="relative z-10 text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-5xl" style={{ backdropFilter: 'blur(8px)' }}>🚀</div>
          </div>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black tracking-widest text-white/80 uppercase">
              ⚡ STOREPILOT PRO
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">
              {isRtl ? 'نظام ERP متكامل' : 'Complete Retail ERP'}
            </h3>
            <p className="text-blue-200 text-sm font-medium leading-relaxed max-w-xs mx-auto">
              {isRtl
                ? 'مبيعات · مخزون · موظفين · تقارير · متعدد الفروع'
                : 'Sales · Inventory · Staff · Reports · Multi-Branch'}
            </p>
          </div>
          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['🧾 POS', '📦 Inventory', '👥 HR', '📊 Reports', '☁️ Cloud'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-bold text-white/80 bg-white/10 border border-white/15">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side (Form) */}
      <div className="flex items-center justify-center p-6 md:p-12 relative min-h-screen" style={{ background: 'var(--bg-deep)' }}>
        {/* Top row: mobile logo + language */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#1e40af] flex items-center justify-center text-white text-sm">🚀</div>
            <span className="font-black text-sm text-[var(--text-primary)]">StorePilot <span className="text-[#1e40af]">PRO</span></span>
          </div>
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#1e40af] hover:border-[#1e40af] font-bold text-sm rounded-lg transition-all ml-auto bg-transparent"
          >
            {isRtl ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Enterprise Auth Card — white, blue top border, soft shadow */}
        <div
          className="auth-fade w-full max-w-md bg-[var(--bg-card)] p-8 md:p-10 space-y-7"
          style={{
            borderRadius: 16,
            borderTop: '5px solid #1e40af',
            boxShadow: theme === 'dark' ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(30,64,175,0.10), 0 1px 6px rgba(0,0,0,0.05)',
          }}
        >
          <div className="text-center space-y-1">
            <div className="flex justify-center gap-2 items-center mb-2">
              <div className="w-9 h-9 bg-[#1e40af] rounded-lg flex items-center justify-center text-white text-base">🚀</div>
              <span className="font-black text-[var(--text-primary)] text-base">StorePilot <span className="text-[#1e40af]">PRO</span></span>
            </div>
            <h2 className="font-black text-[var(--text-primary)] text-2xl">
              {authMode === 'login' ? (isRtl ? 'تسجيل الدخول' : 'Sign In') : (isRtl ? 'إنشاء حساب جديد' : 'Create Account')}
            </h2>
            <p className="text-[var(--text-secondary)] font-medium text-sm">
              {authMode === 'login'
                ? (isRtl ? 'أدخل بياناتك للدخول إلى لوحة التحكم' : 'Enter your credentials to access your dashboard')
                : (isRtl ? 'ابدأ تجربتك المجانية لمدة 14 يوم' : 'Start your 14-day free trial — no card needed')}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl flex items-center gap-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <span className="text-lg">⚠️</span>
              <p className="text-red-600 text-xs font-bold">{error}</p>
            </div>
          )}

          {authMode === 'login' ? (
            <div key="login" className="space-y-5 slide-fade">
              {/* Unified Sign In Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">{isRtl ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="e-input" placeholder={isRtl ? 'اسم المستخدم...' : 'Enter username...'} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">{isRtl ? 'كلمة المرور' : 'Password'}</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="e-input" placeholder="••••••••" />
                </div>
                <button
                  type="button"
                  onClick={handleCredentials}
                  disabled={isLoggingIn || !username.trim() || !password.trim()}
                  className="e-btn-primary w-full py-3.5 rounded-xl text-sm mt-2"
                >
                  {isLoggingIn ? (isRtl ? 'جاري التحقق...' : 'Verifying...') : (isRtl ? 'دخول' : 'Sign In')}
                </button>
              </div>

              <button onClick={handleRecovery} className="w-full text-xs font-bold text-[var(--text-secondary)] hover:text-[#1e40af] transition-all mt-2">
                {isRtl ? 'نسيت بيانات الدخول؟' : 'Forgot credentials?'}
              </button>
            </div>
          ) : (
            <div key="signup" className="space-y-4 slide-fade">

              {/* Premium Luxury Invitation Badge — shown only when arriving via invite link */}
              {inviteContext && (
                <div style={{
                  background: 'linear-gradient(135deg, #09090f 0%, #0f1121 100%)',
                  border: '1px solid #D4AF37',
                  borderRadius: 14,
                  padding: '16px 18px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 0 40px rgba(212,175,55,0.08)',
                }}>
                  {/* Gold glow accent */}
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏪</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '2px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', padding: '2px 7px', borderRadius: 4 }}>
                          {isRtl ? '✦ دعوة رسمية ✦' : '✦ Official Invitation ✦'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: '#f1f5f9', letterSpacing: '0.2px' }}>
                        {isRtl
                          ? `دعوة للانضمام إلى ${inviteContext.storeName || 'المتجر'}`
                          : `Invited to join ${inviteContext.storeName || 'the Store'}`}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{isRtl ? 'صلاحية الحساب:' : 'Account Role:'}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', padding: '1px 8px', borderRadius: 4 }}>
                          {inviteContext.role || 'Staff'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Store Name — hidden when signing up via invite */}
              {!inviteContext && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)] block">{isRtl ? 'اسم المتجر' : 'Store Name'}</label>
                  <input type="text" value={signUpStoreName} onChange={e => setSignUpStoreName(e.target.value)} className="e-input" placeholder={isRtl ? 'اسم متجرك...' : 'Your store name...'} />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                <input type="text" value={signUpName} onChange={e => setSignUpName(e.target.value)} className="e-input" placeholder={isRtl ? 'اسمك الكامل...' : 'Your full name...'} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">{isRtl ? 'البريد الإلكتروني (Gmail)' : 'Email Address (Gmail)'}</label>
                <input type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} className="e-input" placeholder={isRtl ? 'البريد الإلكتروني...' : 'example@gmail.com'} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">{isRtl ? 'كلمة المرور' : 'Password'}</label>
                <input type="password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} className="e-input" placeholder="••••••••" />
              </div>
              <button
                type="button"
                onClick={handleSignUpSubmit}
                disabled={isRegistering}
                className="e-btn-primary w-full py-3.5 rounded-xl text-sm mt-2"
              >
                {isRegistering
                  ? (isRtl ? 'جاري إنشاء الحساب...' : 'Creating account...')
                  : inviteContext
                    ? (isRtl ? '✓ قبول الدعوة والانضمام' : '✓ Accept Invitation & Join')
                    : (isRtl ? '🚀 بدء التجربة المجانية 14 يوم' : '🚀 Start 14-Day Free Trial')
                }
              </button>
              {!inviteContext && (
                <p className="text-center text-xs text-[var(--text-secondary)] font-medium">
                  {isRtl ? 'لا توجد رسوم، لا بطاقة ائتمان مطلوبة.' : 'No charge. No credit card required.'}
                </p>
              )}
            </div>
          )}

          {/* Toggle Auth Mode */}
          <div className="pt-4 border-t border-[var(--border-color)] text-center">
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-sm font-semibold transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseOver={e => e.currentTarget.style.color = '#1e40af'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              {authMode === 'login'
                ? (isRtl ? 'ليس لديك حساب؟ ابدأ تجربة مجانية →' : "Don't have an account? Start free trial →")
                : (isRtl ? 'لديك حساب؟ تسجيل الدخول →' : 'Already have an account? Sign in →')}
            </button>
          </div>
        </div>
      </div>

      {/* Environment-aware Recovery Modal */}
      {showRecoveryModal && renderRecoveryModal()}
    </div>
  );
}


// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ activeTab, setActiveTab, onLogout, user, language, setLanguage, userPermissions, collapsed, setCollapsed, activeBranchName, theme }) {
  const currentUser = user;
  const isDark = theme === 'dark';

  // Sidebar-scoped color tokens — react to theme
  const SB = {
    bg:          isDark ? '#0c0c0f'  : '#ffffff',
    border:      isDark ? '#1e1e24'  : '#e2e8f0',
    userBg:      isDark ? '#141418'  : '#f8fafc',
    userBorder:  isDark ? '#2a2a33'  : '#e2e8f0',
    branchBg:    isDark ? '#1a1a22'  : '#eff6ff',
    branchBorder:isDark ? '#2e2e3c'  : '#bfdbfe',
    branchText:  isDark ? '#93c5fd'  : '#1e40af',
    groupLabel:  isDark ? '#4b5563'  : '#94a3b8',
    navText:     isDark ? '#94a3b8'  : '#64748b',
    navActive:   isDark ? '#1e3a5f'  : '#eff6ff',
    navActiveBorder: isDark ? '#3b82f6' : '#1e40af',
    navActiveText:   isDark ? '#93c5fd' : '#1e40af',
    navHover:    isDark ? '#16161b'  : '#f8fafc',
    toggleBg:    isDark ? '#111115'  : '#ffffff',
    toggleBorder:isDark ? '#2a2a33'  : '#e2e8f0',
    footerBtn:   isDark ? '#94a3b8'  : '#64748b',
    collapseBtn: isDark ? '#1e1e24'  : '#e2e8f0',
    collapseBtnBg: isDark ? '#0c0c0f' : '#fff',
    nameText:    isDark ? '#f1f5f9'  : '#1e293b',
    roleBadge:   isDark ? '#3b82f6'  : '#1e40af',
    logoSubText: isDark ? '#60a5fa'  : '#1e40af',
  };

  const t = T[language];
  const isRtl = language === 'ar';

  // Secret logo click counter for u_4 developer access
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef(null);
  const handleLogoClick = () => {
    if (!currentUser) return;
    const isDev = currentUser.id === 'u_4' || localStorage.getItem('dev_override') === 'true';
    if (!isDev) return;
    logoClickCount.current += 1;
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    if (logoClickCount.current >= 5) {
      logoClickCount.current = 0;
      window.history.pushState({}, '', '/admin-master-u4');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0; }, 1500);
    }
  };

  const groups = [
    {
      label: isRtl ? 'الرئيسية' : 'Main',
      items: [
        { id: 'dashboard', label: t.dashboard, icon: '📊' },
        { id: 'pos', label: t.pos, icon: '🛒' },
        { id: 'shifts', label: t.shifts, icon: '⏱️' },
        { id: 'drawer', label: isRtl ? 'درج الكاشير' : 'Cash Drawer', icon: '💵' },
      ]
    },
    {
      label: isRtl ? 'المبيعات' : 'Sales',
      items: [
        { id: 'sales', label: t.sales, icon: '🧾' },
        { id: 'customers', label: t.customers, icon: '👤' },
        { id: 'expenses', label: t.expenses, icon: '💸' },
      ]
    },
    {
      label: isRtl ? 'المخزون والمشتريات' : 'Stock & Purchasing',
      items: [
        { id: 'inventory', label: t.inventory, icon: '📦' },
        { id: 'purchases', label: t.purchases, icon: '🛍️' },
        { id: 'transfers', label: t.transfers, icon: '🚚' },
      ]
    },
    {
      label: isRtl ? 'الإدارة' : 'Management',
      items: [
        { id: 'treasury', label: t.treasury, icon: '🏦' },
        { id: 'staff', label: t.staff, icon: '👥' },
        { id: 'reports', label: t.reports, icon: '📈' },
        { id: 'branches', label: t.branches, icon: '🏢' },
        { id: 'settings', label: t.settings, icon: '⚙️' },
        ...(currentUser?.id === 'u_4' ? [{ id: 'admin_panel', label: isRtl ? 'لوحة المسؤول' : 'Admin Panel', icon: '🛡️' }] : []),
      ]
    },
  ];

  const w = collapsed ? 'w-[72px]' : 'w-[256px]';

  return (
    <aside
      style={{
        width: collapsed ? 72 : 256,
        background: SB.bg,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.25s ease, background 0.2s ease',
        borderRight: isRtl ? 'none' : `1px solid ${SB.border}`,
        borderLeft: isRtl ? `1px solid ${SB.border}` : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Logo Row — clicking 5 times rapidly grants u_4 developer access */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: '20px 16px', borderBottom: `1px solid ${SB.border}`, position: 'relative', flexShrink: 0 }}>
        {!collapsed && (
          <div
            onClick={handleLogoClick}
            style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', cursor: (currentUser?.id === 'u_4' || localStorage.getItem('dev_override') === 'true') ? 'pointer' : 'default', userSelect: 'none' }}
          >
            <div style={{ width: 36, height: 36, background: '#1e40af', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>🚀</div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: SB.nameText, fontWeight: 900, fontSize: 14, letterSpacing: '0.5px', margin: 0 }}>StorePilot</p>
              <p style={{ color: SB.logoSubText, fontWeight: 700, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>PRO</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            onClick={handleLogoClick}
            style={{ width: 36, height: 36, background: '#1e40af', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: (currentUser?.id === 'u_4' || localStorage.getItem('dev_override') === 'true') ? 'pointer' : 'default', userSelect: 'none' }}
          >🚀</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute',
            top: '50%', transform: 'translateY(-50%)',
            [isRtl ? 'left' : 'right']: collapsed ? '-12px' : '10px',
            width: 22, height: 22,
            background: SB.collapseBtnBg,
            border: `1.5px solid ${SB.collapseBtn}`,
            borderRadius: '50%',
            color: SB.navText,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 60, fontSize: 11, fontWeight: 900,
          }}
        >
          {collapsed ? (isRtl ? '‹' : '›') : (isRtl ? '›' : '‹')}
        </button>
      </div>

      {/* User Badge */}
      {!collapsed && (
        <div style={{ margin: '12px 12px 4px', background: SB.userBg, padding: '12px 14px', borderRadius: 10, border: `1px solid ${SB.userBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#1e40af', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 14, flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ color: SB.nameText, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{user?.name || 'User'}</p>
              <p style={{ color: SB.roleBadge, fontWeight: 800, fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>{user?.role}</p>
            </div>
          </div>
          {activeBranchName && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, background: SB.branchBg, padding: '5px 10px', borderRadius: 6, border: `1px solid ${SB.branchBorder}` }}>
              <span style={{ fontSize: 11 }}>🏢</span>
              <span style={{ color: SB.branchText, fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeBranchName}</span>
            </div>
          )}
        </div>
      )}

      {/* Nav Groups */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 8px' }}>
        {groups.map(group => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            {!collapsed && (
              <p style={{ color: SB.groupLabel, fontWeight: 800, fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 8px', marginBottom: 6, marginTop: 4 }}>{group.label}</p>
            )}
            {group.items.map(tab => {
              const hasPerm = canAccess(user, tab.id, userPermissions);
              const isActive = activeTab === tab.id;
              const isAdmin = tab.id === 'admin_panel';
              return (
                <button key={tab.id}
                  onClick={() => hasPerm && setActiveTab(tab.id)}
                  disabled={!hasPerm}
                  title={collapsed ? tab.label : ''}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '9px 10px',
                    marginBottom: 2,
                    border: 'none',
                    borderRadius: 8,
                    cursor: hasPerm ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease',
                    background: isActive ? (isAdmin ? (isDark ? '#2d2400' : '#fef9c3') : SB.navActive) : 'transparent',
                    opacity: hasPerm ? 1 : 0.3,
                    borderRight: !isRtl && isActive ? '3px solid ' + (isAdmin ? '#eab308' : SB.navActiveBorder) : '3px solid transparent',
                    borderLeft: isRtl && isActive ? '3px solid ' + (isAdmin ? '#eab308' : SB.navActiveBorder) : '3px solid transparent',
                  }}
                  onMouseOver={e => { if (!isActive && hasPerm) { e.currentTarget.style.background = SB.navHover; } }}
                  onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; } }}
                >
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{tab.icon}</span>
                  {!collapsed && (
                    <span style={{
                      color: isActive ? (isAdmin ? '#eab308' : SB.navActiveText) : SB.navText,
                      fontWeight: isActive ? 800 : 600,
                      fontSize: isRtl ? 13 : 12,
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.2px',
                      flex: 1,
                      textAlign: isRtl ? 'right' : 'left',
                    }}>{tab.label}</span>
                  )}
                  {!collapsed && isActive && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isAdmin ? '#eab308' : SB.navActiveBorder, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div style={{ borderTop: `1px solid ${SB.border}`, padding: '8px', flexShrink: 0 }}>
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '10px 0' : '8px 10px', justifyContent: collapsed ? 'center' : 'flex-start', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', color: SB.footerBtn, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.15s' }}
          onMouseOver={e => e.currentTarget.style.background = SB.navHover}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 16 }}>🌐</span>
          {!collapsed && <span>{isRtl ? 'English' : 'العربية'}</span>}
        </button>
        <button
          onClick={() => { if (window.confirm(isRtl ? 'هل تريد تسجيل الخروج؟' : 'Logout?')) onLogout(); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '10px 0' : '8px 10px', justifyContent: collapsed ? 'center' : 'flex-start', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.15s' }}
          onMouseOver={e => e.currentTarget.style.background = isDark ? '#2d0e0e' : '#fef2f2'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 16 }}>🚪</span>
          {!collapsed && <span>{t.logout}</span>}
        </button>
      </div>
    </aside>
  );
}

// ============================================================
// NOTIFICATION OVERLAY
// ============================================================
function NotificationOverlay({ notifications, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2 max-w-sm pointer-events-none">
      {notifications.map(n => (
        <div key={n.id} onClick={() => onDismiss(n.id)}
          className={`px-5 py-4 rounded-none shadow-none text-[var(--text-primary)] text-sm font-bold pointer-events-auto cursor-pointer flex items-center gap-3 ${n.type === 'success' ? 'bg-[#0066FF]' : n.type === 'error' ? 'bg-rose-600' : n.type === 'warning' ? 'bg-amber-600' : 'bg-[#0066FF]'
            }`}>
          <span>{n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : n.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <p className="text-xs">{n.message}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SUBSCRIPTION WARNING BANNER
// ============================================================
function SubscriptionWarningBanner({ daysLeft, onRenew, language }) {
  if (daysLeft === null || daysLeft === undefined || daysLeft > 3 || daysLeft <= 0) return null;
  const isRtl = language === 'ar';

  return (
    <div
      className="shrink-0 z-[100] flex items-center justify-between px-5 py-3 text-xs font-bold"
      style={{
        background: '#fffbeb',
        borderBottom: '1px solid #fde68a',
        borderLeft: '4px solid #d97706',
        color: '#92400e',
      }}
    >
      <div className="flex items-center gap-2">
        <span>⚠️</span>
        <span className="font-bold">
          {isRtl
            ? `ينتهي اشتراكك التجريبي خلال ${daysLeft} أيام. جدد الآن لتجنب انقطاع الخدمة!`
            : `Your trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now to avoid interruption!`}
        </span>
      </div>
      <button
        onClick={onRenew}
        className="px-4 py-1.5 font-black text-xs uppercase tracking-widest rounded-lg transition-all"
        style={{ background: '#1e40af', color: '#fff', flexShrink: 0, marginLeft: 12 }}
        onMouseOver={e => e.currentTarget.style.background = '#1e3a8a'}
        onMouseOut={e => e.currentTarget.style.background = '#1e40af'}
      >
        {isRtl ? 'تجديد' : 'Renew'}
      </button>
    </div>
  );
}


// ============================================================
// STAFF SCREEN - Full Implementation
// ============================================================
function StaffScreen({ employees, setEmployees, paymentsMap, setPaymentsMap, users, setUsers, currentUser, language, pushNotification, activeShift }) {
  const isRtl = language === 'ar';
  const [view, setView] = useState('employees'); // 'employees' | 'users'
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [showPaymentFor, setShowPaymentFor] = useState(null);
  const [showAttendanceFor, setShowAttendanceFor] = useState(null);

  // Form fields
  const [fName, setFName] = useState('');
  const [fRole, setFRole] = useState('Cashier');
  const [fSalary, setFSalary] = useState('');
  const [fFrequency, setFFrequency] = useState('MONTHLY');
  const [fUsername, setFUsername] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fBranchId, setFBranchId] = useState('');

  // Branch list for assignment dropdown
  const [branchList, setBranchList] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Payment form
  const [payType, setPayType] = useState('SALARY');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paymentSource, setPaymentSource] = useState('Drawer');

  // Invite link generator state
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  const generateInviteLink = () => {
    if (!fName.trim() || !fRole) return;
    const activeBranchIdForInvite = fBranchId || localStorage.getItem('active_branch_id') || '';
    const activeStoreName = localStorage.getItem('storeName') || 'StorePilot';
    const params = new URLSearchParams({
      inviteToken: 'true',
      storeId: activeBranchIdForInvite,
      role: fRole,
      storeName: activeStoreName,
    });
    const link = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    setGeneratedInviteLink(link);
    setInviteLinkCopied(false);
  };

  const copyInviteLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink).then(() => {
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 3000);
    }).catch(() => {
      // Fallback for browsers that block clipboard
      const ta = document.createElement('textarea');
      ta.value = generatedInviteLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 3000);
    });
  };

  const ROLES = ['Cashier', 'Admin', 'Manager', 'Accountant', 'Storekeeper'];

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
    return matchSearch && matchRole && !e.deletedAt;
  });

  // Load branches when modal opens
  const loadBranches = async () => {
    setBranchesLoading(true);
    const { data } = await fetchActiveBranches(currentUser?.id);
    setBranchList(data);
    setBranchesLoading(false);
  };

  const openAdd = () => {
    setEditingEmp(null);
    setFName(''); setFRole('Cashier'); setFSalary(''); setFFrequency('MONTHLY'); setFUsername(''); setFPassword(''); setFBranchId('');
    loadBranches();
    setShowForm(true);
  };

  const openEdit = (emp) => {
    setEditingEmp(emp);
    setFName(emp.name); setFRole(emp.role); setFSalary(emp.salaryBase.toString()); setFFrequency(emp.paymentFrequency || 'MONTHLY');
    setFUsername(emp.username || ''); setFPassword(''); setFBranchId(emp.assignedBranchId || '');
    loadBranches();
    setShowForm(true);
  };

  const handleSave = () => {
    if (!fName.trim() || !fSalary) return;
    if (!fUsername.trim()) { alert(isRtl ? 'أدخل اسم المستخدم' : 'Enter username'); return; }
    if (!editingEmp && !fPassword) { alert(isRtl ? 'أدخل كلمة السر' : 'Enter password'); return; }
    // Require branch for non-Owner roles
    if (fRole !== 'Owner' && !fBranchId) { alert(isRtl ? 'اختر الفرع التابع له' : 'Please select an assigned branch'); return; }

    const unameTaken = users.some(u => u.username === fUsername && u.id !== editingEmp?.userId);
    if (unameTaken) { alert(isRtl ? 'اسم المستخدم محجوز' : 'Username already taken'); return; }

    const branchIdVal = fRole === 'Owner' ? null : (fBranchId || null);
    const branchNameVal = branchList.find(b => b.id === branchIdVal)?.name || null;

    if (editingEmp) {
      const updated = { ...editingEmp, name: fName.trim(), role: fRole, salaryBase: parseFloat(fSalary), paymentFrequency: fFrequency, username: fUsername, assignedBranchId: branchIdVal, assignedBranchName: branchNameVal, ...(fPassword ? { pin: fPassword } : {}) };
      setEmployees(prev => prev.map(e => e.id === editingEmp.id ? updated : e));
      // sync user
      if (editingEmp.userId) {
        const u = users.find(x => x.id === editingEmp.userId);
        if (u) setUsers(prev => prev.map(x => x.id === u.id ? { ...x, name: fName.trim(), username: fUsername, role: fRole, assignedBranchId: branchIdVal, assignedBranchName: branchNameVal, ...(fPassword ? { password: fPassword, pin: fPassword } : {}) } : x));
      }
      pushNotification(isRtl ? 'تم تحديث الموظف' : 'Employee updated', 'success');
    } else {
      const empId = 'EMP-' + Date.now().toString(36).toUpperCase();
      const userId = 'USR-' + Date.now().toString(36).toUpperCase();
      const newUser = { id: userId, name: fName.trim(), username: fUsername, password: fPassword, pin: fPassword, role: fRole, isActive: true, assignedBranchId: branchIdVal, assignedBranchName: branchNameVal };
      const newEmp = { id: empId, userId, name: fName.trim(), role: fRole, salaryBase: parseFloat(fSalary), paymentFrequency: fFrequency, username: fUsername, pin: fPassword, assignedBranchId: branchIdVal, assignedBranchName: branchNameVal, status: 'ACTIVE', shiftStatus: 'OFF_SHIFT', todaySales: 0, performance: { monthSales: 0, invoiceCount: 0, avgInvoice: 0, returns: 0, commission: 0, cashDiff: 0 } };
      setUsers(prev => [...prev, newUser]);
      setEmployees(prev => [...prev, newEmp]);
      pushNotification(isRtl ? 'تم إضافة الموظف' : 'Employee added', 'success');
    }
    setShowForm(false);
  };

  const handleToggleStatus = (emp) => {
    const newStatus = emp.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: newStatus } : e));
    if (emp.userId) setUsers(prev => prev.map(u => u.id === emp.userId ? { ...u, isActive: newStatus === 'ACTIVE' } : u));
    pushNotification(newStatus === 'ACTIVE' ? (isRtl ? 'تم تفعيل الموظف' : 'Employee activated') : (isRtl ? 'تم تعليق الموظف' : 'Employee suspended'), 'info');
  };

  const handleDelete = (emp) => {
    if (!window.confirm(isRtl ? 'حذف الموظف؟' : 'Delete employee?')) return;
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, deletedAt: new Date() } : e));
    pushNotification(isRtl ? 'تم حذف الموظف' : 'Employee deleted', 'info');
  };

  const handleAddPayment = () => {
    if (!payAmount || !showPaymentFor) return;
    const emp = showPaymentFor;
    const isDrawer = paymentSource === 'Drawer';
    const amt = Number(payAmount) || 0;
    const pmt = { id: 'PY-' + Date.now(), type: payType, amount: amt, note: payNote, timestamp: new Date(), shiftId: isDrawer ? (activeShift?.id || 'manual') : null, source: paymentSource };
    
    setPaymentsMap(prev => ({ ...prev, [emp.id]: [pmt, ...(prev[emp.id] || [])] }));

    if (isDrawer) {
      if (setDrawerBalance) setDrawerBalance(prev => prev - amt);
      if (setDrawerLogs) setDrawerLogs(prev => [{ id: 'DL-PY-' + pmt.id, type: 'OUT', amount: amt, note: `Staff ${payType}`, timestamp: new Date(), shiftId: activeShift?.id || 'manual' }, ...prev]);
    } else {
      if (setMainSafeBalance) setMainSafeBalance(prev => prev - amt);
      if (setCashLog) setCashLog(prev => [{ id: 'SAFE-PY-' + pmt.id, type: 'PAYROLL_CASH', direction: 'OUT', amount: amt, note: `Staff ${payType}`, createdAt: Date.now(), userId: currentUser?.id, refId: pmt.id, affectsDrawer: true }, ...prev]);
    }

    setPayAmount(''); setPayNote('');
    pushNotification(payType === 'SALARY' ? (isRtl ? 'تم صرف الراتب' : 'Salary paid') : (isRtl ? 'تم صرف السلفة' : 'Advance paid'), 'success');
  };

  const handleAddAttendance = () => {
    const emp = showAttendanceFor;
    if (!emp) return;
    const today = new Date().toISOString().split('T')[0];
    const existing = (paymentsMap['ATT_' + emp.id] || []).find(a => a.dateKey === today);
    if (existing) { alert(isRtl ? 'تم تسجيل حضور اليوم مسبقاً' : 'Attendance already recorded today'); return; }
    const rec = { id: 'ATT-' + Date.now(), dateKey: today, status: 'PRESENT', checkIn: new Date().toLocaleTimeString(), source: 'MANUAL' };
    setPaymentsMap(prev => ({ ...prev, ['ATT_' + emp.id]: [rec, ...(prev['ATT_' + emp.id] || [])] }));
    pushNotification(isRtl ? 'تم تسجيل الحضور' : 'Attendance recorded', 'success');
  };

  const totalSalaries = employees.filter(e => !e.deletedAt).reduce((s, e) => s + (e.salaryBase || 0), 0);
  const totalPaid = Object.entries(paymentsMap).filter(([k]) => !k.startsWith('ATT_')).reduce((s, [, pmts]) => s + pmts.filter(p => p.type === 'SALARY').reduce((a, p) => a + p.amount, 0), 0);
  const activeCount = employees.filter(e => e.status === 'ACTIVE' && !e.deletedAt).length;

  const roleColors = { Owner: 'bg-amber-100 text-amber-700', Admin: 'bg-teal-100 text-[#0066FF]', Manager: 'bg-teal-100 text-[#0066FF]', Cashier: 'bg-emerald-100 text-[#0066FF]', Accountant: 'bg-blue-100 text-blue-700', Storekeeper: 'bg-orange-100 text-orange-700' };

  return (
    <div className="flex flex-col h-full" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Stats */}
      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: isRtl ? 'إجمالي الموظفين' : 'Total Staff', value: employees.filter(e => !e.deletedAt).length, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--bg-card)]' },
          { label: isRtl ? 'نشطون' : 'Active', value: activeCount, color: 'text-[#0066FF]', bg: 'bg-emerald-50' },
          { label: isRtl ? 'إجمالي الرواتب' : 'Total Salaries', value: formatMoney(totalSalaries), color: 'text-[#0066FF]', bg: 'bg-[#1a1a1a]' },
          { label: isRtl ? 'مدفوع هذا الشهر' : 'Paid This Month', value: formatMoney(totalPaid), color: 'text-[#0066FF]', bg: 'bg-[var(--bg-card)]' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[var(--border-color)] p-5 rounded-none shadow-none`}>
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-3 shrink-0 mb-4">
        {[['employees', isRtl ? '👥 الموظفون' : '👥 Employees'], ['users', isRtl ? '🔑 صلاحيات الدخول' : '🔑 Access Users']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-6 py-3 rounded-none font-black text-xs uppercase tracking-widest transition-all ${view === v ? 'bg-slate-900 text-white' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-deep)]'}`}>{l}</button>
        ))}
      </div>

      {view === 'employees' && (
        <div className="flex-1 overflow-auto px-6 pb-6 space-y-4" style={{}}>
          {/* Controls */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <input type="text" placeholder={isRtl ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none px-10 py-3 text-sm font-bold outline-none" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</span>
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none">
              <option value="ALL">{isRtl ? 'كل الأدوار' : 'All Roles'}</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={openAdd} className="bg-[#0066FF] text-[var(--text-primary)] px-6 py-3 rounded-none font-black text-xs uppercase">
              + {isRtl ? 'موظف جديد' : 'New Employee'}
            </button>
          </div>

          {/* Employee Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(emp => {
              const empPmts = paymentsMap[emp.id] || [];
              const totalPaidEmp = empPmts.filter(p => p.type === 'SALARY').reduce((s, p) => s + p.amount, 0);
              const totalAdv = empPmts.filter(p => p.type === 'ADVANCE').reduce((s, p) => s + p.amount, 0);
              const remaining = Math.max(0, emp.salaryBase - totalPaidEmp - totalAdv);
              const attRecs = paymentsMap['ATT_' + emp.id] || [];
              const today = new Date().toISOString().split('T')[0];
              const todayAtt = attRecs.find(a => a.dateKey === today);

              return (
                <div key={emp.id} className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] shadow-none hover:shadow-none transition-all overflow-hidden">
                  {/* Card Header */}
                  <div className={`p-5 ${emp.status === 'SUSPENDED' ? 'bg-[var(--bg-deep)]' : 'bg-[var(--bg-card)]'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-none flex items-center justify-center font-black text-xl shadow-none ${emp.status === 'SUSPENDED' ? 'bg-slate-200 text-[var(--text-muted)]' : 'bg-[#0066FF] text-[var(--text-primary)]'}`}>
                          {emp.name[0]}
                        </div>
                        <div>
                          <p className={`font-black text-base ${emp.status === 'SUSPENDED' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>{emp.name}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-none ${roleColors[emp.role] || 'bg-[var(--bg-deep)] text-[var(--text-muted)]'}`}>{emp.role}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-none ${emp.status === 'ACTIVE' ? 'bg-emerald-100 text-[#0066FF]' : 'bg-rose-100 text-rose-600'}`}>
                          {emp.status === 'ACTIVE' ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'موقوف' : 'Suspended')}
                        </span>
                        {todayAtt && <span className="text-[9px] font-black px-2 py-0.5 rounded-none bg-blue-100 text-blue-600">✓ {isRtl ? 'حاضر' : 'Present'}</span>}
                      </div>
                    </div>

                    {/* Salary Info */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[var(--bg-deep)] rounded-none p-3">
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'الراتب' : 'Salary'}</p>
                        <p className="font-black text-slate-700 text-sm">{formatMoney(emp.salaryBase)}</p>
                        <p className="text-[8px] text-[var(--text-muted)]">{emp.paymentFrequency === 'MONTHLY' ? (isRtl ? 'شهري' : 'Monthly') : emp.paymentFrequency === 'WEEKLY' ? (isRtl ? 'أسبوعي' : 'Weekly') : (isRtl ? 'يومي' : 'Daily')}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-none p-3">
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'مدفوع' : 'Paid'}</p>
                        <p className="font-black text-[#0066FF] text-sm">{formatMoney(totalPaidEmp)}</p>
                      </div>
                      <div className={`rounded-none p-3 ${remaining > 0 ? 'bg-amber-50' : 'bg-[var(--bg-deep)]'}`}>
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'متبقي' : 'Remaining'}</p>
                        <p className={`font-black text-sm ${remaining > 0 ? 'text-amber-600' : 'text-[var(--text-muted)]'}`}>{formatMoney(remaining)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment History mini */}
                  {empPmts.length > 0 && (
                    <div className="px-5 py-3 bg-[var(--bg-deep)] border-t border-[var(--border-color)]">
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2">{isRtl ? 'آخر المعاملات' : 'Recent Payments'}</p>
                      {empPmts.slice(0, 2).map(p => (
                        <div key={p.id} className="flex justify-between items-center py-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-none ${p.type === 'SALARY' ? 'bg-emerald-100 text-[#0066FF]' : 'bg-amber-100 text-amber-600'}`}>
                            {p.type === 'SALARY' ? (isRtl ? 'راتب' : 'Salary') : (isRtl ? 'سلفة' : 'Advance')}
                          </span>
                          <span className="font-black text-slate-700 text-xs">{formatMoney(p.amount)}</span>
                          <span className="text-[9px] text-[var(--text-muted)]">{new Date(p.timestamp).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-5 py-4 border-t border-[var(--border-color)] flex gap-2 flex-wrap">
                    <button onClick={() => { setShowPaymentFor(emp); setPayType('SALARY'); setPayAmount(''); setPayNote(''); }}
                      className="flex-1 bg-[#0066FF] text-[var(--text-primary)] py-2 rounded-none font-black text-[9px] uppercase transition-all hover:bg-[#0066FF] min-w-16">
                      💵 {isRtl ? 'صرف' : 'Pay'}
                    </button>
                    <button onClick={() => { setShowAttendanceFor(emp); }}
                      className="flex-1 bg-blue-600 text-[var(--text-primary)] py-2 rounded-none font-black text-[9px] uppercase transition-all hover:bg-blue-700 min-w-16">
                      📋 {isRtl ? 'حضور' : 'Attend.'}
                    </button>
                    <button onClick={() => openEdit(emp)}
                      className="flex-1 bg-[var(--bg-deep)] text-slate-600 py-2 rounded-none font-black text-[9px] uppercase transition-all hover:bg-slate-200 min-w-16">
                      ✏️ {isRtl ? 'تعديل' : 'Edit'}
                    </button>
                    <button onClick={() => handleToggleStatus(emp)}
                      className={`flex-1 py-2 rounded-none font-black text-[9px] uppercase transition-all min-w-16 ${emp.status === 'ACTIVE' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-[#0066FF] hover:bg-emerald-200'}`}>
                      {emp.status === 'ACTIVE' ? (isRtl ? '⏸ تعليق' : '⏸ Suspend') : (isRtl ? '▶ تفعيل' : '▶ Activate')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="h-48 flex flex-col items-center justify-center text-slate-300">
              <span className="text-6xl">👥</span>
              <p className="font-black uppercase text-sm mt-3">{employees.length === 0 ? (isRtl ? 'لا موظفين بعد — أضف أول موظف!' : 'No employees yet — add your first!') : (isRtl ? 'لا نتائج مطابقة' : 'No matches found')}</p>
            </div>
          )}
        </div>
      )}

      {view === 'users' && (
        <div className="flex-1 overflow-auto px-6 pb-6" style={{}}>
          <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] overflow-hidden">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'مستخدمو النظام' : 'System Users'}</h3>
              <span className="text-[10px] font-black text-[var(--text-muted)] bg-[var(--bg-deep)] px-3 py-1 rounded-none">{users.length} {isRtl ? 'مستخدم' : 'users'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-[var(--border-color)] bg-[var(--bg-deep)]">
                  {[isRtl ? 'المستخدم' : 'User', isRtl ? 'اسم الدخول' : 'Username', isRtl ? 'الدور' : 'Role', isRtl ? 'الحالة' : 'Status', ''].map(h => (
                    <th key={h} className="px-6 py-4 text-start text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-[var(--bg-deep)] transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 text-[#0066FF] rounded-none flex items-center justify-center font-black">{(u.name || '?')[0]}</div>
                          <div>
                            <p className="font-black text-[var(--text-primary)] text-sm">{u.name}</p>
                            <p className="text-[9px] text-[var(--text-muted)]">ID: {u.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[#0066FF] text-sm font-bold">{u.username || '—'}</td>
                      <td className="px-6 py-4"><span className={`text-[9px] font-black px-3 py-1 rounded-none ${roleColors[u.role] || 'bg-[var(--bg-deep)] text-[var(--text-muted)]'}`}>{u.role}</span></td>
                      <td className="px-6 py-4"><span className={`text-[9px] font-black px-3 py-1 rounded-none ${u.isActive ? 'bg-emerald-100 text-[#0066FF]' : 'bg-rose-100 text-rose-600'}`}>{u.isActive ? (isRtl ? 'مفعل' : 'Active') : (isRtl ? 'معطل' : 'Disabled')}</span></td>
                      <td className="px-6 py-4">
                        {u.role !== 'Owner' && (
                          <button onClick={() => { if (window.confirm(isRtl ? "إلغاء وصول هذا المستخدم؟" : "Revoke this user's access?")) { setUsers(prev => prev.filter(x => x.id !== u.id)); } }}
                            className="text-rose-400 hover:text-rose-600 text-[10px] font-black uppercase transition-colors">
                            🔒 {isRtl ? 'إلغاء الوصول' : 'Revoke'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showForm && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--bg-card)] rounded-none p-8 max-w-md w-full shadow-none max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{}}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">{editingEmp ? (isRtl ? 'تعديل الموظف' : 'Edit Employee') : (isRtl ? 'موظف جديد' : 'New Employee')}</h2>
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{isRtl ? 'بيانات الملف الوظيفي' : 'Employee Profile'}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-none bg-[var(--bg-deep)] flex items-center justify-center hover:bg-slate-200 transition-colors">✕</button>
            </div>

            <div className="space-y-5">
              {[
                [isRtl ? 'الاسم الكامل' : 'Full Name', fName, setFName, 'text', isRtl ? 'أحمد محمد...' : 'John Doe...'],
                [isRtl ? 'اسم المستخدم' : 'Username', fUsername, setFUsername, 'text', 'ahmed123'],
                [isRtl ? 'كلمة السر / PIN' : 'Password / PIN', fPassword, setFPassword, 'password', '••••'],
                [isRtl ? 'الراتب الأساسي' : 'Base Salary', fSalary, setFSalary, 'number', '0.00'],
              ].map(([label, val, setter, type, ph]) => (
                <div key={label}>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1.5">{label}</label>
                  <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 transition-all" />
                </div>
              ))}

              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1.5">{isRtl ? 'الدور الوظيفي' : 'Role'}</label>
                <select value={fRole} onChange={e => setFRole(e.target.value)}
                  className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Branch Assignment Dropdown */}
              <div>
                <label className="text-[10px] font-black uppercase block mb-1.5" style={{ color: '#D4AF37', letterSpacing: '2px' }}>
                  {isRtl ? '🏢 الفرع التابع له' : '🏢 Assigned Branch'}
                  {fRole !== 'Owner' && <span className="text-rose-400 mx-1">*</span>}
                </label>
                {fRole === 'Owner' ? (
                  <div className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-xs font-bold text-[#D4AF37] flex items-center gap-2">
                    <span>👑</span>
                    {isRtl ? 'المالك — صلاحية على جميع الفروع' : 'Owner — Global Access to All Branches'}
                  </div>
                ) : branchesLoading ? (
                  <div className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-xs font-bold text-[#666] flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-[#333] border-t-[#D4AF37] animate-spin" style={{ borderRadius: '50%' }} />
                    {isRtl ? 'جاري تحميل الفروع...' : 'Loading branches...'}
                  </div>
                ) : (
                  <select value={fBranchId} onChange={e => setFBranchId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-sm font-bold outline-none transition-all text-[var(--text-primary)]"
                    style={{ borderColor: fBranchId ? '#D4AF37' : '#333' }}>
                    <option value="">{isRtl ? '— اختر الفرع —' : '— Select Branch —'}</option>
                    {branchList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
                {!branchesLoading && branchList.length === 0 && fRole !== 'Owner' && (
                  <p className="text-[9px] text-amber-400 font-bold mt-1">
                    {isRtl ? '⚠️ لا توجد فروع — أضف فرعاً من لوحة إدارة الفروع أولاً' : '⚠️ No branches found — provision one first'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1.5">{isRtl ? 'دورية الصرف' : 'Payment Frequency'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['DAILY', isRtl ? 'يومي' : 'Daily'], ['WEEKLY', isRtl ? 'أسبوعي' : 'Weekly'], ['MONTHLY', isRtl ? 'شهري' : 'Monthly']].map(([v, l]) => (
                    <button key={v} onClick={() => setFFrequency(v)}
                      className={`py-3 rounded-none text-[10px] font-black uppercase border-2 transition-all ${fFrequency === v ? 'bg-[#0066FF] border-[#0066FF] text-[var(--text-primary)]' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Premium Invite Link Generator — available only on 'Add New' (not edit) */}
              {!editingEmp && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 18, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>🔗</span>
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase" style={{ letterSpacing: 1.5 }}>
                        {isRtl ? 'رابط الدعوة الخاص' : 'Private Invitation Link'}
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={generateInviteLink}
                      disabled={!fName.trim() || !fRole}
                      className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-none transition-all flex items-center gap-1.5"
                      style={{
                        background: (!fName.trim() || !fRole) ? '#1a1a1f' : 'linear-gradient(135deg, #1e40af, #2563eb)',
                        color: (!fName.trim() || !fRole) ? '#555' : '#fff',
                        border: '1px solid',
                        borderColor: (!fName.trim() || !fRole) ? '#333' : '#3b82f6',
                        cursor: (!fName.trim() || !fRole) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span>⚡</span>
                      {isRtl ? 'توليد الرابط' : 'Generate Link'}
                    </button>
                  </div>
                  {generatedInviteLink && (
                    <div style={{ background: 'linear-gradient(135deg, #09090f, #0a1020)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, padding: '12px 14px', boxShadow: '0 0 20px rgba(212,175,55,0.05)' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 9, color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>
                        {isRtl ? '✦ أرسل هذا الرابط للموظف ✦' : '✦ Send this link to the employee ✦'}
                      </p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                        <div style={{ flex: 1, background: '#0f0f18', border: '1px solid #2a2a3c', borderRadius: 6, padding: '8px 10px', fontFamily: 'monospace', fontSize: 10, color: '#94a3b8', wordBreak: 'break-all', lineHeight: 1.5 }}>
                          {generatedInviteLink}
                        </div>
                        <button
                          type="button"
                          onClick={copyInviteLink}
                          style={{
                            flexShrink: 0,
                            width: 72,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 3,
                            padding: '6px 8px',
                            background: inviteLinkCopied
                              ? 'linear-gradient(135deg, #15803d, #16a34a)'
                              : 'linear-gradient(135deg, #1e40af, #2563eb)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 16,
                            fontWeight: 900,
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: inviteLinkCopied
                              ? '0 0 16px rgba(22,163,74,0.4)'
                              : '0 0 16px rgba(59,130,246,0.3)',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{inviteLinkCopied ? '✓' : '📋'}</span>
                          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            {inviteLinkCopied
                              ? (isRtl ? 'تم ✓' : 'Copied!')
                              : (isRtl ? 'نسخ' : 'Copy')}
                          </span>
                        </button>
                      </div>
                      {inviteLinkCopied && (
                        <p style={{ margin: '8px 0 0', fontSize: 9, color: '#16a34a', fontWeight: 700, textAlign: 'center', animation: 'pulse 1s ease' }}>
                          {isRtl ? '✓ تم نسخ الرابط بنجاح! أرسله للموظف الآن.' : '✓ Link copied! Send it to the employee now.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-[var(--bg-deep)] text-slate-600 rounded-none font-black uppercase text-xs">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSave} className="flex-[2] py-4 bg-[#0066FF] text-[var(--text-primary)] rounded-none font-black uppercase text-xs hover:bg-[#0066FF] transition-all">
                  {editingEmp ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة الموظف' : 'Add Employee')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentFor && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowPaymentFor(null)}>
          <div className="bg-[var(--bg-card)] rounded-none p-8 max-w-sm w-full shadow-none" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'صرف مبلغ' : 'Process Payment'}</h2>
                <p className="text-[10px] text-[var(--text-muted)] font-bold">{showPaymentFor.name}</p>
              </div>
              <button onClick={() => setShowPaymentFor(null)} className="w-10 h-10 rounded-none bg-[var(--bg-deep)] flex items-center justify-center">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[['SALARY', isRtl ? '💵 راتب' : '💵 Salary'], ['ADVANCE', isRtl ? '💸 سلفة' : '💸 Advance']].map(([v, l]) => (
                  <button key={v} onClick={() => setPayType(v)}
                    className={`py-4 rounded-none font-black text-xs uppercase border-2 transition-all ${payType === v ? (v === 'SALARY' ? 'bg-[#0066FF] border-emerald-600 text-[var(--text-primary)]' : 'bg-amber-600 border-amber-600 text-[var(--text-primary)]') : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}>{l}</button>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'المبلغ' : 'Amount'}</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00"
                  className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-4 text-2xl font-black text-center outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'ملاحظة' : 'Note'}</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder={isRtl ? 'اختياري...' : 'Optional...'}
                  className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">{isRtl ? 'مصدر الدفع' : 'Payment Source'}</label>
                <select value={paymentSource} onChange={e => setPaymentSource(e.target.value)}
                  className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none border-t-2 border-[#0066FF]">
                  <option value="Drawer">{isRtl ? 'الدرج (الوردية الحالية)' : 'Drawer (Current Shift)'}</option>
                  <option value="Main Safe">{isRtl ? 'الخزينة الرئيسية' : 'Main Safe'}</option>
                </select>
              </div>
              <div className="bg-[var(--bg-deep)] rounded-none p-4 text-center">
                <p className="text-[9px] text-[var(--text-muted)] font-black uppercase">{isRtl ? 'الراتب الأساسي' : 'Base Salary'}</p>
                <p className="font-black text-slate-700">{formatMoney(showPaymentFor.salaryBase)}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPaymentFor(null)} className="flex-1 py-4 bg-[var(--bg-deep)] text-slate-600 rounded-none font-black uppercase text-xs">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={() => { handleAddPayment(); setShowPaymentFor(null); }} disabled={!payAmount}
                  className="flex-[2] py-4 bg-[#0066FF] text-[var(--text-primary)] rounded-none font-black uppercase text-xs disabled:opacity-30 hover:bg-[#0066FF] transition-all">
                  ✓ {isRtl ? 'تأكيد الصرف' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceFor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAttendanceFor(null)}>
          <div className="bg-[var(--bg-card)] rounded-none p-8 max-w-sm w-full shadow-none" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'سجل الحضور' : 'Attendance'}</h2>
                <p className="text-[10px] text-[var(--text-muted)] font-bold">{showAttendanceFor.name}</p>
              </div>
              <button onClick={() => setShowAttendanceFor(null)} className="w-10 h-10 rounded-none bg-[var(--bg-deep)] flex items-center justify-center">✕</button>
            </div>
            <div className="space-y-4">
              <button onClick={handleAddAttendance} className="w-full py-5 bg-blue-600 text-[var(--text-primary)] rounded-none font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                📋 {isRtl ? 'تسجيل حضور اليوم' : 'Mark Present Today'}
              </button>
              <div className="max-h-64 overflow-y-auto space-y-2" style={{}}>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase">{isRtl ? 'سجل الحضور' : 'History'}</p>
                {(paymentsMap['ATT_' + showAttendanceFor.id] || []).map(rec => (
                  <div key={rec.id} className="flex justify-between p-3 bg-blue-50 rounded-none">
                    <span className="font-bold text-slate-700 text-sm">{rec.dateKey}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-none bg-blue-100 text-blue-600">✓ {rec.status}</span>
                  </div>
                ))}
                {!(paymentsMap['ATT_' + showAttendanceFor.id] || []).length && (
                  <p className="text-center text-slate-300 text-xs font-bold py-4">{isRtl ? 'لا سجلات حضور' : 'No records yet'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// PURCHASES SCREEN
// ============================================================
function PurchasesScreen({ purchases, setPurchases, items, setItems, vouchers, setVouchers, activeShift, currentUser, language, users, pushNotification, setDrawerBalance, setDrawerLogs, setMainSafeBalance, setCashLog }) {
  const isRtl = language === 'ar';
  const [tab, setTab] = useState('new'); // new | history | vouchers
  const [supplier, setSupplier] = useState('');
  const [paymentSource, setPaymentSource] = useState('drawer');
  const [payType, setPayType] = useState('Cash');
  const [cart, setCart] = useState([]);
  const [entryName, setEntryName] = useState('');
  const [entryQty, setEntryQty] = useState('1');
  const [entryCost, setEntryCost] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Voucher form
  const [vSupp, setVSupp] = useState('');
  const [vAmt, setVAmt] = useState('');
  const [vMethod, setVMethod] = useState('Cash');
  const [vSource, setVSource] = useState('drawer');
  const [vNote, setVNote] = useState('');

  const suggestions = useMemo(() => {
    if (!entryName.trim()) return [];
    return items.filter(i => i.name.en.toLowerCase().includes(entryName.toLowerCase()) || i.name.ar.includes(entryName)).slice(0, 5);
  }, [items, entryName]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.qty * i.cost, 0), [cart]);

  const handleAddLine = () => {
    const qty = parseFloat(entryQty);
    const cost = parseFloat(entryCost);
    if (!entryName.trim() || isNaN(qty) || qty <= 0 || isNaN(cost) || cost < 0) {
      alert(isRtl ? 'أدخل اسم وكمية وسعر صحيح' : 'Enter valid name, quantity, and cost'); return;
    }
    setCart(prev => [...prev, { id: Date.now().toString(), itemId: selectedItemId, name: entryName, qty, cost, isManual: !selectedItemId }]);
    setEntryName(''); setEntryQty('1'); setEntryCost(''); setSelectedItemId(null); setShowSuggestions(false);
  };

  const handlePost = () => {
    if (!supplier.trim() || cart.length === 0) { alert(isRtl ? 'أدخل اسم المورد وأضف أصناف' : 'Enter supplier name and add items'); return; }
    const p = {
      id: 'PUR-' + Date.now().toString(36).toUpperCase(),
      serialNumber: Math.floor(Math.random() * 100000),
      supplierName: supplier.trim(),
      timestamp: new Date(),
      items: cart.map(i => ({ itemId: i.itemId, name: { en: i.name, ar: i.name }, quantity: i.qty, costPrice: i.cost, isManual: i.isManual })),
      total: cartTotal,
      amountPaid: payType === 'Cash' ? cartTotal : 0,
      remainingAmount: payType === 'Cash' ? 0 : cartTotal,
      paymentType: payType,
      userId: currentUser.id,
      status: payType === 'Cash' ? 'PAID' : 'UNPAID',
      shiftId: activeShift?.id || 'manual',
      paymentSource: payType === 'Cash' ? paymentSource : null
    };
    // Update stock for linked items
    cart.forEach(line => {
      if (line.itemId) {
        setItems(prev => prev.map(i => i.id === line.itemId ? { ...i, stock: (i.stock || 0) + line.qty } : i));
      }
    });
    setPurchases(prev => [p, ...prev]);

    if (payType === 'Cash' || payType === 'نقدي') {
      if (paymentSource === 'drawer') {
        if (setDrawerBalance) setDrawerBalance(prev => prev - Number(cartTotal));
        if (setDrawerLogs) setDrawerLogs(prev => [{ id: 'DL-PUR-' + Date.now(), type: 'OUT', amount: Number(cartTotal), note: `مشتريات: ${p.supplierName}`, timestamp: new Date(), shiftId: activeShift?.id || 'manual' }, ...prev]);
      } else if (paymentSource === 'safe') {
        if (setMainSafeBalance) setMainSafeBalance(prev => prev - Number(cartTotal));
        if (setCashLog) setCashLog(prev => [{ id: 'SAFE-PUR-' + Date.now(), type: 'MANUAL_OUT', direction: 'OUT', amount: Number(cartTotal), note: `مشتريات: ${p.supplierName}`, timestamp: new Date(), createdAt: Date.now(), affectsDrawer: true, userId: currentUser?.id, refId: p.id }, ...prev]);
      }
    }

    setCart([]); setSupplier(''); setPayType('Cash');
    pushNotification(isRtl ? 'تم تسجيل فاتورة التوريد' : 'Purchase invoice posted', 'success');
    setTab('history');
  };

  const handleVoucher = () => {
    if (!vSupp.trim() || !vAmt) { alert(isRtl ? 'أدخل المورد والمبلغ' : 'Enter supplier and amount'); return; }
    // Find unpaid purchases for this supplier and reduce their remaining
    const amt = parseFloat(vAmt);
    let remaining = amt;
    setPurchases(prev => prev.map(p => {
      if (p.supplierName === vSupp && p.remainingAmount > 0 && remaining > 0) {
        const pay = Math.min(p.remainingAmount, remaining);
        remaining -= pay;
        const newRemaining = p.remainingAmount - pay;
        return { ...p, amountPaid: p.amountPaid + pay, remainingAmount: newRemaining, status: newRemaining <= 0 ? 'PAID' : 'PARTIALLY_PAID' };
      }
      return p;
    }));
    const v = { id: 'VCH-' + Date.now().toString(36).toUpperCase(), voucherSerial: Math.floor(Math.random() * 10000), supplierName: vSupp, amount: amt, paymentMethod: vMethod, paymentSource: vMethod === 'Cash' ? vSource : null, note: vNote, timestamp: new Date(), userId: currentUser.id, shiftId: activeShift?.id || 'manual' };
    setVouchers(prev => [v, ...prev]);

    if (vMethod === 'Cash') {
      if (vSource === 'drawer') {
        if (setDrawerBalance) setDrawerBalance(prev => prev - amt);
        if (setDrawerLogs) setDrawerLogs(prev => [{ id: 'DL-VCH-' + v.id, type: 'OUT', amount: amt, note: `سداد مورد: ${vSupp}`, timestamp: new Date(), shiftId: activeShift?.id || 'manual' }, ...prev]);
      } else {
        if (setMainSafeBalance) setMainSafeBalance(prev => prev - amt);
        if (setCashLog) setCashLog(prev => [{ id: 'SAFE-VCH-' + v.id, type: 'MANUAL_OUT', direction: 'OUT', amount: amt, note: `سداد مورد: ${vSupp}`, createdAt: Date.now(), affectsDrawer: true, userId: currentUser?.id, refId: v.id }, ...prev]);
      }
    }

    setVSupp(''); setVAmt(''); setVNote('');
    pushNotification(isRtl ? 'تم تسجيل سند الصرف' : 'Payment voucher posted', 'success');
  };

  const supplierNames = [...new Set([...purchases.map(p => p.supplierName), ...vouchers.map(v => v.supplierName)].filter(Boolean))];
  const statusColors = { PAID: 'bg-emerald-100 text-[#0066FF]', PARTIALLY_PAID: 'bg-amber-100 text-amber-700', UNPAID: 'bg-rose-100 text-rose-600', Voided: 'bg-[var(--bg-deep)] text-[var(--text-muted)]' };
  const statusLabel = { PAID: isRtl ? 'مدفوع' : 'Paid', PARTIALLY_PAID: isRtl ? 'جزئي' : 'Partial', UNPAID: isRtl ? 'غير مدفوع' : 'Unpaid', Voided: isRtl ? 'ملغي' : 'Voided' };

  return (
    <div className="flex flex-col h-full" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Tabs */}
      <div className="px-6 pt-6 flex gap-3 shrink-0">
        {[['new', isRtl ? '🛍️ فاتورة جديدة' : '🛍️ New Invoice'], ['history', isRtl ? '📋 سجل المشتريات' : '📋 History'], ['vouchers', isRtl ? '💵 سندات الصرف' : '💵 Payment Vouchers']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`px-5 py-3 rounded-none font-black text-xs uppercase transition-all ${tab === v ? 'bg-slate-900 text-white' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-deep)]'}`}>{l}</button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6" style={{}}>
          {/* Left: Entry form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Supplier */}
            <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] p-6 space-y-4">
              <h3 className="font-black text-[var(--text-primary)] uppercase text-sm">{isRtl ? 'بيانات المورد' : 'Supplier Info'}</h3>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder={isRtl ? 'اسم المورد...' : 'Supplier name...'}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" list="suppList" />
                  <datalist id="suppList">{supplierNames.map(n => <option key={n} value={n} />)}</datalist>
                </div>
                <div className="flex gap-2">
                  {['Cash', 'Credit'].map(m => (
                    <button key={m} onClick={() => setPayType(m)} className={`px-5 py-3 rounded-none font-black text-xs uppercase border-2 transition-colors hover:bg-blue-700 hover:text-white ${payType === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)]'}`}>
                      {m === 'Cash' ? (isRtl ? '💵 نقدي' : '💵 Cash') : (isRtl ? '📜 آجل' : '📜 Credit')}
                    </button>
                  ))}
                </div>
              </div>
              
              {payType === 'Cash' && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-2">{isRtl ? 'مصدر الدفع' : 'Payment Source'}</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] cursor-pointer">
                      <input type="radio" name="paySrc" checked={paymentSource === 'drawer'} onChange={() => setPaymentSource('drawer')} className="accent-[#0066FF]" />
                      {isRtl ? 'دفع من الدرج' : 'From Drawer'}
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] cursor-pointer">
                      <input type="radio" name="paySrc" checked={paymentSource === 'safe'} onChange={() => setPaymentSource('safe')} className="accent-[#0066FF]" />
                      {isRtl ? 'دفع من الخزينة' : 'From Main Safe'}
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Add item row */}
            <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] p-6 space-y-4">
              <h3 className="font-black text-[var(--text-primary)] uppercase text-sm">{isRtl ? 'إضافة صنف' : 'Add Item'}</h3>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5 relative">
                  <input type="text" value={entryName} onChange={e => { setEntryName(e.target.value); setShowSuggestions(true); setSelectedItemId(null); }}
                    placeholder={isRtl ? 'اسم الصنف...' : 'Item name...'} className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none shadow-none z-10 overflow-hidden">
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => { setEntryName(s.name.en); setEntryCost((s.costPrice || 0).toString()); setSelectedItemId(s.id); setShowSuggestions(false); }}
                          className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-[#1a1a1a] flex justify-between items-center">
                          <span>{s.name[language]}</span>
                          <span className="text-[var(--text-muted)] text-xs">{formatMoney(s.costPrice || 0)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="number" value={entryQty} onChange={e => setEntryQty(e.target.value)} placeholder={isRtl ? 'الكمية' : 'Qty'}
                  className="col-span-2 bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none text-center" />
                <input type="number" value={entryCost} onChange={e => setEntryCost(e.target.value)} placeholder={isRtl ? 'التكلفة' : 'Cost'}
                  className="col-span-3 bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" />
                <button onClick={handleAddLine} className="col-span-2 bg-[#0066FF] text-[var(--text-primary)] rounded-none font-black text-xs uppercase hover:bg-[#0066FF] transition-all">
                  + {isRtl ? 'أضف' : 'Add'}
                </button>
              </div>
              <div className="grid grid-cols-12 gap-3 text-[9px] font-black text-[var(--text-muted)] uppercase px-1">
                <span className="col-span-5">{isRtl ? 'الصنف' : 'Item'}</span>
                <span className="col-span-2 text-center">{isRtl ? 'كمية' : 'Qty'}</span>
                <span className="col-span-3">{isRtl ? 'السعر' : 'Cost'}</span>
                <span className="col-span-2 text-right">{isRtl ? 'الإجمالي' : 'Total'}</span>
              </div>
              {cart.map((line, i) => (
                <div key={line.id} className="grid grid-cols-12 gap-3 items-center bg-[var(--bg-deep)] rounded-none px-4 py-3">
                  <div className="col-span-5 font-bold text-slate-700 text-sm flex items-center gap-2">
                    {line.isManual && <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-black">MANUAL</span>}
                    {line.name}
                  </div>
                  <div className="col-span-2 text-center">
                    <input type="number" value={line.qty} onChange={e => setCart(prev => prev.map((x, idx) => idx === i ? { ...x, qty: parseFloat(e.target.value) || 1 } : x))}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none px-2 py-1 text-sm font-black text-center outline-none" />
                  </div>
                  <div className="col-span-3 font-bold text-slate-600 text-sm">{formatMoney(line.cost)}</div>
                  <div className="col-span-1 font-black text-[var(--text-primary)] text-sm">{formatMoney(line.qty * line.cost)}</div>
                  <button onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))} className="col-span-1 text-rose-400 hover:text-rose-600 font-black text-center">✕</button>
                </div>
              ))}
              {cart.length === 0 && <div className="text-center text-slate-300 py-6 font-black uppercase text-xs">{isRtl ? 'لا أصناف بعد' : 'No items yet'}</div>}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-[var(--text-primary)] rounded-none p-6 space-y-4">
              <h3 className="font-black uppercase text-sm text-slate-300">{isRtl ? 'ملخص الفاتورة' : 'Invoice Summary'}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-[var(--text-muted)] text-xs"><span className="font-black uppercase">{isRtl ? 'المورد' : 'Supplier'}</span><span className="font-bold">{supplier || '—'}</span></div>
                <div className="flex justify-between text-[var(--text-muted)] text-xs"><span className="font-black uppercase">{isRtl ? 'عدد الأصناف' : 'Items'}</span><span className="font-bold">{cart.length}</span></div>
                <div className="flex justify-between text-[var(--text-muted)] text-xs"><span className="font-black uppercase">{isRtl ? 'نوع الدفع' : 'Payment'}</span><span className={`font-black text-xs px-2 py-0.5 rounded-none ${payType === 'Cash' ? 'bg-[#0066FF]/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{payType === 'Cash' ? (isRtl ? 'نقدي' : 'Cash') : (isRtl ? 'آجل' : 'Credit')}</span></div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] font-black text-teal-400 uppercase">{isRtl ? 'الإجمالي' : 'Total'}</p>
                <h3 className="text-4xl font-black tracking-tighter">{formatMoney(cartTotal)}</h3>
              </div>
              <button onClick={handlePost} disabled={cart.length === 0 || !supplier.trim()}
                className="w-full bg-blue-600 text-white font-black py-3 hover:bg-blue-700 hover:text-white disabled:bg-slate-300 disabled:text-slate-500 transition-colors">
                ✓ {isRtl ? 'ترحيل الفاتورة' : 'Post Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="flex-1 overflow-auto p-6" style={{}}>
          {/* Supplier summary cards */}
          {supplierNames.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {supplierNames.slice(0, 4).map(name => {
                const suppPurchases = purchases.filter(p => p.supplierName === name);
                const totalDebt = suppPurchases.reduce((s, p) => s + (p.remainingAmount || 0), 0);
                const totalPurchased = suppPurchases.reduce((s, p) => s + p.total, 0);
                return (
                  <div key={name} className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] p-4 shadow-none">
                    <div className="w-10 h-10 bg-teal-100 text-[#0066FF] rounded-none flex items-center justify-center font-black mb-2">{name[0]}</div>
                    <p className="font-black text-[var(--text-primary)] text-sm truncate">{name}</p>
                    <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase">{isRtl ? 'إجمالي المشتريات' : 'Total Purchased'}</p>
                    <p className="font-black text-slate-700">{formatMoney(totalPurchased)}</p>
                    {totalDebt > 0 && <p className="font-black text-rose-600 text-sm mt-1">{isRtl ? 'متبقي:' : 'Debt:'} {formatMoney(totalDebt)}</p>}
                  </div>
                );
              })}
            </div>
          )}
          <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'سجل المشتريات' : 'Purchase History'}</h3>
              <span className="text-[10px] font-black text-[var(--text-muted)] bg-[var(--bg-deep)] px-3 py-1 rounded-none">{purchases.length} {isRtl ? 'فاتورة' : 'invoices'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-[var(--border-color)] bg-[var(--bg-deep)]">
                  {[isRtl ? 'رقم' : '#', isRtl ? 'المورد' : 'Supplier', isRtl ? 'التاريخ' : 'Date', isRtl ? 'الإجمالي' : 'Total', isRtl ? 'المدفوع' : 'Paid', isRtl ? 'المتبقي' : 'Remaining', isRtl ? 'الحالة' : 'Status'].map(h => (
                    <th key={h} className="px-6 py-4 text-start text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">{h}</th>
                  ))}</tr></thead>
                <tbody>
                  {purchases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-[var(--bg-deep)] transition-all">
                      <td className="px-6 py-4 font-black text-slate-700 text-sm">#{p.serialNumber}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">{p.supplierName}</td>
                      <td className="px-6 py-4 text-xs text-[var(--text-muted)] font-bold">{new Date(p.timestamp).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-black text-[var(--text-primary)]">{formatMoney(p.total)}</td>
                      <td className="px-6 py-4 font-bold text-[#0066FF]">{formatMoney(p.amountPaid || 0)}</td>
                      <td className="px-6 py-4 font-black text-rose-600">{formatMoney(p.remainingAmount || 0)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-none ${statusColors[p.status] || 'bg-[var(--bg-deep)] text-[var(--text-muted)]'}`}>{statusLabel[p.status] || p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {purchases.length === 0 && <div className="h-40 flex flex-col items-center justify-center text-slate-300"><span className="text-5xl">🛍️</span><p className="font-black uppercase text-xs mt-2">{isRtl ? 'لا فواتير بعد' : 'No purchases yet'}</p></div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'vouchers' && (
        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6" style={{}}>
          <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] p-6 space-y-4">
            <h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'سند صرف جديد' : 'New Payment Voucher'}</h3>
            {[
              [isRtl ? 'اسم المورد' : 'Supplier', vSupp, setVSupp, 'text'],
              [isRtl ? 'المبلغ' : 'Amount', vAmt, setVAmt, 'number'],
              [isRtl ? 'ملاحظة' : 'Note', vNote, setVNote, 'text'],
            ].map(([label, val, setter, type]) => (
              <div key={label}>
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase block mb-1">{label}</label>
                {label === (isRtl ? 'اسم المورد' : 'Supplier') ? (
                  <input type="text" value={val} onChange={e => setter(e.target.value)} list="vSupList"
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" />
                ) : (
                  <input type={type} value={val} onChange={e => setter(e.target.value)}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" />
                )}
              </div>
            ))}
            <datalist id="vSupList">{supplierNames.map(n => <option key={n} value={n} />)}</datalist>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'Card', 'Transfer'].map(m => (
                <button key={m} onClick={() => setVMethod(m)} className={`py-3 rounded-none font-black text-[9px] uppercase border-2 transition-colors hover:bg-blue-700 hover:text-white ${vMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)]'}`}>
                  {m === 'Cash' ? (isRtl ? 'نقدي' : 'Cash') : m === 'Card' ? (isRtl ? 'بطاقة' : 'Card') : (isRtl ? 'تحويل' : 'Transfer')}
                </button>
              ))}
            </div>

            {vMethod === 'Cash' && (
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-2">{isRtl ? 'مصدر الدفع' : 'Payment Source'}</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] cursor-pointer">
                    <input type="radio" name="vPaySrc" checked={vSource === 'drawer'} onChange={() => setVSource('drawer')} className="accent-[#0066FF]" />
                    {isRtl ? 'دفع من الدرج' : 'From Drawer'}
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] cursor-pointer">
                    <input type="radio" name="vPaySrc" checked={vSource === 'safe'} onChange={() => setVSource('safe')} className="accent-[#0066FF]" />
                    {isRtl ? 'دفع من الخزينة' : 'From Main Safe'}
                  </label>
                </div>
              </div>
            )}

            <button onClick={handleVoucher} disabled={!vSupp.trim() || !vAmt} className="w-full bg-blue-600 text-white font-black py-3 hover:bg-blue-700 hover:text-white disabled:bg-slate-300 disabled:text-slate-500 transition-colors mt-4">
              ✓ {isRtl ? 'إصدار السند' : 'Issue Voucher'}
            </button>
          </div>

          <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'سجل السندات' : 'Voucher History'}</h3>
              <span className="font-black text-[#0066FF]">{formatMoney(vouchers.reduce((s, v) => s + v.amount, 0))}</span>
            </div>
            <div className="overflow-y-auto max-h-96" style={{}}>
              {vouchers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(v => (
                <div key={v.id} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-[var(--bg-deep)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-[#0066FF] rounded-none flex items-center justify-center font-black">💵</div>
                    <div>
                      <p className="font-black text-[var(--text-primary)] text-sm">{v.supplierName}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold">{v.note || '—'} • {new Date(v.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[var(--text-primary)]">{formatMoney(v.amount)}</p>
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase">{v.paymentMethod}</span>
                  </div>
                </div>
              ))}
              {vouchers.length === 0 && <div className="h-40 flex items-center justify-center text-slate-300 flex-col"><span className="text-5xl">💵</span><p className="font-black uppercase text-xs mt-2">{isRtl ? 'لا سندات بعد' : 'No vouchers yet'}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// TREASURY SCREEN
// ============================================================
function TreasuryScreen({ orders, purchases, expenses, vouchers, customerPayments, staffPayments, cashLog, setCashLog, activeShift, currentUser, language, users, pushNotification, setDrawerBalance, setDrawerLogs, bankBalance, setBankBalance, setMainSafeBalance }) {
  const isRtl = language === 'ar';
  const [filterToday, setFilterToday] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [paymentSource, setPaymentSource] = useState('Safe');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDir, setEntryDir] = useState('OUT');
  const [showZModal, setShowZModal] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [tab, setTab] = useState('ledger'); // ledger | zreports
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankTransferAmount, setBankTransferAmount] = useState('');
  const [bankNote, setBankNote] = useState('');

  const getDateKey = (d) => { const dt = d instanceof Date ? d : new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; };
  const todayKey = getDateKey(new Date());

  // Build unified ledger from all sources (Sales decoupled completely from Safe)
  const fullLedger = useMemo(() => {
    const entries = [...cashLog];
    
    // Add from expenses (only safe-sourced expenses not already in cashLog)
    expenses.forEach(e => {
      if (e.source === 'safe' && !cashLog.find(x => x.refId === e.id)) {
        entries.push({ id: 'EXP-' + e.id, type: 'EXPENSE_CASH', direction: 'OUT', amount: e.amount, note: e.name, createdAt: new Date(e.timestamp).getTime(), affectsDrawer: true, refId: e.id });
      }
    });

    // Add from vouchers (Supplier payments) - only safe-sourced cash vouchers not already in cashLog
    vouchers.forEach(v => {
      if (v.paymentMethod === 'Cash' && v.paymentSource !== 'drawer' && !cashLog.find(x => x.refId === v.id)) {
        entries.push({ id: 'VCH-' + v.id, type: 'MANUAL_OUT', direction: 'OUT', amount: v.amount, note: `Payment: ${v.supplierName}`, createdAt: new Date(v.timestamp).getTime(), affectsDrawer: true, refId: v.id });
      }
    });
    // Add from staff payments
    Object.values(staffPayments).flat().forEach(p => {
      if (p.id && !cashLog.find(x => x.refId === p.id)) {
        entries.push({ id: 'STF-' + p.id, type: 'PAYROLL_CASH', direction: 'OUT', amount: p.amount, note: `Staff: ${p.type}`, createdAt: new Date(p.timestamp).getTime(), affectsDrawer: true, refId: p.id });
      }
    });

    return entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [cashLog, orders, expenses, vouchers, staffPayments]);

  const displayed = filterToday ? fullLedger.filter(e => getDateKey(new Date(e.createdAt)) === todayKey) : fullLedger;

  const balance = fullLedger.filter(e => e.affectsDrawer).reduce((s, e) => s + (e.direction === 'IN' ? Number(e.amount) : -Number(e.amount)), 0);
  const todayIn = fullLedger.filter(e => e.affectsDrawer && e.direction === 'IN' && getDateKey(new Date(e.createdAt)) === todayKey).reduce((s, e) => s + Number(e.amount), 0);
  const todayOut = fullLedger.filter(e => e.affectsDrawer && e.direction === 'OUT' && getDateKey(new Date(e.createdAt)) === todayKey).reduce((s, e) => s + Number(e.amount), 0);

  const typeLabel = { SALE_CASH: isRtl ? 'بيع نقدي' : 'Cash Sale', SALE_CARD: isRtl ? 'بيع بطاقة' : 'Card Sale', EXPENSE_CASH: isRtl ? 'مصروف' : 'Expense', MANUAL_IN: isRtl ? 'إدخال يدوي' : 'Manual In', MANUAL_OUT: isRtl ? 'إخراج يدوي' : 'Manual Out', PAYROLL_CASH: isRtl ? 'راتب' : 'Payroll', SHIFT_OPEN: isRtl ? 'فتح وردية' : 'Shift Open', SHIFT_CLOSE: isRtl ? 'إغلاق وردية' : 'Shift Close', CUSTOMER_PAYMENT: isRtl ? 'تحصيل' : 'Collection' };
  const typeColors = { IN: 'bg-emerald-100 text-[#0066FF]', OUT: 'bg-rose-100 text-rose-600' };

  const [zReports, setZReports] = useState([]);

  const handleManualEntry = () => {
    const amt = parseFloat(entryAmount);
    if (isNaN(amt) || amt <= 0 || !entryDesc.trim()) return;
    const isDrawer = paymentSource === 'Drawer';

    if (isDrawer) {
      if (setDrawerBalance) setDrawerBalance(prev => entryDir === 'IN' ? prev + amt : prev - amt);
      if (setDrawerLogs) setDrawerLogs(prev => [{ id: 'DL-MAN-' + Date.now(), type: entryDir, amount: amt, note: entryDesc, timestamp: new Date(), shiftId: activeShift?.id || 'manual' }, ...prev]);
    } else {
      const entry = { id: 'MAN-' + Date.now(), type: entryDir === 'IN' ? 'MANUAL_IN' : 'MANUAL_OUT', direction: entryDir, amount: amt, note: entryDesc, createdAt: Date.now(), affectsDrawer: true, userId: currentUser.id };
      setCashLog(prev => [entry, ...prev]);
    }

    setEntryDesc(''); setEntryAmount(''); setShowEntryModal(false);
    pushNotification(isRtl ? 'تم تسجيل القيد' : 'Entry recorded', 'success');
  };

  const handleBankTransfer = () => {
    const amt = parseFloat(bankTransferAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > balance) { alert(isRtl ? 'رصيد الخزينة لا يكفي!' : 'Insufficient Safe Balance!'); return; }

    // 1. Deduct from Safe
    const safeEntry = { 
      id: 'BNK-OUT-' + Date.now(), 
      type: 'BANK_TRANSFER_OUT', 
      direction: 'OUT', 
      amount: amt, 
      note: (isRtl ? 'إيداع بنكي: ' : 'Bank Deposit: ') + (bankNote || (isRtl ? 'بدون ملاحظات' : 'No note')), 
      createdAt: Date.now(), 
      affectsDrawer: true, 
      userId: currentUser.id 
    };
    setCashLog(prev => [safeEntry, ...prev]);

    // 2. Update Bank Balance
    if (setBankBalance) setBankBalance(prev => prev + amt);

    setBankTransferAmount(''); setBankNote(''); setShowBankModal(false);
    pushNotification(isRtl ? 'تم تحويل المبلغ للبنك بنجاح' : 'Transfer to bank completed', 'success');
  };

  const handleZReport = () => {
    const actual = parseFloat(actualCash);
    if (isNaN(actual) || actual < 0) { alert(isRtl ? 'أدخل مبلغاً صحيحاً' : 'Enter valid amount'); return; }
    const dayOrders = orders.filter(o => o.status !== 'VOIDED' && o.status !== 'REFUNDED' && getDateKey(new Date(o.timestamp)) === todayKey);
    const report = {
      id: todayKey + '-' + Date.now(),
      businessDate: todayKey,
      timestamp: new Date(),
      userId: currentUser.id,
      grossSales: dayOrders.reduce((s, o) => s + o.total, 0),
      cashSales: dayOrders.filter(o => o.paymentMethod === 'Cash').reduce((s, o) => s + o.total, 0),
      cardSales: dayOrders.filter(o => o.paymentMethod === 'Card').reduce((s, o) => s + o.total, 0),
      creditSales: dayOrders.filter(o => o.paymentMethod === 'Credit').reduce((s, o) => s + o.total, 0),
      totalExpenses: expenses.filter(e => getDateKey(new Date(e.timestamp)) === todayKey).reduce((s, e) => s + e.amount, 0),
      totalCashIn: todayIn,
      totalCashOut: todayOut,
      expectedClosingCash: balance,
      actualClosingCash: actual,
      cashDifference: actual - balance,
      netSales: dayOrders.reduce((s, o) => s + o.total, 0),
      invoicesCount: dayOrders.length
    };
    setZReports(prev => [report, ...prev]);
    setActualCash(''); setShowZModal(false);
    pushNotification(isRtl ? 'تم إقفال اليوم' : 'Z-Report generated', 'success');
  };

  return (
    <div className="flex flex-col h-full" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Stats */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-slate-900 text-[var(--text-primary)] p-5 rounded-none">
          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'رصيد الخزينة' : 'Cash Balance'}</p>
          <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatMoney(balance)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-none">
          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'واردات اليوم' : "Today's In"}</p>
          <p className="text-2xl font-black text-[#0066FF]">{formatMoney(todayIn)}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-none">
          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'صادرات اليوم' : "Today's Out"}</p>
          <p className="text-2xl font-black text-rose-600">{formatMoney(todayOut)}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-teal-100 p-5 rounded-none">
          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'صافي اليوم' : 'Net Today'}</p>
          <p className={`text-2xl font-black ${todayIn - todayOut >= 0 ? 'text-[#0066FF]' : 'text-rose-600'}`}>{formatMoney(todayIn - todayOut)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 p-5 rounded-none">
          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'رصيد البنك/فيزا' : 'Bank/Visa Balance'}</p>
          <p className="text-2xl font-black text-amber-500">{formatMoney(bankBalance || 0)}</p>
        </div>
      </div>

      {/* Tabs & Actions */}
      <div className="px-6 flex gap-3 shrink-0 mb-4 flex-wrap">
        {[['ledger', isRtl ? '📒 دفتر الخزينة' : '📒 Cash Ledger'], ['zreports', isRtl ? '🌙 تقارير Z' : '🌙 Z-Reports']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`px-5 py-3 rounded-none font-black text-xs uppercase transition-all ${tab === v ? 'bg-slate-900 text-white' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-deep)]'}`}>{l}</button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setShowEntryModal(true)} className="bg-[#0066FF] text-white px-5 py-3 rounded-none font-black text-xs uppercase hover:bg-blue-700 hover:text-white transition-all">+ {isRtl ? 'قيد يدوي' : 'Manual Entry'}</button>
        <button onClick={() => setShowBankModal(true)} className="bg-emerald-600 text-white px-5 py-3 rounded-none font-black text-xs uppercase hover:bg-emerald-700 hover:text-white transition-all">🏦 {isRtl ? 'تحويل للبنك' : 'Transfer to Bank'}</button>
        <button onClick={() => setShowZModal(true)} className="bg-slate-900 text-white px-5 py-3 rounded-none font-black text-xs uppercase hover:bg-slate-800 hover:text-white transition-all">🌙 {isRtl ? 'إقفال اليوم' : 'Z-Report'}</button>
      </div>

      {tab === 'ledger' && (
        <div className="flex-1 overflow-auto px-6 pb-6" style={{}}>
          <div className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'دفتر الخزينة' : 'Cash Ledger'}</h3>
              <button onClick={() => setFilterToday(!filterToday)} className={`px-4 py-2 rounded-none font-black text-[10px] uppercase border-2 transition-all ${filterToday ? 'bg-[#0066FF] border-[#0066FF] text-[var(--text-primary)]' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}>
                {filterToday ? (isRtl ? 'اليوم فقط' : 'Today') : (isRtl ? 'الكل' : 'All')}
              </button>
            </div>
            <div className="overflow-y-auto max-h-[500px]" style={{}}>
              {displayed.map((entry, i) => (
                <div key={entry.id || i} className="flex items-center justify-between p-5 border-b border-[var(--border-color)] hover:bg-[var(--bg-deep)] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-none flex items-center justify-center font-black text-lg ${entry.direction === 'IN' ? 'bg-[#0066FF]/10 text-[#0066FF]' : (entry.type?.includes('BANK') ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500')}`}>
                      {entry.direction === 'IN' ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className="font-black text-[var(--text-primary)] text-sm uppercase tracking-tight">{typeLabel[entry.type] || entry.type}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">{entry.note || '—'} <span className="mx-2 opacity-20">|</span> {new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className={`font-black text-xl leading-none ${entry.direction === 'IN' ? 'text-[#0066FF]' : 'text-rose-600'}`}>
                      {entry.direction === 'IN' ? '+' : '-'}{formatMoney(entry.amount)}
                    </p>
                    {entry.userId && users && <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase">User: {users.find(u => u.id === entry.userId)?.name || entry.userId.toString().slice(0, 8)}</p>}
                  </div>
                </div>
              ))}
              {displayed.length === 0 && <div className="h-40 flex flex-col items-center justify-center text-slate-300"><span className="text-5xl">📒</span><p className="font-black uppercase text-xs mt-2">{isRtl ? 'لا قيود' : 'No entries'}</p></div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'zreports' && (
        <div className="flex-1 overflow-auto px-6 pb-6 space-y-4" style={{}}>
          {zReports.length === 0 && <div className="h-40 flex flex-col items-center justify-center text-slate-300"><span className="text-5xl">🌙</span><p className="font-black uppercase text-xs mt-2">{isRtl ? 'لا تقارير Z بعد' : 'No Z-Reports yet'}</p></div>}
          {zReports.map(z => (
            <div key={z.id} className="bg-[var(--bg-card)] rounded-none border border-[var(--border-color)] p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-black text-[var(--text-primary)]">{z.businessDate}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold">{new Date(z.timestamp).toLocaleString()}</p>
                </div>
                <span className={`text-sm font-black px-4 py-2 rounded-none ${z.cashDifference === 0 ? 'bg-emerald-100 text-[#0066FF]' : z.cashDifference > 0 ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                  {z.cashDifference === 0 ? '✓ BALANCED' : z.cashDifference > 0 ? `+${formatMoney(z.cashDifference)} OVER` : `${formatMoney(z.cashDifference)} SHORT`}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  [isRtl ? 'إجمالي المبيعات' : 'Gross Sales', z.grossSales, 'text-[var(--text-primary)]'],
                  [isRtl ? 'نقدي' : 'Cash Sales', z.cashSales, 'text-[#0066FF]'],
                  [isRtl ? 'المصروفات' : 'Expenses', z.totalExpenses, 'text-rose-600'],
                  [isRtl ? 'عدد الفواتير' : 'Invoices', z.invoicesCount, 'text-[#0066FF]'],
                ].map(([label, val, color]) => (
                  <div key={label} className="bg-[var(--bg-deep)] rounded-none p-4">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{label}</p>
                    <p className={`font-black text-lg ${color}`}>{typeof val === 'number' && val > 99 ? formatMoney(val) : val}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowEntryModal(false)}>
          <div className="bg-[var(--bg-card)] rounded-none p-8 max-w-sm w-full shadow-none space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'قيد يدوي' : 'Manual Entry'}</h2>
              <button onClick={() => setShowEntryModal(false)} className="w-10 h-10 rounded-none bg-[var(--bg-deep)] flex items-center justify-center">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['IN', isRtl ? '↓ إيداع' : '↓ Cash In'], ['OUT', isRtl ? '↑ سحب' : '↑ Cash Out']].map(([v, l]) => (
                <button key={v} onClick={() => setEntryDir(v)} className={`py-4 rounded-none font-black text-xs uppercase border-2 transition-all ${entryDir === v ? (v === 'IN' ? 'bg-[#0066FF] border-emerald-600 text-[var(--text-primary)]' : 'bg-rose-600 border-rose-600 text-[var(--text-primary)]') : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}>{l}</button>
              ))}
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1.5">{isRtl ? 'المبلغ' : 'Amount'}</label>
              <input type="number" value={entryAmount} onChange={e => setEntryAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-4 text-2xl font-black text-center outline-none mb-3" />
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1.5">{isRtl ? 'المصدر' : 'Source'}</label>
              <select value={paymentSource} onChange={e => setPaymentSource(e.target.value)} className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] p-3 text-[var(--text-primary)] font-bold outline-none mb-2">
                <option value="Safe">{isRtl ? 'من الخزنة الرئيسية' : 'From Main Safe'}</option>
                <option value="Drawer">{isRtl ? 'من درج الكاشير' : 'From Cash Drawer'}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1.5">{isRtl ? 'الوصف' : 'Description'}</label>
              <input type="text" value={entryDesc} onChange={e => setEntryDesc(e.target.value)} placeholder={isRtl ? 'سبب القيد...' : 'Reason...'}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEntryModal(false)} className="flex-1 py-4 bg-[var(--bg-deep)] text-slate-600 rounded-none font-black uppercase text-xs">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleManualEntry} disabled={!entryAmount || !entryDesc.trim()} className="flex-[2] py-4 bg-[#0066FF] text-[var(--text-primary)] rounded-none font-black uppercase text-xs disabled:opacity-30 hover:bg-[#0066FF] transition-all">
                ✓ {isRtl ? 'تسجيل' : 'Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Z Report Modal */}
      {showZModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowZModal(false)}>
          <div className="bg-[var(--bg-card)] rounded-none p-8 max-w-sm w-full shadow-none space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'إقفال اليوم' : 'Daily Z-Report'}</h2>
              <button onClick={() => setShowZModal(false)} className="w-10 h-10 rounded-none bg-[var(--bg-deep)] flex items-center justify-center">✕</button>
            </div>
            <div className="bg-[var(--bg-deep)] rounded-none p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="font-black text-[var(--text-muted)] uppercase text-xs">{isRtl ? 'رصيد متوقع' : 'Expected Cash'}</span><span className="font-black text-[var(--text-primary)]">{formatMoney(balance)}</span></div>
              <div className="flex justify-between text-sm"><span className="font-black text-[var(--text-muted)] uppercase text-xs">{isRtl ? 'واردات اليوم' : 'Today In'}</span><span className="font-black text-[#0066FF]">{formatMoney(todayIn)}</span></div>
              <div className="flex justify-between text-sm"><span className="font-black text-[var(--text-muted)] uppercase text-xs">{isRtl ? 'صادرات اليوم' : 'Today Out'}</span><span className="font-black text-rose-600">{formatMoney(todayOut)}</span></div>
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1.5">{isRtl ? 'النقد الفعلي في الخزينة' : 'Actual Cash in Drawer'}</label>
              <input type="number" value={actualCash} onChange={e => setActualCash(e.target.value)} placeholder="0.00"
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-4 text-3xl font-black text-center outline-none focus:ring-2 focus:ring-teal-500/20" />
              {actualCash && (
                <p className={`text-center mt-2 font-black text-sm ${parseFloat(actualCash) - balance >= 0 ? 'text-[#0066FF]' : 'text-rose-600'}`}>
                  {parseFloat(actualCash) - balance >= 0 ? '▲ ' : '▼ '}{formatMoney(Math.abs(parseFloat(actualCash) - balance))} {parseFloat(actualCash) - balance >= 0 ? (isRtl ? 'زيادة' : 'Over') : (isRtl ? 'عجز' : 'Short')}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowZModal(false)} className="flex-1 py-4 bg-[var(--bg-deep)] text-slate-600 rounded-none font-black uppercase text-xs">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleZReport} disabled={!actualCash} className="flex-[2] py-4 bg-slate-900 text-white rounded-none font-black uppercase text-xs disabled:opacity-30 hover:bg-slate-800 hover:text-white transition-all">
                🌙 {isRtl ? 'إقفال وحفظ' : 'Close & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showBankModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowBankModal(false)}>
          <div className="bg-[var(--bg-card)] rounded-none p-8 max-w-sm w-full shadow-none space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">🏦 {isRtl ? 'إيداع بنكي' : 'Bank Deposit'}</h2>
              <button onClick={() => setShowBankModal(false)} className="w-10 h-10 rounded-none bg-[var(--bg-deep)] flex items-center justify-center">✕</button>
            </div>
            <p className="text-[10px] font-black text-amber-500 uppercase">{isRtl ? 'سيتم خصم المبلغ من الخزينة وإضافته لحساب البنك' : 'Amount will be deducted from Safe & added to Bank'}</p>
            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1.5">{isRtl ? 'المبلغ المحول' : 'Transfer Amount'}</label>
              <input type="number" value={bankTransferAmount} onChange={e => setBankTransferAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-4 text-2xl font-black text-center outline-none mb-3" />
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1.5">{isRtl ? 'ملاحظات (اختياري)' : 'Bank / Reference Note'}</label>
              <input type="text" value={bankNote} onChange={e => setBankNote(e.target.value)} placeholder={isRtl ? 'اسم البنك أو رقم العملية...' : 'Bank name or Ref #...'}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-color)] rounded-none px-4 py-3 text-sm font-bold outline-none" />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowBankModal(false)} className="flex-1 py-4 bg-[var(--bg-deep)] text-slate-600 rounded-none font-black uppercase text-xs">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleBankTransfer} disabled={!bankTransferAmount} className="flex-[2] py-4 bg-emerald-600 text-white rounded-none font-black uppercase text-xs disabled:opacity-30 transition-all">
                ✓ {isRtl ? 'تأكيد التحويل' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// REPORTS SCREEN
// ============================================================
function ReportsScreen({ orders, purchases, expenses, items, customers, customerPayments, language }) {
  const isRtl = language === 'ar';
  const [view, setView] = useState('sales');
  const [startDate, setStartDate] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const inRange = (ts) => { const d = (ts instanceof Date ? ts : new Date(ts)).toISOString().split('T')[0]; return d >= startDate && d <= endDate; };

  const salesData = useMemo(() => {
    const filtered = orders.filter(o => o.status !== 'VOIDED' && o.status !== 'REFUNDED' && inRange(o.timestamp));
    const cash = filtered.filter(o => o.paymentMethod === 'Cash').reduce((s, o) => s + o.total, 0);
    const card = filtered.filter(o => o.paymentMethod === 'Card').reduce((s, o) => s + o.total, 0);
    const credit = filtered.filter(o => o.paymentMethod === 'Credit').reduce((s, o) => s + o.total, 0);
    const total = cash + card + credit;
    const vat = total * 0.14 / 1.14;
    const net = total - vat;
    // Daily breakdown
    const byDay = {};
    filtered.forEach(o => {
      const key = (o.timestamp instanceof Date ? o.timestamp : new Date(o.timestamp)).toISOString().split('T')[0];
      byDay[key] = (byDay[key] || 0) + o.total;
    });
    // Top items
    const itemCount = {};
    filtered.forEach(o => o.items.forEach(i => { itemCount[i.itemId] = (itemCount[i.itemId] || { count: 0, revenue: 0 }); itemCount[i.itemId].count += i.quantity; itemCount[i.itemId].revenue += i.priceAtOrder * i.quantity; }));
    const topItems = Object.entries(itemCount).map(([id, data]) => ({ id, name: items.find(i => i.id === id)?.name[language] || id, ...data })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    return { cash, card, credit, total, vat, net, count: filtered.length, byDay, topItems };
  }, [orders, startDate, endDate, items, language]);

  const inventoryData = useMemo(() => {
    const totalItems = items.filter(i => i.isActive !== false).length;
    const lowStock = items.filter(i => i.stock < 5 && i.isActive !== false);
    const outOfStock = items.filter(i => i.stock <= 0 && i.isActive !== false);
    const costValuation = items.reduce((s, i) => s + (i.costPrice || 0) * Math.max(0, i.stock), 0);
    const retailValuation = items.reduce((s, i) => s + i.basePrice * Math.max(0, i.stock), 0);
    return { totalItems, lowStock, outOfStock, costValuation, retailValuation };
  }, [items]);

  const receivablesData = useMemo(() => {
    return customers.map(c => {
      const cOrders = orders.filter(o => o.customerId === c.id && o.status !== 'VOIDED');
      const total = cOrders.reduce((s, o) => s + o.total, 0);
      const paid = cOrders.reduce((s, o) => s + (o.amountPaid || 0), 0) + customerPayments.filter(p => p.customerId === c.id).reduce((s, p) => s + p.amount, 0);
      return { ...c, balance: total - paid, invoiceCount: cOrders.length };
    }).filter(c => c.balance > 0.01).sort((a, b) => b.balance - a.balance);
  }, [customers, orders, customerPayments]);

  const expensesData = useMemo(() => {
    const filtered = expenses.filter(e => inRange(e.timestamp));
    const total = filtered.reduce((s, e) => s + e.amount, 0);
    const byName = {};
    filtered.forEach(e => { byName[e.name] = (byName[e.name] || 0) + e.amount; });
    return { total, filtered, byName: Object.entries(byName).sort((a, b) => b[1] - a[1]) };
  }, [expenses, startDate, endDate]);

  const TABS = [
    ['sales', isRtl ? '🧾 المبيعات' : '🧾 Sales'],
    ['expenses', isRtl ? '💸 المصروفات' : '💸 Expenses'],
    ['inventory', isRtl ? '📦 المخزون' : '📦 Inventory'],
    ['receivables', isRtl ? '👤 الذمم' : '👤 Receivables'],
  ];

  return (
    <div className="flex flex-col h-full" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-6 flex flex-wrap gap-4 items-center shrink-0">
        <div className="flex-1">
          <h2 className="text-xl font-black text-[var(--text-primary)] uppercase">{isRtl ? 'التقارير التحليلية' : 'Analytics & Reports'}</h2>
        </div>
        <div className="flex gap-2 items-center bg-[var(--bg-card)] border border-[var(--border-color)] p-2 rounded-none">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-black outline-none px-2" />
          <span className="text-slate-300 font-black">→</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-black outline-none px-2" />
        </div>
      </div>

      {/* View Tabs */}
      <div className="px-6 flex gap-2 shrink-0 mb-4 flex-wrap">
        {TABS.map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} className={`px-5 py-3 rounded-none font-black text-xs uppercase transition-all ${view === v ? 'bg-slate-900 text-white' : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-deep)]'}`}>{l}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6 space-y-6" style={{}}>
        {view === 'sales' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['bg-slate-900 text-[var(--text-primary)]', isRtl ? 'إجمالي المبيعات' : 'Gross Sales', salesData.total, 'text-teal-400'],
                ['bg-emerald-50 border border-emerald-100', isRtl ? 'نقدي' : 'Cash', salesData.cash, 'text-[#0066FF]'],
                ['bg-[#1a1a1a] border border-teal-100', isRtl ? 'بطاقة' : 'Card', salesData.card, 'text-[#0066FF]'],
                ['bg-amber-50 border border-amber-100', isRtl ? 'آجل' : 'Credit', salesData.credit, 'text-amber-600'],
              ].map(([bg, label, val, color]) => (
                <div key={label} className={`${bg} p-5 rounded-none`}>
                  <p className="text-[9px] font-black uppercase opacity-60 mb-1">{label}</p>
                  <p className={`text-2xl font-black ${color}`}>{formatMoney(val)}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none p-5">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2">{isRtl ? 'صافي المبيعات (بعد الضريبة)' : 'Net Sales (ex. VAT)'}</p>
                <p className="text-3xl font-black text-[var(--text-primary)]">{formatMoney(salesData.net)}</p>
                <p className="text-xs text-[var(--text-muted)] font-bold mt-1">VAT: {formatMoney(salesData.vat)}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none p-5">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2">{isRtl ? 'عدد الفواتير' : 'Invoice Count'}</p>
                <p className="text-3xl font-black text-[var(--text-primary)]">{salesData.count}</p>
                <p className="text-xs text-[var(--text-muted)] font-bold mt-1">{isRtl ? 'متوسط الفاتورة:' : 'Avg:'} {formatMoney(salesData.count > 0 ? salesData.total / salesData.count : 0)}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none p-5">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2">{isRtl ? 'أكثر الأيام مبيعاً' : 'Best Day'}</p>
                {Object.entries(salesData.byDay).sort(([, a], [, b]) => b - a).slice(0, 1).map(([d, v]) => (
                  <div key={d}><p className="text-xl font-black text-[var(--text-primary)]">{formatMoney(v)}</p><p className="text-xs text-[var(--text-muted)] font-bold mt-1">{d}</p></div>
                ))}
                {Object.keys(salesData.byDay).length === 0 && <p className="text-slate-300 font-black text-sm">—</p>}
              </div>
            </div>
            {/* Top Items */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none overflow-hidden">
              <div className="p-5 border-b border-[var(--border-color)]"><h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'أعلى المنتجات مبيعاً' : 'Top Selling Items'}</h3></div>
              {salesData.topItems.length === 0 ? <div className="h-32 flex items-center justify-center text-slate-300 font-black uppercase text-xs">{isRtl ? 'لا بيانات' : 'No data'}</div> :
                salesData.topItems.map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-[var(--bg-deep)]">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-none flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-[var(--bg-deep)] text-[var(--text-muted)]' : 'bg-orange-50 text-orange-400'}`}>{i + 1}</span>
                      <span className="font-bold text-slate-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[var(--text-primary)]">{formatMoney(item.revenue)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{item.count} {isRtl ? 'وحدة' : 'units'}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </>
        )}

        {view === 'expenses' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-rose-50 border border-rose-100 p-5 rounded-none">
                <p className="text-[9px] font-black text-rose-400 uppercase mb-1">{isRtl ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
                <p className="text-3xl font-black text-rose-600">{formatMoney(expensesData.total)}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-none">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'عدد القيود' : 'Count'}</p>
                <p className="text-3xl font-black text-[var(--text-primary)]">{expensesData.filtered.length}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-none">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'متوسط المصروف' : 'Avg Expense'}</p>
                <p className="text-3xl font-black text-[var(--text-primary)]">{formatMoney(expensesData.filtered.length > 0 ? expensesData.total / expensesData.filtered.length : 0)}</p>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none overflow-hidden">
              <div className="p-5 border-b border-[var(--border-color)]"><h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'تفصيل المصروفات' : 'Expense Breakdown'}</h3></div>
              {expensesData.byName.map(([name, amount]) => (
                <div key={name} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-[var(--bg-deep)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-rose-100 text-rose-600 rounded-none flex items-center justify-center font-black">💸</div>
                    <span className="font-bold text-slate-700">{name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-rose-600">{formatMoney(amount)}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{((amount / expensesData.total) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
              {expensesData.byName.length === 0 && <div className="h-32 flex items-center justify-center text-slate-300 font-black uppercase text-xs">{isRtl ? 'لا مصروفات في هذه الفترة' : 'No expenses in period'}</div>}
            </div>
          </>
        )}

        {view === 'inventory' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['bg-[var(--bg-card)] border-[var(--border-color)]', isRtl ? 'إجمالي الأصناف' : 'Total Items', inventoryData.totalItems, 'text-[var(--text-primary)]'],
                ['bg-rose-50 border-rose-100', isRtl ? 'نافذ من المخزون' : 'Out of Stock', inventoryData.outOfStock.length, 'text-rose-600'],
                ['bg-amber-50 border-amber-100', isRtl ? 'مخزون منخفض' : 'Low Stock', inventoryData.lowStock.length, 'text-amber-600'],
                ['bg-emerald-50 border-emerald-100', isRtl ? 'قيمة التكلفة' : 'Cost Value', formatMoney(inventoryData.costValuation), 'text-[#0066FF]'],
              ].map(([bg, label, val, color]) => (
                <div key={label} className={`bg-[var(--bg-card)] ${bg} border p-5 rounded-none`}>
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{label}</p>
                  <p className={`text-2xl font-black ${color}`}>{val}</p>
                </div>
              ))}
            </div>
            {inventoryData.lowStock.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-none p-5">
                <h3 className="font-black text-amber-700 uppercase text-sm mb-3">⚠️ {isRtl ? 'أصناف تحتاج إعادة توريد' : 'Items Need Restocking'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {inventoryData.lowStock.map(item => (
                    <div key={item.id} className="bg-[var(--bg-card)] rounded-none p-4 border border-amber-100">
                      <p className="font-black text-[var(--text-primary)] text-sm truncate">{item.name[language]}</p>
                      <p className={`font-black text-lg ${item.stock <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>{item.stock} {isRtl ? 'متبقي' : 'left'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none overflow-hidden">
              <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
                <h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'قائمة الأصناف' : 'Inventory List'}</h3>
                <span className="text-[10px] font-black text-[var(--text-muted)]">{isRtl ? 'قيمة البيع:' : 'Retail Value:'} {formatMoney(inventoryData.retailValuation)}</span>
              </div>
              <div className="overflow-x-auto max-h-96" style={{}}>
                <table className="w-full">
                  <thead><tr className="border-b border-[var(--border-color)] bg-[var(--bg-deep)]">
                    {[isRtl ? 'الصنف' : 'Item', isRtl ? 'المخزون' : 'Stock', isRtl ? 'سعر البيع' : 'Price', isRtl ? 'التكلفة' : 'Cost', isRtl ? 'قيمة المخزون' : 'Stock Value'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase text-[var(--text-muted)]">{h}</th>
                    ))}</tr></thead>
                  <tbody>
                    {items.sort((a, b) => a.stock - b.stock).map(item => (
                      <tr key={item.id} className={`border-b border-slate-50 hover:bg-[var(--bg-deep)] ${item.stock <= 0 ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)] text-sm">{item.name[language]}</td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-black px-2 py-1 rounded-none ${item.stock <= 0 ? 'bg-rose-100 text-rose-600' : item.stock < 5 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-[#0066FF]'}`}>{item.stock}</span></td>
                        <td className="px-4 py-3 font-bold text-slate-700">{formatMoney(item.basePrice)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)] font-bold">{formatMoney(item.costPrice || 0)}</td>
                        <td className="px-4 py-3 font-black text-[var(--text-primary)]">{formatMoney((item.costPrice || 0) * Math.max(0, item.stock))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {view === 'receivables' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-rose-50 border border-rose-100 p-5 rounded-none">
                <p className="text-[9px] font-black text-rose-400 uppercase mb-1">{isRtl ? 'إجمالي الذمم' : 'Total Receivables'}</p>
                <p className="text-3xl font-black text-rose-600">{formatMoney(receivablesData.reduce((s, c) => s + c.balance, 0))}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-none">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'عدد العملاء المدينين' : 'Debtors'}</p>
                <p className="text-3xl font-black text-[var(--text-primary)]">{receivablesData.length}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-none">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{isRtl ? 'أعلى دين' : 'Highest Debt'}</p>
                <p className="text-2xl font-black text-[var(--text-primary)]">{receivablesData.length > 0 ? formatMoney(receivablesData[0].balance) : '—'}</p>
                {receivablesData.length > 0 && <p className="text-xs text-[var(--text-muted)] font-bold mt-1">{receivablesData[0].name}</p>}
              </div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none overflow-hidden">
              <div className="p-5 border-b border-[var(--border-color)]"><h3 className="font-black text-[var(--text-primary)] uppercase">{isRtl ? 'كشف حساب العملاء' : 'Customer Balances'}</h3></div>
              {receivablesData.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-300"><span className="text-5xl">✅</span><p className="font-black uppercase text-xs mt-2">{isRtl ? 'لا ذمم متأخرة' : 'No outstanding debts'}</p></div>
              ) : receivablesData.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-[var(--bg-deep)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-none flex items-center justify-center font-black">{c.name[0]}</div>
                    <div>
                      <p className="font-black text-[var(--text-primary)]">{c.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold">{c.phone} • {c.invoiceCount} {isRtl ? 'فاتورة' : 'invoices'}</p>
                    </div>
                  </div>
                  <p className="font-black text-rose-600 text-lg">{formatMoney(c.balance)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
const calculateExpectedCash = (openingBalance, shiftOrders, shiftExpenses, shiftAdvances = [], shiftDrawerLogs = []) => {
  const cashSales = shiftOrders
    .filter(o => o.paymentMethod === 'Cash' || !o.paymentMethod)
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const totalExpenses = shiftExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalAdvances = shiftAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const drawerIn = shiftDrawerLogs.filter(l => l.type === 'IN').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const drawerOut = shiftDrawerLogs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const expected = (Number(openingBalance) || 0) + cashSales + drawerIn - (totalAdvances + totalExpenses + drawerOut);
  return expected;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const setCookie = (name, value, days) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Strict; Secure`;
};

const checkSubscriptionStatus = (statusOrSettings, activationDateStr, expiryDateStr) => {
  let status;
  let actDate;
  let expDate;

  if (statusOrSettings && typeof statusOrSettings === 'object') {
    status = statusOrSettings.subscription_status || 'trial';
    actDate = statusOrSettings.activationDate || statusOrSettings.trial_start_date;
    expDate = statusOrSettings.subscription_end_date;
  } else {
    status = statusOrSettings || 'trial';
    actDate = activationDateStr;
    expDate = expiryDateStr;
  }

  const now = new Date();
  
  if (status === 'pending_onboarding') {
    return { status: 'pending_onboarding', daysLeft: null, expired: false };
  }
  if (status === 'expired') {
    return { status: 'expired', daysLeft: 0, expired: true };
  }

  let expiryDate = null;
  if (status === 'trial') {
    const trialStartStr = actDate || new Date().toISOString();
    const trialStart = new Date(trialStartStr);
    if (isNaN(trialStart.getTime())) {
      return { status: 'expired', daysLeft: 0, expired: true };
    }
    expiryDate = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
  } else if (status === 'active') {
    if (expDate) {
      expiryDate = new Date(expDate);
    }
  }

  if (!expiryDate || isNaN(expiryDate.getTime())) {
    return { status: 'expired', daysLeft: 0, expired: true };
  }

  const timeDiff = expiryDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return { status: 'expired', daysLeft: 0, expired: true };
  }

  return { status, daysLeft, expired: false };
};

const getInitialSubscriptionStatus = () => {
  const localStatus = localStorage.getItem('pos_subscription_status');
  
  // Brand new install
  if (!localStatus) {
    const defaultDate = new Date().toISOString();
    localStorage.setItem('pos_subscription_status', 'trial');
    localStorage.setItem('activationDate', defaultDate);
    localStorage.setItem('pos_trial_start_date', defaultDate);
    return 'trial';
  }

  const localTrialStart = localStorage.getItem('activationDate') || localStorage.getItem('pos_trial_start_date');
  const localSubEnd = localStorage.getItem('pos_subscription_end_date');

  const result = checkSubscriptionStatus(localStatus, localTrialStart, localSubEnd);
  if (result.expired) {
    localStorage.setItem('pos_subscription_status', 'expired');
    return 'expired';
  }
  return result.status;
};

const getInitialTrialDaysLeft = () => {
  const localStatus = localStorage.getItem('pos_subscription_status') || 'trial';
  const localTrialStart = localStorage.getItem('activationDate') || localStorage.getItem('pos_trial_start_date');
  const localSubEnd = localStorage.getItem('pos_subscription_end_date');
  
  const result = checkSubscriptionStatus(localStatus, localTrialStart, localSubEnd);
  return result.status === 'trial' ? result.daysLeft : null;
};
// ============================================================
// 404 / NOT FOUND SCREEN
// Rendered for unauthorized /admin-master-u4 access attempts
// ============================================================
function NotFoundScreen({ language, onGoHome }) {
  const isRtl = language === 'ar';
  return (
    <div
      className="enterprise-ui min-h-screen w-full flex items-center justify-center"
      style={{ background: '#f8fafc', fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div style={{ textAlign: 'center', maxWidth: 420, padding: '48px 32px' }}>
        <div style={{ width: 80, height: 80, background: '#fef2f2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>🔒</div>
        <h1 style={{ fontSize: 72, fontWeight: 900, color: '#e2e8f0', margin: '0 0 8px', lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 12px' }}>
          {isRtl ? 'غير مصرح — المسار محمي' : 'Unauthorized — Protected Route'}
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
          {isRtl
            ? 'هذه الصفحة محجوزة حصرياً لمطوّر النظام. لا يمكن الوصول إليها من هذا الحساب.'
            : 'This page is exclusively reserved for the System Developer. Access is not permitted from this account.'}
        </p>
        <button
          onClick={onGoHome}
          style={{
            background: '#1e40af', color: '#fff', border: 'none',
            padding: '12px 28px', borderRadius: 10, fontSize: 13,
            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#1d3d8f'}
          onMouseOut={e => e.currentTarget.style.background = '#1e40af'}
        >
          {isRtl ? '← العودة للرئيسية' : '← Back to Dashboard'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  // ⚡ Mount-only log guard — never logs again after initial render
  const _hasMounted = useRef(false);
  useEffect(() => {
    if (!_hasMounted.current) {
      _hasMounted.current = true;
      // Intentionally silent after first mount — no recurring console pollution
    }
  }, []);
  const isOnline = useOnlineStatus();
  const [language, setLanguage] = useState('ar');
  const isRtl = language === 'ar';
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('pos_theme') || 'dark');
  const [branchId, setBranchId] = useState(() => localStorage.getItem('active_branch_id') || null);
  const [activeBranchName, setActiveBranchName] = useState(() => localStorage.getItem('active_branch_name') || '');
  const [cloudReady, setCloudReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [subscriptionStatus, setSubscriptionStatus] = useState(getInitialSubscriptionStatus);
  const [subscriptionExpired, setSubscriptionExpired] = useState(() => getInitialSubscriptionStatus() === 'expired');
  const [trialDaysLeft, setTrialDaysLeft] = useState(getInitialTrialDaysLeft);
  // ⚡ BOOT PHASE STATE MACHINE
  // 'booting' → Supabase fetch in progress (spinner visible, viewport suppressed)
  // 'ready'   → Boot resolved (AuthGateway visible)
  // This replaces the old isCheckingStatus boolean which was always `true` on init
  // and caused a guaranteed extra render before any meaningful content appeared.
  const [bootPhase, setBootPhase] = useState('booting');
  const subscriptionActive = !subscriptionExpired;

  // =========================================================================
  // URL-BASED ROUTING STATE
  // Handles /admin-master-u4 (secret developer route) and /signup?inviteToken=...
  // =========================================================================
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [inviteContext, setInviteContext] = useState(null);

  // ⚡ STRICT ONCE-ON-MOUNT URL PARSING
  // hasParsedUrl guarantees the initial invite-param extraction runs exactly once.
  // Subsequent dashboard/state updates NEVER re-trigger this path.
  const hasParsedUrl = useRef(false);

  useEffect(() => {
    const parseParams = () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('inviteToken');
      const storeId = params.get('storeId');
      const role = params.get('role');
      const storeName = params.get('storeName');

      if (token === 'true' && storeId && role) {
        const decodedStoreName = storeName ? decodeURIComponent(storeName) : '';
        setInviteContext(prev => {
          // Strict primitive equality — never create a new object if nothing changed
          if (
            prev &&
            prev.storeId === storeId &&
            prev.role === role &&
            prev.storeName === decodedStoreName
          ) {
            return prev; // bail — no re-render
          }
          return { storeId, role, storeName: decodedStoreName };
        });
      } else {
        // Only null-out if the URL genuinely has no invite token
        if (window.location.search.indexOf('inviteToken') === -1) {
          setInviteContext(prev => (prev !== null ? null : prev));
        }
      }
    };

    // Initial parse — strictly once on mount
    if (!hasParsedUrl.current) {
      hasParsedUrl.current = true;
      parseParams();
    }

    // popstate handles browser back/forward navigation
    const handlePopState = (e) => {
      setCurrentPath(window.location.pathname);
      parseParams();

      const state = e.state;
      if (state) {
        const { screen, tab } = state;
        if (screen === 'landing') {
          setCurrentUser(null);
          setShowAuth(false);
        } else if (screen === 'auth') {
          setCurrentUser(null);
          setShowAuth(true);
        } else if (screen === 'dashboard') {
          const cachedUser = localStorage.getItem('pos_current_user');
          if (cachedUser) {
            setCurrentUser(JSON.parse(cachedUser));
            setShowAuth(false);
            if (tab) {
              setActiveTab(tab);
            }
          } else {
            setShowAuth(true);
            window.history.replaceState({ screen: 'auth' }, '', '/login');
          }
        } else if (screen === 'admin_panel_master') {
          const cachedUser = localStorage.getItem('pos_current_user');
          if (cachedUser) {
            const user = JSON.parse(cachedUser);
            if (user.id === 'u_4' || localStorage.getItem('dev_override') === 'true') {
              setCurrentUser(user);
              setShowAuth(false);
            } else {
              window.history.replaceState({ screen: 'landing' }, '', '/');
            }
          } else {
            window.history.replaceState({ screen: 'auth' }, '', '/login');
          }
        }
      } else {
        const path = window.location.pathname;
        if (path === '/') {
          setCurrentUser(null);
          setShowAuth(false);
        } else if (path === '/login') {
          setCurrentUser(null);
          setShowAuth(true);
        } else {
          const tab = path.substring(1);
          const validTabs = ['dashboard', 'pos', 'shifts', 'sales', 'customers', 'expenses', 'inventory', 'purchases', 'treasury', 'staff', 'drawer', 'reports', 'settings', 'admin_panel'];
          if (validTabs.includes(tab)) {
            const cachedUser = localStorage.getItem('pos_current_user');
            if (cachedUser) {
              setCurrentUser(JSON.parse(cachedUser));
              setShowAuth(false);
              setActiveTab(tab);
            } else {
              setShowAuth(true);
            }
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Setup initial history state to match current URL on mount
    const path = window.location.pathname;
    let initialScreen = 'landing';
    let initialTab = null;

    const cachedUser = localStorage.getItem('pos_current_user');
    if (cachedUser) {
      initialScreen = 'dashboard';
      const initialTabVal = getInitialTab();
      initialTab = initialTabVal;
      if (path === '/' || path === '/login') {
        const redirectPath = '/' + initialTabVal;
        window.history.replaceState({ screen: 'dashboard', tab: initialTabVal }, '', redirectPath);
        setCurrentPath(redirectPath);
      } else {
        window.history.replaceState({ screen: 'dashboard', tab: initialTabVal }, '', path);
      }
    } else if (path === '/login') {
      initialScreen = 'auth';
      window.history.replaceState({ screen: 'auth', tab: null }, '', path);
    } else if (path === '/admin-master-u4') {
      initialScreen = 'admin_panel_master';
      window.history.replaceState({ screen: 'admin_panel_master', tab: null }, '', path);
    } else {
      window.history.replaceState({ screen: 'landing', tab: null }, '', path);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ⚡ THEME DOM SYNC — only runs when theme primitive actually changes
  useEffect(() => {
    localStorage.setItem('pos_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ⚡ SUBSCRIPTION INIT NOTE:
  // The useState lazy initializers on lines 5592–5594 already call
  // getInitialSubscriptionStatus() and getInitialTrialDaysLeft() synchronously.
  // A useEffect that repeats this work is redundant and guarantees a second render.
  // Removed — no replacement needed.

  useEffect(() => {
    window.toggleTheme = () => {
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };
    return () => {
      delete window.toggleTheme;
    };
  }, []);

  // Helper to determine the initial dashboard tab on load/refresh
  const getInitialTab = () => {
    const path = window.location.pathname.substring(1);
    const validTabs = ['dashboard', 'pos', 'shifts', 'sales', 'customers', 'expenses', 'inventory', 'purchases', 'treasury', 'staff', 'drawer', 'reports', 'settings', 'admin_panel'];
    if (validTabs.includes(path)) {
      return path;
    }
    const cached = localStorage.getItem('pos_active_tab');
    if (cached && validTabs.includes(cached)) {
      return cached;
    }
    return 'dashboard';
  };

  // Auth
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = localStorage.getItem('pos_current_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('pos_users')) || DEFAULT_USERS);
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [showAuth, setShowAuth] = useState(() => {
    if (inviteContext !== null) return true;
    const path = window.location.pathname;
    return path === '/login';
  });

  // Unified navigation helper updating path and state history
  const navigateTo = useCallback((screen, tab = null, replace = false) => {
    let path = '/';
    if (screen === 'auth') {
      path = '/login';
    } else if (screen === 'dashboard') {
      path = '/' + (tab || activeTab);
    } else if (screen === 'admin_panel_master') {
      path = '/admin-master-u4';
    }
    
    const state = { screen, tab };
    if (replace) {
      window.history.replaceState(state, '', path);
    } else {
      window.history.pushState(state, '', path);
    }
    setCurrentPath(path);
  }, [activeTab]);

  // Sync currentUser to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pos_current_user');
    }
  }, [currentUser]);

  // Sync activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('pos_active_tab', activeTab);
  }, [activeTab]);


  // Data (localStorage as fallback/cache, Supabase as source of truth)
  const [drawerBalance, setDrawerBalance] = useState(() => Number(localStorage.getItem('pos_drawerBalance')) || 0);
  const [mainSafeBalance, setMainSafeBalance] = useState(() => Number(localStorage.getItem('pos_mainSafeBalance')) || 0);
  const [bankBalance, setBankBalance] = useState(() => Number(localStorage.getItem('pos_bankBalance')) || 0);
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'EGP');
  const [taxRate, setTaxRate] = useState(() => Number(localStorage.getItem('taxRate')) || 14);
  const [enableServiceFee, setEnableServiceFee] = useState(() => localStorage.getItem('enableServiceFee') === 'true');
  const [serviceFee, setServiceFee] = useState(() => Number(localStorage.getItem('serviceFee')) || 0);
  const [storeName, setStoreName] = useState(() => localStorage.getItem('storeName') || 'StorePilot');
  const [invoiceLogo, setInvoiceLogo] = useState(() => localStorage.getItem('pos_invoiceLogo') || null);
  const [invoiceHeader, setInvoiceHeader] = useState(() => localStorage.getItem('pos_invoiceHeader') || '');
  const [invoiceFooter, setInvoiceFooter] = useState(() => localStorage.getItem('pos_invoiceFooter') || '');


  // Hook appCurrency to state + sync settings to Supabase
  useEffect(() => {
    appCurrency = currency;
    localStorage.setItem('currency', currency);
    localStorage.setItem('taxRate', taxRate);
    localStorage.setItem('enableServiceFee', enableServiceFee);
    localStorage.setItem('serviceFee', serviceFee);
    localStorage.setItem('storeName', storeName);
    localStorage.setItem('pos_invoiceLogo', invoiceLogo || '');
    localStorage.setItem('pos_invoiceHeader', invoiceHeader);
    localStorage.setItem('pos_invoiceFooter', invoiceFooter);
    // Sync to cloud
    if (branchId && cloudReady) {
      SB.saveSettings(branchId, {
        currency, tax_rate: taxRate, enable_service_fee: enableServiceFee,
        service_fee: serviceFee, store_name: storeName, invoice_logo: invoiceLogo || '',
        invoice_header: invoiceHeader, invoice_footer: invoiceFooter,
        language, theme, drawer_balance: drawerBalance,
        main_safe_balance: mainSafeBalance, bank_balance: bankBalance,
      });
    }
  }, [currency, taxRate, enableServiceFee, serviceFee, storeName, invoiceLogo, invoiceHeader, invoiceFooter, branchId, cloudReady, theme, language]);

  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('pos_categories')) || CATEGORIES);
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('pos_items')) || INITIAL_ITEMS);
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('pos_orders')) || []);
  const [customers, setCustomers] = useState(() => JSON.parse(localStorage.getItem('pos_customers')) || [
    { id: 'cust_demo_1', name: 'Ahmed Mohamed', phone: '0100-555-1234', createdAt: new Date() },
    { id: 'cust_demo_2', name: 'Sara Ali', phone: '0111-888-5678', createdAt: new Date() },
  ]);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('pos_expenses')) || []);
  const [cashboxLog, setCashboxLog] = useState(() => JSON.parse(localStorage.getItem('pos_cashboxLog')) || []);
  const [customerPayments, setCustomerPayments] = useState(() => JSON.parse(localStorage.getItem('pos_customerPayments')) || []);
  const [activeShift, setActiveShift] = useState(() => JSON.parse(localStorage.getItem('pos_activeShift')) || null);
  const [shifts, setShifts] = useState(() => JSON.parse(localStorage.getItem('pos_shifts')) || []);
  const [notifications, setNotifications] = useState([]);
  const [staffEmployees, setStaffEmployees] = useState(() => JSON.parse(localStorage.getItem('pos_staffEmployees')) || []);
  const [staffPayments, setStaffPayments] = useState(() => JSON.parse(localStorage.getItem('pos_staffPayments')) || {});
  const [drawerLogs, setDrawerLogs] = useState(() => JSON.parse(localStorage.getItem('pos_drawerLogs')) || []);
  // Custom per-user permissions set by Owner
  const [userPermissions, setUserPermissions] = useState(() => JSON.parse(localStorage.getItem('pos_userPermissions')) || {}); // { userId: ['tab',...] }
  const [purchases, setPurchases] = useState(() => JSON.parse(localStorage.getItem('pos_purchases')) || []);
  const [vouchers, setVouchers] = useState(() => JSON.parse(localStorage.getItem('pos_vouchers')) || []);
  const [cashLog, setCashLog] = useState(() => JSON.parse(localStorage.getItem('pos_cashLog')) || []);

  // =========================================================================
  // SUPABASE CLOUD BOOT: Load data from cloud on startup
  // =========================================================================
  useEffect(() => {
    let cancelled = false;
    // Suppress browser paint during boot to eliminate the white-flash artifact.
    // A 4-second safety timeout ensures visibility is always restored.
    document.body.classList.add('sp-booting');
    const paintSafetyTimer = setTimeout(() => {
      document.body.classList.remove('sp-booting');
    }, 4000);

    async function bootFromCloud() {
      try {
        // Get or create branch (use machine-id from Electron, fallback to localStorage fingerprint)
        // ⚡ ENVIRONMENT-AWARE MACHINE ID
        // Web/Vercel: generate a stable fingerprint ID synchronously — no Electron
        // API call, no async wait, no hang. Desktop/Electron: use the real hardware ID.
        let machineId = localStorage.getItem('_sp_machine_id') || getCookie('_sp_device_token');

        const isElectron = !!(window.electronAPI?.getMachineId);

        if (isElectron && !machineId) {
          // Desktop only — async hardware ID fetch
          try { machineId = await window.electronAPI.getMachineId(); } catch(e) {
            console.warn('⚠️ Electron getMachineId failed, falling back to fingerprint:', e);
          }
        }

        if (!machineId) {
          // Web fallback: stable fingerprint from userAgent + random salt
          machineId = 'web-' + (navigator.userAgent.slice(0, 40)).replace(/[^a-zA-Z0-9]/g, '') + '-' + Math.random().toString(36).substring(2, 10);
        }

        if (!isElectron) {
          localStorage.setItem('_sp_machine_id', machineId);
          localStorage.setItem('_sp_device_token', machineId);
          setCookie('_sp_device_token', machineId, 3650); // 10 years
        }

        // Helper to race a promise against a timeout
        const promiseWithTimeout = (promise, ms) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
          ]);
        };

        // Attempt to get/create machine branch — non-fatal if it fails
        let branch = null;
        try {
          if (!isElectron) {
            // Web timeout: 3 seconds limit to resolve or create machine branch
            branch = await promiseWithTimeout(SB.getOrCreateBranch(machineId, storeName), 3000);
          } else {
            branch = await SB.getOrCreateBranch(machineId, storeName);
          }
        } catch (branchErr) {
          console.error('⚠️ Initial Supabase Query Error (getOrCreateBranch) Details:', {
            message: branchErr.message,
            code: branchErr.code,
            details: branchErr.details,
            hint: branchErr.hint,
            status: branchErr.status,
            stack: branchErr.stack
          });
        }

        if (cancelled) return;

        // If we got a branch, load its data
        if (branch) {
          setBranchId(branch.id);

          // Load all data from Supabase
          const fetchPromise = Promise.all([
            SB.fetchUsers(branch.id),
            SB.fetchCategories(branch.id),
            SB.fetchItems(branch.id),
            SB.fetchOrders(branch.id),
            SB.fetchCustomers(branch.id),
            SB.fetchExpenses(branch.id),
            SB.fetchShifts(branch.id),
            SB.fetchDrawerLogs(branch.id),
            SB.fetchCustomerPayments(branch.id),
            SB.fetchStaffPayments(branch.id),
            SB.fetchUserPermissions(branch.id),
            SB.fetchSettings(branch.id),
          ]);

          const [cloudUsers, cloudCategories, cloudItems, cloudOrders, cloudCustomers,
                 cloudExpenses, cloudShifts, cloudDrawerLogs, cloudCustomerPayments,
                 cloudStaffPayments, cloudUserPerms, cloudSettings] = 
            !isElectron
              ? await promiseWithTimeout(fetchPromise, 4000)
              : await fetchPromise;

          if (cancelled) return;

          // Only override local state if cloud has data (first-time setup seeds from defaults)
          if (cloudUsers.length > 0) setUsers(cloudUsers);
          if (cloudCategories.length > 0) setCategories(cloudCategories);
          if (cloudItems.length > 0) setItems(cloudItems);
          if (cloudOrders.length > 0) setOrders(cloudOrders);
          if (cloudCustomers.length > 0) setCustomers(cloudCustomers);
          if (cloudExpenses.length > 0) setExpenses(cloudExpenses);
          if (cloudShifts.length > 0) setShifts(cloudShifts);
          if (cloudDrawerLogs.length > 0) setDrawerLogs(cloudDrawerLogs);
          if (cloudCustomerPayments.length > 0) setCustomerPayments(cloudCustomerPayments);
          if (Object.keys(cloudStaffPayments).length > 0) setStaffPayments(cloudStaffPayments);
          if (Object.keys(cloudUserPerms).length > 0) setUserPermissions(cloudUserPerms);

          // Restore active shift if one is still open
          const openShift = cloudShifts.find(s => s.status === 'Open');
          if (openShift) setActiveShift(openShift);

          // Settings
          if (cloudSettings) {
            if (cloudSettings.subscription_status === 'trial') {
              if (cloudSettings.trial_start_date) {
                localStorage.setItem('activationDate', cloudSettings.trial_start_date);
                localStorage.setItem('pos_trial_start_date', cloudSettings.trial_start_date);
              }
            }
            const saas = checkSubscriptionStatus(cloudSettings);
            setSubscriptionStatus(saas.status);
            setTrialDaysLeft(saas.status === 'trial' ? saas.daysLeft : null);
            if (saas.expired) {
              setSubscriptionExpired(true);
              localStorage.setItem('pos_subscription_status', 'expired');
            } else {
              setSubscriptionExpired(false);
              localStorage.setItem('pos_subscription_status', saas.status);
            }
            if (cloudSettings.currency) setCurrency(cloudSettings.currency);
            if (cloudSettings.tax_rate != null) setTaxRate(Number(cloudSettings.tax_rate));
            if (cloudSettings.enable_service_fee != null) setEnableServiceFee(cloudSettings.enable_service_fee);
            if (cloudSettings.service_fee != null) setServiceFee(Number(cloudSettings.service_fee));
            if (cloudSettings.store_name) setStoreName(cloudSettings.store_name);
            if (cloudSettings.invoice_logo) setInvoiceLogo(cloudSettings.invoice_logo);
            if (cloudSettings.invoice_header) setInvoiceHeader(cloudSettings.invoice_header);
            if (cloudSettings.invoice_footer) setInvoiceFooter(cloudSettings.invoice_footer);
            if (cloudSettings.language) setLanguage(cloudSettings.language);
            if (cloudSettings.theme) setTheme(cloudSettings.theme);
            if (cloudSettings.drawer_balance != null) setDrawerBalance(Number(cloudSettings.drawer_balance));
            if (cloudSettings.main_safe_balance != null) setMainSafeBalance(Number(cloudSettings.main_safe_balance));
            if (cloudSettings.bank_balance != null) setBankBalance(Number(cloudSettings.bank_balance));
          } else {
            // First boot: seed cloud with local defaults and trial subscription
            const trialStart = new Date().toISOString();
            localStorage.setItem('activationDate', trialStart);
            localStorage.setItem('pos_trial_start_date', trialStart);
            localStorage.setItem('pos_subscription_status', 'trial');
            await SB.saveSettings(branch.id, {
              currency, tax_rate: taxRate, store_name: storeName, language, theme,
              subscription_status: 'trial', trial_start_date: trialStart
            });
            for (const u of DEFAULT_USERS) await SB.saveUser(branch.id, u);
            for (const c of CATEGORIES) await SB.saveCategory(branch.id, c);
            for (const i of INITIAL_ITEMS) await SB.saveItem(branch.id, i);
          }
          console.log('☁️ Cloud sync ready — Branch:', branch.id);
        } else {
          console.log('☁️ No machine branch resolved — login will handle branch assignment');
        }

        // Mark cloud as ready regardless — login flow can operate independently.
        // ⚡ ATOMIC TRANSITION: setCloudReady + setBootPhase in same synchronous
        // block so React batches them into a single re-render. No transitional
        // state where cloudReady=true but bootPhase='booting' can escape.
        if (!cancelled) {
          clearTimeout(paintSafetyTimer);
          document.body.classList.remove('sp-booting');
          setCloudReady(true);
          setBootPhase('ready');
        }
      } catch (err) {
        console.error('❌ Cloud boot failed, using local cache. Details:', err);
        const localStatus = localStorage.getItem('pos_subscription_status') || 'trial';
        const localTrialStart = localStorage.getItem('activationDate') || localStorage.getItem('pos_trial_start_date');
        const localSubEnd = localStorage.getItem('pos_subscription_end_date');
        const saas = checkSubscriptionStatus(localStatus, localTrialStart, localSubEnd);
        setSubscriptionStatus(saas.status);
        setTrialDaysLeft(saas.status === 'trial' ? saas.daysLeft : null);
        if (saas.expired) {
          setSubscriptionExpired(true);
          localStorage.setItem('pos_subscription_status', 'expired');
        } else {
          setSubscriptionExpired(false);
          localStorage.setItem('pos_subscription_status', saas.status);
        }
        // Still mark as ready so login isn't blocked.
        // ⚡ Same atomic transition as the success path.
        if (!cancelled) {
          clearTimeout(paintSafetyTimer);
          document.body.classList.remove('sp-booting');
          setCloudReady(true);
          setBootPhase('ready');
        }
      }
    }
    bootFromCloud();
    return () => {
      cancelled = true;
      clearTimeout(paintSafetyTimer);
      document.body.classList.remove('sp-booting');
    };
  }, []);

  // =========================================================================
  // SUPABASE REALTIME: Listen for inventory & order changes from other branches
  // =========================================================================
  useEffect(() => {
    if (!branchId || !cloudReady) return;
    const itemsSub = SB.subscribeToItems(branchId, (payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        SB.fetchItems(branchId).then(cloudItems => {
          if (cloudItems.length > 0) setItems(cloudItems);
        });
      }
    });
    const ordersSub = SB.subscribeToOrders(branchId, () => {
      SB.fetchOrders(branchId).then(cloudOrders => {
        if (cloudOrders.length > 0) setOrders(cloudOrders);
      });
    });
    return () => {
      itemsSub.unsubscribe();
      ordersSub.unsubscribe();
    };
  }, [branchId, cloudReady]);

  // -------------------------------------------------------------------------
  // BUG FIX: KEYBOARD INPUT FREEZING / KEYSTROKE TRAPPING BAILOUT
  // -------------------------------------------------------------------------
  // This listener ensures that if any global keyboard hook is active (e.g., 
  // for a future barcode scanner), it will NOT intercept normal typing in 
  // input/textarea elements. 
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleGlobalBailout = (e) => {
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable ||
                      target.closest('.bailout-input');

      if (isInput) {
        // When focused on an input, we stop propagation to other window-level 
        // listeners that might be calling preventDefault() erroneously.
        e.stopImmediatePropagation();
      }
    };

    // Use capture phase (true) to intercept the event before other listeners.
    window.addEventListener('keydown', handleGlobalBailout, true);
    return () => window.removeEventListener('keydown', handleGlobalBailout, true);
  }, []);

  // Global Persistence Effect (localStorage cache + Supabase cloud sync)
  useEffect(() => {
    // Always write to localStorage as offline cache
    localStorage.setItem('pos_users', JSON.stringify(users));
    localStorage.setItem('pos_categories', JSON.stringify(categories));
    localStorage.setItem('pos_items', JSON.stringify(items));
    localStorage.setItem('pos_orders', JSON.stringify(orders));
    localStorage.setItem('pos_customers', JSON.stringify(customers));
    localStorage.setItem('pos_expenses', JSON.stringify(expenses));
    localStorage.setItem('pos_customerPayments', JSON.stringify(customerPayments));
    localStorage.setItem('pos_activeShift', JSON.stringify(activeShift));
    localStorage.setItem('pos_shifts', JSON.stringify(shifts));
    localStorage.setItem('pos_staffEmployees', JSON.stringify(staffEmployees));
    localStorage.setItem('pos_staffPayments', JSON.stringify(staffPayments));
    localStorage.setItem('pos_drawerLogs', JSON.stringify(drawerLogs));
    localStorage.setItem('pos_userPermissions', JSON.stringify(userPermissions));
    localStorage.setItem('pos_purchases', JSON.stringify(purchases));
    localStorage.setItem('pos_vouchers', JSON.stringify(vouchers));
    localStorage.setItem('pos_cashLog', JSON.stringify(cashLog));
    localStorage.setItem('pos_drawerBalance', drawerBalance.toString());
    localStorage.setItem('pos_mainSafeBalance', mainSafeBalance.toString());
    localStorage.setItem('pos_bankBalance', bankBalance.toString());

    // Sync to Supabase cloud if branch is ready
    if (branchId && cloudReady) {
      // Batch sync all entities to cloud
      users.forEach(u => SB.saveUser(branchId, u));
      categories.forEach(c => SB.saveCategory(branchId, c));
      items.forEach(i => SB.saveItem(branchId, i));
      orders.forEach(o => SB.saveOrder(branchId, o));
      customers.forEach(c => SB.saveCustomer(branchId, c));
      expenses.forEach(e => SB.saveExpense(branchId, e));
      shifts.forEach(s => SB.saveShift(branchId, s));
      drawerLogs.forEach(l => SB.saveDrawerLog(branchId, l));
      customerPayments.forEach(p => SB.saveCustomerPayment(branchId, p));
      Object.entries(staffPayments).forEach(([uid, pmts]) => SB.saveStaffPayments(branchId, uid, pmts));
      Object.entries(userPermissions).forEach(([uid, perms]) => SB.saveUserPermissions(branchId, uid, perms));
      // Save balances to settings
      SB.saveSettings(branchId, { drawer_balance: drawerBalance, main_safe_balance: mainSafeBalance, bank_balance: bankBalance });
    }
  }, [users, categories, items, orders, customers, expenses, customerPayments, activeShift, shifts, staffEmployees, staffPayments, drawerLogs, userPermissions, purchases, vouchers, cashLog, drawerBalance, mainSafeBalance, bankBalance, branchId, cloudReady]);


  const pushNotification = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  // Calculate stock
  const calculatedItems = useMemo(() => items.map(item => {
    let stock = item.stock || 0;
    orders.filter(o => o.status !== 'VOIDED' && o.status !== 'REFUNDED').forEach(o => {
      o.items.forEach(oi => { if (oi.itemId === item.id) stock -= oi.quantity; });
    });
    return { ...item, stock };
  }), [items, orders]);

  // =========================================================================
  // MULTI-BRANCH LOGIN: Supabase cross-branch auth with data reload
  // =========================================================================
  const reloadBranchData = useCallback(async (targetBranchId) => {
    if (!targetBranchId) return;
    try {
      const [cloudUsers, cloudCategories, cloudItems, cloudOrders, cloudCustomers,
             cloudExpenses, cloudShifts, cloudDrawerLogs, cloudCustomerPayments,
             cloudStaffPayments, cloudUserPerms, cloudSettings] = await Promise.all([
        SB.fetchUsers(targetBranchId),
        SB.fetchCategories(targetBranchId),
        SB.fetchItems(targetBranchId),
        SB.fetchOrders(targetBranchId),
        SB.fetchCustomers(targetBranchId),
        SB.fetchExpenses(targetBranchId),
        SB.fetchShifts(targetBranchId),
        SB.fetchDrawerLogs(targetBranchId),
        SB.fetchCustomerPayments(targetBranchId),
        SB.fetchStaffPayments(targetBranchId),
        SB.fetchUserPermissions(targetBranchId),
        SB.fetchSettings(targetBranchId),
      ]);
      if (cloudUsers.length > 0) setUsers(cloudUsers);
      if (cloudCategories.length > 0) setCategories(cloudCategories);
      if (cloudItems.length > 0) setItems(cloudItems);
      if (cloudOrders.length > 0) setOrders(cloudOrders); else setOrders([]);
      if (cloudCustomers.length > 0) setCustomers(cloudCustomers); else setCustomers([]);
      if (cloudExpenses.length > 0) setExpenses(cloudExpenses); else setExpenses([]);
      if (cloudShifts.length > 0) setShifts(cloudShifts); else setShifts([]);
      if (cloudDrawerLogs.length > 0) setDrawerLogs(cloudDrawerLogs); else setDrawerLogs([]);
      if (cloudCustomerPayments.length > 0) setCustomerPayments(cloudCustomerPayments); else setCustomerPayments([]);
      if (Object.keys(cloudStaffPayments).length > 0) setStaffPayments(cloudStaffPayments);
      if (Object.keys(cloudUserPerms).length > 0) setUserPermissions(cloudUserPerms);
      const openShift = cloudShifts.find(s => s.status === 'Open');
      setActiveShift(openShift || null);
      if (cloudSettings) {
        if (cloudSettings.drawer_balance != null) setDrawerBalance(Number(cloudSettings.drawer_balance));
        if (cloudSettings.main_safe_balance != null) setMainSafeBalance(Number(cloudSettings.main_safe_balance));
        if (cloudSettings.bank_balance != null) setBankBalance(Number(cloudSettings.bank_balance));
      }
      console.log('🔄 Branch data reloaded for:', targetBranchId);
    } catch (err) {
      console.error('Branch data reload failed:', err);
    }
  }, []);

  const handleSignUp = async (name, username, password, signUpStoreName, inviteCtx) => {
    try {
      // Connect to Supabase Auth signUp if on Web
      if (cloudReady) {
        const isElectron = !!(window.electronAPI?.getMachineId);
        if (!isElectron) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: username, // username represents the email address
            password: password,
          });
          if (authError) {
            console.error('Supabase Auth signUp failed:', authError);
            return authError.message;
          }
        }
      }

      const userId = 'USR-' + Date.now().toString(36).toUpperCase();

      // -----------------------------------------------------------------------
      // BRANCH A: Staff Invite — bypass store creation, trial, & subscription gate
      // -----------------------------------------------------------------------
      if (inviteCtx && inviteCtx.storeId) {
        const targetBranchId = inviteCtx.storeId;
        const staffRole = inviteCtx.role || 'Cashier';

        const newStaffUser = {
          id: userId,
          name: name,
          username: username,
          password: password,
          pin: password,
          role: staffRole,
          isActive: true,
          assignedBranchId: targetBranchId,
          assignedBranchName: inviteCtx.storeName || '',
        };

        // Add to local users array
        const updatedUsers = [...users, newStaffUser];
        setUsers(updatedUsers);
        localStorage.setItem('pos_users', JSON.stringify(updatedUsers));

        // Also create a corresponding staff employee record locally
        const empId = 'EMP-' + Date.now().toString(36).toUpperCase();
        const newEmp = {
          id: empId,
          userId,
          name: name,
          role: staffRole,
          salaryBase: 0,
          paymentFrequency: 'MONTHLY',
          username: username,
          pin: password,
          assignedBranchId: targetBranchId,
          assignedBranchName: inviteCtx.storeName || '',
          status: 'ACTIVE',
          shiftStatus: 'OFF_SHIFT',
          todaySales: 0,
          performance: { monthSales: 0, invoiceCount: 0, avgInvoice: 0, returns: 0, commission: 0, cashDiff: 0 },
        };
        setStaffEmployees(prev => [...prev, newEmp]);

        // Save to Supabase under the owner's branch
        if (cloudReady) {
          try {
            await SB.saveUser(targetBranchId, newStaffUser);
            await SB.saveJsonRow('staff_employees', targetBranchId, newEmp);
          } catch (cloudErr) {
            console.error('Cloud staff signup sync failed:', cloudErr);
          }
        }

        // Fetch and inherit the owner's subscription settings
        let inheritedStatus = 'trial';
        if (cloudReady) {
          try {
            const ownerSettings = await SB.fetchSettings(targetBranchId);
            if (ownerSettings) {
              const saas = checkSubscriptionStatus(ownerSettings);
              inheritedStatus = saas.status;
              setSubscriptionStatus(saas.status);
              setSubscriptionExpired(saas.expired || false);
              setTrialDaysLeft(saas.status === 'trial' ? saas.daysLeft : null);
              localStorage.setItem('pos_subscription_status', saas.status);
            }
          } catch (settingsErr) {
            console.error('Failed to fetch owner settings:', settingsErr);
          }
        }

        // Log in as the new staff member
        setCurrentUser(newStaffUser);
        setBranchId(targetBranchId);
        setActiveBranchName(inviteCtx.storeName || '');
        localStorage.setItem('active_branch_id', targetBranchId);
        localStorage.setItem('active_branch_name', inviteCtx.storeName || '');

        // Load the owner's branch data
        await reloadBranchData(targetBranchId);

        setActiveTab('dashboard');
        navigateTo('dashboard', 'dashboard', true);
        pushNotification(
          isRtl
            ? `مرحباً ${name}! تم قبول الدعوة والانضمام إلى ${inviteCtx.storeName || 'المتجر'} كـ ${staffRole}.`
            : `Welcome ${name}! You've joined ${inviteCtx.storeName || 'the store'} as ${staffRole}.`,
          'success'
        );
        return null;
      }

      // -----------------------------------------------------------------------
      // BRANCH B: Normal Owner Registration — create store + trigger trial gate
      // -----------------------------------------------------------------------
      const newUser = {
        id: userId,
        name: name,
        username: username,
        password: password,
        pin: password,
        role: 'Owner',
        isActive: true,
        assignedBranchId: null,
        assignedBranchName: null
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('pos_users', JSON.stringify(updatedUsers));

      localStorage.setItem('pos_subscription_status', 'pending_onboarding');
      localStorage.removeItem('activationDate');
      localStorage.removeItem('pos_trial_start_date');
      localStorage.removeItem('pos_subscription_end_date');

      setSubscriptionStatus('pending_onboarding');
      setSubscriptionExpired(false);
      setTrialDaysLeft(null);

      setStoreName(signUpStoreName);
      localStorage.setItem('storeName', signUpStoreName);

      if (branchId && cloudReady) {
        try {
          await SB.saveUser(branchId, newUser);
          await SB.saveSettings(branchId, {
            store_name: signUpStoreName,
            subscription_status: 'pending_onboarding'
          });
        } catch (cloudErr) {
          console.error('Cloud signup sync failed:', cloudErr);
        }
      }

      setCurrentUser(newUser);

      if (branchId) {
        setActiveBranchName('Main Branch');
        localStorage.setItem('active_branch_id', branchId);
        localStorage.setItem('active_branch_name', 'Main Branch');
        
        // Tenant branch association hook on signup:
        if (cloudReady) {
          supabase
            .from('branches')
            .select('*')
            .eq('id', branchId)
            .maybeSingle()
            .then(({ data: activeBranch }) => {
              if (activeBranch && activeBranch.machine_id && !activeBranch.machine_id.includes(':')) {
                const updatedMachineId = `${userId}:${activeBranch.machine_id}`;
                supabase
                  .from('branches')
                  .update({ machine_id: updatedMachineId })
                  .eq('id', branchId)
                  .then(({ error: updateErr }) => {
                    if (updateErr) console.error('Failed to update machine_id on signup:', updateErr);
                    else console.log(`🔗 Associated branch ${branchId} with owner ${userId} on signup`);
                  });
              }
            })
            .catch(assocErr => console.error('Failed to associate branch on signup:', assocErr));
        }
      }

      setActiveTab('dashboard');
      navigateTo('dashboard', 'dashboard');

      pushNotification(isRtl ? 'تم إنشاء الحساب بنجاح، يرجى اختيار خطة الاشتراك للمتابعة' : 'Account created successfully. Please select a plan to continue.', 'success');
      return null;
    } catch (err) {
      console.error('Signup error:', err);
      return isRtl ? 'حدث خطأ أثناء إنشاء الحساب' : 'An error occurred during sign up';
    }
  };

  const handleSelectSubscriptionPlan = async (planType) => {
    try {
      const now = new Date();
      let status = 'trial';
      let expiry = null;
      let trialDays = null;
      
      if (planType === 'trial') {
        status = 'trial';
        expiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        trialDays = 14;
        
        localStorage.setItem('activationDate', now.toISOString());
        localStorage.setItem('pos_trial_start_date', now.toISOString());
        localStorage.setItem('pos_subscription_status', 'trial');
        localStorage.removeItem('pos_subscription_end_date');
      } else if (planType === 'monthly') {
        status = 'active';
        expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        localStorage.setItem('pos_subscription_status', 'active');
        localStorage.setItem('pos_subscription_end_date', expiry);
        localStorage.removeItem('activationDate');
        localStorage.removeItem('pos_trial_start_date');
      } else if (planType === 'yearly') {
        status = 'active';
        expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        
        localStorage.setItem('pos_subscription_status', 'active');
        localStorage.setItem('pos_subscription_end_date', expiry);
        localStorage.removeItem('activationDate');
        localStorage.removeItem('pos_trial_start_date');
      }
      
      setSubscriptionStatus(status);
      setSubscriptionExpired(false);
      setTrialDaysLeft(trialDays);
      navigateTo('dashboard', activeTab);
      
      // Save settings to cloud if online
      const targetBranchId = branchId || localStorage.getItem('active_branch_id');
      if (targetBranchId && cloudReady) {
        try {
          await SB.saveSettings(targetBranchId, {
            subscription_status: status,
            trial_start_date: status === 'trial' ? now.toISOString() : undefined,
            subscription_end_date: status === 'active' ? expiry : undefined
          });
        } catch (cloudErr) {
          console.error('Failed to sync payment status to cloud:', cloudErr);
        }
      }
      
      pushNotification(
        isRtl 
          ? `🎉 تم تفعيل خطة الاشتراك (${planType === 'trial' ? 'فترة تجريبية' : planType === 'monthly' ? 'شهري' : 'سنوي'}) بنجاح!` 
          : `🎉 Subscription plan (${planType.toUpperCase()}) activated successfully!`, 
        'success'
      );
    } catch (err) {
      console.error('Subscription selection error:', err);
    }
  };

  const handleLogin = async (id, pwd) => {
    try {
      // Step 1: Try Supabase cross-branch auth (cloud-first)
      let cloudUser = null;
      try {
        cloudUser = await SB.verifyCredentialsLogin(id, pwd);
      } catch (authErr) {
        if (authErr.message === 'BRANCH_DEACTIVATED') {
          return isRtl ? 'الفرع التابع له معطّل حالياً' : 'Your assigned branch is currently deactivated';
        }
        console.error('⚠️ Cloud auth rejected or failed. Details:', {
          message: authErr.message,
          stack: authErr.stack,
          code: authErr.code,
          details: authErr.details,
          hint: authErr.hint,
          status: authErr.status
        });
      }
      console.log('☁️ Cloud Auth Response for:', id, '->', cloudUser);

      // Step 2: If cloud returned a match, use it
      if (cloudUser) {
        const targetBranchId = cloudUser.assignedBranchId || branchId;
        if (targetBranchId) {
          const settings = await SB.fetchSettings(targetBranchId);
          if (settings) {
            if (settings.subscription_status === 'trial') {
              if (settings.trial_start_date) {
                localStorage.setItem('activationDate', settings.trial_start_date);
                localStorage.setItem('pos_trial_start_date', settings.trial_start_date);
              }
            }
            const saas = checkSubscriptionStatus(settings);
            setSubscriptionStatus(saas.status);
            setTrialDaysLeft(saas.status === 'trial' ? saas.daysLeft : null);
            if (saas.expired) {
              setSubscriptionExpired(true);
              localStorage.setItem('pos_subscription_status', 'expired');
            } else {
              setSubscriptionExpired(false);
              localStorage.setItem('pos_subscription_status', saas.status);
            }
          }
        }
        setCurrentUser(cloudUser);
        console.log("=== YOUR REAL USER ID ===", cloudUser.id);
        
        // Tenant branch association hook on login:
        if (cloudUser.role === 'Owner' && branchId && cloudReady) {
          try {
            const { data: activeBranch } = await supabase
              .from('branches')
              .select('*')
              .eq('id', branchId)
              .maybeSingle();

            if (activeBranch && activeBranch.machine_id && !activeBranch.machine_id.includes(':')) {
              const updatedMachineId = `${cloudUser.id}:${activeBranch.machine_id}`;
              const { error: updateErr } = await supabase
                .from('branches')
                .update({ machine_id: updatedMachineId })
                .eq('id', branchId);
              if (updateErr) console.error('Failed to update machine_id on login:', updateErr);
              else console.log(`🔗 Associated branch ${branchId} with owner ${cloudUser.id} on login`);
            }
          } catch (assocErr) {
            console.error('Failed to associate branch on login:', assocErr);
          }
        }

        // Bind session to user's assigned branch
        if (cloudUser.assignedBranchId && cloudUser.role !== 'Owner') {
          setBranchId(cloudUser.assignedBranchId);
          setActiveBranchName(cloudUser.assignedBranchName || '');
          localStorage.setItem('active_branch_id', cloudUser.assignedBranchId);
          localStorage.setItem('active_branch_name', cloudUser.assignedBranchName || '');
          // Reload data scoped to the user's assigned branch
          await reloadBranchData(cloudUser.assignedBranchId);
        } else if (cloudUser.role === 'Owner' && branchId) {
          // Owner keeps existing machine branch
          setActiveBranchName('Main Branch');
          localStorage.setItem('active_branch_id', branchId);
          localStorage.setItem('active_branch_name', 'Main Branch');
        }
        const firstTab = canAccess(cloudUser, 'dashboard') ? 'dashboard' : 'pos';
        setActiveTab(firstTab);
        navigateTo('dashboard', firstTab);
        return null;
      }

      // Step 3: Fallback to local user array (offline mode)
      let found = users.find(u => u.username === id && u.password === pwd);
      
      // Step 3.5: Hard Fallback to structural DEFAULT_USERS if Incognito/Schema error blocked user load
      if (!found) {
        found = DEFAULT_USERS.find(u => u.username === id && u.password === pwd);
      }
      
      if (found && found.isActive) {
        const localStatus = localStorage.getItem('pos_subscription_status') || 'trial';
        const localTrialStart = localStorage.getItem('activationDate') || localStorage.getItem('pos_trial_start_date');
        const localSubEnd = localStorage.getItem('pos_subscription_end_date');
        const saas = checkSubscriptionStatus(localStatus, localTrialStart, localSubEnd);
        setSubscriptionStatus(saas.status);
        setTrialDaysLeft(saas.status === 'trial' ? saas.daysLeft : null);
        if (saas.expired) {
          setSubscriptionExpired(true);
          localStorage.setItem('pos_subscription_status', 'expired');
        } else {
          setSubscriptionExpired(false);
          localStorage.setItem('pos_subscription_status', saas.status);
        }
        pushNotification(isRtl ? 'تم الدخول في الوضع الأوفلاين مؤقتاً' : 'Logged in offline temporarily', 'warning');
        setCurrentUser(found);
        console.log("=== YOUR REAL USER ID ===", found.id);
        if (found.assignedBranchId && found.role !== 'Owner') {
          setBranchId(found.assignedBranchId);
          setActiveBranchName(found.assignedBranchName || '');
          localStorage.setItem('active_branch_id', found.assignedBranchId);
          localStorage.setItem('active_branch_name', found.assignedBranchName || '');
          await reloadBranchData(found.assignedBranchId);
        } else if (found.role === 'Owner' && branchId) {
          setActiveBranchName('Main Branch');
          localStorage.setItem('active_branch_id', branchId);
          localStorage.setItem('active_branch_name', 'Main Branch');
        }
        const firstTab = canAccess(found, 'dashboard') ? 'dashboard' : 'pos';
        setActiveTab(firstTab);
        navigateTo('dashboard', firstTab);
        return null;
      }

      if (!found && users.length === 0) {
         console.warn('Login rejected: Cloud Auth returned null and local Users array is empty (Incognito/Offline). Checked DEFAULT_USERS but no match.');
         return isRtl ? 'الاتصال بالسحابة مقطوع والبيانات المحلية فارغة' : 'Cloud connection failed and local cache is empty';
      }

      return isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials';
    } catch (err) {
      console.error('Login error:', err);
      return isRtl ? 'حدث خطأ أثناء تسجيل الدخول' : 'Login error occurred';
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setBranchId(null);
    setActiveBranchName('');
    setSubscriptionExpired(false);
    setSubscriptionStatus('expired');
    localStorage.removeItem('active_branch_id');
    localStorage.removeItem('active_branch_name');
    navigateTo('landing');
  };

  const handleDummySubscribe = async (code) => {
    if (!code) return false;
    const regex = /^ACT-[A-Z0-9]{6}$/;
    if (!regex.test(code)) {
      return false;
    }

    const targetBranchId = branchId || localStorage.getItem('active_branch_id');
    if (!targetBranchId) return false;
    const now = new Date();
    const subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Set state
    setSubscriptionStatus('active');
    setSubscriptionExpired(false);
    setTrialDaysLeft(null);
    
    // Persist to local storage
    localStorage.setItem('pos_subscription_status', 'active');
    localStorage.setItem('pos_subscription_end_date', subscriptionEndDate);
    
    // Persist to Supabase if online
    if (cloudReady) {
      try {
        await SB.saveSettings(targetBranchId, {
          subscription_status: 'active',
          subscription_end_date: subscriptionEndDate
        });
      } catch (err) {
        console.error('Failed to sync payment status to cloud:', err);
      }
    }
    pushNotification(isRtl ? '🎉 تم تفعيل الاشتراك بنجاح لمدة 30 يوماً!' : '🎉 Subscription activated successfully for 30 days!', 'success');
    return true;
  };

  const handleManualSync = async () => {
    if (!branchId) return;
    setIsSyncing(true);
    await reloadBranchData(branchId);
    setIsSyncing(false);
  };

  const handleCompleteOrder = (order) => {
    setOrders(prev => [...prev, order]);
    pushNotification(isRtl ? `تم البيع: ${formatMoney(order.total)}` : `Sale complete: ${formatMoney(order.total)}`, 'success');
  };

  const handleOpenShift = (shift) => {
    setActiveShift(shift);
    setShifts(prev => [...prev, shift]);
    setDrawerBalance(Number(shift.openingBalance) || 0);

    pushNotification(isRtl ? 'تم فتح الوردية بنجاح' : 'Shift opened successfully', 'success');
  };

  const handleCloseShift = (shift, actualCash) => {
    const sOrders = orders.filter(o => o.shiftId === shift.id && o.status !== 'VOIDED' && o.status !== 'REFUNDED');
    const sExps = expenses.filter(e => e.shiftId === shift.id);
    const sAdvances = Object.values(staffPayments || {})
      .flat()
      .filter(p => p.type === 'ADVANCE' && p.shiftId === shift.id);
    const sDrawerLogs = drawerLogs.filter(l => l.shiftId === shift.id);

    const expectedCash = calculateExpectedCash(shift.openingBalance, sOrders, sExps, sAdvances, sDrawerLogs);
    const cashVariance = (Number(actualCash) || 0) - expectedCash;

    const cashSales = sOrders.filter(o => o.paymentMethod === 'Cash' || !o.paymentMethod).reduce((s, o) => s + (Number(o.total) || 0), 0);
    const cardSales = sOrders.filter(o => o.paymentMethod === 'Card').reduce((s, o) => s + (Number(o.total) || 0), 0);
    const creditSales = sOrders.filter(o => o.paymentMethod === 'Credit').reduce((s, o) => s + (Number(o.total) || 0), 0);
    const totalExpenses = sExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalAdvances = sAdvances.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const drawerIn = sDrawerLogs.filter(l => l.type === 'IN').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const drawerOut = sDrawerLogs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    const updatedShift = {
        ...shift,
        closedAt: new Date(),
        status: 'Closed',
        actualCash: Number(actualCash) || 0,
        expectedCash: expectedCash,
        cashVariance: cashVariance,
        totalCashSales: cashSales,
        totalCardSales: cardSales,
        totalCreditSales: creditSales,
        totalExpenses: totalExpenses,
        totalAdvances: totalAdvances,
        drawerIn: drawerIn,
        drawerOut: drawerOut,
    };

    setShifts(prev => prev.map(s => s.id === shift.id ? updatedShift : s));
    setActiveShift(null);
    setDrawerBalance(0);
    pushNotification(isRtl ? `تم إغلاق الوردية ${shift.id}` : `Shift ${shift.id} closed`);
  };

  const handleVoidOrder = (id, type, targetItem) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (type === 'Partial' && targetItem) {
      // Partial Refund logic
      const refundAmount = targetItem.quantity * targetItem.priceAtOrder;
      setOrders(prev => prev.map(o => {
        if (o.id !== id) return o;
        const remainingItems = o.items.filter(i => i.cartId !== targetItem.cartId);
        if (remainingItems.length === 0) return { ...o, status: 'REFUNDED', items: [] };
        const newTotal = o.total - refundAmount;
        return { ...o, items: remainingItems, total: newTotal, subtotal: o.subtotal - (targetItem.quantity * targetItem.priceAtOrder) };
      }));

      // Cash Log Entry for Partial
      if (order.paymentMethod === 'Cash' || !order.paymentMethod) {
        if (setDrawerBalance) setDrawerBalance(prev => prev - Number(refundAmount));
        if (setDrawerLogs) setDrawerLogs(prev => [{ 
          id: 'DL-REF-' + order.id + '-' + Date.now(), 
          type: 'OUT', 
          amount: Number(refundAmount), 
          note: `مرتجع جزئي طلب #${order.id}`, 
          timestamp: new Date(), 
          shiftId: activeShift?.id || 'manual' 
        }, ...prev]);
      }
      pushNotification(isRtl ? 'تم ارتجاع الصنف وتحديث الخزينة' : 'Item refunded and cash updated', 'warning');
      return;
    }

    // Full Void/Refund
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: type === 'Refund' ? 'REFUNDED' : 'VOIDED' } : o));

    if (type === 'Refund' && (order.paymentMethod === 'Cash' || !order.paymentMethod)) {
      if (setDrawerBalance) setDrawerBalance(prev => prev - Number(order.total));
      if (setDrawerLogs) setDrawerLogs(prev => [{ 
        id: 'DL-REF-' + order.id + '-' + Date.now(), 
        type: 'OUT', 
        amount: Number(order.total), 
        note: `مرتجع كلي طلب #${order.id}`, 
        timestamp: new Date(), 
        shiftId: activeShift?.id || 'manual' 
      }, ...prev]);
    }
    pushNotification(isRtl ? (type === 'Refund' ? 'تم الارتجاع الكلي ونقض الخزينة' : 'تم إلغاء الفاتورة') : (type === 'Refund' ? 'Full refund completed' : 'Order voided'), 'warning');
  };

  const handleAddCustomerPayment = (payment) => {
    setCustomerPayments(prev => [...prev, payment]);

    // Financial routing: Debt collection during shift goes into Cash Drawer
    if (setDrawerBalance) setDrawerBalance(prev => prev + Number(payment.amount));
    if (setDrawerLogs) {
      setDrawerLogs(prev => [{ 
        id: 'DL-DEBT-' + Date.now(), 
        type: 'IN', 
        amount: Number(payment.amount), 
        note: `تحصيل فاتورة آجل #${payment.orderId || ''}`, 
        timestamp: new Date(), 
        shiftId: activeShift?.id || 'manual' 
      }, ...prev]);
    }

    // Update global order state so the badge changes from UNPAID to PAID
    if (payment.orderId && setOrders) {
      setOrders(prev => prev.map(o => o.id === payment.orderId ? { ...o, status: 'PAID', paymentMethod: 'Cash' } : o));
    }

    pushNotification(isRtl ? 'تم تحصيل المبلغ وإضافته للدرج' : 'Payment collected & added to drawer', 'success');
  };


  const handleAddItem = (item) => {
    setItems(prev => [...prev, item]);
    pushNotification(isRtl ? 'تمت إضافة الصنف' : 'Item added', 'success');
  };

  const handleUpdateItem = (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
    pushNotification(isRtl ? 'تم تحديث الصنف' : 'Item updated', 'success');
  };

  const handleDeleteItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    pushNotification(isRtl ? 'تم حذف الصنف' : 'Item deleted', 'info');
  };

  const handleAddCustomer = (cust) => {
    setCustomers(prev => [...prev, cust]);
    pushNotification(isRtl ? 'تمت إضافة العميل' : 'Customer added', 'success');
  };

  const handleAddExpense = (exp) => {
    setExpenses(prev => [...prev, exp]);
    pushNotification(isRtl ? 'تم تسجيل المصروف' : 'Expense recorded', 'success');
  };

  const handleUpdateUser = (user) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if (currentUser?.id === user.id) setCurrentUser(user);
    pushNotification(isRtl ? 'تم تحديث بياناتك' : 'Profile updated', 'success');
  };

  const handleSetActiveTab = (tab) => {
    if (!canAccess(currentUser, tab, userPermissions)) {
      pushNotification(isRtl ? 'لا تملك صلاحية الوصول' : 'Access denied', 'error');
      return;
    }
    setActiveTab(tab);
    navigateTo('dashboard', tab);
  };

  const renderTabContent = () => {
    if (!currentUser) return null;
    const saleableItems = calculatedItems.filter(i => i.type === 'PRODUCT');
    switch (activeTab) {
      case 'dashboard': return <DashboardTab items={calculatedItems} orders={orders} customers={customers} expenses={expenses} purchases={purchases} customerPayments={customerPayments} cashboxLog={cashLog} activeShift={activeShift} users={users} language={language} />;
      case 'pos': return <POSScreen currentUser={currentUser} items={saleableItems} customers={customers} categories={categories} onCompleteOrder={handleCompleteOrder} language={language} activeShift={activeShift} onAddCustomer={handleAddCustomer} onGoToShifts={() => handleSetActiveTab('shifts')} taxRate={taxRate} enableServiceFee={enableServiceFee} serviceFee={serviceFee} currency={currency} storeName={storeName} setDrawerBalance={setDrawerBalance} invoiceLogo={invoiceLogo} invoiceHeader={invoiceHeader} invoiceFooter={invoiceFooter} users={users} />;
      case 'drawer': return <DrawerScreen activeShift={activeShift} drawerBalance={drawerBalance} setDrawerBalance={setDrawerBalance} setMainSafeBalance={setMainSafeBalance} drawerLogs={drawerLogs} setDrawerLogs={setDrawerLogs} currency={currency} isRtl={isRtl} setCashLog={setCashLog} currentUser={currentUser} />;
      case 'shifts': return <ShiftScreen activeShift={activeShift} shifts={shifts} onOpenShift={handleOpenShift} onCloseShift={handleCloseShift} currentUser={currentUser} language={language} users={users} orders={orders} expenses={expenses} onLogout={handleLogout} storeName={storeName} currency={currency} drawerLogs={drawerLogs} />;
      case 'sales': return <SalesScreen orders={orders} users={users} customers={customers} language={language} onVoidOrder={handleVoidOrder} currency={currency} storeName={storeName} invoiceLogo={invoiceLogo} invoiceHeader={invoiceHeader} invoiceFooter={invoiceFooter} activeShift={activeShift} />;
      case 'inventory': return <InventoryScreen items={calculatedItems} categories={categories} modifiers={MODIFIERS} onAddCategory={c => setCategories(p => [...p, c])} onAddItem={handleAddItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} language={language} />;
      case 'customers': return <CustomersScreen customers={customers} orders={orders} customerPayments={customerPayments} onAddCustomer={handleAddCustomer} onAddCustomerPayment={handleAddCustomerPayment} language={language} />;
      case 'expenses': return <ExpensesScreen expenses={expenses} onAddExpense={handleAddExpense} currentUser={currentUser} activeShift={activeShift} language={language} setDrawerBalance={setDrawerBalance} setDrawerLogs={setDrawerLogs} setMainSafeBalance={setMainSafeBalance} setCashLog={setCashLog} />;
      case 'settings': return <SettingsScreen currentUser={currentUser} users={users} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} onUpdateUser={handleUpdateUser} userPermissions={userPermissions} setUserPermissions={setUserPermissions} storeName={storeName} setStoreName={setStoreName} currency={currency} setCurrency={setCurrency} taxRate={taxRate} setTaxRate={setTaxRate} enableServiceFee={enableServiceFee} setEnableServiceFee={setEnableServiceFee} serviceFee={serviceFee} setServiceFee={setServiceFee} pushNotification={pushNotification} invoiceLogo={invoiceLogo} setInvoiceLogo={setInvoiceLogo} invoiceHeader={invoiceHeader} setInvoiceHeader={setInvoiceHeader} invoiceFooter={invoiceFooter} setInvoiceFooter={setInvoiceFooter} />;
      case 'purchases': return <PurchasesScreen purchases={purchases} setPurchases={setPurchases} items={items} setItems={setItems} vouchers={vouchers} setVouchers={setVouchers} activeShift={activeShift} currentUser={currentUser} language={language} users={users} pushNotification={pushNotification} setDrawerBalance={setDrawerBalance} setDrawerLogs={setDrawerLogs} setMainSafeBalance={setMainSafeBalance} setCashLog={setCashLog} />;
      case 'treasury': return <TreasuryScreen orders={orders} purchases={purchases} expenses={expenses} vouchers={vouchers} customerPayments={customerPayments} staffPayments={staffPayments} cashLog={cashLog} setCashLog={setCashLog} activeShift={activeShift} currentUser={currentUser} language={language} users={users} pushNotification={pushNotification} setDrawerBalance={setDrawerBalance} setDrawerLogs={setDrawerLogs} bankBalance={bankBalance} setBankBalance={setBankBalance} />;
      case 'staff': return <StaffScreen employees={staffEmployees} setEmployees={setStaffEmployees} paymentsMap={staffPayments} setPaymentsMap={setStaffPayments} users={users} setUsers={setUsers} currentUser={currentUser} language={language} pushNotification={pushNotification} activeShift={activeShift} setDrawerBalance={setDrawerBalance} setDrawerLogs={setDrawerLogs} setMainSafeBalance={setMainSafeBalance} setCashLog={setCashLog} />;
      case 'reports': return <ReportsScreen orders={orders} purchases={purchases} expenses={expenses} items={calculatedItems} customers={customers} customerPayments={customerPayments} language={language} />;
      case 'transfers': return <StockTransfersScreen currentUser={currentUser} branchId={branchId} items={calculatedItems} language={language} pushNotification={pushNotification} />;
      case 'branches': return (currentUser.role === 'Owner' || currentUser.role === 'admin')
        ? <BranchManagement language={language} currentUser={currentUser} />
        : <div className="flex flex-col items-center justify-center h-full gap-6 p-10">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center"><span className="text-4xl">🔒</span></div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">{isRtl ? 'غير مصرح' : 'Unauthorized'}</h2>
            <p className="text-[#666] text-xs font-bold uppercase tracking-widest text-center max-w-md">{isRtl ? 'هذه الصفحة متاحة فقط لحساب المالك. تواصل مع مدير النظام.' : 'This page is restricted to the System Owner. Contact your administrator.'}</p>
            <button onClick={() => handleSetActiveTab('dashboard')} className="px-6 py-3 border border-[#D4AF37] text-[#D4AF37] font-black text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all">{isRtl ? 'العودة للرئيسية' : 'Back to Dashboard'}</button>
          </div>;
      case 'admin_panel':
        // Strictly gated to System Developer ID 'u_4' only
        if (currentUser.id !== 'u_4') {
          return (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-10">
              <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center"><span className="text-4xl">🔒</span></div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">{isRtl ? 'غير مصرح — محمي' : 'Unauthorized — Protected'}</h2>
              <p className="text-[#666] text-xs font-bold uppercase tracking-widest text-center max-w-md">{isRtl ? 'لوحة التحكم العامة محجوزة حصرياً لمطوّر النظام.' : 'Master Admin Panel is exclusively reserved for the System Developer.'}</p>
              <button onClick={() => handleSetActiveTab('dashboard')} className="px-6 py-3 border border-[#D4AF37] text-[#D4AF37] font-black text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all">{isRtl ? 'العودة للرئيسية' : 'Back to Dashboard'}</button>
            </div>
          );
        }
        return (
          <AdminMasterPanel
            users={users}
            setUsers={setUsers}
            currentUser={currentUser}
            language={language}
            subscriptionStatus={subscriptionStatus}
            setSubscriptionStatus={setSubscriptionStatus}
            setSubscriptionExpired={setSubscriptionExpired}
            setTrialDaysLeft={setTrialDaysLeft}
            storeName={storeName}
            pushNotification={pushNotification}
          />
        );
      default: return <PlaceholderScreen title={activeTab} icon="🔧" language={language} />;
    }
  };

  // ⚡ STABLE DASHBOARD RENDER
  // Previously `const Dashboard = () => {...}` was defined as an inline arrow
  // inside App(). React uses referential identity to distinguish component types:
  // a new function reference on every render = React thinks it's a different
  // component = full unmount + remount + visible flash on every App re-render.
  //
  // Fix: renderDashboard() is a plain render function (not a component). It returns
  // JSX directly — no React component boundary, no identity tracking, no remount.
  // The useEffect for expiry checking moves up to App level where it belongs.
  const localStatus = localStorage.getItem('pos_subscription_status') || 'trial';
  const localTrialStart = localStorage.getItem('activationDate') || localStorage.getItem('pos_trial_start_date');
  const localSubEnd = localStorage.getItem('pos_subscription_end_date');
  const dashSaas = checkSubscriptionStatus(localStatus, localTrialStart, localSubEnd);
  const dashDaysLeft = dashSaas.daysLeft;

  // Expiry check — runs at App level so it doesn't trigger a child remount
  useEffect(() => {
    if (dashDaysLeft !== null && dashDaysLeft <= 0) {
      localStorage.setItem('pos_subscription_status', 'expired');
      setSubscriptionStatus('expired');
      setSubscriptionExpired(true);
    }
  }, [dashDaysLeft]);

  const renderDashboard = () => (
    <div className="flex h-screen w-screen transition-colors duration-200" style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Offline Warning Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest animate-pulse">
          ⚠️ {isRtl ? 'لا يوجد اتصال بالإنترنت — لن تتم المزامنة حتى يعود الاتصال' : 'No Internet Connection — Data will not sync until reconnected'}
        </div>
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        onLogout={handleLogout}
        user={currentUser}
        language={language}
        setLanguage={setLanguage}
        userPermissions={userPermissions}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeBranchName={activeBranchName}
        theme={theme}
      />

      <main className="flex-1 flex flex-col min-h-0 transition-colors duration-200 relative" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderLeft: isRtl ? '1px solid var(--border-color)' : 'none', borderRight: !isRtl ? 'none' : 'none' }}>
        <SubscriptionWarningBanner
          daysLeft={dashDaysLeft}
          onRenew={() => {
            localStorage.setItem('pos_subscription_status', 'pending_onboarding');
            setSubscriptionStatus('pending_onboarding');
          }}
          language={language}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '0 24px', height: 60, flexShrink: 0, zIndex: 10, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 3, height: 20, background: 'var(--accent-blue)', borderRadius: 99 }} />
            <h1 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.2px' }}>
              {T[language][activeTab] || activeTab}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeBranchName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-blue-light)', padding: '5px 12px', borderRadius: 20, border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: 12 }}>🏢</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)' }}>{activeBranchName}</span>
              </div>
            )}
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, background: 'var(--bg-deep)', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
              title={isRtl ? (theme === 'dark' ? 'الوضع المضيء' : 'الوضع المظلم') : (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.background = 'var(--accent-blue-light)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-deep)'; }}
            >
              <span style={{ fontSize: 16 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
            {branchId && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, background: 'var(--bg-deep)', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', opacity: isSyncing ? 0.6 : 1 }}
                title={isRtl ? 'مزامنة البيانات' : 'Sync Data'}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.background = 'var(--accent-blue-light)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-deep)'; }}
              >
                <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} style={{ color: isSyncing ? 'var(--accent-blue)' : 'var(--text-secondary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21v-5h5" />
                </svg>
              </button>
            )}
            {activeShift && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', padding: '5px 12px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>{isRtl ? 'وردية نشطة' : 'Live Session'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto transition-colors duration-200" style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
          {renderTabContent()}
        </div>
      </main>

      <NotificationOverlay
        notifications={notifications}
        onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))}
      />
    </div>
  );

  // ⚡ STABLE AUTH GATEWAY RENDER
  // Same pattern as renderDashboard — a plain render function, not a React component.
  // This eliminates the remount flash that occurred when AuthGateway was an inline
  // const arrow (new reference = new component type = full unmount on every App render).
  //
  const renderAuthGateway = () => {
    // -----------------------------------------------------------------------
    // SECRET ROUTE: /admin-master-u4
    // -----------------------------------------------------------------------
    if (currentPath === '/admin-master-u4') {
      const isDev = currentUser && (currentUser.id === 'u_4' || localStorage.getItem('dev_override') === 'true');
      if (isDev) {
        return (
          <div className="enterprise-ui min-h-screen" style={{ background: '#f8fafc' }} dir={isRtl ? 'rtl' : 'ltr'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: '#1e40af', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🛡️</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 900, fontSize: 13, color: '#1e293b' }}>Master Control Panel</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 600 }}>Developer Access — u_4</p>
                </div>
              </div>
              <button
                onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#64748b' }}
              >
                {isRtl ? '← خروج' : '← Exit'}
              </button>
            </div>
            <AdminMasterPanel
              users={users}
              setUsers={setUsers}
              currentUser={currentUser}
              language={language}
              subscriptionStatus={subscriptionStatus}
              setSubscriptionStatus={setSubscriptionStatus}
              setSubscriptionExpired={setSubscriptionExpired}
              setTrialDaysLeft={setTrialDaysLeft}
              storeName={storeName}
              pushNotification={pushNotification}
            />
            <NotificationOverlay notifications={notifications} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
          </div>
        );
      }
      // Non-u_4 user or unauthenticated guest: render 404
      return (
        <NotFoundScreen
          language={language}
          onGoHome={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}
        />
      );
    }

    // 1. If not logged in -> Landing Page or Auth Form
    if (!currentUser) {
      return (
        <div dir={isRtl ? 'rtl' : 'ltr'} style={{ position: 'relative' }}>
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-[9999] text-white text-center py-2 text-xs font-black uppercase tracking-widest animate-pulse" style={{ background: '#d97706' }}>
              ⚠️ {isRtl ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection — Data will not sync until reconnected'}
            </div>
          )}

          {(!showAuth && !inviteContext) ? (
            <LandingPage
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              setTheme={setTheme}
              onLogin={() => { setShowAuth(true); navigateTo('auth'); }}
              onGetStarted={() => { setShowAuth(true); navigateTo('auth'); }}
            />
          ) : (
            <CombinedAuthScreen
              onLogin={handleLogin}
              onSignUp={handleSignUp}
              language={language}
              setLanguage={setLanguage}
              users={users}
              onUpdateUser={handleUpdateUser}
              inviteContext={inviteContext}
              theme={theme}
              setTheme={setTheme}
            />
          )}
          <NotificationOverlay
            notifications={notifications}
            onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))}
          />
        </div>
      );
    }

    // 2. If logged in, check subscriptionStatus
    const offlineBanner = !isOnline && (
      <div className="fixed top-0 left-0 right-0 z-[9999] text-white text-center py-2 text-xs font-black uppercase tracking-widest animate-pulse" style={{ background: '#d97706' }}>
        ⚠️ {isRtl ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection — Data will not sync until reconnected'}
      </div>
    );

    if (subscriptionStatus === 'pending_onboarding') {
      return (
        <div style={{ minHeight: '100vh' }} dir={isRtl ? 'rtl' : 'ltr'}>
          {offlineBanner}
          <SubscriptionSelectionScreen onSelectPlan={handleSelectSubscriptionPlan} onLogout={handleLogout} language={language} />
          <NotificationOverlay notifications={notifications} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
        </div>
      );
    }

    // 3. Check if subscription is active/trial and not expired
    const isSubscriptionActive = !subscriptionExpired && (subscriptionStatus === 'active' || subscriptionStatus === 'trial');
    if (!isSubscriptionActive) {
      return (
        <div style={{ minHeight: '100vh' }} dir={isRtl ? 'rtl' : 'ltr'}>
          {offlineBanner}
          <SubscriptionSelectionScreen onSelectPlan={handleSelectSubscriptionPlan} onLogout={handleLogout} language={language} />
          <NotificationOverlay notifications={notifications} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
        </div>
      );
    }

    // 4. Default -> Main Dashboard
    return renderDashboard();
  };

  const t = T[language];

  return (
    bootPhase === 'booting' ? (
      // ⚡ BOOT SPINNER
      // Shown while Supabase resolves. The body.sp-booting CSS class (added at boot
      // start) suppresses the browser paint entirely until this spinner is in the DOM,
      // preventing any white/wrong-layout flash before the first meaningful frame.
      <div className="login-rounded flex h-screen w-screen items-center justify-center bg-[#0a0a0c]" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-[#D4AF37]/10 login-rounded rounded-full"></div>
            <div className="absolute inset-0 border-2 border-t-[#D4AF37] border-r-transparent border-b-transparent border-l-transparent login-rounded rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 login-rounded rounded-full animate-pulse flex items-center justify-center">
              <span className="text-[10px]">⚡</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37]">
              {isRtl ? 'بوابة التحقق الآمنة' : 'Secure Verification Gate'}
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 animate-pulse text-center">
              {isRtl ? 'جاري فحص صلاحية الاشتراك والتراخيص...' : 'Verifying subscription credentials...'}
            </p>
          </div>
        </div>
      </div>
    ) : (
      // ⚡ AUTH GATEWAY — rendered as a plain render function call (not a JSX component)
      // so React has no component identity to track, meaning no unmount/remount flash
      // when App state changes.
      renderAuthGateway()
    )
  );
}