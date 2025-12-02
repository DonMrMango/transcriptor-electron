# Guía de Deployment Blindado - Transcriptor Electron

## Versiones Bloqueadas

Este proyecto usa versiones **exactas** de todas las dependencias para evitar problemas de compatibilidad.

### Versiones Node/npm Requeridas

```
Node: >= 18.0.0
npm: >= 9.0.0
```

### Dependencias Python

```
Python 3.x con:
- groq
- ffmpeg-python
```

## Instalación Inicial (Máquina Nueva)

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd transcriptor-electron
```

### 2. Instalar dependencias exactas

**IMPORTANTE**: Usar `npm ci` en lugar de `npm install` para instalar las versiones exactas del package-lock.json:

```bash
npm ci
```

**NO uses** `npm install` ya que podría actualizar paquetes.

### 3. Verificar que Python esté instalado

```bash
python3 --version
```

### 4. Instalar dependencias Python

```bash
# Navega a la carpeta python-engine
cd ../python-engine

# Instala las dependencias
pip3 install groq ffmpeg-python

# Verifica que ffmpeg esté disponible
ffmpeg -version
```

### 5. Configurar API Key de Groq

La API key se guarda automáticamente en:
```
macOS: ~/Library/Application Support/transcriptor-electron/groq_api_key.txt
Linux: ~/.config/transcriptor-electron/groq_api_key.txt
Windows: %APPDATA%/transcriptor-electron/groq_api_key.txt
```

## Desarrollo

### Iniciar en modo desarrollo

```bash
npm start
```

### Build para producción

```bash
npm run package
```

Esto creará el ejecutable en `out/transcriptor-electron-darwin-x64/` (macOS).

## Actualización de Dependencias (Solo cuando sea necesario)

Si necesitas actualizar alguna dependencia específica:

```bash
# Ver qué paquetes tienen actualizaciones
npm outdated

# Actualizar un paquete específico a una versión exacta
npm install --save-exact <package>@<version>

# Regenerar package-lock.json
npm install

# Probar que todo funcione
npm start
```

## Respaldo del Estado Actual

Para hacer backup del estado actual funcionando:

```bash
# Copiar package.json y package-lock.json
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Guardar en git
git add package.json package-lock.json .npmrc
git commit -m "Lock dependencies to exact versions"
```

## Troubleshooting

### Si npm install actualizó paquetes accidentalmente

```bash
# Restaurar desde el backup
git checkout package.json package-lock.json

# Reinstalar con versiones exactas
rm -rf node_modules
npm ci
```

### Si Python no encuentra las dependencias

```bash
# Reinstalar dependencias de Python
pip3 install --force-reinstall groq ffmpeg-python
```

### Si hay conflictos de versiones de Node

Usar `nvm` (Node Version Manager):

```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar y usar Node 18
nvm install 18
nvm use 18
```

## Archivos Críticos (NO MODIFICAR)

- `package.json` - Versiones exactas de dependencias
- `package-lock.json` - Árbol completo de dependencias bloqueadas
- `.npmrc` - Configuración de npm para versiones exactas
- `src/types/electron.d.ts` - Tipos TypeScript para Electron API
- `src/preload.ts` - Bridge entre main y renderer process
- `src/index.ts` - Main process de Electron

## Base de Datos

La base de datos SQLite se crea automáticamente en:
```
macOS: ~/Library/Application Support/transcriptor-electron/transcriptions.db
```

Para respaldar el historial:
```bash
cp ~/Library/Application\ Support/transcriptor-electron/transcriptions.db ~/Desktop/backup.db
```

## Arquitectura del Proyecto

```
transcriptor-electron/
├── src/
│   ├── index.ts              # Main process (Electron)
│   ├── preload.ts            # Context bridge
│   ├── App.tsx               # React root
│   ├── components/
│   │   ├── MenuPanel.tsx     # Menú principal
│   │   ├── RecordingPanel.tsx # Grabación de audio
│   │   ├── ResultPanel.tsx   # Mostrar resultado
│   │   └── HistoryPanel.tsx  # Historial
│   └── types/
│       └── electron.d.ts     # Tipos TypeScript
├── python-engine/
│   └── cli.py               # CLI Python para transcripción
├── package.json             # Dependencias bloqueadas
├── package-lock.json        # Árbol de dependencias
└── .npmrc                   # Config npm
```

## Comandos npm Seguros

```bash
npm start        # Desarrollo
npm run package  # Build producción
npm run make     # Crear instalador
npm ci           # Instalar deps exactas
npm outdated     # Ver actualizaciones disponibles (solo consulta)
```

## Comandos npm PELIGROSOS (evitar)

```bash
npm install              # Puede actualizar paquetes
npm update               # Actualiza paquetes
npm audit fix            # Puede romper compatibilidad
npm audit fix --force    # MUY peligroso
```

## Notas de Seguridad

1. Las versiones están bloqueadas para evitar breaking changes
2. El archivo `.npmrc` fuerza el uso de versiones exactas
3. Siempre usar `npm ci` en lugar de `npm install` para deployment
4. El `package-lock.json` debe estar en el repositorio
5. Las dependencias Python también deben mantenerse estables
