#!/bin/bash
echo "🚀 Instalando dependencias Wheels Sabana..."
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
echo "✅ Instalación completa. Ejecuta: npm run dev"
