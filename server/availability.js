//availability.js

const { listWeeklyBlocks, listExceptions, listBookings } = require("./store");

// Calcula estado de cada hora (0-23) para una fecha dada.
// Incorpora bloques fijos semanales, excepciones puntuales y reservas activas.
// Los pendiente_comprobante expirados ya fueron limpiados por listBookings().
function getDayAvailability(dateStr) {
  const dayOfWeek = new Date(dateStr + "T00:00:00").getDay();
  const weeklyMap = {};
  for (const b of listWeeklyBlocks()) {
    if (b.day_of_week === dayOfWeek)
      weeklyMap[b.hour] = b.label || "No disponible";
  }

  const exceptionMap = {};
  for (const e of listExceptions()) {
    if (e.date === dateStr) exceptionMap[e.hour] = e;
  }

  const bookingMap = {};
  for (const b of listBookings({ from: dateStr, to: dateStr })) {
    if (b.status !== "cancelada") bookingMap[b.hour] = b;
  }

  const result = [];
  for (let hour = 0; hour < 24; hour++) {
    let status = "available";
    let label = "";
    let temporary = false;

    if (weeklyMap[hour] !== undefined) {
      status = "blocked";
      label = weeklyMap[hour];
    }
    if (exceptionMap[hour]) {
      status = exceptionMap[hour].status;
      label =
        exceptionMap[hour].label ||
        (status === "blocked" ? "No disponible" : "");
    }
    if (bookingMap[hour]) {
      if (bookingMap[hour].status === "pendiente_comprobante") {
        status = "reserved_temp";
        temporary = true;
      } else {
        status = "booked";
      }
      label = "";
    }

    result.push({
      hour,
      status,
      label,
      temporary,
      booking: bookingMap[hour] || null,
    });
  }

  return result;
}

// ---------- Recomendaciones inteligentes ----------
// Sugiere turnos disponibles que "llenan huecos" entre clases ya confirmadas,
// o que están adyacentes a clases, para aprovechar mejor el día.
function getRecommendations(slots) {
  const occupiedHours = new Set(
    slots
      .filter(
        (s) =>
          s.status === "booked" ||
          s.status === "blocked" ||
          s.status === "reserved_temp",
      )
      .map((s) => s.hour),
  );

  const scored = slots
    .filter((s) => s.status === "available")
    .map((s) => {
      let score = 0;
      // adyacente directo (puntaje alto)
      if (occupiedHours.has(s.hour - 1)) score += 2;
      if (occupiedHours.has(s.hour + 1)) score += 2;
      // "puente" entre dos clases (máxima prioridad)
      if (occupiedHours.has(s.hour - 1) && occupiedHours.has(s.hour + 1))
        score += 3;
      // a dos horas de distancia (puntaje menor)
      if (occupiedHours.has(s.hour - 2)) score += 1;
      if (occupiedHours.has(s.hour + 2)) score += 1;
      return { ...s, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored;
}

function isSlotBookable(dateStr, hour) {
  const slot = getDayAvailability(dateStr).find((s) => s.hour === hour);
  return slot && slot.status === "available";
}

module.exports = { getDayAvailability, getRecommendations, isSlotBookable };
