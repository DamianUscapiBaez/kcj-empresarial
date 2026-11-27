# KCJ CONTROL Empresarial — KCJ PERÚ S.A.C.

> **ENTREGA ACTUAL FASE 03.7 (22/11/2026):** lea `LEER_PRIMERO_TI.md`. Política unificada: mínimo 8 caracteres en nuevas contraseñas. Las notas históricas de fases anteriores se conservan por trazabilidad.


**Sistema empresarial para todas las modalidades de servicio de KCJ.** Los servicios pueden realizarse dentro o fuera de una operación minera según su configuración. «INSITE» no forma parte del nombre del producto ni limita el alcance.

**Entrega Fase 03.5:** consultar primero `LEER_PRIMERO_TI_FASE_03_5.md` para cambios, verificaciones y requisitos de despliegue.

---

# KCJ CONTROL Fase 03.3 — LEER PRIMERO `LEER_PRIMERO_TI_FASE_03_3.md`

> **KCJ CONTROL — DESARROLLO INCREMENTAL FASE 02 (21/11/2026).**
> Actas comparativas de entrega y devolución **basadas en el inventario real de cada unidad**. La flota es variada: camioneta, microbús, minibús y ómnibus. Diferencias y revisiones por áreas.
> Código para ensayo: **NO publicado ni probado en PostgreSQL/Vercel**. Ver [`docs/FASE_02_ENTREGA_RECEPCION_FLOTA_VARIADA_2026-11-21.md`](docs/FASE_02_ENTREGA_RECEPCION_FLOTA_VARIADA_2026-11-21.md).

> **KCJ CONTROL — DESARROLLO INCREMENTAL FASE 01 (21/11/2026).**
> Primera recuperación de Flota, equipamiento, checklist por tipo, Tarjeta Amarilla vinculada y checklist de conductor.
> Es código para staging: **NO publicado ni validado en PostgreSQL**.
> Instrucciones y limitaciones: [`docs/FASE_01_RECUPERACION_FLOTA_KCJ_2026-11-21.md`](docs/FASE_01_RECUPERACION_FLOTA_KCJ_2026-11-21.md).

## Actualización de navegación — Propuesta B (21/11/2026)

**Decisión aprobada:** el menú lateral y el Panel General se organizan por «Servicios y jornadas», «Unidades y habilitaciones», «Trabajadores y formación», «Seguridad y cumplimiento», «Recursos corporativos», «Análisis y reportes» y «Accesos y configuración». Los 18 módulos, rutas y permisos permanecen. El Control Maestro de Pausas Activas está dentro de Servicios y jornadas. La versión web debe validarse antes de su publicación. La PWA se posterga.

Consultar **[`docs/PROPUESTA_B_MENU_ADMIN_2026-11-21.md`](docs/PROPUESTA_B_MENU_ADMIN_2026-11-21.md)** para implementación, pruebas y pendientes.

---

> **ETAPA 1 · AUDITORÍA VISUAL ADMIN (21/11/2026):** correcciones de formularios dependientes, mensajes vacíos, botones, adjuntos y diagnóstico estático. **131 pruebas locales**; ninguna validación de PostgreSQL/Vercel. Ver [`docs/ETAPA_1_AUDITORIA_VISUAL_ADMIN_2026-11-21.md`](docs/ETAPA_1_AUDITORIA_VISUAL_ADMIN_2026-11-21.md).

> **Corrección de Almacén (21/11/2026):** «Unidad de medida» es ahora un selector con nueve valores estandarizados, validados por el servidor. Ver `docs/CORRECCION_UNIDAD_MEDIDA_ALMACEN_2026-11-21.md`. Sin migraciones ni modificaciones de registros existentes.

> **REVISIÓN 21/11/2026:** Leer primero `README_AUDITORIA_TI.md` y `docs/AUDITORIA_CORRECCIONES_Y_ESTADO_TI.md`. No aplicar a producción sin ensayar migración, build y controles de seguridad.

> **Actualización de identidad visual (21/11/2026):** menú con contraste legible y paleta KCJ gris-grafito, rojo moderado y blanco suave. Consulte [`docs/PALETA_CORPORATIVA_CONFORT_VISUAL_KCJ.md`](docs/PALETA_CORPORATIVA_CONFORT_VISUAL_KCJ.md). **No hay cambios en base de datos ni en reglas de negocio; no ejecutar migraciones por este ajuste.**

