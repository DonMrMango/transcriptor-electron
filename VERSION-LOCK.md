# Control de Versiones Bloqueadas

**Última actualización**: 2 de Diciembre, 2024

## Por qué usamos versiones exactas

Este proyecto usa versiones **exactas** (sin `^` o `~`) para garantizar que:

1. El proyecto funcione exactamente igual en cualquier máquina
2. No haya sorpresas con actualizaciones automáticas
3. Los builds sean reproducibles
4. No se rompan dependencias por cambios upstream

## Versiones Actuales Bloqueadas

### Runtime
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Python**: 3.x

### Electron Stack
- **electron**: 39.2.4
- **@electron-forge/cli**: 7.10.2
- **@electron-forge/plugin-webpack**: 7.10.2

### React
- **react**: 19.2.0
- **react-dom**: 19.2.0
- **@types/react**: 19.2.7
- **@types/react-dom**: 19.2.3

### TypeScript
- **typescript**: 4.5.5
- **ts-loader**: 9.5.4
- **@typescript-eslint/parser**: 5.62.0

### Base de Datos
- **better-sqlite3**: 12.5.0
- **@types/better-sqlite3**: 7.6.13

### Build Tools
- **webpack** (via @electron-forge/plugin-webpack)
- **css-loader**: 6.11.0
- **style-loader**: 3.3.4

### Python Dependencies
- **groq**: latest compatible
- **ffmpeg-python**: latest compatible

## Cómo verificar las versiones

```bash
# Verificar Node y npm
node --version
npm --version

# Verificar Python
python3 --version

# Verificar dependencias instaladas
npm list --depth=0

# Verificar dependencias Python
pip3 list | grep -E "groq|ffmpeg"
```

## Qué hacer si algo se rompe

### Si npm actualizó paquetes accidentalmente

```bash
# 1. Restaurar desde git
git checkout package.json package-lock.json

# 2. Limpiar node_modules
rm -rf node_modules

# 3. Reinstalar con versiones exactas
npm ci
```

### Si el proyecto no funciona en otra máquina

1. Verificar versiones de Node/npm
2. Usar `npm ci` en lugar de `npm install`
3. Verificar que Python 3 esté instalado
4. Instalar dependencias Python: `pip3 install groq ffmpeg-python`
5. Verificar que ffmpeg esté instalado: `ffmpeg -version`

## Actualización Controlada de Dependencias

Solo actualizar cuando sea **absolutamente necesario** (vulnerabilidades críticas, bugs bloqueantes).

### Proceso de actualización segura

1. **Crear rama de prueba**
   ```bash
   git checkout -b test-dependency-update
   ```

2. **Actualizar UNA dependencia a la vez**
   ```bash
   npm install --save-exact <package>@<nueva-version>
   ```

3. **Probar exhaustivamente**
   ```bash
   npm start
   # Probar todas las funcionalidades
   ```

4. **Si funciona, commitear**
   ```bash
   git add package.json package-lock.json
   git commit -m "Update <package> to <version>"
   ```

5. **Si falla, revertir**
   ```bash
   git checkout package.json package-lock.json
   npm ci
   ```

## Archivos Críticos (SIEMPRE en git)

✅ **DEBEN estar en el repositorio:**
- `package.json` - Versiones exactas
- `package-lock.json` - Árbol completo de dependencias
- `.npmrc` - Configuración de npm
- `DEPLOYMENT.md` - Guía de instalación
- `VERSION-LOCK.md` - Este archivo

❌ **NO deben estar en el repositorio:**
- `node_modules/` - Carpeta de dependencias (muy pesada)
- `.webpack/` - Build temporal
- `out/` - Builds compilados
- `*.db` - Bases de datos locales

## Compatibilidad entre versiones

### Electron 39.x
- Requiere Node >= 18
- Compatible con React 18 y 19
- Compatible con TypeScript 4.5+

### React 19.x
- Breaking changes desde React 18
- No usar hooks antiguos
- Usar `react-dom/client` para rendering

### Better-sqlite3 12.x
- Requiere Node >= 18
- Cambios en la API desde v11
- Mejor rendimiento que v11

## Registro de Cambios

| Fecha | Versión | Cambio | Razón |
|-------|---------|--------|-------|
| 2024-12-02 | 1.0.0 | Versiones iniciales bloqueadas | Setup inicial |

## Contacto

Si necesitas actualizar dependencias o tienes problemas con versiones, documenta:
1. Qué dependencia necesita actualización
2. Por qué (bug, vulnerabilidad, feature necesaria)
3. A qué versión específica
4. Qué pruebas realizaste

## Recursos

- [npm-ci documentation](https://docs.npmjs.com/cli/v9/commands/npm-ci)
- [Package.json dependencies](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#dependencies)
- [Electron versioning](https://www.electronjs.org/docs/latest/tutorial/electron-versioning)
- [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
