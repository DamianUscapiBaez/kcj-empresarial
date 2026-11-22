# KCJ CONTROL — Fase 02.3: evidencias fotográficas por componente y firmas de custodia

**21/11/2026. Código de desarrollo para pruebas. No desplegado en Vercel ni probado con PostgreSQL/S3 reales.**

## Qué incorpora

La fase continúa la Fase 02.2. Se mantienen los espacios de firma ampliados para dedo, lápiz o mouse y las dos firmas por acta.

En la **recepción** de una unidad, cada componente de la entrega histórica dispone de controles para **tomar foto con cámara** o **elegir fotos de galería**. Se admiten hasta **4 fotografías por componente** (JPG, PNG o WebP, máximo 10 MB cada una). La acción de recepción verifica que los archivos estén subidos, que tengan el propósito CUSTODIA y que pertenezcan al operador autenticado. Exige al menos una foto si el componente se declara dañado, OBSERVADO o NO_CONFORME. Si solo está faltante y no hay daño observable, no se exige foto, pero sí observación escrita.

Las fotos quedan relacionadas con el componente de la **instantánea histórica del acta** y se incluyen en la vista imprimible, accesibles mediante un ID y comprobación de permisos en el servidor. El sistema rechaza duplicados de la misma clave en distintos componentes y mantiene un índice único de fotos de actas en la base.

Las actas nuevas incorporan `contentVersion = 2` y su huella SHA-256 incluye las **referencias a las fotografías por componente**. Para todas las actas previas a esta fase se conserva `contentVersion = 1` y su huella original **sin modificación**. La comparación entre el algoritmo original Fase 02.2 y la versión actual para un acta de prueba v1 produjo hashes idénticos.

**Precisión técnica:** la huella de versión 2 incluye las referencias a objetos S3, **NO el contenido binario de las imágenes**. El código no acredita que un administrador del almacenamiento no pueda sobrescribir esos objetos; para una custodia inmutable es necesario exigir versión de objeto S3, retención/Object Lock y/o guardar y verificar hashes criptográficos del contenido de los archivos. Hasta implementar y probar esas garantías, NO se debe afirmar que las fotografías son inalterables a nivel de almacenamiento. Las imágenes tampoco certifican la identidad de los firmantes.

## Archivos principales

- `prisma/schema.prisma`: campo `CustodyEvent.contentVersion`, relación `CustodyInventoryLine.photos` y nueva tabla `CustodyItemPhoto`.
- `prisma/migrations/20261121001100_fotos_por_componente_custodia/migration.sql`: nueva tabla y columna con valor predeterminado 1 para preservar actas históricas; migración aditiva.
- `lib/custodia-fotos.ts`: límites de cantidad, autorización e integridad de referencias y requerimiento de fotografía por daño.
- `components/dominio/FotosCustodiaUploader.tsx`: fotos de cámara o galería por componente; máximo 4 archivos.
- `app/actions-custodia.ts`: valida fotos y las relaciona en la misma transacción que crea una recepción.
- `lib/custodia-firmas.ts`: huella v1 compatible e incorporación de referencias fotográficas v2.
- `app/actions-firmas-custodia.ts`: carga del inventario con fotos para guardar la huella correspondiente a la versión del acta.
- `app/actas/custodia/[eventId]/page.tsx`: galería de imágenes por ítem para visualización y acta impresa.
- `app/api/actas/custodia/foto/[photoId]/route.ts`: acceso autenticado y enlace temporal privado por ID de fotografía.
- `tests/custodia-fotos.test.ts`: seis nuevas pruebas.
- `tests/estructura.test.ts`: refleja el nuevo modelo adicional en el esquema.

## Pruebas realmente realizadas

- `node --experimental-strip-types --test tests/*.test.ts`: **221/221 pruebas aprobadas** en entorno local; incluye 6 nuevas pruebas para fotos y hash.
- Análisis sintáctico TS/TSX con TypeScript global para los archivos modificados: **sin errores de parseo**.
- Comparación directa del cálculo hash v1 con el código original de Fase 02.2 usando la misma acta de prueba: **coincide**.
- Comprobación de ZIP y manifiesto SHA-256: indicada al empaquetar.

## Límites y ensayos pendientes (obligatorios antes de producción)

1. Instalar las dependencias del proyecto en un entorno aislado. Ejecutar `prisma validate`, `prisma generate`, `npm run typecheck`, `npm run build`. **No ejecutados aquí** por no disponer del entorno Node/Prisma completo.
2. Respaldar una base de PostgreSQL de **ensayo**, ejecutar la migración y probar idempotencia/concurrencia: actas simultáneas, clave de foto reutilizada, múltiples fotos, fotos caducadas y recuperación tras interrupción de carga.
3. Probar capturas con cámara, galería, orientación vertical/horizontal, baja conectividad y carga múltiple en Android y tablets; verificar la firma ampliada de ambos participantes.
4. Verificar autenticación y permisos por usuario, caducidad de las URLs de lectura, imágenes bloqueadas para terceros y acceso a actas antiguas.
5. Configurar y verificar S3 versioning/Object Lock o mecanismos equivalentes, plus integridad binaria por SHA-256 del objeto. Las referencias en DB no bastan para asegurar fotos inmutables.
6. Revalidar las reglas de habilitación/entrega, firmas obligatorias, sellado de tiempo y cumplimiento documental/minero con Operaciones, Mantenimiento, SSOMA y asesoría aplicable. La firma dibujada no es firma digital certificada.
7. Aprobación funcional de KCJ antes de publicar. **Ninguna migración sobre producción ni modificación de registros reales está autorizada en esta entrega.**

## Procedimiento sugerido para TI

Copia de seguridad cifrada → clonar entorno de ensayo → validar Prisma y tipado → migrar DB ensayo → ejecutar pruebas automatizadas → ensayo de cámara/firma/impresión con cuentas ficticias → probar concurrencia y recuperación → aprobar seguridad y operación → planificar publicación con rollback.
