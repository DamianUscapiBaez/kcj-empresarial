# KCJ CONTROL · Fase 02.1 — actas imprimibles sin alterar producción

**Base:** ZIP `KCJ_CONTROL_FASE_02_ENTREGA_RECEPCION_FLOTA_VARIADA_2026-11-21.zip`.

## Implementado en copia local

- Vista de consulta para cada acta en `/actas/custodia/[eventId]`, con sesión válida y autorización para ADMIN, Operaciones, Jefatura de Operaciones, Mantenimiento y SSOMA.
- Formato corporativo listo para imprimir o **Guardar como PDF desde el navegador**; incluye logo original, responsables, fecha peruana, kilometraje, combustible, inventario histórico, detalle de daños, observaciones, diferencias y revisiones.
- Enlace «Ver acta / PDF» junto a cada registro del historial de la unidad.
- La vista consulta `CustodyEvent` y sus líneas históricas, no el inventario vivo de la unidad. Las actas legadas sin detalle muestran aviso de regularización, sin inventar valores.
- El texto evita presentar como firma electrónica verificada las líneas de firma impresas.
- Corrección de permisos para que ADMIN pueda cargar y descargar evidencia en la categoría CUSTODIA, sin ampliar permisos de otras categorías.
- **Sin migración y sin modificación de registros operativos**; no se han tocado datos reales ni Vercel.

## Limitaciones y pendientes

- No es generación autónoma de PDF en el servidor; el usuario debe usar «Imprimir / guardar como PDF» del navegador.
- Las firmas electrónicas verificadas de ambas partes NO están implementadas. Las líneas impresas están en blanco y no certifican aceptación.
- Fotografías múltiples por componente/daño, validación documental integral de disponibilidad e integración real con PostgreSQL/S3 siguen pendientes.
- `prisma generate`, typecheck y build deben ejecutarse con dependencias y configuración de ensayo antes de un despliegue.

## Criterios de aceptación

1. El usuario sin rol autorizado no accede al acta por URL directa.
2. Cada registro del historial abre **su propio** documento con sus líneas históricas.
3. Un cambio posterior del inventario vivo no modifica una copia histórica.
4. Recepciones con diferencias detallan motivo y estado de resolución; actas antiguas sin inventario muestran regularización.
5. El PDF del navegador imprime el documento sin botones de navegación y sin afirmar que ya está firmado.
6. ADMIN puede adjuntar evidencia de custodia; roles ajenos al proceso siguen sin permiso.

**Estado:** desarrollo local, pendiente de validación en staging. No publicar hasta superar integración, permisos y aprobación operativa.
