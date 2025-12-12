# Guía de Distribución y Actualización - Transcriptor

Esta guía explica cómo generar builds distribuibles y cómo funciona el sistema de auto-actualización.

## 📦 Generar Builds Distribuibles

### Opción 1: Build Local (Solo para Testing)

```bash
# Generar el package (empaqueta la app sin crear instaladores)
npm run package

# Generar instaladores completos para tu plataforma actual
npm run make
```

Los builds se generarán en la carpeta `out/`:
- **macOS**: `out/make/` contendrá el DMG y/o ZIP
- **Windows**: `out/make/squirrel.windows/` contendrá el instalador
- **Linux**: `out/make/` contendrá DEB/RPM

### Opción 2: Publicar en GitHub Releases (Recomendado)

Este método crea una release en GitHub y habilita auto-updates para tus usuarios.

#### Paso 1: Configurar GitHub Token

Necesitas un GitHub Personal Access Token con permisos de `repo`:

1. Ve a https://github.com/settings/tokens
2. Clic en "Generate new token (classic)"
3. Selecciona el scope `repo` (acceso completo al repositorio)
4. Copia el token generado

Configura el token en tu terminal:

```bash
export GITHUB_TOKEN="tu_token_aqui"
```

#### Paso 2: Incrementar Versión

Antes de publicar, actualiza la versión en `package.json`:

```bash
# Para parches (bug fixes): 1.0.0 -> 1.0.1
npm version patch

# Para features nuevas: 1.0.0 -> 1.1.0
npm version minor

# Para cambios breaking: 1.0.0 -> 2.0.0
npm version major
```

Esto actualizará automáticamente el `package.json` y creará un commit con tag de git.

#### Paso 3: Publicar

```bash
# Generar builds y publicar en GitHub Releases
npm run publish
```

Esto:
1. Genera builds para tu plataforma actual
2. Crea un **draft release** en GitHub
3. Sube los instaladores como assets

#### Paso 4: Publicar Release en GitHub

1. Ve a https://github.com/DonMrMango/transcriptor-electron/releases
2. Encontrarás un draft con tu versión
3. Edita la descripción (changelog)
4. Clic en "Publish release"

**¡Listo!** Tus usuarios ahora recibirán notificaciones de actualización automáticamente.

## 🔄 Sistema de Auto-Updates

### Cómo Funciona

1. La app verifica actualizaciones al iniciar (después de 3 segundos)
2. Verifica nuevamente cada hora
3. Si hay una actualización disponible:
   - Se muestra un diálogo al usuario
   - Usuario puede descargar o postponer
   - Una vez descargada, se notifica para reiniciar
4. Al reiniciar, la actualización se instala automáticamente

### Verificación Manual

Los usuarios pueden verificar actualizaciones manualmente desde el menú:

- **macOS**: `Transcriptor → Buscar Actualizaciones...`
- **Windows**: `Ayuda → Buscar Actualizaciones...`

### Desactivar Auto-Updates en Desarrollo

El auto-updater solo funciona cuando la app está empaquetada (`app.isPackaged`). En modo desarrollo (`npm start`) no se ejecuta.

## 📱 Iconos de la Aplicación

Para tener iconos profesionales, necesitas crear:

### macOS (.icns)

1. Crea un PNG de 1024x1024px
2. Usa una herramienta online como https://cloudconvert.com/png-to-icns
3. Guarda el archivo como `assets/icons/icon.icns`

### Windows (.ico)

1. Usa el mismo PNG de 1024x1024px
2. Convierte a ICO con https://cloudconvert.com/png-to-ico
3. Guarda el archivo como `assets/icons/icon.ico`

### Habilitar Iconos

Una vez tengas los archivos, descomenta estas líneas en `forge.config.ts`:

```typescript
packagerConfig: {
  icon: './assets/icons/icon', // Quitar comentario
}
```

Y en el maker de Squirrel:

```typescript
new MakerSquirrel({
  setupIcon: './assets/icons/icon.ico', // Ya está configurado
})
```

## 🚀 Distribución a Colegas

### Opción A: GitHub Releases (Recomendado)

1. Publica la release siguiendo los pasos anteriores
2. Comparte el link: `https://github.com/DonMrMango/transcriptor-electron/releases/latest`
3. Usuarios descargan el instalador apropiado:
   - **macOS**: `Transcriptor-{version}.dmg` o `.zip`
   - **Windows**: `Transcriptor Setup {version}.exe`
   - **Linux**: `transcriptor_{version}_amd64.deb`

**Ventajas**:
- Auto-updates funcionan automáticamente
- Siempre tienen acceso a la última versión
- Estadísticas de descargas

### Opción B: Google Drive / Dropbox

Si prefieres compartir por Drive:

```bash
# Genera el build
npm run make

# Los instaladores están en out/make/
# Sube el DMG/EXE/DEB a Google Drive
```

**Desventajas**:
- No hay auto-updates
- Tienes que redistribuir manualmente cada actualización

### Opción C: Instalador Universal (ZIP)

Para compartir la app empaquetada sin instalador:

```bash
npm run package

# En macOS: out/{productName}-darwin-x64/{productName}.app
# En Windows: out/{productName}-win32-x64/
```

Comprime la carpeta y comparte el ZIP. Usuarios solo extraen y ejecutan.

## 📋 Checklist Pre-Release

Antes de cada release:

- [ ] Actualizar versión en `package.json`
- [ ] Probar la app en modo development
- [ ] Verificar que las dependencias están actualizadas
- [ ] Escribir changelog (qué cambios incluye la versión)
- [ ] Generar el build: `npm run publish`
- [ ] Verificar que el draft se creó en GitHub
- [ ] Editar la descripción del release
- [ ] Publicar el release

## 🐛 Troubleshooting

### "Could not find matching credentials"

Asegúrate de haber configurado `GITHUB_TOKEN`:
```bash
export GITHUB_TOKEN="tu_token_aqui"
```

### "App is not signed" (macOS)

Para distribuir en macOS sin code signing:
```bash
# Los usuarios deben hacer clic derecho → Abrir la primera vez
```

Para signing profesional, necesitas:
1. Apple Developer Account ($99/año)
2. Certificado de desarrollador
3. Configuración de notarization

### Build Falla con Módulos Nativos

Si tienes problemas con `better-sqlite3`, `canvas`, o `sharp`:

```bash
# Reinstala módulos nativos
npm run postinstall
```

## 📚 Recursos

- [Electron Forge Docs](https://www.electronforge.io/)
- [electron-updater Docs](https://www.electron.build/auto-update)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
