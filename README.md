# Sistema de Gestión de Tickets TIC — ESE CEMINSA

Sistema interno de soporte técnico para el área de Sistemas de la **ESE Centro Materno Infantil CEMINSA**, Sabanalarga, Atlántico, Colombia.

> Responsable TIC: José Rafael Salcedo Briñez — sistemas@ceminsa.gov.co

---

## Descripción

Plataforma web que centraliza, registra y hace seguimiento a las solicitudes de soporte del área TIC. Reemplaza el proceso manual de solicitudes verbales o por WhatsApp, garantizando trazabilidad, tiempos de respuesta medibles e indicadores de satisfacción para los planes PETI y PESI.

- ~200 funcionarios solicitantes + 2 técnicos TIC
- Inspirado en GLPI
- Accesible desde computadores y dispositivos móviles

---

## Stack

| Capa | Tecnología | Hospedaje |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Netlify |
| Backend / API | NestJS (REST) | Render |
| Base de datos | PostgreSQL | Neon (Serverless) |
| ORM | Prisma 5 | — |
| Autenticación | JWT + bcrypt | — |
| Correo | Nodemailer + Zoho SMTP | — |
| Estilos | Tailwind CSS + shadcn/ui | — |

---

## Estructura del repositorio

```
/
├── frontend/          # Next.js 14 — portal del funcionario + panel admin
├── backend/           # NestJS — API REST + Prisma + notificaciones
├── CLAUDE.md          # Fuente de verdad del proyecto
├── PROGRESS.md        # Estado del desarrollo
└── README.md          # Este archivo
```

---

## URLs de producción

| Servicio | URL |
|---|---|
| Frontend | https://tickets-ceminsa.netlify.app |
| Backend API | https://tickets-tic-api.onrender.com |

---

## Instalación local

### Requisitos

- Node.js 20+
- PostgreSQL (o cuenta Neon)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # completar variables
npx prisma migrate dev
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # completar NEXT_PUBLIC_API_URL
npm run dev
```

---

## Variables de entorno

### `backend/.env`

```env
DATABASE_URL="postgresql://usuario:password@host.neon.tech/tickets_tic?sslmode=require"
JWT_SECRET="clave-secreta-larga"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="https://tickets-ceminsa.netlify.app"
MAIL_HOST=smtp.zoho.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=sistemas@ceminsa.gov.co
MAIL_PASS=TU_PASSWORD_ZOHO
MAIL_FROM="Soporte TIC CEMINSA <sistemas@ceminsa.gov.co>"
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL="https://tickets-tic-api.onrender.com"
```

---

## Roles y permisos

| Acción | SOLICITANTE | TECNICO | ADMIN |
|---|:---:|:---:|:---:|
| Crear ticket | ✅ | ✅ | ✅ |
| Ver sus tickets | ✅ | ✅ | ✅ |
| Ver todos los tickets | ❌ | ✅ | ✅ |
| Asignar técnico | ❌ | ❌ | ✅ |
| Cambiar estado / prioridad | ❌ | ✅ | ✅ |
| Comentario interno | ❌ | ✅ | ✅ |
| Calificar atención | ✅ | ❌ | ❌ |
| Ver dashboard / reportes | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |
| Gestionar categorías | ❌ | ❌ | ✅ |

---

## Flujo de un ticket

```
ABIERTO → EN_PROCESO → PENDIENTE → RESUELTO → CERRADO
```

1. El funcionario crea el ticket (categoría + título + descripción)
2. Sistema asigna prioridad MEDIA y estado ABIERTO; se envía correo
3. Técnico cambia estado a EN_PROCESO y se asigna
4. Técnico agrega comentarios (públicos o internos)
5. Al resolver: estado RESUELTO + correo al solicitante con link de calificación
6. Solicitante califica (1–5) → ticket pasa a CERRADO

---

## Notificaciones por correo (Zoho SMTP)

| Evento | Destinatario |
|---|---|
| Ticket creado | Solicitante + Técnicos TIC |
| Ticket asignado | Técnico asignado |
| Nuevo comentario público | Solicitante + Técnico asignado |
| Ticket resuelto | Solicitante (con link para calificar) |
| Ticket cerrado | Solicitante |

Remitente: `sistemas@ceminsa.gov.co`

---

## Seguridad

- **JWT en cookie httpOnly** — protegida contra XSS; no se usa localStorage
- **Helmet.js** — X-Frame-Options, X-Content-Type-Options, HSTS, CSP en todas las respuestas
- **Rate limiting** — 20 req/min global; 5 intentos/min en login (ThrottlerModule)
- **Registro restringido** — `/api/auth/register` requiere JWT de ADMIN
- **Sanitización HTML** — `escHtml()` en todas las plantillas de correo
- **Validación estricta** — `forbidNonWhitelisted: true` en todos los DTOs
- **bcrypt** — contraseñas hasheadas con factor 10
- **CORS** — solo permite el origen del frontend en producción

### Auditoría de seguridad — Octubre 2026 (commit `ecd3f37`)

| # | Vulnerabilidad | Severidad | Corrección |
|---|---|---|---|
| 1 | Registro público desprotegido | CRÍTICA | JwtAuthGuard + RolesGuard en `/auth/register` |
| 2 | Sin cabeceras HTTP de seguridad | ALTA | Helmet.js en `main.ts` |
| 3 | Sin rate limiting en login | ALTA | ThrottlerModule (5 intentos/min) |
| 4 | Inyección HTML en correos | MEDIA | `escHtml()` en `notifications.service.ts` |
| 5 | Crash por fecha inválida en reportes | MEDIA | `validDate()` con regex ISO-8601 |
| 6 | DTOs permisivos | BAJA | `forbidNonWhitelisted: true` |

---

## Módulos del backend

```
src/
├── auth/           # JWT, login, registro, guards, decorators
├── users/          # CRUD usuarios, activar/desactivar, cambio contraseña
├── tickets/        # Ciclo de vida completo de tickets
├── categories/     # CRUD categorías de soporte
├── comments/       # Comentarios públicos e internos
├── attachments/    # Adjuntos a tickets
├── notifications/  # Correos automáticos (Zoho SMTP)
├── dashboard/      # Métricas en tiempo real
└── reports/        # Exportación PDF (pdfkit) y Excel (exceljs)
```

---

## Despliegue

### Render (Backend)

1. Conectar repositorio en render.com
2. Build command: `npm run build`
3. Start command: `npm run start:prod`
4. Configurar variables de entorno en el dashboard
5. **Manual Deploy** para aplicar cambios

### Netlify (Frontend)

1. Conectar repositorio en netlify.com
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Plugin: `@netlify/plugin-nextjs`
5. Configurar `NEXT_PUBLIC_API_URL`

---

## Convenciones

- **Código:** inglés (variables, funciones, clases)
- **UI:** español
- **Commits:** español, formato `feat:` / `fix:` / `refactor:`
- **Ramas:** `main` (producción) / `develop` (desarrollo)

---

*ESE Centro Materno Infantil CEMINSA — Área de Sistemas TIC*
