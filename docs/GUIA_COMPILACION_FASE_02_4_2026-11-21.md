# Compilación y aceptación — KCJ CONTROL fase 02.4

## Preparación

Extraer la carpeta `KCJ_CONTROL_EMPRESARIAL_UNIFICADO` a un directorio vacío en Windows o Linux. Requisitos: Node.js >=22, acceso a npm, PostgreSQL 16 de **ensayo**, credenciales S3 de **ensayo**. Mantener `.env` fuera del ZIP/repositorio. La compilación no necesita acceso a Vercel producción ni a sus datos.

## Windows PowerShell

```powershell
cd KCJ_CONTROL_EMPRESARIAL_UNIFICADO
$env:KCJ_ENTORNO_ENSAYO="SI"
$env:DATABASE_URL="postgresql://USUARIO:CLAVE@HOST_DE_ENSAYO:5432/kcj_ensayo?schema=public"
.\scripts\compilar-ensayo.ps1
```

## Linux/macOS

```bash
cd KCJ_CONTROL_EMPRESARIAL_UNIFICADO
export KCJ_ENTORNO_ENSAYO=SI
export DATABASE_URL='postgresql://USUARIO:CLAVE@HOST_DE_ENSAYO:5432/kcj_ensayo?schema=public'
bash scripts/compilar-ensayo.sh
```

**Importante:** los scripts solo verifican el manifiesto, instalan dependencias y ejecutan Prisma validate/generate, `npm test`, TypeScript y Next build. NO ejecutan migraciones ni semillas. Las URLs de arriba son marcadores de ejemplo: sustituir solamente por un PostgreSQL de ensayo bajo control TI.

## Validación del servidor y la migración (por TI)

Con una copia restaurable de PostgreSQL 16 de ensayo y tras revisar la migración aditiva `prisma/migrations/20261121001200_custodia_firma_v3_y_evidencias_tamano/migration.sql`, TI puede ejecutar `npx prisma migrate deploy` **únicamente** con credenciales de ensayo. Después revisar los procesos de entrega, recepción, diferencias, fotos y firmas con personas y unidades **ficticias**. Nunca ejecutar los scripts sobre producción sin aprobación.

## Alcances del informe actual

- Se ejecutaron **226/226** pruebas locales sin dependencias completas, y la sintaxis de **108** archivos TS/TSX se analizó con el parser de TypeScript instalado en este entorno.
- La instalación npm y `next build` no pudieron ejecutarse aquí: `registry.npmjs.org` respondió `getaddrinfo EAI_AGAIN`. No se generó `package-lock.json` y NO se afirma tipado o build exitoso.
- Validar el proveedor S3 compatible con `If-None-Match: *` y su configuración CORS. Configurar retención/versionado y política que impida borrar o sobrescribir evidencias originales.
- Verificar permisos por cargo, controles sobre documentación y homologación de unidades, uso táctil real y respaldo/rollback. Obtener aprobaciones de Operaciones, SSOMA, Mantenimiento y TI antes de publicar.

**No se ha desplegado la fase 02.4 ni realizado cambios en datos reales.**
