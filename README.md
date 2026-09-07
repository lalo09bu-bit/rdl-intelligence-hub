# 🏛️ RDL Intelligence Hub

Plataforma corporativa integral para la gestión de talento, balance de metas y KPIs ponderados, incidencias laborales y comunicación interna en tiempo real para **RDL Reclutamiento e Integración de Talento**.

---

## 🚀 Inicio Rápido (Instalación Local)

### 1. Requisitos Previos
- **Node.js** (versión 18 o superior recomendada)
- **npm** o **pnpm**

### 2. Pasos de Instalación
```bash
# 1. Clonar el repositorio
git clone <URL_DE_TU_REPOSITORIO_GITHUB>
cd "Desarrollo HUB RDL"

# 2. Instalar dependencias
npm install

# 3. Compilar la interfaz (Astro)
npm run build

# 4. Inicializar y sembrar la base de datos (SQLite)
npm run seed

# 5. Iniciar la plataforma
npm start
```
El sistema estará escuchando en **`http://localhost:9060`** (o en la IP de red local en el puerto `9060`).

---

## 👥 Cuentas de Prueba Corporativas (Modo Dev / 1-Clic)

En la pantalla de acceso (`/login`), puedes entrar con 1 solo clic o utilizando los siguientes correos:

| Perfil / Colaborador | Correo Corporativo | Rol en el Hub | Permisos Destacados |
| :--- | :--- | :--- | :--- |
| **Lic. Andrés Cosmes** | `rh@rdl.com.mx` | `RH` | Control total: asignar/eliminar metas, aprobar vacaciones, editar fichas y comunicados |
| **Lic. Valeria Mendoza** | `valeria.mendoza@rdl.com.mx` | `Abogada_Sr` | Metas al 100%, KPIs de laudos y convenios, visualización de incidencias |
| **Lic. Sofía Ramírez** | `sofia.ramirez@rdl.com.mx` | `Admin` / Sr | Coordinación jurídica y publicación de comunicados legales |
| **Lic. Ana Martínez** | `ana.martinez@rdl.com.mx` | `Abogada_Jr` | Metas de redacción de demandas y audiencias al 100% |
| **Lic. Mariana Torres** | `mariana.torres@rdl.com.mx` | `Abogada_Jr` | Solicitudes de vacaciones pendientes y seguimiento operativo |

---

## 🌐 ¿Cómo probarlo en otras computadoras?

Existen dos escenarios principales según la ubicación de las otras computadoras:

### Escenario A: Otras computadoras en la MISMA oficina o red Wi-Fi
1. Averigua la IP local de la computadora donde está corriendo el servidor (por ejemplo `192.168.1.89`).
2. En la otra computadora conectada al mismo Wi-Fi, abre el navegador y escribe:
   ```text
   http://192.168.1.89:9060
   ```
3. *(Nota: Si Windows Firewall muestra una advertencia, permite el acceso en redes privadas).*

### Escenario B: Otras computadoras en OTRA oficina, casa o celulares (Vía Internet / Túnel Seguro)
No necesitas configurar puertos en el módem ni pagar servidores para probarlo de inmediato:
1. En la computadora anfitriona, abre una terminal y ejecuta:
   ```bash
   npx untun@latest tunnel --port 9060
   # O utilizando Cloudflare Tunnel directamente:
   # npx cloudflared tunnel --url http://localhost:9060
   ```
2. Te generará un enlace público seguro `https://xxxx.trycloudflare.com`.
3. Abre ese enlace desde cualquier computadora en cualquier ciudad o dispositivo móvil.

### Escenario C: Despliegue permanente 24/7 en la nube
Puedes conectar este repositorio de GitHub a un servicio como **Render.com** o **Railway.app** (ambos con planes gratuitos):
- **Build Command:** `npm install && npm run build && npm run seed`
- **Start Command:** `npm start`
- Tendrás un enlace permanente como `https://rdl-hub.onrender.com` disponible los 365 días del año sin necesidad de mantener tu computadora encendida.

---

## 🛠️ Estructura del Proyecto

```text
├── src/                      # Código fuente del Frontend (Astro)
│   ├── components/           # Componentes modulares (Auth, Perfil, Metas, Feed, Red)
│   ├── layouts/              # Layout corporativo base
│   └── pages/                # Páginas (index.astro, login.astro)
├── server/                   # Backend Node.js + Express
│   ├── routes/               # Endpoints REST (auth, usuarios, metas, incidencias, feed)
│   ├── services/             # Lógica de negocio, JWT, tokens y correo Resend
│   ├── scripts/              # Semillas y migraciones SQLite (seed-mock-data.js)
│   └── server.js             # Servidor HTTP + WebSockets (Socket.io)
├── public/                   # Activos estáticos, estilos corporativos y lógica cliente
├── rdl_intelligence_hub.db   # Base de datos SQLite (generada con npm run seed)
├── astro.config.mjs          # Configuración de Astro
└── package.json              # Dependencias y scripts
```

---

## 🎨 Paleta Corporativa Oficial RDL
- **Fondo:** Blanco Puro (`#ffffff`) y Slate Claro (`#f8fafc`).
- **Primario / Acción:** Verde Pino / Deep Teal (`#136a60`).
- **Secundario / Encabezados:** Azul Marino RDL (`#0f2d4a`).
- **Bordes y Divisiones:** Slate Suave (`#e2e8f0`).
