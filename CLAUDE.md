# CLAUDE.md — Sistema de Tickets TIC · ESE CEMINSA

> Este archivo es la fuente de verdad del proyecto. Léelo completo antes de generar cualquier código.
> Actualiza PROGRESS.md cada vez que completes un módulo.

---

## 📌 Contexto del Proyecto

**Cliente:** ESE Centro Materno Infantil CEMINSA — Sabanalarga, Atlántico, Colombia  
**Responsable TIC:** José Rafael Salcedo Briñez  
**Correo TIC:** sistemas@ceminsa.gov.co  
**Objetivo:** Sistema interno de gestión de tickets de soporte para el área de Sistemas, inspirado en GLPI.  
**Usuarios esperados:** ~200 funcionarios solicitantes + 2 técnicos TIC  
**Estado del proyecto:** En desarrollo

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología | Hospedaje |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Netlify |
| Backend / API | NestJS (REST API) | Render (Web Service) |
| Base de datos | PostgreSQL | Neon (Serverless) |
| ORM | Prisma | — |
| Autenticación | JWT + bcrypt | — |
| Correo | Nodemailer + Zoho SMTP | — |
| Estilos | Tailwind CSS + shadcn/ui | — |
| Validación | class-validator + Zod | — |
| Reportes | pdfkit + exceljs | — |

---

## 📁 Estructura de Carpetas

```
/
├── frontend/                  # Proyecto Next.js
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (portal)/          # Vistas del funcionario
│   │   │   ├── nuevo-ticket/
│   │   │   ├── mis-tickets/
│   │   │   └── faq/
│   │   └── (admin)/           # Vistas del técnico / admin
│   │       ├── dashboard/
│   │       ├── tickets/
│   │       ├── usuarios/
│   │       ├── categorias/
│   │       └── reportes/
│   ├── components/
│   │   ├── tickets/
│   │   ├── ui/                # shadcn/ui components
│   │   └── charts/
│   ├── lib/
│   │   ├── api.ts             # Cliente axios hacia el backend
│   │   └── auth.ts            # Helpers de sesión
│   └── .env.local
│
├── backend/                   # Proyecto NestJS
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── tickets/
│   │   ├── categories/
│   │   ├── comments/
│   │   ├── attachments/
│   │   ├── notifications/
│   │   ├── reports/
│   │   └── dashboard/
│   ├── prisma/
│   │   └── schema.prisma
│   └── .env
│
├── CLAUDE.md                  # ← Este archivo
├── PROGRESS.md                # Estado actual del desarrollo
└── TODO.md                    # Tareas pendientes
```

---

## 🗄️ Modelo de Base de Datos (Prisma Schema)

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Neon connection string
}

enum Role {
  ADMIN
  TECNICO
  SOLICITANTE
}

enum TicketStatus {
  ABIERTO
  EN_PROCESO
  PENDIENTE
  RESUELTO
  CERRADO
}

enum Priority {
  BAJA
  MEDIA
  ALTA
  CRITICA
}

model User {
  id          String    @id @default(uuid())
  nombre      String
  email       String    @unique
  password    String
  rol         Role      @default(SOLICITANTE)
  area        String?
  activo      Boolean   @default(true)
  createdAt   DateTime  @default(now())

  ticketsCreados   Ticket[] @relation("Solicitante")
  ticketsAsignados Ticket[] @relation("Tecnico")
  comentarios      Comment[]
  notificaciones   Notification[]
}

model Category {
  id          String   @id @default(uuid())
  nombre      String
  descripcion String?
  icono       String?
  activo      Boolean  @default(true)
  tickets     Ticket[]
}

model Ticket {
  id                   String       @id @default(uuid())
  titulo               String
  descripcion          String
  estado               TicketStatus @default(ABIERTO)
  prioridad            Priority     @default(MEDIA)
  calificacion         Int?         // 1 a 5
  comentarioCalif      String?
  fechaApertura        DateTime     @default(now())
  fechaCierre          DateTime?
  updatedAt            DateTime     @updatedAt

  categoria            Category     @relation(fields: [categoriaId], references: [id])
  categoriaId          String

  solicitante          User         @relation("Solicitante", fields: [solicitanteId], references: [id])
  solicitanteId        String

  tecnico              User?        @relation("Tecnico", fields: [tecnicoId], references: [id])
  tecnicoId            String?

  comentarios          Comment[]
  adjuntos             Attachment[]
  notificaciones       Notification[]
}

