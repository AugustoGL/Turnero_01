# Sistema de Reservas de Clases Particulares

Aplicación web local para gestionar reservas de clases, con confirmación manual
por WhatsApp y un panel de administración para la profesora.

---

## Flujo de reserva

1. La profesora le manda el link a un alumno que quiere tomar clases
2. El alumno elige un horario → llena el formulario → el turno queda apartado **30 minutos**
3. La app abre WhatsApp con un mensaje pre-armado con todos los datos → el alumno lo manda y adjunta el comprobante de transferencia
4. La profesora entra al panel, ve el turno pendiente y lo **confirma** (o rechaza)
5. Si pasan 30 minutos sin confirmación, el turno se libera automáticamente

---

## Instalación

### Requisitos
- [Node.js](https://nodejs.org/) versión 18 o superior

### Pasos

```bash
# 1. Copiar el archivo de configuración
cp .env.example .env

# 2. Editar .env con tus datos (ver sección Configuración abajo)
# En Windows: abrilo con el Bloc de notas
notepad .env

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor
npm start
```

Una vez iniciado:
- **Página de alumnos:** http://localhost:3000
- **Panel de la profesora:** http://localhost:3000/admin.html

---

## Configuración (.env)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `ADMIN_PASSWORD` | Contraseña para entrar al panel | `miClave123` |
| `SESSION_SECRET` | Texto secreto largo para las sesiones (cualquier string largo) | `algo-muy-largo-y-al3atorio` |
| `MOM_WHATSAPP` | Número de WhatsApp **con código de país, sin + ni espacios** | `5493512345678` |
| `BUSINESS_NAME` | Nombre que ven los alumnos en la página | `Clases con la Profe María` |
| `PORT` | Puerto del servidor (por defecto 3000) | `3000` |

**Número de WhatsApp para Argentina:**
- Formato: `549` + número sin el cero inicial
- Ejemplo: si el número es `0351 123-4567` → poné `5493511234567`

---

## Uso del panel de administración

### Agenda del día
- Botones rápidos: **Hoy / Mañana / Pasado** + selector de cualquier fecha
- Horarios recomendados: aparece automáticamente cuando hay huecos entre clases (ej: si hay clase a las 14 y a las 16, recomienda las 15)
- Los turnos **pendientes** (naranja) se confirman tocándolos → botón "Confirmar clase"
- Los turnos **confirmados** (verde) se pueden editar, cancelar o ver el detalle

### Vista semanal
- Navegar semana por semana con las flechas
- Ver todos los turnos de la semana de un vistazo
- Tocar cualquier celda para crear o editar una reserva

### Horarios fijos
- Configurar el horario del colegio (ej: Lunes a Viernes de 8 a 13)
- Se repite automáticamente cada semana, los alumnos no pueden elegir esos horarios

### Eventos puntuales
- Bloquear días específicos (viaje, acto escolar, feriado)
- También se puede "reabrir" un horario normalmente bloqueado para una fecha puntual

### Configuración
- Precio por defecto de la clase
- Porcentaje de seña (ej: 30% = el alumno paga el 30% para reservar)
- Número de WhatsApp
- Nombre del negocio

---

## Para pasar a producción (hosting real)

Cuando quieras que los alumnos accedan desde cualquier lugar:

1. **Subir a un servidor:** opciones recomendadas (todas con plan gratuito):
   - [Railway](https://railway.app) — la más fácil, conectás tu repositorio de GitHub y listo
   - [Render](https://render.com) — similar a Railway
   - [Fly.io](https://fly.io) — más técnico pero gratuito

2. **Configurar variables de entorno** en el panel del hosting (las mismas que en `.env`)

3. **El archivo de datos** (`data/turnos.json`) se guarda en el servidor → no se pierde al reiniciar si usás un disco persistente (Railway y Fly.io lo soportan)

---

## Estructura del proyecto

```
turnos-app/
├── server/
│   ├── index.js          # Servidor Express principal
│   ├── store.js          # Almacenamiento en archivo JSON
│   ├── availability.js   # Lógica de disponibilidad y recomendaciones
│   ├── middleware/
│   │   └── auth.js       # Autenticación del panel admin
│   └── routes/
│       ├── public.js     # API pública (alumnos)
│       └── admin.js      # API privada (profesora)
├── public/
│   ├── index.html        # Página de reservas para alumnos
│   ├── admin.html        # Panel de la profesora
│   ├── css/
│   │   ├── styles.css    # Estilos compartidos
│   │   └── admin.css     # Estilos del panel
│   └── js/
│       ├── booking.js    # Lógica de reserva pública
│       └── admin.js      # Lógica del panel
├── data/                 # Base de datos (archivo JSON, se crea automático)
├── .env                  # Configuración local (NO subir a Git)
├── .env.example          # Plantilla de configuración
└── package.json
```
