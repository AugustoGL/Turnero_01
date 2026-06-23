import axios from 'axios';

// Enviar cookies en todas las peticiones para que la sesión funcione correctamente
axios.defaults.withCredentials = true;

// ==========================================
// 🌐 SERVICIOS PÚBLICOS (VISTA DEL CLIENTE)
// ==========================================
export const publicService = {
  /**
   * Obtiene la disponibilidad horaria filtrada para una fecha específica.
   * @param {string} date - Fecha en formato 'YYYY-MM-DD'
   * @returns {Promise<Array>} Lista de slots de horas con su estado
   */
  getAvailability: async (date) => {
    const res = await axios.get(`/api/public/availability?date=${date}`);
    return res.data; // Devuelve los slots ya procesados (oculta fijos, deshabilita eventos)
  },

  /**
   * Crea una pre-reserva online y genera los datos del ticket para WhatsApp.
   * @param {Object} bookingData - Datos del alumno y turno ({ date, hour, student_name, subject, etc. })
   * @returns {Promise<Object>} Resultado con el objeto booking y la data para WhatsApp
   */
  createBooking: async (bookingData) => {
    const res = await axios.post('/api/public/bookings', bookingData);
    return res.data; // Devuelve { success: true, booking: {...}, whatsapp: { phone, text } }
  }
};

// ==========================================
// 🔐 SERVICIOS DE ADMINISTRACIÓN (PANEL ADMIN)
// ==========================================
export const adminService = {
  
  // ----- 📅 GESTIÓN DE TURNOS -----

  /**
   * Lista todos los turnos agendados en un rango de fechas.
   * @param {string} from - Fecha inicial 'YYYY-MM-DD'
   * @param {string} to - Fecha final 'YYYY-MM-DD'
   * @returns {Promise<Array>} Lista de reservas encontradas
   */
  getBookings: async (from, to) => {
    const res = await axios.get(`/api/admin/bookings?from=${from}&to=${to}`);
    return res.data;
  },

  /**
   * Confirma una reserva que se encuentra en estado "pendiente_comprobante".
   * @param {number|string} id - ID de la reserva
   * @returns {Promise<Object>} Estado de éxito y la reserva actualizada
   */
  confirmBooking: async (id) => {
    const res = await axios.patch(`/api/admin/bookings/${id}/confirm`);
    return res.data;
  },

  /**
   * Crea una reserva manual directamente desde el panel (Nati). Se guarda confirmada.
   * @param {Object} bookingData - Datos del turno ({ date, hour, student_name, price, etc. })
   * @returns {Promise<Object>} La reserva creada
   */
  createManualBooking: async (bookingData) => {
    const res = await axios.post('/api/admin/bookings', bookingData);
    return res.data;
  },

  // ----- 🚫 GESTIÓN DE BLOQUEOS DE AGENDA -----

  /**
   * Bloquea un rango de horas semanales fijas (Ej: Lunes de 14 a 18).
   * @param {Object} weeklyData - { day_of_week, hour_start, hour_end, label }
   */
  addWeeklyBlock: async (weeklyData) => {
    const res = await axios.post('/api/admin/blocks/weekly', weeklyData);
    return res.data;
  },

  /**
   * Bloquea una hora puntual por un evento específico en una fecha única.
   * @param {Object} exceptionData - { date, hour, label }
   */
  addExceptionBlock: async (exceptionData) => {
    const res = await axios.post('/api/admin/blocks/exception', exceptionData);
    return res.data;
  },

  /**
   * Trae listas de todos los bloqueos activos creados por el administrador.
   * @returns {Promise<Object>} { weekly: [...], exceptions: [...] }
   */
  getAllBlocks: async () => {
    const res = await axios.get('/api/admin/blocks');
    return res.data;
  },

  /** Elimina un bloqueo fijo semanal de la base de datos por su ID */
  deleteWeeklyBlock: async (id) => {
    const res = await axios.delete(`/api/admin/blocks/weekly/${id}`);
    return res.data;
  },

  /** Elimina un bloqueo de evento excepcional por su ID */
  deleteExceptionBlock: async (id) => {
    const res = await axios.delete(`/api/admin/blocks/exception/${id}`);
    return res.data;
  },

  // ----- ⚙️ CONFIGURACIÓN DEL SISTEMA -----

  /** Obtiene los parámetros actuales del negocio (precio, seña, WhatsApp, etc.) */
  getSettings: async () => {
    const res = await axios.get('/api/admin/settings');
    return res.data;
  },

  /** Guarda parches o actualizaciones de la configuración */
  updateSettings: async (settingsData) => {
    const res = await axios.post('/api/admin/settings', settingsData);
    return res.data;
  },

  /** Cierra la sesión del administrador */
  logout: async () => {
    const res = await axios.post('/api/admin/logout');
    return res.data;
  },

  // En adminService, reemplazá getBookings y agregá cancelBooking:

getBookings: async (from, to) => {
  const params = from && to ? `?from=${from}&to=${to}` : '';
  const res = await axios.get(`/api/admin/bookings${params}`);
  return res.data;
},

cancelBooking: async (id) => {
  const res = await axios.post(`/api/admin/bookings/${id}/cancel`);
  return res.data;
},



};

