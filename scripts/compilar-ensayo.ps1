# Ejecutar desde PowerShell en entorno de ENSAYO solamente.
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))
if ($env:KCJ_ENTORNO_ENSAYO -ne "SI") { throw "Configure KCJ_ENTORNO_ENSAYO=SI en entorno aislado." }
if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) { throw "Configure DATABASE_URL de PostgreSQL de ensayo (nunca producción)." }
node scripts/verificar-paquete.mjs
if ($LASTEXITCODE -ne 0) { throw "Falló verificación de integridad" }
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "Falló npm install; compruebe acceso al registro npm" }
npx --no-install prisma validate
if ($LASTEXITCODE -ne 0) { throw "Falló prisma validate" }
npx --no-install prisma generate
if ($LASTEXITCODE -ne 0) { throw "Falló prisma generate" }
npm test
if ($LASTEXITCODE -ne 0) { throw "Fallaron tests" }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Falló TypeScript" }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Falló compilación Next.js" }
Write-Host "Compilación terminada. Sigue pendiente integración con PostgreSQL y dispositivos reales de ENSAYO." -ForegroundColor Green
