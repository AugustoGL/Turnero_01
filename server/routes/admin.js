const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const store = require('../store'); // Importamos el objeto completo para manejar fallbacks seguros

// Desestructuración segura con fallbacks por si alguna función varía de nombre en tu store
const listBookings = store.listBookings || (() => store.bookings || []);
const updateBooking = store.updateBooking || store.modifyBooking;
const createBooking = store.createBooking || store.addBooking;
const addWeeklyBlock = store.addWeeklyBlock;
const listWeeklyBlocks = store.listWeeklyBlocks || (() => store.weeklyBlocks || []);
const deleteWeeklyBlock = store.deleteWeeklyBlock;
const addException = store.addException;
const listExceptions = store.listExceptions || (() => store.exceptions || []);
const deleteException = store.deleteException;
const getSettings = store.getSettings || (() => store.settings || {});
const updateSettings = store.updateSettings;

// Protegemos todas las rutas del panel administrativo de forma global
router.use(requireAuth);

// ---------------- TURNOS ----------------

// 1. Ver todos los turnos según rango de fechas
router.get('/bookings', (req, res) => {
  const { from, to } = req.query; // Espera 'YYYY-MM-DD'
  try {
    const bookings = typeof listBookings === 'function' ? listBookings({ from, to }) : listBookings;
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Aceptar/Confirmar reservas pendientes
router.patch('/bookings/:id/confirm', (req, res) => {
  const { id } = req.params;
  try {
    if (!updateBooking) throw new Error("Función updateBooking no definida en el store.");
    const updated = updateBooking(id, { status: 'confirmada' });
    if (!updated) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregá esta ruta en admin.js, después del router.patch('/bookings/:id/confirm'):

router.post('/bookings/:id/cancel', (req, res) => {
  const { id } = req.params;
  try {
    if (!updateBooking) throw new Error("Función updateBooking no definida en el store.");
    const updated = updateBooking(id, { status: 'cancelada' });
    if (!updated) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookings/:id/cancel', (req, res) => {
  const { id } = req.params;
  try {
    if (!updateBooking) throw new Error("Función updateBooking no definida en el store.");
    const updated = updateBooking(id, { status: 'cancelada' });
    if (!updated) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ success: true, booking: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Crear reservas de forma manual (Admin)
router.post('/bookings', (req, res) => {
  try {
    if (!createBooking) throw new Error("Función createBooking no definida en el store.");
    const booking = createBooking({
      ...req.body,
      status: 'confirmada', // El admin reserva directo de forma confirmada
      source: 'manual'
    });
    res.status(201).json({ success: true, booking });
  } catch (err) {
    if (err.code === 'SLOT_TAKEN') {
      return res.status(400).json({ error: 'Esta hora ya está ocupada' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ---------------- BLOQUEOS ----------------

// 4. Bloquear fechas por horarios fijos (Arreglado para guardar por hora individual)
router.post('/blocks/weekly', (req, res) => {
  const { day_of_week, hour_start, hour_end, label } = req.body;
  try {
    if (!addWeeklyBlock) throw new Error("Función addWeeklyBlock no definida en el store.");

    const start = parseInt(hour_start, 10);
    const end = parseInt(hour_end, 10);

    // Desglosamos el rango en bloques individuales de 1 hora para que getDayAvailability los lea bien
for (let h = start; h < end; h++) {
  addWeeklyBlock(parseInt(day_of_week, 10), h, h + 1, label || 'Fijo Semanal');
}
    res.json({ success: true, message: 'Horario semanal fijo bloqueado por horas individuales' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Bloquear horario por evento puntual
// Reemplazá el router.post('/blocks/exception') existente por este:

router.post('/blocks/exception', (req, res) => {
  const { date, hour_start, hour_end, label } = req.body;
  try {
    if (!addException) throw new Error("Función addException no definida en el store.");

    const start = parseInt(hour_start, 10);
    const end = parseInt(hour_end, 10);

    // Guardamos una entrada por cada hora del rango, igual que los weekly blocks
    for (let h = start; h < end; h++) {
      addException(date, h, 'blocked', label || 'Evento puntual');
    }

    res.json({ success: true, message: 'Fecha bloqueada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Ver horarios bloqueados por uno mismo (Ambas listas)
router.get('/blocks', (req, res) => {
  try {
    const weekly = typeof listWeeklyBlocks === 'function' ? listWeeklyBlocks() : listWeeklyBlocks;
    const exceptions = typeof listExceptions === 'function' ? listExceptions() : listExceptions;
    res.json({ weekly, exceptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar bloqueos si el administrador quiere liberar las horas
router.delete('/blocks/weekly/:id', (req, res) => {
  try {
    if (!deleteWeeklyBlock) throw new Error("Función deleteWeeklyBlock no definida.");
    deleteWeeklyBlock(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/blocks/exception/:id', (req, res) => {
  try {
    if (!deleteException) throw new Error("Función deleteException no definida.");
    deleteException(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- PARÁMETROS DEL SISTEMA ----------------

// 7. Configurar y ver parámetros (Nombre, WhatsApp, Precio, Seña)
router.get('/settings', (req, res) => {
  try {
    const settings = typeof getSettings === 'function' ? getSettings() : getSettings;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', (req, res) => {
  try {
    if (!updateSettings) throw new Error("Función updateSettings no definida.");
    const updated = updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;