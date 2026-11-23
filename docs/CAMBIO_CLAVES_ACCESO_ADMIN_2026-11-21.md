# KCJ CONTROL: acceso y contraseñas administradas por ADMIN

## Política aplicada
- ADMIN asigna una contraseña individual al crear cada cuenta (mínimo 8 caracteres). No se fuerza cambio durante el primer inicio de sesión. La contraseña asignada permanece válida hasta que sea cambiada o restablecida.
- ADMIN puede restablecer la contraseña de **otro usuario activo** desde Acceso y usuarios; debe confirmarla dos veces y volver a ingresar su propia contraseña de ADMIN para autorizar el restablecimiento. La contraseña anterior no puede consultarse porque se almacena como hash scrypt con sal.
- Restablecer una contraseña revoca las sesiones activas de esa cuenta; el colaborador tendrá que entrar otra vez con la nueva contraseña. La acción se audita sin registrar la clave.
- ADMIN cambia su propia contraseña por el enlace **Cambiar mi contraseña**, proporcionando la contraseña actual. Un colaborador también puede cambiar voluntariamente la suya.
- Se mantienen los límites de intentos de acceso (5 intentos; bloqueo temporal). Las cuentas inactivas no permiten acceso ni restablecimiento hasta su reactivación autorizada.

## Instalación y aceptación
1. Aplicar migración `20261121000600_claves_administradas_sin_cambio_obligatorio` **primero en PostgreSQL de pruebas**. Solo cambia DEFAULT; no altera registros existentes.
2. Comprobar login de cuenta nueva y de cuenta antigua `mustChangePassword=true`: ambas llegan al panel sin redirección obligatoria.
3. Comprobar que ADMIN restablece clave a otro usuario, deja auditoría, invalida sus sesiones y permite ingresar con la nueva; la anterior debe fallar.
4. Comprobar denegación de restablecimiento por usuario no ADMIN y al seleccionar la cuenta propia desde esa acción. Probar cambio voluntario de clave propia con clave actual.
5. Comprobar que ninguna pantalla ni exportación enseña los hashes o contraseñas actuales y que los cambios se hicieron solo sobre datos ficticios.
6. Ejecutar `npm ci`, `npm run check`, migraciones y despliegue controlado, después verificar en Vercel. **Este paquete aún no se ha publicado.**

## Seguridad
No compartir claves en el grupo WhatsApp ni usar la misma contraseña para varias cuentas. ADMIN entrega la contraseña inicial por canal privado; se recomienda que cada colaborador la cambie voluntariamente cuando le resulte posible.
