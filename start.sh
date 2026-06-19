#!/bin/bash

# Script para iniciar el backend y el frontend concurrentemente

# Matar procesos en puertos 5000 y 5173 por si quedaron colgados
echo "Limpiando puertos..."
fuser -k 5000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

echo "Iniciando Servidor API Node.js/Express (Puerto 5000)..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "Iniciando Servidor Frontend React/Vite (Puerto 5173)..."
cd ../frontend
npm run dev -- --host &
FRONTEND_PID=$!

# Función para detener ambos servidores al salir
cleanup() {
  echo ""
  echo "Deteniendo servidores..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit
}

trap cleanup SIGINT SIGTERM EXIT

echo "--------------------------------------------------------"
echo "¡Todo listo!"
echo "• Servidor API: http://localhost:5000"
echo "• Cliente React: http://localhost:5173"
echo "--------------------------------------------------------"
echo "Presiona Ctrl+C para detener ambos servidores."

# Mantener script activo
wait
