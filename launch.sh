#!/bin/bash

# Script de lanzamiento para Transcriptor Electron
cd "$(dirname "$0")"

echo "🚀 Iniciando Transcriptor Electron..."

# Verificar/actualizar dependencias de Node.js
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de Node.js..."
    npm install
else
    echo "🔄 Verificando dependencias de Node.js..."
    npm install
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
