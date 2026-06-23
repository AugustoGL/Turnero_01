//store.js


const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'turnos.json');

const DEFAULTS = {
  settings: {
    default_price: '10000',
    default_deposit_percent: '30',  // podés dejarlo o borrarlo
    default_deposit_amount: '3000', // ← agregá esta línea
    business_name: process.env.BUSINESS_NAME || 'Clases particulares',
    mom_whatsapp: process.env.MOM_WHATSAPP || ''
  },
  weekly_blocks: [],
  date_exceptions: [],
  bookings: [],
  _seq: { weekly_blocks: 0, date_exceptions: 0, bookings: 0 }
};

function load() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (!fs.existsSync(DB_PATH)) { save(DEFAULTS); return JSON.parse(JSON.stringify(DEFAULTS)); }
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  data.settings = { ...DEFAULTS.settings, ...data.settings };
  if (!data._seq) data._seq = DEFAULTS._seq;
  return data;
}

function save(data) {
  const tmpPath = DB_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, DB_PATH);
}

function nextId(data, col) {
  data._seq[col] = (data._seq[col] || 0) + 1;
  return data._seq[col];
}

// ---------- Settings ----------
function getSettings() { return load().settings; }
function updateSettings(patch) {
  const data = load();
  data.settings = { ...data.settings, ...patch };
  save(data);
  return data.settings;
}

// ---------- Weekly blocks ----------
function listWeeklyBlocks() { return load().weekly_blocks; }

// Modificado para recibir hour_start y hour_end desde el rango del frontend mobile
function addWeeklyBlock(day_of_week, hour_start, hour_end, label) {
  const data = load();
  const start = Number(hour_start);
  const end = Number(hour_end);

  // Guardamos un registro individual por cada hora dentro del rango seleccionado
  for (let h = start; h < end; h++) {
    // Evitamos duplicar si la Profe ya tenía esa hora bloqueada en el mismo día
    const yaExiste = data.weekly_blocks.some(b => b.day_of_week === Number(day_of_week) && b.hour === h);

    if (!yaExiste) {
      const id = nextId(data, 'weekly_blocks');
      data.weekly_blocks.push({
        id,
        day_of_week: Number(day_of_week),
        hour: h,
        label: label || 'Bloqueado'
      });
    }
  }
    console.log('📦 weekly_blocks antes de guardar:', JSON.stringify(data.weekly_blocks));


  save(data);
  return true;
}

function deleteWeeklyBlock(id) {
  const data = load();
  data.weekly_blocks = data.weekly_blocks.filter(b => b.id !== Number(id));
  save(data);
}

// ---------- Date exceptions ----------
function listExceptions() { return load().date_exceptions; }
function addException(date, hour, status, label) {
  const data = load();
  const id = nextId(data, 'date_exceptions');
  data.date_exceptions.push({ id, date, hour, status, label });
  save(data);
  return id;
}
function deleteException(id) {
  const data = load();
  data.date_exceptions = data.date_exceptions.filter(e => e.id !== Number(id));
  save(data);
}

// ---------- Bookings ----------
// Estados: pendiente_comprobante | confirmada | cancelada
const TEMP_BLOCK_MINUTES = 30;

function isExpired(booking) {
  if (booking.status !== 'pendiente_comprobante') return false;
  const created = new Date(booking.created_at);
  const now = new Date();
  return (now - created) / 60000 > TEMP_BLOCK_MINUTES;
}

function listBookings({ from, to } = {}) {
  const data = load();
  let expired = false;
  for (const b of data.bookings) {
    if (isExpired(b)) { b.status = 'cancelada'; expired = true; }
  }
  if (expired) save(data);
  let rows = data.bookings;
  if (from && to) rows = rows.filter(b => b.date >= from && b.date <= to);
  return [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
}

function getBooking(id) {
  const data = load();
  const b = data.bookings.find(b => b.id === Number(id));
  if (b && isExpired(b)) {
    b.status = 'cancelada';
    save(data);
  }
  return b;
}

function isSlotTaken(data, date, hour) {
  return data.bookings.some(b =>
    b.date === date && b.hour === hour &&
    b.status !== 'cancelada' &&
    !isExpired(b)
  );
}

function createBooking(fields) {
  const data = load();
  if (isSlotTaken(data, fields.date, fields.hour)) {
    const err = new Error('SLOT_TAKEN'); err.code = 'SLOT_TAKEN'; throw err;
  }
  const id = nextId(data, 'bookings');
  const booking = {
    id,
    date: fields.date,
    hour: fields.hour,
    student_name: fields.student_name || '',
    student_lastname: fields.student_lastname || '',
    subject: fields.subject || '',
    level: fields.level || '',
    institution: fields.institution || '',
    extra_info: fields.extra_info || '',
    contact: fields.contact || '',
    price: fields.price,
    deposit_percent: fields.deposit_percent,
    deposit_amount: fields.deposit_amount,
    status: fields.status || 'pendiente_comprobante',
    source: fields.source || 'online',
    notes: fields.notes || '',
    created_at: new Date().toISOString()
  };
  data.bookings.push(booking);
  save(data);
  return booking;
}

function updateBooking(id, patch) {
  const data = load();
  const booking = data.bookings.find(b => b.id === Number(id));
  if (!booking) return null;
  Object.assign(booking, patch);
  save(data);
  return booking;
}

function deleteBookingHard(id) {
  const data = load();
  data.bookings = data.bookings.filter(b => b.id !== Number(id));
  save(data);
}

module.exports = {
  TEMP_BLOCK_MINUTES,
  getSettings, updateSettings,
  listWeeklyBlocks, addWeeklyBlock, deleteWeeklyBlock,
  listExceptions, addException, deleteException,
  listBookings, getBooking, createBooking, updateBooking, deleteBookingHard
};