model Comment {
  id          String   @id @default(uuid())
  contenido   String
  esInterno   Boolean  @default(false)  // true = solo visible para técnicos
  createdAt   DateTime @default(now())

  ticket      Ticket   @relation(fields: [ticketId], references: [id])
  ticketId    String

  autor       User     @relation(fields: [autorId], references: [id])
  autorId     String
}

model Attachment {
  id        String   @id @default(uuid())
  nombre    String
  url       String
  tipo      String
  tamanio   Int
  createdAt DateTime @default(now())

  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  ticketId  String
}

model Notification {
  id        String   @id @default(uuid())
  tipo      String   // ticket_creado | ticket_asignado | comentario | resuelto | cerrado
  mensaje   String
  leida     Boolean  @default(false)
  createdAt DateTime @default(now())

  usuario   User     @relation(fields: [usuarioId], references: [id])
  usuarioId String

  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  ticketId  String
}
```

---

## 🔐 Autenticación y Roles

- **JWT** almacenado en `httpOnly cookie` (no localStorage)
- **Guards NestJS:** `JwtAuthGuard` + `RolesGuard`
- **Decorador:** `@Roles(Role.ADMIN, Role.TECNICO)`

| Acción | SOLICITANTE | TECNICO | ADMIN |
|---|:---:|:---:|:---:|
| Crear ticket | ✅ | ✅ | ✅ |
| Ver sus tickets | ✅ | ✅ | ✅ |
| Ver todos los tickets | ❌ | ✅ | ✅ |
| Asignar técnico | ❌ | ❌ | ✅ |
| Cambiar estado | ❌ | ✅ | ✅ |
| Comentario interno | ❌ | ✅ | ✅ |
| Calificar atención | ✅ | ❌ | ❌ |
| Ver reportes/dashboard | ❌ | ✅ | ✅ |
| Gestionar usuarios/categorías | ❌ | ❌ | ✅ |

---

## 📧 Notificaciones por Correo (Zoho SMTP)

**Librería:** `@nestjs-modules/mailer` con `nodemailer`

**Variables de entorno (backend/.env):**
```env
MAIL_HOST=smtp.zoho.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=sistemas@ceminsa.gov.co
MAIL_PASS=TU_PASSWORD_ZOHO
MAIL_FROM="Soporte TIC CEMINSA <sistemas@ceminsa.gov.co>"
```

**Disparadores de correo:**
| Evento | Destinatario |
|---|---|
| Ticket creado | Solicitante + Técnicos |
| Ticket asignado | Técnico asignado |
| Nuevo comentario público | Solicitante + Técnico asignado |
| Ticket resuelto | Solicitante (con link para calificar) |
| Ticket cerrado | Solicitante |

> 📧 Remitente siempre: sistemas@ceminsa.gov.co

---

## 🌐 Variables de Entorno

**backend/.env**
```env
DATABASE_URL="postgresql://usuario:password@host.neon.tech/tickets_tic?sslmode=require"
JWT_SECRET="clave-secreta-muy-larga-y-segura"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="https://tickets-ceminsa.netlify.app"
# Correo
MAIL_HOST=smtp.zoho.com
MAIL_PORT=587
MAIL_USER=sistemas@ceminsa.gov.co
MAIL_PASS=TU_PASSWORD
MAIL_FROM="Soporte TIC CEMINSA <sistemas@ceminsa.gov.co>"
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL="https://tickets-tic-api.onrender.com"
```

---

## 🚀 Deploy

| Servicio | Proyecto | Configuración clave |
|---|---|---|
| **Netlify** | Next.js | Build: `npm run build` / Publish: `.next` |
| **Render** | NestJS | Start: `npm run start:prod` / Port: `3001` |
| **Neon** | PostgreSQL | Connection string en `DATABASE_URL` |

**CORS en NestJS:** Permitir solo `https://tickets-ceminsa.netlify.app`