# KCJ CONTROL — Sistema empresarial, código fuente editable

**Proyecto nuevo** para KCJ PERÚ S.A.C., basado en el Documento Maestro KCJ CONTROL 3.1 y sus 17 módulos, con **Next.js App Router, React, TypeScript estricto, Tailwind CSS, Prisma ORM 6 y PostgreSQL**. No contiene Python, archivos HTML independientes, BAT ni PowerShell. El código fuente no está ofuscado.

> **Estado real de entrega:** proyecto funcional a nivel de código y pruebas unitarias locales; **no se ha certificado el despliegue con PostgreSQL ni Vercel** en este entorno. No habilitar su uso como fuente oficial de datos reales hasta que TI ejecute y firme la matriz de aceptación de `docs/ACEPTACION_MARCHA_BLANCA.md`.

## Estructura

```
mi-proyecto-kcj/
├── app/
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── dashboard/[modulo]/page.tsx
│   ├── cambiar-clave/page.tsx
│   ├── certificado/[codigo]/page.tsx
│   ├── actions-auth.ts
│   ├── actions-operativas.ts
│   ├── actions-aula.ts
│   └── api/{health,evidencias,reportes}/...
├── components/{ui,dominio}/
├── lib/{prisma,auth,crypto,dominio-kcj,operaciones,modulos,evidencias}.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/20261121000100_initial/migration.sql
├── datos_iniciales/catalogos.json
├── tests/
├── scripts/
├── .github/workflows/
├── docs/
└── package.json
```

La versión inicial incluía 31 modelos de Prisma; esta revisión incorpora dos modelos adicionales (**33 modelos y diez enumeraciones**) con una migración aditiva. Módulos de interfaz: 17 de referencia + Almacén y Herramientas, como función complementaria.

## Requisitos para el técnico

1. Node.js **22 LTS** o superior y npm.
2. Una base **PostgreSQL en nube aprovisionada previamente** (el seed no crea el servidor ni la base lógica).
3. Credenciales de administración inicial segura: `KCJ_ADMIN_DOCUMENT`, `KCJ_ADMIN_NAME`, `KCJ_ADMIN_PASSWORD` (mín. 8 caracteres).
4. Almacenamiento privado compatible con **S3** si se cargarán evidencias y actas; la carga utiliza URL firmada, verifica archivo e impide su consulta libre.

## Instalación local y primer acceso

```bash
npm install
cp .env.example .env
# Editar .env PRIVADO; configurar DATABASE_URL y KCJ_ADMIN_*
npx prisma validate
npm run db:setup
npm run db:verify
npm test
npm run typecheck
npm run build
npm run dev
```

Abrir `http://localhost:3000/login`. El administrador entra con el documento y contraseña configurados por TI; el primer acceso exige cambiar la clave. **Nunca usar contraseña igual al DNI**. El seed es idempotente: si ya existe la cuenta administradora, no altera su contraseña.

**Atención:** no se incluye `package-lock.json` porque la red de este entorno no permitió instalar npm. TI debe ejecutar `npm install`, verificar el resultado y versionar el `package-lock.json` resultante. Luego cambiar los pipelines a `npm ci` para instalaciones reproducibles.

## Vercel + PostgreSQL

1. Importar el repositorio en Vercel, framework **Next.js**, raíz de proyecto donde está `package.json`, runtime Node.js (no exportación estática).
2. Configurar en **Vercel → Settings → Environment Variables** `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` y las variables `KCJ_S3_*` aplicables.
3. En GitHub → Settings → Environments crear `kcj-produccion` con secretos `DATABASE_URL`, `KCJ_ADMIN_DOCUMENT`, `KCJ_ADMIN_NAME`, `KCJ_ADMIN_PASSWORD`.
4. Ejecutar manualmente **KCJ - Migración de base controlada** en GitHub Actions para aplicar tablas (`prisma migrate deploy`).
5. Ejecutar manualmente **KCJ - Crear administrador inicial (una sola vez)** para cargar el seed sin datos ficticios.
6. Comprobar `https://tu-sitio/api/health` y abrir `/login`. Confirmar que tanto GitHub como Vercel apunten **a la misma instancia y misma base lógica PostgreSQL**.
7. Antes de la marcha blanca real, ejecutar el workflow **KCJ - Compilación y PostgreSQL**, probar cada cargo y las restricciones de negocio y documentar restauración de respaldo.

