// ==========================================
// server/index.js - ARCHIVO COMPLETO CORREGIDO
// ==========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const path = require('path');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

// 1. Middlewares globales obligatorios
// Permitimos CORS con credenciales para facilitar llamadas desde el front en desarrollo
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieSession({
  name: 'turnos-session',
  secret: process.env.SESSION_SECRET || 'cambiar-este-secreto',
  maxAge: 24 * 60 * 60 * 1000 // 24 horas
}));

// 2. RUTAS PÚBLICAS (Sin protección / Accesibles por cualquiera)

// Endpoint de sesión libre (Antes del router protegido para evitar el error 401)
app.get('/api/admin/session', (req, res) => {
  if (!req.session || !req.session.userId) {
    // 200 OK informativo para que el navegador no tire alerta roja
    return res.json({ authenticated: false, user: null });
  }
  return res.json({ authenticated: true, user: req.session.user || { id: req.session.userId } });
});

// Endpoint para iniciar sesión (usa la contraseña en .env -> ADMIN_PASSWORD)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Falta la contraseña' });

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
  if (password === ADMIN_PASSWORD) {
    // Marcar sesión como admin
    req.session.userId = 'admin';
    req.session.user = { id: 'admin', name: 'Profe Nati' };
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }

  return res.status(401).json({ error: 'Contraseña incorrecta' });
});

// Endpoint para cerrar sesión
app.post('/api/admin/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// Rutas públicas de la agenda
app.use('/api/public', publicRoutes);


// 3. RUTAS PRIVADAS (Panel de administración - Protegidas por requireAuth interno)
app.use('/api/admin', adminRoutes);


// 4. Servidor de archivos estáticos (Frontend compilado)
app.use(express.static(path.join(__dirname, '..', 'public')));


// 5. Inicialización del Servidor HTTP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`    Página de reservas: http://localhost:${PORT}/`);
  console.log(`    Panel de administración: http://localhost:${PORT}/admin.html\n`);
});


// 6. Middleware global de control de errores (Al final del archivo)
app.use((err, req, res, next) => {
  console.error("❌ Error interno en el servidor:", err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// RUTA TEMPORAL DE DIAGNÓSTICO: Borrala o comentala después
app.get('/api/debug-data', (req, res) => {
  const store = require('./store');
  res.json({
    settings: typeof store.getSettings === 'function' ? store.getSettings() : store.settings,
    bookings: typeof store.listBookings === 'function' ? store.listBookings({}) : store.bookings,
    weeklyBlocks: typeof store.listWeeklyBlocks === 'function' ? store.listWeeklyBlocks() : store.weeklyBlocks,
    exceptions: typeof store.listExceptions === 'function' ? store.listExceptions() : store.exceptions,
    keysDelStore: Object.keys(store) // Para ver qué funciones realmente exporta tu store
  });
});

// 7. Fallback para React Router (SPA)
// Redirige cualquier otra petición que no sea de la API al index.html de React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});