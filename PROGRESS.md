# PROGRESS.md — Sistema de Tickets TIC · ESE CEMINSA

> Actualiza este archivo después de cada sesión de trabajo.

---

## Estado General: 🟢 En desarrollo — Fase 5 completada

---

## Fase 1 — Fundación
- [x] Setup proyecto NestJS
- [x] Configurar Prisma + conexión Neon (schema.prisma completo)
- [x] Ejecutar migraciones (schema inicial) ✅ 20261028134116_init
- [x] Módulo Auth: registro, login, JWT ✅
- [x] Guards: JwtAuthGuard + RolesGuard ✅
- [x] Setup proyecto Next.js 14 (App Router)
- [x] Configurar Tailwind CSS + shadcn/ui base
- [ ] Layout base con sidebar y navbar

## Fase 2 — Core (Backend)
- [x] Módulo Categorías (CRUD completo) ✅
- [x] Módulo Usuarios (CRUD + gestión de roles) ✅
- [x] Módulo Tickets (CRUD completo) ✅
- [x] Módulo Comentarios (públicos e internos) ✅ — integrado en TicketsService
- [ ] Módulo Adjuntos

## Fase 3 — Vistas Frontend
- [x] Pantalla Login ✅ (conectada a API, redirección por rol)
- [x] AuthProvider + Zustand store + middleware de rutas ✅
- [x] Sidebar con navegación contextual por rol ✅
- [x] Portal Funcionario: Crear ticket ✅
- [x] Portal Funcionario: Mis tickets (lista + detalle + calificación) ✅
- [x] Vista Técnico: Bandeja de tickets (filtros por estado, métricas) ✅
- [x] Vista Técnico/Admin: Detalle de ticket (cambiar estado, asignar, comentarios internos) ✅
- [x] Vista Admin: Gestión de usuarios ✅
- [x] Vista Admin: Gestión de categorías ✅

## Fase 4 — Notificaciones y Adjuntos
- [x] Módulo NotificationsService con Nodemailer ✅
- [x] Email: ticket creado (solicitante + técnicos) ✅
- [x] Email: ticket asignado (técnico) ✅
- [x] Email: nuevo comentario público ✅
- [x] Email: ticket resuelto (con link de calificación) ✅
- [x] Email: ticket cerrado ✅
- [x] Módulo Attachments con Cloudinary (fallback base64) ✅
- [x] Componente AttachmentUploader en frontend ✅
- [ ] Configurar variables MAIL_* en .env para activar envío real

## Fase 5 — Dashboard y Reportes
- [x] DashboardModule: métricas agregadas (totalTickets, byStatus, byCategory, byPriority, byTechnician, avgResolutionHours, avgRating) ✅
- [x] ReportsModule: generación PDF (pdfkit) y Excel (exceljs) con filtro de fechas ✅
- [x] Frontend: página /reportes con KPI cards y 4 gráficos Recharts ✅
- [x] Sidebar: enlace Reportes para ADMIN y TECNICO ✅
- [x] Botones descarga PDF y Excel con rango de fechas ✅

## Fase 6 — Deploy y Pruebas
- [ ] Deploy base de datos en Neon
- [ ] Deploy API en Render
- [ ] Deploy Frontend en Netlify
- [ ] Configurar variables de entorno en producción
- [ ] Pruebas con usuarios reales
- [ ] Correcciones post-prueba

---

## Registro de Sesiones

| Fecha | Qué se hizo |
|---|---|
| 2026-10-27 | Planificación general y creación de CLAUDE.md |
| 2026-10-28 | Fase 1: NestJS + Next.js 14 scaffolding, Prisma schema completo, PrismaModule, main.ts con CORS y ValidationPipe |
| 2026-10-28 | Fase 4: NotificationsService (Nodemailer/Zoho), AttachmentsModule (Cloudinary + fallback base64), AttachmentUploader frontend |
| 2026-10-28 | Fase 5: DashboardModule + ReportsModule (PDF/Excel), página /reportes con Recharts (PieChart, BarChart), botones descarga |
