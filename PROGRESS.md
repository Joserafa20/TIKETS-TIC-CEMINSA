# PROGRESS.md — Sistema de Tickets TIC · ESE CEMINSA

> Actualiza este archivo después de cada sesión de trabajo.

---

## Estado General: 🟢 En desarrollo — Fase 1

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
- [ ] Módulo Categorías (CRUD completo)
- [ ] Módulo Usuarios (CRUD + gestión de roles)
- [ ] Módulo Tickets (CRUD completo)
- [ ] Módulo Comentarios (públicos e internos)
- [ ] Módulo Adjuntos

## Fase 3 — Vistas Frontend
- [ ] Pantalla Login
- [ ] Portal Funcionario: Crear ticket
- [ ] Portal Funcionario: Mis tickets (lista + detalle)
- [ ] Vista Técnico: Bandeja de tickets (filtros y búsqueda)
- [ ] Vista Técnico: Detalle de ticket (cambiar estado, asignar, comentar)
- [ ] Vista Admin: Gestión de usuarios
- [ ] Vista Admin: Gestión de categorías

## Fase 4 — Notificaciones y Adjuntos
- [ ] Configurar Zoho SMTP con @nestjs-modules/mailer
- [ ] Email: ticket creado
- [ ] Email: ticket asignado
- [ ] Email: nuevo comentario
- [ ] Email: ticket resuelto (con link de calificación)
- [ ] Email: ticket cerrado
- [ ] Subida de archivos adjuntos (Cloudinary o base64)

## Fase 5 — Dashboard y Reportes
- [ ] Dashboard: widgets de métricas principales
- [ ] Gráfico: tickets por estado
- [ ] Gráfico: tickets por categoría
- [ ] Gráfico: carga por técnico
- [ ] Exportar reporte mensual en PDF
- [ ] Exportar reporte mensual en Excel

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
