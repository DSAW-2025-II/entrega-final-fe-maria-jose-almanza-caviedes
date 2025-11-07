Write-Host "🚀 Instalando dependencias Wheels Sabana..."
Push-Location frontend; npm install; Pop-Location
Push-Location backend; npm install; Pop-Location
Write-Host "✅ Instalación completa. Ejecuta: npm run dev:win"
