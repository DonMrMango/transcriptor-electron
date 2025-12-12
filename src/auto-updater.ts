import { autoUpdater } from 'electron-updater';
import { dialog, BrowserWindow } from 'electron';
import log from 'electron-log';

// Configure logging
autoUpdater.logger = log;
log.transports.file.level = 'info';

export function setupAutoUpdater(mainWindow: BrowserWindow | null) {
  // Disable auto-download (we'll prompt user first)
  autoUpdater.autoDownload = false;

  // Check for updates on startup (after 3 seconds)
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);

  // Check for updates every hour
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);

    if (!mainWindow) return;

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización Disponible',
      message: `Una nueva versión (${info.version}) está disponible.`,
      detail: '¿Deseas descargar e instalar la actualización ahora?',
      buttons: ['Descargar', 'Más Tarde'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();

        if (mainWindow) {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Descargando',
            message: 'Descargando actualización...',
            detail: 'Te notificaremos cuando esté lista.',
            buttons: ['OK']
          });
        }
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    log.info('No updates available');
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
    logMessage += ` (${progressObj.transferred}/${progressObj.total})`;
    log.info(logMessage);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);

    if (!mainWindow) return;

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización Lista',
      message: 'La actualización ha sido descargada.',
      detail: 'La aplicación se reiniciará para instalar la actualización.',
      buttons: ['Reiniciar Ahora', 'Más Tarde'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        // Quit and install
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });
}

// Manual check for updates (can be called from menu or UI)
export function checkForUpdatesManually(mainWindow: BrowserWindow | null) {
  autoUpdater.checkForUpdates().then((updateCheckResult) => {
    if (!updateCheckResult || !updateCheckResult.updateInfo) {
      if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Sin Actualizaciones',
          message: 'Ya tienes la última versión instalada.',
          buttons: ['OK']
        });
      }
    }
  }).catch((err) => {
    log.error('Error checking for updates:', err);
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Error',
        message: 'No se pudo verificar actualizaciones.',
        detail: err.message,
        buttons: ['OK']
      });
    }
  });
}
