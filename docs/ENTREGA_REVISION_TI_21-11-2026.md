# KCJ CONTROL - Entrega revisada para TI (21/11/2026)

**Base:** `KCJ_CONTROL_EMPRESARIAL_NUEVO_NEXTJS_CODIGO_FUENTE_TI.zip` (se mantiene el original sin modificar). **Esta entrega NO certifica una plataforma empresarial terminada.** Su objetivo es corregir errores verificables y proporcionar al técnico comandos reproducibles para ejecutar el proyecto con Next.js 15, Prisma 6, PostgreSQL y Vercel. Es código fuente editable, no un instalador de Windows.

## Cambios reales en el código

1. Se corrigió la exclusión de Operaciones y Jefatura de Operaciones al registrar homologaciones. Los perfiles antiguos de homologación se conservan por compatibilidad como permisos, **sin crear un departamento nuevo**.
2. Almacén ahora es un módulo compartido: Operaciones y Jefatura pueden crear artículos/mover existencias; RR. HH., SSOMA, Mantenimiento y Gerencia consultan el inventario central. El perfil legacy `ALMACEN` sigue como custodio autorizado, **no como área independiente**. No se crean inventarios duplicados.
3. El menú agrupa funcionalidades por responsables (Operaciones incluye ROSTER, Tareo, Flota, Homologación y Custodia; Almacén aparece como herramienta compartida), manteniendo **todas las rutas existentes**.
4. Se reparó el uso incorrecto de caché de npm en los tres workflows de GitHub Actions: el ZIP original NO trae `package-lock.json`. Hasta que TI genere y versiona un lockfile, los workflows usan `npm install` sin la opción de caché que fallaba por ausencia del lock. Después de generar y versionar el lock, usar `npm ci`.
5. Añadida comprobación segura de contraseña inicial `npm run db:check-login` (no imprime contraseñas) y comprobación de TODAS las tablas Prisma `npm run db:verify`, mostrando base y esquema consultados. La inicialización y la autenticación siguen siendo procesos separados.
6. Añadido `npm run db:diagnose`, que valida sin conectarse a la base la correspondencia de modelos con la migración SQL inicial.
7. En `/api/evidencias/descargar` el conductor ya no puede recuperar archivos CONNECT ajenos solo por conocer una clave; solo el cargador o el personal competente puede obtener el enlace.
8. Se aplica un control adicional de rol para cada tipo de CSV exportado, evitando que RR. HH. exporte todos los reportes SSOMA indiscriminadamente.

## Qué está verificado en este entorno

- `npm test`: **59 pruebas locales aprobadas** (reglas y verificaciones estructurales, no E2E).
- 43 archivos `.ts` y `.tsx` analizados sintácticamente sin errores de análisis.
- `npm run db:diagnose`: 31 modelos Prisma y 31 declaraciones `CREATE TABLE` en la migración inicial, sin nombres de tablas faltantes.
- Integridad del ZIP y manifiesto SHA256 por archivo, una vez empaquetado.

## Qué NO está verificado aquí

- Instalación real de npm (sin acceso al registro público `registry.npmjs.org` desde este entorno).
- `prisma validate`, `prisma migrate deploy`, `prisma generate`, `typecheck` con dependencias, `next build` y navegador real.
- API en Vercel con PostgreSQL cloud, S3, acceso desde teléfonos, pruebas offline, concurrencia y restauración.
- Equivalencia completa con las pantallas, procesos y cuestionarios históricos V17-V23; todavía hay diferencias conocidas en Aula Virtual (materiales/refuerzo/versiones), CONNECT offline, PDF/actas e indicadores. **No cargar información real sensible ni depender exclusivamente del sistema hasta superar las pruebas.**

## Procedimiento recomendado para TI — primera instalación en base nueva

1. Extraer el ZIP. Abrir un terminal EN la carpeta donde se encuentra `package.json`.
2. Verificar Node 22+ (`node -v`), `npm -v` y `npm run db:diagnose`.
3. Crear PostgreSQL cloud y una base vacía; establecer copias de seguridad antes del uso real. No borrar bases existentes.
4. Configurar `.env` privadamente a partir de `.env.example`. Usar `DATABASE_URL` de la misma base que utilizará Vercel. Establecer las variables `KCJ_ADMIN_DOCUMENT`, `KCJ_ADMIN_NAME`, `KCJ_ADMIN_PASSWORD` (>=16 caracteres); nunca subir `.env` a Git.
5. Ejecutar los comandos **en orden**, deteniéndose ante el primer error:

```bash
npm install --no-audit --no-fund
npx prisma validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:verify
npm run db:check-login
npm test
npm run typecheck
npm run build
npm run dev
```

6. Abrir `http://localhost:3000/api/health` (debe indicar `status: ok`), luego `http://localhost:3000/login`, entrar con el usuario y contraseña creados desde los secretos; cambiar la contraseña inicial. Verificar accesos de roles en una **base de prueba**, no en producción.
7. Una vez ejecutado `npm install` correctamente se generará `package-lock.json`. Versionarlo en el repositorio privado; adaptar CI para usar `npm ci`. No comprometer `.env` ni información personal.
8. Configurar las mismas conexiones y almacenamiento privado en Vercel. La publicación web NO aplica automáticamente migraciones ni ejecuta seed; las acciones manuales de GitHub requieren los secretos del entorno `kcj-produccion`.

## Diagnóstico si TI sigue viendo base vacía

- Error `P1012`: revisar el mensaje exacto y `npx prisma validate`.
- Error `P1001` o `P1000`: accesibilidad de PostgreSQL o autenticación; no borrar tablas.
- `db:verify` informa tabla faltante: migración no ejecutada en esa base/esquema.
- Tablas sí, cuenta ADMIN no: falta seed o sus secretos.
- Cuenta ADMIN sí pero login falla: ejecutar `db:check-login` solo en primer acceso (antes de cambiar la contraseña). Si ya se cambió, probar la nueva contraseña en `/login` y revisar bloqueos.
- GitHub muestra tablas pero Vercel no: comparar **base y esquema** de `DATABASE_URL` en ambos entornos sin compartir cadenas con contraseñas.
- Error al subir evidencia: revisar S3 privado y CORS; `DATABASE_URL` no almacena las fotos.
- Conservar capturas y logs del **primer error**, con claves ocultas.

## Marcha blanca

Primero aceptar técnicamente las funciones básicas de alta, guardado, consulta, modificación trazable, permisos, almacenamiento privado, respaldo y restauración. El refinamiento de interfaz, ampliaciones de cuestionarios y reportes puede continuar orgánicamente, **pero las reglas críticas de seguridad y persistencia son un requisito previo**.

### Fatiga y Somnolencia (F&S)

El correo adjuntado el 21/11/2026 pide registros de evaluación de ROSTER/horario, herramienta de fatiga del supervisor, pausas activas y seguimiento del Anexo 06. Se incorporan a la especificación de SSOMA y Operaciones, pero **NO están programados como formularios certificados en esta revisión**: los formatos y dos adjuntos del correo no han sido aportados para reproducir sus campos reales. No afirmar cumplimiento documental sin esos formatos.
