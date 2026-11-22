# KCJ CONTROL · Fase 02.2 — Firmas manuscritas ampliadas en actas

Fecha: 21/11/2026. **Código para pruebas; NO publicado.** Se basa en la copia de Fase 02.1, no modifica datos reales ni se conecta a Vercel.

## Cómo opera

1. Operaciones registra una entrega o devolución con inventario histórico. Las firmas se capturan **después** de guardar el documento y no sobre datos aún editables.
2. En el historial, abre **Ver acta, firmar / PDF**. El formulario muestra dos recuadros: quien entrega y quien recibe. Se muestran además el conteo 0/2, 1/2 o 2/2.
3. Al tocar o hacer clic en cualquiera de ellos se abre una **ventana ampliada casi a pantalla completa**. Funciona con dedo, lápiz táctil o mouse; evita el desplazamiento de la página al dibujar. Puedes girar el celular en horizontal. La firma se dibuja dentro del área grande, no en el recuadro pequeño.
4. Se puede **Borrar y repetir**, **Cancelar** o **Confirmar firma**. Para confirmar el operador certifica haber presenciado que esa persona revisó el acta y firmó. Un garabato demasiado breve o vacío se rechaza como validación básica, no biométrica.
5. El trazo se exporta a PNG manteniendo el aspecto del lienzo en alta resolución, se carga al almacenamiento privado de evidencias (S3) y se confirma la carga; luego una Server Action registra la firma en base de datos.
6. Cada firma conserva acta vinculada, lado, nombre ya consignado en el acta, fecha/hora del servidor, operador capturador y huella SHA-256 de los datos originales. El sistema no permite volver a registrar otra firma del mismo lado. No admite una firma retroactiva si ya existe un acta posterior de esa unidad.
7. La copia imprimible muestra las firmas disponibles. Si falta una firma, muestra pendiente y deja línea en blanco para una impresión física.

## Seguridad y alcance

- Solo usuarios con rol ADMIN, OPERACIONES o JEFE_OPERACIONES pueden **capturar**. ADMIN, OPERACIONES, JEFE_OPERACIONES, MANTENIMIENTO y SSOMA pueden **consultar** según permisos de custodia.
- Todas las firmas se guardan como evidencia CUSTODIA privada. El acceso a la imagen se autoriza por ID de firma en una ruta autenticada que emite una URL temporal de lectura.
- La validación de testigo es **una declaración del operador**, no una verificación biométrica ni una firma digital con certificado. No se debe afirmar que la identidad esté legalmente certificada por el trazo.
- La huella SHA-256 cubre datos del evento e inventario originales, no resoluciones administrativas posteriores de discrepancias. No equivale a sellado de tiempo cualificado.
- Los estados de Mantenimiento, SSOMA, documentación y disponibilidad no se modifican con una firma; la captura de firmas no libera unidades.
- Se conserva el requisito de respaldo fotográfico/evidencia original al crear el acta. No se han implementado aún múltiples fotos por componente, firma individual autónoma desde cuenta personal del conductor o custodia inmutable a nivel de objeto S3.

## Archivos principales

- `components/dominio/FirmaCustodiaAmpliada.tsx`: interfaz táctil de pantalla ampliada y exportación PNG.
- `lib/custodia-trazos.ts`: validación geométrica básica del trazo en cliente.
- `lib/custodia-firmas.ts`: lados, firmante y huella SHA-256 de acta, exclusivamente en servidor.
- `app/actions-firmas-custodia.ts`: autorización, verificación de evidencia, asociación única, auditoría e idempotencia por restricción única.
- `app/api/actas/custodia/firma/[signatureId]/route.ts`: autorización de visualización de imágenes.
- `app/actas/custodia/[eventId]/page.tsx`: recuadros y firmas impresas.
- `app/dashboard/custodia/[vehicleId]/page.tsx`: flujo explicado y conteo 0/2 a 2/2.
- `prisma/schema.prisma` + `prisma/migrations/20261121001000_firma_manuscrita_custodia/migration.sql`: tabla aditiva `CustodySignature`.
- `tests/custodia-firmas.test.ts`: 4 pruebas nuevas.

## Qué se probó realmente

- `npm test`: **215/215 aprobadas** en ejecución de Node local (incluye 4 pruebas nuevas).
- Revisión sintáctica TS/TSX con TypeScript para los archivos modificados: sin errores de análisis sintáctico.
- Manifiesto SHA-256 y archivo ZIP verificados localmente.

## Qué falta probar antes de usarlo con personal real

1. Instalar dependencias de la versión exacta, ejecutar `prisma validate`, `prisma generate`, `npm run typecheck` y `npm run build`.
2. Hacer copia cifrada y aplicar las migraciones pendientes **primero en PostgreSQL de ensayo**; probar rollback controlado sin `migrate reset` de producción.
3. Pruebas con dispositivos reales: Chrome Android, tablet, rotación de pantalla, lápiz, mouse, Escape, borrado, firma de ambas partes, impresión/PDF y recuperación de cargas fallidas.
4. Integración con S3 de ensayo: carga PNG, descarga privada, sesión caducada, permisos, validación de objeto y protección de inmutabilidad/versionado del objeto almacenado (no acreditada en esta copia).
5. Pruebas concurrentes: dos usuarios intentando firmar el mismo lado, intentos de duplicación, enlace de otro evento, acta antigua, ausencia de inventario y claves de evidencia ajenas.
6. Confirmar con Operaciones y asesoría correspondiente requisitos de identidad, consentimiento y formalidad probatoria para un uso contractual específico.
7. Decidir si deben exigirse **ambas firmas** para pasar de un estado de acta a otro; no se cambió esa regla sin aprobación.

**No modificar ni publicar registros reales desde este paquete hasta terminar la validación de TI, Operaciones y SSOMA.**
