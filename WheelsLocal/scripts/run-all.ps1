Param([switch]$NoDocker)
$ErrorActionPreference = "Stop"
function Write-Step($m){Write-Host "STEP: $m" -ForegroundColor Cyan}
function Write-Ok($m){Write-Host "OK: $m" -ForegroundColor Green}
function Write-Warn($m){Write-Host "WARN: $m" -ForegroundColor Yellow}

# Helper: wait until an HTTP endpoint returns 200 OK (or any 2xx) with retries
function Wait-HttpOk {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [int]$TimeoutSec = 240,
    [int]$IntervalSec = 3
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
        Write-Ok "Endpoint OK: $Url ($($resp.StatusCode))"
        return $true
      }
      Write-Warn "Endpoint $Url respondió $($resp.StatusCode); reintentando en ${IntervalSec}s"
    } catch {
      Write-Warn "Aún no disponible: $Url -> $($_.Exception.Message)"
    }
    Start-Sleep -Seconds $IntervalSec
  }
  Write-Warn "Timeout esperando $Url tras ${TimeoutSec}s"
  return $false
}

Set-Location (Join-Path $PSScriptRoot "..")

Write-Step "Verificando Node.js 18+"
$nodeVersion = (& node -v) 2>$null
if (-not $nodeVersion){ throw "Node.js no está instalado o no está en PATH." }
$ver = $nodeVersion.TrimStart('v'); try{$verObj=[version]$ver}catch{$verObj=[version]"0.0.0"}
if ($verObj -lt [version]"18.0.0"){ Write-Warn "Se recomienda Node 18+. Detectado: $nodeVersion" } else { Write-Ok "Node $nodeVersion" }

if (-not $NoDocker -and (Test-Path ".\docker-compose.yml") -and (Get-Command docker -ErrorAction SilentlyContinue)){
  Write-Step "Levantando servicios Docker (Mongo/Redis)"; try{ docker compose up -d | Out-Null; Write-Ok "Docker OK" }catch{ Write-Warn "Docker error: $($_.Exception.Message)" }
}

function Ensure-NpmInstall($d){ Push-Location $d; try{ if (-not (Test-Path "node_modules")){ Write-Step "npm install en $d"; npm install | Out-Null; Write-Ok "Instalado $d"} else { Write-Ok "node_modules existe en $d"} } finally { Pop-Location } }
Ensure-NpmInstall "."; Ensure-NpmInstall "frontend"; Ensure-NpmInstall "backend"

# Ensure @vitejs/plugin-react
$pluginPkg = Join-Path $PWD "frontend\node_modules\@vitejs\plugin-react\package.json"
if (-not (Test-Path $pluginPkg)){ Write-Step "Instalando @vitejs/plugin-react"; Push-Location "frontend"; npm i -D @vitejs/plugin-react | Out-Null; Pop-Location; Write-Ok "Plugin react instalado" } else { Write-Ok "Plugin react presente" }

if (-not (Test-Path ".\backend\.env") -and (Test-Path ".\backend\.env.example")){
  Write-Step "Creando backend/.env"; Copy-Item ".\backend\.env.example" ".\backend\.env"; Write-Warn "Ajusta GOOGLE_MAPS_KEY si usarás /maps/distance"; Write-Ok ".env creado"
}

Write-Step "Iniciando backend (http://localhost:4000)"; Start-Process cmd -ArgumentList '/k','cd /d backend && npm run start'
Start-Sleep -Seconds 2
Write-Step "Iniciando frontend (http://localhost:5173)"; Start-Process cmd -ArgumentList '/k','cd /d frontend && npm run dev'

# Esperar a que los servicios estén listos antes de abrir el navegador
Write-Step "Esperando a que el backend esté listo (health)"
$beReady = Wait-HttpOk -Url "http://localhost:4000/health" -TimeoutSec 180 -IntervalSec 3
Write-Step "Esperando a que el frontend responda"
$feReady = Wait-HttpOk -Url "http://localhost:5173" -TimeoutSec 240 -IntervalSec 3

Write-Step "Abriendo URLs"
if ($beReady) { Start-Process "http://localhost:4000/health"; Start-Process "http://localhost:4000/api-docs" } else { Write-Warn "Backend no respondió a tiempo" }
if ($feReady) { Start-Process "http://localhost:5173" } else { Write-Warn "Frontend no respondió a tiempo" }
Write-Ok "Listo."
