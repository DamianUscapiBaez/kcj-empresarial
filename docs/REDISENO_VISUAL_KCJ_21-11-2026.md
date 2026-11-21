# KCJ CONTROL — Recuperación de identidad corporativa

**Alcance:** diseño visual y ergonomía, sin migraciones ni alteración intencional de reglas de negocio.

## Activo de marca

Se utiliza sin recortes, filtros ni alteraciones `public/assets/kcj-logo-original.jpg` (logo KCJ original sobre fondo blanco, formato horizontal). La identidad visual retoma grafito/gris, rojo y blanco; se retiró el esquema genérico azul/dorado de la interfaz.

## Cambios incluidos

- Pantalla de inicio de sesión responsive con imagen corporativa original y textos institucionales.
- Navegación por responsabilidad en menú lateral, versión móvil y estado de módulo activo.
- Panel general con indicadores provenientes de PostgreSQL, accesos rápidos y grupos por proceso autorizado.
- Encabezados de módulos con jerarquía visual, breadcrumb, icono y descripción.
- Formularios con campos legibles, obligatoriedad, secciones diferenciadas y controles de foco accesibles.
- Tablas con encabezado consistente, conteos, mejor contraste, acciones visibles y estados vacíos.
- Vista para actualizar la contraseña temporal, pantallas de carga y error coherentes con identidad KCJ.

## Compatibilidad funcional

No se han modificado:

- Modelo `prisma/schema.prisma`, migraciones ni `prisma/seed.ts`.
- Server Actions de acceso, Operaciones, SSOMA o Aula.
- Reglas `lib/dominio-kcj.ts`, permisos `lib/modulos.ts` ni agrupación `lib/navegacion-kcj.ts`.
- Endpoints de API, nombres de campos enviados en formularios, contratos de datos, registros y roles.

**La actualización visual no significa que la aplicación completa haya superado compilación, Postgres, Vercel ni pruebas de funcionamiento empresarial.** El sistema conserva las limitaciones descritas en `docs/ESTADO_REAL_Y_LIMITES.md`.

## Verificación para TI

```bash
npm install
npm run typecheck
npm test
npm run build
```

Con una base PostgreSQL de prueba y secretos configurados:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:verify
npm run dev
```

Verificar visualmente `/login`, `/dashboard`, `/dashboard/operaciones`, `/dashboard/roster`, `/dashboard/almacen`, `/dashboard/aula` y la vista móvil; validar acciones con perfiles autorizados. No cargar datos reales antes de comprobar permisos y respaldos.
