import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'sistemas@ceminsa.gov.co' },
    update: {},
    create: {
      nombre: 'José Rafael Salcedo',
      email: 'sistemas@ceminsa.gov.co',
      password: hash,
      rol: Role.ADMIN,
      area: 'Sistemas TIC',
    },
  });

  const tecnico = await prisma.user.upsert({
    where: { email: 'tecnico@ceminsa.gov.co' },
    update: {},
    create: {
      nombre: 'Técnico TIC',
      email: 'tecnico@ceminsa.gov.co',
      password: await bcrypt.hash('tecnico123', 10),
      rol: Role.TECNICO,
      area: 'Sistemas TIC',
    },
  });

  const funcionario = await prisma.user.upsert({
    where: { email: 'enfermeria@ceminsa.gov.co' },
    update: {},
    create: {
      nombre: 'María González',
      email: 'enfermeria@ceminsa.gov.co',
      password: await bcrypt.hash('usuario123', 10),
      rol: Role.SOLICITANTE,
      area: 'Enfermería',
    },
  });

  const categories = [
    { nombre: 'Hardware', descripcion: 'Equipos, impresoras, periféricos', icono: '🖥️' },
    { nombre: 'Conectividad', descripcion: 'Red, internet, WiFi', icono: '🌐' },
    { nombre: 'Software / Aplicativos', descripcion: 'Historia clínica, RIPS, ofimática', icono: '💿' },
    { nombre: 'Accesos y Seguridad', descripcion: 'Usuarios, contraseñas, permisos', icono: '🔐' },
    { nombre: 'Plataformas Institucionales', descripcion: 'SECOP, SIAOBSERVA', icono: '🏛️' },
    { nombre: 'Dispositivos Móviles', descripcion: 'Celulares y tabletas institucionales', icono: '📱' },
    { nombre: 'Otros', descripcion: 'Solicitudes generales TIC', icono: '📋' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.nombre },
      update: {},
      create: cat,
    }).catch(async () => {
      const existing = await prisma.category.findFirst({ where: { nombre: cat.nombre } });
      if (!existing) await prisma.category.create({ data: cat });
    });
  }

  console.log('✅ Seed completado');
  console.log(`   Admin:      sistemas@ceminsa.gov.co / admin123`);
  console.log(`   Técnico:    tecnico@ceminsa.gov.co / tecnico123`);
  console.log(`   Funcionario: enfermeria@ceminsa.gov.co / usuario123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
