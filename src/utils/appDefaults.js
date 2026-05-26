export function getCategories() {
  return [
    { id: 'cat_1', name: { en: 'Coffee', ar: 'قهوة' }, icon: '☕' },
    { id: 'cat_2', name: { en: 'Tea', ar: 'شاي' }, icon: '🫖' },
    { id: 'cat_3', name: { en: 'Pastries', ar: 'مخبوزات' }, icon: '🥐' },
    { id: 'cat_4', name: { en: 'Cold Drinks', ar: 'مشروبات باردة' }, icon: '🥤' },
    { id: 'cat_5', name: { en: 'Desserts', ar: 'حلويات' }, icon: '🍰' },
    { id: 'cat_6', name: { en: 'Raw Materials', ar: 'مواد خام' }, icon: '🥛' },
  ];
}

export function getModifiers() {
  return [
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
}

export function getInitialItems() {
  return [
    { id: 'i_1', sku: '1001', categoryId: 'cat_1', name: { en: 'Espresso', ar: 'اسبريسو' }, basePrice: 2.5, costPrice: 0.8, image: 'https://placehold.co/300', sizes: [{ id: 's1', name: 'S', priceDelta: 0 }, { id: 's2', name: 'M', priceDelta: 0.5 }], modifiers: ['m_5', 'm_6', 'm_7', 'm_8'], stock: 50, isActive: true, type: 'PRODUCT' },
    { id: 'i_2', sku: '1002', categoryId: 'cat_1', name: { en: 'Latte', ar: 'لاتيه' }, basePrice: 3.5, costPrice: 1.2, image: 'https://placehold.co/300', sizes: [{ id: 's3', name: 'S', priceDelta: 0 }, { id: 's4', name: 'M', priceDelta: 0.75 }, { id: 's5', name: 'L', priceDelta: 1.25 }], modifiers: ['m_1', 'm_2', 'm_3', 'm_4', 'm_5', 'm_6', 'm_7', 'm_8', 'm_12', 'm_13'], stock: 40, isActive: true, type: 'PRODUCT' },
    { id: 'i_3', sku: '1003', categoryId: 'cat_3', name: { en: 'Butter Croissant', ar: 'كرواسون زبدة' }, basePrice: 2.75, costPrice: 0.9, image: 'https://placehold.co/300', sizes: [{ id: 's6', name: 'M', priceDelta: 0 }], modifiers: [], stock: 25, isActive: true, type: 'PRODUCT' },
    { id: 'i_4', sku: '1004', categoryId: 'cat_4', name: { en: 'Iced Americano', ar: 'أمريكانو بارد' }, basePrice: 3.0, costPrice: 0.7, image: 'https://placehold.co/300', sizes: [{ id: 's7', name: 'M', priceDelta: 0 }, { id: 's8', name: 'L', priceDelta: 0.5 }], modifiers: ['m_5', 'm_6', 'm_7', 'm_8'], stock: 30, isActive: true, type: 'PRODUCT' },
    { id: 'i_5', sku: '1005', categoryId: 'cat_2', name: { en: 'Green Tea', ar: 'شاي أخضر' }, basePrice: 2.25, costPrice: 0.5, image: 'https://placehold.co/300', sizes: [{ id: 's9', name: 'S', priceDelta: 0 }, { id: 's10', name: 'M', priceDelta: 0.5 }], modifiers: ['m_5', 'm_6', 'm_7', 'm_8'], stock: 60, isActive: true, type: 'PRODUCT' },
    { id: 'i_6', sku: '1006', categoryId: 'cat_5', name: { en: 'Cheesecake', ar: 'تشيز كيك' }, basePrice: 4.5, costPrice: 1.8, image: 'https://placehold.co/300', sizes: [{ id: 's11', name: 'Slice', priceDelta: 0 }], modifiers: [], stock: 12, isActive: true, type: 'PRODUCT' },
    { id: 'i_7', sku: '1007', categoryId: 'cat_5', name: { en: 'Chocolate Muffin', ar: 'مافن شوكولاتة' }, basePrice: 3.25, costPrice: 1.1, image: 'https://placehold.co/300', sizes: [{ id: 's12', name: 'M', priceDelta: 0 }], modifiers: [], stock: 15, isActive: true, type: 'PRODUCT' },
    { id: 'i_8', sku: '1008', categoryId: 'cat_1', name: { en: 'Cappuccino', ar: 'كابتشينو' }, basePrice: 3.75, costPrice: 1.3, image: 'https://placehold.co/300', sizes: [{ id: 's13', name: 'S', priceDelta: 0 }, { id: 's14', name: 'M', priceDelta: 0.75 }], modifiers: ['m_1', 'm_2', 'm_5', 'm_6', 'm_12', 'm_13'], stock: 35, isActive: true, type: 'PRODUCT' },
    { id: 'raw_1', sku: 'R001', categoryId: 'cat_6', name: { en: 'White Sugar', ar: 'سكر أبيض' }, basePrice: 0, costPrice: 0.5, image: 'https://placehold.co/300', sizes: [], modifiers: [], stock: 100, isActive: true, type: 'RAW' },
    { id: 'raw_2', sku: 'R002', categoryId: 'cat_6', name: { en: 'Fresh Milk', ar: 'حليب طازج' }, basePrice: 0, costPrice: 1.1, image: 'https://placehold.co/300', sizes: [], modifiers: [], stock: 50, isActive: true, type: 'RAW' },
  ];
}

export function getDefaultUsers() {
  return [
    { id: 'u_1', name: 'Cashier Account', pin: '1234', role: 'Cashier', isActive: true },
    { id: 'u_3', name: 'Admin Manager', username: 'admin', password: 'admin', pin: '0000', role: 'Admin', isActive: true },
    { id: 'u_4', name: 'System Owner', username: 'owner', password: 'owner', pin: '9999', role: 'admin', isActive: true, recoveryCode: 'BREW-MASTER-9999-RECOVERY' },
  ];
}

export function getTranslations() {
  return {
    en: {
      dashboard: "Live Dashboard", pos: "POS", shifts: "Shifts", sales: "Sales", inventory: "Inventory",
      purchases: "Purchases", expenses: "Expenses", treasury: "Treasury", staff: "Staff",
      reports: "Reports", customers: "Customers", logs: "Audit Logs", settings: "Settings", branches: "Branches", transfers: "Transfers",
      tables: "Tables", reservations: "Reservations",
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
      tables: "الطاولات", reservations: "الحجوزات",
      statements: "الكشوفات", logout: "تسجيل الخروج", search: "بحث...",
      currentOrder: "الطلب الحالي", dineIn: "داخل المحل", delivery: "توصيل",
      subtotal: "المجموع الجزئي", vat: "ضريبة القيمة المضافة", total: "الإجمالي", cash: "نقدي", card: "بطاقة",
      selectSize: "اختر الحجم", itemNote: "ملاحظة الطلب", notePlaceholder: "أضف تعليمات خاصة...",
      addBasket: "إضافة للسلة", PAID: "مدفوع", PARTIALLY_PAID: "مدفوع جزئياً",
      UNPAID: "غير مدفوع", VOIDED: "ملغي",
    }
  };
}

export const appCurrency = 'EGP';