**Importante:** publicar la web no crea ni llena automáticamente la base. Las migraciones y el seed se ejecutan desde los flujos de CI autorizados, no desde cada build de Vercel.

## Pruebas

```bash
npm test                   # reglas puras y controles estructurales
npm run db:verify          # tablas y conteos en PostgreSQL
# ÚNICAMENTE en base de ensayo
KCJ_INTEGRATION_TEST_DB=1 npm run db:integration
npm run typecheck
npm run build
```

Las 86 pruebas locales incluidas **sí fueron ejecutadas y aprobadas** al empacar. Las pruebas reales de integración, la compilación Next.js con dependencias descargadas y la marcha blanca en Vercel **requieren ejecución por TI**.

## Ejemplos y cuestionarios

`datos_iniciales/catalogos.json` define catálogos de referencia sin inventar trabajadores ni placas reales.

`datos_iniciales/curso_demostracion.json` contiene un **curso ficticio recuperado de V17** con dos preguntas: inspección preoperacional y extintor vencido. No es un curso obligatorio oficial. Para cargarlo exclusivamente en una base de ensayo cuyo nombre incluya `test`, `demo` o `sandbox`:

```bash
KCJ_ALLOW_DEMO_SEED=1 npm run db:seed:demo
```

No se importan cuentas ficticias de V17 ni se cargan matrículas, trabajadores, vehículos ni cursos oficiales que no hayan sido verificados por la empresa.

## Seguridad y operación

- Roles y autorización comprobados de nuevo en cada Server Action.
- Sesiones aleatorias con hash SHA-256 en servidor y cookie HTTP-only, Secure en producción.
- Contraseñas con scrypt + sal, cinco intentos antes de bloqueo temporal, cambio de clave inicial.
- SSOMA no puede cerrar sin acciones verificadas con evidencia o motivo técnico registrado; solo SSOMA autorizado verifica/cierra/reabre.
- Usuarios propietarios ven solo unidades vinculadas; los conductores solo sus servicios.
- Salud registra aptitud operativa, no expone historias clínicas.
- Documentos y actas privadas se almacenan externamente; Vercel no se usa como almacenamiento persistente.
- Auditoría de cambios y actos operativos. Historial de ROSTER publicado y comunicaciones por versión.

**Pendientes empresariales NO cubiertos íntegramente:** sincronización offline real en dispositivos, integración externa Webcontrol, firma electrónica con validez normativa, historia clínica protegida en repositorio independiente, PDF/Excel corporativos completos, matrices completas de requerimientos Las Bambas por contrato y aprobación de cada módulo por las áreas. Ver `docs/ESTADO_REAL_Y_LIMITES.md`.

**Código fuente:** se entrega completo y modificable por TI de KCJ. No se presume autorización para publicarlo bajo una licencia pública en GitHub abierto; se recomienda repositorio privado hasta que la empresa determine su política de propiedad intelectual.

## Revisión correctiva de TI - 21/11/2026

Esta entrega conserva el proyecto nuevo, corrige el acceso operativo a homologación e inventario,
organiza los módulos por responsabilidades y elimina un bloqueo de GitHub Actions cuando falta
`package-lock.json`. **No se ha comprobado un despliegue real en Vercel desde este entorno.**

**Leer primero:** `docs/ENTREGA_REVISION_TI_21-11-2026.md`.

Comandos nuevos de diagnóstico:

```bash
npm run db:diagnose      # comprueba estructura local sin PostgreSQL
npm run db:verify        # consulta tablas, esquema, cuentas y registros reales
npm run db:check-login   # valida secretos SOLO antes del cambio de clave inicial
```

El sistema usa módulos, no departamentos artificiales: Operaciones gestiona ROSTER,
Tareo operativo, Flota y Homologación. Almacén es un inventario único con vistas por cargo.

