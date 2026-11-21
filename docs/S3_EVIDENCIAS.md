# Evidencias privadas S3 para Vercel

Crear bucket privado (bloqueo de acceso público). Configurar `KCJ_S3_BUCKET`, `KCJ_S3_REGION`, `KCJ_S3_ACCESS_KEY_ID`, `KCJ_S3_SECRET_ACCESS_KEY`; `KCJ_S3_ENDPOINT` si el proveedor es compatible S3; permitir los métodos PutObject, GetObject y HeadObject solo al prefijo `kcj/`. No dar permisos de eliminación a la cuenta web.

Configurar CORS del bucket únicamente para el dominio real de KCJ en los métodos PUT y HEAD/GET necesarios, permitiendo header `Content-Type`. Ejemplo de política CORS, **adaptar dominio real**:

```json
[{"AllowedOrigins":["https://dominio-real-de-kcj.example"],"AllowedMethods":["PUT","GET","HEAD"],"AllowedHeaders":["Content-Type"],"MaxAgeSeconds":300}]
```

No usar literalmente el dominio `.example`; sustituir por dominio de Vercel/empresa. Validar un PDF y un JPG por cada rol. La descarga se autoriza por tipo de evidencia y cargo; los enlaces duran solo 60 segundos. Reforzar permisos objeto/expediente y retención antes de guardar documentos laborales sensibles. **No subir historias clínicas.**