**Prisma en Render:** Agregar en `package.json`:
```json
"build": "npx prisma generate && nest build"
```

---

## 📊 Módulo de Reportes (para PETI/PESI)

Generar reportes en PDF y Excel con:
- Total de tickets por período (mes/trimestre)
- Tickets por categoría
- Tickets por área solicitante
- Tiempo promedio de resolución
- Indicador de satisfacción (promedio calificaciones)
- Tickets por técnico (carga de trabajo)
- Tickets resueltos vs pendientes

**Librerías:** `pdfkit` (PDF) y `exceljs` (Excel)

---

## 🏷️ Categorías de Tickets (Iniciales)

```
1. Hardware
   - Equipos de cómputo
   - Impresoras y periféricos
   - Cableado y conectores

2. Conectividad
   - Red local (LAN)
   - Internet
   - WiFi

3. Software / Aplicativos
   - Historia Clínica
   - RIPS
   - Nómina y contabilidad
   - Ofimática (Office/LibreOffice)

4. Accesos y Seguridad
   - Creación/eliminación de usuarios
   - Cambio de contraseñas
   - Permisos

5. Plataformas Institucionales
   - SECOP
   - SIAOBSERVA

6. Dispositivos Móviles
   - Celulares institucionales
   - Tabletas

7. Otros
   - Solicitudes generales TIC
```

---

## ⚙️ Convenciones de Código

- **Idioma del código:** Inglés (variables, funciones, clases)
- **Idioma de la UI:** Español
- **Comentarios:** Español
- **Commits:** Español, formato: `feat: descripción` / `fix: descripción`
- **Ramas Git:** `main` (producción) / `develop` (desarrollo activo)
- **NestJS:** Un módulo por recurso, siempre con DTO, Service, Controller y Guard
- **Next.js:** Server Components por defecto; Client Components solo cuando sea necesario
- **Manejo de errores:** Siempre con `try/catch` y respuestas estandarizadas:
  ```json
  { "statusCode": 400, "message": "Descripción del error", "error": "Bad Request" }
  ```

---

## 📋 Orden de Desarrollo Recomendado

1. **[ ] Fase 1 — Fundación**
   - Setup NestJS + Prisma + Neon
   - Setup Next.js + Tailwind + shadcn/ui
   - Módulo Auth (registro, login, JWT, guards)

2. **[ ] Fase 2 — Core**
   - CRUD Categorías (backend + admin frontend)
   - CRUD Usuarios (backend + admin frontend)
   - CRUD Tickets completo (backend)

3. **[ ] Fase 3 — Vistas principales**
   - Portal del funcionario (crear ticket, ver mis tickets)
   - Vista del técnico (bandeja, cambiar estado, asignar)
   - Sistema de comentarios (públicos e internos)

4. **[ ] Fase 4 — Notificaciones y adjuntos**
   - Integración Zoho SMTP
   - Subida de archivos adjuntos a tickets

5. **[ ] Fase 5 — Dashboard y Reportes**
   - Dashboard con métricas (gráficas)
   - Exportación PDF y Excel para PETI/PESI

6. **[ ] Fase 6 — Deploy y pruebas**
   - Deploy Neon + Render + Netlify
   - Pruebas con usuarios reales
   - Ajustes finales

---

## 📝 Notas Importantes

- El sistema **NO se integra** con ningún sistema externo de la ESE por ahora
- Los archivos adjuntos se pueden guardar en **Cloudinary (free tier)** o como `base64` en BD para simplificar
- La calificación del servicio se hace mediante un **link en el correo de resolución**, sin necesidad de login
- El sistema debe funcionar bien en **dispositivos móviles** (los funcionarios usan celulares)
- Para la primera versión **no hay SLA automático**, se gestiona manualmente por prioridad

---

*Última actualización: Octubre 2026 — José Rafael Salcedo Briñez*
