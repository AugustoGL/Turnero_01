# Deploy con Docker

## Requisitos
- Docker y Docker Compose instalados en el servidor

## Pasos

### 1. Cloná o subí el proyecto al servidor

### 2. Creá el archivo `.env` con tus valores reales
```bash
cp .env.example .env
nano .env
```

```env
ADMIN_PASSWORD=tu-clave-segura
SESSION_SECRET=un-string-largo-y-aleatorio
MOM_WHATSAPP=5493512345678
BUSINESS_NAME=Clases con la Profe
```

### 3. Buildear y levantar
```bash
docker compose up -d --build
```

La app queda corriendo en `http://tu-servidor:3000`

### 4. Ver logs
```bash
docker compose logs -f
```

### 5. Actualizar cuando hagas cambios
```bash
docker compose up -d --build
```
Los datos en `turnos.json` se conservan gracias al volumen.

### 6. Bajar la app
```bash
docker compose down
```

---

## Hosting recomendado

### Railway (más fácil)
1. Subí el proyecto a GitHub
2. En Railway: New Project → Deploy from GitHub
3. Agregá las variables de entorno en el panel
4. Railway detecta el Dockerfile automáticamente

### VPS (DigitalOcean, Contabo, etc.)
1. Instalar Docker: `curl -fsSL https://get.docker.com | sh`
2. Clonar el repo y seguir los pasos de arriba
3. Opcional: poner Nginx adelante para HTTPS

### Render
1. New Web Service → conectar GitHub
2. Environment: Docker
3. Agregar variables de entorno en el panel
4. Crear un Disk montado en `/app/data` para persistencia

---

## HTTPS (recomendado para producción)

Si usás un VPS, instalá Nginx + Certbot:
```bash
apt install nginx certbot python3-certbot-nginx
certbot --nginx -d tudominio.com
```

Y en `/etc/nginx/sites-available/turnos`:
```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```