## Identidad visual corporativa — 21/11/2026

La interfaz fue rediseñada para usar el logotipo **original e intacto** de KCJ PERÚ S.A.C. y la paleta grafito, rojo y blanco. El inicio de sesión, panel empresarial, navegación, cabeceras, formularios, tablas y constancias conservan las acciones y datos existentes.

Véase [`docs/REDISENO_VISUAL_KCJ_21-11-2026.md`](docs/REDISENO_VISUAL_KCJ_21-11-2026.md) para el alcance y las pruebas recomendadas. Esta actualización visual no certifica que la aplicación completa esté lista para producción: deben comprobarse dependencias, compilación, PostgreSQL, permisos y Vercel en el entorno de TI.

## Corrección de carga de componentes (21/11/2026)

Se corrigieron dependencias de consultas innecesarias que podían bloquear pantallas,
se añadieron errores visibles por módulo, estados de catálogos vacíos y diagnósticos
de conexión/migraciones. **Ver `docs/CORRECCION_CARGA_COMPONENTES_TI.md` antes de publicar.**
La funcionalidad de las Server Actions y el esquema Prisma de la entrega anterior
no se cambiaron deliberadamente. El proyecto sigue requiriendo validación de build,
PostgreSQL y Vercel por TI.


## Actualización: contraseñas administradas (21/11/2026)

ADMIN asigna contraseñas individuales (mín. 8 caracteres) que no exigen cambio obligatorio en el primer inicio de sesión. ADMIN puede restablecer la contraseña de otra cuenta activa desde **Acceso y usuarios**; el restablecimiento revoca las sesiones de esa cuenta y queda auditado. El cambio voluntario individual está disponible mediante **Cambiar mi contraseña**, exigiendo la contraseña actual. No se muestran las contraseñas almacenadas. Ver `docs/CAMBIO_CLAVES_ACCESO_ADMIN_2026-11-21.md`. Migración aditiva: `20261121000600_claves_administradas_sin_cambio_obligatorio`.


## Entrega TI: ADMIN Superadministrador (21-11-2026)

Los formularios de gestión administrativa de cuentas (editar, cambiar rol principal, alta, baja lógica y reactivación) figuran en `dashboard/acceso`. Ver `docs/SUPERADMIN_CONTROL_PERMISOS_ADMIN_TI_2026-11-21.md`. No sustituye validaciones profesionales de SSOMA, Salud, Mantenimiento y RR. HH. **No desplegado en Vercel ni validado con PostgreSQL.**


## Compilación de ensayo de la Fase 02.3

Consultar `docs/GUIA_COMPILACION_FASE_02_3_2026-11-21.md`. El script `scripts/compilar-ensayo.sh` para Linux y los comandos PowerShell de la guía no realizan migraciones ni modifican la base de datos.


## Cambios de integridad — Fase 02.4 (21/11/2026)

Consultar `docs/FASE_02_4_INTEGRIDAD_EVIDENCIAS_Y_COMPILACION.md` y `docs/GUIA_COMPILACION_FASE_02_4_2026-11-21.md`. Compilación completa pendiente de ejecutar con dependencias y PostgreSQL de ensayo. Las actas nuevas tienen huella v3 y se conserva v1/v2.

## Fase 02.7 — Acceso con doble panel (21/11/2026)

Al iniciar sesión con una cuenta que tiene CONDUCTOR y otra función activa aparece `/seleccionar-panel`: **1. Administrativo (KCJ CONTROL)** y **2. Conductor (KCJ CONNECT)**. En la cabecera y el menú lateral se incluye «Cambiar panel» sin cerrar sesión. Los usuarios con un solo tipo de perfil entran directamente. Las funciones se asignan en Centro de Control sobre la **misma cuenta y ficha laboral**; el rol adicional CONDUCTOR requiere ficha de trabajador vinculada. Los cambios de rol revocan sesiones anteriores.

Este cambio no crea nuevas tablas ni modifica datos; requiere desplegar código y verificar roles/migraciones existentes en entorno de ensayo. La navegación de panel no sustituye los permisos de servidor. Guía: `docs/SELECCION_DOBLE_PANEL_2026-11-21.md`.
