#!/bin/bash

# Script de lanzamiento para Transcriptor Electron
cd "$(dirname "$0")"

echo "🚀 Iniciando Transcriptor Electron..."

# Limpiar procesos residuales en puertos comunes
echo "🧹 Verificando procesos residuales..."
PORTS=(3000 3333 9000 9333)
for PORT in "${PORTS[@]}"; do
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "⚠️  Puerto $PORT ocupado por proceso $PID, cerrando..."
        kill -9 $PID 2>/dev/null
        sleep 0.5
    fi
done

# Verificar/actualizar dependencias de Node.js
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de Node.js..."
    npm install
else
    # Verificar si package.json cambió desde la última instalación
    if [ "package.json" -nt "node_modules" ]; then
        echo "⚠️  Detectados cambios en package.json"
        echo "🧹 Limpiando instalación anterior..."
        rm -rf node_modules package-lock.json
        echo "📦 Instalando dependencias desde cero..."
        npm install
    else
        echo "✅ Dependencias de Node.js actualizadas"
    fi
fi

# Verificar/crear entorno virtual de Python
if [ ! -d "venv" ]; then
    echo "🐍 Creando entorno virtual de Python..."
    python3 -m venv venv
    echo "📦 Instalando dependencias de Python..."
    source venv/bin/activate
    pip install -r python-engine/requirements.txt
else
    echo "🐍 Activando entorno virtual de Python..."
    source venv/bin/activate
fi

# Limpiar webpack cache si existe
if [ -d ".webpack" ]; then
    echo "🧹 Limpiando cache..."
    rm -rf .webpack
fi

# Iniciar la aplicación
echo "▶️  Lanzando aplicación..."
npm start
