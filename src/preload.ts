import { contextBridge, ipcRenderer } from 'electron';

// Exponer API segura para el renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Control de ventana
  closeWindow: () => ipcRenderer.send('window-close'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),

  // API Key
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: (apiKey: string) => ipcRenderer.invoke('save-api-key', apiKey),

  // Transcripción
  transcribeAudio: async (audioBlob: Blob, apiKey: string) => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return ipcRenderer.invoke('transcribe-audio', buffer, apiKey);
  },

  // File dialog y transcripción de archivos
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  transcribeFile: (filePath: string, apiKey: string) => ipcRenderer.invoke('transcribe-file', filePath, apiKey),

  // Historial
  saveTranscription: (data: any) => ipcRenderer.invoke('save-transcription', data),
  getHistory: () => ipcRenderer.invoke('get-history'),
});
