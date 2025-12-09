# Transcriptor Electron

Aplicación de escritorio para transcripción de audio usando Groq API (Whisper).

## Características

- 🎙️ **Grabar y transcribir** audio en tiempo real
- 📁 **Transcribir archivos** de audio existentes (MP3, WAV, M4A, etc.)
- 🎬 **Transcribir desde YouTube** - descarga y transcribe videos directamente desde URL
- 📄 **Herramientas PDF**:
  - Combinar múltiples PDFs
  - Dividir PDFs por rango de páginas
  - Extraer páginas específicas
  - Convertir imágenes a PDF
  - Convertir PDF a imágenes
- 📋 **Historial** de transcripciones guardadas localmente
- ⚡ Usa Whisper Large V3 Turbo vía Groq API

## Requisitos previos

- **Node.js** (v18 o superior)
- **npm** (v8 o superior)
- **Python 3** (v3.8 o superior)
- **pip** (gestor de paquetes de Python)

## Instalación y Uso

### Instalación Automática (Recomendado)

La forma más sencilla de instalar y ejecutar la aplicación es usando el script `launch.sh`:

```bash
# Clonar el repositorio
git clone https://github.com/DonMrMango/transcriptor-electron.git
cd transcriptor-electron

# Ejecutar script de instalación y lanzamiento
./launch.sh
```

El script `launch.sh` hace todo automáticamente:
- ✅ Instala dependencias de Node.js (si no existen)
- ✅ Crea el entorno virtual de Python (si no existe)
- ✅ Instala dependencias de Python en el venv
- ✅ Limpia cache de webpack
- ✅ Lanza la aplicación

**Nota:** En Windows, deberás crear un script equivalente `.bat` o seguir la instalación manual.

### Instalación Manual

Si prefieres instalar manualmente:

#### 1. Clonar el repositorio

```bash
git clone https://github.com/DonMrMango/transcriptor-electron.git
cd transcriptor-electron
```

#### 2. Instalar dependencias de Node.js

```bash
npm install
```

#### 3. Configurar entorno virtual de Python

**IMPORTANTE:** La aplicación requiere un entorno virtual de Python para funcionar correctamente:

```bash
# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
# En macOS/Linux:
source venv/bin/activate

# En Windows:
venv\Scripts\activate
```

#### 4. Instalar dependencias de Python

Con el entorno virtual activado:

```bash
pip install -r python-engine/requirements.txt
```

#### 5. Lanzar la aplicación

```bash
npm start
```

### Configurar API Key de Groq

Al iniciar la aplicación por primera vez, se te pedirá tu API key de Groq.

Si no tienes una, puedes obtenerla gratis en: [https://console.groq.com](https://console.groq.com)

La API key se guardará localmente en:
- macOS/Linux: `~/.config/transcriptor-electron/groq_api_key.txt`
- Windows: `%APPDATA%/transcriptor-electron/groq_api_key.txt`

### Acceso directo en macOS

Si usas macOS, hay un acceso directo en tu escritorio (`Transcriptor.app`) que puedes usar para lanzar la aplicación con doble click.

## Estructura del proyecto

```
transcriptor-electron/
├── src/                      # Código fuente de Electron
│   ├── index.ts             # Proceso principal
│   ├── App.tsx              # Interfaz React
│   └── preload.ts           # Bridge IPC
├── python-engine/           # Motor de transcripción
│   ├── cli.py              # CLI de Python para Groq API
│   └── requirements.txt    # Dependencias Python
├── venv/                    # Entorno virtual (ignorado en git)
└── package.json            # Dependencias Node.js
```

## Desarrollo

### Recompilar automáticamente

Durante el desarrollo, webpack recompilará automáticamente los cambios. Si necesitas reiniciar el proceso principal:

1. En la terminal donde corre la app, escribe: `rs`
2. O cierra y vuelve a ejecutar `npm start`

### Limpiar cache de webpack

Si experimentas problemas de compilación:

```bash
rm -rf .webpack
npm start
```

## Limitaciones Conocidas

### Indicador de micrófono en macOS

**Problema:** En macOS, el indicador naranja del micrófono puede permanecer activo después de detener la grabación, aunque el micrófono ya no esté siendo utilizado.

**Causa:** Esta es una limitación conocida de Electron en macOS ([Issue #44466](https://github.com/electron/electron/issues/44466)). macOS mantiene el indicador activo mientras el proceso de Electron tenga permisos de micrófono activos, independientemente de si el stream está activo o no.

**Verificación:** El micrófono SÍ se libera correctamente (puedes verificarlo en los logs de la consola), pero el indicador visual de macOS no se actualiza hasta que cierras la aplicación.

**Workaround:** Cerrar y volver a abrir la aplicación apagará el indicador. Esto es normal en muchas aplicaciones de Electron (Discord, Zoom, etc.).

## Solución de problemas

### Error: "Module not found" (Python)

Asegúrate de que:
1. El entorno virtual esté activado
2. Las dependencias de Python estén instaladas: `pip install -r python-engine/requirements.txt`

### Error: "API key not found"

La app te pedirá la API key en el primer inicio. Si necesitas cambiarla:
- Elimina el archivo: `~/.config/transcriptor-electron/api-key.txt`
- Reinicia la app y vuelve a ingresarla

### Error: "Port 3000 already in use"

Hay otra instancia corriendo. Ciérrala o ejecuta:

```bash
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Tecnologías

- **Electron** - Framework de aplicaciones de escritorio
- **React** - Interfaz de usuario
- **TypeScript** - Tipado estático
- **Python 3** - Motor de transcripción
- **Groq API** - Whisper Large V3 Turbo
- **pdf-lib** - Manipulación de PDFs
- **pdf2pic** - Conversión PDF a imágenes
- **sharp** - Procesamiento de imágenes
- **yt-dlp** - Descarga de videos de YouTube

## Licencia

MIT

## Autor

[@DonMrMango](https://github.com/DonMrMango)
