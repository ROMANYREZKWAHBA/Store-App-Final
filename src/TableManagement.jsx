// ============================================================
// TABLE MANAGEMENT & RESERVATIONS
// ============================================================
// Fully standalone component — zero imports from App.jsx.
// Safe for Vite/Rollup tree-shaking and chunk evaluation order.
// ============================================================
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// ─── Internal helpers (no external deps) ────────────────────────────────────

function safeLocalGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeLocalSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function fmtTime(dateStr) {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function elapsed(dateStr) {
  if (!dateStr) return '';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Default seed data ────────────────────────────────────────────────────────

function getDefaultTables() {
  return [
    { id: 'tbl_1', number: 1, section: 'Main Hall', capacity: 2, status: 'available', currentOrderId: null, linkedOrderTotal: 0, guestCount: 0, seatedAt: null, posX: 0, posY: 0 },
    { id: 'tbl_2', number: 2, section: 'Main Hall', capacity: 4, status: 'available', currentOrderId: null, linkedOrderTotal: 0, guestCount: 0, seatedAt: null, posX: 1, posY: 0 },
    { id: 'tbl_3', number: 3, section: 'Main Hall', capacity: 4, status: 'available', currentOrderId: null, linkedOrderTotal: 0, guestCount: 0, seatedAt: null, posX: 2, posY: 0 },
    { id: 'tbl_4', number: 4, section: 'Main Hall', capacity: 6, status: 'available', currentOrderId: null, linkedOrderTotal: 0, guestCount: 0, seatedAt: null, posX: 3, posY: 0 },
    { id: 'tbl_5', number: 5, section: 'Terrace',   capacity: 2, status: 'available', currentOrderId: null, linkedOrderTotal: 0, guestCount: 0, seatedAt: null, posX: 0, posY: 1 },
    { id: 'tbl_6', number: 6, section: 'Terrace',   capacity: 4, status: 'available', currentOrderId: null, linkedOrderTotal: 0, guestCount: 0, seatedAt: null, posX: 1, posY: 1 },
    { id: 'tbl_7', number: 7, section: 'VIP',       capacity: 8, status: 'available', currentOrderId: null, linkedOrderTotal: 0, guestCount: 0, seatedAt: null, posX: 0, posY: 2 },
    { id: 'tbl_8', number: 8, section: 'VIP',       capacity: 6, status: 'available', currentOrderId: null, linkedOrderTotal: 0, guestCount: 0, seatedAt: null, posX: 1, posY: 2 },
  ];
}

// ─── Translation map (AR / EN) ───────────────────────────────────────────────

const TM = {
  en: {
    title: 'Table Management',
    reservations: 'Reservations',
    floorPlan: 'Floor Plan',
    addTable: 'Add Table',
    editTable: 'Edit Table',
    deleteTable: 'Delete Table',
    addReservation: 'New Reservation',
    tableNo: 'Table #',
    section: 'Section',
    capacity: 'Capacity',
    status: 'Status',
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    cleaning: 'Cleaning',
    seatGuests: 'Seat Guests',
    clearTable: 'Clear Table',
    markCleaning: 'Mark Cleaning',
    guests: 'Guests',
    seatedAt: 'Seated At',
    elapsed: 'Elapsed',
    orderTotal: 'Order Total',
    linkOrder: 'Link POS Order',
    noOrder: 'No Linked Order',
    guestName: 'Guest Name',
    phone: 'Phone',
    partySize: 'Party Size',
    dateTime: 'Date & Time',
    notes: 'Notes',
    assignTable: 'Assign Table',
    resStatus: 'Reservation Status',
    pending: 'Pending',
    confirmed: 'Confirmed',
    seated: 'Seated',
    completed: 'Completed',
    noShow: 'No-Show',
    today: "Today's",
    upcoming: 'Upcoming',
    past: 'Past',
    all: 'All',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    arrive: 'Arrived',
    complete: 'Complete',
    noTables: 'No tables found',
    noReservations: 'No reservations',
    filterAll: 'All',
    sections: 'Sections',
    mainHall: 'Main Hall',
    terrace: 'Terrace',
    vip: 'VIP',
    minutes: 'min',
    deleteConfirm: 'Are you sure you want to delete this table?',
    cantDeleteOccupied: 'Cannot delete an occupied table.',
    tableNumber: 'Table Number',
    seatCount: 'Guest Count',
  },
  ar: {
    title: 'إدارة الطاولات',
    reservations: 'الحجوزات',
    floorPlan: 'خريطة القاعة',
    addTable: 'إضافة طاولة',
    editTable: 'تعديل الطاولة',
    deleteTable: 'حذف الطاولة',
    addReservation: 'حجز جديد',
    tableNo: 'طاولة #',
    section: 'القسم',
    capacity: 'السعة',
    status: 'الحالة',
    available: 'متاحة',
    occupied: 'مشغولة',
    reserved: 'محجوزة',
    cleaning: 'قيد التنظيف',
    seatGuests: 'إجلاس الضيوف',
    clearTable: 'إخلاء الطاولة',
    markCleaning: 'وضع علامة تنظيف',
    guests: 'ضيف',
    seatedAt: 'وقت الجلوس',
    elapsed: 'الوقت المنقضي',
    orderTotal: 'إجمالي الطلب',
    linkOrder: 'ربط طلب POS',
    noOrder: 'لا يوجد طلب مرتبط',
    guestName: 'اسم الضيف',
    phone: 'الهاتف',
    partySize: 'عدد الأشخاص',
    dateTime: 'التاريخ والوقت',
    notes: 'ملاحظات',
    assignTable: 'تعيين طاولة',
    resStatus: 'حالة الحجز',
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    seated: 'مُجلَّس',
    completed: 'مكتمل',
    noShow: 'لم يحضر',
    today: 'اليوم',
    upcoming: 'القادمة',
    past: 'السابقة',
    all: 'الكل',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    arrive: 'وصل',
    complete: 'إتمام',
    noTables: 'لا توجد طاولات',
    noReservations: 'لا توجد حجوزات',
    filterAll: 'الكل',
    sections: 'الأقسام',
    mainHall: 'القاعة الرئيسية',
    terrace: 'التراس',
    vip: 'VIP',
    minutes: 'دقيقة',
    deleteConfirm: 'هل تريد حذف هذه الطاولة؟',
    cantDeleteOccupied: 'لا يمكن حذف طاولة مشغولة.',
    tableNumber: 'رقم الطاولة',
    seatCount: 'عدد الضيوف',
  }
};

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS_CFG = {
  available: { color: '#16a34a', bg: 'rgba(22,163,74,0.12)', border: '#16a34a', dot: '#22c55e' },
  occupied:  { color: '#dc2626', bg: 'rgba(220,38,38,0.12)',  border: '#dc2626', dot: '#ef4444' },
  reserved:  { color: '#d97706', bg: 'rgba(217,119,6,0.12)',  border: '#d97706', dot: '#f59e0b' },
  cleaning:  { color: '#2563eb', bg: 'rgba(37,99,235,0.12)',  border: '#2563eb', dot: '#3b82f6' },
};

const RES_STATUS_CFG = {
  pending:   { color: '#d97706', bg: 'rgba(217,119,6,0.15)',   label: { en: 'Pending', ar: 'انتظار' } },
  confirmed: { color: '#2563eb', bg: 'rgba(37,99,235,0.15)',   label: { en: 'Confirmed', ar: 'مؤكد' } },
  seated:    { color: '#16a34a', bg: 'rgba(22,163,74,0.15)',   label: { en: 'Seated', ar: 'مُجلَّس' } },
  completed: { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', label: { en: 'Completed', ar: 'مكتمل' } },
  no_show:   { color: '#dc2626', bg: 'rgba(220,38,38,0.15)',   label: { en: 'No-Show', ar: 'لم يحضر' } },
};

const SECTIONS = ['Main Hall', 'Terrace', 'VIP', 'Bar', 'Garden'];

// ─── TABLE CARD ───────────────────────────────────────────────────────────────

function TableCard({ table, t, isRtl, onAction, linkedOrder }) {
  const cfg = STATUS_CFG[table.status] || STATUS_CFG.available;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (table.status !== 'occupied') return;
    const iv = setInterval(() => setTick(x => x + 1), 30000);
    return () => clearInterval(iv);
  }, [table.status]);

  const orderTotal = linkedOrder
    ? linkedOrder.total
    : (table.linkedOrderTotal || 0);

  return (
    <div
      style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        borderRadius: 16,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        position: 'relative',
        minWidth: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.border}44`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Status dot */}
      <div style={{ position: 'absolute', top: 12, [isRtl ? 'left' : 'right']: 12, width: 10, height: 10, borderRadius: '50%', background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}` }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: cfg.color + '22', border: `1.5px solid ${cfg.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>🪑</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>{t.tableNo}{table.number}</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{table.section} · {table.capacity} {t.guests}</p>
        </div>
      </div>

      {/* Status badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: cfg.color + '20', border: `1px solid ${cfg.color}44`, width: 'fit-content' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t[table.status] || table.status}
        </span>
      </div>

      {/* Occupied details */}
      {table.status === 'occupied' && (
        <div style={{ background: 'var(--bg-deep)', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t.guests}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{table.guestCount || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t.elapsed}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>{elapsed(table.seatedAt)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t.orderTotal}</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#22c55e' }}>
              {orderTotal > 0 ? orderTotal.toFixed(2) : t.noOrder}
            </span>
          </div>
          {linkedOrder && (
            <div style={{ marginTop: 2, padding: '3px 6px', borderRadius: 6, background: '#1e40af22', border: '1px solid #3b82f644' }}>
              <span style={{ fontSize: 10, color: '#60a5fa', fontWeight: 700 }}>🔗 POS #{linkedOrder.orderNumber || linkedOrder.id?.slice(0, 6)}</span>
            </div>
          )}
        </div>
      )}

      {/* Reserved details */}
      {table.status === 'reserved' && table.reservationId && (
        <div style={{ background: 'var(--bg-deep)', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>🗓 {t.reserved}</p>
          {table.reservationGuestName && (
            <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{table.reservationGuestName}</p>
          )}
          {table.reservationTime && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{fmtDateTime(table.reservationTime)}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
        {table.status === 'available' && (
          <ActionBtn onClick={() => onAction('seat', table)} color="#16a34a" label={t.seatGuests} icon="👤" />
        )}
        {table.status === 'occupied' && (
          <>
            <ActionBtn onClick={() => onAction('clear', table)} color="#dc2626" label={t.clearTable} icon="✓" />
            <ActionBtn onClick={() => onAction('linkOrder', table)} color="#2563eb" label={t.linkOrder} icon="🔗" small />
          </>
        )}
        {table.status === 'reserved' && (
          <ActionBtn onClick={() => onAction('arrive', table)} color="#16a34a" label={t.arrive} icon="✓" />
        )}
        {table.status === 'cleaning' && (
          <ActionBtn onClick={() => onAction('makeAvailable', table)} color="#16a34a" label={t.available} icon="✓" />
        )}
        {table.status !== 'occupied' && (
          <ActionBtn onClick={() => onAction('edit', table)} color="#64748b" label="✏️" icon="" small />
        )}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, color, label, icon, small }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: small ? '4px 8px' : '6px 12px',
        borderRadius: 8,
        border: `1px solid ${color}55`,
        background: hover ? color : color + '18',
        color: hover ? '#fff' : color,
        fontWeight: 700,
        fontSize: small ? 11 : 12,
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

// ─── SEAT MODAL ───────────────────────────────────────────────────────────────

function SeatModal({ table, onClose, onConfirm, t, isRtl }) {
  const [guestCount, setGuestCount] = useState(table.capacity > 2 ? 2 : 1);
  return (
    <Modal onClose={onClose} title={`${t.seatGuests} — ${t.tableNo}${table.number}`} isRtl={isRtl}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>{t.seatCount}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <button onClick={() => setGuestCount(g => Math.max(1, g - 1))} style={qtyBtn}>－</button>
            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', minWidth: 40, textAlign: 'center' }}>{guestCount}</span>
            <button onClick={() => setGuestCount(g => Math.min(table.capacity, g + 1))} style={qtyBtn}>＋</button>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Max: {table.capacity}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={cancelBtnStyle}>{t.cancel}</button>
          <button onClick={() => onConfirm(guestCount)} style={primaryBtnStyle}>{t.seatGuests}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── TABLE EDIT MODAL ─────────────────────────────────────────────────────────

function TableEditModal({ table, onClose, onSave, t, isRtl, allTables }) {
  const isNew = !table?.id;
  const nextNum = isNew ? (Math.max(0, ...allTables.map(tb => tb.number)) + 1) : table.number;
  const [form, setForm] = useState({
    number: table?.number ?? nextNum,
    section: table?.section ?? 'Main Hall',
    capacity: table?.capacity ?? 4,
  });

  return (
    <Modal onClose={onClose} title={isNew ? t.addTable : t.editTable} isRtl={isRtl}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>{t.tableNumber}</label>
          <input type="number" value={form.number} min={1} onChange={e => setForm(f => ({ ...f, number: +e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t.section}</label>
          <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} style={inputStyle}>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>{t.capacity}</label>
          <input type="number" value={form.capacity} min={1} max={20} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={cancelBtnStyle}>{t.cancel}</button>
          <button onClick={() => onSave({ ...table, ...form })} style={primaryBtnStyle}>{t.save}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── LINK ORDER MODAL ─────────────────────────────────────────────────────────

function LinkOrderModal({ table, orders, onClose, onLink, t, isRtl }) {
  const [search, setSearch] = useState('');
  const eligible = useMemo(() =>
    (orders || []).filter(o =>
      (o.status !== 'VOIDED' && o.status !== 'REFUNDED') &&
      (!search || o.orderNumber?.includes(search) || o.id?.includes(search))
    ).slice(0, 20),
    [orders, search]
  );

  return (
    <Modal onClose={onClose} title={`${t.linkOrder} — ${t.tableNo}${table.number}`} isRtl={isRtl}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Search order #..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
          autoFocus
        />
        <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {eligible.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>No matching orders</p>
          )}
          {eligible.map(o => (
            <button
              key={o.id}
              onClick={() => onLink(o)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg-deep)', border: '1px solid var(--border-color)',
                cursor: 'pointer', transition: 'border-color 0.15s',
                textAlign: isRtl ? 'right' : 'left',
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>#{o.orderNumber || o.id?.slice(0, 8)}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{fmtDateTime(o.timestamp)}</p>
              </div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#22c55e' }}>{Number(o.total).toFixed(2)}</div>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={cancelBtnStyle}>{t.cancel}</button>
      </div>
    </Modal>
  );
}

// ─── RESERVATION FORM MODAL ───────────────────────────────────────────────────

function ReservationFormModal({ reservation, tables, onClose, onSave, t, isRtl }) {
  const isNew = !reservation?.id;
  const now = new Date();
  const defaultDT = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

  const [form, setForm] = useState({
    guestName: reservation?.guestName ?? '',
    phone: reservation?.phone ?? '',
    partySize: reservation?.partySize ?? 2,
    tableId: reservation?.tableId ?? '',
    dateTime: reservation?.dateTime ? new Date(reservation.dateTime).toISOString().slice(0, 16) : defaultDT,
    notes: reservation?.notes ?? '',
    status: reservation?.status ?? 'pending',
  });

  const availTables = tables.filter(tb => tb.status === 'available' || tb.status === 'reserved' || tb.id === form.tableId);

  return (
    <Modal onClose={onClose} title={isNew ? t.addReservation : `${t.addReservation} #${reservation.id?.slice(-4)}`} isRtl={isRtl} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>{t.guestName} *</label>
            <input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} style={inputStyle} placeholder="Ahmed Hassan" />
          </div>
          <div>
            <label style={labelStyle}>{t.phone}</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} placeholder="010..." />
          </div>
          <div>
            <label style={labelStyle}>{t.partySize}</label>
            <input type="number" min={1} max={50} value={form.partySize} onChange={e => setForm(f => ({ ...f, partySize: +e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.assignTable}</label>
            <select value={form.tableId} onChange={e => setForm(f => ({ ...f, tableId: e.target.value }))} style={inputStyle}>
              <option value="">— {t.available} —</option>
              {availTables.map(tb => (
                <option key={tb.id} value={tb.id}>{t.tableNo}{tb.number} · {tb.section} ({tb.capacity})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t.dateTime} *</label>
            <input type="datetime-local" value={form.dateTime} onChange={e => setForm(f => ({ ...f, dateTime: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.resStatus}</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
              {Object.entries(RES_STATUS_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label.en}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>{t.notes}</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} placeholder="Anniversary, birthday, allergies..." />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={cancelBtnStyle}>{t.cancel}</button>
          <button
            onClick={() => {
              if (!form.guestName.trim()) { alert('Guest name required'); return; }
              if (!form.dateTime) { alert('Date & time required'); return; }
              onSave({ ...reservation, ...form, id: reservation?.id || uid('res') });
            }}
            style={primaryBtnStyle}
          >{t.save}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── RESERVATION CARD ─────────────────────────────────────────────────────────

function ReservationCard({ res, tables, t, isRtl, onEdit, onChangeStatus }) {
  const cfg = RES_STATUS_CFG[res.status] || RES_STATUS_CFG.pending;
  const tbl = tables.find(tb => tb.id === res.tableId);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1.5px solid ${cfg.color}44`,
      borderLeft: isRtl ? undefined : `4px solid ${cfg.color}`,
      borderRight: isRtl ? `4px solid ${cfg.color}` : undefined,
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      {/* Avatar */}
      <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.color + '22', border: `1.5px solid ${cfg.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        👤
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: 'var(--text-primary)' }}>{res.guestName}</p>
          <span style={{ padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
            {cfg.label[isRtl ? 'ar' : 'en']}
          </span>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          📅 {fmtDateTime(res.dateTime)} · 👥 {res.partySize}
          {tbl ? ` · 🪑 ${t.tableNo}${tbl.number}` : ''}
          {res.phone ? ` · 📞 ${res.phone}` : ''}
        </p>
        {res.notes && <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{res.notes}"</p>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {res.status === 'pending' && (
          <ActionBtn onClick={() => onChangeStatus(res.id, 'confirmed')} color="#2563eb" label={t.confirm} icon="✓" small />
        )}
        {res.status === 'confirmed' && (
          <ActionBtn onClick={() => onChangeStatus(res.id, 'seated')} color="#16a34a" label={t.arrive} icon="✓" small />
        )}
        {(res.status === 'seated' || res.status === 'confirmed') && (
          <ActionBtn onClick={() => onChangeStatus(res.id, 'completed')} color="#6b7280" label={t.complete} icon="✓" small />
        )}
        {(res.status === 'pending' || res.status === 'confirmed') && (
          <ActionBtn onClick={() => onChangeStatus(res.id, 'no_show')} color="#dc2626" label={t.noShow} icon="✕" small />
        )}
        <ActionBtn onClick={() => onEdit(res)} color="#64748b" label="✏️" icon="" small />
      </div>
    </div>
  );
}

// ─── GENERIC MODAL WRAPPER ────────────────────────────────────────────────────

function Modal({ children, onClose, title, isRtl, wide }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 20,
          padding: '28px 28px 24px',
          width: '100%',
          maxWidth: wide ? 680 : 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-deep)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box' };
const primaryBtnStyle = { flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none', background: '#0066FF', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' };
const cancelBtnStyle = { padding: '12px 20px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-deep)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' };

// ─── STATS BAR ────────────────────────────────────────────────────────────────

function StatsBar({ tables, reservations, t, isRtl }) {
  const counts = useMemo(() => ({
    available: tables.filter(tb => tb.status === 'available').length,
    occupied:  tables.filter(tb => tb.status === 'occupied').length,
    reserved:  tables.filter(tb => tb.status === 'reserved').length,
    cleaning:  tables.filter(tb => tb.status === 'cleaning').length,
    totalRevenue: tables.filter(tb => tb.status === 'occupied').reduce((s, tb) => s + (tb.linkedOrderTotal || 0), 0),
    todayRes: reservations.filter(r => {
      const d = new Date(r.dateTime);
      const n = new Date();
      return d.toDateString() === n.toDateString();
    }).length,
  }), [tables, reservations]);

  const stats = [
    { label: t.available, value: counts.available, color: '#16a34a', icon: '🟢' },
    { label: t.occupied,  value: counts.occupied,  color: '#dc2626', icon: '🔴' },
    { label: t.reserved,  value: counts.reserved,  color: '#d97706', icon: '🟡' },
    { label: t.cleaning,  value: counts.cleaning,  color: '#2563eb', icon: '🔵' },
    { label: isRtl ? 'حجوزات اليوم' : "Today's Res.", value: counts.todayRes, color: '#8b5cf6', icon: '📅' },
    { label: isRtl ? 'إيرادات الطاولات' : 'Live Revenue', value: counts.totalRevenue.toFixed(2), color: '#22c55e', icon: '💰' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: 'var(--bg-card)', border: `1.5px solid ${s.color}33`, borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{s.icon} {s.label}</p>
          <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function TableManagementScreen({ language = 'ar', orders = [], currentUser, pushNotification }) {
  const isRtl = language === 'ar';
  const t = TM[language] || TM.en;

  // ── State ──────────────────────────────────────────────────────────────────
  const [tables, setTables] = useState(() => safeLocalGet('pos_tables', getDefaultTables()));
  const [reservations, setReservations] = useState(() => safeLocalGet('pos_reservations', []));
  const [view, setView] = useState('floor');            // 'floor' | 'reservations'
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [resFilter, setResFilter] = useState('upcoming'); // 'all' | 'today' | 'upcoming' | 'past'
  const [modal, setModal] = useState(null);             // { type, data }
  const [tick, setTick] = useState(0);

  // Refresh elapsed times every minute
  useEffect(() => {
    const iv = setInterval(() => setTick(x => x + 1), 60000);
    return () => clearInterval(iv);
  }, []);

  // ── Persistence ───────────────────────────────────────────────────────────
  useEffect(() => { safeLocalSet('pos_tables', tables); }, [tables]);
  useEffect(() => { safeLocalSet('pos_reservations', reservations); }, [reservations]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const sections = useMemo(() => ['all', ...Array.from(new Set(tables.map(tb => tb.section)))], [tables]);

  const filteredTables = useMemo(() => tables.filter(tb => {
    const matchStatus  = filterStatus  === 'all' || tb.status  === filterStatus;
    const matchSection = filterSection === 'all' || tb.section === filterSection;
    return matchStatus && matchSection;
  }), [tables, filterStatus, filterSection]);

  const filteredReservations = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    return reservations.filter(r => {
      const d = new Date(r.dateTime);
      if (resFilter === 'today')    return d.toDateString() === todayStr;
      if (resFilter === 'upcoming') return d >= now && r.status !== 'completed' && r.status !== 'no_show';
      if (resFilter === 'past')     return d < now || r.status === 'completed' || r.status === 'no_show';
      return true; // 'all'
    }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }, [reservations, resFilter, tick]);

  const linkedOrdersMap = useMemo(() => {
    const m = {};
    tables.forEach(tb => {
      if (tb.currentOrderId) {
        const o = orders.find(ord => ord.id === tb.currentOrderId);
        if (o) m[tb.id] = o;
      }
    });
    return m;
  }, [tables, orders]);

  // ── Table Mutation Helpers ─────────────────────────────────────────────────
  const updateTable = useCallback((id, patch) => {
    setTables(prev => prev.map(tb => tb.id === id ? { ...tb, ...patch } : tb));
  }, []);

  const handleAction = useCallback((action, table) => {
    if (action === 'seat') {
      setModal({ type: 'seat', data: table });
    } else if (action === 'clear') {
      updateTable(table.id, { status: 'cleaning', guestCount: 0, seatedAt: null, currentOrderId: null, linkedOrderTotal: 0, reservationId: null, reservationGuestName: null, reservationTime: null });
      pushNotification?.(isRtl ? `تم إخلاء الطاولة #${table.number}` : `Table #${table.number} cleared`, 'success');
    } else if (action === 'makeAvailable') {
      updateTable(table.id, { status: 'available' });
      pushNotification?.(isRtl ? `الطاولة #${table.number} جاهزة` : `Table #${table.number} is ready`, 'success');
    } else if (action === 'linkOrder') {
      setModal({ type: 'linkOrder', data: table });
    } else if (action === 'arrive') {
      // Reservation arrived → seat the table
      updateTable(table.id, { status: 'occupied', seatedAt: new Date().toISOString(), guestCount: table.reservationGuestCount || table.capacity });
      // Update reservation status
      if (table.reservationId) {
        setReservations(prev => prev.map(r => r.id === table.reservationId ? { ...r, status: 'seated' } : r));
      }
      pushNotification?.(isRtl ? `تم إجلاس الضيوف على الطاولة #${table.number}` : `Guests seated at Table #${table.number}`, 'success');
    } else if (action === 'edit') {
      setModal({ type: 'editTable', data: table });
    }
  }, [updateTable, isRtl, pushNotification]);

  // Confirm seat guests
  const handleSeatConfirm = useCallback((guestCount) => {
    const table = modal.data;
    updateTable(table.id, { status: 'occupied', guestCount, seatedAt: new Date().toISOString() });
    setModal(null);
    pushNotification?.(isRtl ? `تم إجلاس ${guestCount} ضيف على الطاولة #${table.number}` : `${guestCount} guests seated at Table #${table.number}`, 'success');
  }, [modal, updateTable, isRtl, pushNotification]);

  // Link POS order
  const handleLinkOrder = useCallback((order) => {
    const table = modal.data;
    updateTable(table.id, { currentOrderId: order.id, linkedOrderTotal: order.total });
    setModal(null);
    pushNotification?.(isRtl ? `تم ربط الطلب بالطاولة #${table.number}` : `Order linked to Table #${table.number}`, 'success');
  }, [modal, updateTable, isRtl, pushNotification]);

  // Save table (add or edit)
  const handleSaveTable = useCallback((tableData) => {
    if (!tableData.id) {
      const newTable = { ...tableData, id: uid('tbl'), status: 'available', currentOrderId: null, linkedOrderTotal: 0, guestCount: 0, seatedAt: null, posX: 0, posY: 0 };
      setTables(prev => [...prev, newTable]);
      pushNotification?.(isRtl ? 'تمت إضافة الطاولة' : 'Table added', 'success');
    } else {
      setTables(prev => prev.map(tb => tb.id === tableData.id ? { ...tb, ...tableData } : tb));
      pushNotification?.(isRtl ? 'تم تحديث الطاولة' : 'Table updated', 'success');
    }
    setModal(null);
  }, [isRtl, pushNotification]);

  // Delete table
  const handleDeleteTable = useCallback((table) => {
    if (table.status === 'occupied') {
      alert(t.cantDeleteOccupied);
      return;
    }
    if (!window.confirm(t.deleteConfirm)) return;
    setTables(prev => prev.filter(tb => tb.id !== table.id));
    setModal(null);
    pushNotification?.(isRtl ? 'تم حذف الطاولة' : 'Table deleted', 'info');
  }, [t, isRtl, pushNotification]);

  // ── Reservation Mutation ──────────────────────────────────────────────────
  const handleSaveReservation = useCallback((res) => {
    const isNew = !reservations.find(r => r.id === res.id);
    if (isNew) {
      const newRes = { ...res, createdAt: new Date().toISOString() };
      setReservations(prev => [...prev, newRes]);
      // If a table is assigned, mark it reserved
      if (res.tableId) {
        updateTable(res.tableId, {
          status: 'reserved',
          reservationId: res.id,
          reservationGuestName: res.guestName,
          reservationTime: res.dateTime,
          reservationGuestCount: res.partySize,
        });
      }
      pushNotification?.(isRtl ? 'تم إنشاء الحجز' : 'Reservation created', 'success');
    } else {
      setReservations(prev => prev.map(r => r.id === res.id ? res : r));
      pushNotification?.(isRtl ? 'تم تحديث الحجز' : 'Reservation updated', 'success');
    }
    setModal(null);
  }, [reservations, updateTable, isRtl, pushNotification]);

  const handleChangeResStatus = useCallback((id, newStatus) => {
    setReservations(prev => prev.map(r => {
      if (r.id !== id) return r;
      // If arriving → seat the linked table
      if (newStatus === 'seated' && r.tableId) {
        updateTable(r.tableId, {
          status: 'occupied',
          seatedAt: new Date().toISOString(),
          guestCount: r.partySize,
          reservationId: r.id,
          reservationGuestName: r.guestName,
        });
      }
      // If completed / no_show → free the table
      if ((newStatus === 'completed' || newStatus === 'no_show') && r.tableId) {
        const tbl = tables.find(tb => tb.id === r.tableId && tb.reservationId === id);
        if (tbl) {
          updateTable(r.tableId, {
            status: newStatus === 'completed' ? 'cleaning' : 'available',
            reservationId: null, reservationGuestName: null, reservationTime: null,
            guestCount: 0, seatedAt: null,
          });
        }
      }
      return { ...r, status: newStatus };
    }));
    pushNotification?.(isRtl ? 'تم تحديث حالة الحجز' : 'Reservation status updated', 'success');
  }, [tables, updateTable, isRtl, pushNotification]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '14px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['floor', '🗺 ' + t.floorPlan], ['reservations', '📅 ' + t.reservations]].map(([k, lbl]) => (
            <button key={k} onClick={() => setView(k)} style={{
              padding: '8px 18px', borderRadius: 10, border: 'none',
              background: view === k ? '#0066FF' : 'var(--bg-deep)',
              color: view === k ? '#fff' : 'var(--text-muted)',
              fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
            }}>{lbl}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {view === 'floor' && (
            <button onClick={() => setModal({ type: 'editTable', data: {} })} style={{ ...primaryBtnStyle, padding: '9px 16px', fontSize: 12, borderRadius: 10 }}>
              + {t.addTable}
            </button>
          )}
          {view === 'reservations' && (
            <button onClick={() => setModal({ type: 'reservation', data: null })} style={{ ...primaryBtnStyle, padding: '9px 16px', fontSize: 12, borderRadius: 10 }}>
              + {t.addReservation}
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Stats bar */}
        <StatsBar tables={tables} reservations={reservations} t={t} isRtl={isRtl} />

        {/* ── FLOOR PLAN VIEW ── */}
        {view === 'floor' && (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['all', 'available', 'occupied', 'reserved', 'cleaning'].map(s => {
                  const cfg = s === 'all' ? null : STATUS_CFG[s];
                  const active = filterStatus === s;
                  return (
                    <button key={s} onClick={() => setFilterStatus(s)} style={{
                      padding: '5px 12px', borderRadius: 99,
                      border: `1.5px solid ${active ? (cfg?.color || '#0066FF') : 'var(--border-color)'}`,
                      background: active ? (cfg?.color || '#0066FF') + '22' : 'var(--bg-card)',
                      color: active ? (cfg?.color || '#0066FF') : 'var(--text-muted)',
                      fontWeight: 700, fontSize: 11, cursor: 'pointer',
                    }}>{s === 'all' ? t.filterAll : t[s]}</button>
                  );
                })}
              </div>
              <div style={{ height: 24, width: 1, background: 'var(--border-color)', margin: '0 4px' }} />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {sections.map(sec => (
                  <button key={sec} onClick={() => setFilterSection(sec)} style={{
                    padding: '5px 12px', borderRadius: 99,
                    border: `1.5px solid ${filterSection === sec ? '#8b5cf6' : 'var(--border-color)'}`,
                    background: filterSection === sec ? '#8b5cf622' : 'var(--bg-card)',
                    color: filterSection === sec ? '#8b5cf6' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  }}>{sec === 'all' ? t.filterAll : sec}</button>
                ))}
              </div>
            </div>

            {/* Table grid */}
            {filteredTables.length === 0 ? (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
                <span style={{ fontSize: 48 }}>🪑</span>
                <p style={{ fontWeight: 700, margin: 0 }}>{t.noTables}</p>
              </div>
            ) : (
              <>
                {/* Group by section */}
                {Array.from(new Set(filteredTables.map(tb => tb.section))).map(sec => (
                  <div key={sec} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 4, height: 20, borderRadius: 2, background: '#8b5cf6' }} />
                      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sec}</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                      {filteredTables.filter(tb => tb.section === sec).map(table => (
                        <TableCard
                          key={table.id}
                          table={table}
                          t={t}
                          isRtl={isRtl}
                          onAction={handleAction}
                          linkedOrder={linkedOrdersMap[table.id]}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ── RESERVATIONS VIEW ── */}
        {view === 'reservations' && (
          <>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 18, flexWrap: 'wrap' }}>
              {[['upcoming', t.upcoming], ['today', t.today], ['past', t.past], ['all', t.all]].map(([k, lbl]) => (
                <button key={k} onClick={() => setResFilter(k)} style={{
                  padding: '7px 16px', borderRadius: 10, border: 'none',
                  background: resFilter === k ? '#0066FF' : 'var(--bg-card)',
                  color: resFilter === k ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                  border: resFilter === k ? 'none' : '1.5px solid var(--border-color)',
                }}>{lbl}</button>
              ))}
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                {filteredReservations.length} {isRtl ? 'حجز' : 'reservations'}
              </span>
            </div>

            {/* List */}
            {filteredReservations.length === 0 ? (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
                <span style={{ fontSize: 48 }}>📅</span>
                <p style={{ fontWeight: 700, margin: 0 }}>{t.noReservations}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredReservations.map(res => (
                  <ReservationCard
                    key={res.id}
                    res={res}
                    tables={tables}
                    t={t}
                    isRtl={isRtl}
                    onEdit={r => setModal({ type: 'reservation', data: r })}
                    onChangeStatus={handleChangeResStatus}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'seat' && (
        <SeatModal table={modal.data} onClose={() => setModal(null)} onConfirm={handleSeatConfirm} t={t} isRtl={isRtl} />
      )}
      {modal?.type === 'editTable' && (
        <TableEditModal
          table={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSaveTable}
          t={t}
          isRtl={isRtl}
          allTables={tables}
        />
      )}
      {modal?.type === 'linkOrder' && (
        <LinkOrderModal table={modal.data} orders={orders} onClose={() => setModal(null)} onLink={handleLinkOrder} t={t} isRtl={isRtl} />
      )}
      {modal?.type === 'reservation' && (
        <ReservationFormModal
          reservation={modal.data}
          tables={tables}
          onClose={() => setModal(null)}
          onSave={handleSaveReservation}
          t={t}
          isRtl={isRtl}
        />
      )}
    </div>
  );
}
