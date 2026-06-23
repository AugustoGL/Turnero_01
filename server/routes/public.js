const express = require('express');
const router = express.Router();
const store = require('../store');

let getDayAvailability;
try {
  getDayAvailability = require('../availability').getDayAvailability || require('./availability').getDayAvailability;
} catch (e) {
  console.log("⚠️ Usando fallback.");
}

const safeGetDayAvailability = (date) => {
  const weeklyBlocks = typeof store.listWeeklyBlocks === 'function' ? store.listWeeklyBlocks() : (store.weeklyBlocks || []);
  const exceptions = typeof store.listExceptions === 'function' ? store.listExceptions() : (store.exceptions || []);
  const bookings = typeof store.listBookings === 'function' ? store.listBookings({ from: date, to: date }) : (store.bookings || []);
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();

  let baseSlots;
  if (typeof getDayAvailability === 'function') {
    baseSlots = getDayAvailability(date);
  } else {
    baseSlots = Array.from({ length: 24 }, (_, hour) => {
      const isBooked = bookings.some(b => parseInt(b.hour, 10) === hour && b.status !== 'cancelado');
      return { hour, status: isBooked ? 'booked' : 'available', label: '', temporary: false, booking: null };
    });
  }

  const result = [];
  for (const slot of baseSlots) {
    const isWeeklyBlocked = weeklyBlocks.some(b => b.day_of_week === dayOfWeek && b.hour === slot.hour);

    // Bloque semanal → no aparece para el cliente, saltamos el slot
    if (isWeeklyBlocked && slot.status !== 'booked') continue;

    // Excepción puntual → aparece como "No disponible" con su label
    const exception = exceptions.find(e => e.date === date && e.hour === slot.hour && e.status === 'blocked');
    if (exception) {
      result.push({ ...slot, status: 'blocked', label: exception.label || 'No disponible' });
      continue;
    }

    result.push(slot);
  }

  return result;
};

router.get('/availability', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Falta la fecha (date)' });
  try {
    res.json(safeGetDayAvailability(date));
  } catch (err) {
    console.error("Error al calcular disponibilidad:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookings', (req, res) => {
  try {
    const createBooking = store.createBooking || store.addBooking;
    if (!createBooking) throw new Error("No se encontró la función para crear reservas.");
    const booking = createBooking({ ...req.body, status: 'pendiente', source: 'web' });
    res.status(201).json({ success: true, booking });
  } catch (err) {
    if (err.code === 'SLOT_TAKEN') return res.status(400).json({ error: 'Horario ocupado' });
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings', (req, res) => {
  try {
    const getSettings = store.getSettings;
    const settings = typeof getSettings === 'function' ? getSettings() : (store.settings || {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;